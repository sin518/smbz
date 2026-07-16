import type { QimenOutput } from "taibu-core/qimen";
import type { DaliurenOutput } from "taibu-core/daliuren";
import type { LiuyaoStoredCasting, LiuyaoStoredInput } from "@/lib/liuyao/chart";
import type { ZiweiChart } from "@/lib/ziwei/calculate";

export type LocalDivinationRecordType = "liuyao" | "qimen" | "ziwei" | "daliuren";

export type LocalDivinationRecord = {
  id: string;
  type: LocalDivinationRecordType;
  question: string;
  summary: string;
  detail: string;
  createdAt: string;
  updatedAt: string;
  sourceSavedAt: string;
  payload: unknown;
  syncStatus?: "pending" | "synced" | "failed";
  serverId?: string;
};

export type LocalQimenRecordPayload = {
  input?: {
    question?: string;
    dateTime?: string;
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

const LOCAL_DIVINATION_RECORDS_KEY = "sm1:divination-records";
const CLOUD_SYNC_TIMEOUT_MS = 25000;

export function saveLocalQimenRecord(payload: LocalQimenRecordPayload) {
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
    syncStatus: "pending"
  });
}

export function saveLocalLiuyaoRecord(payload: LocalLiuyaoRecordPayload) {
  const input = payload.input?.input;
  const question = input?.question?.trim() || "未填写占事";
  const createdAt = payload.casting?.completedAt || payload.input?.savedAt || new Date().toISOString();

  return saveLocalDivinationRecord({
    type: "liuyao",
    question,
    summary: "六爻断事",
    detail: `${formatCastingMethod(input?.castingMethod)} · ${formatDateTime(input?.castingTime)}`,
    createdAt,
    sourceSavedAt: `${payload.input?.savedAt || ""}-${payload.casting?.completedAt || ""}`,
    payload,
    syncStatus: "pending"
  });
}

export function saveLocalZiweiRecord(payload: LocalZiweiRecordPayload) {
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
    syncStatus: "pending"
  });
}

export function saveLocalDaliurenRecord(payload: LocalDaliurenRecordPayload) {
  const createdAt = payload.savedAt || new Date().toISOString();

  return saveLocalDivinationRecord({
    type: "daliuren",
    question: payload.input.question.trim() || "未填写占事",
    summary: "大六壬",
    detail: `${payload.chart.keName} · ${payload.chart.dateInfo.solarDate}`,
    createdAt,
    sourceSavedAt: createdAt,
    payload,
    syncStatus: "pending"
  });
}

export function getLocalDivinationRecords() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_DIVINATION_RECORDS_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isLocalDivinationRecord).sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
  } catch {
    return [];
  }
}

export function deleteLocalDivinationRecord(id: string) {
  const nextRecords = getLocalDivinationRecords().filter((record) => record.id !== id);
  writeRecords(nextRecords);
  return nextRecords;
}

export function restoreLocalDivinationRecord(record: LocalDivinationRecord) {
  if (typeof window === "undefined") {
    return;
  }

  if (record.type === "qimen" && isLocalQimenRecordPayload(record.payload)) {
    window.localStorage.setItem("sm1:current-qimen-result", JSON.stringify(record.payload));
    window.localStorage.setItem("sm1:last-qimen-input", JSON.stringify(record.payload));
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
      JSON.stringify({
        input: record.payload.input,
        savedAt: record.payload.savedAt
      })
    );
  }
}

function saveLocalDivinationRecord(input: Omit<LocalDivinationRecord, "id" | "updatedAt">) {
  const now = new Date().toISOString();
  const currentRecords = getLocalDivinationRecords();
  const duplicateIndex = currentRecords.findIndex((record) => record.type === input.type && record.sourceSavedAt === input.sourceSavedAt);
  const record: LocalDivinationRecord = {
    ...input,
    id: duplicateIndex >= 0 ? currentRecords[duplicateIndex].id : `local-${input.type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    updatedAt: now,
    syncStatus: input.syncStatus || "pending"
  };
  const nextRecords =
    duplicateIndex >= 0
      ? currentRecords.map((item, index) => (index === duplicateIndex ? record : item))
      : [record, ...currentRecords].slice(0, 80);

  writeRecords(nextRecords);

  // 自动触发后台同步
  if (record.syncStatus === "pending") {
    scheduleDivinationAutoSync(record);
  }

  return record;
}

function writeRecords(records: LocalDivinationRecord[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LOCAL_DIVINATION_RECORDS_KEY, JSON.stringify(records));
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

function isLocalDivinationRecord(value: unknown): value is LocalDivinationRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record.id === "string" &&
    (record.type === "liuyao" || record.type === "qimen" || record.type === "ziwei" || record.type === "daliuren") &&
    typeof record.question === "string" &&
    typeof record.summary === "string" &&
    typeof record.detail === "string" &&
    typeof record.createdAt === "string" &&
    typeof record.updatedAt === "string" &&
    typeof record.sourceSavedAt === "string" &&
    Boolean(record.payload)
  );
}

function isLocalQimenRecordPayload(value: unknown): value is LocalQimenRecordPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Record<string, unknown>;
  return Boolean(payload.chart) && typeof payload.savedAt === "string";
}

function isLocalLiuyaoRecordPayload(value: unknown): value is LocalLiuyaoRecordPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Record<string, unknown>;
  return Boolean(payload.input || payload.casting);
}

function isLocalZiweiRecordPayload(value: unknown): value is LocalZiweiRecordPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Record<string, unknown>;
  return Boolean(payload.profile && payload.chart);
}

function isLocalDaliurenRecordPayload(value: unknown): value is LocalDaliurenRecordPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Record<string, unknown>;
  return Boolean(payload.input && payload.chart && typeof payload.savedAt === "string");
}

// ==================== 云端同步功能 ====================

export async function syncDivinationToCloud(record: LocalDivinationRecord): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(
      `/api/sync/${record.type}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          localId: record.id,
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
      updateRecordSyncStatus(record.id, "failed");
      return false;
    }

    const result = await response.json();

    if (result.success && result.serverId) {
      updateRecordSyncStatus(record.id, "synced", result.serverId);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`${record.type} 记录同步失败:`, error);
    updateRecordSyncStatus(record.id, "failed");
    return false;
  }
}

/**
 * 更新记录的同步状态
 */
function updateRecordSyncStatus(
  recordId: string,
  status: "pending" | "synced" | "failed",
  serverId?: string
) {
  const records = getLocalDivinationRecords();
  const updated = records.map((r) =>
    r.id === recordId
      ? { ...r, syncStatus: status, serverId: serverId || r.serverId, updatedAt: new Date().toISOString() }
      : r
  );
  writeRecords(updated);
}

/**
 * 安排自动同步(10分钟后)
 */
function scheduleDivinationAutoSync(record: LocalDivinationRecord) {
  if (typeof window === "undefined") {
    return;
  }

  window.setTimeout(() => {
    syncDivinationToCloud(record).catch(console.error);
  }, 10 * 60 * 1000);
}

/**
 * 手动同步所有待同步的记录
 */
export async function syncAllPendingRecords(): Promise<{ success: number; failed: number }> {
  const records = getLocalDivinationRecords().filter((r) => r.syncStatus !== "synced");
  let success = 0;
  let failed = 0;

  for (const record of records) {
    const result = await syncDivinationToCloud(record);

    if (result) {
      success++;
    } else {
      failed++;
    }
  }

  return { success, failed };
}

function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit, timeoutMs = 5000) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  return fetch(input, {
    ...init,
    signal: controller.signal
  }).finally(() => window.clearTimeout(timeout));
}
