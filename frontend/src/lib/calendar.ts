import { Solar } from "lunar-typescript";

export const CALENDAR_MIN_YEAR = 1900;
export const CALENDAR_MAX_YEAR = 2100;

export type CalendarDate = {
  key: string;
  year: number;
  month: number;
  day: number;
  weekday: number;
  inCurrentMonth: boolean;
  supported: boolean;
  lunarDayLabel: string;
  lunarDateLabel: string;
  festivals: string[];
  jieQi: string;
  yearGanZhi: string;
  monthGanZhi: string;
  dayGanZhi: string;
};

export type YearMonth = { year: number; month: number };

export function buildCalendarMonth(year: number, month: number): CalendarDate[] {
  const firstWeekday = new Date(year, month - 1, 1, 12).getDay();
  const firstCell = new Date(year, month - 1, 1 - firstWeekday, 12);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstCell);
    date.setDate(firstCell.getDate() + index);
    return buildCalendarDate(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
      date.getMonth() + 1 === month
    );
  });
}

export function buildCalendarDate(year: number, month: number, day: number, inCurrentMonth = true): CalendarDate {
  const key = formatDateKey(year, month, day);
  const weekday = new Date(year, month - 1, day, 12).getDay();

  if (year < CALENDAR_MIN_YEAR || year > CALENDAR_MAX_YEAR) {
    return {
      key,
      year,
      month,
      day,
      weekday,
      inCurrentMonth,
      supported: false,
      lunarDayLabel: "",
      lunarDateLabel: "",
      festivals: [],
      jieQi: "",
      yearGanZhi: "",
      monthGanZhi: "",
      dayGanZhi: ""
    };
  }

  const solar = Solar.fromYmd(year, month, day);
  const lunar = solar.getLunar();
  const lunarMonth = `${lunar.getMonthInChinese()}月`;
  const lunarDay = lunar.getDayInChinese();
  const lunarDayLabel = lunar.getDay() === 1 ? lunarMonth : lunarDay;

  return {
    key,
    year,
    month,
    day,
    weekday,
    inCurrentMonth,
    supported: true,
    lunarDayLabel,
    lunarDateLabel: `农历${lunarMonth}${lunarDay}`,
    festivals: Array.from(new Set([...solar.getFestivals(), ...lunar.getFestivals()])),
    jieQi: lunar.getJieQi(),
    yearGanZhi: lunar.getYearInGanZhiByLiChun(),
    monthGanZhi: lunar.getMonthInGanZhi(),
    dayGanZhi: lunar.getDayInGanZhi()
  };
}

export function shiftCalendarMonth({ year, month }: YearMonth, offset: number): YearMonth {
  const shifted = new Date(year, month - 1 + offset, 1, 12);
  const next = { year: shifted.getFullYear(), month: shifted.getMonth() + 1 };

  if (next.year < CALENDAR_MIN_YEAR) {
    return { year: CALENDAR_MIN_YEAR, month: 1 };
  }
  if (next.year > CALENDAR_MAX_YEAR) {
    return { year: CALENDAR_MAX_YEAR, month: 12 };
  }
  return next;
}

export function getChangedMonthBranch(currentGanZhi: string, previousGanZhi?: string) {
  const currentBranch = getEarthlyBranch(currentGanZhi);
  const previousBranch = getEarthlyBranch(previousGanZhi ?? "");
  return currentBranch && previousBranch && currentBranch !== previousBranch ? currentBranch : "";
}

export function getEarthlyBranch(ganZhi: string) {
  return Array.from(ganZhi).at(-1) ?? "";
}

export function formatDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
