"use client";

import { ChevronDown, CircleX, ScrollText } from "lucide-react";
import { useEffect, useState } from "react";
import { calculateDailyAlmanac, type AlmanacOutput } from "taibu-core/almanac";
import { cn } from "@/lib/utils";

export function DailyAlmanac({ dateKey }: { dateKey: string }) {
  const [result, setResult] = useState<AlmanacOutput | null>(null);
  const [failedDate, setFailedDate] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;

    void calculateDailyAlmanac({ date: dateKey })
      .then((nextResult) => {
        if (active) {
          setResult(nextResult);
          setFailedDate("");
        }
      })
      .catch(() => {
        if (active) setFailedDate(dateKey);
      });

    return () => {
      active = false;
    };
  }, [dateKey, retryCount]);

  const currentResult = result?.date === dateKey ? result : null;
  const failed = failedDate === dateKey;

  return (
    <section aria-labelledby="daily-almanac-heading" className="mx-3 mt-4 overflow-hidden rounded-[24px] border border-[#e5d8bc] bg-[#fffdf7] shadow-soft">
      <div className="flex items-center gap-3 border-b border-[#ebe7dd] px-5 py-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f2f0e8] text-gold">
          <ScrollText size={21} strokeWidth={1.7} aria-hidden="true" />
        </span>
        <div>
          <h2 id="daily-almanac-heading" className="text-[18px] font-semibold">当日黄历</h2>
          <p className="mt-0.5 text-[12px] text-mutedInk">所选日期的传统历法信息</p>
        </div>
      </div>

      {!currentResult && !failed ? <AlmanacSkeleton /> : null}
      {failed ? (
        <div className="flex flex-col items-center px-5 py-8 text-center" role="alert">
          <CircleX size={26} className="text-[var(--color-danger)]" aria-hidden="true" />
          <p className="mt-3 text-[14px] font-medium">黄历信息暂时无法读取</p>
          <button type="button" onClick={() => setRetryCount((count) => count + 1)} className="mt-4 h-10 rounded-xl border border-[#c9a551] px-4 text-[14px] font-semibold text-gold">重新加载</button>
        </div>
      ) : null}
      {currentResult ? <AlmanacContent result={currentResult} /> : null}
    </section>
  );
}

function AlmanacSkeleton() {
  return (
    <div className="space-y-4 px-5 py-5" role="status" aria-label="正在加载黄历信息">
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }, (_, index) => <span key={index} className="h-14 animate-pulse rounded-xl bg-[#f2f0e8]" />)}
      </div>
      <span className="block h-20 animate-pulse rounded-xl bg-[#f2f0e8]" />
      <span className="block h-20 animate-pulse rounded-xl bg-[#f2f0e8]" />
    </div>
  );
}

function AlmanacContent({ result }: { result: AlmanacOutput }) {
  const { almanac } = result;
  const valueGod = [almanac.tianShen, almanac.tianShenType, almanac.tianShenLuck].filter(Boolean).join(" · ");
  const mansion = [almanac.lunarMansion ? `${almanac.lunarMansion}宿` : "", almanac.lunarMansionLuck].filter(Boolean).join(" · ");
  const directions = [
    `财神${almanac.directions.caiShen}`,
    `喜神${almanac.directions.xiShen}`,
    `福神${almanac.directions.fuShen}`
  ].join(" · ");

  return (
    <div>
      <dl className="grid grid-cols-2 border-b border-[#ebe7dd] px-5 py-2">
        <SummaryItem label="冲煞" value={almanac.chongSha} />
        <SummaryItem label="建除" value={almanac.dayOfficer ? `${almanac.dayOfficer}日` : "—"} />
        <SummaryItem label="值神" value={valueGod || "—"} />
        <SummaryItem label="星宿" value={mansion || "—"} />
      </dl>

      <div className="space-y-5 px-5 py-5">
        <ActivityList label="宜" items={almanac.suitable} tone="suitable" />
        <ActivityList label="忌" items={almanac.avoid} tone="avoid" />
      </div>

      <details className="group border-t border-[#ebe7dd]">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-5 text-[14px] font-semibold marker:hidden">
          更多黄历
          <ChevronDown size={18} className="text-mutedInk transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <dl className="border-t border-[#ebe7dd] px-5 pb-2 text-[13px]">
          <ExtraRow label="彭祖百忌" value={almanac.pengZuBaiJi || "—"} />
          <ExtraRow label="胎神占方" value={almanac.taiShen || "—"} />
          <ExtraRow label="日柱纳音" value={almanac.nayin || "—"} />
          <ExtraRow label="吉神宜趋" value={formatList(almanac.jishen)} />
          <ExtraRow label="凶煞宜忌" value={formatList(almanac.xiongsha)} />
          <ExtraRow label="神位方位" value={directions} last />
        </dl>
      </details>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-b border-[#ebe7dd] py-3 odd:pr-3 even:border-l even:pl-3 [&:nth-last-child(-n+2)]:border-b-0">
      <dt className="text-[11px] font-semibold tracking-[0.08em] text-gold">{label}</dt>
      <dd className="mt-1.5 break-words text-[13px] font-medium leading-5">{value}</dd>
    </div>
  );
}

function ActivityList({ label, items, tone }: { label: string; items: string[]; tone: "suitable" | "avoid" }) {
  const values = items.length ? items : ["无"];
  return (
    <div className="grid grid-cols-[36px_1fr] items-start gap-3">
      <h3 className={cn("flex h-9 w-9 items-center justify-center rounded-full text-[16px] font-bold text-white", tone === "suitable" ? "bg-[#1f6b37]" : "bg-[#b42318]")}>{label}</h3>
      <ul className="flex min-h-9 flex-wrap items-center gap-2" aria-label={`${label}事项`}>
        {values.map((item) => <li key={item} className="rounded-full bg-[#f2f0e8] px-3 py-1.5 text-[13px] leading-5">{item}</li>)}
      </ul>
    </div>
  );
}

function ExtraRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={cn("grid grid-cols-[72px_1fr] gap-3 py-3.5", !last && "border-b border-[#ebe7dd]")}>
      <dt className="text-mutedInk">{label}</dt>
      <dd className="text-right font-medium leading-5">{value}</dd>
    </div>
  );
}

function formatList(items: string[]) {
  return items.length ? items.join("、") : "—";
}
