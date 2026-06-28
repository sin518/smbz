"use client";

// 需要 useState 让用户切换是否把地支藏干计入力量统计。
import { SlidersHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { buildFiveElementStats, type FiveElementStats } from "@/lib/bazi/five-elements";
import type { ChartColumn } from "@/lib/bazi/demo";
import { cn } from "@/lib/utils";

type BaziFiveElementsPanelProps = {
  columns: ChartColumn[];
};

const elementColors: Record<FiveElementStats["element"], string> = {
  木: "bg-[#67a66b]",
  火: "bg-[#d85b48]",
  土: "bg-[#b99555]",
  金: "bg-[#c6a25a]",
  水: "bg-[#5c8fc8]"
};

export function BaziFiveElementsPanel({ columns }: BaziFiveElementsPanelProps) {
  const [includeHiddenStems, setIncludeHiddenStems] = useState(true);
  const stats = useMemo(() => buildFiveElementStats(columns, includeHiddenStems), [columns, includeHiddenStems]);

  return (
    <div className="border-b border-[#f3ead6] py-4">
      <section className="rounded-[12px] border border-[#eee1c8] bg-white px-4 py-4 text-ink shadow-[0_8px_24px_rgba(16,14,10,0.04)]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border border-[#e7dcc7] bg-[#f8f3e8] text-[#9a792c]">
              <SlidersHorizontal size={16} strokeWidth={1.9} />
            </span>
            <div className="min-w-0">
              <p className="text-[15px] font-semibold leading-5">五行</p>
              <p className="mt-0.5 text-[12px] leading-4 text-mutedInk">按基本排盘自动计算</p>
            </div>
          </div>
          <label className="flex shrink-0 items-center gap-2 text-[12px] font-medium text-mutedInk">
            <span>计藏干</span>
            <button
              type="button"
              role="switch"
              aria-checked={includeHiddenStems}
              onClick={() => setIncludeHiddenStems((value) => !value)}
              className={cn(
                "relative h-5 w-9 rounded-full border transition",
                includeHiddenStems ? "border-[#c7924d] bg-[#d09a58]" : "border-[#d7d1c4] bg-[#ece7dc]"
              )}
            >
              <span
                className={cn(
                  "absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white shadow-sm transition",
                  includeHiddenStems ? "left-[17px]" : "left-[1px]"
                )}
              />
            </button>
          </label>
        </div>

        <div className="grid grid-cols-[44px_repeat(5,minmax(0,1fr))] gap-y-2 text-center text-[12px]">
          <FiveElementRowLabel>力量</FiveElementRowLabel>
          {stats.map((item) => (
            <PowerCell key={`power-${item.element}`} item={item} />
          ))}
          <FiveElementRowLabel>十神数量</FiveElementRowLabel>
          {stats.map((item) => (
            <p key={`god-${item.element}`} className="font-semibold leading-6 text-[#6d6a62]">{item.tenGodCount}</p>
          ))}
        </div>
      </section>
    </div>
  );
}

function FiveElementRowLabel({ children }: { children: ReactNode }) {
  return <p className="flex items-center text-left text-[11px] font-semibold text-mutedInk">{children}</p>;
}

function PowerCell({ item }: { item: FiveElementStats }) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-[13px] font-semibold leading-5 text-[#5d5a52]">{item.element}</p>
      <div className="mx-auto flex h-10 w-3 items-end overflow-hidden rounded-full bg-[#eee9dd]">
        <div
          className={cn("mt-auto block w-full rounded-full", elementColors[item.element])}
          style={{ height: `${Math.max(item.percentage, item.power > 0 ? 8 : 0)}%` }}
        />
      </div>
      <p className="mt-1 whitespace-nowrap text-[11px] font-semibold leading-4 text-mutedInk">{formatPercentage(item.percentage)}</p>
    </div>
  );
}

function formatPercentage(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(1)}%`;
}
