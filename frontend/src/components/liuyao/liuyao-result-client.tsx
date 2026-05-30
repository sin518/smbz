"use client";

import { ArrowLeft, Check, Copy, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  buildLiuyaoChart,
  type LiuyaoChart,
  type LiuyaoStoredCasting,
  type LiuyaoStoredInput
} from "@/lib/liuyao/chart";

type SessionResponse = {
  session?: unknown;
  user?: unknown;
};

type AuthStatus = "checking" | "signed-in" | "signed-out";

export function LiuyaoResultClient() {
  const [chart, setChart] = useState<LiuyaoChart | null>(null);
  const [missingCasting, setMissingCasting] = useState(false);
  const [chartError, setChartError] = useState("");
  const [authStatus, setAuthStatus] = useState<AuthStatus>("checking");
  const [showAiCommand, setShowAiCommand] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "selected">("idle");
  const pathname = usePathname();

  useEffect(() => {
    const input = readJson<LiuyaoStoredInput>("sm1:current-liuyao-input");
    const casting = readJson<LiuyaoStoredCasting>("sm1:current-liuyao-casting");
    if (casting?.status !== "complete" || casting.lines?.length !== 6) {
      setMissingCasting(true);
      return;
    }

    let cancelled = false;
    buildLiuyaoChart(input?.input, casting.lines)
      .then((nextChart) => {
        if (!cancelled) setChart(nextChart);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setChartError(error instanceof Error ? error.message : "六爻排盘计算失败");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const response = await fetch("/api/auth/get-session", {
          method: "GET",
          credentials: "include"
        });
        const data = response.ok ? ((await response.json()) as SessionResponse | null) : null;
        if (!cancelled) {
          setAuthStatus(data?.session && data.user ? "signed-in" : "signed-out");
        }
      } catch {
        if (!cancelled) {
          setAuthStatus("signed-out");
        }
      }
    }

    checkSession();

    return () => {
      cancelled = true;
    };
  }, []);

  if (missingCasting) {
    return (
      <main className="light-surface-text-scope app-responsive-shell flex min-h-screen flex-col items-center justify-center bg-paper px-8 text-center shadow-soft">
        <p className="text-[20px] font-semibold leading-relaxed text-[#403d38]">还没有完整的 6 个卦爻，请先完成摇卦。</p>
        <Link href="/liuyao/shake" className="mt-6 flex h-12 w-[62%] items-center justify-center rounded-full bg-black text-[18px] font-semibold text-[#e8d4a7]">
          开始摇卦
        </Link>
      </main>
    );
  }

  if (chartError) {
    return (
      <main className="light-surface-text-scope app-responsive-shell flex min-h-screen flex-col items-center justify-center bg-paper px-8 text-center shadow-soft">
        <p className="text-[20px] font-semibold leading-relaxed text-[#403d38]">{chartError}</p>
        <Link href="/liuyao" className="mt-6 flex h-12 w-[62%] items-center justify-center rounded-full bg-black text-[18px] font-semibold text-[#e8d4a7]">
          返回重试
        </Link>
      </main>
    );
  }

  if (!chart) {
    return <main className="light-surface-text-scope app-responsive-shell min-h-screen bg-paper" />;
  }

  const isSignedIn = authStatus === "signed-in";
  const loginHref = `/settings/login?next=${encodeURIComponent(pathname || "/liuyao/result")}`;
  const aiCommandText = buildLiuyaoAiCommandText(chart);

  async function handleCopyAiCommand() {
    try {
      await copyText(aiCommandText);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("selected");
    }
  }

  return (
    <main className="light-surface-text-scope app-responsive-shell min-h-screen bg-paper pb-5 text-ink shadow-soft [font-family:'PingFang_SC','Microsoft_YaHei',sans-serif]">
      <header className="sticky top-0 z-20 flex h-20 items-center justify-between bg-[#F8F7EE] px-[15px] pb-2 pt-6">
        <div className="flex items-center justify-between">
          <Link href="/liuyao" className="-ml-1 flex h-10 w-10 items-center justify-center" aria-label="返回六爻首页">
            <ArrowLeft size={24} />
          </Link>
        </div>
        <h1 className="text-[18px] font-medium">六爻断事</h1>
        <span className="h-10 w-10" aria-hidden="true" />
      </header>

      <section className="mx-4 rounded-[22px] bg-white px-4 py-4 text-[14px] font-normal leading-[1.8] text-mutedInk shadow-soft">
        <p>起卦时间：<b className="font-semibold text-ink">{chart.profile.castingText}</b></p>
        <p>求测方向：<b className="font-semibold text-ink">{chart.profile.direction}</b></p>
        <p>求测问题：<b className="font-semibold text-ink">{chart.profile.question}</b></p>
      </section>

      <section className="px-4 pt-4">
        <div className="rounded-full bg-black px-4 py-2 text-center text-[15px] font-normal leading-snug text-[#e8d4a7]">{chart.ganzhiText}</div>
      </section>

      <section className="mx-4 mt-4 rounded-[22px] bg-white px-3 py-4 shadow-soft">
        <div className="grid min-h-[28px] grid-cols-[116fr_530fr_530fr] items-center border-b border-[#ebe7dd] text-center text-[14px] font-normal text-[#8b8985]">
          <div className="flex h-full items-center justify-center">六神</div>
          <div className="flex h-full items-center justify-center text-center">
            主卦【{chart.hexagram.lower}】 {chart.hexagram.name}
          </div>
          <div className="flex h-full items-center justify-center text-center">
            {chart.hexagram.changed ? (
              <span className="inline-flex flex-wrap items-center justify-center gap-x-1">
                变卦【{chart.hexagram.changed.lower}】 {chart.hexagram.changed.name}
              </span>
            ) : (
              <span className="text-[#b8b8b8]">无变卦</span>
            )}
          </div>
        </div>

        <div>
          {[...chart.lines].reverse().map((line) => (
            <div key={line.position} className="grid h-[45px] grid-cols-[116fr_530fr_530fr] items-center">
              <span className="text-center text-[15px] text-ink">{line.spirit}</span>
              <div className="grid grid-cols-[54px_34px_1fr] items-center">
                <span className="whitespace-nowrap text-center text-[13px] text-ink">{line.hiddenStem ?? ""}</span>
                <LineSymbol symbol={line.symbol} changing={line.changing} />
                <span className="whitespace-nowrap text-center text-[14px] text-ink">
                  {line.relation}{line.branch}{line.element}
                  {line.marker ? <b className="ml-[5px] font-normal text-[#c23521]">{line.marker}</b> : null}
                </span>
              </div>
              <div className="grid grid-cols-[34px_1fr] items-center">
                {chart.hexagram.changed ? (
                  <>
                    <LineSymbol symbol={line.changedSymbol} changing={false} />
                    <span className="whitespace-nowrap text-center text-[14px] text-ink">
                      {line.changedRelation}{line.changedBranch}{line.changedElement}
                      {line.marker ? <b className="ml-[5px] font-normal text-[#c23521]">{line.marker}</b> : null}
                    </span>
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 py-4">
        {isSignedIn ? (
          <button
            type="button"
            onClick={() => {
              setShowAiCommand((value) => !value);
              setCopyStatus("idle");
            }}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-black text-[17px] font-semibold text-[#e8d4a7] shadow-soft"
          >
            <Sparkles size={18} />
            AI指令
          </button>
        ) : (
          <Link href={loginHref} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-black text-[17px] font-semibold text-[#e8d4a7] shadow-soft">
            <Sparkles size={18} />
            AI指令
          </Link>
        )}

        {isSignedIn && showAiCommand ? (
          <section className="mt-3 overflow-hidden rounded-[22px] bg-white shadow-soft">
            <header className="flex items-center justify-between border-b border-[#f0eadc] px-4 py-3">
              <h2 className="text-[16px] font-semibold text-ink">AI指令复制</h2>
              <button
                type="button"
                onClick={() => setShowAiCommand(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f6f0e2] text-[#4a4036]"
                aria-label="关闭AI指令"
              >
                <X size={18} />
              </button>
            </header>
            <div className="px-4 py-4">
              <p className="text-[13px] leading-5 text-[#6d6254]">
                复制以下提示词，粘贴到 DeepSeek、ChatGPT、豆包等第三方 AI 中使用。AI 只做解释参考，排盘数据以本页为准。
              </p>
              <textarea
                value={aiCommandText}
                readOnly
                className="mt-3 h-[210px] w-full resize-none rounded-[14px] border border-[#eee4d2] bg-[#fffdf8] p-3 text-[12px] leading-5 text-[#554f47] outline-none [font-family:inherit]"
                aria-label="六爻AI指令内容"
                onFocus={(event) => {
                  if (copyStatus === "selected") {
                    event.currentTarget.select();
                  }
                }}
              />
              {copyStatus === "selected" ? <p className="mt-2 text-[12px] text-[#a58024]">复制失败，已显示提示词内容，可手动选择复制。</p> : null}
              <button
                type="button"
                onClick={handleCopyAiCommand}
                className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#a58024] text-[16px] font-semibold text-white"
              >
                {copyStatus === "copied" ? <Check size={17} /> : <Copy size={17} />}
                {copyStatus === "copied" ? "已复制AI指令" : "复制AI指令"}
              </button>
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}

function LineSymbol({ symbol, changing }: { symbol: "yang" | "yin"; changing: boolean }) {
  return (
    <span className={changing ? "relative block h-[9px] w-[34px] bg-[#c23521]" : "relative block h-[9px] w-[34px] bg-[#333]"}>
      {symbol === "yang" ? (
        null
      ) : (
        <span className="absolute left-[40%] top-0 h-full w-[20%] bg-white" />
      )}
    </span>
  );
}

function readJson<TValue>(key: string): TValue | undefined {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as TValue) : undefined;
  } catch {
    return undefined;
  }
}

function buildLiuyaoAiCommandText(chart: LiuyaoChart) {
  const warnings = chart.skillWorkflow.warnings.length ? chart.skillWorkflow.warnings.map((item) => `- ${item}`).join("\n") : "- 无";
  const timeRecommendations = chart.skillWorkflow.timeRecommendations.length
    ? chart.skillWorkflow.timeRecommendations.map((item) => `- ${item}`).join("\n")
    : "- 系统暂未给出明确时间窗口，请基于用神、世应、动爻谨慎判断。";

  return `你是理性、审慎的六爻分析助手。请严格按六爻固定解读流程执行：先校验输入，再读卦象，再定用神，再分析世应和动爻，最后给出时间窗口、倾向结论和可执行建议。

硬性规则：
1. 只基于下方本系统已经生成的排盘数据分析，不要重新排盘。
2. 必须先分析核心用神，比较旺衰、动静、空亡、月建日辰、生克冲合。
3. 必须分析世爻、应爻、动爻、变爻；有伏神、六冲、六合、三合、反吟伏吟、神煞或警告时必须标注。
4. 必须给出明确但不绝对的倾向：可成、可成但延迟、暂难成、需补充信息之一。
5. 禁止恐吓、宿命论、医疗/投资/法律保证、玄学化解和付费引导。
6. 结论必须绑定证据点，例如爻位、用神强度、旬空、动变关系、时间建议。

【0. Input Check】
- 当前时间：${formatCurrentDateTime()}
- 求测方向：${chart.profile.direction}
- 求测事项：${chart.profile.question}
- 已判定用神目标：${chart.skillWorkflow.yongShenTargets.join("、")}
- 若问题不够单一或时间/目标不明确，先在“风险与边界”里说明，不要把多个问题混断。

【规范排盘文本】
${chart.canonicalText}

【1. 卦象层】
请提取本卦、变卦、卦宫、五行、卦辞/象辞、占卜干支时间、旬空；标注六冲卦、三合/半合、整盘神煞。

【2. 用神层（Mandatory）】
请使用 yongShen[] 分组分析目标六亲；candidates[0] 为主用神，后续为候选。必须比较旺衰、动静、空亡、受生受克；结合原神、忌神、仇神；若用神不现，检查伏神是否可用。

【3. 结构关系层】
请定位世爻、应爻；分析动爻变爻、回头生克、化进化退、六神、十二长生，并说明关键阻力来自时间、人、资源还是判断偏差。

【4. 时机层（Mandatory）】
系统时间建议：
${timeRecommendations}

系统警告：
${warnings}

请基于 timeRecommendations 输出何时可推进、何时宜观察、何时需止损；没有明确时间窗口时必须降低置信度。

请严格按以下结构输出：

【结论摘要】
用 3-5 行说明结果倾向、关键用神状态、核心风险和时间窗口。

【核心依据】
列出 4-8 条证据，每条必须引用具体数据：本卦/变卦、用神、世应、动爻、旬空、月建日辰、时间建议等。

【分步解读】
按六爻固定解读流程的卦象层、用神层、结构关系层、时机层依次展开，不得跳步。

【时间节奏】
明确写出可推进、宜观察、需止损的时间窗口；若系统未提供窗口，请说明只能做趋势判断。

【行动建议】
给出当下一周、一个月、三个月内的低风险做法。

【风险与边界】
说明哪些信息不能从本卦中确定；提醒仅供传统文化研究与休闲娱乐参考。`;
}

function formatCurrentDateTime() {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date());
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall through to manual selection feedback.
    }
  }

  throw new Error("Clipboard write failed");
}
