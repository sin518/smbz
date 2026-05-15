"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { calculateQimenChart, type DunType, type QimenChart, type QimenPlateType } from "@/lib/qimen";

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
    manualDunType?: DunType;
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
      try {
        const parsed = JSON.parse(raw) as StoredQimenResult;
        const recalculatedChart =
          parsed.input?.dateTime && parsed.input.location
            ? calculateQimenChart({
                dateTime: parsed.input.dateTime,
                location: parsed.input.location,
                method: parsed.input.method ?? "question",
                question: parsed.input.question,
                plateType: parsed.input.plateType,
                manualDunType: parsed.input.juMode === "manual" ? parsed.input.manualDunType : undefined,
                manualJu: parsed.input.juMode === "manual" ? parsed.input.manualJu : undefined
              })
            : parsed.chart;

        setResult({ ...parsed, chart: recalculatedChart });
      } catch {
        setResult(null);
      }
    }

    setLoaded(true);
  }, []);

  return (
    <main className="light-surface-text-scope mx-auto min-h-screen max-w-[430px] bg-paper pb-5 text-ink shadow-soft [font-family:'PingFang_SC','Microsoft_YaHei',sans-serif]">
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
          <QimenChartCard chart={result.chart} />
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
      <div className="flex gap-10">
        <InfoLine label="姓名" value={input?.name?.trim() || "未填写"} />
        <InfoLine label="性别" value={input?.gender === "female" ? "女" : "男"} />
      </div>
      <InfoLine label="起局时间" value={`${formatChineseSolar(chart.solarText)} ${chart.lunarText}`} />
      <InfoLine label="节气信息" value={`${chart.solarTerm.name}${chart.solarTerm.yuan}`} />
      <InfoLine label="求测类型" value={formatDivinationType(input?.divinationType)} />
      <InfoLine label="求测问题" value={input?.question?.trim() || "未填写"} />
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
        <span>年 {formatPillar(chart.pillars.year)}</span>
        <span>月 {formatPillar(chart.pillars.month)}</span>
        <span>日 {formatPillar(chart.pillars.day)}</span>
        <span>时 {formatPillar(chart.pillars.hour)}</span>
      </div>
    </section>
  );
}

function QimenChartCard({ chart }: { chart: QimenChart }) {
  return (
    <section className="mx-4 mt-4 rounded-[22px] bg-white px-3 py-4 shadow-soft">
      <h2 className="rounded-full bg-[#f2f2f0] py-[7px] text-center text-[16px] font-medium text-ink">九宫盘</h2>
      <div className="mt-3 grid grid-cols-4 border-b border-[#eaded2] bg-[#f6f0e2] px-2 py-2 text-center text-[12px] font-semibold text-[#6f5a25]">
        <span>{chart.plateType === "zhuan" ? "转盘" : "飞盘"}</span>
        <span>{chart.dunType === "yang" ? "阳遁" : "阴遁"}{chart.ju}局</span>
        <span>值符：{chart.zhiFu.star}</span>
        <span>值使：{chart.zhiShi.gate}</span>
      </div>

      <div className="overflow-hidden rounded-b-md border-x border-b border-[#eaded2] bg-[#fffdf7]">
        <div className="grid grid-cols-3 bg-[#fdfbf4]">
        {chart.palaces.map((palace) => (
          <div key={palace.number} className="relative min-h-[118px] border border-[#eaded2] p-2 pb-6 text-[12px] leading-[18px] text-[#2f2d2a]">
            <StatusBadge value={getGateStatus(palace.gate)} />
            <VoidMark labels={getVoidLabels(chart, palace.number)} />
            <div className="grid grid-cols-[1fr_auto] gap-x-1 pr-5">
              <div className="space-y-1">
                <p className={palace.god === "值符" ? "font-semibold text-[#2f8a24]" : undefined}>{palace.god ?? "-"}</p>
                <p>{palace.star}</p>
                <p>{palace.gate ?? "中宫"}</p>
              </div>
            </div>
            <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between text-[12px]">
              <span className="text-[15px] font-semibold">{palace.label}</span>
              <span className="flex flex-col items-end leading-4">
                <span className="text-[#7d7972]">{palace.heavenStem}</span>
                <span className="font-semibold text-[#a58024]">{palace.earthStem}</span>
              </span>
            </div>
          </div>
        ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-[13px] leading-5 text-[#6f6a63]">
        <InfoPill label="节气" value={`${chart.solarTerm.name}${chart.solarTerm.yuan}`} />
        <InfoPill label="时柱" value={`${chart.pillars.hour.stem}${chart.pillars.hour.branch}`} />
        <InfoPill label="旬首" value={`${chart.hourXun.name}${chart.hourXun.leader}`} />
        <InfoPill label="值使" value={`${chart.zhiShi.gate}落${chart.zhiShi.palace}宫`} />
      </div>
      <p className="mt-4 text-[14px] leading-6 text-[#7d7972]">
        {chart.location}，{chart.solarText}。值符{chart.zhiFu.star}落{chart.zhiFu.palace}宫。
      </p>
      <details className="mt-3 rounded-2xl bg-[#f7f6f3] px-3 py-2 text-[13px] leading-6 text-[#77726b]">
        <summary className="cursor-pointer font-medium text-[#3b3935]">计算说明</summary>
        <ul className="mt-2 space-y-1">
          {chart.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </details>
    </section>
  );
}

function StatusBadge({ value }: { value: string | null }) {
  if (!value) {
    return null;
  }

  return (
    <span className="absolute right-2 top-2 rounded bg-black px-1 py-0.5 font-semibold text-[#e8d4a7]">
      {value}
    </span>
  );
}

function VoidMark({ labels }: { labels: string[] }) {
  if (!labels.length) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center gap-3 text-center text-[14px] font-semibold leading-5 text-[#2f8a24]">
      {labels.map((label) => (
        <span key={label} className="whitespace-pre-line">
          {label}
        </span>
      ))}
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

function formatPillar(pillar: QimenChart["pillars"]["year"]) {
  return `${pillar.stem}${pillar.branch}`;
}

function formatChineseSolar(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/.exec(value);
  if (!match) {
    return value;
  }

  return `${match[1]}年${match[2]}月${match[3]}日 ${match[4]}:${match[5]}`;
}

function getGateStatus(gate: string | null) {
  if (!gate) {
    return null;
  }

  const statuses: Record<string, string> = {
    休门: "凶",
    生门: "凶",
    伤门: "休",
    杜门: "旺",
    景门: "相",
    死门: "死",
    惊门: "死",
    开门: "旺"
  };

  return statuses[gate] ?? null;
}

function getVoidLabels(chart: QimenChart, palaceNumber: number) {
  const labels: string[] = [];
  const palaceBranches = PALACE_BRANCHES[palaceNumber] ?? [];
  const dayVoidBranches = getVoidBranches(formatPillar(chart.pillars.day));
  const hourVoidBranches = getVoidBranches(formatPillar(chart.pillars.hour));

  if (dayVoidBranches.some((branch) => palaceBranches.includes(branch))) {
    labels.push("日\n空");
  }

  if (hourVoidBranches.some((branch) => palaceBranches.includes(branch))) {
    labels.push("时\n空");
  }

  return labels;
}

function getVoidBranches(pillar: string) {
  const index = SIXTY_JIAZI.indexOf(pillar);
  if (index < 0) {
    return [];
  }

  return VOID_BRANCHES_BY_XUN[Math.floor(index / 10)] ?? [];
}

const HEAVENLY_STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;
const EARTHLY_BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;
const SIXTY_JIAZI = Array.from({ length: 60 }, (_, index) => `${HEAVENLY_STEMS[index % 10]}${EARTHLY_BRANCHES[index % 12]}`);
const VOID_BRANCHES_BY_XUN = [
  ["戌", "亥"],
  ["申", "酉"],
  ["午", "未"],
  ["辰", "巳"],
  ["寅", "卯"],
  ["子", "丑"]
] as const;
const PALACE_BRANCHES: Record<number, readonly string[]> = {
  1: ["子"],
  2: ["未", "申"],
  3: ["卯"],
  4: ["辰", "巳"],
  5: [],
  6: ["戌", "亥"],
  7: ["酉"],
  8: ["丑", "寅"],
  9: ["午"]
};

function formatDivinationType(value: string | undefined) {
  const labels: Record<string, string> = {
    wealth: "财运走势",
    single: "单身姻缘",
    relationship: "伴侣感情",
    promotion: "工作升职",
    job: "工作求职",
    cooperation: "合作谈判",
    lawsuit: "官司诉讼"
  };

  return value ? labels[value] ?? "未选择" : "未选择";
}
