const BEIJING_TIME_LONGITUDE = 120;
const MINUTES_PER_LONGITUDE_DEGREE = 4;

export interface SolarTimeCorrection {
  correctedBirthTime: string;
  offsetMinutes: number;
}

export function calculateLongitudeSolarTime(birthTime: string, longitude: number): SolarTimeCorrection | null {
  const parsed = parseBirthTimeParts(birthTime);

  if (!parsed || !Number.isFinite(longitude)) {
    return null;
  }

  const offsetMinutes = Math.round((longitude - BEIJING_TIME_LONGITUDE) * MINUTES_PER_LONGITUDE_DEGREE);
  const correctedDate = new Date(parsed.year, parsed.month - 1, parsed.day, parsed.hour, parsed.minute + offsetMinutes);

  return {
    correctedBirthTime: formatBirthTimeValue(correctedDate),
    offsetMinutes
  };
}

export function getSolarTimeBirthTime(birthTime: string, useSolarTime?: boolean, longitude?: number | null) {
  if (!useSolarTime || typeof longitude !== "number") {
    return birthTime;
  }

  return calculateLongitudeSolarTime(birthTime, longitude)?.correctedBirthTime ?? birthTime;
}

function parseBirthTimeParts(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5])
  };
}

function formatBirthTimeValue(date: Date) {
  return [
    date.getFullYear(),
    pad2(date.getMonth() + 1),
    pad2(date.getDate())
  ].join("-") + `T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}
