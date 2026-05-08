"use client";

import { ArrowLeft, LockKeyhole, MoreHorizontal } from "lucide-react";
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

const freeInterpretationTitles = new Set(["基本卦象", "世应用神"]);

export function LiuyaoResultClient() {
  const [chart, setChart] = useState<LiuyaoChart | null>(null);
  const [missingCasting, setMissingCasting] = useState(false);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("checking");
  const pathname = usePathname();

  useEffect(() => {
    const input = readJson<LiuyaoStoredInput>("sm1:current-liuyao-input");
    const casting = readJson<LiuyaoStoredCasting>("sm1:current-liuyao-casting");
    if (casting?.status !== "complete" || casting.lines?.length !== 6) {
      setMissingCasting(true);
      return;
    }

    setChart(buildLiuyaoChart(input?.input, casting.lines));
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
      <main className="mx-auto flex min-h-screen max-w-[430px] flex-col items-center justify-center bg-[#F8F7EE] px-8 text-center shadow-soft">
        <p className="text-[20px] font-semibold leading-relaxed text-[#403d38]">还没有完整的 6 个卦爻，请先完成摇卦。</p>
        <Link href="/liuyao/shake" className="mt-6 flex h-12 w-[62%] items-center justify-center rounded-full bg-black text-[18px] font-semibold text-[#e8d4a7]">
          开始摇卦
        </Link>
      </main>
    );
  }

  if (!chart) {
    return <main className="mx-auto min-h-screen max-w-[430px] bg-[#F8F7EE]" />;
  }

  const isSignedIn = authStatus === "signed-in";
  const freeInterpretation = chart.interpretation.filter((item) => freeInterpretationTitles.has(item.title));
  const lockedInterpretation = chart.interpretation.filter((item) => !freeInterpretationTitles.has(item.title));
  const visibleInterpretation = isSignedIn ? chart.interpretation : freeInterpretation;
  const loginHref = `/settings/login?next=${encodeURIComponent(pathname || "/liuyao/result")}`;

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-paper pb-5 text-ink shadow-soft [font-family:'PingFang_SC','Microsoft_YaHei',sans-serif]">
      <header className="sticky top-0 z-20 flex h-20 items-center justify-between bg-[#F8F7EE] px-[15px] pb-2 pt-6">
        <div className="flex items-center justify-between">
          <Link href="/liuyao" className="-ml-1 flex h-10 w-10 items-center justify-center" aria-label="返回六爻首页">
            <ArrowLeft size={24} />
          </Link>
        </div>
        <h1 className="text-[18px] font-medium">六爻断事</h1>
        <button type="button" className="-mr-1 flex h-10 w-10 items-center justify-center" aria-label="更多">
          <MoreHorizontal size={25} />
        </button>
      </header>

      <section className="mx-4 rounded-[22px] bg-white px-4 py-4 text-[14px] font-normal leading-[1.8] text-mutedInk shadow-soft">
        <div className="flex gap-10">
          <span>姓　　名：<b className="font-semibold text-ink">{chart.profile.name}</b></span>
          <span>性　　别：<b className="font-semibold text-ink">{chart.profile.gender}</b></span>
        </div>
        <p>出生时辰：<b className="font-semibold text-ink">{chart.profile.birthText}</b></p>
        <p>起卦时间：<b className="font-semibold text-ink">{chart.profile.castingText}</b></p>
        <p>求测方向：<b className="font-semibold text-ink">{chart.profile.direction}</b></p>
        <p>求测问题：<b className="font-semibold text-ink">{chart.profile.question}</b></p>
      </section>

      <section className="mx-4 mt-4 rounded-[22px] bg-white px-4 py-4 shadow-soft">
        <h2 className="rounded-full bg-[#f2f2f0] py-[7px] text-center text-[16px] font-medium text-ink">刑冲合会</h2>
        <div className="grid grid-cols-3 px-0 py-[15px] text-center">
          {chart.lineRelations.map((item) => (
            <span key={item} className="mb-2 text-[15px] font-semibold text-[#a58024]">{item}</span>
          ))}
        </div>
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
        <h2 className="mb-2.5 border-l-4 border-[#a58024] pl-2.5 text-[16px] font-semibold">
          卦象解读
        </h2>
        <div className="rounded-[22px] bg-white p-[15px] shadow-soft">
          {visibleInterpretation.map((item) => (
            <InterpretationBlock key={item.title} item={item} />
          ))}
          {!isSignedIn && lockedInterpretation.length > 0 ? (
            <section className="mt-4 rounded-[22px] bg-[#f6f0e2] px-4 py-5 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-black text-[#e8d4a7]">
                <LockKeyhole size={20} />
              </div>
              <h3 className="mt-3 text-[16px] font-semibold text-[#3c3328]">登录后查看完整精断</h3>
              <p className="mt-2 text-[14px] leading-6 text-[#6d6254]">
                日月世爻、爻间合克、三合三会、动爻化出等详细内容已隐藏。
              </p>
              <Link href={loginHref} className="mx-auto mt-4 flex h-11 w-[72%] items-center justify-center rounded-full bg-black text-[16px] font-semibold text-[#e8d4a7]">
                去登录查看
              </Link>
            </section>
          ) : null}
        </div>
      </section>
    </main>
  );
}

type InterpretationItem = LiuyaoChart["interpretation"][number];

function InterpretationBlock({ item }: { item: InterpretationItem }) {
  return (
    <div className="border-b border-[#f3ead6] pb-3 last:border-b-0 last:pb-0">
      <h3 className="my-[10px] text-[15px] font-semibold">【{item.title}】</h3>
      {item.body ? (
        <p className="m-0 text-[14px] font-normal leading-[1.7] text-[#444]">
          <HighlightedText text={item.body} />
        </p>
      ) : null}
      {item.points?.length ? (
        <ul className="m-0 space-y-2 p-0">
          {item.points.map((point, index) => (
            <li key={`${item.title}-${index}`} className="grid grid-cols-[18px_1fr] gap-1 text-[14px] font-normal leading-[1.65] text-[#444]">
              <span className="mt-[9px] h-1.5 w-1.5 rounded-full bg-[#a58024]" aria-hidden="true" />
              <span>
                <HighlightedText text={point} />
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function HighlightedText({ text }: { text: string }) {
  const parts = text.split(/(回头生|回头克|化泄|化制|化扶|世爻|应爻|用神|日建|月建|三合|三会|半合|生|克|冲|合|刑|害|忌|喜|旺|相|休|衰)/g);

  return (
    <>
      {parts.map((part, index) =>
        isHighlight(part) ? (
          <b key={`${part}-${index}`} className="font-semibold text-[#a58024]">
            {part}
          </b>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        )
      )}
    </>
  );
}

function isHighlight(value: string) {
  return /^(回头生|回头克|化泄|化制|化扶|世爻|应爻|用神|日建|月建|三合|三会|半合|生|克|冲|合|刑|害|忌|喜|旺|相|休|衰)$/.test(value);
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
