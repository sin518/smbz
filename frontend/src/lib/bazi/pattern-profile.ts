import type { ChartColumn } from "@/lib/bazi/demo";
import {
  branchElements,
  controls,
  generates,
  getControllingElement,
  getGeneratingElement,
  hiddenStems,
  stemElements,
  stemMeta,
  type FiveElement
} from "@/lib/bazi/five-elements";

export type StrengthKey = "强" | "弱" | "从强" | "从弱";
export type ElementRoleKey = "喜" | "相" | "闲" | "仇" | "忌";

export type ElementRole = {
  key: ElementRoleKey;
  element: FiveElement;
  subtitle: string;
  description: string;
};

export type PatternProfile = {
  strength: StrengthKey;
  elementRoles: ElementRole[];
  selectedPattern: string;
  activeCombos: string[];
  primaryCombo: string;
  summary: string;
};

const patternByTenGod: Record<string, string> = {
  正印: "正印格",
  偏印: "偏印格",
  正官: "正官格",
  七杀: "七杀格",
  正财: "正财格",
  偏财: "偏财格",
  伤官: "伤官格",
  食神: "食神格",
  比肩: "建禄格",
  劫财: "阳刃格"
};

const tenGodGroups: Record<string, string[]> = {
  比劫: ["比肩", "劫财"],
  食伤: ["食神", "伤官"],
  官杀: ["正官", "七杀"],
  财: ["正财", "偏财"],
  印: ["正印", "偏印"]
};

const comboRequirements: Record<string, [string, string]> = {
  食伤配比劫: ["食伤", "比劫"],
  比劫配官杀: ["比劫", "官杀"],
  官杀配比劫: ["官杀", "比劫"],
  比劫配食伤: ["比劫", "食伤"],
  官杀配印: ["官杀", "印"],
  财配印: ["财", "印"],
  财配比劫: ["财", "比劫"],
  食伤配印: ["食伤", "印"],
  印配财: ["印", "财"],
  比劫配财: ["比劫", "财"],
  印配官杀: ["印", "官杀"],
  印配食伤: ["印", "食伤"]
};

export const strengthOptions: StrengthKey[] = ["强", "弱", "从强", "从弱"];

export const strengthDescriptions: Record<StrengthKey, string> = {
  强: "日主根气与同党较足，做事更能主动承载；取法上宜看泄秀、财星承接与规则约束。",
  弱: "日主根气偏浅，先看印比扶身与承载力；外部压力、财星消耗和食伤输出不宜过早叠加。",
  从强: "同党与生扶成势，普通克泄难以平衡，判断上顺其强势结构取用。",
  从弱: "克泄耗成势，日主难以自立，判断上顺从外部结构，不宜强行补身。"
};

export const patternOptions = [
  "正印格",
  "偏印格",
  "正官格",
  "七杀格",
  "正财格",
  "偏财格",
  "伤官格",
  "食神格",
  "阳刃格",
  "建禄格",
  "曲直格",
  "从儿格",
  "从杀格",
  "从强格",
  "从财格",
  "炎上格",
  "稼穑格",
  "从革格",
  "润下格",
  "从旺格"
] as const;

export const comboOptions = [
  "食伤配比劫",
  "比劫配官杀",
  "官杀配比劫",
  "比劫配食伤",
  "官杀配印",
  "财配印",
  "财配比劫",
  "食伤配印",
  "印配财",
  "比劫配财",
  "印配官杀",
  "印配食伤"
] as const;

export const patternDescriptions: Record<string, string> = {
  正印格: "月令主气取正印，重学习、资质、保护与系统支持；宜看印星是否清透、有无财星破印。",
  偏印格: "月令主气取偏印，重洞察、研究、非标准路径；宜防思路过偏或输出不稳。",
  正官格: "月令主气取正官，重规则、责任、名誉与稳定秩序；宜看印星护官、财星生官。",
  七杀格: "月令主气取七杀，重压力、竞争、突破与执行；宜看是否有印化杀或食神制杀。",
  正财格: "月令主气取正财，重现实秩序、资源管理与稳定收益；宜看身能否任财。",
  偏财格: "月令主气取偏财，重机会、流动资源与外部连接；宜看比劫分财与官星承接。",
  伤官格: "月令主气取伤官，重表达、技术、突破规则；宜看是否伤官配印或伤官生财。",
  食神格: "月令主气取食神，重稳定输出、才艺与长期沉淀；宜看食神生财或制杀。",
  阳刃格: "月令或结构见刃气，行动力强、竞争感重；宜有官杀约束，忌再叠比劫。",
  建禄格: "日主临禄，根气较足，自主性强；宜看财官食伤是否能引出实际用处。",
  曲直格: "木势成局，顺木性成长舒展；宜见水木相生，忌金重破局。",
  从儿格: "食伤成势，顺输出才华与表达流动；宜见财星承接，忌强行扶身。",
  从杀格: "官杀成势，顺压力、规则与目标系统；宜见印化杀，忌比劫扰局。",
  从强格: "印比成势，顺其强旺之气；宜取同党与生扶，忌硬用克泄。",
  从财格: "财星成势，顺资源、市场与现实结果；宜财官流通，忌比劫夺财。",
  炎上格: "火势成局，重光明、表达与上升之象；宜木火相续，忌水重冲克。",
  稼穑格: "土势成局，重承载、组织与稳定积累；宜火土相生，忌木重攻土。",
  从革格: "金势成局，重规则、裁断与精炼；宜土金相生，忌火重熔金。",
  润下格: "水势成局，重流动、智慧与适应；宜金水相生，忌土重壅塞。",
  从旺格: "某一五行旺势已成，宜顺势取用；重点看是否纯粹、有无破格之神。"
};

export const comboDescriptions: Record<string, string> = {
  食伤配比劫: "比劫提供行动与自主，食伤负责输出表达；适合靠技能、内容、创意把能力显化。",
  比劫配官杀: "比劫旺而见官杀，外部规则会压住竞争性；处理得当可成执行力，失衡则压力冲突明显。",
  官杀配比劫: "官杀带压力与目标，比劫提供抗压和行动；宜有秩序地竞争，不宜硬碰硬。",
  比劫配食伤: "同党旺而能泄秀，适合把主观能量转成作品、技术或表达。",
  官杀配印: "官杀形成压力，印星负责化杀生身；适合在制度、资质、专业训练中承接压力。",
  财配印: "财星重现实结果，印星重学习保护；需要在资源追求与专业积累之间平衡。",
  财配比劫: "财星遇比劫，资源与竞争并存；宜明确边界，防合作分财或冲动消耗。",
  食伤配印: "食伤输出，印星校准；适合知识表达、专业创作，也能缓和伤官过锋。",
  印配财: "印主学习与支持，财主现实落地；宜把资质、经验转化为可见成果。",
  比劫配财: "自主性强而见财，适合主动争取资源；需防同辈竞争、财务边界不清。",
  印配官杀: "印星承接官杀压力，利规则学习、资质认证和长期岗位责任。",
  印配食伤: "印星提供框架，食伤负责输出；适合教学、咨询、内容或技术表达。"
};

export function buildPatternProfile(columns: ChartColumn[]): PatternProfile {
  const dayColumn = columns.find((column) => column.title === "日柱") ?? columns[2];
  const monthColumn = columns.find((column) => column.title === "月柱") ?? columns[1];
  const dayStem = dayColumn?.pillar.stem ?? "";
  const dayElement = stemElements[dayStem] ?? "土";
  const strength = resolveStrength(columns, dayElement);
  const selectedPattern = resolvePattern(columns, dayStem, dayElement);
  const groupCounts = countTenGodGroups(columns);
  const activeCombos = comboOptions.filter((combo) => {
    const [left, right] = comboRequirements[combo];
    return (groupCounts[left] ?? 0) > 0 && (groupCounts[right] ?? 0) > 0;
  });
  const primaryCombo = pickPrimaryCombo(activeCombos, groupCounts);

  return {
    strength,
    elementRoles: buildElementRoles(dayElement, strength),
    selectedPattern,
    activeCombos,
    primaryCombo,
    summary: buildSummary(dayElement, strength, selectedPattern, primaryCombo)
  };
}

function resolveStrength(columns: ChartColumn[], dayElement: FiveElement): StrengthKey {
  const resourceElement = getGeneratingElement(dayElement);
  const pressureElements = [generates[dayElement], controls[dayElement], getControllingElement(dayElement)];
  const selfRoot = columns.reduce((sum, column) => {
    const stemElement = stemElements[column.pillar.stem];
    const branchElement = branchElements[column.pillar.branch];
    const stemScore = stemElement === dayElement ? 1 : 0;
    const branchScore = branchElement === dayElement ? (column.title === "月柱" ? 2 : 1) : 0;
    return sum + stemScore + branchScore;
  }, 0);
  const resource = columns.reduce((sum, column) => {
    const stemElement = stemElements[column.pillar.stem];
    const branchElement = branchElements[column.pillar.branch];
    const stemScore = stemElement === resourceElement ? 0.5 : 0;
    const branchScore = branchElement === resourceElement ? (column.title === "月柱" ? 1 : 0.5) : 0;
    return sum + stemScore + branchScore;
  }, 0);
  const pressure = columns.reduce((sum, column) => {
    const stemElement = stemElements[column.pillar.stem];
    const branchElement = branchElements[column.pillar.branch];
    const stemScore = stemElement && pressureElements.includes(stemElement) ? 1 : 0;
    const branchScore = branchElement && pressureElements.includes(branchElement) ? (column.title === "月柱" ? 2 : 1) : 0;
    return sum + stemScore + branchScore;
  }, 0);
  const gap = selfRoot + resource - pressure;

  if (selfRoot >= 4 && gap >= 4) return "从强";
  if (gap <= -4) return "从弱";
  return gap > 1 ? "强" : "弱";
}

function resolvePattern(columns: ChartColumn[], dayStem: string, dayElement: FiveElement) {
  const monthColumn = columns.find((column) => column.title === "月柱") ?? columns[1];
  const monthMainStem = hiddenStems[monthColumn?.pillar.branch ?? ""]?.[0]?.stem;
  const monthTenGod = monthMainStem ? getTenGod(dayStem, monthMainStem) : "";
  const specialPattern = resolveSpecialPattern(columns, dayElement);

  return specialPattern ?? patternByTenGod[monthTenGod] ?? "正印格";
}

function resolveSpecialPattern(columns: ChartColumn[], dayElement: FiveElement) {
  const branchElementsInChart = columns.map((column) => branchElements[column.pillar.branch]).filter(Boolean);
  const sameElementBranches = branchElementsInChart.filter((element) => element === dayElement).length;

  if (sameElementBranches >= 3) {
    const elementPattern: Record<FiveElement, string> = {
      木: "曲直格",
      火: "炎上格",
      土: "稼穑格",
      金: "从革格",
      水: "润下格"
    };
    return elementPattern[dayElement];
  }

  return undefined;
}

function buildElementRoles(dayElement: FiveElement, strength: StrengthKey): ElementRole[] {
  const resourceElement = getGeneratingElement(dayElement);
  const outputElement = generates[dayElement];
  const wealthElement = controls[dayElement];
  const officerElement = getControllingElement(dayElement);

  if (strength === "强" || strength === "从强") {
    return [
      { key: "喜", element: outputElement, subtitle: "泄秀输出", description: "日主偏强时，食伤可把过旺能量转成表达、技能与产出，是优先观察的顺势出口。" },
      { key: "相", element: wealthElement, subtitle: "承接成果", description: "财星可承接食伤输出，把能力落到资源、结果与现实回报上。" },
      { key: "闲", element: officerElement, subtitle: "规则约束", description: "官杀能约束过旺自我，但要看是否过重；适量为秩序，过量为压力。" },
      { key: "仇", element: resourceElement, subtitle: "过度生扶", description: "印星继续生扶日主，容易让结构更偏旺，通常不宜再过度叠加。" },
      { key: "忌", element: dayElement, subtitle: "同党叠加", description: "比劫同党再来，会加重争夺、自我和资源消耗，属于需要节制的方向。" }
    ];
  }

  return [
    { key: "喜", element: dayElement, subtitle: "同助日主", description: "日主偏弱时，比劫可补足自我承载和行动底气，是优先补身方向。" },
    { key: "相", element: resourceElement, subtitle: "生扶根气", description: "印星能生扶日主，提供学习、保护、资质与系统支持，帮助承接外部压力。" },
    { key: "闲", element: officerElement, subtitle: "压力约束", description: "官杀对弱身是压力来源，若有印星化杀则可转成责任与目标；无承接时不宜过重。" },
    { key: "仇", element: wealthElement, subtitle: "耗身取财", description: "财星会消耗日主力量，弱身见财需先看能否承载，否则容易为资源和现实事务所累。" },
    { key: "忌", element: outputElement, subtitle: "泄身过重", description: "食伤会继续泄日主之气，弱身时输出过多容易疲惫、分散或承接不足。" }
  ];
}

function countTenGodGroups(columns: ChartColumn[]) {
  const counts: Record<string, number> = {
    比劫: 0,
    食伤: 0,
    官杀: 0,
    财: 0,
    印: 0
  };

  columns.forEach((column) => {
    [column.mainStar, ...column.subStars].forEach((god) => {
      Object.entries(tenGodGroups).forEach(([group, gods]) => {
        if (gods.includes(god)) {
          counts[group] += 1;
        }
      });
    });
  });

  return counts;
}

function pickPrimaryCombo(activeCombos: string[], groupCounts: Record<string, number>) {
  if (!activeCombos.length) return "无";
  if (activeCombos.includes("官杀配印")) return "官杀配印";

  return activeCombos
    .map((combo) => {
      const [left, right] = comboRequirements[combo];
      return {
        combo,
        score: (groupCounts[left] ?? 0) + (groupCounts[right] ?? 0)
      };
    })
    .sort((left, right) => right.score - left.score)[0].combo;
}

function buildSummary(dayElement: FiveElement, strength: StrengthKey, selectedPattern: string, primaryCombo: string) {
  const strengthText = strength.includes("弱") ? "日主偏弱，宜先补足承载力，再谈输出与外部压力。" : "日主偏强，宜重视泄秀、财星承接与外部规则。";
  const comboText = primaryCombo === "无" ? "十神组合暂未形成明确双组结构。" : `十神组合以${primaryCombo}为主要观察点。`;

  return `日主五行属${dayElement}，当前判为${strength}；格局参考${selectedPattern}。${strengthText}${comboText}`;
}

function getTenGod(dayStem: string, targetStem: string) {
  const day = stemMeta[dayStem];
  const target = stemMeta[targetStem];

  if (!day || !target) return "";
  if (target.element === day.element) return target.yinYang === day.yinYang ? "比肩" : "劫财";
  if (generates[day.element] === target.element) return target.yinYang === day.yinYang ? "食神" : "伤官";
  if (controls[day.element] === target.element) return target.yinYang === day.yinYang ? "偏财" : "正财";
  if (getControllingElement(day.element) === target.element) return target.yinYang === day.yinYang ? "七杀" : "正官";
  if (getGeneratingElement(day.element) === target.element) return target.yinYang === day.yinYang ? "偏印" : "正印";

  return "";
}
