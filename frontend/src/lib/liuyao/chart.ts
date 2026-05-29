import { calculateLiuyao, toLiuyaoCanonicalText, type LiuQinType, type LiuyaoInput, type LiuyaoOutput } from "taibu-core/liuyao";
import { Solar } from "lunar-typescript";
import { type LiuyaoLine } from "@/lib/liuyao/casting";

export type LiuyaoInputSnapshot = {
  name?: string;
  gender?: string;
  dateTime?: string;
  castingTime?: string;
  castingMethod?: string;
  castingCalendar?: "solar" | "lunar";
  numberMode?: "two" | "three";
  numberFirst?: string;
  numberSecond?: string;
  numberThird?: string;
  textMode?: "two" | "three";
  textFirst?: string;
  textSecond?: string;
  textThird?: string;
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
  taibu: LiuyaoOutput;
  canonicalText: string;
  skillWorkflow: {
    yongShenTargets: LiuQinType[];
    timeRecommendations: string[];
    warnings: string[];
  };
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

type RuntimeFullYaoInfo = LiuyaoOutput["fullYaos"][number] & {
  isChanging: boolean;
  changedYao: {
    liuQin: string;
    naJia: string;
    wuXing: string;
    relation: string;
  } | null;
  fuShen?: {
    liuQin: string;
    naJia: string;
    wuXing: string;
  };
  influence?: {
    description?: string;
  };
  kongWangState?: string;
  strength?: {
    wangShuai?: string;
    isStrong?: boolean;
    evidence?: string[];
  };
};

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

export async function buildLiuyaoChart(inputSnapshot: LiuyaoInputSnapshot | undefined, storedLines: LiuyaoLine[]): Promise<LiuyaoChart> {
  const question = inputSnapshot?.question?.trim() || "未填写";
  const direction = formatDirection(inputSnapshot);
  const castingDateText = normalizeTaibuDate(inputSnapshot?.castingTime ?? inputSnapshot?.dateTime);
  const castingDate = parseDate(castingDateText) ?? new Date();
  const yongShenTargets = inferYongShenTargets(inputSnapshot);
  const taibuInput = buildTaibuLiuyaoInput(inputSnapshot, storedLines, {
    question,
    date: castingDateText,
    yongShenTargets
  });
  const taibu = await calculateLiuyao(taibuInput);
  const fullYaos = taibu.fullYaos as RuntimeFullYaoInfo[];
  const canonicalText = toLiuyaoCanonicalText(taibu);
  const baseCode = fullYaos
    .sort((first, second) => first.position - second.position)
    .map((yao) => String(yao.type))
    .join("");
  const changedLines = fullYaos.filter((yao) => yao.isChanging);
  const changedCode = fullYaos
    .sort((first, second) => first.position - second.position)
    .map((yao) => (yao.isChanging ? (yao.type === 1 ? "0" : "1") : String(yao.type)))
    .join("");
  const upperKey = baseCode.slice(3, 6);
  const lowerKey = baseCode.slice(0, 3);
  const changedUpperKey = changedCode.slice(3, 6);
  const changedLowerKey = changedCode.slice(0, 3);
  const chartLines = fullYaos
    .sort((first, second) => first.position - second.position)
    .map((yao) => toChartLine(yao));

  return {
    profile: {
      name: inputSnapshot?.name?.trim() || "未留名",
      gender: inputSnapshot?.gender === "female" ? "女" : "男",
      birthText: formatDate(castingDate),
      castingText: formatDateTime(castingDate),
      direction,
      question
    },
    ganzhiText: formatTaibuGanZhiText(taibu),
    hexagram: {
      name: taibu.hexagramName,
      upper: trigramNames[upperKey] ?? "上卦",
      lower: trigramNames[lowerKey] ?? "下卦",
      changingCount: changedLines.length,
      changed:
        taibu.changedHexagramName && changedLines.length > 0
          ? {
              name: taibu.changedHexagramName,
              upper: trigramNames[changedUpperKey] ?? "上卦",
              lower: trigramNames[changedLowerKey] ?? "下卦"
            }
          : undefined
    },
    lineRelations: buildTaibuLineRelations(taibu),
    lines: chartLines,
    taibu,
    canonicalText,
    skillWorkflow: {
      yongShenTargets,
      timeRecommendations: formatTimeRecommendations(taibu),
      warnings: taibu.warnings ?? []
    },
    interpretation: buildTaibuInterpretation(taibu, question, direction, inputSnapshot, castingDate, fullYaos)
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

function buildTaibuLiuyaoInput(
  inputSnapshot: LiuyaoInputSnapshot | undefined,
  storedLines: LiuyaoLine[],
  defaults: Pick<LiuyaoInput, "question" | "date" | "yongShenTargets">
): LiuyaoInput {
  if (inputSnapshot?.castingMethod === "time") {
    return { ...defaults, method: "time" };
  }

  if (inputSnapshot?.castingMethod === "number") {
    return { ...defaults, method: "number", numbers: getNumberCastingValues(inputSnapshot) };
  }

  if (inputSnapshot?.castingMethod === "text") {
    return { ...defaults, method: "number", numbers: getTextCastingValues(inputSnapshot) };
  }

  if (storedLines.length === 6) {
    const hexagramName = getLineCode(storedLines, false);
    const changedHexagramName = storedLines.some((line) => line.changing) ? getLineCode(storedLines, true) : undefined;
    return {
      ...defaults,
      method: "select",
      hexagramName,
      changedHexagramName
    };
  }

  return {
    ...defaults,
    method: "auto",
    seedScope: "sm1-liuyao"
  };
}

function inferYongShenTargets(inputSnapshot: LiuyaoInputSnapshot | undefined): LiuQinType[] {
  const question = inputSnapshot?.question ?? "";

  if (inputSnapshot?.divinationDirection === "wealth" || /财|钱|收入|投资|生意|资源/.test(question)) return ["妻财"];
  if (inputSnapshot?.divinationDirection === "career" || /工作|事业|考试|升学|offer|录用|晋升|官司|规则|疾病|病/.test(question)) {
    return /考试|升学|证|文书|合同|房|车/.test(question) ? ["父母"] : ["官鬼"];
  }
  if (inputSnapshot?.divinationDirection === "relationship" || /感情|婚|恋|对象|复合|伴侣/.test(question)) {
    return inputSnapshot?.gender === "female" ? ["官鬼"] : ["妻财"];
  }
  if (inputSnapshot?.divinationDirection === "health" || /健康|病|治疗|医药|恢复/.test(question)) return ["子孙", "官鬼"];
  if (inputSnapshot?.divinationDirection === "cooperation" || inputSnapshot?.divinationDirection === "interpersonal" || /合作|朋友|同事|竞争|小人|关系/.test(question)) {
    return ["兄弟"];
  }

  return ["官鬼"];
}

function getNumberCastingValues(inputSnapshot: LiuyaoInputSnapshot): number[] {
  const values = [inputSnapshot.numberFirst, inputSnapshot.numberSecond, inputSnapshot.numberMode === "three" ? inputSnapshot.numberThird : undefined]
    .filter((value): value is string => Boolean(value?.trim()))
    .map((value) => Number(value));

  return values.length >= 2 ? values : [1, 1];
}

function getTextCastingValues(inputSnapshot: LiuyaoInputSnapshot): number[] {
  const values = [inputSnapshot.textFirst, inputSnapshot.textSecond, inputSnapshot.textMode === "three" ? inputSnapshot.textThird : undefined]
    .filter((value): value is string => Boolean(value?.trim()))
    .map((value) => Array.from(value.trim()).reduce((sum, char) => sum + (char.codePointAt(0) ?? 0), 0));

  return values.length >= 2 ? values : [1, 1];
}

function getLineCode(lines: LiuyaoLine[], changed: boolean) {
  return [...lines]
    .sort((first, second) => first.position - second.position)
    .map((line) => {
      const isYang = line.kind === "young-yang" || line.kind === "old-yang";
      const finalYang = changed && line.changing ? !isYang : isYang;
      return finalYang ? "1" : "0";
    })
    .join("");
}

function normalizeTaibuDate(value: string | undefined) {
  if (!value) return formatDateTimeInput(new Date());
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) || /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(value)) return value;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? formatDateTimeInput(new Date()) : formatDateTimeInput(date);
}

function formatDateTimeInput(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function toChartLine(yao: RuntimeFullYaoInfo): LiuyaoChartLine {
  const changing = yao.isChanging;
  const symbol = yao.type === 1 ? "yang" : "yin";
  const changedYao = yao.changedYao;
  const changedSymbol = changing ? (symbol === "yang" ? "yin" : "yang") : symbol;
  const kind = symbol === "yang" ? (changing ? "old-yang" : "young-yang") : changing ? "old-yin" : "young-yin";
  const total = symbol === "yang" ? (changing ? 9 : 7) : changing ? 6 : 8;
  const branch = normalizeBranch(yao.naJia);
  const changedBranch = normalizeBranch(changedYao?.naJia ?? yao.naJia);
  const marker = yao.isShiYao ? "世" : yao.isYingYao ? "应" : undefined;

  return {
    position: yao.position,
    coins: (symbol === "yang" ? [1, 1, changing ? 1 : 0] : [0, 0, changing ? 0 : 1]) as [0 | 1, 0 | 1, 0 | 1],
    total,
    kind,
    changing,
    label: symbol === "yang" ? "阳爻" : "阴爻",
    symbol,
    changedSymbol,
    spirit: yao.liuShen,
    relation: yao.liuQin,
    branch,
    element: normalizeElement(yao.wuXing),
    changedRelation: changedYao?.liuQin ?? yao.liuQin,
    changedBranch,
    changedElement: normalizeElement(changedYao?.wuXing ?? yao.wuXing),
    marker,
    hiddenStem: yao.fuShen ? `伏${yao.fuShen.liuQin}${yao.fuShen.naJia}${yao.fuShen.wuXing}` : undefined,
    monthRelation: yao.influence?.description ?? "日月作用以太卜结果为准",
    dayRelation: yao.kongWangState ? `空亡状态：${formatKongWangState(yao.kongWangState)}` : "未入空亡",
    strength: formatTaibuStrength(yao),
    isUsefulGod: false
  };
}

function normalizeBranch(value: string): EarthlyBranch {
  return value.replace(/[金木水火土]$/, "") as EarthlyBranch;
}

function normalizeElement(value: string): FiveElement {
  return value.replace(/.*([金木水火土])$/, "$1") as FiveElement;
}

function formatTaibuStrength(yao: RuntimeFullYaoInfo) {
  const labelMap: Record<string, string> = {
    wang: "旺",
    xiang: "相",
    xiu: "休",
    qiu: "囚",
    si: "死"
  };
  const wangShuai = labelMap[yao.strength?.wangShuai ?? ""] ?? yao.strength?.wangShuai ?? "未定";
  const evidence = yao.strength?.evidence?.length ? `：${yao.strength.evidence.join("、")}` : "";
  return `${wangShuai}${yao.strength?.isStrong ? "，偏强" : "，偏弱"}${evidence}`;
}

function formatKongWangState(value: string) {
  const labels: Record<string, string> = {
    not_kong: "不空",
    kong_static: "静空",
    kong_changing: "动空",
    kong_ri_chong: "日冲出空",
    kong_yue_jian: "月建填实"
  };

  return labels[value] ?? value;
}

function formatTaibuGanZhiText(result: LiuyaoOutput) {
  const { year, month, day, hour } = result.ganZhiTime;
  return `${year.gan}${year.zhi}年 ${month.gan}${month.zhi}月 ${day.gan}${day.zhi}日 ${hour.gan}${hour.zhi}时（日空${result.kongWang.kongDizhi.join("")}）`;
}

function buildTaibuLineRelations(result: LiuyaoOutput) {
  return [
    result.liuChongGuaInfo?.description,
    result.liuHeGuaInfo?.description,
    result.chongHeTransition?.description,
    result.guaFanFuYin?.description,
    result.sanHeAnalysis?.fullSanHe?.description,
    ...(result.sanHeAnalysis?.banHe?.map((item) => `${item.branches.join("")}半合${item.result}`) ?? []),
    ...(result.globalShenSha.length ? [`全局神煞：${result.globalShenSha.join("、")}`] : [])
  ].filter((item): item is string => Boolean(item));
}

function formatTimeRecommendations(result: LiuyaoOutput) {
  return (result.timeRecommendations ?? []).map((item) => `${item.type}｜${item.trigger}｜${item.description}`);
}

function buildTaibuInterpretation(
  result: LiuyaoOutput,
  question: string,
  direction: string,
  inputSnapshot: LiuyaoInputSnapshot | undefined,
  castingDate: Date,
  fullYaos: RuntimeFullYaoInfo[]
) {
  const shiLine = fullYaos.find((line) => line.isShiYao);
  const yingLine = fullYaos.find((line) => line.isYingYao);
  const yongShenText = result.yongShen
    .map((group) => {
      const selected = group.selected;
      return `${group.targetLiuQin}：${group.selectionNote}${selected ? ` 主用神${formatTaibuYaoPosition(selected.position)}${selected.naJia ?? selected.changedNaJia ?? ""}${selected.element}，${selected.strengthLabel}` : ""}`;
    })
    .join("；");
  const movingText = fullYaos
    .filter((line) => line.isChanging)
    .map((line) => `${formatTaibuYaoPosition(line.position)}${line.liuQin}${line.naJia}${line.wuXing}动，${line.changedYao ? `变${line.changedYao.liuQin}${line.changedYao.naJia}${line.changedYao.wuXing}（${line.changedYao.relation}）` : "无变爻详情"}`)
    .join("；");
  const timeText = formatTimeRecommendations(result).join("；") || "暂无明确时间建议，按用神、世应、动爻优先判断。";

  return [
    {
      title: "基本信息",
      points: [
        `求测事项：${question}`,
        `求测时间（公历/农历）：${formatDateTime(castingDate)} / ${formatLunarDateTime(castingDate)}`,
        `四柱干支：${result.ganZhiTime.year.gan}${result.ganZhiTime.year.zhi}年 ${result.ganZhiTime.month.gan}${result.ganZhiTime.month.zhi}月 ${result.ganZhiTime.day.gan}${result.ganZhiTime.day.zhi}日 ${result.ganZhiTime.hour.gan}${result.ganZhiTime.hour.zhi}时`,
        `月建：${result.ganZhiTime.month.zhi}；日辰：${result.ganZhiTime.day.zhi}`,
        `起卦方式：${formatCastingMethod(inputSnapshot?.castingMethod)}`,
        `本卦卦名：${result.hexagramName}`,
        `变卦卦名：${result.changedHexagramName ?? "无"}`
      ]
    },
    {
      title: "核心信息标注",
      points: [
        `卦宫：${result.hexagramGong}宫${result.hexagramElement}`,
        `世爻：${shiLine ? formatTaibuLineBrief(shiLine) : "未定位"}；应爻：${yingLine ? formatTaibuLineBrief(yingLine) : "未定位"}`,
        `旬空：${result.kongWang.kongDizhi.join("")}`,
        `核心用神：${yongShenText || "未定位"}`,
        `辅助用神：${shiLine ? `世爻${formatTaibuLineBrief(shiLine)}代表求测人自身。` : "未定位世爻。"}`
      ]
    },
    {
      title: "旺衰与推理分析",
      points: [
        `用神旺衰判断：${yongShenText || "用神信息不足"}`,
        `世应关系分析：世爻${shiLine ? formatTaibuLineBrief(shiLine) : "未定位"}；应爻${yingLine ? formatTaibuLineBrief(yingLine) : "未定位"}。`,
        `动爻与变爻影响：${movingText || "本卦无动爻，先看世应用神及日月作用。"}`,
        `合冲刑害特殊作用：${buildTaibuLineRelations(result).join("；") || "未见明确全局合冲提示。"}`
      ]
    },
    {
      title: "时机建议",
      points: [`时间窗口：${timeText}`, ...(result.warnings ?? []).map((warning) => `风险提示：${warning}`)]
    },
    {
      title: "最终参考结论",
      points: [
        `吉凶定性：请基于${direction}问题，按用神强弱、世应、动爻和时机窗口给出倾向，不作绝对断语。`,
        `关键提示：核心看${result.yongShen.map((item) => item.targetLiuQin).join("、") || "用神"}是否得月建、日辰、动爻与卦中多爻生扶，同时标注旬空、冲合刑害与动变方向。`
      ]
    }
  ];
}

function formatTaibuYaoPosition(position?: number) {
  return ["", "初爻", "二爻", "三爻", "四爻", "五爻", "上爻"][position ?? 0] ?? `${position}爻`;
}

function formatTaibuLineBrief(line: RuntimeFullYaoInfo) {
  const marker = line.isShiYao ? "世" : line.isYingYao ? "应" : "";
  return `${formatTaibuYaoPosition(line.position)}${marker ? `（${marker}）` : ""}${line.liuQin}${line.naJia}${line.wuXing}，${formatTaibuStrength(line)}`;
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

function formatLunarDateTime(date: Date) {
  const lunar = Solar.fromYmdHms(date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes(), 0).getLunar();

  return `${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()} ${lunar.getTimeZhi()}时`;
}

function formatCastingMethod(value: string | undefined) {
  const labels: Record<string, string> = {
    shake: "摇卦",
    number: "报数",
    manual: "指定",
    time: "时间",
    text: "汉字"
  };

  return value ? labels[value] ?? value : "未记录";
}

function buildInterpretation({
  hexagramName,
  changedHexagramName,
  direction,
  question,
  inputSnapshot,
  castingDate,
  lines,
  palaceInfo,
  pillars,
  usefulGodRelation
}: {
  hexagramName: string;
  changedHexagramName?: string;
  direction: string;
  question: string;
  inputSnapshot?: LiuyaoInputSnapshot;
  castingDate: Date;
  lines: LiuyaoChartLine[];
  palaceInfo: PalaceInfo;
  pillars: LiuyaoTimePillars;
  usefulGodRelation: string;
}) {
  const shiLine = lines.find((line) => line.marker === "世");
  const yingLine = lines.find((line) => line.marker === "应");
  const usefulLines = lines.filter((line) => line.isUsefulGod);
  const auxiliaryText = shiLine ? formatDetailedLine(shiLine) : "世爻未定位";
  const usefulText =
    usefulLines.length > 0
      ? usefulLines.map((line) => `${formatDetailedLine(line)}（${line.strength}，${line.monthRelation}，${line.dayRelation}）`).join("；")
      : "本卦未直接出现对应用神，需后续结合伏神规则补取";
  const usefulStrength = buildUsefulGodStrengthText(usefulLines, lines, pillars);
  const movingText = lines
    .filter((line) => line.changing)
    .map((line) => `${formatDetailedLine(line)}发动，化${line.changedRelation}${line.changedBranch}${line.changedElement}；动为始、变为终，${describeMovingTransform(line)}`)
    .join("；");
  const shiYingText = [
    shiLine ? `世爻：${formatDetailedLine(shiLine)}，${shiLine.strength}` : undefined,
    yingLine ? `应爻：${formatDetailedLine(yingLine)}，${yingLine.strength}` : undefined
  ]
    .filter((item): item is string => Boolean(item))
    .join("；");
  const shiMonthDayText = shiLine ? buildShiMonthDayText(shiLine, pillars, usefulLines) : "世爻未定位，暂无法判断日月对世爻的喜忌。";
  const pairPoints = buildLinePairPoints(lines);
  const harmonyPoints = buildHarmonyPoints(lines);
  const movingDetailPoints = movingText
    ? movingText.split("；")
    : ["本卦无动爻，暂无化回头生克；先看日月对世爻、用神和静爻之间的生克合冲。"];
  const specialEffects = [...lines.map((line) => `${formatDetailedLine(line)}：${line.monthRelation}，${line.dayRelation}`), ...pairPoints, ...harmonyPoints].slice(0, 8);
  const finalTone = buildFinalTone(usefulLines, shiLine);

  return [
    {
      title: "基本信息",
      points: [
        `求测事项：${question}`,
        `求测时间（公历/农历）：${formatDateTime(castingDate)} / ${formatLunarDateTime(castingDate)}`,
        `四柱干支：${pillars.year.text}年 ${pillars.month.text}月 ${pillars.day.text}日 ${pillars.hour.text}时`,
        `月建：${pillars.month.branch}；日辰：${pillars.day.branch}`,
        `起卦方式：${formatCastingMethod(inputSnapshot?.castingMethod)}`,
        `本卦卦名：${hexagramName}`,
        `变卦卦名：${changedHexagramName ?? "无"}`
      ]
    },
    {
      title: "核心信息标注",
      points: [
        `卦宫：${palaceInfo.palace}宫${palaceInfo.palaceElement}，${palaceInfo.place}卦`,
        shiYingText || "世爻、应爻未定位",
        `旬空：${pillars.dayVoid}`,
        `核心用神：${usefulGodRelation}；${usefulText}`,
        `辅助用神：${auxiliaryText}。自身相关事项必看世爻，世爻代表求测人自身。`
      ]
    },
    {
      title: "旺衰与推理分析",
      points: [
        `用神旺衰判断：${usefulStrength}`,
        `世应关系分析：${shiMonthDayText}${yingLine && shiLine ? ` ${describeLinePair(shiLine, yingLine)}。` : ""}`,
        `动爻与变爻影响：${movingDetailPoints.join("；")}`,
        `合冲刑害特殊作用：${specialEffects.join("；")}`
      ]
    },
    {
      title: "最终参考结论",
      points: [
        `吉凶定性：${finalTone}`,
        `关键提示：重点看${usefulGodRelation}是否得月建、日辰、动爻与卦中多爻生扶，同时标注旬空、冲合刑害与动变方向。`
      ]
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

function buildUsefulGodStrengthText(usefulLines: LiuyaoChartLine[], lines: LiuyaoChartLine[], pillars: LiuyaoTimePillars) {
  if (usefulLines.length === 0) {
    return "本卦未直接出现核心用神，暂不能按明现用神定旺衰；需后续补伏神规则后再细断。";
  }

  return usefulLines.map((line) => describeUsefulLineStrength(line, lines, pillars)).join("；");
}

function describeUsefulLineStrength(line: LiuyaoChartLine, lines: LiuyaoChartLine[], pillars: LiuyaoTimePillars) {
  const supportReasons: string[] = [];
  const damageReasons: string[] = [];
  const monthEffect = getElementEffect(branchElements[pillars.month.branch], line.element);
  const dayEffect = getElementEffect(branchElements[pillars.day.branch], line.element);
  const movingLines = lines.filter((item) => item.changing && item.position !== line.position);
  const otherLines = lines.filter((item) => item.position !== line.position);
  const supportingLines = otherLines.filter((item) => getElementEffect(item.element, line.element) === "support");
  const damagingLines = otherLines.filter((item) => getElementEffect(item.element, line.element) === "damage");

  if (monthEffect === "support") supportReasons.push(`得月建${pillars.month.branch}${branchElements[pillars.month.branch]}生扶/同气`);
  if (monthEffect === "damage") damageReasons.push(`被月建${pillars.month.branch}${branchElements[pillars.month.branch]}克制`);
  if (dayEffect === "support") supportReasons.push(`得日辰${pillars.day.branch}${branchElements[pillars.day.branch]}生扶/同气`);
  if (dayEffect === "damage") damageReasons.push(`被日辰${pillars.day.branch}${branchElements[pillars.day.branch]}克制`);

  movingLines.forEach((movingLine) => {
    const effect = getElementEffect(movingLine.element, line.element);
    if (effect === "support") supportReasons.push(`得动爻${formatDetailedLine(movingLine)}生扶`);
    if (effect === "damage") damageReasons.push(`被动爻${formatDetailedLine(movingLine)}克制`);
  });

  if (supportingLines.length >= 2) supportReasons.push(`卦中多爻生扶：${supportingLines.map(formatDetailedLine).join("、")}`);
  if (damagingLines.length >= 2) damageReasons.push(`卦中多爻相克：${damagingLines.map(formatDetailedLine).join("、")}`);

  const status = supportReasons.length > damageReasons.length ? "偏旺" : damageReasons.length > supportReasons.length ? "偏衰" : "平";
  const voidText = pillars.dayVoid.includes(line.branch) ? `；${line.branch}在旬空${pillars.dayVoid}内，需单独标注为空` : "";

  return `${formatDetailedLine(line)}：${status}。得助依据：${supportReasons.join("，") || "未见明显生扶"}；受损依据：${damageReasons.join("，") || "未见明显克制"}${voidText}`;
}

function getElementEffect(source: FiveElement, target: FiveElement) {
  if (source === target || generating[source] === target) return "support";
  if (controlling[source] === target) return "damage";
  return "neutral";
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

function buildFinalTone(usefulLines: LiuyaoChartLine[], shiLine: LiuyaoChartLine | undefined) {
  if (usefulLines.length === 0) {
    return "核心用神未明现，暂以世爻和日月动爻作保守参考，不宜直接定吉凶。";
  }

  const strongCount = usefulLines.filter((line) => line.strength === "旺" || line.strength === "相").length;
  const weakCount = usefulLines.filter((line) => line.strength === "衰").length;
  const shiSupport = shiLine ? usefulLines.some((line) => getElementEffect(line.element, shiLine.element) === "support" || line.position === shiLine.position) : false;

  if (strongCount > weakCount && shiSupport) {
    return "用神有力且能帮扶世爻，整体偏有利，但仍需结合动爻、旬空与现实条件谨慎推进。";
  }

  if (weakCount > strongCount) {
    return "用神受损较多，整体偏谨慎，当前阻力较明显，适合先补条件、控风险。";
  }

  return "用神力量不偏不倚，吉凶未成定局，关键在动爻方向、世应用神关系和后续行动。";
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

function getUsefulGodRelation(direction: string | undefined, gender: string | undefined, question = "") {
  if (/(财运|生意|物价|财物|投资|收入|钱|盈利|创业)/.test(question) || direction === "wealth") return "妻财";
  if (/(事业|工作|官运|官司|疾病|诉讼|风险)/.test(question) || direction === "career" || direction === "risk" || direction === "health") return "官鬼";
  if (/(考试|学业|文书|证件|长辈|房屋|合同|资料)/.test(question)) return "父母";
  if (/(子女|宠物|医药|避灾|娱乐|玩乐)/.test(question)) return "子孙";
  if (/(同辈|朋友|竞争对手|破财|小人|人际)/.test(question) || direction === "interpersonal") return "兄弟";
  if (direction === "relationship") return gender === "female" ? "官鬼" : "妻财";
  if (direction === "cooperation") return "应爻";
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
