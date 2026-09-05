"use client";

import { RotateCcw, X } from "lucide-react";
import { useState } from "react";
import { AccessibleDialog } from "@/components/shared/accessible-dialog";
import { CALENDAR_MAX_YEAR, CALENDAR_MIN_YEAR, type YearMonth } from "@/lib/calendar";

const months = Array.from({ length: 12 }, (_, index) => index + 1);

export function YearMonthPicker({ open, value, onClose, onConfirm }: { open: boolean; value: YearMonth; onClose: () => void; onConfirm: (value: YearMonth) => void }) {
  const [draftYear, setDraftYear] = useState(value.year);
  const [draftMonth, setDraftMonth] = useState(value.month);

  const resetDraft = () => {
    setDraftYear(value.year);
    setDraftMonth(value.month);
  };

  return (
    <AccessibleDialog open={open} onClose={onClose} labelledBy="calendar-picker-title" className="rounded-t-[28px] bg-[#fffdf7] px-5 pb-[calc(24px+env(safe-area-inset-bottom))] pt-4">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => { resetDraft(); onClose(); }} className="flex h-11 w-11 items-center justify-center rounded-full" aria-label="关闭年月选择"><X size={22} /></button>
        <h2 id="calendar-picker-title" className="text-[19px] font-semibold">选择年月</h2>
        <button type="button" onClick={() => { const current = new Date(); setDraftYear(Math.min(CALENDAR_MAX_YEAR, Math.max(CALENDAR_MIN_YEAR, current.getFullYear()))); setDraftMonth(current.getMonth() + 1); }} className="flex h-11 w-11 items-center justify-center rounded-full text-gold" aria-label="选择当前年月"><RotateCcw size={20} /></button>
      </div>
      <div className="mt-5 grid grid-cols-[1fr_112px] gap-3">
        <label className="text-[13px] font-semibold text-mutedInk">年份
          <input type="number" min={CALENDAR_MIN_YEAR} max={CALENDAR_MAX_YEAR} value={draftYear} onChange={(event) => setDraftYear(Number(event.target.value))} className="mt-2 h-12 w-full rounded-xl border border-[#e5d8bc] bg-[#f2f0e8] px-4 text-[17px] text-ink" />
        </label>
        <label className="text-[13px] font-semibold text-mutedInk">月份
          <select value={draftMonth} onChange={(event) => setDraftMonth(Number(event.target.value))} className="mt-2 h-12 w-full rounded-xl border border-[#e5d8bc] bg-[#f2f0e8] px-3 text-[17px] text-ink">
            {months.map((month) => <option key={month} value={month}>{month}月</option>)}
          </select>
        </label>
      </div>
      <button type="button" disabled={!Number.isInteger(draftYear) || draftYear < CALENDAR_MIN_YEAR || draftYear > CALENDAR_MAX_YEAR} onClick={() => onConfirm({ year: draftYear, month: draftMonth })} className="mt-5 h-12 w-full rounded-xl bg-[#a58024] text-[16px] font-semibold text-white disabled:opacity-40">查看该月</button>
      <p className="mt-3 text-center text-[12px] text-mutedInk">可查询 {CALENDAR_MIN_YEAR}—{CALENDAR_MAX_YEAR} 年</p>
    </AccessibleDialog>
  );
}
