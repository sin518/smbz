export type RecordType = "bazi" | "liuyao" | "qimen" | "ziwei" | "daliuren";
export type RecordScope = `account:${string}` | "guest" | "legacy-unclaimed";
export type RecordSyncStatus = "pending" | "synced" | "failed";

export type StoredPanRecord<TSummary = Record<string, unknown>, TPayload = unknown> = {
  storageId: string;
  id: string;
  scope: RecordScope;
  type: RecordType;
  recordKey: string;
  identityVersion: number;
  calculationVersion: number;
  lifecycleVersion: number;
  summary: TSummary;
  payload: TPayload;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  syncStatus: RecordSyncStatus;
  serverId?: string;
  pinnedOffline?: boolean;
  origin: "local" | "cloud" | "legacy";
};

export type RecordUpsertInput<TSummary = Record<string, unknown>, TPayload = unknown> = {
  id?: string;
  scope: RecordScope;
  type: RecordType;
  recordKey: string;
  identityVersion: number;
  calculationVersion?: number;
  lifecycleVersion?: number;
  summary: TSummary;
  payload: TPayload;
  createdAt?: string;
  submissionMode?: "background" | "explicit";
  serverId?: string;
  syncStatus?: RecordSyncStatus;
  pinnedOffline?: boolean;
  origin?: StoredPanRecord["origin"];
};

export interface RecordStoreAdapter {
  list(scope: RecordScope, options?: { includeDeleted?: boolean }): Promise<StoredPanRecord[]>;
  get(scope: RecordScope, id: string): Promise<StoredPanRecord | null>;
  getByRecordKey(scope: RecordScope, type: RecordType, recordKey: string): Promise<StoredPanRecord | null>;
  put(record: StoredPanRecord): Promise<void>;
  clearScope(scope: RecordScope): Promise<void>;
}

export class RecordLifecycleConflictError extends Error {}

export class PanRecordStore {
  private readonly adapter: RecordStoreAdapter;

  constructor(adapter: RecordStoreAdapter) {
    this.adapter = adapter;
  }

  list(scope: RecordScope, options?: { includeDeleted?: boolean }) {
    return this.adapter.list(scope, options);
  }

  get(scope: RecordScope, id: string) {
    return this.adapter.get(scope, id);
  }

  async cacheRemote<TSummary extends Record<string, unknown>, TPayload>(
    input: Omit<RecordUpsertInput<TSummary, TPayload>, "submissionMode"> & {
      id: string;
      serverId: string;
      updatedAt: string;
      replaceEqual?: boolean;
    }
  ) {
    const existing = await this.adapter.getByRecordKey(input.scope, input.type, input.recordKey);
    if (
      existing &&
      (existing.syncStatus !== "synced" ||
        Date.parse(existing.updatedAt) > Date.parse(input.updatedAt) ||
        (!input.replaceEqual && Date.parse(existing.updatedAt) === Date.parse(input.updatedAt)))
    ) {
      return existing;
    }

    const id = existing?.id ?? input.id;
    const record: StoredPanRecord<TSummary, TPayload> = {
      storageId: toStorageId(input.scope, id),
      id,
      scope: input.scope,
      type: input.type,
      recordKey: input.recordKey,
      identityVersion: input.identityVersion,
      calculationVersion: input.calculationVersion ?? 1,
      lifecycleVersion: input.lifecycleVersion ?? 1,
      summary: input.summary,
      payload: input.payload,
      createdAt: earliestDate(existing?.createdAt, input.createdAt ?? input.updatedAt),
      updatedAt: input.updatedAt,
      syncStatus: "synced",
      serverId: input.serverId,
      pinnedOffline: existing?.pinnedOffline,
      origin: "cloud"
    };
    await this.adapter.put(record);
    return record;
  }

  async upsert<TSummary extends Record<string, unknown>, TPayload>(
    input: RecordUpsertInput<TSummary, TPayload>
  ): Promise<StoredPanRecord<TSummary, TPayload>> {
    const existing = await this.adapter.getByRecordKey(input.scope, input.type, input.recordKey);
    const now = new Date().toISOString();

    if (existing?.deletedAt && input.submissionMode !== "explicit") {
      throw new RecordLifecycleConflictError("该盘局已经删除，后台任务不能自动恢复");
    }

    const lifecycleVersion = existing?.deletedAt
      ? Math.max(input.lifecycleVersion ?? 1, existing.lifecycleVersion + 1)
      : existing?.lifecycleVersion ?? input.lifecycleVersion ?? 1;
    const id = existing?.id ?? input.id ?? createLocalId(input.type);
    const record: StoredPanRecord<TSummary, TPayload> = {
      storageId: toStorageId(input.scope, id),
      id,
      scope: input.scope,
      type: input.type,
      recordKey: input.recordKey,
      identityVersion: input.identityVersion,
      calculationVersion: Math.max(input.calculationVersion ?? 1, existing?.calculationVersion ?? 1),
      lifecycleVersion,
      summary: input.summary,
      payload: input.payload,
      createdAt: existing?.deletedAt ? input.createdAt ?? now : earliestDate(existing?.createdAt, input.createdAt ?? now),
      updatedAt: now,
      syncStatus: input.syncStatus ?? "pending",
      serverId: input.serverId ?? existing?.serverId,
      pinnedOffline: input.pinnedOffline ?? existing?.pinnedOffline,
      origin: input.origin ?? existing?.origin ?? "local"
    };

    await this.adapter.put(record);
    return record;
  }

  async markSynced(
    scope: RecordScope,
    id: string,
    remote: {
      serverId: string;
      syncedAt: string;
      recordKey?: string;
      identityVersion?: number;
      calculationVersion?: number;
      lifecycleVersion?: number;
    }
  ) {
    const existing = await this.adapter.get(scope, id);
    if (!existing) {
      return null;
    }

    const record: StoredPanRecord = {
      ...existing,
      recordKey: remote.recordKey ?? existing.recordKey,
      identityVersion: remote.identityVersion ?? existing.identityVersion,
      calculationVersion: Math.max(remote.calculationVersion ?? 1, existing.calculationVersion),
      lifecycleVersion: remote.lifecycleVersion ?? existing.lifecycleVersion,
      serverId: remote.serverId,
      updatedAt: remote.syncedAt,
      syncStatus: "synced"
    };
    await this.adapter.put(record);
    return record;
  }

  async markFailed(scope: RecordScope, id: string) {
    const existing = await this.adapter.get(scope, id);
    if (!existing) {
      return null;
    }

    const record: StoredPanRecord = { ...existing, syncStatus: "failed" };
    await this.adapter.put(record);
    return record;
  }

  async markDeleted(scope: RecordScope, id: string) {
    const existing = await this.adapter.get(scope, id);
    if (!existing || existing.deletedAt) {
      return existing;
    }

    const now = new Date().toISOString();
    const record: StoredPanRecord = {
      ...existing,
      deletedAt: now,
      updatedAt: now,
      lifecycleVersion: existing.lifecycleVersion + 1,
      syncStatus: "pending"
    };
    await this.adapter.put(record);
    return record;
  }

  clearScope(scope: RecordScope) {
    return this.adapter.clearScope(scope);
  }
}

export class MemoryRecordStoreAdapter implements RecordStoreAdapter {
  private readonly records = new Map<string, StoredPanRecord>();

  async list(scope: RecordScope, options?: { includeDeleted?: boolean }) {
    return Array.from(this.records.values())
      .filter((record) => record.scope === scope && (options?.includeDeleted || !record.deletedAt))
      .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt))
      .map(cloneRecord);
  }

  async get(scope: RecordScope, id: string) {
    const record = this.records.get(toStorageId(scope, id));
    return record ? cloneRecord(record) : null;
  }

  async getByRecordKey(scope: RecordScope, type: RecordType, recordKey: string) {
    const record = Array.from(this.records.values()).find(
      (item) => item.scope === scope && item.type === type && item.recordKey === recordKey
    );
    return record ? cloneRecord(record) : null;
  }

  async put(record: StoredPanRecord) {
    this.records.set(record.storageId, cloneRecord(record));
  }

  async clearScope(scope: RecordScope) {
    for (const [key, record] of this.records.entries()) {
      if (record.scope === scope) {
        this.records.delete(key);
      }
    }
  }
}

const DATABASE_NAME = "sm1-pan-records";
const DATABASE_VERSION = 1;
const STORE_NAME = "records";

export class IndexedDbRecordStoreAdapter implements RecordStoreAdapter {
  private databasePromise: Promise<IDBDatabase> | undefined;

  async list(scope: RecordScope, options?: { includeDeleted?: boolean }) {
    const database = await this.open();
    const records = await requestToPromise<StoredPanRecord[]>(
      database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).index("scope").getAll(scope)
    );
    return records
      .filter((record) => options?.includeDeleted || !record.deletedAt)
      .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt));
  }

  async get(scope: RecordScope, id: string) {
    const database = await this.open();
    const record = await requestToPromise<StoredPanRecord | undefined>(
      database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(toStorageId(scope, id))
    );
    return record ?? null;
  }

  async getByRecordKey(scope: RecordScope, type: RecordType, recordKey: string) {
    const records = await this.list(scope, { includeDeleted: true });
    return records.find((record) => record.type === type && record.recordKey === recordKey) ?? null;
  }

  async put(record: StoredPanRecord) {
    const database = await this.open();
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(record);
    await transactionToPromise(transaction);
  }

  async clearScope(scope: RecordScope) {
    const database = await this.open();
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const index = transaction.objectStore(STORE_NAME).index("scope");
    const keys = await requestToPromise<IDBValidKey[]>(index.getAllKeys(scope));
    const store = transaction.objectStore(STORE_NAME);
    keys.forEach((key) => store.delete(key));
    await transactionToPromise(transaction);
  }

  private open() {
    if (!this.databasePromise) {
      this.databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
        const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
        request.onerror = () => reject(request.error);
        request.onupgradeneeded = () => {
          const database = request.result;
          const store = database.objectStoreNames.contains(STORE_NAME)
            ? request.transaction!.objectStore(STORE_NAME)
            : database.createObjectStore(STORE_NAME, { keyPath: "storageId" });
          if (!store.indexNames.contains("scope")) {
            store.createIndex("scope", "scope", { unique: false });
          }
        };
        request.onsuccess = () => resolve(request.result);
      });
    }
    return this.databasePromise;
  }
}

let browserStore: PanRecordStore | undefined;

export function getBrowserRecordStore() {
  if (typeof window === "undefined" || !window.indexedDB) {
    throw new Error("当前环境不支持 IndexedDB");
  }
  browserStore ??= new PanRecordStore(new IndexedDbRecordStoreAdapter());
  return browserStore;
}

export function getCurrentRecordScope(): RecordScope {
  if (typeof window === "undefined") {
    return "guest";
  }

  try {
    const raw = window.localStorage.getItem("sm1:user");
    const user = raw ? (JSON.parse(raw) as { id?: unknown }) : null;
    return typeof user?.id === "string" && user.id ? `account:${user.id}` : "guest";
  } catch {
    return "guest";
  }
}

function requestToPromise<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionToPromise(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

function createLocalId(type: RecordType) {
  return `local-${type}-${crypto.randomUUID()}`;
}

function toStorageId(scope: RecordScope, id: string) {
  return `${scope}|${id}`;
}

function earliestDate(left: string | undefined, right: string) {
  return left && Date.parse(left) <= Date.parse(right) ? left : right;
}

function cloneRecord<T extends StoredPanRecord>(record: T): T {
  return structuredClone(record);
}
