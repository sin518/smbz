import { calculateZiwei, toZiweiText, type ZiweiOutput } from "taibu-core/ziwei";

export type ZiweiGender = "male" | "female";

export interface ZiweiCalculationInput {
  name?: string;
  gender: ZiweiGender;
  birthTime: string;
  location?: string;
}

export interface ZiweiPalace {
  branch: EarthlyBranch;
  stem: HeavenlyStem;
  palaceName: PalaceName;
  ageRange: string;
  annualAges: number[];
  smallLimitAges: number[];
  mainStars: string[];
  auxiliaryStars: string[];
  maleficStars: string[];
  minorStars: string[];
  transformations: Transformation[];
  sanfangImpact: string;
  changSheng: string;
  isLifePalace: boolean;
  isBodyPalace: boolean;
}

export interface ZiweiChart {
  profile: {
    name: string;
    gender: "男" | "女";
    solarText: string;
    lunarText: string;
    location: string;
    yinYangGender: string;
    fiveElementClass: string;
    soul: string;
    body: string;
    lifeBranch: EarthlyBranch;
    bodyBranch: EarthlyBranch;
    annualBranch: EarthlyBranch;
    smallLimitBranch: EarthlyBranch;
    luckStartText: string;
    luckStemBranch: string;
    luckAgeText: string;
    luckStartYear: string;
    majorLimits: string[];
    majorLimitItems: Array<{
      stemBranch: string;
      ageText: string;
      startYear: string;
    }>;
  };
  pillars: {
    year: string;
    month: string;
    day: string;
    hour: string;
  };
  palaces: ZiweiPalace[];
  sihua: Record<Transformation, string>;
  canonicalText: string;
}

type HeavenlyStem = "甲" | "乙" | "丙" | "丁" | "戊" | "己" | "庚" | "辛" | "壬" | "癸";
type EarthlyBranch = "子" | "丑" | "寅" | "卯" | "辰" | "巳" | "午" | "未" | "申" | "酉" | "戌" | "亥";
type PalaceName = "命宫" | "兄弟" | "夫妻" | "子女" | "财帛" | "疾厄" | "迁移" | "交友" | "官禄" | "田宅" | "福德" | "父母";
type Transformation = "禄" | "权" | "科" | "忌";

type ParsedBirthTime = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

const DEFAULT_BRANCH: EarthlyBranch = "寅";
const DEFAULT_STEM: HeavenlyStem = "甲";
const DEFAULT_PALACE: PalaceName = "命宫";
const TRANSFORMATIONS: Transformation[] = ["禄", "权", "科", "忌"];
const MALEFIC_STAR_NAMES = new Set(["擎羊", "陀罗", "火星", "铃星", "地空", "地劫", "化忌"]);

export function calculateZiweiChart(input: ZiweiCalculationInput): ZiweiChart {
  const birth = parseBirthTime(input.birthTime);
  const output = calculateZiwei({
    gender: input.gender,
    birthYear: birth.year,
    birthMonth: birth.month,
    birthDay: birth.day,
    birthHour: birth.hour,
    birthMinute: birth.minute,
    calendarType: "solar"
  });
  const canonicalText = toZiweiText(output, { detailLevel: "full" });
  return toZiweiChart(input, birth, output, canonicalText);
}

function toZiweiChart(
  input: ZiweiCalculationInput,
  birth: ParsedBirthTime,
  output: ZiweiOutput,
  canonicalText: string
): ZiweiChart {
  const lifePalace = output.palaces.find((palace) => palace.name === "命宫");
  const bodyPalace = output.palaces.find((palace) => palace.isBodyPalace) ?? lifePalace;
  const firstDecadal = output.decadalList[0];
  const majorLimitItems = output.decadalList.map((item) => ({
    stemBranch: `${item.heavenlyStem}${item.palace.earthlyBranch}`,
    ageText: `${item.startAge}-${item.endAge}岁`,
    startYear: ""
  }));

  return {
    profile: {
      name: input.name?.trim() || "未填写",
      gender: input.gender === "female" ? "女" : "男",
      solarText: formatBirthTime(birth),
      lunarText: output.lunarDate,
      location: input.location || "未知地",
      yinYangGender: input.gender === "female" ? "女命" : "男命",
      fiveElementClass: output.fiveElement,
      soul: output.soul,
      body: output.body,
      lifeBranch: toBranch(lifePalace?.earthlyBranch),
      bodyBranch: toBranch(bodyPalace?.earthlyBranch),
      annualBranch: toBranch(output.fourPillars.year.zhi),
      smallLimitBranch: toBranch(output.smallLimit?.[0]?.palaceName ?? lifePalace?.earthlyBranch),
      luckStartText: firstDecadal ? `${firstDecadal.startAge}岁起` : "以十二宫大限为准",
      luckStemBranch: firstDecadal ? `${firstDecadal.heavenlyStem}${firstDecadal.palace.earthlyBranch}` : "",
      luckAgeText: firstDecadal ? `${firstDecadal.startAge}-${firstDecadal.endAge}岁` : "",
      luckStartYear: "",
      majorLimits: majorLimitItems.map((item) => `${item.stemBranch} ${item.ageText}`),
      majorLimitItems
    },
    pillars: {
      year: `${output.fourPillars.year.gan}${output.fourPillars.year.zhi}`,
      month: `${output.fourPillars.month.gan}${output.fourPillars.month.zhi}`,
      day: `${output.fourPillars.day.gan}${output.fourPillars.day.zhi}`,
      hour: `${output.fourPillars.hour.gan}${output.fourPillars.hour.zhi}`
    },
    palaces: output.palaces.map((palace) => {
      const allMinorStars = [...palace.minorStars, ...(palace.adjStars || [])].map(formatStar);
      return {
        branch: toBranch(palace.earthlyBranch),
        stem: toStem(palace.heavenlyStem),
        palaceName: toPalaceName(palace.name),
        ageRange: palace.decadalRange ? `${palace.decadalRange[0]}-${palace.decadalRange[1]}岁` : "",
        annualAges: palace.liuNianAges || [],
        smallLimitAges: output.smallLimit?.find((item) => item.palaceName === palace.name)?.ages || [],
        mainStars: palace.majorStars.map(formatStar),
        auxiliaryStars: allMinorStars.filter((star) => !MALEFIC_STAR_NAMES.has(star.replace(/\(.+\)$/u, ""))),
        maleficStars: allMinorStars.filter((star) => MALEFIC_STAR_NAMES.has(star.replace(/\(.+\)$/u, ""))),
        minorStars: allMinorStars,
        transformations: collectTransformations(palace),
        sanfangImpact: palace.sanFangSiZheng?.join("、") || "",
        changSheng: palace.changsheng12 || "",
        isLifePalace: palace.name === "命宫",
        isBodyPalace: palace.isBodyPalace
      };
    }),
    sihua: buildSihua(output),
    canonicalText
  };
}

function parseBirthTime(value: string): ParsedBirthTime {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) {
    throw new Error("出生时间格式不正确");
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5])
  };
}

function formatBirthTime(birth: ParsedBirthTime) {
  return `${birth.year}-${String(birth.month).padStart(2, "0")}-${String(birth.day).padStart(2, "0")} ${String(birth.hour).padStart(2, "0")}:${String(birth.minute).padStart(2, "0")}`;
}

function formatStar(star: { name: string; brightness?: string; mutagen?: string }) {
  const parts = [star.name];
  if (star.brightness) parts.push(`(${star.brightness})`);
  if (star.mutagen) parts.push(`化${star.mutagen}`);
  return parts.join("");
}

function collectTransformations(palace: ZiweiOutput["palaces"][number]): Transformation[] {
  const mutagens = [...palace.majorStars, ...palace.minorStars, ...(palace.adjStars || [])]
    .map((star) => star.mutagen)
    .filter((value): value is Transformation => TRANSFORMATIONS.includes(value as Transformation));
  return [...new Set(mutagens)];
}

function buildSihua(output: ZiweiOutput): Record<Transformation, string> {
  return TRANSFORMATIONS.reduce((result, mutagen) => {
    const item = output.mutagenSummary?.find((summary) => summary.mutagen === mutagen);
    result[mutagen] = item?.starName || "未标注";
    return result;
  }, {} as Record<Transformation, string>);
}

function toStem(value?: string): HeavenlyStem {
  return isStem(value) ? value : DEFAULT_STEM;
}

function toBranch(value?: string): EarthlyBranch {
  return isBranch(value) ? value : DEFAULT_BRANCH;
}

function toPalaceName(value?: string): PalaceName {
  return isPalaceName(value) ? value : DEFAULT_PALACE;
}

function isStem(value?: string): value is HeavenlyStem {
  return Boolean(value && ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"].includes(value));
}

function isBranch(value?: string): value is EarthlyBranch {
  return Boolean(value && ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"].includes(value));
}

function isPalaceName(value?: string): value is PalaceName {
  return Boolean(value && ["命宫", "兄弟", "夫妻", "子女", "财帛", "疾厄", "迁移", "交友", "官禄", "田宅", "福德", "父母"].includes(value));
}
