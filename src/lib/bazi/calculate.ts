import { Solar } from "lunar-typescript";
import { getSelfSeatStage } from "./changsheng";
import { getCommanderText } from "./commander";
import { calculateShenshaForPillar, type ShenshaContext } from "./shensha";
import type { DemoBaziChart, DemoProfile, ChartColumn, LuckColumn } from "./demo";
import type { EarthlyBranch, HeavenlyStem } from "./index";

export interface BaziCalculationInput {
  name?: string;
  gender: "male" | "female";
  birthTime: string;
  location?: string;
  calendar: "solar" | "lunar" | "pillars";
}

type PillarKey = "Year" | "Month" | "Day" | "Time";

const PILLAR_TITLES: Record<PillarKey, string> = {
  Year: "年柱",
  Month: "月柱",
  Day: "日柱",
  Time: "时柱"
};

interface SolarLike {
  getYear(): number;
  getMonth(): number;
  getDay(): number;
  getHour(): number;
  getMinute(): number;
}

export function calculateBaziChart(input: BaziCalculationInput): DemoBaziChart {
  const birth = parseInputBirthTime(input.birthTime);
  const solar = Solar.fromYmdHms(birth.year, birth.month, birth.day, birth.hour, birth.minute, 0);
  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();
  const genderText = input.gender === "female" ? "女" : "男";
  const yun = eightChar.getYun(input.gender === "female" ? 0 : 1);
  const daYun = yun.getDaYun().slice(0, 10);

  return {
    profile: buildProfile(input, genderText, solar, lunar, eightChar, yun),
    columns: buildChartColumns(eightChar, genderText),
    luckCycles: daYun.map((item) => ({
      year: String(item.getStartYear()),
      age: formatAgeRange(item.getStartAge(), item.getEndAge()),
      stem: item.getIndex() === 0 ? "小" : item.getGanZhi().slice(0, 1),
      branch: item.getIndex() === 0 ? "运" : item.getGanZhi().slice(1, 2),
      tags: [],
      active: isYearInRange(new Date().getFullYear(), item.getStartYear(), item.getEndYear())
    })),
    years: buildYears()
  };
}

function buildProfile(
  input: BaziCalculationInput,
  genderText: "男" | "女",
  solar: ReturnType<typeof Solar.fromYmdHms>,
  lunar: ReturnType<ReturnType<typeof Solar.fromYmdHms>["getLunar"]>,
  eightChar: ReturnType<ReturnType<ReturnType<typeof Solar.fromYmdHms>["getLunar"]>["getEightChar"]>,
  yun: ReturnType<ReturnType<ReturnType<ReturnType<typeof Solar.fromYmdHms>["getLunar"]>["getEightChar"]>["getYun"]>
): DemoProfile {
  const prevJie = lunar.getPrevJie();
  const nextJie = lunar.getNextJie();
  const prevJieSolar = prevJie.getSolar();
  const nextJieSolar = nextJie.getSolar();
  const minutesAfterJie = solar.subtractMinute(prevJieSolar);
  const monthBranch = eightChar.getMonthZhi() as EarthlyBranch;

  return {
    name: input.name?.trim() || "未命名",
    gender: genderText,
    zodiac: lunar.getYearShengXiao(),
    lunar: `${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()} ${lunar.getTimeZhi()}时`,
    solar: formatSolar(solar),
    solarTime: formatSolar(solar),
    location: input.location || "未知地",
    commander: getCommanderText(monthBranch, minutesAfterJie),
    birthSolarTerm: formatBirthSolarTerm(solar, prevJie.getName(), prevJieSolar, nextJie.getName(), nextJieSolar),
    solarTerms: [
      { label: prevJie.getName(), value: formatSolar(prevJieSolar) },
      { label: nextJie.getName(), value: formatSolar(nextJieSolar) }
    ],
    constellation: `${solar.getXingZuo()}座`,
    lunarMansion: formatLunarMansion(lunar),
    fetusOrigin: `${eightChar.getTaiYuan()} (${eightChar.getTaiYuanNaYin()})`,
    voidBranch: eightChar.getDayXunKong(),
    lifePalace: `${eightChar.getMingGong()} (${eightChar.getMingGongNaYin()})`,
    bodyPalace: `${eightChar.getShenGong()} (${eightChar.getShenGongNaYin()})`
  };
}

function formatLunarMansion(lunar: ReturnType<ReturnType<typeof Solar.fromYmdHms>["getLunar"]>) {
  const palaces: Record<string, string> = {
    东: "东方青龙",
    南: "南方朱雀",
    西: "西方白虎",
    北: "北方玄武"
  };

  return `${lunar.getXiu()}宿 ${palaces[lunar.getGong()] ?? lunar.getGong()}`;
}

function formatBirthSolarTerm(
  solar: ReturnType<typeof Solar.fromYmdHms>,
  prevName: string,
  prevSolar: ReturnType<typeof Solar.fromYmdHms>,
  nextName: string,
  nextSolar: ReturnType<typeof Solar.fromYmdHms>
) {
  const after = formatDuration(solar.subtractMinute(prevSolar));
  const before = formatDuration(nextSolar.subtractMinute(solar));

  return `出生于${prevName}后${after}，${nextName}前${before}`;
}

function formatDuration(totalMinutes: number) {
  const minutes = Math.max(0, totalMinutes);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);

  return `${days}天${hours}小时`;
}

function buildChartColumns(eightChar: ReturnType<ReturnType<ReturnType<typeof Solar.fromYmdHms>["getLunar"]>["getEightChar"]>, gender: "男" | "女") {
  const context: ShenshaContext = {
    year: buildPillar("Year", eightChar),
    month: buildPillar("Month", eightChar),
    day: buildPillar("Day", eightChar),
    time: buildPillar("Time", eightChar)
  };

  return (["Year", "Month", "Day", "Time"] as PillarKey[]).map((key) => buildChartColumn(key, eightChar, gender, context));
}

function buildChartColumn(
  key: PillarKey,
  eightChar: ReturnType<ReturnType<ReturnType<typeof Solar.fromYmdHms>["getLunar"]>["getEightChar"]>,
  gender: "男" | "女",
  context: ShenshaContext
): ChartColumn {
  const gan = getGan(key, eightChar);
  const zhi = getZhi(key, eightChar);
  const isDay = key === "Day";
  const pillar = { stem: gan as HeavenlyStem, branch: zhi as EarthlyBranch };

  return {
    title: PILLAR_TITLES[key],
    mainStar: isDay ? `元${gender}` : getShiShenGan(key, eightChar),
    pillar,
    hiddenStems: getHideGan(key, eightChar).map(withElement),
    subStars: getShiShenZhi(key, eightChar),
    phase: getDiShi(key, eightChar),
    selfSeat: getSelfSeatStage(gan as HeavenlyStem, zhi as EarthlyBranch),
    voidBranch: getXunKong(key, eightChar),
    nayin: getNaYin(key, eightChar),
    shensha: calculateShenshaForPillar(pillar, context)
  };
}

function buildPillar(key: PillarKey, eightChar: ReturnType<ReturnType<ReturnType<typeof Solar.fromYmdHms>["getLunar"]>["getEightChar"]>) {
  return {
    stem: getGan(key, eightChar) as HeavenlyStem,
    branch: getZhi(key, eightChar) as EarthlyBranch
  };
}

function getGan(key: PillarKey, eightChar: ReturnType<ReturnType<ReturnType<typeof Solar.fromYmdHms>["getLunar"]>["getEightChar"]>) {
  if (key === "Year") return eightChar.getYearGan();
  if (key === "Month") return eightChar.getMonthGan();
  if (key === "Day") return eightChar.getDayGan();
  return eightChar.getTimeGan();
}

function getZhi(key: PillarKey, eightChar: ReturnType<ReturnType<ReturnType<typeof Solar.fromYmdHms>["getLunar"]>["getEightChar"]>) {
  if (key === "Year") return eightChar.getYearZhi();
  if (key === "Month") return eightChar.getMonthZhi();
  if (key === "Day") return eightChar.getDayZhi();
  return eightChar.getTimeZhi();
}

function getHideGan(key: PillarKey, eightChar: ReturnType<ReturnType<ReturnType<typeof Solar.fromYmdHms>["getLunar"]>["getEightChar"]>) {
  if (key === "Year") return eightChar.getYearHideGan();
  if (key === "Month") return eightChar.getMonthHideGan();
  if (key === "Day") return eightChar.getDayHideGan();
  return eightChar.getTimeHideGan();
}

function getShiShenGan(key: PillarKey, eightChar: ReturnType<ReturnType<ReturnType<typeof Solar.fromYmdHms>["getLunar"]>["getEightChar"]>) {
  if (key === "Year") return eightChar.getYearShiShenGan();
  if (key === "Month") return eightChar.getMonthShiShenGan();
  if (key === "Day") return eightChar.getDayShiShenGan();
  return eightChar.getTimeShiShenGan();
}

function getShiShenZhi(key: PillarKey, eightChar: ReturnType<ReturnType<ReturnType<typeof Solar.fromYmdHms>["getLunar"]>["getEightChar"]>) {
  if (key === "Year") return eightChar.getYearShiShenZhi();
  if (key === "Month") return eightChar.getMonthShiShenZhi();
  if (key === "Day") return eightChar.getDayShiShenZhi();
  return eightChar.getTimeShiShenZhi();
}

function getDiShi(key: PillarKey, eightChar: ReturnType<ReturnType<ReturnType<typeof Solar.fromYmdHms>["getLunar"]>["getEightChar"]>) {
  if (key === "Year") return eightChar.getYearDiShi();
  if (key === "Month") return eightChar.getMonthDiShi();
  if (key === "Day") return eightChar.getDayDiShi();
  return eightChar.getTimeDiShi();
}

function getXunKong(key: PillarKey, eightChar: ReturnType<ReturnType<ReturnType<typeof Solar.fromYmdHms>["getLunar"]>["getEightChar"]>) {
  if (key === "Year") return eightChar.getYearXunKong();
  if (key === "Month") return eightChar.getMonthXunKong();
  if (key === "Day") return eightChar.getDayXunKong();
  return eightChar.getTimeXunKong();
}

function getNaYin(key: PillarKey, eightChar: ReturnType<ReturnType<ReturnType<typeof Solar.fromYmdHms>["getLunar"]>["getEightChar"]>) {
  if (key === "Year") return eightChar.getYearNaYin();
  if (key === "Month") return eightChar.getMonthNaYin();
  if (key === "Day") return eightChar.getDayNaYin();
  return eightChar.getTimeNaYin();
}

function withElement(stem: string) {
  const elements: Record<string, string> = {
    甲: "木",
    乙: "木",
    丙: "火",
    丁: "火",
    戊: "土",
    己: "土",
    庚: "金",
    辛: "金",
    壬: "水",
    癸: "水"
  };

  return `${stem}${elements[stem] ?? ""}`;
}

function buildYears(): LuckColumn[] {
  const currentYear = new Date().getFullYear();

  return Array.from({ length: 10 }, (_, index) => {
    const year = currentYear + index;
    const lunar = Solar.fromYmd(year, 6, 1).getLunar();
    const ganZhi = lunar.getYearInGanZhiByLiChun();

    return {
      year: String(year),
      age: "",
      stem: ganZhi.slice(0, 1),
      branch: ganZhi.slice(1, 2),
      tags: [],
      active: index === 0
    };
  });
}

function parseInputBirthTime(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) {
    throw new Error("Invalid birthTime format. Expected yyyy-MM-ddTHH:mm");
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5])
  };
}

function formatSolar(solar: SolarLike) {
  return `${solar.getYear()}-${pad2(solar.getMonth())}-${pad2(solar.getDay())} ${pad2(solar.getHour())}:${pad2(solar.getMinute())}`;
}

function formatAgeRange(startAge: number, endAge: number) {
  return startAge === endAge ? `${startAge}岁` : `${startAge}~${endAge}岁`;
}

function isYearInRange(year: number, start: number, end: number) {
  return year >= start && year <= end;
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}
