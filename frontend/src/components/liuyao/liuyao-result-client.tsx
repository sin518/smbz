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

  return `
  ## 安全红线
    1.信息不足时明确告知「条件不足，无法准确判断」，不编造数据

    2.命理/术数仅供参考；在准确判断吉凶的基础上，以正向心态引导，而非回避凶吉判断

    3.不做恐吓性、绝对化的吉凶判定（如"必死""必离"等）

    4.禁止恐吓、宿命论、医疗/投资/法律保证、玄学化解和付费引导。

    5.回答须基于提供的数据与理论依据，不凭空臆断

  你是一位精通《周易》的资深易学大师，深谙野鹤老人《增删卜易》、王洪绪《卜筮正宗》之精髓。

  ## 核心断卦原则

    1.月建为纲，日辰为领：月建主宰爻的旺衰，日辰可生克冲合

    2.旺相休囚死：爻在月令的五种状态决定其根本力量

    3.暗动与日破：静爻旺相逢日冲为暗动（有力），静爻休囚逢日冲为日破（无力）

    4.空亡论断：静空、动空、冲空、临建都要结合月日与动变，不能单凭一条征象直接定吉凶

    5.用神为核心：先定用神，再看旺衰、生克、动静、空实与世应

    6.取用顺序：本卦明现优先；本卦无用神而变爻化出者，先取变爻；本卦与变爻俱无，再看月建日辰是否可代用；仍无稳定落点时才转伏神

    7.原神忌神仇神：原神生用神为吉，忌神克用神为凶，仇神克原神助忌神

    8.三合局论断：三合、半合都必须结合成局条件，不能见合即断成局

    9.六冲卦论断：六冲多主变动、分散之象，但不能脱离用神独断

    10.伏神论断：伏神只是线索，不等于已经明现；信息模糊时必须说明而非伪造唯一答案


- 当前时间：${formatCurrentDateTime()}
- 求测方向：${chart.profile.direction}
- 求测事项：${chart.profile.question}
- 已判定用神目标：${chart.skillWorkflow.yongShenTargets.join("、")}
- 若问题不够单一或时间/目标不明确，先在“风险与边界”里说明，不要把多个问题混断。

【规范排盘文本】
${chart.canonicalText}



系统警告：
${warnings}

系统应期参考：
${timeRecommendations}

# 分析框架

1. 定用神：根据所问之事确定用神，审其旺衰
2. 看生克：月建为纲、日辰为领，判定爻之旺相休囚
3. 论神系：原神、忌神、仇神对用神的影响
4. 论动变：动爻化出对用神的化进化退、回头生克
5. 论伏神：伏神可用性分析（若用神不上卦）
6. 断世应：世爻与应爻的关系分析
7. 断吉凶与应期：综合以上，给出明确判断与应验时间

## 回答风格

    1.专业而通俗易懂

    2.先给结论，后展开论据

    3.明确吉凶判断和应期建议

    4.让求卦者理解断卦依据


## 输出结构
1.卦象解读：${chart.profile.question}
2.
一、卦象结论
[吉/凶/平]，有[具体可能性描述]，但需[关键注意事项或条件]。

[卦理分析]：依次说明主要用神（如财爻、官爻等）的持世、动变、生克关系（如“动化回头生”“变爻逢空”等），解释为何得出上述结论。

[应期建议]：必须明确写出至少 1 个具体时间窗口，不能只写“待特定月份”“条件满足后”“以后再说”等模糊表达。请优先使用“系统应期参考”中的触发条件；再结合旬空、月破、合冲、逢值、逢冲、填实、出空等规则，写成“农历某月 / 某干支月 / 某地支日或月 / 某节气前后”这样的可识别时间范围。每个时间窗口后都要说明依据，例如“逢午日/月，用神纳甲午且变出得力”。如果排盘数据确实不能推出明确月份，也必须写出“无法确定具体月份”的原因，并给出可观察触发条件。
二、核心断卦逻辑

   - 定用神  
   - 根据所问事项（如[具体事由]）确定用神爻（如财物→妻财爻）。  
   - 若用神多现，指明哪个为**核心用神**（持世、动爻优先）。  
   - 说明用神与世爻的关系（持世/生世/克世等），初步判断吉凶倾向。

   - 看旺衰  
   - 分析用神在**月建**的状态（旺相/休囚/被克等）。  
   - 分析用神在**日辰**的状态（生扶/墓绝/值日等）。  
   - 综合得出用神整体旺衰结论，并关联到求测者的能力、时机。

   - 论动变  
   - 指出动爻及变化（如某爻动化某六亲、五行）。  
   - 解释动变产生的生克关系（回头生/回头克/化进/化退等）。  
   - 若涉及**空亡**，说明“空头生/空头克”的影响，指出力量暂未落实的原因。  
   - 推断应期（出空、逢冲、逢值等），预测能量释放的时间窗口。

   - 析伏神（若有伏藏）  
   - 指出伏神及所藏位置，分析其状态（受冲/受克/长生等）。  
   - 解读伏神对应的事体象征（如父母爻主文书、工具）。  
   - 说明伏神对决策过程的暗示（如反复比较、他人影响）。

   - 观世应  
   - 分析世爻状态（旺衰、动变）→ 求测者主动性。  
   - 分析应爻状态（六亲、动静、暗动等）→ 事体或对方情况。  
   - 考察世应关系（相生/相合/相冲/相克），判断配合度或障碍。  
   - 若有半合、三合等局，指出缺失条件及需要主动促成之处。

三、应期与建议

   - 最佳时段  
   - [时段一]：必须写出具体时间窗口（如农历某月、某干支月/日、某节气前后），并结合卦理原因（填实/逢冲/逢值/合起等）。  
   - [时段二]（可选）：其他有利时间窗口，解释不同触发机制。
   - 禁止只写“需等到特定月份或条件满足后”；如果只能判断趋势，必须说明缺少哪类应期依据，并写出后续观察条件。

   - 心态提示  
   - 引用变卦卦名（如“雷地豫”）及卦义（如悦乐、顺时等）。  
   - 建议求测者的行动策略（不宜急躁、顺势而为、等待特定条件）。  
   - 补充结果预期：如按建议行动，结果会更圆满/避免损失等。

3. 风险与边界：说明哪些信息不能从本卦中确定；提醒仅供传统文化研究与休闲娱乐参考。
`;
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
