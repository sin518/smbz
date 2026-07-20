"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { BaziPillarsResolveCandidate } from "taibu-core";
import { calculateBazi } from "taibu-core/bazi";
import { resolveBaziPillars } from "taibu-core/bazi-pillars-resolve";
import { DivinationTimePickerSheet } from "@/components/shared/divination-profile-card";
import {
  GanzhiPillarSelector,
  type GanzhiPillarSelection
} from "@/components/shared/ganzhi-pillar-selector";
import { cn } from "@/lib/utils";

type CalendarMode = "solar" | "pillars";
const DEFAULT_PILLARS: GanzhiPillarSelection = {
  yearPillar: "壬申",
  monthPillar: "戊申",
  dayPillar: "丙午",
  hourPillar: "癸巳"
};

export function BaziBirthTimePickerSheet({
  open,
  value,
  calendar,
  onClose,
  onConfirm
}: {
  open: boolean;
  value: string;
  calendar: CalendarMode;
  onClose: () => void;
  onConfirm: (value: string, calendar: CalendarMode) => void;
}) {
  const [draftCalendar, setDraftCalendar] = useState<CalendarMode>(calendar);

  useEffect(() => {
    if (open) {
      setDraftCalendar(calendar);
    }
  }, [calendar, open]);

  const modeSwitcher = <CalendarModeSwitcher value={draftCalendar} onChange={setDraftCalendar} />;

  if (draftCalendar === "solar") {
    return (
      <DivinationTimePickerSheet
        open={open}
        value={value}
        header={modeSwitcher}
        ariaLabel="关闭出生时间选择"
        onClose={onClose}
        onConfirm={(nextValue) => onConfirm(nextValue, "solar")}
      />
    );
  }

  return (
    <BaziPillarsPickerSheet
      open={open}
      value={value}
      header={modeSwitcher}
      onClose={onClose}
      onConfirm={(nextValue) => onConfirm(nextValue, "pillars")}
    />
  );
}

function CalendarModeSwitcher({ value, onChange }: { value: CalendarMode; onChange: (value: CalendarMode) => void }) {
  return (
    <div className="grid h-12 grid-cols-2 rounded-full bg-[#f4f4f3] p-1" role="tablist" aria-label="选择出生时间输入方式">
      {[
        { label: "公历", value: "solar" },
        { label: "农历", value: "pillars" }
      ].map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          onClick={() => onChange(option.value as CalendarMode)}
          className={cn(
            "rounded-full text-[18px] font-semibold transition-colors",
            value === option.value ? "bg-white text-ink shadow-sm" : "text-[#96938d]"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function BaziPillarsPickerSheet({
  open,
  value,
  header,
  onClose,
  onConfirm
}: {
  open: boolean;
  value: string;
  header: React.ReactNode;
  onClose: () => void;
  onConfirm: (value: string) => void;
}) {
  const [pillars, setPillars] = useState<GanzhiPillarSelection>(DEFAULT_PILLARS);
  const [status, setStatus] = useState<"selecting" | "resolving" | "choosing">("selecting");
  const [candidates, setCandidates] = useState<BaziPillarsResolveCandidate[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setPillars(getInitialPillars(value));
      setStatus("selecting");
      setCandidates([]);
      setSelectedCandidateId(null);
      setError("");
    }
  }, [open, value]);

  if (!open) {
    return null;
  }

  async function resolveCandidates() {
    setStatus("resolving");
    setError("");

    try {
      const result = await resolveBaziPillars(pillars);
      const now = Date.now();
      const availableCandidates = result.candidates.filter((candidate) => parseCandidateTime(candidate.solarText).getTime() <= now);

      if (availableCandidates.length === 0) {
        setStatus("selecting");
        setError("1900 年至今没有匹配的出生时间，请检查四柱组合。");
        return;
      }

      if (availableCandidates.length === 1) {
        onConfirm(toBirthTimeValue(availableCandidates[0].solarText));
        return;
      }

      setCandidates(availableCandidates);
      setSelectedCandidateId(availableCandidates[0].candidateId);
      setStatus("choosing");
    } catch (resolveError) {
      setStatus("selecting");
      setError(resolveError instanceof Error ? resolveError.message : "四柱反查失败，请稍后再试。");
    }
  }

  function confirmCandidate() {
    const selected = candidates.find((candidate) => candidate.candidateId === selectedCandidateId);
    if (selected) {
      onConfirm(toBirthTimeValue(selected.solarText));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65">
      <button className="absolute inset-0 cursor-default" type="button" aria-label="关闭出生时间选择" onClick={onClose} />
      <section className="relative w-full max-w-[430px] rounded-t-[28px] bg-white px-5 pb-8 pt-7 shadow-soft" aria-label="四柱干支反查出生时间">
        {header}

        {status === "choosing" ? (
          <CandidateChooser
            candidates={candidates}
            selectedCandidateId={selectedCandidateId}
            onSelect={setSelectedCandidateId}
          />
        ) : (
          <div className="mt-6 border-t border-[#f0f0ef] pt-4">
            <p className="text-center text-[13px] leading-5 text-[#8b8985]">按年、月、日、时四柱反查 1900 年至今的出生时间</p>
            <div className="mt-3">
              <GanzhiPillarSelector value={pillars} onChange={(nextValue) => { setPillars(nextValue); setError(""); }} />
            </div>
          </div>
        )}

        {error ? <p className="mt-3 text-center text-[14px] font-semibold text-red-600" role="alert">{error}</p> : null}

        <div className="mt-5 grid grid-cols-[1fr_1.35fr] items-center gap-3">
          <button
            type="button"
            onClick={status === "choosing" ? () => setStatus("selecting") : onClose}
            className="h-12 rounded-full bg-[#f4f4f3] text-[17px] font-semibold text-ink"
          >
            {status === "choosing" ? "返回修改" : "取消"}
          </button>
          <button
            type="button"
            disabled={status === "resolving"}
            onClick={status === "choosing" ? confirmCandidate : () => void resolveCandidates()}
            className="flex h-12 items-center justify-center gap-2 rounded-full bg-black text-[19px] font-semibold text-[#e8d4a7] disabled:opacity-65"
          >
            {status === "resolving" ? <Loader2 size={19} className="animate-spin" aria-hidden="true" /> : null}
            {status === "resolving" ? "正在反查" : status === "choosing" ? "使用此时间" : "查询时间"}
          </button>
        </div>
      </section>
    </div>
  );
}

function CandidateChooser({
  candidates,
  selectedCandidateId,
  onSelect
}: {
  candidates: BaziPillarsResolveCandidate[];
  selectedCandidateId: string | null;
  onSelect: (candidateId: string) => void;
}) {
  return (
    <div className="mt-6 border-t border-[#f0f0ef] pt-4">
      <h2 className="text-[18px] font-semibold text-ink">选择匹配的出生时间</h2>
      <p className="mt-1 text-[13px] leading-5 text-[#8b8985]">同一组四柱可能每隔六十年再次出现，请确认实际出生年份。</p>
      <div className="mt-3 max-h-[330px] space-y-2 overflow-y-auto pr-1">
        {candidates.map((candidate) => (
          <label
            key={candidate.candidateId}
            className={cn(
              "block cursor-pointer rounded-2xl border px-4 py-3",
              selectedCandidateId === candidate.candidateId ? "border-[#a58024] bg-[#fbf6e9]" : "border-[#e8e4da] bg-white"
            )}
          >
            <span className="flex items-start gap-3">
              <input
                type="radio"
                name="bazi-pillar-candidate"
                value={candidate.candidateId}
                checked={selectedCandidateId === candidate.candidateId}
                onChange={() => onSelect(candidate.candidateId)}
                className="mt-1"
              />
              <span>
                <strong className="block text-[16px] text-ink">公历 {candidate.solarText}</strong>
                <span className="mt-1 block text-[13px] text-[#77736c]">{candidate.lunarText}</span>
              </span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

function parseCandidateTime(value: string) {
  return new Date(value.replace(" ", "T"));
}

function toBirthTimeValue(value: string) {
  return value.replace(" ", "T");
}

function getInitialPillars(value: string): GanzhiPillarSelection {
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) {
    return DEFAULT_PILLARS;
  }

  try {
    const chart = calculateBazi({
      gender: "male",
      birthYear: date.getFullYear(),
      birthMonth: date.getMonth() + 1,
      birthDay: date.getDate(),
      birthHour: date.getHours(),
      birthMinute: date.getMinutes(),
      calendarType: "solar"
    });

    return {
      yearPillar: `${chart.fourPillars.year.stem}${chart.fourPillars.year.branch}`,
      monthPillar: `${chart.fourPillars.month.stem}${chart.fourPillars.month.branch}`,
      dayPillar: `${chart.fourPillars.day.stem}${chart.fourPillars.day.branch}`,
      hourPillar: `${chart.fourPillars.hour.stem}${chart.fourPillars.hour.branch}`
    };
  } catch {
    return DEFAULT_PILLARS;
  }
}
