import type { DemoBaziChart } from "@/lib/bazi/demo";
import { calculateBazi, toBaziText, type BaziInput, type BaziOutput } from "taibu-core/bazi";
import { calculateBaziDayun, type DayunOutput } from "taibu-core/bazi-dayun";
import { Solar } from "lunar-typescript";

export interface BaziCalculationRequest {
  name?: string;
  gender: "male" | "female";
  birthTime: string;
  location?: string;
  calendar: "solar" | "lunar" | "pillars";
  useSolarTime?: boolean;
  longitude?: number | null;
  latitude?: number | null;
}

type ParsedBirthTime = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

const STEM_ELEMENTS: Record<string, string> = {
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

export function calculateBaziChart(input: BaziCalculationRequest): DemoBaziChart {
  if (input.calendar === "pillars") {
    throw new Error("四柱反查暂未接入当前八字页面，请改用公历或农历出生时间排盘");
  }

  const birth = parseBirthTime(input.birthTime);
  const coreInput: BaziInput = {
    gender: input.gender,
    birthYear: birth.year,
    birthMonth: birth.month,
    birthDay: birth.day,
    birthHour: birth.hour,
    birthMinute: birth.minute,
    calendarType: input.calendar === "lunar" ? "lunar" : "solar",
    birthPlace: input.location || undefined,
    longitude: input.useSolarTime && typeof input.longitude === "number" ? input.longitude : undefined
  };
  const output = calculateBazi(coreInput);
  const dayun = calculateBaziDayun(coreInput);
  const canonicalText = toBaziText(output, {
    name: input.name?.trim() || undefined,
    dayun,
    detailLevel: "full"
  });

  return toDemoBaziChart(input, birth, output, dayun, canonicalText);
}

export async function calculateBaziChartOnBackend(input: BaziCalculationRequest): Promise<DemoBaziChart> {
  return calculateBaziChart(input);
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

function toDemoBaziChart(
  input: BaziCalculationRequest,
  birth: ParsedBirthTime,
  output: BaziOutput,
  dayun: DayunOutput,
  canonicalText: string
): DemoBaziChart {
  const solar = Solar.fromYmdHms(birth.year, birth.month, birth.day, birth.hour, birth.minute, 0);
  const lunar = solar.getLunar();
  const pillars = [
    ["年柱", output.fourPillars.year],
    ["月柱", output.fourPillars.month],
    ["日柱", output.fourPillars.day],
    ["时柱", output.fourPillars.hour]
  ] as const;
  const nowYear = new Date().getFullYear();

  return {
    profile: {
      name: input.name?.trim() || "未命名",
      gender: input.gender === "female" ? "女" : "男",
      zodiac: safeCall(() => lunar.getYearShengXiao(), ""),
      lunar: `${safeCall(() => lunar.getYearInChinese(), "")}年${safeCall(() => lunar.getMonthInChinese(), "")}月${safeCall(() => lunar.getDayInChinese(), "")} ${output.fourPillars.hour.branch}时`,
      solar: formatBirthTime(birth),
      solarTime: output.trueSolarTimeInfo ? `${formatBirthDate(birth)} ${output.trueSolarTimeInfo.trueSolarTime}` : formatBirthTime(birth),
      location: input.location || "未知地",
      commander: `月令${output.fourPillars.month.branch}`,
      luckStartText: `出生后${dayun.startAgeDetail}起运`,
      luckTransferText: `${dayun.list[0]?.startYear ?? ""}年交大运`,
      currentAgeText: `${Math.max(1, nowYear - birth.year + 1)}岁`,
      birthSolarTerm: "以 core 节气四柱为准",
      solarTerms: [],
      constellation: safeCall(() => `${solar.getXingZuo()}座`, ""),
      lunarMansion: "",
      fetusOrigin: output.taiYuan || "",
      voidBranch: output.kongWang.kongZhi.join(""),
      lifePalace: output.mingGong || "",
      bodyPalace: ""
    },
    columns: pillars.map(([title, pillar]) => ({
      title,
      mainStar: title === "日柱" ? `元${input.gender === "female" ? "女" : "男"}` : pillar.tenGod || "",
      pillar: {
        stem: pillar.stem as DemoBaziChart["columns"][number]["pillar"]["stem"],
        branch: pillar.branch as DemoBaziChart["columns"][number]["pillar"]["branch"]
      },
      hiddenStems: pillar.hiddenStems.map((item) => `${item.stem}${STEM_ELEMENTS[item.stem] || ""}`),
      subStars: pillar.hiddenStems.map((item) => item.tenGod || ""),
      phase: pillar.diShi || "",
      selfSeat: pillar.diShi || "",
      voidBranch: pillar.kongWang.isKong ? output.kongWang.kongZhi.join("") : "",
      nayin: pillar.naYin || "",
      shensha: pillar.shenSha || []
    })),
    luckCycles: dayun.list.map((item, index, list) => ({
      year: String(item.startYear),
      age: formatLuckAge(item, list[index + 1]),
      stem: item.stem,
      branch: item.branch,
      tags: item.shenSha.slice(0, 2),
      active: nowYear >= item.startYear && nowYear < (list[index + 1]?.startYear ?? item.startYear + 10)
    })),
    years: buildYears(nowYear),
    canonicalText
  };
}

function formatBirthDate(birth: ParsedBirthTime) {
  return `${birth.year}-${String(birth.month).padStart(2, "0")}-${String(birth.day).padStart(2, "0")}`;
}

function formatBirthTime(birth: ParsedBirthTime) {
  return `${formatBirthDate(birth)} ${String(birth.hour).padStart(2, "0")}:${String(birth.minute).padStart(2, "0")}`;
}

function formatLuckAge(item: DayunOutput["list"][number], next?: DayunOutput["list"][number]) {
  return next ? `${item.startAge}-${Math.max(item.startAge, next.startAge - 1)}岁` : `${item.startAge}岁后`;
}

function buildYears(nowYear: number) {
  return Array.from({ length: 10 }, (_, index) => {
    const year = nowYear + index;
    return {
      year: String(year),
      age: "",
      stem: "",
      branch: "",
      tags: [],
      active: index === 0
    };
  });
}

function safeCall(callback: () => string, fallback: string) {
  try {
    return callback() || fallback;
  } catch {
    return fallback;
  }
}
