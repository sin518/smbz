"use client";

import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AssistedChartEntry } from "@/components/calendar/assisted-chart-entry";
import { DailyAlmanac } from "@/components/calendar/daily-almanac";
import { YearMonthPicker } from "@/components/calendar/year-month-picker";
import {
  buildCalendarDate,
  buildCalendarMonth,
  CALENDAR_MAX_YEAR,
  CALENDAR_MIN_YEAR,
  formatDateKey,
  getChangedMonthBranch,
  getEarthlyBranch,
  shiftCalendarMonth,
  type CalendarDate,
  type YearMonth
} from "@/lib/calendar";
import { cn } from "@/lib/utils";

const weekNames = ["日", "一", "二", "三", "四", "五", "六"];
const fullWeekNames = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
function getTodayParts() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
}

export function PerpetualCalendar() {
  const today = getTodayParts();
  const initialYear = Math.min(CALENDAR_MAX_YEAR, Math.max(CALENDAR_MIN_YEAR, today.year));
  const [visibleMonth, setVisibleMonth] = useState<YearMonth>({ year: initialYear, month: today.month });
  const [selectedKey, setSelectedKey] = useState(formatDateKey(initialYear, today.month, today.day));
  const [pickerOpen, setPickerOpen] = useState(false);
  const days = buildCalendarMonth(visibleMonth.year, visibleMonth.month);
  const selected = days.find((day) => day.key === selectedKey) ?? buildCalendarDate(visibleMonth.year, visibleMonth.month, 1);
  const todayKey = formatDateKey(today.year, today.month, today.day);

  const changeMonth = (offset: number) => {
    const next = shiftCalendarMonth(visibleMonth, offset);
    setVisibleMonth(next);
    setSelectedKey(formatDateKey(next.year, next.month, 1));
  };

  const selectDay = (day: CalendarDate) => {
    if (!day.supported) return;
    setSelectedKey(day.key);
    if (!day.inCurrentMonth) {
      setVisibleMonth({ year: day.year, month: day.month });
    }
  };

  const goToToday = () => {
    const nextYear = Math.min(CALENDAR_MAX_YEAR, Math.max(CALENDAR_MIN_YEAR, today.year));
    setVisibleMonth({ year: nextYear, month: today.month });
    setSelectedKey(formatDateKey(nextYear, today.month, today.day));
  };

  return (
    <main className="app-responsive-shell min-h-dvh bg-[#F8F7EE] pb-10 text-ink shadow-soft">
      <header className="sticky top-0 z-20 grid h-20 grid-cols-[80px_1fr_80px] items-end border-b border-[#ebe7dd] bg-[#F8F7EE]/95 px-3 pb-3 backdrop-blur">
        <Link href="/settings" className="flex h-11 items-center rounded-xl text-[15px] font-medium text-gold" aria-label="返回设置">
          <ChevronLeft size={23} />
          <span>设置</span>
        </Link>
        <h1 className="pb-2 text-center text-[21px] font-semibold">万年历</h1>
        <button type="button" onClick={goToToday} className="ml-auto h-10 rounded-xl border border-[#c9a551] px-3 text-[14px] font-semibold text-gold">
          今天
        </button>
      </header>

      <section aria-label={`${visibleMonth.year}年${visibleMonth.month}月日历`} className="px-3 pt-4">
        <div className="grid grid-cols-[44px_1fr_44px] items-center">
          <button type="button" onClick={() => changeMonth(-1)} disabled={visibleMonth.year === CALENDAR_MIN_YEAR && visibleMonth.month === 1} className="flex h-11 w-11 items-center justify-center rounded-full disabled:opacity-25" aria-label="上个月">
            <ChevronLeft size={26} />
          </button>
          <button type="button" onClick={() => setPickerOpen(true)} className="mx-auto flex h-11 items-center gap-1 rounded-xl px-4 text-[22px] font-semibold" aria-label={`选择年月，当前${visibleMonth.year}年${visibleMonth.month}月`}>
            {visibleMonth.year}年{visibleMonth.month}月
            <ChevronDown size={18} className="text-mutedInk" />
          </button>
          <button type="button" onClick={() => changeMonth(1)} disabled={visibleMonth.year === CALENDAR_MAX_YEAR && visibleMonth.month === 12} className="flex h-11 w-11 items-center justify-center rounded-full disabled:opacity-25" aria-label="下个月">
            <ChevronRight size={26} />
          </button>
        </div>

        <div className="mt-2 overflow-hidden rounded-[24px] border border-[#e5d8bc] bg-[#fffdf7] px-2 pb-3 pt-2 shadow-soft">
          <div className="grid grid-cols-7" aria-hidden="true">
            {weekNames.map((name, index) => (
              <span key={name} className={cn("py-2 text-center text-[13px] font-semibold text-mutedInk", (index === 0 || index === 6) && "text-gold")}>{name}</span>
            ))}
          </div>
          <div className="grid grid-cols-7" aria-label="日期">
            {days.map((day, index) => {
              const label = day.jieQi || day.festivals[0] || day.lunarDayLabel;
              const highlighted = Boolean(day.jieQi || day.festivals.length);
              const selectedDay = day.key === selectedKey;
              const isToday = day.key === todayKey;
              const monthBranchChange = day.inCurrentMonth
                ? getChangedMonthBranch(day.monthGanZhi, days[index - 1]?.monthGanZhi)
                : "";
              return (
                <button
                  key={day.key}
                  type="button"
                  disabled={!day.supported}
                  aria-current={isToday ? "date" : undefined}
                  aria-label={`${selectedDay ? "已选择，" : ""}${day.year}年${day.month}月${day.day}日，${fullWeekNames[day.weekday]}${label ? `，${label}` : ""}${monthBranchChange ? `，月支变更为${monthBranchChange}` : ""}`}
                  onClick={() => selectDay(day)}
                  className={cn(
                    "relative mx-auto flex h-[57px] w-full max-w-[52px] flex-col items-center justify-center rounded-[14px] leading-none transition-colors",
                    selectedDay ? "bg-[#765b18] text-white shadow-[0_5px_14px_rgba(128,90,22,0.24)]" : "hover:bg-[#f6f0e2]"
                  )}
                >
                  <span className={cn(
                    "text-[21px] font-semibold",
                    selectedDay ? "text-white" : !day.inCurrentMonth ? "text-mutedInk" : (day.weekday === 0 || day.weekday === 6) ? "text-gold" : "text-ink"
                  )} aria-hidden="true">{day.day}</span>
                  <span className={cn(
                    "mt-1 max-w-full truncate px-0.5 text-[10px]",
                    selectedDay ? "text-white" : !day.inCurrentMonth ? "text-mutedInk" : highlighted ? "font-semibold text-gold" : "text-mutedInk"
                  )} aria-hidden="true">{label}</span>
                  {monthBranchChange ? (
                    <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border border-[#e8aaa4] bg-[#fff3f1] px-0.5 text-[10px] font-bold leading-none text-[#b42318]" aria-hidden="true">
                      {monthBranchChange}
                    </span>
                  ) : null}
                  {isToday && !selectedDay ? <span className="absolute bottom-1 h-1 w-1 rounded-full bg-[#a58024]" aria-hidden="true" /> : null}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <SelectedDateDetails date={selected} />
      <AssistedChartEntry date={selected} />
      <DailyAlmanac dateKey={selected.key} />
      <YearMonthPicker key={`${visibleMonth.year}-${visibleMonth.month}`} open={pickerOpen} value={visibleMonth} onClose={() => setPickerOpen(false)} onConfirm={(next) => {
        setVisibleMonth(next);
        setSelectedKey(formatDateKey(next.year, next.month, 1));
        setPickerOpen(false);
      }} />
    </main>
  );
}

function SelectedDateDetails({ date }: { date: CalendarDate }) {
  const festivalText = date.festivals.length ? date.festivals.join("、") : "当日无节日";
  return (
    <section aria-labelledby="selected-date-heading" className="mx-3 mt-4 overflow-hidden rounded-[24px] border border-[#e5d8bc] bg-[#fffdf7] shadow-soft">
      <div className="px-5 pb-4 pt-5">
        <p className="text-[12px] font-semibold tracking-[0.14em] text-gold">所选日期</p>
        <div className="mt-2 flex items-end justify-between gap-3">
          <div>
            <h2 id="selected-date-heading" className="text-[30px] font-semibold leading-tight">{date.lunarDateLabel.replace("农历", "")}</h2>
            <p className="mt-2 text-[14px] text-mutedInk">{date.year}年{date.month}月{date.day}日 · {fullWeekNames[date.weekday]}</p>
          </div>
          <CalendarDays size={29} strokeWidth={1.5} className="mb-1 shrink-0 text-gold" aria-hidden="true" />
        </div>
      </div>
      <dl className="border-t border-[#ebe7dd] px-5 text-[14px]">
        <DetailRow label="干支" value={<GanZhiValue date={date} />} />
        <DetailRow label="节气" value={date.jieQi || "当日无节气"} />
        <DetailRow label="节日" value={festivalText} last />
      </dl>
    </section>
  );
}

function GanZhiValue({ date }: { date: CalendarDate }) {
  const pillars = [
    { ganZhi: date.yearGanZhi, suffix: "年" },
    { ganZhi: date.monthGanZhi, suffix: "月" },
    { ganZhi: date.dayGanZhi, suffix: "日" }
  ];
  const accessibleLabel = pillars.map(({ ganZhi, suffix }) => `${ganZhi}${suffix}`).join("，");

  return (
    <span>
      <span className="sr-only">{accessibleLabel}</span>
      <span className="flex flex-wrap justify-end gap-x-1" aria-hidden="true">
        {pillars.map(({ ganZhi, suffix }, index) => {
          const characters = Array.from(ganZhi);
          const branch = getEarthlyBranch(ganZhi);
          return (
            <span key={suffix} className="whitespace-nowrap">
              {index > 0 ? <span className="mr-1 text-mutedInk">·</span> : null}
              {characters.slice(0, -1).join("")}
              <span className="font-bold text-[var(--color-danger)]">{branch}</span>
              {suffix}
            </span>
          );
        })}
      </span>
    </span>
  );
}

function DetailRow({ label, value, last = false }: { label: string; value: React.ReactNode; last?: boolean }) {
  return <div className={cn("grid grid-cols-[52px_1fr] gap-3 py-3.5", !last && "border-b border-[#ebe7dd]")}><dt className="text-mutedInk">{label}</dt><dd className="text-right font-medium">{value}</dd></div>;
}
