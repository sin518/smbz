"use client";

// 需要读取 localStorage、计算本地排盘并控制 AI 指令弹层。
import { ArrowLeft, Copy, X } from "lucide-react";
import { Solar } from "lunar-javascript";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DaliurenInput, DaliurenOutput, DaliurenTimingMethod } from "taibu-core/daliuren";
import { ProtectedAiCommandAction } from "@/components/shared/protected-ai-command-action";
import { useCachedAiCommand } from "@/components/shared/use-cached-ai-command";
import { useCopyFeedback } from "@/components/shared/use-copy-feedback";
import { DaliurenTianDiPanCard } from "@/components/daliuren/daliuren-tiandipan-card";
import { DaliurenAnalysisBasisCard } from "@/components/daliuren/daliuren-analysis-basis-card";
import { buildDaliurenAiCommandText } from "@/lib/ai/daliuren-command";
import { calculateDaliurenChart } from "@/lib/daliuren/api";
import { saveLocalDaliurenRecord } from "@/lib/divination/local-records";
import { consumeExplicitSaveIntent } from "@/lib/records/save-intent";

type DaliurenStoredInput = {
  input: {
    question: string;
    dateTime: string;
    birthYear: number;
    gender: "male" | "female";
    timingMethod?: DaliurenTimingMethod;
  };
  savedAt: string;
};

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
        if (consumeExplicitSaveIntent("daliuren", parsed.savedAt)) {
          void saveLocalDaliurenRecord({
            ...parsed,
            chart: nextResult.chart,
            canonicalText: nextResult.canonicalText
          });
        }
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
          <DaliurenAnalysisBasisCard chart={chart} />
          <SanChuanCard chart={chart} />
          <SiKeCard chart={chart} />
          <DaliurenTianDiPanCard chart={chart} />
          <ProtectedAiCommandAction
            loginNextHref="/daliuren/result"
            onAuthorized={() => setAiOpen(true)}
            expanded={aiOpen}
          />
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
    <section className="rounded-[8px] bg-[var(--daliuren-panel-bg)] px-3 py-2.5">
      <SectionTitle title="三传分析" />
      <div className="mt-2 grid grid-cols-3 gap-2">
        {rows.map((row) => (
          <div key={row.label} className="min-w-0 rounded-[5px] border border-[var(--daliuren-card-border)] bg-[var(--daliuren-card-bg)] px-1.5 py-2 text-center">
            <p className="text-[10px] font-semibold leading-none text-[var(--daliuren-title)]">{row.label}</p>
            <p className="mt-1.5 text-[18px] font-semibold leading-none text-[var(--daliuren-strong)]">{row.data[0] || "-"}</p>
            <p className="mt-1.5 flex min-w-0 items-center justify-center gap-1 text-[10px] font-semibold leading-none">
              <span className="truncate text-[var(--daliuren-muted)]">{row.data[1] || "-"}</span>
              <span className="text-[var(--daliuren-title)]" aria-hidden="true">·</span>
              <span className="truncate text-[var(--daliuren-accent)]">{row.data[2] || "-"}</span>
            </p>
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
    <section className="rounded-[8px] bg-[var(--daliuren-panel-bg)] px-3 py-2.5">
      <SectionTitle title="四课排布" />
      <div className="mt-2 grid grid-cols-4 gap-1.5">
        {rows.map((row) => (
          <div key={row.label} className="min-w-0 rounded-[5px] border border-[var(--daliuren-card-border)] bg-[var(--daliuren-card-bg)] px-1 py-2 text-center">
            <p className="flex min-w-0 items-center justify-center gap-1 text-[9px] font-semibold leading-none">
              <span className="shrink-0 text-[var(--daliuren-title)]">{row.label}</span>
              <span className="truncate text-[var(--daliuren-accent)]">{row.data[1] || "-"}</span>
            </p>
            <p className="mt-1.5 text-[18px] font-semibold leading-none text-[var(--daliuren-strong)]">{row.data[0]?.[0] || "-"}</p>
            <p className="mt-1.5 truncate text-[10px] font-semibold leading-none text-[var(--daliuren-muted)]">
              {row.hint} · {row.data[0]?.[1] || "-"}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function AiCommandModal({ chart, canonicalText, onClose }: { chart: DaliurenOutput; canonicalText: string; onClose: () => void }) {
  const { copyStatus, setCopyStatus } = useCopyFeedback();
  const commandSource = useMemo(() => JSON.stringify({ chart, canonicalText }), [canonicalText, chart]);
  const buildCommand = useCallback(
    () => buildDaliurenAiCommandText({ chart, canonicalText }),
    [canonicalText, chart]
  );
  const command = useCachedAiCommand({ namespace: "daliuren", source: commandSource, build: buildCommand });

  async function copyCommand() {
    if (!command) {
      return;
    }

    try {
      await navigator.clipboard.writeText(command);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("selected");
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
          disabled={!command}
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-black text-[17px] font-semibold text-[#e8d4a7]"
        >
          <Copy size={17} />
          {copyStatus === "copied" ? "已复制" : copyStatus === "selected" ? "复制失败" : "复制指令"}
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
    gender: stored.input.gender,
    timingMethod: stored.input.timingMethod ?? "san-chuan"
  };
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

function pad(value: number) {
  return String(value).padStart(2, "0");
}
