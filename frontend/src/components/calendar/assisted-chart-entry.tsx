"use client";

import {
  ArrowLeft,
  ChevronRight,
  CircleDot,
  Clock3,
  Compass,
  Hexagon,
  ScrollText,
  Stars,
  X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { AccessibleDialog } from "@/components/shared/accessible-dialog";
import { buildAssistedChartHref, type AssistedChartKind } from "@/lib/divination-entry";
import { cn } from "@/lib/utils";

type SelectedDate = {
  year: number;
  month: number;
  day: number;
  lunarDateLabel: string;
};

type ChartOption = {
  kind: AssistedChartKind;
  name: string;
  description: string;
  icon: LucideIcon;
};

const chartOptions: ChartOption[] = [
  { kind: "bazi", name: "八字排盘", description: "以出生时间推演四柱命盘", icon: CircleDot },
  { kind: "ziwei", name: "紫微斗数", description: "以出生时间建立紫微命盘", icon: Stars },
  { kind: "qimen", name: "奇门遁甲", description: "以所选时刻起局辅助决策", icon: Compass },
  { kind: "daliuren", name: "大六壬", description: "以所选时刻起课问事", icon: ScrollText },
  { kind: "liuyao", name: "六爻排盘", description: "以所选时刻作为起卦时间", icon: Hexagon }
];

const shichenOptions = [
  { branch: "子", range: "23–01", time: "00:00" },
  { branch: "丑", range: "01–03", time: "02:00" },
  { branch: "寅", range: "03–05", time: "04:00" },
  { branch: "卯", range: "05–07", time: "06:00" },
  { branch: "辰", range: "07–09", time: "08:00" },
  { branch: "巳", range: "09–11", time: "10:00" },
  { branch: "午", range: "11–13", time: "12:00" },
  { branch: "未", range: "13–15", time: "14:00" },
  { branch: "申", range: "15–17", time: "16:00" },
  { branch: "酉", range: "17–19", time: "18:00" },
  { branch: "戌", range: "19–21", time: "20:00" },
  { branch: "亥", range: "21–23", time: "22:00" }
] as const;

export function AssistedChartEntry({ date }: { date: SelectedDate }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <section aria-labelledby="assisted-chart-heading" className="mx-3 mt-4 overflow-hidden rounded-[24px] border border-[#e5d8bc] bg-[#fffdf7] shadow-soft">
        <div className="flex items-center gap-3 px-5 py-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f1e5c7] text-gold" aria-hidden="true">
            <Clock3 size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="assisted-chart-heading" className="text-[17px] font-semibold text-ink">辅助排盘</h2>
            <p className="mt-1 text-[13px] leading-5 text-mutedInk">选择时辰，带入八字、紫微、奇门、大六壬或六爻</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-10 shrink-0 items-center gap-1 rounded-xl border border-[#c9a551] px-3 text-[14px] font-semibold text-gold"
            aria-label={`为${date.year}年${date.month}月${date.day}日选择时辰并排盘`}
          >
            去排盘
            <ChevronRight size={17} />
          </button>
        </div>
      </section>
      {open ? <AssistedChartSheet date={date} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function AssistedChartSheet({ date, onClose }: { date: SelectedDate; onClose: () => void }) {
  const router = useRouter();
  const titleId = useId();
  const [step, setStep] = useState<"time" | "chart">("time");
  const [time, setTime] = useState("");

  const selectedShichen = time ? getShichen(time) : null;
  const dateLabel = `${date.year}年${date.month}月${date.day}日`;
  const dateTime = time ? `${formatNumber(date.year, 4)}-${formatNumber(date.month)}-${formatNumber(date.day)}T${time}` : "";

  return (
    <AccessibleDialog
      open
      onClose={onClose}
      labelledBy={titleId}
      className="max-h-[88dvh] overflow-y-auto rounded-t-[28px] bg-[#fffdf7] px-5 pb-[calc(24px+env(safe-area-inset-bottom))] pt-4"
    >
      <div className="grid grid-cols-[44px_1fr_44px] items-center">
        {step === "chart" ? (
          <button type="button" onClick={() => setStep("time")} className="flex h-11 w-11 items-center justify-center rounded-full" aria-label="返回选择时辰">
            <ArrowLeft size={22} />
          </button>
        ) : <span />}
        <h2 id={titleId} className="text-center text-[19px] font-semibold">{step === "time" ? "选择时辰" : "选择排盘"}</h2>
        <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-full" aria-label="关闭辅助排盘">
          <X size={22} />
        </button>
      </div>

      <div className="mt-3 rounded-2xl bg-[#f4efe2] px-4 py-3 text-center">
        <p className="text-[16px] font-semibold text-ink">{dateLabel}</p>
        <p className="mt-1 text-[13px] text-mutedInk">{date.lunarDateLabel}</p>
      </div>

      {step === "time" ? (
        <>
          <label htmlFor="assisted-chart-time" className="mt-5 block text-[14px] font-semibold text-mutedInk">精确时间</label>
          <div className="mt-2 flex items-center gap-3 rounded-2xl border border-[#e5d8bc] bg-white px-4">
            <Clock3 size={20} className="text-gold" aria-hidden="true" />
            <input
              id="assisted-chart-time"
              data-dialog-autofocus
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              className="h-[52px] min-w-0 flex-1 bg-transparent py-3 text-[18px] font-semibold text-ink outline-none"
            />
            <span className="min-w-[42px] text-right text-[14px] font-semibold text-gold">{selectedShichen ? `${selectedShichen}时` : "未选"}</span>
          </div>

          <fieldset className="mt-5">
            <legend className="text-[14px] font-semibold text-mutedInk">十二时辰快捷选择</legend>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {shichenOptions.map((option) => {
                const selected = selectedShichen === option.branch;
                return (
                  <button
                    key={option.branch}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setTime(option.time)}
                    className={cn(
                      "rounded-xl border px-1 py-2.5 transition-colors",
                      selected ? "border-[#a58024] bg-[#765b18] text-white" : "border-[#e5d8bc] bg-white text-ink"
                    )}
                  >
                    <span className="block text-[17px] font-semibold">{option.branch}时</span>
                    <span className={cn("mt-1 block text-[10px]", selected ? "text-[#f7e7bd]" : "text-mutedInk")}>{option.range}点</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <p className="mt-3 text-[12px] leading-5 text-mutedInk">快捷选择会填入该时辰的代表时间，也可以在上方输入精确到分钟的时间。</p>
          <button
            type="button"
            disabled={!time}
            onClick={() => setStep("chart")}
            className="mt-5 h-12 w-full rounded-xl bg-[#a58024] text-[16px] font-semibold text-white disabled:opacity-40"
          >
            下一步：选择排盘
          </button>
        </>
      ) : (
        <div className="mt-5">
          <p className="text-[14px] text-mutedInk">已选 {time} · {selectedShichen}时</p>
          <div className="mt-3 space-y-2">
            {chartOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.kind}
                  type="button"
                  onClick={() => router.push(buildAssistedChartHref(option.kind, dateTime))}
                  className="flex min-h-[68px] w-full items-center gap-3 rounded-2xl border border-[#e5d8bc] bg-white px-4 text-left transition-colors hover:bg-[#faf5e8]"
                  aria-label={`进入${option.name}，已预填${dateLabel}${time}`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f1e5c7] text-gold" aria-hidden="true"><Icon size={21} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[16px] font-semibold text-ink">{option.name}</span>
                    <span className="mt-1 block text-[12px] text-mutedInk">{option.description}</span>
                  </span>
                  <ChevronRight size={19} className="shrink-0 text-gold" aria-hidden="true" />
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-center text-[12px] text-mutedInk">进入后会预填所选时间，其余资料仍可继续填写和修改。</p>
        </div>
      )}
    </AccessibleDialog>
  );
}

function getShichen(time: string) {
  const hour = Number(time.slice(0, 2));
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) return null;
  const index = Math.floor(((hour + 1) % 24) / 2);
  return shichenOptions[index]?.branch ?? null;
}

function formatNumber(value: number, length = 2) {
  return String(value).padStart(length, "0");
}
