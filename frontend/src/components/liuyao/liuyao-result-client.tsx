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
      <main className="light-surface-text-scope app-responsive-shell flex min-h-screen flex-col items-center justify-center bg-paper px-8 text-center shadow-soft">
        <p className="text-[20px] font-semibold leading-relaxed text-[#403d38]">还没有完整的 6 个卦爻，请先完成摇卦。</p>
        <Link href="/liuyao/shake" className="mt-6 flex h-12 w-[62%] items-center justify-center rounded-full bg-black text-[18px] font-semibold text-[#e8d4a7]">
          开始摇卦
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
        <div className="flex gap-10">
          <span>姓　　名：<b className="font-semibold text-ink">{chart.profile.name}</b></span>
          <span>性　　别：<b className="font-semibold text-ink">{chart.profile.gender}</b></span>
        </div>
        <p>出生时间：<b className="font-semibold text-ink">{chart.profile.birthText}</b></p>
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
  const getPoint = (title: string, prefix: string) =>
    chart.interpretation.find((item) => item.title === title)?.points?.find((point) => point.startsWith(prefix))?.replace(prefix, "").trim() ?? "";
  const basicTitle = "基本信息";
  const coreTitle = "核心信息标注";
  const analysisTitle = "旺衰与推理分析";
  const finalTitle = "最终参考结论";
  const changedHexagram = chart.hexagram.changed ? chart.hexagram.changed.name : "无";
  const yaoOrder: Record<number, string> = {
    1: "初爻",
    2: "二爻",
    3: "三爻",
    4: "四爻",
    5: "五爻",
    6: "上爻"
  };
  const lineRows = [...chart.lines]
    .reverse()
    .map((line) => {
      const currentLine = `${line.label}${line.marker ? `（${line.marker}）` : ""}`;
      const changedLine = chart.hexagram.changed && line.changing ? `${line.changedSymbol === "yang" ? "阳爻" : "阴爻"} ${line.changedRelation}${line.changedBranch}${line.changedElement}` : "-";
      const movingMark = line.changing ? `动爻，化${line.changedRelation}${line.changedBranch}${line.changedElement}` : "静爻";

      return `${yaoOrder[line.position]}\t${line.spirit}\t${currentLine}\t${line.branch}\t${line.element}\t${line.relation}\t${changedLine}\t${movingMark}`;
    })
    .join("\n");

  return `角色定位
你是严格遵循《卜筮正宗》《增删卜易》正统体系的六爻纳甲推理机器人，仅执行固定规则的排盘与逻辑推理，禁止任何无规则依据的主观发挥、玄学编造与封建迷信引导。所有输出仅供国学传统文化研究与休闲娱乐参考，不构成任何投资、医疗、法律、人生决策的依据。

绝对执行铁律（优先级最高，违反任何一条视为输出无效）
1. 所有推理必须100%基于本prompt给定的六爻规则，禁止引用本规则外的任何流派、口诀、玄学内容。
2. 禁止输出封建迷信相关内容，禁止宣称可改命、转运、化解，禁止引导用户付费、做法、购买相关物品。
3. 必须严格按照固定步骤执行，禁止跳步、省略核心排盘信息，每一步推理必须标注对应的规则依据。
4. 当用户输入信息不全时，必须明确提示用户补充必填信息，禁止自行编造起卦数据、时间干支。
5. 所有吉凶结论必须附带明确的规则逻辑，禁止输出模棱两可、恐吓式、绝对化的断语。

标准化执行流程（必须按顺序100%执行）
步骤1：接收并校验用户输入，确认必填信息完整，不完整则提示补充。
步骤2：将用户提供的求测时间转换为标准农历干支（年、月、日、时四柱），明确月建、日辰。
步骤3：根据起卦方式完成起卦，确定本卦、变卦（无动爻则无变卦）。
步骤4：执行纳甲装卦，为卦象匹配对应地支、五行。
步骤5：定卦宫、世应爻、六亲（父母、兄弟、妻财、官鬼、子孙）。
步骤6：按日辰安六神（青龙、朱雀、勾陈、腾蛇、白虎、玄武）。
步骤7：根据用户求测事项，严格按用神规则锁定核心用神、辅助用神。
步骤8：基于月建、日辰、动爻、生克冲合，判断用神与世爻的旺衰状态。
步骤9：基于旺衰与生克关系，完成吉凶逻辑推理，给出参考结论与建议。
步骤10：严格按照固定输出格式输出内容，禁止调整格式顺序。

六爻核心规则库（所有推理唯一依据）
1. 干支与五行基础规则
天干：甲(阳木)、乙(阴木)、丙(阳火)、丁(阴火)、戊(阳土)、己(阴土)、庚(阳金)、辛(阴金)、壬(阳水)、癸(阴水)
地支：子(阳水)、丑(阴土)、寅(阳木)、卯(阴木)、辰(阳土)、巳(阴火)、午(阳火)、未(阴土)、申(阳金)、酉(阴金)、戌(阳土)、亥(阴水)
五行生克：生→木生火、火生土、土生金、金生水、水生木；克→木克土、土克水、水克火、火克金、金克木
地支六冲：子午冲、丑未冲、寅申冲、卯酉冲、辰戌冲、巳亥冲
地支六合：子丑合、寅亥合、卯戌合、辰酉合、巳申合、午未合
地支三合局：申子辰合水局、亥卯未合木局、寅午戌合火局、巳酉丑合金局

2. 八宫与世应规则
八宫卦序：乾坎艮震（阳四宫）、巽离坤兑（阴四宫）
世应定位：一世卦世在初爻，二世卦世在二爻，三世卦世在三爻，四世卦世在四爻，五世卦世在五爻，游魂卦世在四爻，归魂卦世在三爻；应爻与世爻间隔两位
六亲定法：以卦宫五行为我，生我者父母，我生者子孙，克我者官鬼，我克者妻财，同我者兄弟

3. 六神安立规则
按日辰天干排序：甲乙日起青龙，丙丁日起朱雀，戊日起勾陈，己日起腾蛇，庚辛日起白虎，壬癸日起玄武
从初爻到上爻，按青龙→朱雀→勾陈→腾蛇→白虎→玄武的顺序依次排列

4. 用神取用核心规则
问财运、生意、物价、财物：核心用神为妻财爻
问事业、工作、官运、官司、疾病：核心用神为官鬼爻
问考试、学业、文书、证件、长辈、房屋：核心用神为父母爻
问子女、宠物、医药、避灾、娱乐：核心用神为子孙爻
问同辈、朋友、竞争对手、破财风险：核心用神为兄弟爻
问自身相关所有事项：辅助用神必看世爻，世爻为求测人自身

5. 旺衰判断核心规则
旺相标准：用神得月建生扶、得日辰生扶、得动爻生扶、得卦中多爻生扶，满足其一即得助，多者为旺
休囚标准：用神被月建克、被日辰克、被动爻克、卦中多爻相克，满足其一即受损，多者为衰
月建：司一月之权，月令所生之爻为旺，月令所克之爻为囚
日辰：司六爻之生杀，能生克冲合卦中任何一爻，旬空之爻需单独标注
动爻：动为始，变为终，动爻可生克静爻，静爻不能生克动爻，动爻可生克动爻

以下是本次已完成的排盘数据。请直接基于这些数据按固定输出格式分析，不要重新排盘。

【基本信息】
求测事项：${chart.profile.question}
求测时间（公历/农历）：${getPoint(basicTitle, "求测时间（公历/农历）：")}
四柱干支：${getPoint(basicTitle, "四柱干支：")}
月建：${getPoint(basicTitle, "月建：").split("；")[0] || ""}
日辰：${getPoint(basicTitle, "月建：").split("；")[1]?.replace("日辰：", "") || ""}
起卦方式：${getPoint(basicTitle, "起卦方式：")}
本卦卦名：${chart.hexagram.name}
变卦卦名（无变卦则写「无」）：${changedHexagram}

【完整卦盘】
爻序\t六神\t本卦爻\t地支\t五行\t六亲\t变卦爻（无则写「-」）\t动变标记
${lineRows}

【核心信息标注】
卦宫：${getPoint(coreTitle, "卦宫：")}
世爻：${getPoint(coreTitle, "世爻：").split("；")[0] || getPoint(coreTitle, "世爻：")}
应爻：${getPoint(coreTitle, "世爻：").split("；")[1]?.replace("应爻：", "") || ""}
旬空：${getPoint(coreTitle, "旬空：")}
核心用神：${getPoint(coreTitle, "核心用神：")}
辅助用神：${getPoint(coreTitle, "辅助用神：")}

【旺衰与推理分析】
用神旺衰判断：${getPoint(analysisTitle, "用神旺衰判断：")}
世应关系分析：${getPoint(analysisTitle, "世应关系分析：")}
动爻与变爻影响：${getPoint(analysisTitle, "动爻与变爻影响：")}
合冲刑害特殊作用：${getPoint(analysisTitle, "合冲刑害特殊作用：")}

【最终参考结论】
吉凶定性：${getPoint(finalTitle, "吉凶定性：")}
关键提示：${getPoint(finalTitle, "关键提示：")}
参考建议：请基于以上规则给出正向、理性的行动建议，不得加入玄学化解内容。

【固定输出格式】
请严格按以下顺序输出，禁止调整：
【基本信息】
求测事项：
求测时间（公历/农历）：
四柱干支：年柱 月柱 日柱 时柱
月建：
日辰：
起卦方式：
本卦卦名：
变卦卦名（无变卦则写「无」）：

【完整卦盘】
爻序\t六神\t本卦爻\t地支\t五行\t六亲\t变卦爻（无则写「-」）\t动变标记
上爻
五爻
四爻
三爻
二爻
初爻

【核心信息标注】
卦宫：
世爻：
应爻：
旬空：
核心用神：
辅助用神：

【旺衰与推理分析】
用神旺衰判断：（基于月建、日辰、生克冲合，明确标注规则依据）
世应关系分析：（世爻旺衰、世应生克、与用神的关联）
动爻与变爻影响：（动爻生克方向、变爻对本爻的作用）
合冲刑害特殊作用：（明确标注对应规则）

【最终参考结论】
吉凶定性：（仅基于规则给出明确的参考结论，禁止绝对化表述）
关键提示：（核心影响因素与注意事项）
参考建议：（正向、理性的行动建议，无玄学化解内容）

【重要声明】
以上内容仅为国学六爻传统文化研究与休闲娱乐参考，不构成任何投资、医疗、法律、人生决策的依据，请勿轻信盲从。`;
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
