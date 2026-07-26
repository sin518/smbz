import type { DaliurenOutput } from "taibu-core/daliuren";
import type { QimenOutput } from "taibu-core/qimen";
import type { LiuyaoStoredCasting, LiuyaoStoredInput } from "@/lib/liuyao/chart";
import { buildRecordIdentity, type RecordIdentityInput } from "@/lib/records/record-identity";
import {
  getBrowserRecordStore,
  getCurrentRecordScope,
  type StoredPanRecord
} from "@/lib/records/record-store";
import type { ZiweiChart } from "@/lib/ziwei/calculate";

export type LocalDivinationRecordType = "liuyao" | "qimen" | "ziwei" | "daliuren";

export type LocalDivinationRecord = {
  id: string;
  type: LocalDivinationRecordType;
  recordKey: string;
  identityVersion: number;
  calculationVersion: number;
  lifecycleVersion: number;
  question: string;
  summary: string;
  detail: string;
  createdAt: string;
  updatedAt: string;
  sourceSavedAt: string;
  payload: unknown;
  syncStatus: "pending" | "synced" | "failed";
  serverId?: string;
  origin?: "local" | "cloud";
  payloadState?: "summary" | "full";
};

export type LocalQimenRecordPayload = {
  input?: {
    question?: string;
    dateTime?: string;
    birthYear?: number;
    plateType?: string;
    juMethod?: string;
    zhiFuJiGong?: string;
    manualDunType?: string;
    manualJu?: number;
    juMode?: string;
  };
  chart: QimenOutput;
  savedAt: string;
};

export type LocalLiuyaoRecordPayload = {
  input?: LiuyaoStoredInput;
  casting?: LiuyaoStoredCasting;
};

export type LocalZiweiRecordPayload = {
  profile: {
    name?: string;
    gender: "male" | "female";
    birthTime: string;
    location?: string;
    savedAt: string;
  };
  chart: ZiweiChart;
};

export type LocalDaliurenRecordPayload = {
  input: {
    question: string;
    dateTime: string;
    birthYear: number;
    gender: "male" | "female";
  };
  savedAt: string;
  chart: DaliurenOutput;
  canonicalText: string;
};

type DivinationSummary = {
  question: string;
  summary: string;
  detail: string;
  sourceSavedAt: string;
  payloadState: "summary" | "full";
};

const CALCULATION_VERSION = 1;
const CLOUD_SYNC_TIMEOUT_MS = 25000;
const RETRY_DELAY_MS = 10 * 60 * 1000;

export async function saveLocalQimenRecord(payload: LocalQimenRecordPayload) {
  const question = payload.input?.question?.trim() || payload.chart.question?.trim() || "未填写占事";
  const createdAt = payload.savedAt || new Date().toISOString();
  return saveLocalDivinationRecord({
    type: "qimen",
    question,
    summary: "奇门遁甲",
    detail: `${payload.chart.dateInfo.solarDate} · ${payload.chart.dateInfo.solarTerm}${payload.chart.yuan}`,
    createdAt,
    sourceSavedAt: createdAt,
    payload,
    identityInput: {
      type: "qimen",
      question,
      dateTime: payload.input?.dateTime ?? createdAt,
      birthYear: payload.input?.birthYear,
      plateType: payload.input?.plateType,
      juMethod: payload.input?.juMethod,
      zhiFuJiGong: payload.input?.zhiFuJiGong,
      manualDunType: payload.input?.manualDunType,
      manualJu: payload.input?.manualJu,
      juMode: payload.input?.juMode
    }
  });
}

export async function saveLocalLiuyaoRecord(payload: LocalLiuyaoRecordPayload) {
  const input = payload.input?.input;
  const question = input?.question?.trim() || "未填写占事";
  const createdAt = payload.casting?.completedAt || payload.input?.savedAt || new Date().toISOString();
  const lines = [...(payload.casting?.lines ?? [])].sort((left, right) => left.position - right.position);
  return saveLocalDivinationRecord({
    type: "liuyao",
    question,
    summary: "六爻断事",
    detail: `${formatCastingMethod(input?.castingMethod)} · ${formatDateTime(input?.castingTime)}`,
    createdAt,
    sourceSavedAt: `${payload.input?.savedAt || ""}-${payload.casting?.completedAt || ""}`,
    payload,
    identityInput: {
      type: "liuyao",
      question,
      completedAt: createdAt,
      castingTime: input?.castingTime,
      castingMethod: input?.castingMethod,
      lineTotals: lines.map((line) => line.total)
    }
  });
}

export async function saveLocalZiweiRecord(payload: LocalZiweiRecordPayload) {
  const createdAt = payload.profile.savedAt || new Date().toISOString();
  const name = payload.profile.name?.trim() || "未填写姓名";
  return saveLocalDivinationRecord({
    type: "ziwei",
    question: name,
    summary: "紫微斗数",
    detail: `${payload.chart.profile.solarText} · ${payload.chart.profile.location}`,
    createdAt,
    sourceSavedAt: createdAt,
    payload,
    identityInput: {
      type: "ziwei",
      name,
      gender: payload.profile.gender,
      birthTime: payload.profile.birthTime,
      locationKey: payload.profile.location
    }
  });
}

export async function saveLocalDaliurenRecord(payload: LocalDaliurenRecordPayload) {
  const createdAt = payload.savedAt || new Date().toISOString();
  const question = payload.input.question.trim() || "未填写占事";
  return saveLocalDivinationRecord({
    type: "daliuren",
    question,
    summary: "大六壬",
    detail: `${payload.chart.keName} · ${payload.chart.dateInfo.solarDate}`,
    createdAt,
    sourceSavedAt: createdAt,
    payload,
    identityInput: {
      type: "daliuren",
      question,
      dateTime: payload.input.dateTime,
      birthYear: payload.input.birthYear,
      gender: payload.input.gender
    }
  });
}

export async function getLocalDivinationRecords() {
  const records = await getBrowserRecordStore().list(getCurrentRecordScope());
  return records.filter((record) => record.type !== "bazi").map(toLocalRecord);
}

export async function deleteLocalDivinationRecord(id: string) {
  return getBrowserRecordStore().markDeleted(getCurrentRecordScope(), id);
}

export async function deleteLocalDivinationRecords(ids: Iterable<string>) {
  await Promise.all(
    Array.from(ids, (id) => getBrowserRecordStore().markDeleted(getCurrentRecordScope(), id))
  );
  return getLocalDivinationRecords();
}

export async function fetchCloudDivinationRecords(): Promise<LocalDivinationRecord[]> {
  const response = await fetchWithTimeout(
    "/api/sync/records",
    { method: "GET", credentials: "include" },
    CLOUD_SYNC_TIMEOUT_MS
  );
  if (response.status === 401) {
    return [];
  }
  if (!response.ok) {
    throw new Error("云端占术记录读取失败");
  }

  const data = (await response.json()) as { records?: CloudDivinationRecord[] };
  const mappedRecords = await Promise.all(
    (data.records ?? []).filter(isCloudDivinationRecord).map((record) => toCloudRecord(record, "summary"))
  );
  const records = consolidateCloudDivinationRecords(mappedRecords);
  await Promise.all(
    records.map((record) =>
      getBrowserRecordStore().cacheRemote({
        id: record.id,
        scope: getCurrentRecordScope(),
        type: record.type,
        recordKey: record.recordKey,
        identityVersion: record.identityVersion,
        calculationVersion: record.calculationVersion,
        lifecycleVersion: record.lifecycleVersion,
        summary: {
          question: record.question,
          summary: record.summary,
          detail: record.detail,
          sourceSavedAt: record.sourceSavedAt,
          payloadState: "summary"
        },
        payload: record.payload,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        serverId: record.serverId!,
        syncStatus: "synced",
        origin: "cloud"
      })
    )
  );
  return records;
}

export async function fetchCloudDivinationRecord(serverId: string) {
  const response = await fetchWithTimeout(
    `/api/sync/records/${encodeURIComponent(serverId)}`,
    { method: "GET", credentials: "include" },
    CLOUD_SYNC_TIMEOUT_MS
  );
  if (!response.ok) {
    throw new Error(response.status === 404 ? "云端记录已不存在" : "云端记录详情读取失败");
  }
  const raw = (await response.json()) as unknown;
  if (!isCloudDivinationRecord(raw)) {
    throw new Error("云端记录详情格式无效");
  }
  const record = await toCloudRecord(raw, "full");
  await getBrowserRecordStore().cacheRemote({
    id: record.id,
    scope: getCurrentRecordScope(),
    type: record.type,
    recordKey: record.recordKey,
    identityVersion: record.identityVersion,
    calculationVersion: record.calculationVersion,
    lifecycleVersion: record.lifecycleVersion,
    summary: {
      question: record.question,
      summary: record.summary,
      detail: record.detail,
      sourceSavedAt: record.sourceSavedAt,
      payloadState: "full"
    },
    payload: record.payload,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    serverId: record.serverId!,
    syncStatus: "synced",
    origin: "cloud",
    replaceEqual: true
  });
  return record;
}

export async function deleteDivinationRecordWithRemote(record: LocalDivinationRecord) {
  if (record.serverId) {
    const response = await fetchWithTimeout(
      `/api/sync/records/${encodeURIComponent(record.serverId)}`,
      { method: "DELETE", credentials: "include" },
      CLOUD_SYNC_TIMEOUT_MS
    );
    if (!response.ok && response.status !== 404) {
      throw new Error("云端删除失败");
    }
  }
  await deleteLocalDivinationRecord(record.id);
}

export function restoreLocalDivinationRecord(record: LocalDivinationRecord) {
  if (typeof window === "undefined") {
    return;
  }
  if (record.type === "qimen" && isLocalQimenRecordPayload(record.payload)) {
    window.localStorage.setItem("sm1:current-qimen-result", JSON.stringify(record.payload));
    return;
  }
  if (record.type === "liuyao" && isLocalLiuyaoRecordPayload(record.payload)) {
    if (record.payload.input) {
      window.localStorage.setItem("sm1:current-liuyao-input", JSON.stringify(record.payload.input));
    }
    if (record.payload.casting) {
      window.localStorage.setItem("sm1:current-liuyao-casting", JSON.stringify(record.payload.casting));
    }
    return;
  }
  if (record.type === "ziwei" && isLocalZiweiRecordPayload(record.payload)) {
    window.localStorage.setItem("sm1:current-ziwei-profile", JSON.stringify(record.payload.profile));
    return;
  }
  if (record.type === "daliuren" && isLocalDaliurenRecordPayload(record.payload)) {
    window.localStorage.setItem(
      "sm1:current-daliuren-input",
      JSON.stringify({ input: record.payload.input, savedAt: record.payload.savedAt })
    );
  }
}

export async function syncDivinationToCloud(
  record: LocalDivinationRecord,
  submissionMode: "background" | "explicit" = "background"
) {
  try {
    const response = await fetchWithTimeout(
      `/api/sync/${record.type}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          localId: record.id,
          recordKey: record.recordKey,
          identityVersion: record.identityVersion,
          calculationVersion: record.calculationVersion,
          lifecycleVersion: record.lifecycleVersion,
          submissionMode,
          question: record.question,
          summary: record.summary,
          detail: record.detail,
          payload: record.payload,
          createdAt: record.createdAt
        })
      },
      CLOUD_SYNC_TIMEOUT_MS
    );
    if (!response.ok) {
      await getBrowserRecordStore().markFailed(getCurrentRecordScope(), record.id);
      scheduleRetry(record);
      return false;
    }
    const result = (await response.json()) as SyncResponse;
    await getBrowserRecordStore().markSynced(getCurrentRecordScope(), record.id, {
      serverId: result.serverId,
      syncedAt: result.syncedAt,
      recordKey: result.recordKey,
      identityVersion: result.identityVersion,
      calculationVersion: result.calculationVersion,
      lifecycleVersion: result.lifecycleVersion
    });
    return true;
  } catch {
    await getBrowserRecordStore().markFailed(getCurrentRecordScope(), record.id);
    scheduleRetry(record);
    return false;
  }
}

export async function syncAllPendingRecords(): Promise<{ success: number; failed: number }> {
  const records = (await getLocalDivinationRecords()).filter((record) => record.syncStatus !== "synced");
  let success = 0;
  for (const record of records) {
    if (await syncDivinationToCloud(record)) {
      success += 1;
    }
  }
  return { success, failed: records.length - success };
}

async function saveLocalDivinationRecord(input: {
  type: LocalDivinationRecordType;
  question: string;
  summary: string;
  detail: string;
  createdAt: string;
  sourceSavedAt: string;
  payload: unknown;
  identityInput: RecordIdentityInput;
}) {
  const identity = await buildRecordIdentity(input.identityInput);
  const stored = await getBrowserRecordStore().upsert({
    scope: getCurrentRecordScope(),
    type: input.type,
    recordKey: identity.recordKey,
    identityVersion: identity.identityVersion,
    calculationVersion: CALCULATION_VERSION,
    summary: {
      question: input.question,
      summary: input.summary,
      detail: input.detail,
      sourceSavedAt: input.sourceSavedAt,
      payloadState: "full"
    },
    payload: input.payload,
    createdAt: input.createdAt,
    submissionMode: "explicit",
    origin: "local"
  });
  const record = toLocalRecord(stored);
  void syncDivinationToCloud(record, "explicit");
  return record;
}

function toLocalRecord(record: StoredPanRecord): LocalDivinationRecord {
  const summary = record.summary as DivinationSummary;
  return {
    id: record.id,
    serverId: record.serverId,
    type: record.type as LocalDivinationRecordType,
    recordKey: record.recordKey,
    identityVersion: record.identityVersion,
    calculationVersion: record.calculationVersion,
    lifecycleVersion: record.lifecycleVersion,
    question: summary.question,
    summary: summary.summary,
    detail: summary.detail,
    sourceSavedAt: summary.sourceSavedAt,
    payload: record.payload,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    syncStatus: record.syncStatus,
    origin: record.origin === "cloud" ? "cloud" : "local",
    payloadState: summary.payloadState ?? "full"
  };
}

async function toCloudRecord(
  record: CloudDivinationRecord,
  payloadState: "summary" | "full"
): Promise<LocalDivinationRecord> {
  const identity = record.recordKey
    ? null
    : await buildRecordIdentity(
        identityInputFromPayload(record.type, record.payload, record.question, record.createdAt)
      );
  return {
    id: record.localId,
    serverId: record.id,
    type: record.type,
    recordKey: record.recordKey ?? identity!.recordKey,
    identityVersion: record.identityVersion ?? identity?.identityVersion ?? 1,
    calculationVersion: record.calculationVersion ?? 1,
    lifecycleVersion: record.lifecycleVersion ?? 1,
    question: record.question,
    summary: record.summary,
    detail: record.detail,
    payload: record.payload,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    sourceSavedAt: getSourceSavedAt(record.payload, record.localId),
    syncStatus: "synced",
    origin: "cloud",
    payloadState
  };
}

function scheduleRetry(record: LocalDivinationRecord) {
  if (typeof window !== "undefined") {
    window.setTimeout(() => void syncDivinationToCloud(record), RETRY_DELAY_MS);
  }
}

function identityInputFromPayload(
  type: LocalDivinationRecordType,
  payload: Record<string, unknown>,
  question: string,
  createdAt: string
): RecordIdentityInput {
  if (type === "qimen") {
    const input = objectOr(payload.input);
    return {
      type,
      question: stringOr(input.question, question),
      dateTime: stringOr(input.dateTime, createdAt),
      birthYear: numberOrNull(input.birthYear),
      plateType: stringOrNull(input.plateType),
      juMethod: stringOrNull(input.juMethod),
      zhiFuJiGong: stringOrNull(input.zhiFuJiGong),
      manualDunType: stringOrNull(input.manualDunType),
      manualJu: numberOrNull(input.manualJu),
      juMode: stringOrNull(input.juMode)
    };
  }
  if (type === "ziwei") {
    const profile = objectOr(payload.profile);
    return {
      type,
      name: stringOr(profile.name, question),
      gender: profile.gender === "female" ? "female" : "male",
      birthTime: stringOr(profile.birthTime, createdAt),
      locationKey: stringOrNull(profile.location)
    };
  }
  if (type === "daliuren") {
    const input = objectOr(payload.input);
    return {
      type,
      question: stringOr(input.question, question),
      dateTime: stringOr(input.dateTime, createdAt),
      birthYear:
        typeof input.birthYear === "number" ? input.birthYear : new Date(createdAt).getFullYear(),
      gender: input.gender === "female" ? "female" : "male"
    };
  }
  const storedInput = objectOr(payload.input);
  const input = objectOr(storedInput.input);
  const casting = objectOr(payload.casting);
  const lines = Array.isArray(casting.lines)
    ? casting.lines
        .filter(isObject)
        .sort((left, right) => Number(left.position ?? 0) - Number(right.position ?? 0))
    : [];
  return {
    type,
    question: stringOr(input.question, question),
    completedAt: stringOr(casting.completedAt, stringOr(storedInput.savedAt, createdAt)),
    castingTime: stringOrNull(input.castingTime),
    castingMethod: stringOrNull(input.castingMethod),
    lineTotals: lines.map((line) => Number(line.total ?? 0))
  };
}

function consolidateCloudDivinationRecords(records: LocalDivinationRecord[]) {
  const byIdentity = new Map<string, LocalDivinationRecord>();
  for (const record of records) {
    const current = byIdentity.get(record.recordKey);
    if (!current) {
      byIdentity.set(record.recordKey, record);
      continue;
    }
    const newest = Date.parse(record.updatedAt) > Date.parse(current.updatedAt) ? record : current;
    byIdentity.set(record.recordKey, {
      ...newest,
      createdAt:
        Date.parse(record.createdAt) < Date.parse(current.createdAt)
          ? record.createdAt
          : current.createdAt
    });
  }
  return Array.from(byIdentity.values());
}

function formatCastingMethod(value: string | undefined) {
  const labels: Record<string, string> = {
    shake: "摇卦",
    number: "报数",
    manual: "指定",
    time: "时间",
    text: "汉字"
  };
  return value ? labels[value] ?? value : "起卦方式未知";
}

function formatDateTime(value: string | undefined) {
  return value ? value.replace("T", " ") : "时间未知";
}

function isLocalQimenRecordPayload(value: unknown): value is LocalQimenRecordPayload {
  return isObject(value) && Boolean(value.chart) && typeof value.savedAt === "string";
}

function isLocalLiuyaoRecordPayload(value: unknown): value is LocalLiuyaoRecordPayload {
  return isObject(value) && Boolean(value.input || value.casting);
}

function isLocalZiweiRecordPayload(value: unknown): value is LocalZiweiRecordPayload {
  return isObject(value) && Boolean(value.profile && value.chart);
}

function isLocalDaliurenRecordPayload(value: unknown): value is LocalDaliurenRecordPayload {
  return isObject(value) && Boolean(value.input && value.chart && typeof value.savedAt === "string");
}

type CloudDivinationRecord = {
  id: string;
  localId: string;
  type: LocalDivinationRecordType;
  recordKey?: string | null;
  identityVersion?: number | null;
  calculationVersion?: number | null;
  lifecycleVersion?: number;
  question: string;
  summary: string;
  detail: string;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

type SyncResponse = {
  serverId: string;
  syncedAt: string;
  recordKey: string;
  identityVersion: number;
  calculationVersion: number;
  lifecycleVersion: number;
};

function isCloudDivinationRecord(value: unknown): value is CloudDivinationRecord {
  return (
    isObject(value) &&
    typeof value.id === "string" &&
    typeof value.localId === "string" &&
    (value.type === "liuyao" || value.type === "qimen" || value.type === "ziwei" || value.type === "daliuren") &&
    typeof value.question === "string" &&
    typeof value.summary === "string" &&
    typeof value.detail === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string" &&
    isObject(value.payload)
  );
}

function getSourceSavedAt(payload: Record<string, unknown>, fallback: string) {
  if (typeof payload.savedAt === "string") {
    return payload.savedAt;
  }
  const profile = isObject(payload.profile) ? payload.profile : null;
  if (profile && typeof profile.savedAt === "string") {
    return profile.savedAt;
  }
  const input = isObject(payload.input) ? payload.input : null;
  const casting = isObject(payload.casting) ? payload.casting : null;
  const inputSavedAt = input?.savedAt;
  const completedAt = casting?.completedAt;
  if (typeof inputSavedAt === "string" || typeof completedAt === "string") {
    return `${typeof inputSavedAt === "string" ? inputSavedAt : ""}-${typeof completedAt === "string" ? completedAt : ""}`;
  }
  return fallback;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function objectOr(value: unknown) {
  return isObject(value) ? value : {};
}

function stringOr(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

function stringOrNull(value: unknown) {
  return typeof value === "string" && value ? value : null;
}

function numberOrNull(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit, timeoutMs = 5000) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  return fetch(input, { ...init, signal: controller.signal }).finally(() => window.clearTimeout(timeout));
}
