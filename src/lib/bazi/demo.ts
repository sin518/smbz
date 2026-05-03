import type { EarthlyBranch, HeavenlyStem, Pillar } from "./index";

export interface DemoProfile {
  name: string;
  gender: "男" | "女";
  zodiac: string;
  lunar: string;
  solar: string;
  solarTime: string;
  location: string;
  commander: string;
  birthSolarTerm: string;
  solarTerms: Array<{ label: string; value: string }>;
  constellation: string;
  lunarMansion: string;
  fetusOrigin: string;
  voidBranch: string;
  lifePalace: string;
  bodyPalace: string;
}

export interface ChartColumn {
  title: string;
  mainStar: string;
  pillar: Pillar;
  hiddenStems: string[];
  subStars: string[];
  phase: string;
  selfSeat: string;
  voidBranch: string;
  nayin: string;
  shensha: string[];
}

export interface LuckColumn {
  year: string;
  age: string;
  stem: HeavenlyStem | string;
  branch: EarthlyBranch | string;
  tags: string[];
  active?: boolean;
}

export interface DemoBaziChart {
  profile: DemoProfile;
  columns: ChartColumn[];
  luckCycles: LuckColumn[];
  years: LuckColumn[];
}

export const demoBaziChart: DemoBaziChart = {
  profile: {
    name: "邓",
    gender: "男",
    zodiac: "兔",
    lunar: "1987年四月廿四 子时",
    solar: "1987-05-21 01:00",
    solarTime: "1987-05-21 00:35",
    location: "广东省 佛山市 南海区",
    commander: "庚金用事",
    birthSolarTerm: "出生于立夏后14天15小时，芒种前16天12小时",
    solarTerms: [
      { label: "立夏", value: "1987-05-06 09:05:35" },
      { label: "芒种", value: "1987-06-06 13:18:58" }
    ],
    constellation: "双子座 (Gemini)",
    lunarMansion: "角宿 东方苍龙",
    fetusOrigin: "丙申 (山下火)",
    voidBranch: "戌亥",
    lifePalace: "壬子 (桑柘木)",
    bodyPalace: "丙午 (天河水)"
  },
  columns: [
    {
      title: "年柱",
      mainStar: "正官",
      pillar: { stem: "丁", branch: "卯" },
      hiddenStems: ["乙木"],
      subStars: ["正财"],
      phase: "胎",
      selfSeat: "病",
      voidBranch: "戌亥",
      nayin: "炉中火",
      shensha: ["太极贵人", "飞刃", "桃花"]
    },
    {
      title: "月柱",
      mainStar: "正财",
      pillar: { stem: "乙", branch: "巳" },
      hiddenStems: ["丙火", "庚金", "戊土"],
      subStars: ["七杀", "比肩", "偏印"],
      phase: "长生",
      selfSeat: "沐浴",
      voidBranch: "寅卯",
      nayin: "覆灯火",
      shensha: ["德秀贵人", "月德合", "正词馆", "驿马"]
    },
    {
      title: "日柱",
      mainStar: "元男",
      pillar: { stem: "庚", branch: "午" },
      hiddenStems: ["丁火", "己土"],
      subStars: ["正官", "正印"],
      phase: "沐浴",
      selfSeat: "沐浴",
      voidBranch: "戌亥",
      nayin: "路旁土",
      shensha: ["天厨贵人", "福星贵人", "月德贵人", "天喜"]
    },
    {
      title: "时柱",
      mainStar: "七杀",
      pillar: { stem: "丙", branch: "子" },
      hiddenStems: ["癸水"],
      subStars: ["伤官"],
      phase: "死",
      selfSeat: "胎",
      voidBranch: "申酉",
      nayin: "涧下水",
      shensha: ["天德合", "桃花", "红鸾", "披麻"]
    }
  ],
  luckCycles: [
    { year: "1987", age: "1~6岁", stem: "小", branch: "运", tags: [] },
    { year: "1992", age: "6岁", stem: "甲", branch: "辰", tags: ["才", "枭"] },
    { year: "2002", age: "16岁", stem: "癸", branch: "卯", tags: ["伤", "财"] },
    { year: "2012", age: "26岁", stem: "壬", branch: "寅", tags: ["食", "才"] },
    { year: "2022", age: "36岁", stem: "辛", branch: "丑", tags: ["劫", "印"], active: true },
    { year: "2032", age: "46岁", stem: "庚", branch: "子", tags: ["比", "伤"] }
  ],
  years: [
    { year: "2022", age: "", stem: "壬", branch: "寅", tags: ["食", "才"] },
    { year: "2023", age: "", stem: "癸", branch: "卯", tags: ["伤", "财"] },
    { year: "2024", age: "", stem: "甲", branch: "辰", tags: ["才", "枭"] },
    { year: "2025", age: "", stem: "乙", branch: "巳", tags: ["财", "杀"] },
    { year: "2026", age: "", stem: "丙", branch: "午", tags: ["杀", "官"], active: true },
    { year: "2027", age: "", stem: "丁", branch: "未", tags: ["官", "印"] }
  ]
};
