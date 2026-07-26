import type { DemoBaziChart } from "@/lib/bazi/demo";
import { buildRecordIdentity } from "@/lib/records/record-identity";
import {
  getBrowserRecordStore,
  getCurrentRecordScope,
  type StoredPanRecord
} from "@/lib/records/record-store";

export type LocalBaziRecord = {
  id: string;
  serverId?: string;
  recordKey: string;
  identityVersion: number;
  calculationVersion: number;
  lifecycleVersion: number;
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
  origin?: "record" | "profile" | "cloud";
};

export type LocalBaziRecordInput = Pick<
  LocalBaziRecord,
  "name" | "gender" | "birthTime" | "calendar" | "location" | "longitude" | "latitude" | "useSolarTime" | "chartJson"
>;

export type CloudBaziRecord = Omit<LocalBaziRecord, "chartJson"> & {
  origin: "cloud";
};

type BaziSummary = Omit<
  LocalBaziRecord,
  | "id"
  | "serverId"
  | "recordKey"
  | "identityVersion"
  | "calculationVersion"
  | "lifecycleVersion"
  | "chartJson"
  | "createdAt"
  | "updatedAt"
  | "syncStatus"
  | "origin"
>;

const CALCULATION_VERSION = 1;
const AUTO_SYNC_INTERVAL_MS = 10 * 60 * 1000;
let autoSyncStarted = false;
let autoSyncTimer: number | undefined;
let syncInFlight = false;

export async function saveLocalBaziRecord(input: LocalBaziRecordInput) {
  const identity = await buildRecordIdentity({
    type: "bazi",
    name: input.name,
    gender: input.gender,
    birthTime: input.chartJson.profile.solar || input.birthTime,
    locationKey: input.location,
    longitude: input.longitude,
    latitude: input.latitude,
    useSolarTime: input.useSolarTime
  });
  const record = await getBrowserRecordStore().upsert({
    scope: getCurrentRecordScope(),
    type: "bazi",
    recordKey: identity.recordKey,
    identityVersion: identity.identityVersion,
    calculationVersion: CALCULATION_VERSION,
    summary: toSummary(input),
    payload: input.chartJson,
    submissionMode: "explicit",
    origin: "local"
  });
  void syncOneBaziRecord(toLocalRecord(record), "explicit");
  return toLocalRecord(record);
}

export async function getLocalBaziRecords() {
  const records = await getBrowserRecordStore().list(getCurrentRecordScope());
  return records.filter((record) => record.type === "bazi").map(toLocalRecord);
}

export async function getLocalBaziRecord(id: string) {
  const records = await getLocalBaziRecords();
  return records.find((record) => record.id === id || record.serverId === id) ?? null;
}

export async function deleteLocalBaziRecord(id: string) {
  const record = await getLocalBaziRecord(id);
  return record ? getBrowserRecordStore().markDeleted(getCurrentRecordScope(), record.id) : null;
}

export async function deleteLocalBaziRecords(ids: Iterable<string>) {
  const idSet = new Set(ids);
  const records = await getLocalBaziRecords();
  await Promise.all(
    records
      .filter((record) => idSet.has(record.id) || Boolean(record.serverId && idSet.has(record.serverId)))
      .map((record) => getBrowserRecordStore().markDeleted(getCurrentRecordScope(), record.id))
  );
  return getLocalBaziRecords();
}

export const getUnifiedBaziRecords = getLocalBaziRecords;

export async function fetchCloudBaziRecords(): Promise<CloudBaziRecord[]> {
  const response = await fetchWithTimeout("/api/bazi/charts", {
    method: "GET",
    credentials: "include"
  });
  if (response.status === 401) {
    return [];
  }
  if (!response.ok) {
    throw new Error("云端八字记录读取失败");
  }

  const data = (await response.json()) as { charts?: CloudBaziChart[] };
  const mappedRecords: CloudBaziRecord[] = await Promise.all(
    (data.charts ?? []).filter(isCloudBaziChart).map(async (chart) => {
      const identity = chart.recordKey
        ? null
        : await buildRecordIdentity({
            type: "bazi",
            name: chart.name,
            gender: chart.gender,
            birthTime: chart.birthTime,
            locationKey: chart.location,
            longitude: chart.longitude,
            latitude: chart.latitude,
            useSolarTime: chart.useSolarTime
          });
      return {
        id: chart.localId || `cloud-bazi-${chart.id}`,
        serverId: chart.id,
        recordKey: chart.recordKey ?? identity!.recordKey,
        identityVersion: chart.identityVersion ?? identity?.identityVersion ?? 1,
        calculationVersion: chart.calculationVersion ?? 1,
        lifecycleVersion: chart.lifecycleVersion ?? 1,
        name: chart.name,
        gender: chart.gender,
        birthTime: chart.birthTime,
        calendar: chart.calendar,
        location: chart.location,
        longitude: chart.longitude,
        latitude: chart.latitude,
        useSolarTime: chart.useSolarTime,
        pillars: chart.pillars,
        createdAt: chart.createdAt,
        updatedAt: chart.updatedAt,
        syncStatus: "synced",
        origin: "cloud" as const
      };
    })
  );
  const records = consolidateCloudBaziRecords(mappedRecords);
  await Promise.all(
    records.map((record) =>
      getBrowserRecordStore().cacheRemote({
        id: record.id,
        scope: getCurrentRecordScope(),
        type: "bazi",
        recordKey: record.recordKey,
        identityVersion: record.identityVersion,
        calculationVersion: record.calculationVersion,
        lifecycleVersion: record.lifecycleVersion,
        summary: {
          name: record.name,
          gender: record.gender,
          birthTime: record.birthTime,
          calendar: record.calendar,
          location: record.location,
          longitude: record.longitude,
          latitude: record.latitude,
          useSolarTime: record.useSolarTime,
          pillars: record.pillars
        },
        payload: null,
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

export async function deleteCloudBaziRecord(serverId: string) {
  const response = await fetchWithTimeout(`/api/bazi/charts/${encodeURIComponent(serverId)}`, {
    method: "DELETE",
    credentials: "include"
  });
  if (!response.ok && response.status !== 404) {
    throw new Error("云端删除失败");
  }
}

export async function deleteUnifiedBaziRecordWithRemote(id: string) {
  const record = await getLocalBaziRecord(id);
  if (record?.serverId) {
    await deleteCloudBaziRecord(record.serverId);
  }
  if (record) {
    await getBrowserRecordStore().markDeleted(getCurrentRecordScope(), record.id);
  }
  return getLocalBaziRecords();
}

export function scheduleBaziRecordAutoSync() {
  if (typeof window === "undefined" || autoSyncStarted) {
    return;
  }
  autoSyncStarted = true;
  window.addEventListener("online", runScheduledSync);
  autoSyncTimer = window.setInterval(runScheduledSync, AUTO_SYNC_INTERVAL_MS);
  window.setTimeout(runScheduledSync, 0);
}

export function stopBaziRecordAutoSync() {
  if (typeof window === "undefined") {
    return;
  }
  if (autoSyncTimer !== undefined) {
    window.clearInterval(autoSyncTimer);
  }
  autoSyncTimer = undefined;
  autoSyncStarted = false;
  window.removeEventListener("online", runScheduledSync);
}

export async function syncPendingBaziRecords(force = false) {
  void force;
  if (syncInFlight) {
    return getLocalBaziRecords();
  }
  syncInFlight = true;
  try {
    const records = await getLocalBaziRecords();
    for (const record of records.filter((item) => item.syncStatus !== "synced")) {
      await syncOneBaziRecord(record);
    }
    return getLocalBaziRecords();
  } finally {
    syncInFlight = false;
  }
}

async function syncOneBaziRecord(record: LocalBaziRecord, submissionMode: "background" | "explicit" = "background") {
  try {
    const response = await fetchWithTimeout("/api/sync/bazi", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        localId: record.id,
        recordKey: record.recordKey,
        identityVersion: record.identityVersion,
        calculationVersion: record.calculationVersion,
        lifecycleVersion: record.lifecycleVersion,
        submissionMode,
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
      await getBrowserRecordStore().markFailed(getCurrentRecordScope(), record.id);
      return false;
    }
    const data = (await response.json()) as SyncResponse;
    await getBrowserRecordStore().markSynced(getCurrentRecordScope(), record.id, {
      serverId: data.serverId,
      syncedAt: data.syncedAt,
      recordKey: data.recordKey,
      identityVersion: data.identityVersion,
      calculationVersion: data.calculationVersion,
      lifecycleVersion: data.lifecycleVersion
    });
    return true;
  } catch {
    await getBrowserRecordStore().markFailed(getCurrentRecordScope(), record.id);
    return false;
  }
}

function runScheduledSync() {
  void syncPendingBaziRecords();
}

function toSummary(input: LocalBaziRecordInput): BaziSummary {
  return {
    name: input.name.trim() || "未命名",
    gender: input.gender,
    birthTime: input.birthTime,
    calendar: input.calendar,
    location: input.location,
    longitude: input.longitude,
    latitude: input.latitude,
    useSolarTime: input.useSolarTime,
    pillars: extractPillars(input.chartJson)
  };
}

function toLocalRecord(record: StoredPanRecord): LocalBaziRecord {
  const summary = record.summary as BaziSummary;
  return {
    id: record.id,
    serverId: record.serverId,
    recordKey: record.recordKey,
    identityVersion: record.identityVersion,
    calculationVersion: record.calculationVersion,
    lifecycleVersion: record.lifecycleVersion,
    ...summary,
    chartJson: record.payload as DemoBaziChart,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    syncStatus: record.syncStatus,
    origin: record.origin === "cloud" ? "cloud" : "record"
  };
}

function extractPillars(chart: DemoBaziChart) {
  return chart.columns.map((column) => `${column.pillar.stem}${column.pillar.branch}`).join(" ");
}

function consolidateCloudBaziRecords(records: CloudBaziRecord[]) {
  const byIdentity = new Map<string, CloudBaziRecord>();
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

type CloudBaziChart = {
  id: string;
  localId?: string | null;
  recordKey?: string | null;
  identityVersion?: number | null;
  calculationVersion?: number | null;
  lifecycleVersion?: number;
  name: string;
  gender: "male" | "female";
  birthTime: string;
  calendar: "solar" | "lunar" | "pillars";
  location?: string | null;
  longitude?: number | null;
  latitude?: number | null;
  useSolarTime: boolean;
  pillars: string;
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

function isCloudBaziChart(value: unknown): value is CloudBaziChart {
  if (!value || typeof value !== "object") {
    return false;
  }
  const chart = value as Record<string, unknown>;
  return (
    typeof chart.id === "string" &&
    typeof chart.name === "string" &&
    (chart.gender === "male" || chart.gender === "female") &&
    typeof chart.birthTime === "string" &&
    typeof chart.createdAt === "string" &&
    typeof chart.updatedAt === "string"
  );
}

function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit, timeoutMs = 25000) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  return fetch(input, { ...init, signal: controller.signal }).finally(() => window.clearTimeout(timeout));
}
