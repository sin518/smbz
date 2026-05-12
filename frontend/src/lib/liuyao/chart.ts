import { Solar } from "lunar-typescript";
import { type LiuyaoLine } from "@/lib/liuyao/casting";

export type LiuyaoInputSnapshot = {
  name?: string;
  gender?: string;
  dateTime?: string;
  divinationDirection?: string;
  directionTopic?: string;
  question?: string;
};

export type LiuyaoStoredInput = {
  input?: LiuyaoInputSnapshot;
  savedAt?: string;
};

export type LiuyaoStoredCasting = {
  lines?: LiuyaoLine[];
  draftLines?: LiuyaoLine[];
  completedAt?: string;
  status?: "draft" | "complete";
};

export type LiuyaoChartLine = LiuyaoLine & {
  label: string;
  symbol: "yang" | "yin";
  changedSymbol: "yang" | "yin";
  spirit: string;
  relation: string;
  branch: EarthlyBranch;
  element: FiveElement;
  changedRelation: string;
  changedBranch: EarthlyBranch;
  changedElement: FiveElement;
  marker?: "世" | "应";
  hiddenStem?: string;
  monthRelation: string;
  dayRelation: string;
  strength: string;
  isUsefulGod: boolean;
};

export type LiuyaoChart = {
  profile: {
    name: string;
    gender: string;
    birthText: string;
    castingText: string;
    direction: string;
    question: string;
  };
  ganzhiText: string;
  hexagram: {
    name: string;
    upper: string;
    lower: string;
    changingCount: number;
    changed?: {
      name: string;
      upper: string;
      lower: string;
    };
  };
  lineRelations: string[];
  lines: LiuyaoChartLine[];
  interpretation: {
    title: string;
    body?: string;
    points?: string[];
  }[];
};

const trigramNames: Record<string, string> = {
  "111": "乾",
  "110": "兑",
  "101": "离",
  "100": "震",
  "011": "巽",
  "010": "坎",
  "001": "艮",
  "000": "坤"
};

type TrigramName = "乾" | "兑" | "离" | "震" | "巽" | "坎" | "艮" | "坤";
type FiveElement = "木" | "火" | "土" | "金" | "水";
type EarthlyBranch = "子" | "丑" | "寅" | "卯" | "辰" | "巳" | "午" | "未" | "申" | "酉" | "戌" | "亥";
type LineMarker = "世" | "应";

type PalaceInfo = {
  palace: TrigramName;
  palaceElement: FiveElement;
  place: "本宫" | "一世" | "二世" | "三世" | "四世" | "五世" | "游魂" | "归魂";
  shiPosition: number;
  yingPosition: number;
};

const hexagramNames: Record<string, string> = {
  "111111": "乾为天",
  "000000": "坤为地",
  "010100": "水雷屯",
  "001010": "山水蒙",
  "010111": "水天需",
  "111010": "天水讼",
  "000010": "地水师",
  "010000": "水地比",
  "011111": "风天小畜",
  "111110": "天泽履",
  "000111": "地天泰",
  "111000": "天地否",
  "111101": "天火同人",
  "101111": "火天大有",
  "000001": "地山谦",
  "100000": "雷地豫",
  "110100": "泽雷随",
  "001011": "山风蛊",
  "000110": "地泽临",
  "011000": "风地观",
  "101100": "火雷噬嗑",
  "001101": "山火贲",
  "001000": "山地剥",
  "000100": "地雷复",
  "111100": "天雷无妄",
  "001111": "山天大畜",
  "001100": "山雷颐",
  "110011": "泽风大过",
  "010010": "坎为水",
  "101101": "离为火",
  "110001": "泽山咸",
  "100011": "雷风恒",
  "111001": "天山遁",
  "100111": "雷天大壮",
  "101000": "火地晋",
  "000101": "地火明夷",
  "011101": "风火家人",
  "101110": "火泽睽",
  "010001": "水山蹇",
  "100010": "雷水解",
  "001110": "山泽损",
  "011100": "风雷益",
  "110111": "泽天夬",
  "111011": "天风姤",
  "110000": "泽地萃",
  "000011": "地风升",
  "110010": "泽水困",
  "010011": "水风井",
  "110101": "泽火革",
  "101011": "火风鼎",
  "100100": "震为雷",
  "001001": "艮为山",
  "011001": "风山渐",
  "100110": "雷泽归妹",
  "100101": "雷火丰",
  "101001": "火山旅",
  "011011": "巽为风",
  "110110": "兑为泽",
  "011010": "风水涣",
  "010110": "水泽节",
  "011110": "风泽中孚",
  "100001": "雷山小过",
  "010101": "水火既济",
  "101010": "火水未济"
};

const spirits = ["青龙", "朱雀", "勾陈", "腾蛇", "白虎", "玄武"];
const branchElements: Record<EarthlyBranch, FiveElement> = {
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
const trigramElements: Record<TrigramName, FiveElement> = {
  乾: "金",
  兑: "金",
  离: "火",
  震: "木",
  巽: "木",
  坎: "水",
  艮: "土",
  坤: "土"
};
const najiaBranches: Record<TrigramName, { inner: EarthlyBranch[]; outer: EarthlyBranch[] }> = {
  乾: { inner: ["子", "寅", "辰"], outer: ["午", "申", "戌"] },
  兑: { inner: ["巳", "卯", "丑"], outer: ["亥", "酉", "未"] },
  离: { inner: ["卯", "丑", "亥"], outer: ["酉", "未", "巳"] },
  震: { inner: ["子", "寅", "辰"], outer: ["午", "申", "戌"] },
  巽: { inner: ["丑", "亥", "酉"], outer: ["未", "巳", "卯"] },
  坎: { inner: ["寅", "辰", "午"], outer: ["申", "戌", "子"] },
  艮: { inner: ["辰", "午", "申"], outer: ["戌", "子", "寅"] },
  坤: { inner: ["未", "巳", "卯"], outer: ["丑", "亥", "酉"] }
};
const generating: Record<FiveElement, FiveElement> = {
  木: "火",
  火: "土",
  土: "金",
  金: "水",
  水: "木"
};
const controlling: Record<FiveElement, FiveElement> = {
  木: "土",
  土: "水",
  水: "火",
  火: "金",
  金: "木"
};
const branchClashes: Record<EarthlyBranch, EarthlyBranch> = {
  子: "午",
  丑: "未",
  寅: "申",
  卯: "酉",
  辰: "戌",
  巳: "亥",
  午: "子",
  未: "丑",
  申: "寅",
  酉: "卯",
  戌: "辰",
  亥: "巳"
};
const branchCombinations: Record<EarthlyBranch, EarthlyBranch> = {
  子: "丑",
  丑: "子",
  寅: "亥",
  亥: "寅",
  卯: "戌",
  戌: "卯",
  辰: "酉",
  酉: "辰",
  巳: "申",
  申: "巳",
  午: "未",
  未: "午"
};
const branchPunishments: Partial<Record<EarthlyBranch, EarthlyBranch[]>> = {
  子: ["卯"],
  卯: ["子"],
  寅: ["巳", "申"],
  巳: ["寅", "申"],
  申: ["寅", "巳"],
  丑: ["戌", "未"],
  戌: ["丑", "未"],
  未: ["丑", "戌"],
  辰: ["辰"],
  午: ["午"],
  酉: ["酉"],
  亥: ["亥"]
};
const branchHarms: Record<EarthlyBranch, EarthlyBranch> = {
  子: "未",
  未: "子",
  丑: "午",
  午: "丑",
  寅: "巳",
  巳: "寅",
  卯: "辰",
  辰: "卯",
  申: "亥",
  亥: "申",
  酉: "戌",
  戌: "酉"
};
const threeHarmonyGroups: { branches: EarthlyBranch[]; label: string }[] = [
  { branches: ["申", "子", "辰"], label: "申子辰水局" },
  { branches: ["亥", "卯", "未"], label: "亥卯未木局" },
  { branches: ["寅", "午", "戌"], label: "寅午戌火局" },
  { branches: ["巳", "酉", "丑"], label: "巳酉丑金局" }
];
const threeMeetingGroups: { branches: EarthlyBranch[]; label: string }[] = [
  { branches: ["寅", "卯", "辰"], label: "寅卯辰会木" },
  { branches: ["巳", "午", "未"], label: "巳午未会火" },
  { branches: ["申", "酉", "戌"], label: "申酉戌会金" },
  { branches: ["亥", "子", "丑"], label: "亥子丑会水" }
];
const directionLabels: Record<string, string> = {
  general: "通用决策",
  career: "事业学业",
  wealth: "财运投资",
  relationship: "感情婚姻",
  health: "健康状态",
  cooperation: "合作事务",
  interpersonal: "人际关系",
  risk: "风险问题"
};

export function buildLiuyaoChart(inputSnapshot: LiuyaoInputSnapshot | undefined, storedLines: LiuyaoLine[]): LiuyaoChart {
  const lines = storedLines;
  const key = lines
    .map((line) => (line.kind === "young-yang" || line.kind === "old-yang" ? "1" : "0"))
    .join("");
  const lowerKey = key.slice(0, 3);
  const upperKey = key.slice(3, 6);
  const hexagramName = hexagramNames[`${upperKey}${lowerKey}`] ?? `${trigramNames[upperKey] ?? "本"}${trigramNames[lowerKey] ?? "卦"}`;
  const changedKey = lines
    .map((line) => {
      const isYang = line.kind === "young-yang" || line.kind === "old-yang";
      return line.changing ? (isYang ? "0" : "1") : isYang ? "1" : "0";
    })
    .join("");
  const changedLowerKey = changedKey.slice(0, 3);
  const changedUpperKey = changedKey.slice(3, 6);
  const changedHexagramName =
    hexagramNames[`${changedUpperKey}${changedLowerKey}`] ?? `${trigramNames[changedUpperKey] ?? "变"}${trigramNames[changedLowerKey] ?? "卦"}`;
  const changingCount = lines.filter((line) => line.changing).length;
  const lowerTrigram = getTrigramName(lowerKey);
  const upperTrigram = getTrigramName(upperKey);
  const changedLowerTrigram = getTrigramName(changedLowerKey);
  const changedUpperTrigram = getTrigramName(changedUpperKey);
  const palaceInfo = getPalaceInfo(`${upperKey}${lowerKey}`) ?? {
    palace: lowerTrigram,
    palaceElement: trigramElements[lowerTrigram],
    place: "本宫",
    shiPosition: 6,
    yingPosition: 3
  };
  const direction = formatDirection(inputSnapshot);
  const usefulGodRelation = getUsefulGodRelation(inputSnapshot?.divinationDirection, inputSnapshot?.gender);
  const castingDate = parseDate(inputSnapshot?.dateTime) ?? new Date();
  const pillars = buildTimePillars(castingDate);
  const dayVoid = pillars.dayVoid;

  const chartLines = lines.map<LiuyaoChartLine>((line, index) => {
    const branch = getLineBranch(index, lowerTrigram, upperTrigram);
    const element = branchElements[branch];
    const relation = getSixRelation(palaceInfo.palaceElement, element);
    const changedBranch = getLineBranch(index, changedLowerTrigram, changedUpperTrigram);
    const changedElement = branchElements[changedBranch];
    const changedRelation = getSixRelation(palaceInfo.palaceElement, changedElement);
    const marker = getLineMarker(index + 1, palaceInfo);
    const monthRelation = describeBuildRelation("月建", pillars.month.branch, branch);
    const dayRelation = describeBuildRelation("日建", pillars.day.branch, branch);
    const strengthScore = getStrengthScore(branch, pillars.month.branch, pillars.day.branch, line.changing);

    return {
      ...line,
      label: line.kind === "old-yang" || line.kind === "young-yang" ? "阳爻" : "阴爻",
      symbol: line.kind === "old-yang" || line.kind === "young-yang" ? "yang" : "yin",
      changedSymbol: line.changing
        ? line.kind === "old-yang" || line.kind === "young-yang"
          ? "yin"
          : "yang"
        : line.kind === "old-yang" || line.kind === "young-yang"
          ? "yang"
          : "yin",
      spirit: spirits[index],
      relation,
      branch,
      element,
      changedRelation,
      changedBranch,
      changedElement,
      marker,
      hiddenStem: undefined,
      monthRelation,
      dayRelation,
      strength: formatStrength(strengthScore),
      isUsefulGod:
        relation === usefulGodRelation ||
        (usefulGodRelation === "世爻" && marker === "世") ||
        (usefulGodRelation === "应爻" && marker === "应")
    };
  });

  const question = inputSnapshot?.question?.trim() || "未填写";

  return {
    profile: {
      name: inputSnapshot?.name?.trim() || "未留名",
      gender: inputSnapshot?.gender === "female" ? "女" : "男",
      birthText: formatDate(castingDate),
      castingText: formatDateTime(castingDate),
      direction,
      question
    },
    ganzhiText: `${pillars.year.text}年 ${pillars.month.text}月 ${pillars.day.text}日 ${pillars.hour.text}时（日空${dayVoid}）`,
    hexagram: {
      name: hexagramName,
      upper: trigramNames[upperKey] ?? "上卦",
      lower: trigramNames[lowerKey] ?? "下卦",
      changingCount,
      changed:
        changingCount > 0
          ? {
              name: changedHexagramName,
              upper: trigramNames[changedUpperKey] ?? "上卦",
              lower: trigramNames[changedLowerKey] ?? "下卦"
            }
          : undefined
    },
    lineRelations: buildLineRelations(chartLines, pillars.month.branch, pillars.day.branch),
    lines: chartLines,
    interpretation: buildInterpretation({
      hexagramName,
      direction,
      question,
      lines: chartLines,
      palaceInfo,
      pillars,
      usefulGodRelation
    })
  };
}

function buildLineRelations(lines: LiuyaoChartLine[], monthBranch: EarthlyBranch, dayBranch: EarthlyBranch) {
  const branches = lines.map((line) => line.branch);
  const relations = new Set<string>();

  for (let index = 0; index < branches.length; index += 1) {
    for (let nextIndex = index + 1; nextIndex < branches.length; nextIndex += 1) {
      const relation = getBranchRelation(branches[index], branches[nextIndex]);
      if (relation) {
        relations.add(relation);
      }
    }
  }

  for (const group of threeHarmonyGroups) {
    if (group.branches.every((branch) => branches.includes(branch))) {
      relations.add(group.label);
    }
  }

  for (const group of threeMeetingGroups) {
    if (group.branches.every((branch) => branches.includes(branch))) {
      relations.add(group.label);
    }
  }

  for (const line of lines) {
    const monthRelation = getBranchRelation(monthBranch, line.branch);
    const dayRelation = getBranchRelation(dayBranch, line.branch);
    if (monthRelation) relations.add(`月${monthRelation}`);
    if (dayRelation) relations.add(`日${dayRelation}`);
  }

  if (lines.some((line) => line.changing)) {
    relations.add("动爻发动");
  }

  return relations.size > 0 ? Array.from(relations).slice(0, 9) : ["暂无明显刑冲", "未成三合三会", "以用神旺衰为准"];
}

function formatDirection(inputSnapshot: LiuyaoInputSnapshot | undefined) {
  const direction = directionLabels[inputSnapshot?.divinationDirection ?? ""] ?? "通用决策";
  return inputSnapshot?.directionTopic ? `${direction}-${inputSnapshot.directionTopic}` : direction;
}

function parseDate(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function formatDate(date: Date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

function formatDateTime(date: Date) {
  return `${formatDate(date)} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function buildInterpretation({
  hexagramName,
  direction,
  question,
  lines,
  palaceInfo,
  pillars,
  usefulGodRelation
}: {
  hexagramName: string;
  direction: string;
  question: string;
  lines: LiuyaoChartLine[];
  palaceInfo: PalaceInfo;
  pillars: LiuyaoTimePillars;
  usefulGodRelation: string;
}) {
  const shiLine = lines.find((line) => line.marker === "世");
  const yingLine = lines.find((line) => line.marker === "应");
  const usefulLines = lines.filter((line) => line.isUsefulGod);
  const usefulText =
    usefulLines.length > 0
      ? usefulLines.map((line) => `${line.position}爻${line.relation}${line.branch}${line.element}（${line.strength}，${line.monthRelation}，${line.dayRelation}）`).join("；")
      : "本卦未直接出现对应用神，需后续结合伏神规则补取";
  const movingText = lines
    .filter((line) => line.changing)
    .map((line) => `${line.position}爻${line.relation}${line.branch}${line.element}发动，化${line.changedRelation}${line.changedBranch}${line.changedElement}，${describeMovingTransform(line)}`)
    .join("；");
  const shiYingText = [
    shiLine ? `世爻在${shiLine.position}爻，为${shiLine.relation}${shiLine.branch}${shiLine.element}，${shiLine.strength}` : undefined,
    yingLine ? `应爻在${yingLine.position}爻，为${yingLine.relation}${yingLine.branch}${yingLine.element}，${yingLine.strength}` : undefined
  ]
    .filter((item): item is string => Boolean(item))
    .join("；");
  const shiMonthDayText = shiLine ? buildShiMonthDayText(shiLine, pillars, usefulLines) : "世爻未定位，暂无法判断日月对世爻的喜忌。";
  const pairPoints = buildLinePairPoints(lines);
  const harmonyPoints = buildHarmonyPoints(lines);
  const movingDetailPoints = movingText
    ? movingText.split("；")
    : ["本卦无动爻，暂无化回头生克；先看日月对世爻、用神和静爻之间的生克合冲。"];

  return [
    {
      title: "基本卦象",
      body: `${hexagramName}属${palaceInfo.palace}宫${palaceInfo.palaceElement}，为${palaceInfo.place}卦，用于观察「${direction}」的当前态势。卦象呈现的是阶段、阻力和资源分布，不等同于固定结论。`
    },
    {
      title: "世应用神",
      body: `本次所问为「${question}」。${shiYingText || "世应未定位"}。此类问题先取${usefulGodRelation}为用神：${usefulText}。`
    },
    {
      title: "日月世爻",
      body: shiMonthDayText
    },
    {
      title: "爻间合克",
      points: pairPoints
    },
    {
      title: "三合三会",
      points: harmonyPoints
    },
    {
      title: "动爻化出",
      // TODO: Add verified 伏神飞神、进退神、反吟伏吟 rule variants before producing a full precision judgment.
      points: movingDetailPoints
    }
  ];
}

function buildShiMonthDayText(shiLine: LiuyaoChartLine, pillars: LiuyaoTimePillars, usefulLines: LiuyaoChartLine[]) {
  const monthEffect = describeSourceToLine("月建", pillars.month.branch, shiLine);
  const dayEffect = describeSourceToLine("日建", pillars.day.branch, shiLine);
  const usefulEffect =
    usefulLines.length > 0
      ? usefulLines.map((line) => describeLineToLine(line, shiLine, "用神")).join("；")
      : "本卦未现明用神，喜忌先以世爻自身旺衰为主";

  return `世爻为${formatLine(shiLine)}，当前判为${shiLine.strength}。${monthEffect}；${dayEffect}。对世爻而言，生扶、合扶、同气为喜，冲克泄耗为忌；${usefulEffect}。`;
}

function buildLinePairPoints(lines: LiuyaoChartLine[]) {
  const items: string[] = [];
  const sortedLines = [...lines].sort((first, second) => first.position - second.position);
  const shiLine = sortedLines.find((line) => line.marker === "世");
  const yingLine = sortedLines.find((line) => line.marker === "应");

  if (shiLine) {
    items.push(buildLineInteractionParagraph("世爻", shiLine, sortedLines));
  }

  if (yingLine) {
    items.push(buildLineInteractionParagraph("应爻", yingLine, sortedLines));
  }

  for (const line of sortedLines) {
    items.push(buildLineInteractionParagraph(`${line.position}爻`, line, sortedLines));
  }

  return items;
}

function buildHarmonyPoints(lines: LiuyaoChartLine[]) {
  const branches = lines.map((line) => line.branch);
  const fullGroups = [...threeHarmonyGroups, ...threeMeetingGroups]
    .filter((group) => group.branches.every((branch) => branches.includes(branch)))
    .map((group) => group.label);
  const halfGroups = threeHarmonyGroups
    .map((group) => {
      const matched = group.branches.filter((branch) => branches.includes(branch));
      return matched.length === 2 ? `${matched.join("")}半合，未成${group.label}` : undefined;
    })
    .filter((item): item is string => Boolean(item));

  if (fullGroups.length > 0) {
    return [`成局：${fullGroups.join("；")}。`, ...(halfGroups.length > 0 ? [`另见${halfGroups.join("；")}。`] : [])];
  }

  return halfGroups.length > 0 ? [`未成完整三合局，见${halfGroups.join("；")}。`] : ["六爻地支未成完整三合局或三会局，先按单爻生克合冲与世应用神判断。"];
}

function describeLinePair(first: LiuyaoChartLine, second: LiuyaoChartLine) {
  const branchRelation = getBranchRelation(first.branch, second.branch);
  const elementRelation = describeElementRelation(first.element, second.element, formatLine(first), formatLine(second));
  const branchText = branchRelation ? `，地支成${branchRelation}` : "";

  return `${formatLine(first)}与${formatLine(second)}：${elementRelation}${branchText}`;
}

function buildLineInteractionParagraph(title: string, line: LiuyaoChartLine, lines: LiuyaoChartLine[]) {
  const otherTexts = lines
    .filter((item) => item.position !== line.position)
    .map((item) => describeLineInteraction(line, item))
    .join("；");

  return `${title} ${formatDetailedLine(line)}：${otherTexts}。`;
}

function describeLineInteraction(source: LiuyaoChartLine, target: LiuyaoChartLine) {
  const elementRelation = describeElementRelation(source.element, target.element, "本爻", formatDetailedLine(target));
  const branchRelation = getBranchRelation(source.branch, target.branch);
  const branchText = branchRelation ? `，地支成${branchRelation}` : "";

  return `与${formatDetailedLine(target)}：${elementRelation}${branchText}`;
}

function describeLineToLine(source: LiuyaoChartLine, target: LiuyaoChartLine, sourceName: string) {
  if (source.position === target.position) {
    return `${sourceName}即世爻自身，喜忌重点看其是否得日月生扶`;
  }

  const relation = describeElementRelation(source.element, target.element, sourceName, "世爻");
  const branchRelation = getBranchRelation(source.branch, target.branch);
  const branchText = branchRelation ? `，且${source.branch}${target.branch}成${branchRelation}` : "";

  return `${sourceName}${formatLine(source)}对世爻：${relation}${branchText}`;
}

function describeSourceToLine(sourceLabel: "月建" | "日建", sourceBranch: EarthlyBranch, line: LiuyaoChartLine) {
  const sourceElement = branchElements[sourceBranch];
  const relation = describeElementRelation(sourceElement, line.element, `${sourceLabel}${sourceBranch}${sourceElement}`, "世爻");
  const branchRelation = getBranchRelation(sourceBranch, line.branch);
  const branchText = branchRelation ? `，地支成${branchRelation}` : "";
  const effect = getFavorableText(sourceBranch, line.branch);

  return `${sourceLabel}${sourceBranch}${sourceElement}对世爻${line.branch}${line.element}：${relation}${branchText}，属${effect}`;
}

function describeMovingTransform(line: LiuyaoChartLine) {
  const elementText = describeTransformElement(line);
  const branchRelation = getBranchRelation(line.branch, line.changedBranch);
  const branchText = branchRelation ? `，本爻${line.branch}与化出${line.changedBranch}成${branchRelation}` : "";

  return `${elementText}${branchText}`;
}

function describeTransformElement(line: LiuyaoChartLine) {
  if (line.changedElement === line.element) {
    return `化出${line.changedBranch}${line.changedElement}同气比扶本爻，为化扶`;
  }

  if (generating[line.changedElement] === line.element) {
    return `化出${line.changedBranch}${line.changedElement}生回本爻${line.branch}${line.element}，为化回头生`;
  }

  if (controlling[line.changedElement] === line.element) {
    return `化出${line.changedBranch}${line.changedElement}克回本爻${line.branch}${line.element}，为化回头克`;
  }

  if (generating[line.element] === line.changedElement) {
    return `本爻${line.branch}${line.element}生化出${line.changedBranch}${line.changedElement}，为化泄`;
  }

  return `本爻${line.branch}${line.element}克化出${line.changedBranch}${line.changedElement}，为化制`;
}

function describeElementRelation(first: FiveElement, second: FiveElement, firstName: string, secondName: string) {
  if (first === second) return `${firstName}与${secondName}同气比扶`;
  if (generating[first] === second) return `${firstName}生${secondName}`;
  if (generating[second] === first) return `${secondName}生${firstName}`;
  if (controlling[first] === second) return `${firstName}克${secondName}`;
  return `${secondName}克${firstName}`;
}

function getFavorableText(sourceBranch: EarthlyBranch, targetBranch: EarthlyBranch) {
  const sourceElement = branchElements[sourceBranch];
  const targetElement = branchElements[targetBranch];

  if (sourceBranch === targetBranch || generating[sourceElement] === targetElement || branchCombinations[sourceBranch] === targetBranch) {
    return "喜，能帮扶世爻";
  }

  if (branchClashes[sourceBranch] === targetBranch || controlling[sourceElement] === targetElement) {
    return "忌，会冲克世爻";
  }

  if (generating[targetElement] === sourceElement) {
    return "耗，世爻之气外泄";
  }

  return "制，世爻可制其气但会耗力";
}

function formatLine(line: LiuyaoChartLine) {
  const marker = line.marker ? `${line.marker}爻` : `${line.position}爻`;
  return `${marker}${line.relation}${line.branch}${line.element}`;
}

function formatDetailedLine(line: LiuyaoChartLine) {
  const marker = line.marker ? `（${line.marker}爻）` : "";
  return `${line.position}爻${line.relation}${line.branch}${line.element}${marker}`;
}

type LiuyaoTimePillars = {
  year: { text: string; branch: EarthlyBranch };
  month: { text: string; branch: EarthlyBranch };
  day: { text: string; branch: EarthlyBranch };
  hour: { text: string; branch: EarthlyBranch };
  dayVoid: string;
};

function getTrigramName(key: string): TrigramName {
  return (trigramNames[key] ?? "乾") as TrigramName;
}

function getLineBranch(index: number, lower: TrigramName, upper: TrigramName) {
  return index < 3 ? najiaBranches[lower].inner[index] : najiaBranches[upper].outer[index - 3];
}

function getLineMarker(position: number, palaceInfo: PalaceInfo): LineMarker | undefined {
  if (position === palaceInfo.shiPosition) return "世";
  if (position === palaceInfo.yingPosition) return "应";
  return undefined;
}

function getSixRelation(palaceElement: FiveElement, lineElement: FiveElement) {
  if (palaceElement === lineElement) return "兄弟";
  if (generating[palaceElement] === lineElement) return "子孙";
  if (generating[lineElement] === palaceElement) return "父母";
  if (controlling[palaceElement] === lineElement) return "妻财";
  return "官鬼";
}

function getUsefulGodRelation(direction: string | undefined, gender: string | undefined) {
  if (direction === "career") return "官鬼";
  if (direction === "wealth") return "妻财";
  if (direction === "relationship") return gender === "female" ? "官鬼" : "妻财";
  if (direction === "health") return "世爻";
  if (direction === "cooperation") return "应爻";
  if (direction === "interpersonal") return "兄弟";
  if (direction === "risk") return "官鬼";
  return "世爻";
}

function buildTimePillars(date: Date): LiuyaoTimePillars {
  const solar = Solar.fromYmdHms(date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes(), 0);
  const eightChar = solar.getLunar().getEightChar();
  const yearText = `${eightChar.getYearGan()}${eightChar.getYearZhi()}`;
  const monthText = `${eightChar.getMonthGan()}${eightChar.getMonthZhi()}`;
  const dayText = `${eightChar.getDayGan()}${eightChar.getDayZhi()}`;
  const hourText = `${eightChar.getTimeGan()}${eightChar.getTimeZhi()}`;

  return {
    year: { text: yearText, branch: yearText.slice(1, 2) as EarthlyBranch },
    month: { text: monthText, branch: monthText.slice(1, 2) as EarthlyBranch },
    day: { text: dayText, branch: dayText.slice(1, 2) as EarthlyBranch },
    hour: { text: hourText, branch: hourText.slice(1, 2) as EarthlyBranch },
    dayVoid: eightChar.getDayXunKong()
  };
}

function getStrengthScore(branch: EarthlyBranch, monthBranch: EarthlyBranch, dayBranch: EarthlyBranch, changing: boolean) {
  return getBuildScore(monthBranch, branch) * 2 + getBuildScore(dayBranch, branch) + (changing ? 1 : 0);
}

function getBuildScore(source: EarthlyBranch, target: EarthlyBranch) {
  const sourceElement = branchElements[source];
  const targetElement = branchElements[target];
  let score = 0;

  if (source === target) score += 2;
  if (generating[sourceElement] === targetElement) score += 1;
  if (generating[targetElement] === sourceElement) score -= 1;
  if (controlling[sourceElement] === targetElement) score -= 2;
  if (controlling[targetElement] === sourceElement) score -= 1;
  if (branchCombinations[source] === target) score += 1;
  if (branchClashes[source] === target) score -= 2;

  return score;
}

function formatStrength(score: number) {
  if (score >= 4) return "旺";
  if (score >= 2) return "相";
  if (score >= 0) return "平";
  if (score >= -2) return "休";
  return "衰";
}

function describeBuildRelation(label: "月建" | "日建", source: EarthlyBranch, target: EarthlyBranch) {
  const branchRelation = getBranchRelation(source, target);
  if (branchRelation) return `${label}${branchRelation}`;

  const sourceElement = branchElements[source];
  const targetElement = branchElements[target];
  if (sourceElement === targetElement) return `${label}比扶`;
  if (generating[sourceElement] === targetElement) return `${label}生`;
  if (generating[targetElement] === sourceElement) return `${label}泄`;
  if (controlling[sourceElement] === targetElement) return `${label}克`;
  return `${label}受克`;
}

function getBranchRelation(first: EarthlyBranch, second: EarthlyBranch) {
  if (branchClashes[first] === second) return `${first}${second}冲`;
  if (branchCombinations[first] === second) return `${first}${second}合`;
  if (branchHarms[first] === second) return `${first}${second}害`;
  if (branchPunishments[first]?.includes(second)) return `${first}${second}刑`;
  return undefined;
}

function getPalaceInfo(hexagramKey: string): PalaceInfo | undefined {
  return palaceMap[hexagramKey];
}

function flipBit(value: string) {
  return value === "1" ? "0" : "1";
}

function changeLines(baseKey: string, positions: number[]) {
  const lowerFirst = `${baseKey.slice(3, 6)}${baseKey.slice(0, 3)}`.split("");
  for (const position of positions) {
    lowerFirst[position - 1] = flipBit(lowerFirst[position - 1]);
  }

  return `${lowerFirst.slice(3, 6).join("")}${lowerFirst.slice(0, 3).join("")}`;
}

function buildPalaceMap() {
  const map: Record<string, PalaceInfo> = {};
  const places: { place: PalaceInfo["place"]; changed: number[]; shiPosition: number; yingPosition: number }[] = [
    { place: "本宫", changed: [], shiPosition: 6, yingPosition: 3 },
    { place: "一世", changed: [1], shiPosition: 1, yingPosition: 4 },
    { place: "二世", changed: [1, 2], shiPosition: 2, yingPosition: 5 },
    { place: "三世", changed: [1, 2, 3], shiPosition: 3, yingPosition: 6 },
    { place: "四世", changed: [1, 2, 3, 4], shiPosition: 4, yingPosition: 1 },
    { place: "五世", changed: [1, 2, 3, 4, 5], shiPosition: 5, yingPosition: 2 },
    { place: "游魂", changed: [1, 2, 3, 5], shiPosition: 4, yingPosition: 1 },
    { place: "归魂", changed: [5], shiPosition: 3, yingPosition: 6 }
  ];

  for (const [key, palaceName] of Object.entries(trigramNames)) {
    const palace = palaceName as TrigramName;
    const baseKey = `${key}${key}`;
    for (const item of places) {
      map[changeLines(baseKey, item.changed)] = {
        palace,
        palaceElement: trigramElements[palace],
        place: item.place,
        shiPosition: item.shiPosition,
        yingPosition: item.yingPosition
      };
    }
  }

  return map;
}

const palaceMap = buildPalaceMap();
