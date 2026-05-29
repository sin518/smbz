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
      <div className="rounded-[12px] border border-[var(--color-row-border)] bg-[var(--color-surface)] px-4 py-4 text-[var(--color-ink)] shadow-[0_8px_24px_rgba(16,14,10,0.04)]">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-[var(--color-control-border)] bg-[var(--color-control)] text-[var(--color-icon)]">
            <Icon size={18} strokeWidth={1.9} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold leading-5 text-[var(--color-ink)]">{title}</p>
            <p className="mt-1 text-[12px] leading-5 text-[var(--color-muted-ink)]">{subtitle}</p>
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="mt-3 flex min-h-10 w-full items-center justify-center gap-1 rounded-full border border-[var(--color-control-border)] bg-[var(--color-control)] px-3 py-2 text-center text-[13px] font-semibold leading-5 text-[var(--color-icon)] transition hover:brightness-95"
            >
              <span>{expanded ? "收起确定性报告" : actionText}</span>
              <ToggleIcon size={15} strokeWidth={2} />
            </button>
          </div>
        </div>

        {expanded ? (
          <section className="mt-4 rounded-[12px] border border-[var(--color-row-border)] bg-[var(--color-surface)] p-3 text-[var(--color-ink)]">
            <p className="text-[12px] leading-5 text-[var(--color-muted-ink)]">{report.summary}</p>
            <div className="mt-3 space-y-3">
              {report.sections.map((section) => (
                <article key={section.title} className="rounded-[8px] border border-[var(--color-row-border)] bg-[var(--color-control)] px-3 py-2">
                  <h4 className="text-[13px] font-semibold leading-5 text-[var(--color-icon)]">{section.title}</h4>
                  <div className="mt-1 space-y-1 text-[12px] leading-5 text-[var(--color-muted-ink)]">
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
