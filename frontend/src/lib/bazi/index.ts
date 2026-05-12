export type HeavenlyStem = "甲" | "乙" | "丙" | "丁" | "戊" | "己" | "庚" | "辛" | "壬" | "癸";
export type EarthlyBranch = "子" | "丑" | "寅" | "卯" | "辰" | "巳" | "午" | "未" | "申" | "酉" | "戌" | "亥";

export interface Pillar {
  stem: HeavenlyStem;
  branch: EarthlyBranch;
}

export interface BasicChart {
  lunarText: string;
  solarText: string;
  currentHour: string;
  pillars: Pillar[];
}

const demoPillars: Pillar[] = [
  { stem: "丙", branch: "午" },
  { stem: "壬", branch: "辰" },
  { stem: "甲", branch: "戌" },
  { stem: "己", branch: "巳" }
];

export function getCurrentDemoChart(now: Date): BasicChart {
  const hourBranch = getHourBranch(now.getHours());
  return {
    lunarText: "2026年三月十四 巳时",
    solarText: "2026年04月30日 10:41",
    currentHour: `${hourBranch}时 10:41`,
    pillars: demoPillars
  };
}

export function getHourBranch(hour: number): EarthlyBranch {
  if (hour < 0 || hour > 23) {
    throw new Error("hour must be between 0 and 23");
  }

  const branches: EarthlyBranch[] = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  const index = Math.floor(((hour + 1) % 24) / 2);
  return branches[index];
}

// TODO: Replace demo chart data with verified calendar, solar-time, and Ganzhi calculation rules.
