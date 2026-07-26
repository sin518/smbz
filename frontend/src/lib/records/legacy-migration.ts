import { buildRecordIdentity, type RecordIdentityInput } from "@/lib/records/record-identity";
import {
  type PanRecordStore,
  type RecordType,
  type StoredPanRecord
} from "@/lib/records/record-store";

const LEGACY_BAZI_KEY = "sm1:bazi-records";
const LEGACY_DIVINATION_KEY = "sm1:divination-records";
const LEGACY_MIGRATION_MARKER = "sm1:pan-records-legacy-copy-v1";
const LEGACY_MIGRATION_RECEIPT = "sm1:pan-records-legacy-copy-v1-receipt";

export type LegacyMigrationPreview = {
  alreadyCopied: boolean;
  baziCount: number;
  divinationCount: number;
  invalidCount: number;
};

export type LegacyMigrationResult = LegacyMigrationPreview & {
  copiedCount: number;
};

type LegacyCandidate = {
  id: string;
  type: RecordType;
  summary: Record<string, unknown>;
  payload: unknown;
  identityInput: RecordIdentityInput;
  createdAt: string;
  calculationVersion: number;
  serverId?: string;
  syncStatus: "pending" | "synced" | "failed";
};

export function getLegacyMigrationPreview(): LegacyMigrationPreview {
  if (typeof window === "undefined") {
    return { alreadyCopied: false, baziCount: 0, divinationCount: 0, invalidCount: 0 };
  }

  const { candidates, invalidCount } = readLegacyCandidates();
  return {
    alreadyCopied: window.localStorage.getItem(LEGACY_MIGRATION_MARKER) === "complete",
    baziCount: candidates.filter((item) => item.type === "bazi").length,
    divinationCount: candidates.filter((item) => item.type !== "bazi").length,
    invalidCount
  };
}

export async function copyLegacyRecordsToUnclaimed(store: PanRecordStore): Promise<LegacyMigrationResult> {
  const preview = getLegacyMigrationPreview();
  if (typeof window === "undefined" || preview.alreadyCopied) {
    return { ...preview, copiedCount: 0 };
  }

  const { candidates } = readLegacyCandidates();
  const orderedCandidates = [...candidates].sort(
    (left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt)
  );
  const receipt: Array<{ sourceId: string; targetId: string; recordKey: string }> = [];
  for (const candidate of orderedCandidates) {
    const identity = await buildRecordIdentity(candidate.identityInput);
    const copied = await store.upsert({
      id: candidate.id,
      scope: "legacy-unclaimed",
      type: candidate.type,
      recordKey: identity.recordKey,
      identityVersion: identity.identityVersion,
      calculationVersion: candidate.calculationVersion,
      summary: candidate.summary,
      payload: candidate.payload,
      createdAt: candidate.createdAt,
      serverId: candidate.serverId,
      syncStatus: candidate.syncStatus,
      origin: "legacy"
    });
    receipt.push({
      sourceId: candidate.id,
      targetId: copied.id,
      recordKey: identity.recordKey
    });
  }

  const copied = await store.list("legacy-unclaimed", { includeDeleted: true });
  const expectedKeys = new Set(
    await Promise.all(candidates.map(async (candidate) => (await buildRecordIdentity(candidate.identityInput)).recordKey))
  );
  const copiedKeys = new Set(copied.map((record) => record.recordKey));
  const verifiedCount = Array.from(expectedKeys).filter((recordKey) => copiedKeys.has(recordKey)).length;
  if (verifiedCount !== expectedKeys.size) {
    throw new Error("旧记录复制校验失败，原数据已保留，请稍后重试");
  }

  window.localStorage.setItem(LEGACY_MIGRATION_RECEIPT, JSON.stringify(receipt));
  window.localStorage.setItem(LEGACY_MIGRATION_MARKER, "complete");
  return { ...preview, alreadyCopied: true, copiedCount: candidates.length };
}

export async function claimUnclaimedRecords(store: PanRecordStore, accountScope: `account:${string}`) {
  const unclaimed = await store.list("legacy-unclaimed");
  const claimed: StoredPanRecord[] = [];
  for (const record of unclaimed) {
    const next = await store.upsert({
      id: record.id,
      scope: accountScope,
      type: record.type,
      recordKey: record.recordKey,
      identityVersion: record.identityVersion,
      calculationVersion: record.calculationVersion,
      lifecycleVersion: record.lifecycleVersion,
      summary: record.summary,
      payload: record.payload,
      createdAt: record.createdAt,
      serverId: record.serverId,
      syncStatus: record.syncStatus,
      pinnedOffline: record.pinnedOffline,
      origin: "legacy",
      submissionMode: "explicit"
    });
    claimed.push(next);
  }
  await store.clearScope("legacy-unclaimed");
  return claimed;
}

function readLegacyCandidates() {
  const bazi = readArray(LEGACY_BAZI_KEY);
  const divination = readArray(LEGACY_DIVINATION_KEY);
  const candidates: LegacyCandidate[] = [];
  let invalidCount = 0;

  for (const value of bazi) {
    const candidate = toBaziCandidate(value);
    if (candidate) {
      candidates.push(candidate);
    } else {
      invalidCount += 1;
    }
  }

  for (const value of divination) {
    const candidate = toDivinationCandidate(value);
    if (candidate) {
      candidates.push(candidate);
    } else {
      invalidCount += 1;
    }
  }

  return { candidates, invalidCount };
}

function toBaziCandidate(value: unknown): LegacyCandidate | null {
  if (!isObject(value) || typeof value.id !== "string" || typeof value.birthTime !== "string") {
    return null;
  }
  if (value.gender !== "male" && value.gender !== "female") {
    return null;
  }

  const createdAt = typeof value.createdAt === "string" ? value.createdAt : new Date().toISOString();
  return {
    id: value.id,
    type: "bazi",
    summary: {
      name: typeof value.name === "string" ? value.name : "",
      gender: value.gender,
      birthTime: value.birthTime,
      calendar: typeof value.calendar === "string" ? value.calendar : "solar",
      location: typeof value.location === "string" ? value.location : null,
      longitude: typeof value.longitude === "number" ? value.longitude : null,
      latitude: typeof value.latitude === "number" ? value.latitude : null,
      useSolarTime: Boolean(value.useSolarTime),
      pillars: typeof value.pillars === "string" ? value.pillars : ""
    },
    payload: value.chartJson,
    identityInput: {
      type: "bazi",
      name: typeof value.name === "string" ? value.name : "",
      gender: value.gender,
      birthTime: value.birthTime,
      locationKey: typeof value.location === "string" ? value.location : null,
      longitude: typeof value.longitude === "number" ? value.longitude : null,
      latitude: typeof value.latitude === "number" ? value.latitude : null,
      useSolarTime: Boolean(value.useSolarTime)
    },
    createdAt,
    calculationVersion: numberOr(value.calculationVersion, 1),
    serverId: typeof value.serverId === "string" ? value.serverId : undefined,
    syncStatus: syncStatusOr(value.syncStatus)
  };
}

function toDivinationCandidate(value: unknown): LegacyCandidate | null {
  if (
    !isObject(value) ||
    typeof value.id !== "string" ||
    !isRecordType(value.type) ||
    value.type === "bazi" ||
    !isObject(value.payload)
  ) {
    return null;
  }

  const createdAt = typeof value.createdAt === "string" ? value.createdAt : new Date().toISOString();
  const question = typeof value.question === "string" ? value.question : "";
  const identityInput = divinationIdentityInput(value.type, value.payload, question, createdAt);
  return {
    id: value.id,
    type: value.type,
    summary: {
      question,
      summary: typeof value.summary === "string" ? value.summary : "",
      detail: typeof value.detail === "string" ? value.detail : ""
    },
    payload: value.payload,
    identityInput,
    createdAt,
    calculationVersion: numberOr(value.calculationVersion, 1),
    serverId: typeof value.serverId === "string" ? value.serverId : undefined,
    syncStatus: syncStatusOr(value.syncStatus)
  };
}

function divinationIdentityInput(
  type: Exclude<RecordType, "bazi">,
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
      birthYear: optionalNumber(input.birthYear),
      plateType: optionalString(input.plateType),
      juMethod: optionalString(input.juMethod),
      zhiFuJiGong: optionalString(input.zhiFuJiGong),
      manualDunType: optionalString(input.manualDunType),
      manualJu: optionalNumber(input.manualJu),
      juMode: optionalString(input.juMode)
    };
  }
  if (type === "ziwei") {
    const profile = objectOr(payload.profile);
    return {
      type,
      name: stringOr(profile.name, question),
      gender: profile.gender === "female" ? "female" : "male",
      birthTime: stringOr(profile.birthTime, createdAt),
      locationKey: optionalString(profile.location)
    };
  }
  if (type === "daliuren") {
    const input = objectOr(payload.input);
    return {
      type,
      question: stringOr(input.question, question),
      dateTime: stringOr(input.dateTime, createdAt),
      birthYear: numberOr(input.birthYear, new Date(createdAt).getFullYear()),
      gender: input.gender === "female" ? "female" : "male"
    };
  }

  const storedInput = objectOr(payload.input);
  const input = objectOr(storedInput.input);
  const casting = objectOr(payload.casting);
  const lines = Array.isArray(casting.lines)
    ? casting.lines
        .filter(isObject)
        .sort((left, right) => numberOr(left.position, 0) - numberOr(right.position, 0))
    : [];
  return {
    type: "liuyao",
    question: stringOr(input.question, question),
    completedAt: stringOr(casting.completedAt, stringOr(storedInput.savedAt, createdAt)),
    castingTime: optionalString(input.castingTime),
    castingMethod: optionalString(input.castingMethod),
    lineTotals: lines.map((line) => numberOr(line.total, 0))
  };
}

function readArray(key: string) {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function objectOr(value: unknown) {
  return isObject(value) ? value : {};
}

function isRecordType(value: unknown): value is RecordType {
  return value === "bazi" || value === "liuyao" || value === "qimen" || value === "ziwei" || value === "daliuren";
}

function numberOr(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function optionalNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function stringOr(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

function optionalString(value: unknown) {
  return typeof value === "string" && value ? value : null;
}

function syncStatusOr(value: unknown): "pending" | "synced" | "failed" {
  return value === "synced" || value === "failed" ? value : "pending";
}
