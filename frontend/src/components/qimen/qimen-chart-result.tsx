"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { QimenOutput } from "taibu-core/qimen";
import { QimenAiCommandModal } from "@/components/qimen/qimen-ai-command-modal";
import { QimenPalacePanel } from "@/components/qimen/qimen-palace-panel";
import { ProtectedAiCommandAction } from "@/components/shared/protected-ai-command-action";
import { saveLocalQimenRecord } from "@/lib/divination/local-records";
import { calculateQimenChart } from "@/lib/qimen-api";
import { consumeExplicitSaveIntent } from "@/lib/records/save-intent";

type QimenChart = QimenOutput;
type QimenPlateType = "zhuan";

interface StoredQimenResult {
  chart: QimenChart;
  input?: {
    name?: string;
    gender?: string;
    divinationType?: string;
    dateTime?: string;
    birthYear?: number;
    location?: string;
    method?: "time" | "question";
    question?: string;
    plateType?: QimenPlateType;
    juMethod?: "chaibu" | "maoshan";
    zhiFuJiGong?: "ji_liuyi" | "ji_wugong";
    manualDunType?: "yin" | "yang";
    manualJu?: number;
    juMode?: "auto" | "manual";
  };
  savedAt: string;
}

export function QimenChartResult() {
  const [result, setResult] = useState<StoredQimenResult | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem("sm1:current-qimen-result") ?? window.localStorage.getItem("sm1:last-qimen-input");

    if (raw) {
      void (async () => {
      try {
        const parsed = JSON.parse(raw) as StoredQimenResult;
        const recalculatedChart =
          parsed.input?.dateTime
            ? await calculateQimenChart({
                ...parseDateTimeLocal(parsed.input.dateTime),
                timezone: "Asia/Shanghai",
                question: parsed.input.question,
                birthYear: parsed.input.birthYear,
                panType: parsed.input.plateType ?? "zhuan",
                juMethod: parsed.input.juMethod ?? "chaibu",
                zhiFuJiGong: parsed.input.zhiFuJiGong ?? "ji_liuyi"
              })
            : null;

        if (!recalculatedChart) {
          setResult(null);
          return;
        }

        const nextResult = { ...parsed, chart: recalculatedChart };
        if (consumeExplicitSaveIntent("qimen", nextResult.savedAt)) {
          void saveLocalQimenRecord(nextResult);
        }
        setResult(nextResult);
      } catch {
        setResult(null);
      }
      setLoaded(true);
      })();
      return;
    }

    setLoaded(true);
  }, []);

  return (
    <main className="light-surface-text-scope app-responsive-shell min-h-screen bg-paper pb-5 text-ink shadow-soft [font-family:'PingFang_SC','Microsoft_YaHei',sans-serif]">
      <header className="sticky top-0 z-20 flex h-20 items-center justify-between bg-[#F8F7EE] px-[15px] pb-2 pt-6">
        <div className="flex items-center justify-between">
          <Link href="/qimen" className="-ml-1 flex h-10 w-10 items-center justify-center" aria-label="返回奇门遁甲">
            <ArrowLeft size={24} />
          </Link>
        </div>
        <h1 className="text-[18px] font-medium">奇门排盘</h1>
        <span className="h-10 w-10" aria-hidden="true" />
      </header>

      {result ? (
        <>
          <ResultInfoPanel result={result} />
          <QimenPillarBar chart={result.chart} />
          <QimenChartCard result={result} />
        </>
      ) : null}

      {loaded && !result ? (
        <section className="mx-4 rounded-[22px] bg-white p-5 text-center shadow-soft">
          <p className="text-[18px] font-semibold">还没有排盘结果</p>
          <p className="mt-2 text-[14px] leading-6 text-mutedInk">返回填写页，提交后会在这里展示九宫盘。</p>
          <Link href="/qimen" className="mt-4 inline-flex h-11 items-center rounded-full bg-black px-6 text-[17px] font-semibold text-[#e8d4a7]">
            去排盘
          </Link>
        </section>
      ) : null}
    </main>
  );
}

function ResultInfoPanel({ result }: { result: StoredQimenResult }) {
  const input = result.input;
  const chart = result.chart;

  return (
    <section className="mx-4 rounded-[22px] bg-white px-4 py-4 text-[14px] font-normal leading-[1.8] text-mutedInk shadow-soft">
      <InfoLine label="起局时间" value={`${formatChineseSolar(chart.dateInfo.solarDate)} ${chart.dateInfo.lunarDate}`} />
      {input?.birthYear ? (
        <InfoLine
          label="求测主体"
          value={`${input.birthYear}年${chart.birthYearGanZhi ? `（${chart.birthYearGanZhi}）` : ""}`}
        />
      ) : null}
      {chart.nianMing ? <InfoLine label="年命定位" value={formatNianMingCoordinate(chart)} /> : null}
      <InfoLine label="节气信息" value={`${chart.dateInfo.solarTerm}${chart.yuan}`} />
      <InfoLine label="奇门类型" value={chart.panType} />
      <InfoLine label="定局法" value={chart.juMethod} />
      <InfoLine label="直符寄宫" value={formatZhiFuJiGong(input?.zhiFuJiGong)} />
      {input?.question?.trim() ? <InfoLine label="占事" value={input.question.trim()} /> : null}
    </section>
  );
}

function formatNianMingCoordinate(chart: QimenChart) {
  const hiddenStem = chart.nianMing === "甲" && chart.nianMingReferenceStem
    ? ` · 遁${chart.nianMingReferenceStem}`
    : "";
  const palace = chart.nianMingPalace
    ? ` · 天盘${chart.nianMingPalace.palaceName}${chart.nianMingPalace.palaceIndex}宫`
    : "";
  return `${chart.nianMing}命${hiddenStem}${palace}`;
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <p className="min-w-0">
      <span>{label}：</span>
      <b className="break-words font-semibold text-ink">{value}</b>
    </p>
  );
}

function QimenPillarBar({ chart }: { chart: QimenChart }) {
  return (
    <section className="px-4 pt-4">
      <div className="grid grid-cols-4 rounded-full bg-black px-4 py-2 text-center text-[13px] font-normal leading-snug text-[#e8d4a7]">
        <span>年 {chart.siZhu.year}</span>
        <span>月 {chart.siZhu.month}</span>
        <span>日 {chart.siZhu.day}</span>
        <span>时 {chart.siZhu.hour}</span>
      </div>
    </section>
  );
}

function QimenChartCard({ result }: { result: StoredQimenResult }) {
  const chart = result.chart;
  const [isAiCommandOpen, setIsAiCommandOpen] = useState(false);

  return (
    <section className="qimen-chart-scope mx-2 mt-4 rounded-[18px] bg-[var(--color-surface)] px-2 py-4 shadow-soft min-[360px]:mx-4 min-[360px]:rounded-[22px] min-[360px]:px-3">
      <QimenPalacePanel chart={chart} />
      <ProtectedAiCommandAction
        loginNextHref="/qimen/result"
        onAuthorized={() => setIsAiCommandOpen(true)}
        expanded={isAiCommandOpen}
        className="mt-3"
      />
      {isAiCommandOpen ? (
        <QimenAiCommandModal
          chart={chart}
          onClose={() => setIsAiCommandOpen(false)}
        />
      ) : null}
    </section>
  );
}

function formatChineseSolar(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?$/.exec(value);
  if (!match) {
    return value;
  }

  return `${match[1]}年${match[2]}月${match[3]}日${match[4] ? ` ${match[4]}:${match[5]}` : ""}`;
}


function parseDateTimeLocal(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) {
    throw new Error("起局时间格式无效");
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5])
  };
}

function formatZhiFuJiGong(value: "ji_liuyi" | "ji_wugong" | undefined) {
  return value === "ji_wugong" ? "寄戊宫" : "寄六仪";
}
