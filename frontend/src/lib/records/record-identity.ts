export const RECORD_IDENTITY_VERSION = 1;

type Gender = "male" | "female";

export type RecordIdentityInput =
  | {
      type: "bazi";
      name: string;
      gender: Gender;
      birthTime: string;
      locationKey?: string | null;
      longitude?: number | null;
      latitude?: number | null;
      useSolarTime: boolean;
    }
  | {
      type: "ziwei";
      name: string;
      gender: Gender;
      birthTime: string;
      locationKey?: string | null;
    }
  | {
      type: "qimen";
      question: string;
      dateTime: string;
      birthYear?: number | null;
      plateType?: string | null;
      juMethod?: string | null;
      zhiFuJiGong?: string | null;
      manualDunType?: string | null;
      manualJu?: number | null;
      juMode?: string | null;
    }
  | {
      type: "daliuren";
      question: string;
      dateTime: string;
      birthYear: number;
      gender: Gender;
    }
  | {
      type: "liuyao";
      question: string;
      completedAt: string;
      castingTime?: string | null;
      castingMethod?: string | null;
      lineTotals: number[];
    };

export type RecordIdentity = {
  identityVersion: typeof RECORD_IDENTITY_VERSION;
  recordKey: string;
  canonical: Record<string, unknown>;
};

export async function buildRecordIdentity(input: RecordIdentityInput): Promise<RecordIdentity> {
  const canonical = canonicalizeRecordIdentity(input);
  const serialized = stableStringify(canonical);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(serialized));
  const hex = Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("");

  return {
    identityVersion: RECORD_IDENTITY_VERSION,
    recordKey: `${input.type}:v${RECORD_IDENTITY_VERSION}:${hex}`,
    canonical
  };
}

export function canonicalizeRecordIdentity(input: RecordIdentityInput): Record<string, unknown> {
  switch (input.type) {
    case "bazi":
      const hasCoordinates =
        typeof input.longitude === "number" &&
        Number.isFinite(input.longitude) &&
        typeof input.latitude === "number" &&
        Number.isFinite(input.latitude);
      return {
        birthTime: normalizeDateTime(input.birthTime),
        gender: input.gender,
        latitude: normalizeCoordinate(input.latitude),
        locationKey: hasCoordinates ? null : normalizeLocationKey(input.locationKey),
        longitude: normalizeCoordinate(input.longitude),
        name: normalizeText(input.name),
        type: input.type,
        useSolarTime: input.useSolarTime,
        version: RECORD_IDENTITY_VERSION
      };
    case "ziwei":
      return {
        birthTime: normalizeDateTime(input.birthTime),
        gender: input.gender,
        locationKey: normalizeLocationKey(input.locationKey),
        name: normalizeText(input.name),
        type: input.type,
        version: RECORD_IDENTITY_VERSION
      };
    case "qimen":
      return {
        birthYear: input.birthYear ?? null,
        dateTime: normalizeDateTime(input.dateTime),
        juMethod: normalizeOptionalText(input.juMethod),
        juMode: normalizeOptionalText(input.juMode),
        manualDunType: normalizeOptionalText(input.manualDunType),
        manualJu: input.manualJu ?? null,
        plateType: normalizeOptionalText(input.plateType),
        question: normalizeText(input.question),
        type: input.type,
        version: RECORD_IDENTITY_VERSION,
        zhiFuJiGong: normalizeOptionalText(input.zhiFuJiGong)
      };
    case "daliuren":
      return {
        birthYear: input.birthYear,
        dateTime: normalizeDateTime(input.dateTime),
        gender: input.gender,
        question: normalizeText(input.question),
        type: input.type,
        version: RECORD_IDENTITY_VERSION
      };
    case "liuyao":
      return {
        castingMethod: normalizeOptionalText(input.castingMethod),
        castingTime: input.castingTime ? normalizeDateTime(input.castingTime) : null,
        completedAt: normalizeDateTime(input.completedAt),
        lineTotals: input.lineTotals.map((value) => Number(value)),
        question: normalizeText(input.question),
        type: input.type,
        version: RECORD_IDENTITY_VERSION
      };
  }
}

function normalizeText(value: string) {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ");
}

function normalizeOptionalText(value: string | null | undefined) {
  return value ? normalizeText(value) : null;
}

function normalizeLocationKey(value: string | null | undefined) {
  return value ? normalizeText(value).replace(/\s+/g, "") : null;
}

function normalizeCoordinate(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(6) : null;
}

function normalizeDateTime(value: string) {
  const normalized = normalizeText(value).replace(" ", "T");
  const localMatch = normalized.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})(?::(\d{2}))?(?:\.(\d+))?$/);
  if (localMatch) {
    return `${localMatch[1]}:${localMatch[2] ?? "00"}`;
  }

  if (/([zZ]|[+-]\d{2}:\d{2})$/.test(normalized)) {
    const timestamp = Date.parse(normalized);
    if (Number.isFinite(timestamp)) {
      return new Date(timestamp).toISOString().replace(".000Z", "Z");
    }
  }

  return normalized;
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`);
    return `{${entries.join(",")}}`;
  }

  return JSON.stringify(value);
}
