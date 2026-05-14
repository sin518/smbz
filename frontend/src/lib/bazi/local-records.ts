import type { DemoBaziChart } from "@/lib/bazi/demo";

export type LocalBaziRecord = {
  id: string;
  serverId?: string;
  name: string;
  gender: "male" | "female";
  birthTime: string;
  calendar: "solar" | "lunar" | "pillars";
  location?: string | null;
  useSolarTime: boolean;
  pillars: string;
  chartJson: DemoBaziChart;
  createdAt: string;
  updatedAt: string;
  syncStatus: "pending" | "synced" | "failed";
};

export type LocalBaziRecordInput = Pick<
  LocalBaziRecord,
  "name" | "gender" | "birthTime" | "calendar" | "location" | "useSolarTime" | "chartJson"
>;

const LOCAL_BAZI_RECORDS_KEY = "sm1:bazi-records";
const LOCAL_BAZI_LAST_SYNC_KEY = "sm1:bazi-records-last-sync-date";
const DAILY_SYNC_HOUR = 3;
const DAILY_SYNC_MINUTE = 30;

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number;
};

export function saveLocalBaziRecord(input: LocalBaziRecordInput) {
  const now = new Date().toISOString();
  const record: LocalBaziRecord = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: input.name.trim() || "未命名",
    gender: input.gender,
    birthTime: input.birthTime,
    calendar: input.calendar,
    location: input.location,
    useSolarTime: input.useSolarTime,
    chartJson: input.chartJson,
    pillars: extractPillars(input.chartJson),
    createdAt: now,
    updatedAt: now,
    syncStatus: "pending"
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
  return getLocalBaziRecords().find((record) => record.id === id || record.serverId === id) ?? null;
}

export function deleteLocalBaziRecord(id: string) {
  const nextRecords = getLocalBaziRecords().filter((record) => record.id !== id && record.serverId !== id);
  writeRecords(nextRecords);
  return nextRecords;
}

export function scheduleDailyBaziRecordSync() {
  if (typeof window === "undefined" || !shouldSyncToday()) {
    return;
  }

  const idleWindow = window as IdleWindow;
  const runSync = () => {
    void syncPendingBaziRecords();
  };

  if (idleWindow.requestIdleCallback) {
    idleWindow.requestIdleCallback(runSync, { timeout: 3000 });
    return;
  }

  window.setTimeout(runSync, 1200);
}

export async function syncPendingBaziRecords(force = false) {
  if (typeof window === "undefined") {
    return [];
  }

  if (!force && !shouldSyncToday()) {
    return getLocalBaziRecords();
  }

  const records = getLocalBaziRecords();
  const pendingRecords = records.filter((record) => record.syncStatus !== "synced");

  if (pendingRecords.length === 0) {
    markSyncedToday();
    return records;
  }

  let changed = false;
  const nextRecords = [...records];

  for (const record of pendingRecords) {
    try {
      const response = await fetchWithTimeout("/api/bazi/charts", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: record.name,
          gender: record.gender,
          birthTime: record.birthTime,
          calendar: record.calendar,
          location: record.location,
          useSolarTime: record.useSolarTime,
          chartJson: record.chartJson
        })
      });

      if (!response.ok) {
        markRecordFailed(nextRecords, record.id);
        changed = true;
        continue;
      }

      const data = (await response.json()) as { chart?: { id?: string; updatedAt?: string } };
      markRecordSynced(nextRecords, record.id, data.chart?.id, data.chart?.updatedAt);
      changed = true;
    } catch {
      markRecordFailed(nextRecords, record.id);
      changed = true;
    }
  }

  if (changed) {
    writeRecords(nextRecords);
  }

  markSyncedToday();
  return getLocalBaziRecords();
}

function shouldSyncToday() {
  const now = new Date();
  const today = toDateKey(now);
  const lastSyncDate = window.localStorage.getItem(LOCAL_BAZI_LAST_SYNC_KEY);

  if (lastSyncDate === today) {
    return false;
  }

  return now.getHours() > DAILY_SYNC_HOUR || (now.getHours() === DAILY_SYNC_HOUR && now.getMinutes() >= DAILY_SYNC_MINUTE);
}

function markSyncedToday() {
  window.localStorage.setItem(LOCAL_BAZI_LAST_SYNC_KEY, toDateKey(new Date()));
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
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
