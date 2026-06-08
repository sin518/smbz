import type { QimenOutput } from "taibu-core/qimen";
import type { LiuyaoStoredCasting, LiuyaoStoredInput } from "@/lib/liuyao/chart";

export type LocalDivinationRecordType = "liuyao" | "qimen";

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

const LOCAL_DIVINATION_RECORDS_KEY = "sm1:divination-records";

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
    payload
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
    payload
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
  }
}

function saveLocalDivinationRecord(input: Omit<LocalDivinationRecord, "id" | "updatedAt">) {
  const now = new Date().toISOString();
  const currentRecords = getLocalDivinationRecords();
  const duplicateIndex = currentRecords.findIndex((record) => record.type === input.type && record.sourceSavedAt === input.sourceSavedAt);
  const record: LocalDivinationRecord = {
    ...input,
    id: duplicateIndex >= 0 ? currentRecords[duplicateIndex].id : `local-${input.type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    updatedAt: now
  };
  const nextRecords =
    duplicateIndex >= 0
      ? currentRecords.map((item, index) => (index === duplicateIndex ? record : item))
      : [record, ...currentRecords].slice(0, 80);

  writeRecords(nextRecords);
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
    (record.type === "liuyao" || record.type === "qimen") &&
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
