export type HeavenlyStem = "甲" | "乙" | "丙" | "丁" | "戊" | "己" | "庚" | "辛" | "壬" | "癸";
export type EarthlyBranch = "子" | "丑" | "寅" | "卯" | "辰" | "巳" | "午" | "未" | "申" | "酉" | "戌" | "亥";

export interface Pillar {
  stem: HeavenlyStem;
  branch: EarthlyBranch;
}

export function getHourBranch(hour: number): EarthlyBranch {
  if (hour < 0 || hour > 23) {
    throw new Error("hour must be between 0 and 23");
  }

  const branches: EarthlyBranch[] = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  const index = Math.floor(((hour + 1) % 24) / 2);
  return branches[index];
}
