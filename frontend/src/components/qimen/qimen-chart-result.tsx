"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { QimenOutput } from "taibu-core/qimen";
import { QimenAiCommandModal } from "@/components/qimen/qimen-ai-command-modal";
import { ProtectedAiCommandAction } from "@/components/shared/protected-ai-command-action";
import { saveLocalQimenRecord } from "@/lib/divination/local-records";
import { calculateQimenChart } from "@/lib/qimen-api";

type QimenChart = QimenOutput;
type QimenPlateType = "zhuan";

interface StoredQimenResult {
  chart: QimenChart;
  input?: {
    name?: string;
    gender?: string;
    divinationType?: string;
    dateTime?: string;
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
        saveLocalQimenRecord(nextResult);
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
          <p className="mt-2 text-[14px] leading-6 text-[#7d7972]">返回填写页，提交后会在这里展示九宫盘。</p>
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
      <InfoLine label="节气信息" value={`${chart.dateInfo.solarTerm}${chart.yuan}`} />
      <InfoLine label="奇门类型" value={chart.panType} />
      <InfoLine label="定局法" value={chart.juMethod} />
      <InfoLine label="直符寄宫" value={formatZhiFuJiGong(input?.zhiFuJiGong)} />
      {input?.question?.trim() ? <InfoLine label="占事" value={input.question.trim()} /> : null}
    </section>
  );
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
    <section className="mx-4 mt-4 rounded-[22px] bg-white px-3 py-4 shadow-soft">
      <div className="border-y border-[#d7d7d7] py-2">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] text-[#8b8b8b]">
          {ELEMENT_LEGEND.map((item) => (
            <span key={item.label} className="flex items-center gap-1">
              <i className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.label}{chart.monthPhase?.[item.representativeStem] ?? ""}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-md border border-[#3a3a3a] bg-[#090909]">
        <div className="grid grid-cols-3">
          {getDisplayPalaces(chart).map((palace) => (
            <QimenPalaceCell key={palace.palaceIndex} chart={chart} palace={palace} />
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-[13px] leading-5 text-[#6f6a63]">
        <InfoPill label="节气" value={`${chart.dateInfo.solarTerm}${chart.yuan}`} />
        <InfoPill label="时柱" value={chart.siZhu.hour} />
        <InfoPill label="旬首" value={chart.xunShou} />
        <InfoPill label="值使" value={`${chart.zhiShi.gate}落${chart.zhiShi.palace}宫`} />
      </div>
      <p className="mt-4 text-[14px] leading-6 text-[#7d7972]">
        {chart.dateInfo.solarDate}。值符{chart.zhiFu.star}落{chart.zhiFu.palace}宫。
      </p>
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

function QimenPalaceCell({ chart, palace }: { chart: QimenChart; palace: QimenChart["palaces"][number] }) {
  if (palace.palaceIndex === 5) {
    return (
      <div className="relative flex min-h-[142px] items-center justify-center border border-[#202020] p-2 text-center">
        <span className="absolute left-1.5 top-1 text-[10px] text-[#565656]">{palace.palaceName}</span>
        <div>
          <p className="text-[12px] text-[#858585]">{chart.dunType === "yang" ? "阳遁" : "阴遁"}</p>
          <p className="mt-1 text-[20px] font-semibold text-[#efefef]">{chart.juNumber}局</p>
          <p className="mt-1 text-[12px] text-[#686868]">中五宫</p>
        </div>
      </div>
    );
  }

  const voidLabels = getVoidLabels(chart, palace.palaceIndex);

  return (
    <div className="relative min-h-[142px] border border-[#202020] px-2 pb-6 pt-7 text-[12px] leading-[1.55] text-[#949494]">
      <span className="absolute left-1.5 top-1 text-[10px] text-[#565656]">{palace.palaceName}</span>
      <div className="grid grid-cols-[minmax(0,1fr)_32px] gap-1">
        <div>
          <p className="text-[19px] font-semibold leading-none" style={{ color: getStemColor(palace.heavenStem) }}>
            {palace.heavenStem || "-"}
          </p>
          <p className="mt-3">{palace.star || "-"}</p>
          <p>{palace.gate || "中宫"}</p>
          <p className="mt-1 text-[11px] text-[#6f6f6f]">星{formatElement(palace.starElement)}</p>
          <p className="text-[11px] text-[#6f6f6f]">宫{formatElement(palace.element)}</p>
        </div>
        <div className="flex flex-col items-end">
          <p className="whitespace-nowrap text-[12px] text-[#a0a0a0]">{palace.deity || "-"}</p>
          <p className="mt-8 text-[19px] font-semibold leading-none" style={{ color: getStemColor(palace.earthStem) }}>
            {palace.earthStem || "-"}
          </p>
          <p className="mt-auto whitespace-nowrap text-[11px] text-[#6f6f6f]">门{formatElement(palace.gateElement)}</p>
        </div>
      </div>
      <div className="absolute bottom-1.5 left-2 flex items-center gap-1.5 text-[11px] leading-none">
        {voidLabels.length ? <span className="text-[#d2a900]">◎</span> : null}
        {palace.isYiMa ? <span className="text-[#00c8c8]">马</span> : null}
      </div>
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-[#f7f6f3] px-3 py-2">
      <p className="text-[12px] text-[#a29d94]">{label}</p>
      <p className="truncate font-semibold text-[#3b3935]">{value}</p>
    </div>
  );
}

function formatChineseSolar(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?$/.exec(value);
  if (!match) {
    return value;
  }

  return `${match[1]}年${match[2]}月${match[3]}日${match[4] ? ` ${match[4]}:${match[5]}` : ""}`;
}

function getVoidLabels(chart: QimenChart, palaceNumber: number) {
  const labels: string[] = [];

  if (chart.kongWang.dayKong.palaces.includes(palaceNumber)) {
    labels.push("日\n空");
  }

  if (chart.kongWang.hourKong.palaces.includes(palaceNumber)) {
    labels.push("时\n空");
  }

  return labels;
}

const ELEMENT_COLORS: Record<string, string> = {
  木: "#00d66b",
  火: "#ff3038",
  水: "#3184ff",
  金: "#ff9d00",
  土: "#8c8c8c"
};

const ELEMENT_LEGEND = [
  { label: "木", representativeStem: "甲", color: ELEMENT_COLORS.木 },
  { label: "火", representativeStem: "丙", color: ELEMENT_COLORS.火 },
  { label: "水", representativeStem: "壬", color: ELEMENT_COLORS.水 },
  { label: "金", representativeStem: "庚", color: ELEMENT_COLORS.金 },
  { label: "土", representativeStem: "戊", color: ELEMENT_COLORS.土 }
] as const;

const STEM_COLORS: Record<string, string> = {
  甲: "#3184ff",
  乙: "#3184ff",
  丙: "#00d66b",
  丁: "#00d66b",
  戊: "#ff3038",
  己: "#ff3038",
  庚: "#8c8c8c",
  辛: "#8c8c8c",
  壬: "#ff9d00",
  癸: "#ff9d00"
};

function getStemColor(stem: string | undefined) {
  return stem ? STEM_COLORS[stem] ?? "#a0a0a0" : "#a0a0a0";
}

function formatElement(element: string | undefined) {
  return element || "-";
}

const PALACE_DISPLAY_ORDER = [4, 9, 2, 3, 5, 7, 8, 1, 6];

function getDisplayPalaces(chart: QimenChart) {
  return PALACE_DISPLAY_ORDER.map((palaceIndex) => chart.palaces.find((palace) => palace.palaceIndex === palaceIndex)).filter((palace): palace is QimenChart["palaces"][number] => Boolean(palace));
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
