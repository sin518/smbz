import type { ChartColumn, DemoBaziChart, LuckColumn } from "@/lib/bazi/demo";

type FiveElement = "木" | "火" | "土" | "金" | "水";
type YinYang = "阳" | "阴";

type StemMeta = {
  element: FiveElement;
  yinYang: YinYang;
};

type HiddenStem = {
  stem: string;
  element: FiveElement;
  qi: "主气" | "中气" | "余气";
  weight: number;
};

export type AiCommandFocus = "全项" | "事业" | "财运" | "婚恋" | "子女" | "六亲" | "健康" | "学业";

export interface AiCommandInput {
  chart: DemoBaziChart;
  focus: AiCommandFocus;
  useSolarTime?: boolean;
}

const focusDescriptions: Record<AiCommandFocus, string> = {
  全项: "事业、财富、感情、健康、性格、大运变化均需覆盖。",
  事业: "重点分析事业方向、能力优势、工作节奏、职业风险与大运变化。",
  财运: "重点分析财富结构、收入方式、资源配置、破财风险与大运变化。",
  婚恋: "重点分析感情模式、婚姻关系、人际互动、沟通建议与大运变化。",
  子女: "重点分析子女缘分、亲子互动、教育陪伴、家庭责任与大运变化。",
  六亲: "重点分析父母、伴侣、子女、兄弟姐妹等关系结构与边界建议。",
  健康: "重点分析体质倾向、压力来源、作息养护；不得替代医疗诊断。",
  学业: "重点分析学习方式、考试节奏、专业选择、资质积累与大运变化。"
};

const elementOrder: FiveElement[] = ["木", "火", "土", "金", "水"];

const stemMeta: Record<string, StemMeta> = {
  甲: { element: "木", yinYang: "阳" },
  乙: { element: "木", yinYang: "阴" },
  丙: { element: "火", yinYang: "阳" },
  丁: { element: "火", yinYang: "阴" },
  戊: { element: "土", yinYang: "阳" },
  己: { element: "土", yinYang: "阴" },
  庚: { element: "金", yinYang: "阳" },
  辛: { element: "金", yinYang: "阴" },
  壬: { element: "水", yinYang: "阳" },
  癸: { element: "水", yinYang: "阴" }
};

const stemElements = Object.fromEntries(Object.entries(stemMeta).map(([stem, meta]) => [stem, meta.element])) as Record<string, FiveElement>;

const branchElements: Record<string, FiveElement> = {
  子: "水",
  丑: "土",
  寅: "木",
  卯: "木",
  辰: "土",
  巳: "火",
  午: "火",
  未: "土",
  申: "金",
  酉: "金",
  戌: "土",
  亥: "水"
};

const generates: Record<FiveElement, FiveElement> = {
  木: "火",
  火: "土",
  土: "金",
  金: "水",
  水: "木"
};

const controls: Record<FiveElement, FiveElement> = {
  木: "土",
  火: "金",
  土: "水",
  金: "木",
  水: "火"
};

const BRANCH_LIU_HE = [
  ["子", "丑", "子丑六合土"],
  ["寅", "亥", "寅亥六合木"],
  ["卯", "戌", "卯戌六合火"],
  ["辰", "酉", "辰酉六合金"],
  ["巳", "申", "巳申六合水"],
  ["午", "未", "午未六合土"]
] as const;

const BRANCH_CHONG = [
  ["子", "午", "子午冲"],
  ["丑", "未", "丑未冲"],
  ["寅", "申", "寅申冲"],
  ["卯", "酉", "卯酉冲"],
  ["辰", "戌", "辰戌冲"],
  ["巳", "亥", "巳亥冲"]
] as const;

const BRANCH_HAI = [
  ["子", "未", "子未害"],
  ["丑", "午", "丑午害"],
  ["寅", "巳", "寅巳害"],
  ["卯", "辰", "卯辰害"],
  ["申", "亥", "申亥害"],
  ["酉", "戌", "酉戌害"]
] as const;

const BRANCH_XING = [
  ["寅", "巳", "寅巳刑"],
  ["巳", "申", "巳申刑"],
  ["申", "寅", "申寅刑"],
  ["丑", "戌", "丑戌刑"],
  ["戌", "未", "戌未刑"],
  ["未", "丑", "未丑刑"],
  ["子", "卯", "子卯刑"]
] as const;

const BRANCH_HALF_COMBINE = [
  ["申", "子", "申子半合水局"],
  ["子", "辰", "子辰半合水局"],
  ["亥", "卯", "亥卯半合木局"],
  ["卯", "未", "卯未半合木局"],
  ["寅", "午", "寅午半合火局"],
  ["午", "戌", "午戌半合火局"],
  ["巳", "酉", "巳酉半合金局"],
  ["酉", "丑", "酉丑半合金局"]
] as const;

const hiddenStems: Record<string, HiddenStem[]> = {
  子: [hidden("癸", "主气", 1)],
  丑: [hidden("己", "主气", 1), hidden("癸", "中气", 0.5), hidden("辛", "余气", 0.25)],
  寅: [hidden("甲", "主气", 1), hidden("丙", "中气", 0.5), hidden("戊", "余气", 0.25)],
  卯: [hidden("乙", "主气", 1)],
  辰: [hidden("戊", "主气", 1), hidden("乙", "中气", 0.5), hidden("癸", "余气", 0.25)],
  巳: [hidden("丙", "主气", 1), hidden("戊", "中气", 0.5), hidden("庚", "余气", 0.25)],
  午: [hidden("丁", "主气", 1), hidden("己", "中气", 0.5)],
  未: [hidden("己", "主气", 1), hidden("丁", "中气", 0.5), hidden("乙", "余气", 0.25)],
  申: [hidden("庚", "主气", 1), hidden("壬", "中气", 0.5), hidden("戊", "余气", 0.25)],
  酉: [hidden("辛", "主气", 1)],
  戌: [hidden("戊", "主气", 1), hidden("辛", "中气", 0.5), hidden("丁", "余气", 0.25)],
  亥: [hidden("壬", "主气", 1), hidden("甲", "中气", 0.5)]
};

export function buildAiCommandText({ chart, focus, useSolarTime = false }: AiCommandInput) {
  const { profile, columns, luckCycles } = chart;
  const pillarText = columns.map((column) => `${column.title}${column.pillar.stem}${column.pillar.branch}`).join("，");
  const dayColumn = columns.find((column) => column.title === "日柱") ?? columns[2];
  const luckText = formatLuckCycles(luckCycles);
  const usefulGod = buildUsefulGodAnalysis(columns, luckCycles);

  return [
    "请你以理性、专业、诚实客观的命理分析师身份，基于以下资料进行八字分析。",
    "",
    "【出生信息】",
    `姓名：${profile.name || "未填写"}`,
    `性别：${profile.gender}`,
    `出生时间：${profile.solar}`,
    `出生地：${profile.location}`,
    `是否使用真太阳时：${useSolarTime ? "是" : "否"}`,
    `真太阳时：${profile.solarTime}`,
    "",
    "【八字信息】",
    `四柱：${pillarText}`,
    `日主：${dayColumn?.pillar.stem ?? "待补充"}`,
    `天干十神：${formatStemTenGods(columns)}`,
    `地支藏干十神：${formatBranchTenGods(columns)}`,
    "",
    "【命局信息】",
    `五行分布：${usefulGod.elementDistribution}`,
    `日主强弱：${usefulGod.strength}`,
    `地支分析：${usefulGod.branchAnalysis}`,
    `格局初判：${usefulGod.pattern}`,
    `调候判断：${usefulGod.climate}`,
    `通关逻辑：${usefulGod.passage}`,
    `用神：${usefulGod.usefulGod}`,
    `喜神：${usefulGod.favorableGod}`,
    `条件用神：${usefulGod.conditionalGod}`,
    `忌神：${usefulGod.unfavorableGod}`,
    `大运复核：${usefulGod.luckReview}`,
    `规则来源与优先级：${usefulGod.ruleSource}`,
    "",
    "【大运信息】",
    luckText,
    "说明：大运年份为简化区间，实际交运需以具体起运时间为准。",
    "",
    "【人生节点】",
    "工作、婚姻、生子、迁居、疾病、破财、发财等年份：暂无用户补充。请在分析中提示用户可补充已发生年份，用于反推与交叉验证。",
    "",
    "【分析重点】",
    focusDescriptions[focus],
    "",
    "【分析原则】",
    "依据传统命理，结合盲派方法，进行交叉验证，诚实客观表达。",
    "AI只负责解释排盘结果，不负责重新排盘；如信息不足，请明确说明不确定性。",
    "禁止宿命论、恐吓式表达、医疗诊断、投资保证和婚姻绝对判断。",
    "使用命理术语时请解释含义，并给出现实、可执行的建议。",
    "",
    "【输出结构】",
    "1. 命格结构与性格特征：推理过程、分析结论、现实建议",
    "2. 事业方向与能力优势：推理过程、分析结论、现实建议",
    "3. 财运结构与财富趋势：推理过程、分析结论、现实建议",
    "4. 健康体质与养护方向：推理过程、分析结论、现实建议",
    "5. 婚姻感情与人际关系：推理过程、分析结论、现实建议",
    "6. 未来五年运势趋势：推理过程、分析结论、现实建议"
  ].join("\n");
}

export function getAiCommandFocusDescription(focus: AiCommandFocus) {
  return focusDescriptions[focus];
}

function formatLuckCycles(luckCycles: LuckColumn[]) {
  const cycles = luckCycles.filter((item) => item.stem !== "小" && item.branch !== "运").slice(0, 5);

  if (!cycles.length) {
    return "至少填写三个大运：待排盘数据补充。";
  }

  return cycles
    .map((item, index) => `${index + 1}. ${item.stem}${item.branch}大运，起止年份：${formatLuckYearRange(item, cycles[index + 1])}，对应年龄：${item.age || "待补充"}`)
    .join("\n");
}

function buildUsefulGodAnalysis(columns: ChartColumn[], luckCycles: LuckColumn[]) {
  const dayColumn = columns.find((column) => column.title === "日柱") ?? columns[2];
  const monthColumn = columns.find((column) => column.title === "月柱") ?? columns[1];
  const dayElement = stemElements[dayColumn?.pillar.stem ?? ""];
  const monthElement = branchElements[monthColumn?.pillar.branch ?? ""];
  const monthMain = hiddenStems[monthColumn?.pillar.branch ?? ""]?.[0];

  if (!dayElement || !monthElement || !monthMain) {
    return {
      elementDistribution: "排盘信息不足，暂不生成五行加权分布。",
      strength: "排盘信息不足，暂不判断日主强弱。",
      branchAnalysis: "排盘信息不足，暂不生成地支分析。",
      pattern: "排盘信息不足，暂不生成格局。",
      climate: "排盘信息不足，暂不生成调候。",
      passage: "排盘信息不足，暂不生成通关。",
      usefulGod: "排盘信息不足。",
      favorableGod: "排盘信息不足。",
      conditionalGod: "排盘信息不足。",
      unfavorableGod: "排盘信息不足。",
      luckReview: "排盘信息不足。",
      ruleSource: "缺少日主或月令信息。"
    };
  }

  const counts = countElements(columns);
  const resourceElement = getGeneratingElement(dayElement);
  const outputElement = generates[dayElement];
  const wealthElement = controls[dayElement];
  const officerElement = getControllingElement(dayElement);
  const seasonState = getSeasonState(dayElement, monthElement);
  const rootAnalysis = analyzeRoots(columns, dayElement);
  const supportAnalysis = analyzeSupport(columns, dayElement);
  const pressureElements = dedupe([outputElement, wealthElement, officerElement]);
  const supportElements = dedupe([dayElement, resourceElement]);
  const pressureLevel = counts[outputElement] + counts[wealthElement] + counts[officerElement];
  const pressureProfile = analyzePressureProfile(columns, dayColumn.pillar.stem);
  const supportLevel = getSupportLevel({
    seasonLevel: seasonState.level,
    rootLevel: rootAnalysis.level,
    supportLevel: supportAnalysis.level,
    supportCount: counts[dayElement] + counts[resourceElement],
    pressureCount: pressureLevel,
    pressureProfile
  });
  const climate = analyzeClimate(monthColumn.pillar.branch);
  const branchRelations = analyzeBranchRelations(columns);
  const passage = analyzePassage(counts);
  const monthTenGod = getTenGod(dayColumn.pillar.stem, monthMain.stem);
  const structureElement = monthMain.element;
  const mixedOfficer = analyzeMixedOfficerKilling(columns, dayColumn.pillar.stem);
  const hurtingOfficer = analyzeHurtingOfficer(columns, dayColumn.pillar.stem, monthTenGod);
  const usefulGods = selectGods({
    climate,
    passage,
    supportLevel,
    supportElements,
    pressureElements,
    structureElement,
    resourceElement,
    dayElement,
    officerElement,
    outputElement
  });

  return {
    elementDistribution: `${formatElementDistribution(counts)}；已计入天干、地支藏干，并对月令${monthColumn.pillar.branch}按主气加权。`,
    strength: `日主${dayColumn.pillar.stem}${dayElement}，${seasonState.text}；${rootAnalysis.text}；${supportAnalysis.text}。综合初判为${supportLevel.label}，此结论来自月令权重、根气、帮扶、正官压力与食伤泄身交叉判断，不因“有根”直接判中和。`,
    branchAnalysis: `${formatBranchHidden(columns, dayColumn.pillar.stem)}；冲合刑害：${branchRelations}`,
    pattern: `以月令${monthColumn.pillar.branch}为纲，先取月令主气${monthMain.stem}${monthMain.element}，对应日主十神为${monthTenGod}，格局候选为${monthTenGod}格；月干${monthColumn.pillar.stem}只作为透出条件，不作为格局核心。官杀混杂检查：${mixedOfficer}伤官见官检查：${hurtingOfficer}`,
    climate: `${climate.text}；调候候选：${climate.elements.length ? climate.elements.join("、") : "暂无明显调候偏向"}。`,
    passage: `${passage.text}`,
    usefulGod: `${formatUsefulGodSystem(usefulGods)}；主用神用于核心调节，取法顺序为结构与通关优先，调候其次，强弱平衡最后复核。`,
    favorableGod: `${dedupe([...usefulGods.useful, ...usefulGods.favorable]).join("、")}；辅助用神/喜神用于增强结构、改善流通或补足承载力。`,
    conditionalGod: `${usefulGods.conditional.join("、")}；此类五行有条件可用，需看剂量与场景，不直接列为绝对喜忌。`,
    unfavorableGod: `${usefulGods.unfavorable.join("、")}；过旺时需控制。若岁运继续叠加，需观察结构失衡、冲克加重或调候失宜。`,
    luckReview: formatLuckReview(luckCycles, usefulGods.useful, usefulGods.favorable, usefulGods.conditional, usefulGods.unfavorable),
    ruleSource: "规则依据：子平法“以月令为纲”、通根看地支藏干、同党帮扶看比劫印星、调候看寒暖燥湿、通关看五行生克流通。权重仅用于工程排序：月令主气加权、藏干按主气/中气/余气递减；不得把数字当作吉凶断语。分析顺序固定为：1结构（格局）> 2流通（生克路径）> 3调候（寒暖燥湿）> 4平衡（强弱）> 5数量（仅参考）。财运不得写成结果论，健康不得写医疗诊断，婚姻不得绝对化。"
  };
}

function countElements(columns: ChartColumn[]) {
  const counts: Record<FiveElement, number> = {
    木: 0,
    火: 0,
    土: 0,
    金: 0,
    水: 0
  };

  columns.forEach((column) => {
    const stemElement = stemElements[column.pillar.stem];
    const branchElement = branchElements[column.pillar.branch];
    const branchWeight = column.title === "月柱" ? 2 : 1;

    if (stemElement) {
      counts[stemElement] += 1;
    }

    if (branchElement) {
      counts[branchElement] += branchWeight;
    }

    hiddenStems[column.pillar.branch]?.forEach((item) => {
      counts[item.element] += item.weight * branchWeight;
    });
  });

  return counts;
}

function hidden(stem: string, qi: HiddenStem["qi"], weight: number): HiddenStem {
  return {
    stem,
    element: stemElements[stem],
    qi,
    weight
  };
}

function formatElementDistribution(counts: Record<FiveElement, number>) {
  return elementOrder.map((element) => `${element}${formatCount(counts[element])}`).join("，");
}

function formatStemTenGods(columns: ChartColumn[]) {
  const dayStem = (columns.find((column) => column.title === "日柱") ?? columns[2])?.pillar.stem;

  return columns.map((column) => `${column.title}天干${column.pillar.stem}为${column.title === "日柱" ? "日主" : getTenGod(dayStem, column.pillar.stem)}`).join("，");
}

function formatBranchTenGods(columns: ChartColumn[]) {
  const dayStem = (columns.find((column) => column.title === "日柱") ?? columns[2])?.pillar.stem;

  return columns
    .map((column) => {
      const items = hiddenStems[column.pillar.branch]?.map((item) => `${item.stem}${item.qi}${getTenGod(dayStem, item.stem)}`).join("/") ?? "无藏干";

      return `${column.title}地支${column.pillar.branch}藏${items}`;
    })
    .join("，");
}

function getTenGod(dayStem: string, targetStem: string) {
  const day = stemMeta[dayStem];
  const target = stemMeta[targetStem];

  if (!day || !target) {
    return "待定";
  }

  if (target.element === day.element) {
    return target.yinYang === day.yinYang ? "比肩" : "劫财";
  }

  if (generates[day.element] === target.element) {
    return target.yinYang === day.yinYang ? "食神" : "伤官";
  }

  if (controls[day.element] === target.element) {
    return target.yinYang === day.yinYang ? "偏财" : "正财";
  }

  if (generates[target.element] === day.element) {
    return target.yinYang === day.yinYang ? "偏印" : "正印";
  }

  return target.yinYang === day.yinYang ? "七杀" : "正官";
}

function getSeasonState(dayElement: FiveElement, monthElement: FiveElement) {
  if (monthElement === dayElement) {
    return { level: 2, text: `月令五行${monthElement}与日主同气，日主得令` };
  }

  if (generates[monthElement] === dayElement) {
    return { level: 1, text: `月令五行${monthElement}生扶日主${dayElement}，日主得月令相生` };
  }

  if (controls[monthElement] === dayElement) {
    return { level: -2, text: `月令五行${monthElement}克制日主${dayElement}，日主失令` };
  }

  if (generates[dayElement] === monthElement) {
    return { level: -1, text: `日主${dayElement}泄于月令${monthElement}，日主不得令` };
  }

  return { level: -1, text: `日主${dayElement}克月令${monthElement}，月令不直接帮身` };
}

function analyzeRoots(columns: ChartColumn[], dayElement: FiveElement) {
  const roots = columns.flatMap((column) =>
    (hiddenStems[column.pillar.branch] ?? [])
      .filter((item) => item.element === dayElement)
      .map((item) => ({ label: `${column.title}${column.pillar.branch}藏${item.stem}${item.qi}`, column, hiddenStem: item }))
  );

  if (!roots.length) {
    return { level: -1, text: "地支未见日主同五行藏干，根气偏弱" };
  }

  const monthRoot = roots.find((item) => item.column.title === "月柱");
  const dayRoot = roots.find((item) => item.column.title === "日柱");
  const hasNearMainQiRoot = roots.some((item) => (item.column.title === "日柱" || item.column.title === "月柱") && item.hiddenStem.qi === "主气");
  const rootText = roots.map((item) => item.label).join("、");

  if (monthRoot && monthRoot.hiddenStem.qi !== "主气") {
    return {
      level: 1,
      text: `地支根气见${rootText}；其中月令藏干为${monthRoot.hiddenStem.qi}根，只能视为余气/杂气根，不等同于旺根`
    };
  }

  if (dayRoot && dayRoot.hiddenStem.qi !== "主气") {
    return {
      level: hasNearMainQiRoot ? 2 : 1,
      text: `地支根气见${rootText}；日支为坐下根但属${dayRoot.hiddenStem.qi}，近身有助但不等同主气旺根，仍需看月令寒暖与克泄`
    };
  }

  return {
    level: hasNearMainQiRoot ? 2 : 1,
    text: `地支根气见${rootText}，${hasNearMainQiRoot ? "近月日有主气根承托" : "多为远支或中余气根，承托有限"}`
  };
}

function analyzeSupport(columns: ChartColumn[], dayElement: FiveElement) {
  const resourceElement = getGeneratingElement(dayElement);
  const helpers = columns.flatMap((column) => {
    const items: string[] = [];

    if (stemElements[column.pillar.stem] === dayElement || stemElements[column.pillar.stem] === resourceElement) {
      items.push(`${column.title}天干${column.pillar.stem}`);
    }

    hiddenStems[column.pillar.branch]?.forEach((hiddenStem) => {
      if (hiddenStem.element === dayElement || hiddenStem.element === resourceElement) {
        items.push(`${column.title}${column.pillar.branch}藏${hiddenStem.stem}`);
      }
    });

    return items;
  });

  if (!helpers.length) {
    return { level: -1, text: "天干与藏干少见比劫印星帮扶" };
  }

  return {
    level: helpers.length >= 3 ? 2 : 1,
    text: `帮扶来源见${helpers.slice(0, 6).join("、")}${helpers.length > 6 ? "等" : ""}`
  };
}

function getSupportLevel({
  seasonLevel,
  rootLevel,
  supportLevel,
  supportCount,
  pressureCount,
  pressureProfile
}: {
  seasonLevel: number;
  rootLevel: number;
  supportLevel: number;
  supportCount: number;
  pressureCount: number;
  pressureProfile: { label: string; hasKilling: boolean };
}) {
  const level = seasonLevel + rootLevel + supportLevel;

  if (seasonLevel <= -2 && pressureCount > supportCount) {
    return { value: "弱", label: `身偏弱，${pressureProfile.label}` };
  }

  if (level >= 3 && supportCount >= pressureCount) {
    return { value: "旺", label: "偏旺" };
  }

  if (level <= -1 || pressureCount > supportCount + 1) {
    return { value: "弱", label: "偏弱" };
  }

  return { value: "中和", label: "中和" };
}

function analyzePressureProfile(columns: ChartColumn[], dayStem: string) {
  const allGods = columns.flatMap((column) => [
    column.title === "日柱" ? "日主" : getTenGod(dayStem, column.pillar.stem),
    ...(hiddenStems[column.pillar.branch]?.map((item) => getTenGod(dayStem, item.stem)) ?? [])
  ]);
  const officerCount = allGods.filter((item) => item === "正官").length;
  const killingCount = allGods.filter((item) => item === "七杀").length;
  const outputCount = allGods.filter((item) => item === "食神" || item === "伤官").length;
  const officerLabel =
    officerCount > 0 && killingCount === 0
      ? "正官压力偏旺"
      : killingCount > 0 && officerCount === 0
        ? "七杀压力偏旺"
        : killingCount > 0 && officerCount > 0
          ? "官杀并见，压力偏旺"
          : "克泄压力偏旺";
  const outputLabel = outputCount > 0 ? "，兼有食伤泄身" : "";

  return {
    label: `${officerLabel}${outputLabel}`,
    hasKilling: killingCount > 0
  };
}

function formatBranchHidden(columns: ChartColumn[], dayStem: string) {
  return columns
    .map((column) => {
      const hiddenText = hiddenStems[column.pillar.branch]?.map((item) => `${item.stem}${item.qi}${getTenGod(dayStem, item.stem)}`).join("/") ?? "无藏干";

      return `${column.title}${column.pillar.branch}：${hiddenText}`;
    })
    .join("；");
}

function analyzeBranchRelations(columns: ChartColumn[]) {
  const branches = columns.map((column) => column.pillar.branch);
  const clashes = findPairRelations(branches, BRANCH_CHONG);
  const punishments = findPairRelations(branches, BRANCH_XING);
  const relations = [...findPairRelations(branches, BRANCH_LIU_HE), ...clashes, ...findPairRelations(branches, BRANCH_HAI), ...punishments, ...findPairRelations(branches, BRANCH_HALF_COMBINE)];
  const notes: string[] = [];

  if (clashes.includes("子午冲")) {
    notes.push("子午冲作用到日支午时，需重点观察夫妻宫/日常关系、情绪冷热、工作与家庭节奏拉扯");
  }

  if (punishments.includes("子卯刑")) {
    notes.push("子卯刑只作辅助信息，权重低于子午冲，不作为核心判断");
  }

  const dayBranch = columns.find((column) => column.title === "日柱")?.pillar.branch;
  const monthBranch = columns.find((column) => column.title === "月柱")?.pillar.branch;
  const timeBranch = columns.find((column) => column.title === "时柱")?.pillar.branch;

  if (dayBranch && monthBranch && timeBranch && monthBranch === timeBranch && monthBranch !== dayBranch) {
    notes.push(`月支、时支两见${monthBranch}${branchElements[monthBranch]}，分居日支${dayBranch}两侧，相关五行压力靠近日主与日支；这是结构描述，不作为固定格局名称`);
  }

  if ((relations.includes("寅巳害") || relations.includes("寅巳刑")) && dayBranch === "寅") {
    notes.push("寅巳刑害可作为性格急躁、行动冲突的辅助判断，不宜压过月时夹日支等核心结构");
  }

  return relations.length ? `${dedupeText(relations).join("、")}${notes.length ? `；${notes.join("；")}` : ""}` : "未见明显冲合刑害";
}

function findPairRelations(branches: string[], relations: ReadonlyArray<readonly [string, string, string]>) {
  return relations.filter(([left, right]) => branches.includes(left) && branches.includes(right)).map(([, , label]) => label);
}

function analyzeClimate(monthBranch: string) {
  if (["亥", "子", "丑"].includes(monthBranch)) {
    return { elements: ["火", "木"] as FiveElement[], text: `${monthBranch}月寒湿偏重，调候先看火暖局，木可助火流通` };
  }

  if (["巳", "午", "未"].includes(monthBranch)) {
    return { elements: ["水", "金"] as FiveElement[], text: `${monthBranch}月暑燥偏重，调候先看水润局，金可生水` };
  }

  if (["辰", "戌"].includes(monthBranch)) {
    return { elements: ["水", "木"] as FiveElement[], text: `${monthBranch}月土燥湿杂见，调候需看水木疏润` };
  }

  if (["寅", "卯"].includes(monthBranch)) {
    return { elements: ["火", "土"] as FiveElement[], text: `${monthBranch}月木旺气升，调候宜火土承接` };
  }

  return { elements: ["水", "火"] as FiveElement[], text: `${monthBranch}月金旺燥肃，调候需视全局取水润或火炼` };
}

function analyzePassage(counts: Record<FiveElement, number>) {
  const highElements = getHighElements(counts);
  const lowElements = getLowElements(counts);
  const generatedPassages = highElements.flatMap((from) =>
    lowElements
      .filter((to) => controls[from] === to)
      .map((to) => {
        const bridge = generates[from];

        return `${from}克${to}，可取${bridge}通关（${from}生${bridge}，${bridge}生${to}）`;
      })
  );
  const passages = [...generatedPassages];

  if (counts.水 >= counts.火 + 1) {
    passages.unshift("水旺克火时，主要通关路径为水 → 木 → 火；木可化官生身，是关键通关五行");
    if (counts.土 > 0) {
      passages.push("土可制水，但土亦泄火，属于有条件使用，不宜简单列为绝对喜忌");
    }
  }

  return {
    elements: dedupe([
      ...(counts.水 >= counts.火 + 1 ? (["木"] as FiveElement[]) : []),
      ...passages.map((item) => item.match(/可取(.)通关/)?.[1]).filter((item): item is FiveElement => isFiveElement(item))
    ]),
    text: passages.length ? passages.join("；") : "五行克战未形成明显单点通关需求，仍需结合冲合与大运观察流通。"
  };
}

function selectGods({
  climate,
  passage,
  supportLevel,
  supportElements,
  pressureElements,
  structureElement,
  resourceElement,
  dayElement,
  officerElement,
  outputElement
}: {
  climate: { elements: FiveElement[] };
  passage: { elements: FiveElement[] };
  supportLevel: { value: string };
  supportElements: FiveElement[];
  pressureElements: FiveElement[];
  structureElement: FiveElement;
  resourceElement: FiveElement;
  dayElement: FiveElement;
  officerElement: FiveElement;
  outputElement: FiveElement;
}) {
  const balanceElements = supportLevel.value === "弱" ? [resourceElement, dayElement] : supportLevel.value === "旺" ? pressureElements : [];
  const conditional = dedupe([outputElement].filter((item) => item !== resourceElement && item !== dayElement));
  const rawUnfavorable =
    supportLevel.value === "弱"
      ? dedupe([officerElement, getGeneratingElement(officerElement)])
      : supportLevel.value === "旺"
        ? supportElements
        : getHighElementsFromList([...supportElements, ...pressureElements]);
  const useful = dedupe([...passage.elements.slice(0, 1), ...climate.elements.slice(0, 1), structureElement, ...balanceElements])
    .filter((item) => !rawUnfavorable.includes(item) && !conditional.includes(item))
    .slice(0, 3);
  const fallbackUseful = useful.length ? useful : dedupe([climate.elements[0], resourceElement, dayElement].filter((item): item is FiveElement => isFiveElement(item))).filter((item) => !rawUnfavorable.includes(item));
  const unfavorable = rawUnfavorable.filter((item) => !fallbackUseful.includes(item));
  const favorable = dedupe([...climate.elements.slice(1), ...passage.elements, ...balanceElements, structureElement])
    .filter((item) => !fallbackUseful.includes(item) && !unfavorable.includes(item) && !conditional.includes(item))
    .slice(0, 3);

  return {
    useful: fallbackUseful.length ? fallbackUseful.slice(0, 3) : [structureElement],
    favorable: favorable.length ? favorable : balanceElements.length ? balanceElements : [structureElement],
    climate: climate.elements,
    conditional: conditional.filter((item) => !fallbackUseful.includes(item) && !unfavorable.includes(item)).slice(0, 2),
    unfavorable: dedupe(unfavorable).slice(0, 3)
  };
}

function analyzeMixedOfficerKilling(columns: ChartColumn[], dayStem: string) {
  const stemGods = columns
    .filter((column) => column.title !== "日柱")
    .map((column) => getTenGod(dayStem, column.pillar.stem));
  const hasOfficer = stemGods.includes("正官");
  const hasKilling = stemGods.includes("七杀");

  if (!hasOfficer || !hasKilling) {
    return "未见天干正官与七杀同时并透；仍需看地支藏干及岁运是否引动官杀。";
  }

  return "天干见正官与七杀同时并透，存在官杀混杂倾向，需结合印星化杀、食伤制杀及大运制化判断成败。";
}

function formatUsefulGodSystem(gods: { useful: FiveElement[]; favorable: FiveElement[]; climate: FiveElement[]; conditional: FiveElement[]; unfavorable: FiveElement[] }) {
  const passageCore = gods.useful.includes("木") || gods.favorable.includes("木") ? "木" : gods.useful[0] ?? "待定";
  const climateCore = gods.climate.includes("火") ? "火" : gods.climate[0] ?? gods.useful[1] ?? "待定";

  return `用神体系：以${passageCore}为通关核心，以${climateCore}为调候核心；主用神：${gods.useful.join("、") || "待定"}`;
}

function analyzeHurtingOfficer(columns: ChartColumn[], dayStem: string, monthTenGod: string) {
  const stemGods = columns
    .filter((column) => column.title !== "日柱")
    .map((column) => `${column.title}${column.pillar.stem}${getTenGod(dayStem, column.pillar.stem)}`);
  const hasOfficerStructure = monthTenGod === "正官" || stemGods.some((item) => item.endsWith("正官"));
  const outputStems = stemGods.filter((item) => item.endsWith("伤官") || item.endsWith("食神"));

  if (!hasOfficerStructure || !outputStems.length) {
    return "未见明显食伤透干冲击正官格；仍需看岁运是否引动。";
  }

  return `${outputStems.join("、")}透出，月令主气为正官或原局存在正官结构，存在食伤与官星相见的结构风险；若木印通关，可转为学习力、专业表达与规则内发展。`;
}

function getHighElementsFromList(elements: FiveElement[]) {
  const counts = elements.reduce<Record<FiveElement, number>>(
    (result, element) => {
      result[element] += 1;
      return result;
    },
    { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 }
  );

  return getHighElements(counts);
}

function formatLuckReview(luckCycles: LuckColumn[], useful: FiveElement[], favorable: FiveElement[], conditional: FiveElement[], unfavorable: FiveElement[]) {
  const cycles = luckCycles.filter((item) => item.stem !== "小" && item.branch !== "运").slice(0, 5);

  if (!cycles.length) {
    return "暂无可复核大运。";
  }

  return cycles
    .map((item) => {
      const elements = dedupe([stemElements[item.stem], branchElements[item.branch]].filter((element): element is FiveElement => Boolean(element)));
      const hitsUseful = elements.filter((element) => useful.includes(element) || favorable.includes(element));
      const hitsConditional = elements.filter((element) => conditional.includes(element));
      const hitsUnfavorable = elements.filter((element) => unfavorable.includes(element));
      const tenGodText = formatLuckTenGod(item);
      const specific = getSpecificLuckReview(item);
      const benefit = specific?.benefit ?? (hitsUseful.length ? `有利：补用/助喜为${hitsUseful.join("、")}` : hitsConditional.length ? `有利：${hitsConditional.join("、")}适量可制衡结构` : "有利：需结合流年触发点观察");
      const risk = specific?.risk ?? (hitsUnfavorable.length ? `风险：触忌为${hitsUnfavorable.join("、")}` : hitsConditional.length ? `风险：${hitsConditional.join("、")}过旺会反耗或堵塞` : "风险：暂未直接触忌，仍需看冲合刑害");

      return `${item.year} ${item.stem}${item.branch}（${item.age || "年龄待补"}）：${tenGodText}；${benefit}，${risk}`;
    })
    .join("；");
}

function getSpecificLuckReview(item: LuckColumn) {
  const ganZhi = `${item.stem}${item.branch}`;
  const reviews: Record<string, { benefit: string; risk: string }> = {
    癸酉: {
      benefit: "有利：正官运利于规则平台、资质证书、组织岗位与责任提升",
      risk: "风险：癸水正官透出，酉金生水，压力、约束、竞争与情绪紧绷感增强"
    },
    壬申: {
      benefit: "有利：七杀运可带来突破、竞争与外部机会",
      risk: "风险：壬水七杀透出，申金生水，变化、压力与冲突感更强，需靠木火提升专业能力与主动性"
    },
    辛未: {
      benefit: "有利：未中藏乙丁，可补木火，未土适量可制水",
      risk: "风险：辛金透出可生水，土过旺亦会泄火"
    }
  };

  return reviews[ganZhi];
}

function formatLuckTenGod(item: LuckColumn) {
  const stemElement = stemElements[item.stem];
  const branchElement = branchElements[item.branch];
  const elementText = dedupe([stemElement, branchElement].filter((element): element is FiveElement => Boolean(element))).join("、") || "五行待定";

  return `${item.stem}${item.branch}五行${elementText}`;
}

function formatLuckYearRange(current: LuckColumn, next?: LuckColumn) {
  const start = Number(current.year);

  if (!Number.isFinite(start)) {
    return `${current.year}起`;
  }

  const nextStart = Number(next?.year);
  const end = Number.isFinite(nextStart) ? nextStart : start + 10;

  return `${start}–${end}`;
}

function getGeneratingElement(element: FiveElement) {
  return elementOrder.find((item) => generates[item] === element) ?? element;
}

function getControllingElement(element: FiveElement) {
  return elementOrder.find((item) => controls[item] === element) ?? element;
}

function getLowElements(counts: Record<FiveElement, number>) {
  const min = Math.min(...elementOrder.map((element) => counts[element]));

  return elementOrder.filter((element) => counts[element] === min).slice(0, 2);
}

function getHighElements(counts: Record<FiveElement, number>) {
  const max = Math.max(...elementOrder.map((element) => counts[element]));

  return elementOrder.filter((element) => counts[element] === max).slice(0, 2);
}

function dedupe(elements: FiveElement[]) {
  return Array.from(new Set(elements));
}

function dedupeText(items: string[]) {
  return Array.from(new Set(items));
}

function isFiveElement(value: string | undefined): value is FiveElement {
  return value === "木" || value === "火" || value === "土" || value === "金" || value === "水";
}

function formatCount(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
