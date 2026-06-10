"use client";

// 需要读取 localStorage、计算本地排盘并控制 AI 指令弹层。
import { ArrowLeft, Copy, Sparkles, X } from "lucide-react";
import { Solar } from "lunar-javascript";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { DaliurenInput, DaliurenOutput } from "taibu-core/daliuren";
import { calculateDaliurenChart } from "@/lib/daliuren/api";
import { cn } from "@/lib/utils";

type DaliurenStoredInput = {
  input: {
    question: string;
    dateTime: string;
    birthYear: number;
    gender: "male" | "female";
  };
  savedAt: string;
};

type PlatePosition = {
  zhi: string;
  row: number;
  col: number;
};
type GongInfo = DaliurenOutput["gongInfos"][number];
type TransmissionState = "chu" | "zhong" | "mo" | null;

const platePositions: PlatePosition[] = [
  { zhi: "巳", row: 1, col: 1 },
  { zhi: "午", row: 1, col: 2 },
  { zhi: "未", row: 1, col: 3 },
  { zhi: "申", row: 1, col: 4 },
  { zhi: "辰", row: 2, col: 1 },
  { zhi: "酉", row: 2, col: 4 },
  { zhi: "卯", row: 3, col: 1 },
  { zhi: "戌", row: 3, col: 4 },
  { zhi: "寅", row: 4, col: 1 },
  { zhi: "丑", row: 4, col: 2 },
  { zhi: "子", row: 4, col: 3 },
  { zhi: "亥", row: 4, col: 4 }
];

export function DaliurenResultClient() {
  const [storedInput, setStoredInput] = useState<DaliurenStoredInput | null>(null);
  const [chart, setChart] = useState<DaliurenOutput | null>(null);
  const [canonicalText, setCanonicalText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadChart() {
      try {
        const raw = window.localStorage.getItem("sm1:current-daliuren-input") ?? window.localStorage.getItem("sm1:last-daliuren-input");
        if (!raw) {
          if (mounted) {
            setLoaded(true);
          }
          return;
        }

        const parsed = JSON.parse(raw) as DaliurenStoredInput;
        const input = buildDaliurenInput(parsed);
        const nextResult = await calculateDaliurenChart(input);

        if (!mounted) {
          return;
        }

        setStoredInput(parsed);
        setChart(nextResult.chart);
        setCanonicalText(nextResult.canonicalText);
      } catch (nextError) {
        if (mounted) {
          setError(nextError instanceof Error ? nextError.message : "大六壬起课失败");
        }
      } finally {
        if (mounted) {
          setLoaded(true);
        }
      }
    }

    void loadChart();

    return () => {
      mounted = false;
    };
  }, []);

  const lunarDate = useMemo(() => (storedInput ? formatLunarDate(storedInput.input.dateTime) : ""), [storedInput]);

  return (
    <main className="daliuren-result-scope light-surface-text-scope app-responsive-shell flex h-dvh flex-col overflow-hidden bg-[#F8F7EE] text-ink shadow-soft">
      <header className="z-20 flex h-16 shrink-0 items-center justify-between bg-[#F8F7EE] px-[15px] pt-3">
        <Link href="/daliuren" className="-ml-1 flex h-10 w-10 items-center justify-center" aria-label="返回大六壬">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-[18px] font-medium">大六壬课盘</h1>
        <span className="h-10 w-10" aria-hidden="true" />
      </header>

      {chart && storedInput ? (
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 pb-3">
          <CourseSummary chart={chart} input={storedInput} lunarDate={lunarDate} />
          <CoreInfoRow chart={chart} />
          <SanChuanCard chart={chart} />
          <SiKeCard chart={chart} />
          <TianDiPanCard chart={chart} />
          <button
            type="button"
            onClick={() => setAiOpen(true)}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-black text-[15px] font-semibold text-[#e8d4a7] shadow-soft"
          >
            <Sparkles size={18} />
            AI指令
          </button>
          {aiOpen ? <AiCommandModal chart={chart} canonicalText={canonicalText} onClose={() => setAiOpen(false)} /> : null}
        </div>
      ) : null}

      {loaded && !chart ? (
        <section className="mx-4 rounded-[22px] bg-white p-5 text-center shadow-soft">
          <p className="text-[18px] font-semibold">{error ?? "还没有大六壬课盘"}</p>
          <p className="mt-2 text-[14px] leading-6 text-[#7d7972]">返回填写页，输入占事和时间后再起课。</p>
          <Link href="/daliuren" className="mt-4 inline-flex h-11 items-center rounded-full bg-black px-6 text-[17px] font-semibold text-[#e8d4a7]">
            去起课
          </Link>
        </section>
      ) : null}
    </main>
  );
}

function CourseSummary({ chart, input, lunarDate }: { chart: DaliurenOutput; input: DaliurenStoredInput; lunarDate: string }) {
  const subTypes = [...chart.keTi.subTypes, ...chart.keTi.extraTypes];

  return (
    <section className="rounded-[16px] bg-white px-3 py-3 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-[#a29d94]">课式描述</p>
          <h2 className="mt-1 truncate text-[19px] font-semibold leading-tight text-ink">{chart.keName}</h2>
        </div>
        <span className="shrink-0 rounded-full bg-[#f4efe2] px-3 py-1 text-[12px] font-semibold text-[#a58024]">
          {chart.keTi.method || chart.sanChuan.method}课
        </span>
      </div>
      {subTypes.length > 0 ? <p className="mt-1 truncate text-[12px] leading-5 text-[#766f63]">课体细分：{subTypes.join("、")}</p> : null}

      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[12px] leading-5 text-[#766f63]">
        <InfoLine label="占事" value={chart.question || input.input.question || "未填写"} />
        <InfoLine label="公历时间" value={chart.dateInfo.solarDate} />
        <p className="col-span-2 min-w-0 truncate">
          <span>农历时间：</span>
          <b className="font-semibold text-ink">{chart.dateInfo.lunarDate || lunarDate || "未取得"}</b>
        </p>
      </div>
    </section>
  );
}

function CoreInfoRow({ chart }: { chart: DaliurenOutput }) {
  const pillarText = [
    chart.dateInfo.ganZhi.year,
    chart.dateInfo.ganZhi.month,
    chart.dateInfo.ganZhi.day,
    chart.dateInfo.ganZhi.hour
  ].filter(Boolean).join(" ");
  const yueJiangText = chart.dateInfo.yueJiang || "-";
  const kongWangText = chart.dateInfo.kongWang.filter(Boolean).join("") || "-";

  return (
    <section className="rounded-[8px] bg-[var(--daliuren-panel-bg)] px-0 py-0">
      <div className="grid grid-cols-2 gap-2">
        <InfoBlock title="四柱干支" value={pillarText || chart.dateInfo.bazi || "-"} />
        <InfoBlock title="月将信息" value={`${yueJiangText} (空亡：${kongWangText})`} />
      </div>
    </section>
  );
}

function InfoBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[5px] border border-[var(--daliuren-card-border)] bg-[var(--daliuren-card-bg)] px-3 py-2">
      <p className="text-[11px] font-semibold text-[var(--daliuren-title)]">{title}</p>
      <p className="mt-1 truncate text-[14px] font-semibold leading-none text-[var(--daliuren-strong)]">{value}</p>
    </div>
  );
}

function SanChuanCard({ chart }: { chart: DaliurenOutput }) {
  const rows = [
    { label: "初传", hint: "发端", data: chart.sanChuan.chu },
    { label: "中传", hint: "移易", data: chart.sanChuan.zhong },
    { label: "末传", hint: "归计", data: chart.sanChuan.mo }
  ];

  return (
    <section className="rounded-[8px] bg-[var(--daliuren-panel-bg)] px-3 py-3">
      <SectionTitle title="三传分析" />
      <div className="mt-3 grid grid-cols-3 gap-3">
        {rows.map((row) => (
          <div key={row.label} className="min-w-0 rounded-[5px] border border-[var(--daliuren-card-border)] bg-[var(--daliuren-card-bg)] px-2 py-3 text-center">
            <p className="text-[11px] font-semibold text-[var(--daliuren-title)]">{row.label}</p>
            <p className="mt-2 text-[20px] font-semibold leading-none text-[var(--daliuren-strong)]">{row.data[0] || "-"}</p>
            <p className="mt-2 truncate text-[12px] font-semibold text-[var(--daliuren-muted)]">{row.data[1] || "-"}</p>
            <p className="mt-0.5 truncate text-[11px] font-semibold text-[var(--daliuren-accent)]">{row.data[2] || "-"}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function SiKeCard({ chart }: { chart: DaliurenOutput }) {
  const rows = [
    { label: "一课", hint: "干上", data: chart.siKe.yiKe },
    { label: "二课", hint: "干阴", data: chart.siKe.erKe },
    { label: "三课", hint: "支上", data: chart.siKe.sanKe },
    { label: "四课", hint: "支阴", data: chart.siKe.siKe }
  ];

  return (
    <section className="rounded-[8px] bg-[var(--daliuren-panel-bg)] px-3 py-3">
      <SectionTitle title="四课排布" />
      <div className="mt-3 grid grid-cols-4 gap-2">
        {rows.map((row) => (
          <div key={row.label} className="min-w-0 rounded-[5px] border border-[var(--daliuren-card-border)] bg-[var(--daliuren-card-bg)] px-1.5 py-3 text-center">
            <p className="truncate text-[11px] font-semibold text-[var(--daliuren-accent)]">{row.data[1] || "-"}</p>
            <p className="mt-2 text-[20px] font-semibold leading-none text-[var(--daliuren-strong)]">{row.data[0]?.[0] || "-"}</p>
            <p className="mt-2 text-[12px] font-semibold text-[var(--daliuren-muted)]">{row.data[0]?.[1] || "-"}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function TianDiPanCard({ chart }: { chart: DaliurenOutput }) {
  return (
    <section className="rounded-[16px] bg-white px-3 py-3 shadow-soft">
      <SectionTitle title="天地盘九宫" meta="十二位" />
      <div className="relative mt-2 grid min-h-[300px] grid-cols-4 grid-rows-4 gap-1 rounded-xl bg-[#080808] p-1.5">
        <div
          className="flex flex-col items-center justify-center rounded-[6px] border border-[#0d6b6f] bg-[#071f1f] text-center"
          style={{ gridColumn: "2 / 4", gridRow: "2 / 4" }}
        >
          <p className="text-[11px] font-semibold text-[#899897]">课式</p>
          <p className="mt-2 px-2 text-[14px] font-semibold leading-snug text-white">{chart.keName}</p>
          <p className="mt-1 text-[12px] font-semibold text-[#00bfe8]">{chart.keTi.method || chart.sanChuan.method}课</p>
        </div>
        {platePositions.map((position) => {
          const gong = chart.gongInfos.find((item) => item.diZhi === position.zhi);
          return gong ? <GongCell key={position.zhi} gong={gong} chart={chart} row={position.row} col={position.col} /> : null;
        })}
      </div>
      <div className="mt-1 flex items-center justify-center gap-3 text-[11px] font-semibold text-[#7c7c7c]">
        <LegendDot color="#ff4d5c" label="初传" />
        <LegendDot color="#ff9e1b" label="中传" />
        <LegendDot color="#f1c40f" label="末传" />
        <span className="flex items-center gap-1">
          <KongWangMark />
          空亡
        </span>
      </div>
    </section>
  );
}

function GongCell({ gong, chart, row, col }: { gong: GongInfo; chart: DaliurenOutput; row: number; col: number }) {
  const transmissionState = getTransmissionState(chart, gong.tianZhi);
  const isKongWang = chart.dateInfo.kongWang.includes(gong.tianZhi);

  return (
    <div
      className={cn(
        "relative min-h-[68px] rounded-[6px] border bg-[#111] px-1 py-1.5 text-center",
        transmissionState === "chu" && "border-[#ff4d5c]",
        transmissionState === "zhong" && "border-[#ff9e1b]",
        transmissionState === "mo" && "border-[#f1c40f]",
        !transmissionState && "border-[#202020]"
      )}
      style={{ gridColumn: col, gridRow: row }}
    >
      <p className={cn("truncate text-[11px] font-semibold leading-none", getTianJiangTone(gong.tianJiang || gong.tianJiangShort))}>{gong.tianJiang || gong.tianJiangShort || "-"}</p>
      <p className={cn("mt-1 flex items-center justify-center gap-1 text-[18px] font-semibold leading-none", getBranchTone(transmissionState))}>
        <span>{gong.tianZhi || "-"}</span>
        {isKongWang ? <KongWangMark /> : null}
      </p>
      <p className="mt-1 text-[12px] font-semibold leading-none text-[#8e8e8e]">{gong.diZhi || "-"}</p>
      <p className="mt-1 truncate text-[10px] font-semibold leading-none text-[#585858]">{gong.changSheng || "-"}</p>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <i className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function KongWangMark() {
  return (
    <span className="relative inline-flex h-3 w-3 shrink-0 items-center justify-center rounded-full border border-[#2f83ff]" aria-label="空亡">
      <span className="h-1.5 w-1.5 rounded-full bg-[#2f83ff]" />
    </span>
  );
}

function AiCommandModal({ chart, canonicalText, onClose }: { chart: DaliurenOutput; canonicalText: string; onClose: () => void }) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const command = buildAiCommand(chart, canonicalText);

  async function copyCommand() {
    try {
      await navigator.clipboard.writeText(command);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60">
      <button className="absolute inset-0 cursor-default" type="button" aria-label="关闭AI指令" onClick={onClose} />
      <section className="relative max-h-[86vh] w-full max-w-[430px] rounded-t-[24px] bg-[#fffef7] px-5 pb-6 pt-5 shadow-soft">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center text-[#77736b]" aria-label="关闭">
          <X size={24} />
        </button>
        <h2 className="pr-12 text-[22px] font-semibold text-ink">AI指令</h2>
        <textarea
          readOnly
          value={command}
          className="mt-4 h-[52vh] w-full resize-none rounded-2xl border border-[#e6dfd0] bg-white px-3 py-3 text-[13px] leading-6 text-[#4d4942] outline-none"
          aria-label="大六壬AI指令内容"
        />
        <button
          type="button"
          onClick={() => void copyCommand()}
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-black text-[17px] font-semibold text-[#e8d4a7]"
        >
          <Copy size={17} />
          {copyState === "copied" ? "已复制" : copyState === "failed" ? "复制失败" : "复制指令"}
        </button>
      </section>
    </div>
  );
}

function SectionTitle({ title, meta }: { title: string; meta?: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-[14px] font-semibold text-[var(--daliuren-title)]">{title}</h2>
      {meta ? <span className="text-[13px] font-semibold text-[var(--daliuren-title)]">{meta}</span> : null}
    </div>
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

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-[#f8f7f2] px-3 py-2">
      <p className="text-[12px] font-semibold text-[#a29d94]">{label}</p>
      <p className="mt-1 truncate text-[15px] font-semibold text-[#3b3935]">{value}</p>
    </div>
  );
}

function MiniValue({ label, value }: { label: string; value?: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-white px-2 py-2">
      <p className="text-[11px] font-semibold text-[#a29d94]">{label}</p>
      <p className="mt-1 truncate text-[16px] font-semibold text-ink">{value || "-"}</p>
    </div>
  );
}

function buildDaliurenInput(stored: DaliurenStoredInput): DaliurenInput {
  const parts = parseDateTimeLocal(stored.input.dateTime);
  return {
    date: `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`,
    hour: parts.hour,
    minute: parts.minute,
    timezone: "Asia/Shanghai",
    question: stored.input.question.trim(),
    birthYear: stored.input.birthYear,
    gender: stored.input.gender
  };
}

function buildAiCommand(chart: DaliurenOutput, canonicalText: string) {
  return `你是理性、审慎的大六壬分析助手。请基于以下规范课盘数据分析占事，不要重新排盘，不要编造不存在的神煞或课体。

请按顺序输出：
1. 课式总览：说明课名、课体、月将、昼夜、空亡等关键状态。
2. 四课结构：分析干支主客、上神下神、乘将关系。
3. 三传推演：按初传、中传、末传说明事态起因、变化、归结。
4. 天地盘重点：指出与占事相关的宫位、天将、遁干、旺衰和长生状态。
5. 结论与建议：给出倾向判断、时间窗口和可执行建议；避免绝对化措辞。

【大六壬规范课盘】
${canonicalText}`;
}

function parseDateTimeLocal(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) {
    throw new Error("起课时间格式无效");
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5])
  };
}

function formatLunarDate(value: string) {
  try {
    const parts = parseDateTimeLocal(value);
    const lunar = Solar.fromYmdHms(parts.year, parts.month, parts.day, parts.hour, parts.minute, 0).getLunar();
    return `${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()} ${lunar.getTimeInGanZhi()}时`;
  } catch {
    return "";
  }
}

function getTransmissionState(chart: DaliurenOutput, branch: string): TransmissionState {
  if (branch === chart.sanChuan.chu[0]) {
    return "chu";
  }
  if (branch === chart.sanChuan.zhong[0]) {
    return "zhong";
  }
  if (branch === chart.sanChuan.mo[0]) {
    return "mo";
  }
  return null;
}

function getBranchTone(state: TransmissionState) {
  if (state === "chu") {
    return "text-[#ff4d5c]";
  }
  if (state === "zhong") {
    return "text-[#ff9e1b]";
  }
  if (state === "mo") {
    return "text-[#f1c40f]";
  }
  return "text-[#f3f3f3]";
}

function getTianJiangTone(value: string) {
  if (["青龙", "龙", "六合", "合"].includes(value)) {
    return "text-[#27d86f]";
  }
  if (["朱雀", "雀", "腾蛇", "蛇"].includes(value)) {
    return "text-[#ff4d5c]";
  }
  if (["勾陈", "勾", "贵人", "贵", "太常", "常"].includes(value)) {
    return "text-[#f1a31b]";
  }
  if (["白虎", "虎", "太阴", "阴"].includes(value)) {
    return "text-[#8d6ad8]";
  }
  if (["玄武", "武", "天后", "后"].includes(value)) {
    return "text-[#00a7e8]";
  }
  if (["天空", "空"].includes(value)) {
    return "text-[#8a8a8a]";
  }
  return "text-[#9a9a9a]";
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}
