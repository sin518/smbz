"use client";

import { ArrowLeft, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { castLiuyaoLine, type LiuyaoLine } from "@/lib/liuyao/casting";
import { cn } from "@/lib/utils";

type ShakeStep = "ready" | "casting" | "complete";

const maxShakeCount = 6;

export function LiuyaoShakeClient() {
  const [step, setStep] = useState<ShakeStep>("ready");
  const [lines, setLines] = useState<LiuyaoLine[]>([]);
  const [displayedCoins, setDisplayedCoins] = useState<LiuyaoLine["coins"]>([1, 1, 1]);
  const [isShaking, setIsShaking] = useState(false);

  const shakeCount = lines.length;
  const canCast = step === "ready" || step === "casting";

  useEffect(() => {
    window.localStorage.removeItem("sm1:current-liuyao-draft");
    window.localStorage.removeItem("sm1:current-liuyao-casting");
  }, []);

  const storeDraftCasting = useCallback((nextLines: LiuyaoLine[]) => {
    window.localStorage.setItem(
      "sm1:current-liuyao-draft",
      JSON.stringify({
        draftLines: nextLines,
        status: "draft",
        updatedAt: new Date().toISOString()
      })
    );
  }, []);

  const storeCompletedCasting = useCallback((nextLines: LiuyaoLine[]) => {
    window.localStorage.setItem(
      "sm1:current-liuyao-casting",
      JSON.stringify({
        lines: nextLines,
        status: "complete",
        completedAt: new Date().toISOString()
      })
    );
  }, []);

  const castNextLine = useCallback(() => {
    if (!canCast || shakeCount >= maxShakeCount) {
      return;
    }

    setIsShaking(true);
    window.setTimeout(() => setIsShaking(false), 520);

    setLines((currentLines) => {
      if (currentLines.length >= maxShakeCount) {
        return currentLines;
      }

      const nextLine = castLiuyaoLine(currentLines.length + 1);
      const nextLines = [...currentLines, nextLine];
      setDisplayedCoins(nextLine.coins);
      storeDraftCasting(nextLines);

      if (nextLines.length >= maxShakeCount) {
        storeCompletedCasting(nextLines);
        setStep("complete");
      } else {
        setStep("casting");
      }

      return nextLines;
    });
  }, [canCast, shakeCount, storeCompletedCasting, storeDraftCasting]);

  const handleContinueCasting = useCallback(() => {
    castNextLine();
  }, [castNextLine]);

  return (
    <main className="light-surface-text-scope app-responsive-shell min-h-screen bg-paper pb-8 text-ink shadow-soft">
      <header className="sticky top-0 z-20 flex h-20 items-center justify-between bg-[var(--color-header)] px-[15px] pb-2 pt-6">
        <div className="flex items-center justify-between">
          <Link
            href="/liuyao"
            className="-ml-1 flex h-10 w-10 items-center justify-center"
            aria-label="返回六爻首页"
          >
            <ArrowLeft size={24} />
          </Link>
        </div>
        <h1 className="text-[18px] font-medium">六爻摇卦</h1>
        <span className="h-10 w-10" />
      </header>

      <section className="px-4 pt-4">
        <div className="rounded-[22px] bg-[var(--color-surface)] px-5 pb-6 pt-6 text-center shadow-soft">
          <div className="mx-auto w-full rounded-[18px] border border-[var(--color-control-border)] bg-[var(--color-control)] px-4 pb-5 pt-4 text-ink" aria-label="摇卦进度">
            <div className="relative flex min-h-[174px] items-center justify-center overflow-hidden rounded-[14px] bg-[var(--color-surface)]">
              <div className={cn("liuyao-coins relative z-10", isShaking && "animate-liuyao-phone-shake")} aria-hidden="true">
                <QianlongCoin className="coin-one" side={displayedCoins[0]} />
                <QianlongCoin className="coin-two" side={displayedCoins[1]} />
                <QianlongCoin className="coin-three" side={displayedCoins[2]} />
              </div>
            </div>
            <p className="mt-4 min-h-6 text-center text-[14px] text-mutedInk">
              {lines.length > 0 ? formatLatestLineSummary(lines[lines.length - 1]) : "静心感应，开始摇卦"}
            </p>
            <div className="mt-4 flex flex-col gap-3">
              {Array.from({ length: maxShakeCount }, (_, index) => {
                const position = maxShakeCount - index;
                const line = lines[position - 1];

                return (
                  <div key={position} className="grid h-4 grid-cols-[34px_1fr_16px] items-center gap-3">
                    <span className="text-left text-[13px] text-mutedInk">{formatLinePosition(position)}</span>
                    <span className="flex justify-center">
                      {line ? (
                        <LinePreviewSymbol symbol={line.kind === "old-yang" || line.kind === "young-yang" ? "yang" : "yin"} />
                      ) : (
                        <LinePlaceholderSymbol />
                      )}
                    </span>
                    {line?.changing ? <span className="text-center text-[16px] font-semibold text-[var(--color-icon)]">×</span> : <span />}
                  </div>
                );
              })}
            </div>
            {step !== "complete" ? (
              <button
                type="button"
                onClick={handleContinueCasting}
                className="mx-auto mt-7 flex h-12 w-[78%] items-center justify-center gap-2 rounded-[8px] bg-[var(--color-primary)] px-5 text-[15px] font-semibold text-[var(--color-primary-text)]"
              >
                <RotateCcw size={17} strokeWidth={2.4} />
                继续摇卦
              </button>
            ) : null}
          </div>

          <div className="mt-7 flex flex-col items-center gap-3">
            {step === "complete" ? (
              <Link
                href="/liuyao/result"
                className="flex h-14 w-[68%] items-center justify-center rounded-full bg-[var(--color-primary)] text-[22px] font-semibold text-[var(--color-primary-text)] shadow-soft"
              >
                查看卦象
              </Link>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}

function QianlongCoin({ className, side }: { className: string; side: 0 | 1 }) {
  return (
    <span className={cn("qianlong-coin", className)} aria-hidden="true">
      <span className={cn("qianlong-coin-flipper", side === 0 && "is-back")}>
        <span className="qianlong-coin-face coin-front" />
        <span className="qianlong-coin-face coin-back" />
      </span>
    </span>
  );
}

function LinePreviewSymbol({ symbol }: { symbol: "yang" | "yin" }) {
  if (symbol === "yang") {
    return <span className="block h-2 w-[88px] rounded-full bg-[var(--color-primary)]" />;
  }

  return (
    <span className="flex gap-2">
      <span className="block h-2 w-10 rounded-full bg-[var(--color-primary)]" />
      <span className="block h-2 w-10 rounded-full bg-[var(--color-primary)]" />
    </span>
  );
}

function LinePlaceholderSymbol() {
  return (
    <span className="flex gap-2">
      <span className="block h-2 w-10 rounded-full bg-[var(--color-row-border)]" />
      <span className="block h-2 w-10 rounded-full bg-[var(--color-row-border)]" />
    </span>
  );
}

function formatLinePosition(position: number) {
  return ["", "初爻", "二爻", "三爻", "四爻", "五爻", "上爻"][position];
}

function formatLatestLineSummary(line: LiuyaoLine) {
  const frontCount = line.coins.filter((coin) => coin === 1).length;
  const backCount = line.coins.length - frontCount;
  const lineLabel = line.kind === "old-yang" || line.kind === "young-yang" ? "阳爻" : "阴爻";

  return `${frontCount}正${backCount}反 →${lineLabel}`;
}
