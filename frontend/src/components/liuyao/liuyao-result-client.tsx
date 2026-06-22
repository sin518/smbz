"use client";

import { ArrowLeft, Check, Copy, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ProtectedAiCommandAction } from "@/components/shared/protected-ai-command-action";
import { buildLiuyaoAiCommandText } from "@/lib/ai/liuyao-command";
import { saveLocalLiuyaoRecord } from "@/lib/divination/local-records";
import {
  buildLiuyaoChart,
  type LiuyaoChart,
  type LiuyaoStoredCasting,
  type LiuyaoStoredInput
} from "@/lib/liuyao/chart";

export function LiuyaoResultClient() {
  const [chart, setChart] = useState<LiuyaoChart | null>(null);
  const [missingCasting, setMissingCasting] = useState(false);
  const [chartError, setChartError] = useState("");
  const [showAiCommand, setShowAiCommand] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "selected">("idle");
  const aiCommandSectionRef = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const aiCommandText = useMemo(() => (chart ? buildLiuyaoAiCommandText(chart) : ""), [chart]);

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
        if (!cancelled) {
          saveLocalLiuyaoRecord({ input, casting });
          setChart(nextChart);
        }
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
    if (!showAiCommand) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      aiCommandSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [showAiCommand]);

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
            主卦【{chart.hexagram.upper}上/{chart.hexagram.lower}下】 {chart.hexagram.name}
          </div>
          <div className="flex h-full items-center justify-center text-center">
            {chart.hexagram.changed ? (
              <span className="inline-flex flex-wrap items-center justify-center gap-x-1">
                变卦【{chart.hexagram.changed.upper}上/{chart.hexagram.changed.lower}下】 {chart.hexagram.changed.name}
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
        <ProtectedAiCommandAction
          loginNextHref={pathname || "/liuyao/result"}
          onAuthorized={() => {
              setShowAiCommand(true);
              setCopyStatus("idle");
          }}
          expanded={showAiCommand}
          controls="liuyao-ai-command-panel"
        />

        {showAiCommand ? (
          <section
            id="liuyao-ai-command-panel"
            ref={aiCommandSectionRef}
            className="mt-3 scroll-mt-24 overflow-hidden rounded-[22px] bg-white shadow-soft"
          >
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

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall through to the textarea copy path for browser shells without clipboard permission.
    }
  }

  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "true");
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  textArea.style.top = "0";
  document.body.appendChild(textArea);

  try {
    textArea.focus();
    textArea.select();

    const copied = document.execCommand("copy");
    if (!copied) {
      throw new Error("Copy command failed");
    }
  } finally {
    document.body.removeChild(textArea);
  }
}
