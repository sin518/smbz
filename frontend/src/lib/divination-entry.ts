export type AssistedChartKind = "bazi" | "ziwei" | "qimen" | "daliuren" | "liuyao";

type SearchParamsReader = Pick<URLSearchParams, "get">;

const chartPaths: Record<AssistedChartKind, string> = {
  bazi: "/bazi",
  ziwei: "/ziwei/profile",
  qimen: "/qimen",
  daliuren: "/daliuren",
  liuyao: "/liuyao"
};

export function buildAssistedChartHref(kind: AssistedChartKind, dateTime: string) {
  const params = new URLSearchParams({ dateTime, source: "calendar" });
  return `${chartPaths[kind]}?${params.toString()}`;
}

export function getAssistedDateTime(searchParams: SearchParamsReader) {
  return normalizeLocalDateTime(searchParams.get("dateTime"));
}

export function normalizeLocalDateTime(value: string | null) {
  if (!value) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;

  const [, yearText, monthText, dayText, hourText, minuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const date = new Date(year, month - 1, day, hour, minute);

  if (
    year < 1900 ||
    year > 2100 ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hour ||
    date.getMinutes() !== minute
  ) {
    return null;
  }

  return value;
}
