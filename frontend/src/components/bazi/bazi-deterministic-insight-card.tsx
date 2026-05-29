"use client";

import { ChevronDown, ChevronUp, Save, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { buildBaziDeterministicReport, type BaziDeterministicReportType } from "@/lib/bazi/deterministic-report";
import type { DemoBaziChart } from "@/lib/bazi/demo";
import { cn } from "@/lib/utils";

type BaziDeterministicInsightCardProps = {
  chart: DemoBaziChart;
  type: BaziDeterministicReportType;
  title: string;
  subtitle: string;
  actionText: string;
  last?: boolean;
};

export function BaziDeterministicInsightCard({
  chart,
  type,
  title,
  subtitle,
  actionText,
  last
}: BaziDeterministicInsightCardProps) {
  const [expanded, setExpanded] = useState(false);
  const report = useMemo(() => buildBaziDeterministicReport(chart, type), [chart, type]);
  const Icon = type === "wuxing" ? Save : UserRound;
  const ToggleIcon = expanded ? ChevronUp : ChevronDown;

  return (
    <div className={cn("border-b border-[#f3ead6] py-4", last && "border-b-0")}>
      <div className="rounded-[8px] border border-[#343434] bg-[#101010] px-4 py-4 text-white">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] border border-[#2f2f2f] bg-[#0b0b0b]">
            <Icon size={18} strokeWidth={1.9} className={type === "wuxing" ? "text-[#00b8ff]" : "text-[#9b6cff]"} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold leading-5 text-white">{title}</p>
            <p className="mt-1 text-[12px] leading-5 text-[#8f8f8f]">{subtitle}</p>
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="mt-3 flex min-h-10 w-full items-center justify-center gap-1 rounded-[4px] border border-[#4c3f11] bg-[#f8f4e8] px-3 py-2 text-center text-[13px] font-semibold leading-5 text-[#1f2328] transition hover:bg-white"
            >
              <span>{expanded ? "收起确定性报告" : actionText}</span>
              <ToggleIcon size={15} strokeWidth={2} />
            </button>
          </div>
        </div>

        {expanded ? (
          <section className="mt-4 rounded-[8px] border border-[#2f3b48] bg-[#111820] p-3 text-[#d7e0ea]">
            <p className="text-[12px] leading-5 text-[#a8b4c2]">{report.summary}</p>
            <div className="mt-3 space-y-3">
              {report.sections.map((section) => (
                <article key={section.title} className="rounded-[6px] bg-black/20 px-3 py-2">
                  <h4 className="text-[13px] font-semibold leading-5 text-white">{section.title}</h4>
                  <div className="mt-1 space-y-1 text-[12px] leading-5 text-[#bdc7d4]">
                    {section.body.split("\n").map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
