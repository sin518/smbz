import { Solar } from "lunar-typescript";
import type { EarthlyBranch, HeavenlyStem, Pillar } from "@/lib/bazi";

export type QimenMethod = "time" | "question";
export type QimenPlateType = "zhuan" | "fei";
export type DunType = "yang" | "yin";

export interface QimenCalculationInput {
  dateTime: string;
  location: string;
  method: QimenMethod;
  question?: string;
  plateType?: QimenPlateType;
  manualDunType?: DunType;
  manualJu?: number;
}

export interface QimenPalace {
  number: PalaceNumber;
  label: string;
  direction: string;
  earthStem: QimenStem;
  heavenStem: QimenStem;
  star: QimenStar;
  gate: QimenGate | null;
  god: QimenGod | null;
  isZhiFu: boolean;
  isZhiShi: boolean;
}

export interface QimenChart {
  method: QimenMethod;
  plateType: QimenPlateType;
  location: string;
  question?: string;
  solarText: string;
  lunarText: string;
  pillars: {
    year: Pillar;
    month: Pillar;
    day: Pillar;
    hour: Pillar;
  };
  solarTerm: {
    name: string;
    yuan: YuanType;
  };
  dunType: DunType;
  ju: number;
  hourXun: {
    name: string;
    leader: QimenStem;
    startBranch: EarthlyBranch;
  };
  zhiFu: {
    star: QimenStar;
    palace: PalaceNumber;
  };
  zhiShi: {
    gate: QimenGate;
    palace: PalaceNumber;
  };
  palaces: QimenPalace[];
  notes: string[];
}

type PalaceNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type YuanType = "上元" | "中元" | "下元";
type QimenStem = "戊" | "己" | "庚" | "辛" | "壬" | "癸" | "丁" | "丙" | "乙";
type QimenStar = "天蓬" | "天任" | "天冲" | "天辅" | "天英" | "天芮" | "天柱" | "天心" | "天禽";
type QimenGate = "休门" | "生门" | "伤门" | "杜门" | "景门" | "死门" | "惊门" | "开门";
type QimenGod = "值符" | "螣蛇" | "太阴" | "六合" | "白虎" | "玄武" | "九地" | "九天";

interface ParsedDateTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

const DISPLAY_ORDER: PalaceNumber[] = [4, 9, 2, 3, 5, 7, 8, 1, 6];
const PALACE_LABELS: Record<PalaceNumber, { label: string; direction: string }> = {
  1: { label: "坎一", direction: "北" },
  2: { label: "坤二", direction: "西南" },
  3: { label: "震三", direction: "东" },
  4: { label: "巽四", direction: "东南" },
  5: { label: "中五", direction: "中" },
  6: { label: "乾六", direction: "西北" },
  7: { label: "兑七", direction: "西" },
  8: { label: "艮八", direction: "东北" },
  9: { label: "离九", direction: "南" }
};
const ORIGINAL_STARS: Record<PalaceNumber, QimenStar> = {
  1: "天蓬",
  2: "天芮",
  3: "天冲",
  4: "天辅",
  5: "天禽",
  6: "天心",
  7: "天柱",
  8: "天任",
  9: "天英"
};
const ORIGINAL_GATES: Partial<Record<PalaceNumber, QimenGate>> = {
  1: "休门",
  2: "死门",
  3: "伤门",
  4: "杜门",
  6: "开门",
  7: "惊门",
  8: "生门",
  9: "景门"
};
const STEMS: QimenStem[] = ["戊", "己", "庚", "辛", "壬", "癸", "丁", "丙", "乙"];
const HEAVENLY_STEMS: HeavenlyStem[] = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const EARTHLY_BRANCHES: EarthlyBranch[] = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const SIXTY_JIAZI = buildSixtyJiazi();
const GODS: QimenGod[] = ["值符", "螣蛇", "太阴", "六合", "白虎", "玄武", "九地", "九天"];
const EIGHT_PALACES: PalaceNumber[] = [1, 8, 3, 4, 9, 2, 7, 6];
const GATE_STEP_ORDER: PalaceNumber[] = [1, 8, 3, 4, 9, 2, 7, 6];
const TERM_JU_TABLE: Record<string, [number, number, number]> = {
  冬至: [1, 7, 4],
  惊蛰: [1, 7, 4],
  小寒: [2, 8, 5],
  大寒: [3, 9, 6],
  春分: [3, 9, 6],
  立春: [8, 5, 2],
  雨水: [9, 6, 3],
  清明: [4, 1, 7],
  立夏: [4, 1, 7],
  谷雨: [5, 2, 8],
  小满: [5, 2, 8],
  芒种: [6, 3, 9],
  夏至: [9, 3, 6],
  白露: [9, 3, 6],
  小暑: [8, 2, 5],
  大暑: [7, 1, 4],
  秋分: [7, 1, 4],
  立秋: [2, 5, 8],
  处暑: [1, 4, 7],
  寒露: [6, 9, 3],
  立冬: [6, 9, 3],
  霜降: [5, 8, 2],
  小雪: [5, 8, 2],
  大雪: [4, 7, 1]
};
const YANG_DUN_TERMS = new Set(["冬至", "小寒", "大寒", "立春", "雨水", "惊蛰", "春分", "清明", "谷雨", "立夏", "小满", "芒种"]);

export function calculateQimenChart(input: QimenCalculationInput): QimenChart {
  const parsed = parseDateTimeLocal(input.dateTime);
  const solar = Solar.fromYmdHms(parsed.year, parsed.month, parsed.day, parsed.hour, parsed.minute, 0);
  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();
  const prevJie = lunar.getPrevJie();
  const prevJieSolar = prevJie.getSolar();
  const minutesAfterJie = Math.max(0, solar.subtractMinute(prevJieSolar));
  const yuan = getYuan(minutesAfterJie);
  const solarTermName = prevJie.getName();
  const automaticDunType: DunType = YANG_DUN_TERMS.has(solarTermName) ? "yang" : "yin";
  const dunType = input.manualDunType ?? automaticDunType;
  const ju = normalizeJu(input.manualJu) ?? getJu(solarTermName, yuan);
  const plateType = input.plateType ?? "zhuan";
  if (plateType === "fei") {
    throw new Error("飞盘奇门排盘规则尚未实现");
  }
  const hourPillar = toPillar(eightChar.getTimeGan(), eightChar.getTimeZhi());
  const hourXun = getHourXun(`${hourPillar.stem}${hourPillar.branch}`);
  const earthPlate = buildEarthPlate(dunType, ju);
  const xunShouPalace = findStemPalace(earthPlate, hourXun.leader);
  const zhiFuStar = ORIGINAL_STARS[xunShouPalace];
  const zhiShiGate = ORIGINAL_GATES[xunShouPalace === 5 ? 2 : xunShouPalace] ?? "死门";
  const hourStemForPlate = hourPillar.stem === "甲" ? hourXun.leader : normalizeQimenStem(hourPillar.stem);
  const zhiFuTargetPalace = findStemPalace(earthPlate, hourStemForPlate);
  const zhiShiTargetPalace = zhiFuTargetPalace;
  const starPlate = rotateByAnchor(ORIGINAL_STARS, zhiFuStar, zhiFuTargetPalace, true);
  const gatePlate = rotateByAnchor(ORIGINAL_GATES, zhiShiGate, zhiShiTargetPalace, false);
  const godPlate = buildGodPlate(zhiFuTargetPalace, dunType);
  const heavenPlate = buildHeavenPlate(earthPlate, starPlate);

  return {
    method: input.method,
    plateType,
    location: input.location.trim(),
    question: input.question?.trim() || undefined,
    solarText: formatSolar(parsed),
    lunarText: `${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()} ${lunar.getTimeZhi()}时`,
    pillars: {
      year: toPillar(eightChar.getYearGan(), eightChar.getYearZhi()),
      month: toPillar(eightChar.getMonthGan(), eightChar.getMonthZhi()),
      day: toPillar(eightChar.getDayGan(), eightChar.getDayZhi()),
      hour: hourPillar
    },
    solarTerm: {
      name: solarTermName,
      yuan
    },
    dunType,
    ju,
    hourXun,
    zhiFu: {
      star: zhiFuStar,
      palace: zhiFuTargetPalace
    },
    zhiShi: {
      gate: zhiShiGate,
      palace: zhiShiTargetPalace
    },
    palaces: DISPLAY_ORDER.map((number) => ({
      number,
      ...PALACE_LABELS[number],
      earthStem: earthPlate[number],
      heavenStem: heavenPlate[number],
      star: starPlate[number] ?? ORIGINAL_STARS[number],
      gate: gatePlate[number] ?? null,
      god: godPlate[number] ?? null,
      isZhiFu: number === zhiFuTargetPalace,
      isZhiShi: number === zhiShiTargetPalace
    })),
    notes: [
      input.manualJu
        ? `采用专业选局：手动指定${dunType === "yang" ? "阳遁" : "阴遁"}${ju}局。`
        : "采用时家奇门拆补法：以当前节气定阴阳遁，以节气三元取局数。",
      "当前九宫盘按转盘奇门排法展示。",
      "值符与值使按参考盘式随时干落宫，八神随值符按阴阳顺逆布列。",
      "TODO: 置闰法、超接置闰与值使随时宫存在流派差异，后续可增加配置开关。"
    ]
  };
}

function normalizeJu(value: number | undefined) {
  if (value === undefined || !Number.isInteger(value) || value < 1 || value > 9) {
    return undefined;
  }

  return value;
}

function parseDateTimeLocal(value: string): ParsedDateTime {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) {
    throw new Error("dateTime must be a datetime-local string");
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5])
  };
}

function getYuan(minutesAfterJie: number): YuanType {
  const daysAfterJie = Math.floor(minutesAfterJie / 1440);
  if (daysAfterJie < 5) return "上元";
  if (daysAfterJie < 10) return "中元";
  return "下元";
}

function getJu(term: string, yuan: YuanType) {
  const table = TERM_JU_TABLE[term] ?? [1, 7, 4];
  const index: Record<YuanType, number> = { 上元: 0, 中元: 1, 下元: 2 };
  return table[index[yuan]];
}

function buildEarthPlate(dunType: DunType, ju: number): Record<PalaceNumber, QimenStem> {
  const result = {} as Record<PalaceNumber, QimenStem>;
  const palaceSequence = buildPalaceSequence(ju as PalaceNumber, dunType, true);

  STEMS.forEach((stem, index) => {
    result[palaceSequence[index]] = stem;
  });

  return result;
}

function buildPalaceSequence(start: PalaceNumber, dunType: DunType, includeCenter: true): PalaceNumber[] {
  const direction = dunType === "yang" || !includeCenter ? 1 : -1;
  return Array.from({ length: 9 }, (_, index) => (wrapIndex(start - 1 + index * direction, 9) + 1) as PalaceNumber);
}

function findStemPalace(plate: Record<PalaceNumber, QimenStem>, stem: QimenStem) {
  const found = DISPLAY_ORDER.find((number) => plate[number] === stem);
  if (!found) {
    throw new Error(`stem ${stem} not found on qimen plate`);
  }
  return found;
}

function rotateByAnchor<TValue>(
  original: Partial<Record<PalaceNumber, TValue>>,
  anchorValue: TValue,
  targetPalace: PalaceNumber,
  includeCenter: boolean
): Partial<Record<PalaceNumber, TValue>> {
  const result: Partial<Record<PalaceNumber, TValue>> = {};
  const sequence = includeCenter ? ([1, 2, 3, 4, 5, 6, 7, 8, 9] as PalaceNumber[]) : EIGHT_PALACES;
  const originalAnchor = sequence.find((number) => original[number] === anchorValue);

  if (!originalAnchor) {
    return result;
  }

  const offset = sequence.indexOf(targetPalace) - sequence.indexOf(originalAnchor);
  sequence.forEach((number, index) => {
    const value = original[number];
    if (value) {
      result[sequence[wrapIndex(index + offset, sequence.length)]] = value;
    }
  });

  return result;
}

function buildGodPlate(zhiFuPalace: PalaceNumber, dunType: DunType): Partial<Record<PalaceNumber, QimenGod>> {
  const result: Partial<Record<PalaceNumber, QimenGod>> = {};
  const startIndex = EIGHT_PALACES.indexOf(zhiFuPalace === 5 ? 2 : zhiFuPalace);
  const direction = dunType === "yang" ? 1 : -1;

  GODS.forEach((god, index) => {
    result[EIGHT_PALACES[wrapIndex(startIndex + index * direction, EIGHT_PALACES.length)]] = god;
  });

  return result;
}

function buildHeavenPlate(
  earthPlate: Record<PalaceNumber, QimenStem>,
  starPlate: Partial<Record<PalaceNumber, QimenStar>>
): Record<PalaceNumber, QimenStem> {
  const result = {} as Record<PalaceNumber, QimenStem>;

  DISPLAY_ORDER.forEach((number) => {
    const star = starPlate[number];
    const originalPalace = DISPLAY_ORDER.find((palace) => ORIGINAL_STARS[palace] === star) ?? number;
    result[number] = earthPlate[originalPalace];
  });

  return result;
}

function calculateZhiShiPalace(xunShouPalace: PalaceNumber, startBranch: EarthlyBranch, hourBranch: EarthlyBranch, dunType: DunType) {
  const steps = wrapIndex(EARTHLY_BRANCHES.indexOf(hourBranch) - EARTHLY_BRANCHES.indexOf(startBranch), 12);
  const startPalace = xunShouPalace === 5 ? 2 : xunShouPalace;
  const startIndex = GATE_STEP_ORDER.indexOf(startPalace);
  const direction = dunType === "yang" ? 1 : -1;

  return GATE_STEP_ORDER[wrapIndex(startIndex + steps * direction, GATE_STEP_ORDER.length)];
}

function getHourXun(hourGanZhi: string): { name: string; leader: QimenStem; startBranch: EarthlyBranch } {
  const index = SIXTY_JIAZI.indexOf(hourGanZhi);
  if (index < 0) {
    throw new Error(`unknown ganzhi: ${hourGanZhi}`);
  }

  const xunIndex = Math.floor(index / 10);
  const leaders: Array<{ name: string; leader: QimenStem; startBranch: EarthlyBranch }> = [
    { name: "甲子旬", leader: "戊", startBranch: "子" },
    { name: "甲戌旬", leader: "己", startBranch: "戌" },
    { name: "甲申旬", leader: "庚", startBranch: "申" },
    { name: "甲午旬", leader: "辛", startBranch: "午" },
    { name: "甲辰旬", leader: "壬", startBranch: "辰" },
    { name: "甲寅旬", leader: "癸", startBranch: "寅" }
  ];

  return leaders[xunIndex];
}

function normalizeQimenStem(stem: HeavenlyStem): QimenStem {
  if (stem === "甲") {
    return "戊";
  }
  return stem as QimenStem;
}

function toPillar(stem: string, branch: string): Pillar {
  return {
    stem: stem as HeavenlyStem,
    branch: branch as EarthlyBranch
  };
}

function buildSixtyJiazi() {
  return Array.from({ length: 60 }, (_, index) => `${HEAVENLY_STEMS[index % 10]}${EARTHLY_BRANCHES[index % 12]}`);
}

function wrapIndex(index: number, length: number) {
  return ((index % length) + length) % length;
}

function formatSolar(date: ParsedDateTime) {
  return `${date.year}-${pad(date.month)}-${pad(date.day)} ${pad(date.hour)}:${pad(date.minute)}`;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}
