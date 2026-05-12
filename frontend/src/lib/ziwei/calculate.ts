import { Solar } from "lunar-typescript";

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
}

type HeavenlyStem = "甲" | "乙" | "丙" | "丁" | "戊" | "己" | "庚" | "辛" | "壬" | "癸";
type EarthlyBranch = "子" | "丑" | "寅" | "卯" | "辰" | "巳" | "午" | "未" | "申" | "酉" | "戌" | "亥";
type PalaceName = "命宫" | "兄弟" | "夫妻" | "子女" | "财帛" | "疾厄" | "迁移" | "交友" | "官禄" | "田宅" | "福德" | "父母";
type Transformation = "禄" | "权" | "科" | "忌";

const STEMS: HeavenlyStem[] = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const BRANCHES: EarthlyBranch[] = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const ZIWEI_BRANCHES: EarthlyBranch[] = ["寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑"];
const PALACE_NAMES: PalaceName[] = ["命宫", "兄弟", "夫妻", "子女", "财帛", "疾厄", "迁移", "交友", "官禄", "田宅", "福德", "父母"];
const DISPLAY_BRANCHES: EarthlyBranch[] = ["巳", "午", "未", "申", "辰", "酉", "卯", "戌", "寅", "丑", "子", "亥"];
const FIVE_ELEMENT_JU: Record<string, string> = {
  水: "水二局",
  木: "木三局",
  金: "金四局",
  土: "土五局",
  火: "火六局"
};
const JU_NUMBER: Record<string, number> = {
  水: 2,
  木: 3,
  金: 4,
  土: 5,
  火: 6
};
const PALACE_STEM_START: Record<HeavenlyStem, HeavenlyStem> = {
  甲: "丙",
  己: "丙",
  乙: "戊",
  庚: "戊",
  丙: "庚",
  辛: "庚",
  丁: "壬",
  壬: "壬",
  戊: "甲",
  癸: "甲"
};
const NAYIN_ELEMENT: Record<string, string> = {
  甲子: "金", 乙丑: "金", 丙寅: "火", 丁卯: "火", 戊辰: "木", 己巳: "木", 庚午: "土", 辛未: "土", 壬申: "金", 癸酉: "金",
  甲戌: "火", 乙亥: "火", 丙子: "水", 丁丑: "水", 戊寅: "土", 己卯: "土", 庚辰: "金", 辛巳: "金", 壬午: "木", 癸未: "木",
  甲申: "水", 乙酉: "水", 丙戌: "土", 丁亥: "土", 戊子: "火", 己丑: "火", 庚寅: "木", 辛卯: "木", 壬辰: "水", 癸巳: "水",
  甲午: "金", 乙未: "金", 丙申: "火", 丁酉: "火", 戊戌: "木", 己亥: "木", 庚子: "土", 辛丑: "土", 壬寅: "金", 癸卯: "金",
  甲辰: "火", 乙巳: "火", 丙午: "水", 丁未: "水", 戊申: "土", 己酉: "土", 庚戌: "金", 辛亥: "金", 壬子: "木", 癸丑: "木",
  甲寅: "水", 乙卯: "水", 丙辰: "土", 丁巳: "土", 戊午: "火", 己未: "火", 庚申: "木", 辛酉: "木", 壬戌: "水", 癸亥: "水"
};
const SIHUA_BY_YEAR_STEM: Record<HeavenlyStem, Record<Transformation, string>> = {
  甲: { 禄: "廉贞", 权: "破军", 科: "武曲", 忌: "太阳" },
  乙: { 禄: "天机", 权: "天梁", 科: "紫微", 忌: "太阴" },
  丙: { 禄: "天同", 权: "天机", 科: "文昌", 忌: "廉贞" },
  丁: { 禄: "太阴", 权: "天同", 科: "天机", 忌: "巨门" },
  戊: { 禄: "贪狼", 权: "太阴", 科: "右弼", 忌: "天机" },
  己: { 禄: "武曲", 权: "贪狼", 科: "天梁", 忌: "文曲" },
  庚: { 禄: "太阳", 权: "武曲", 科: "太阴", 忌: "天同" },
  辛: { 禄: "巨门", 权: "太阳", 科: "文曲", 忌: "文昌" },
  壬: { 禄: "天梁", 权: "紫微", 科: "左辅", 忌: "武曲" },
  癸: { 禄: "破军", 权: "巨门", 科: "太阴", 忌: "贪狼" }
};

export function calculateZiweiChart(input: ZiweiCalculationInput): ZiweiChart {
  const birth = parseBirthTime(input.birthTime);
  const solar = Solar.fromYmdHms(birth.year, birth.month, birth.day, birth.hour, birth.minute, 0);
  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();
  const yearStem = eightChar.getYearGan() as HeavenlyStem;
  const yearBranch = eightChar.getYearZhi() as EarthlyBranch;
  const lunarMonth = Math.abs(lunar.getMonth());
  const lunarDay = lunar.getDay();
  const hourBranch = lunar.getTimeZhi() as EarthlyBranch;
  const lifeBranch = getLifeBranch(lunarMonth, hourBranch);
  const bodyBranch = getBodyBranch(lunarMonth, hourBranch);
  const palaceStems = buildPalaceStems(yearStem);
  const lifeStem = palaceStems[lifeBranch];
  const fiveElement = NAYIN_ELEMENT[`${lifeStem}${lifeBranch}`] ?? "金";
  const fiveElementClass = FIVE_ELEMENT_JU[fiveElement] ?? "金四局";
  const juNumber = JU_NUMBER[fiveElement] ?? 4;
  const forward = isForwardLimit(input.gender, isYangYear(yearStem));
  const mainStarsByBranch = buildMainStars(lunarDay, juNumber);
  const palaceNamesByBranch = buildPalaceNames(lifeBranch);
  const sihua = SIHUA_BY_YEAR_STEM[yearStem];
  const basePalaces = DISPLAY_BRANCHES.map((branch, index) => {
    const mainStars = mainStarsByBranch[branch] ?? [];
    const minorStars = getMinorStars(branch, {
      yearStem,
      yearBranch,
      lunarMonth,
      lunarDay,
      hourBranch,
      lifeBranch
    });
    const auxiliaryStars = minorStars.filter((star) => !isMaleficStar(star));
    const maleficStars = minorStars.filter(isMaleficStar);

    return {
      branch,
      stem: palaceStems[branch],
      palaceName: palaceNamesByBranch[branch],
      ageRange: getAgeRange(branch, lifeBranch, juNumber, forward),
      mainStars,
      auxiliaryStars,
      maleficStars,
      minorStars,
      transformations: getTransformations([...mainStars, ...minorStars], sihua),
      sanfangImpact: "",
      changSheng: getChangShengStage(branch, fiveElement, forward),
      isLifePalace: branch === lifeBranch,
      isBodyPalace: branch === bodyBranch
    };
  });
  const palacesByBranch = basePalaces.reduce((map, palace) => {
    map[palace.branch] = palace;
    return map;
  }, {} as Record<EarthlyBranch, typeof basePalaces[number]>);
  const palaces = basePalaces.map((palace) => ({
    ...palace,
    sanfangImpact: buildSanFangImpact(palace, palacesByBranch)
  }));

  return {
    profile: {
      name: input.name?.trim() || "未填写",
      gender: input.gender === "female" ? "女" : "男",
      solarText: formatSolar(birth),
      lunarText: `${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()} ${hourBranch}时`,
      location: input.location || "未知地",
      yinYangGender: `${isYangYear(yearStem) ? "阳" : "阴"}${input.gender === "female" ? "女" : "男"}`,
      fiveElementClass,
      lifeBranch,
      bodyBranch,
      annualBranch: yearBranch,
      smallLimitBranch: getSmallLimitBranch(lifeBranch, birth.year, input.gender),
      ...buildLuckStartInfo(lunar, birth, input.gender, yearStem)
    },
    pillars: {
      year: `${eightChar.getYearGan()}${eightChar.getYearZhi()}`,
      month: `${eightChar.getMonthGan()}${eightChar.getMonthZhi()}`,
      day: `${eightChar.getDayGan()}${eightChar.getDayZhi()}`,
      hour: `${eightChar.getTimeGan()}${eightChar.getTimeZhi()}`
    },
    palaces,
    sihua
  };
}

function buildMainStars(lunarDay: number, juNumber: number) {
  const starsByBranch = createBranchMap<string[]>([]);
  const ziweiBranch = getZiweiBranch(lunarDay, juNumber);
  const ziweiOffsets: Array<[string, number]> = [
    ["紫微", 0],
    ["天机", -1],
    ["太阳", -3],
    ["武曲", -4],
    ["天同", -5],
    ["廉贞", -8]
  ];
  ziweiOffsets.forEach(([star, offset]) => addStar(starsByBranch, moveBranch(ziweiBranch, offset), star));

  const tianfuBranch = ZIWEI_BRANCHES[(12 - ZIWEI_BRANCHES.indexOf(ziweiBranch)) % 12];
  const tianfuOffsets: Array<[string, number]> = [
    ["天府", 0],
    ["太阴", 1],
    ["贪狼", 2],
    ["巨门", 3],
    ["天相", 4],
    ["天梁", 5],
    ["七杀", 6],
    ["破军", 10]
  ];
  tianfuOffsets.forEach(([star, offset]) => addStar(starsByBranch, moveBranch(tianfuBranch, offset), star));

  return starsByBranch;
}

function getZiweiBranch(lunarDay: number, juNumber: number) {
  let added = 0;
  while ((lunarDay + added) % juNumber !== 0) {
    added += 1;
  }

  const quotient = (lunarDay + added) / juNumber;
  const base = ZIWEI_BRANCHES[(quotient - 1) % 12];

  if (added === 0) {
    return base;
  }

  return moveBranch(base, added % 2 === 0 ? added : -added);
}

function buildPalaceNames(lifeBranch: EarthlyBranch) {
  const namesByBranch = createBranchMap<PalaceName>();
  const lifeIndex = ZIWEI_BRANCHES.indexOf(lifeBranch);

  PALACE_NAMES.forEach((name, index) => {
    namesByBranch[ZIWEI_BRANCHES[(lifeIndex - index + 12 * 2) % 12]] = name;
  });

  return namesByBranch;
}

function buildPalaceStems(yearStem: HeavenlyStem) {
  const stemsByBranch = createBranchMap<HeavenlyStem>();
  const startStem = PALACE_STEM_START[yearStem];
  const startIndex = STEMS.indexOf(startStem);

  ZIWEI_BRANCHES.forEach((branch, index) => {
    stemsByBranch[branch] = STEMS[(startIndex + index) % 10];
  });

  return stemsByBranch;
}

function getLifeBranch(lunarMonth: number, hourBranch: EarthlyBranch) {
  const monthSeat = (lunarMonth - 1) % 12;
  const hourIndex = BRANCHES.indexOf(hourBranch);
  return ZIWEI_BRANCHES[(monthSeat - hourIndex + 12 * 2) % 12];
}

function getBodyBranch(lunarMonth: number, hourBranch: EarthlyBranch) {
  const monthSeat = (lunarMonth - 1) % 12;
  const hourIndex = BRANCHES.indexOf(hourBranch);
  return ZIWEI_BRANCHES[(monthSeat + hourIndex) % 12];
}

function getMinorStars(
  branch: EarthlyBranch,
  context: {
    yearStem: HeavenlyStem;
    yearBranch: EarthlyBranch;
    lunarMonth: number;
    lunarDay: number;
    hourBranch: EarthlyBranch;
    lifeBranch: EarthlyBranch;
  }
) {
  const minorStars: string[] = [];
  const auxiliaryStars: Array<[string, EarthlyBranch]> = [
    ["左辅", moveBranch("辰", context.lunarMonth - 1)],
    ["右弼", moveBranchByZodiac("戌", -(context.lunarMonth - 1))],
    ["文昌", moveBranchByZodiac("戌", -BRANCHES.indexOf(context.hourBranch))],
    ["文曲", moveBranchByZodiac("辰", BRANCHES.indexOf(context.hourBranch))],
    ["天魁", getTianKuiBranch(context.yearStem)],
    ["天钺", getTianYueBranch(context.yearStem)],
    ["禄存", getLuCunBranch(context.yearStem)],
    ["天马", getTianMaBranch(context.yearBranch)],
    ["擎羊", moveBranchByZodiac(getLuCunBranch(context.yearStem), 1)],
    ["陀罗", moveBranchByZodiac(getLuCunBranch(context.yearStem), -1)],
    ["地空", getDiKongBranch(context.hourBranch)],
    ["地劫", getDiJieBranch(context.hourBranch)],
    ["天姚", getTianYaoBranch(context.lunarMonth)],
    ["恩光", getEnGuangBranch(context.lunarDay, context.hourBranch)],
    ["天刑", getTianXingBranch(context.lunarMonth)],
    ["华盖", getHuaGaiBranch(context.yearBranch)],
    ["天寿", context.lifeBranch],
    ["红鸾", getHongLuanBranch(context.yearBranch)],
    ["天喜", getTianXiBranch(context.yearBranch)],
    ["孤辰", getGuChenBranch(context.yearBranch)],
    ["天空", getTianKongBranch(context.yearBranch)],
    ["劫煞", getJieShaBranch(context.yearBranch)],
    ["月德", getYueDeBranch(context.yearStem)],
    ["咸池", getXianChiBranch(context.yearBranch)],
    ["天贵", getTianGuiBranch(context.yearStem)],
    ["天伤", getTianShangBranch(context.lifeBranch)]
  ];

  auxiliaryStars.forEach(([star, starBranch]) => {
    if (starBranch === branch) {
      minorStars.push(star);
    }
  });

  if (getChangShengBranch(context.yearBranch) === branch) {
    minorStars.push("长生");
  }

  return minorStars;
}

function buildSanFangImpact(palace: ZiweiPalace, palacesByBranch: Record<EarthlyBranch, ZiweiPalace>) {
  const opposite = palacesByBranch[moveBranchByZodiac(palace.branch, 6)];
  const trineOne = palacesByBranch[moveBranchByZodiac(palace.branch, 4)];
  const trineTwo = palacesByBranch[moveBranchByZodiac(palace.branch, 8)];
  const trineStars = summarizeStars([...trineOne.mainStars, ...trineTwo.mainStars]);
  const oppositeStars = summarizeStars(opposite.mainStars);
  const transformations = [...palace.transformations, ...trineOne.transformations, ...trineTwo.transformations, ...opposite.transformations];
  const malefics = [...palace.maleficStars, ...trineOne.maleficStars, ...trineTwo.maleficStars, ...opposite.maleficStars];
  const notes = [
    trineStars ? `三方${trineStars}` : "",
    oppositeStars ? `正照${oppositeStars}` : "",
    transformations.length ? `四化${Array.from(new Set(transformations)).join("")}` : "",
    malefics.length ? `煞${Array.from(new Set(malefics)).join("")}` : ""
  ].filter(Boolean);

  return notes.join(" · ") || "三方平稳";
}

function summarizeStars(stars: string[]) {
  if (stars.length === 0) {
    return "";
  }

  return stars.slice(0, 4).join("");
}

function isMaleficStar(star: string) {
  return ["擎羊", "陀罗", "火星", "铃星", "地空", "地劫", "孤辰", "天空", "劫煞", "天伤"].includes(star);
}

function getTianKuiBranch(yearStem: HeavenlyStem) {
  const branches: Record<HeavenlyStem, EarthlyBranch> = {
    甲: "丑",
    戊: "丑",
    庚: "丑",
    乙: "子",
    己: "子",
    丙: "亥",
    丁: "亥",
    壬: "卯",
    癸: "卯",
    辛: "午"
  };

  return branches[yearStem];
}

function getTianYueBranch(yearStem: HeavenlyStem) {
  const branches: Record<HeavenlyStem, EarthlyBranch> = {
    甲: "未",
    戊: "未",
    庚: "未",
    乙: "申",
    己: "申",
    丙: "酉",
    丁: "酉",
    壬: "巳",
    癸: "巳",
    辛: "寅"
  };

  return branches[yearStem];
}

function getLuCunBranch(yearStem: HeavenlyStem) {
  const branches: Record<HeavenlyStem, EarthlyBranch> = {
    甲: "寅",
    乙: "卯",
    丙: "巳",
    丁: "午",
    戊: "巳",
    己: "午",
    庚: "申",
    辛: "酉",
    壬: "亥",
    癸: "子"
  };

  return branches[yearStem];
}

function getTianMaBranch(yearBranch: EarthlyBranch) {
  if (["申", "子", "辰"].includes(yearBranch)) return "寅";
  if (["寅", "午", "戌"].includes(yearBranch)) return "申";
  if (["巳", "酉", "丑"].includes(yearBranch)) return "亥";
  return "巳";
}

function getDiKongBranch(hourBranch: EarthlyBranch) {
  return moveBranchByZodiac("亥", -BRANCHES.indexOf(hourBranch));
}

function getDiJieBranch(hourBranch: EarthlyBranch) {
  return moveBranchByZodiac("亥", BRANCHES.indexOf(hourBranch));
}

function getTianYaoBranch(lunarMonth: number) {
  return moveBranchByZodiac("丑", lunarMonth - 1);
}

function getEnGuangBranch(lunarDay: number, hourBranch: EarthlyBranch) {
  const wenChangBranch = moveBranchByZodiac("戌", -BRANCHES.indexOf(hourBranch));

  return moveBranchByZodiac(wenChangBranch, lunarDay - 2);
}

function getTianXingBranch(lunarMonth: number) {
  return moveBranchByZodiac("酉", lunarMonth - 1);
}

function getHuaGaiBranch(yearBranch: EarthlyBranch) {
  if (["申", "子", "辰"].includes(yearBranch)) return "辰";
  if (["寅", "午", "戌"].includes(yearBranch)) return "戌";
  if (["巳", "酉", "丑"].includes(yearBranch)) return "丑";
  return "未";
}

function getTianXiBranch(yearBranch: EarthlyBranch) {
  return moveBranchByZodiac(getHongLuanBranch(yearBranch), 6);
}

function getHongLuanBranch(yearBranch: EarthlyBranch) {
  const branches: Record<EarthlyBranch, EarthlyBranch> = {
    子: "卯",
    丑: "寅",
    寅: "丑",
    卯: "子",
    辰: "亥",
    巳: "戌",
    午: "酉",
    未: "申",
    申: "未",
    酉: "午",
    戌: "巳",
    亥: "辰"
  };

  return branches[yearBranch];
}

function getGuChenBranch(yearBranch: EarthlyBranch) {
  if (["亥", "子", "丑"].includes(yearBranch)) return "寅";
  if (["寅", "卯", "辰"].includes(yearBranch)) return "巳";
  if (["巳", "午", "未"].includes(yearBranch)) return "申";
  return "亥";
}

function getTianKongBranch(yearBranch: EarthlyBranch) {
  return moveBranchByZodiac(yearBranch, 2);
}

function getJieShaBranch(yearBranch: EarthlyBranch) {
  if (["申", "子", "辰"].includes(yearBranch)) return "巳";
  if (["寅", "午", "戌"].includes(yearBranch)) return "亥";
  if (["巳", "酉", "丑"].includes(yearBranch)) return "寅";
  return "申";
}

function getYueDeBranch(yearStem: HeavenlyStem) {
  const branches: Record<HeavenlyStem, EarthlyBranch> = {
    甲: "巳",
    乙: "午",
    丙: "未",
    丁: "申",
    戊: "酉",
    己: "戌",
    庚: "亥",
    辛: "子",
    壬: "丑",
    癸: "寅"
  };

  return branches[yearStem];
}

function getXianChiBranch(yearBranch: EarthlyBranch) {
  if (["申", "子", "辰"].includes(yearBranch)) return "酉";
  if (["寅", "午", "戌"].includes(yearBranch)) return "卯";
  if (["巳", "酉", "丑"].includes(yearBranch)) return "午";
  return "子";
}

function getTianGuiBranch(yearStem: HeavenlyStem) {
  const branches: Record<HeavenlyStem, EarthlyBranch> = {
    甲: "未",
    乙: "申",
    丙: "酉",
    丁: "亥",
    戊: "酉",
    己: "亥",
    庚: "丑",
    辛: "寅",
    壬: "卯",
    癸: "巳"
  };

  return branches[yearStem];
}

function getTianShangBranch(lifeBranch: EarthlyBranch) {
  return moveBranchByZodiac(lifeBranch, 6);
}

function getChangShengBranch(yearBranch: EarthlyBranch) {
  const groups: Record<string, EarthlyBranch> = {
    申子辰: "申",
    寅午戌: "寅",
    巳酉丑: "巳",
    亥卯未: "亥"
  };
  const group = Object.keys(groups).find((item) => item.includes(yearBranch));
  return group ? groups[group] : "申";
}

function getChangShengStage(branch: EarthlyBranch, fiveElement: string, forward: boolean) {
  const stages = ["长生", "沐浴", "冠带", "临官", "帝旺", "衰", "病", "死", "墓", "绝", "胎", "养"];
  const starts: Record<string, EarthlyBranch> = {
    水: "申",
    木: "亥",
    金: "巳",
    土: "申",
    火: "寅"
  };
  const start = starts[fiveElement] ?? "申";
  const startIndex = BRANCHES.indexOf(start);
  const branchIndex = BRANCHES.indexOf(branch);
  const offset = forward ? branchIndex - startIndex : startIndex - branchIndex;

  return stages[(offset + 12) % 12];
}

function getTransformations(stars: string[], sihua: Record<Transformation, string>) {
  return (Object.keys(sihua) as Transformation[]).filter((key) => stars.includes(sihua[key]));
}

function isForwardLimit(gender: ZiweiGender, yangYear: boolean) {
  return (yangYear && gender === "male") || (!yangYear && gender === "female");
}

function getAgeRange(branch: EarthlyBranch, lifeBranch: EarthlyBranch, juNumber: number, forward: boolean) {
  const lifeIndex = ZIWEI_BRANCHES.indexOf(lifeBranch);
  const branchIndex = ZIWEI_BRANCHES.indexOf(branch);
  const offset = forward ? branchIndex - lifeIndex : lifeIndex - branchIndex;
  const start = juNumber + ((offset + 12) % 12) * 10;

  return `${start}-${start + 9}`;
}

function getSmallLimitBranch(lifeBranch: EarthlyBranch, solarYear: number, gender: ZiweiGender) {
  const age = Math.max(1, new Date().getFullYear() - solarYear + 1);
  const offset = (age - 1) % 12;

  return moveBranchByZodiac(lifeBranch, gender === "male" ? offset : -offset);
}

function buildLuckStartInfo(
  lunar: ReturnType<Solar["getLunar"]>,
  birth: ReturnType<typeof parseBirthTime>,
  gender: ZiweiGender,
  yearStem: HeavenlyStem
) {
  const forward = isForwardLimit(gender, isYangYear(yearStem));
  const targetJie = forward ? lunar.getNextJie() : lunar.getPrevJie();
  const birthSolar = Solar.fromYmdHms(birth.year, birth.month, birth.day, birth.hour, birth.minute, 0);
  const targetSolar = targetJie.getSolar();
  const diffDays = Math.abs(targetSolar.subtractMinute(birthSolar) / 1440);
  const startMonths = Math.max(1, Math.round(diffDays * 4));
  const startYears = Math.floor(startMonths / 12);
  const months = startMonths % 12;
  const startDate = addMonthsToBirth(birth, startMonths);
  const luckStemBranch = moveStemBranch(`${yearStem}${lunar.getYearZhi()}`, forward ? 1 : -1);
  const majorLimits = Array.from({ length: 9 }, (_, index) => moveStemBranch(luckStemBranch, forward ? index : -index));
  const startYear = startDate.getFullYear();
  const displayStartAge = startYear - birth.year + 1;

  return {
    luckStartText: `${formatDate(startDate)}起运`,
    luckStemBranch,
    luckAgeText: `${startYears}岁${months}个月`,
    luckStartYear: `${startYear}年`,
    majorLimits,
    majorLimitItems: majorLimits.map((stemBranch, index) => ({
      stemBranch,
      ageText: `${displayStartAge + index * 10}岁`,
      startYear: `${startYear + index * 10}`
    }))
  };
}

function addMonthsToBirth(birth: ReturnType<typeof parseBirthTime>, months: number) {
  const date = new Date(birth.year, birth.month - 1, birth.day, birth.hour, birth.minute);
  date.setMonth(date.getMonth() + months);

  return date;
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function moveStemBranch(stemBranch: string, offset: number) {
  const stem = stemBranch[0] as HeavenlyStem;
  const branch = stemBranch[1] as EarthlyBranch;
  const stemIndex = STEMS.indexOf(stem);
  const branchIndex = BRANCHES.indexOf(branch);

  return `${STEMS[(stemIndex + offset + 100) % 10]}${BRANCHES[(branchIndex + offset + 120) % 12]}`;
}

function moveBranch(branch: EarthlyBranch, offset: number) {
  const index = ZIWEI_BRANCHES.indexOf(branch);
  return ZIWEI_BRANCHES[(index + offset + 120) % 12];
}

function moveBranchByZodiac(branch: EarthlyBranch, offset: number) {
  const index = BRANCHES.indexOf(branch);
  return BRANCHES[(index + offset + 120) % 12];
}

function addStar(map: Record<EarthlyBranch, string[]>, branch: EarthlyBranch, star: string) {
  map[branch].push(star);
}

function createBranchMap<T>(initial?: T): Record<EarthlyBranch, T> {
  return BRANCHES.reduce((map, branch) => {
    map[branch] = Array.isArray(initial) ? ([...initial] as T) : initial as T;
    return map;
  }, {} as Record<EarthlyBranch, T>);
}

function isYangYear(stem: HeavenlyStem) {
  return ["甲", "丙", "戊", "庚", "壬"].includes(stem);
}

function parseBirthTime(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) {
    return { year: 1980, month: 9, day: 7, hour: 7, minute: 40 };
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5])
  };
}

function formatSolar(value: ReturnType<typeof parseBirthTime>) {
  return `${value.year}年${pad(value.month)}月${pad(value.day)}日 ${pad(value.hour)}:${pad(value.minute)}`;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}
