"use client";

import { ArrowLeft, VolumeX } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { castLiuyaoLine, type LiuyaoLine } from "@/lib/liuyao/casting";
import { cn } from "@/lib/utils";

type ShakeStep = "ready" | "casting" | "complete";

type DeviceMotionPermission = "granted" | "denied" | "default";

type DeviceMotionEventWithPermission = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<DeviceMotionPermission>;
};

const maxShakeCount = 6;
const shakeThreshold = 18;
const shakeCooldownMs = 780;

export function LiuyaoShakeClient() {
  const [step, setStep] = useState<ShakeStep>("ready");
  const [lines, setLines] = useState<LiuyaoLine[]>([]);
  const [isShaking, setIsShaking] = useState(false);
  const [motionEnabled, setMotionEnabled] = useState(false);
  const lastShakeAtRef = useRef(0);

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

      const nextLines = [...currentLines, castLiuyaoLine(currentLines.length + 1)];
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

  const requestMotion = useCallback(async () => {
    if (typeof DeviceMotionEvent === "undefined") {
      setMotionEnabled(false);
      return;
    }

    const motionEvent = DeviceMotionEvent as DeviceMotionEventWithPermission;

    if (typeof motionEvent.requestPermission !== "function") {
      setMotionEnabled(true);
      return;
    }

    try {
      const permission = await motionEvent.requestPermission();
      setMotionEnabled(permission === "granted");
    } catch {
      setMotionEnabled(false);
    }
  }, []);

  useEffect(() => {
    if (!motionEnabled || !canCast) {
      return;
    }

    function handleMotion(event: DeviceMotionEvent) {
      const acceleration = event.accelerationIncludingGravity;
      if (!acceleration) {
        return;
      }

      const x = acceleration.x ?? 0;
      const y = acceleration.y ?? 0;
      const z = acceleration.z ?? 0;
      const force = Math.sqrt(x * x + y * y + z * z);
      const now = Date.now();

      if (force >= shakeThreshold && now - lastShakeAtRef.current > shakeCooldownMs) {
        lastShakeAtRef.current = now;
        castNextLine();
      }
    }

    window.addEventListener("devicemotion", handleMotion);
    return () => window.removeEventListener("devicemotion", handleMotion);
  }, [castNextLine, canCast, motionEnabled]);

  return (
    <main className="light-surface-text-scope mx-auto min-h-screen max-w-[430px] bg-paper pb-8 text-ink shadow-soft">
      <header className="sticky top-0 z-20 flex h-20 items-center justify-between bg-[#F8F7EE] px-[15px] pb-2 pt-6">
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
        <button type="button" className="-mr-1 flex h-10 w-10 items-center justify-center text-[#8b8985]" aria-label="静音">
          <VolumeX size={24} strokeWidth={2.2} />
        </button>
      </header>

      <section className="px-4 pt-4">
        <div className="rounded-[22px] bg-white px-5 pb-6 pt-7 text-center shadow-soft">
          <div className="mx-auto flex h-10 w-[78%] items-center justify-center rounded-full bg-[#f2f2f0] text-[16px] font-semibold text-ink">
            {step === "complete" ? "卦象已成" : "摇晃起卦"}
          </div>

          <div className="relative mt-10 flex min-h-[210px] items-center justify-center overflow-hidden rounded-[22px] bg-[#f6f0e2]">
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(180deg,rgba(246,240,226,0),rgba(248,247,238,0.8))]" />
            <div className={cn("liuyao-shell relative z-10", isShaking && "animate-liuyao-phone-shake")} aria-hidden="true">
              <span className="liuyao-shell-cell cell-one" />
              <span className="liuyao-shell-cell cell-two" />
              <span className="liuyao-shell-cell cell-three" />
              <span className="liuyao-shell-cell cell-four" />
              <span className="liuyao-shell-cell cell-five" />
            </div>
          </div>

          <p className="mt-7 text-center text-[23px] font-semibold leading-[1.7] text-ink">
            {step === "complete" ? "卦象已成，天地有数" : "请摇晃手机六次"}
            {step !== "ready" ? (
              <>
                <br />
                <span className="text-[31px] font-medium text-[#a58024]">{shakeCount}/{maxShakeCount}</span>
              </>
            ) : null}
          </p>

          {step === "ready" && motionEnabled ? (
            <p className="mt-2 text-[15px] font-semibold text-mutedInk">已开启感应，请摇晃手机</p>
          ) : null}

          {lines.length > 0 ? (
            <div className="mx-auto mt-6 flex min-h-[216px] w-[76%] flex-col items-center justify-center gap-3 rounded-[22px] bg-[#faf9f3] py-5" aria-label="已生成卦爻">
              {[...lines].reverse().map((line) => (
                <div key={line.position} className="flex h-8 items-center justify-center gap-3">
                  <LinePreviewSymbol symbol={line.kind === "old-yang" || line.kind === "young-yang" ? "yang" : "yin"} />
                  {line.changing ? <span className="text-[18px] font-semibold text-[#c23521]">×</span> : <span className="w-[13px]" />}
                </div>
              ))}
            </div>
          ) : (
            <div className="mx-auto mt-6 flex min-h-[216px] w-[76%] items-center justify-center rounded-[22px] bg-[#faf9f3] text-[15px] font-semibold text-mutedInk">
              等待起卦
            </div>
          )}

          <div className="mt-7 flex flex-col items-center gap-3">
            {step === "complete" ? (
              <Link
                href="/liuyao/result"
                className="flex h-14 w-[68%] items-center justify-center rounded-full bg-black text-[22px] font-semibold text-[#e8d4a7] shadow-soft"
              >
                查看卦象
              </Link>
            ) : (
              <div className="grid w-full grid-cols-2 gap-3">
                <button type="button" onClick={requestMotion} className="h-12 rounded-full bg-[#f2f2f0] px-5 text-[15px] font-semibold text-[#55514a]">
                  开始感应
                </button>
                <button type="button" onClick={castNextLine} className="h-12 rounded-full bg-black px-5 text-[15px] font-semibold text-[#e8d4a7]">
                  轻点模拟摇晃
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function LinePreviewSymbol({ symbol }: { symbol: "yang" | "yin" }) {
  if (symbol === "yang") {
    return <span className="block h-3.5 w-[92px] rounded-sm bg-[#303030]" />;
  }

  return (
    <span className="flex gap-3">
      <span className="block h-3.5 w-[39px] rounded-sm bg-[#303030]" />
      <span className="block h-3.5 w-[39px] rounded-sm bg-[#303030]" />
    </span>
  );
}

function BaguaPlate() {
  return (
    <div className="liuyao-bagua absolute inset-x-0 bottom-[17dvh] z-0 mx-auto h-[29dvh] max-h-[230px] min-h-[170px] w-[82%]" aria-hidden="true">
      {Array.from({ length: 8 }, (_, index) => (
        <span key={index} className="liuyao-gua" style={{ transform: `rotate(${index * 45}deg)` }} />
      ))}
      <span className="liuyao-bagua-ring ring-one" />
      <span className="liuyao-bagua-ring ring-two" />
    </div>
  );
}
