import type { DemoBaziChart } from "@/lib/bazi/demo";

export type LocalBaziRecord = {
  id: string;
  serverId?: string;
  name: string;
  gender: "male" | "female";
  birthTime: string;
  calendar: "solar" | "lunar" | "pillars";
  location?: string | null;
  longitude?: number | null;
  latitude?: number | null;
  useSolarTime: boolean;
  pillars: string;
  chartJson: DemoBaziChart;
  createdAt: string;
  updatedAt: string;
  syncStatus: "pending" | "synced" | "failed";
  origin?: "record" | "profile";
};

export type LocalBaziRecordInput = Pick<
  LocalBaziRecord,
  "name" | "gender" | "birthTime" | "calendar" | "location" | "longitude" | "latitude" | "useSolarTime" | "chartJson"
>;

const LOCAL_BAZI_RECORDS_KEY = "sm1:bazi-records";
const LOCAL_BAZI_LAST_SYNC_KEY = "sm1:bazi-records-last-sync-at";
const SHARED_PROFILE_CACHE_KEY = "sm1:shared-profiles";
const AUTO_SYNC_INTERVAL_MS = 10 * 60 * 1000;

let autoSyncStarted = false;
let autoSyncTimer: number | undefined;
let syncInFlight = false;

type SharedProfileValue = {
  id?: string;
  source: string;
  name: string;
  gender: "male" | "female";
  dateTime: string;
  location?: string;
};

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number;
};

function runScheduledSync() {
  void syncPendingBaziRecords();
}

export function saveLocalBaziRecord(input: LocalBaziRecordInput) {
  const now = new Date().toISOString();
  const record: LocalBaziRecord = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: input.name.trim() || "未命名",
    gender: input.gender,
    birthTime: input.birthTime,
    calendar: input.calendar,
    location: input.location,
    longitude: input.longitude,
    latitude: input.latitude,
    useSolarTime: input.useSolarTime,
    chartJson: input.chartJson,
    pillars: extractPillars(input.chartJson),
    createdAt: now,
    updatedAt: now,
    syncStatus: "pending",
    origin: "record"
  };
  const nextRecords = [record, ...getLocalBaziRecords()].slice(0, 80);

  writeRecords(nextRecords);
  return record;
}

export function getLocalBaziRecords() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_BAZI_RECORDS_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isLocalBaziRecord).sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
  } catch {
    return [];
  }
}

export function getLocalBaziRecord(id: string) {
  return getUnifiedBaziRecords().find((record) => record.id === id || record.serverId === id) ?? null;
}

export function deleteLocalBaziRecord(id: string) {
  const nextRecords = getLocalBaziRecords().filter((record) => record.id !== id && record.serverId !== id);
  writeRecords(nextRecords);
  return nextRecords;
}

export function getUnifiedBaziRecords() {
  const localRecords = getLocalBaziRecords();

  return localRecords.sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
}

export function deleteUnifiedBaziRecord(id: string) {
  const deletedLocalRecord = getLocalBaziRecords().find((record) => record.id === id || record.serverId === id);
  deleteLocalBaziRecord(id);
  deleteSharedProfileByRecordId(id, deletedLocalRecord);
  return getUnifiedBaziRecords().filter((record) => record.id !== id && record.serverId !== id);
}

export async function deleteUnifiedBaziRecordWithRemote(id: string) {
  const deletedLocalRecord = getLocalBaziRecords().find((record) => record.id === id || record.serverId === id);
  const remoteId = deletedLocalRecord?.serverId ?? (deletedLocalRecord?.syncStatus === "synced" ? deletedLocalRecord.id : undefined);

  if (remoteId) {
    const response = await fetchWithTimeout(`/api/bazi/charts/${encodeURIComponent(remoteId)}`, {
      method: "DELETE",
      credentials: "include"
    });

    if (!response.ok && response.status !== 404) {
      throw new Error("云端删除失败");
    }
  }

  deleteLocalBaziRecord(id);
  deleteSharedProfileByRecordId(id, deletedLocalRecord);
  return getUnifiedBaziRecords().filter((record) => record.id !== id && record.serverId !== id);
}

export function scheduleBaziRecordAutoSync() {
  if (typeof window === "undefined") {
    return;
  }

  const idleWindow = window as IdleWindow;

  if (shouldRunScheduledSync() && idleWindow.requestIdleCallback) {
    idleWindow.requestIdleCallback(runScheduledSync, { timeout: 3000 });
  } else if (shouldRunScheduledSync()) {
    window.setTimeout(runScheduledSync, 1200);
  }

  if (autoSyncStarted) {
    return;
  }

  autoSyncStarted = true;
  autoSyncTimer = window.setInterval(runScheduledSync, AUTO_SYNC_INTERVAL_MS);
  window.addEventListener("online", runScheduledSync);
}

export function stopBaziRecordAutoSync() {
  if (typeof window === "undefined") {
    return;
  }

  if (autoSyncTimer !== undefined) {
    window.clearInterval(autoSyncTimer);
    autoSyncTimer = undefined;
  }

  autoSyncStarted = false;
  window.removeEventListener("online", runScheduledSync);
}

export async function syncPendingBaziRecords(force = false) {
  if (typeof window === "undefined") {
    return [];
  }

  if (syncInFlight) {
    return getLocalBaziRecords();
  }

  if (!force && !shouldRunScheduledSync()) {
    return getLocalBaziRecords();
  }

  syncInFlight = true;
  const records = getLocalBaziRecords();
  const pendingRecords = records.filter((record) => record.syncStatus !== "synced");

  if (pendingRecords.length === 0) {
    markScheduledSyncChecked();
    syncInFlight = false;
    return records;
  }

  let changed = false;
  const nextRecords = [...records];

  try {
    for (const record of pendingRecords) {
      try {
        const response = await fetchWithTimeout("/api/sync/bazi", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            localId: record.id,
            name: record.name,
            gender: record.gender,
            birthTime: record.birthTime,
            calendar: record.calendar,
            location: record.location,
            longitude: record.longitude,
            latitude: record.latitude,
            useSolarTime: record.useSolarTime,
            chartJson: record.chartJson
          })
        });

        if (!response.ok) {
          markRecordFailed(nextRecords, record.id);
          changed = true;
          continue;
        }

        const data = (await response.json()) as { serverId?: string; syncedAt?: string; cached?: boolean };
        markRecordSynced(nextRecords, record.id, data.serverId, data.syncedAt);
        changed = true;
      } catch {
        markRecordFailed(nextRecords, record.id);
        changed = true;
      }
    }

    if (changed) {
      writeRecords(nextRecords);
    }

    markScheduledSyncChecked();
    return getLocalBaziRecords();
  } finally {
    syncInFlight = false;
  }
}

function shouldRunScheduledSync() {
  const lastSyncAt = Number(window.localStorage.getItem(LOCAL_BAZI_LAST_SYNC_KEY) ?? "0");

  if (!Number.isFinite(lastSyncAt) || lastSyncAt <= 0) {
    return true;
  }

  return Date.now() - lastSyncAt >= AUTO_SYNC_INTERVAL_MS;
}

function markScheduledSyncChecked() {
  window.localStorage.setItem(LOCAL_BAZI_LAST_SYNC_KEY, String(Date.now()));
}

function writeRecords(records: LocalBaziRecord[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LOCAL_BAZI_RECORDS_KEY, JSON.stringify(records));
}

function markRecordSynced(records: LocalBaziRecord[], id: string, serverId?: string, updatedAt?: string) {
  const index = records.findIndex((record) => record.id === id);
  if (index < 0) {
    return;
  }

  records[index] = {
    ...records[index],
    serverId: serverId ?? records[index].serverId,
    updatedAt: updatedAt ?? new Date().toISOString(),
    syncStatus: "synced"
  };
}

function markRecordFailed(records: LocalBaziRecord[], id: string) {
  const index = records.findIndex((record) => record.id === id);
  if (index < 0) {
    return;
  }

  records[index] = {
    ...records[index],
    updatedAt: new Date().toISOString(),
    syncStatus: "failed"
  };
}

function extractPillars(chart: DemoBaziChart) {
  return chart.columns.map((column) => `${column.pillar.stem}${column.pillar.branch}`).join(" ");
}

function deleteSharedProfileByRecordId(id: string, localRecord?: LocalBaziRecord) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const raw = window.localStorage.getItem(SHARED_PROFILE_CACHE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];

    if (!Array.isArray(parsed)) {
      return;
    }

    const nextProfiles = parsed.filter((item) => {
      if (!isSharedProfileValue(item)) {
        return false;
      }

      if (item.id === id) {
        return false;
      }

      if (!localRecord) {
        return true;
      }

      return getProfileIdentityKey(item) !== getRecordIdentityKey(localRecord);
    });

    window.localStorage.setItem(SHARED_PROFILE_CACHE_KEY, JSON.stringify(nextProfiles));
  } catch {
    // Ignore malformed profile cache when deleting a record.
  }
}

function getRecordIdentityKey(record: Pick<LocalBaziRecord, "name" | "gender" | "birthTime">) {
  return `${record.name}-${record.gender}-${record.birthTime}`;
}

function getProfileIdentityKey(profile: SharedProfileValue) {
  return `${profile.name}-${profile.gender}-${profile.dateTime}`;
}

function isSharedProfileValue(value: unknown): value is SharedProfileValue {
  if (!value || typeof value !== "object") {
    return false;
  }

  const profile = value as Record<string, unknown>;

  return (
    typeof profile.source === "string" &&
    typeof profile.name === "string" &&
    (profile.gender === "male" || profile.gender === "female") &&
    typeof profile.dateTime === "string"
  );
}

function isLocalBaziRecord(value: unknown): value is LocalBaziRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record.id === "string" &&
    typeof record.name === "string" &&
    (record.gender === "male" || record.gender === "female") &&
    typeof record.birthTime === "string" &&
    (record.calendar === "solar" || record.calendar === "lunar" || record.calendar === "pillars") &&
    typeof record.useSolarTime === "boolean" &&
    typeof record.pillars === "string" &&
    typeof record.createdAt === "string" &&
    typeof record.updatedAt === "string" &&
    (record.syncStatus === "pending" || record.syncStatus === "synced" || record.syncStatus === "failed") &&
    Boolean(record.chartJson)
  );
}

function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit, timeoutMs = 5000) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  return fetch(input, {
    ...init,
    signal: controller.signal
  }).finally(() => window.clearTimeout(timeout));
}
