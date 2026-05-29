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
  luckStartText: string;
  luckTransferText: string;
  currentAgeText: string;
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
  canonicalText?: string;
}
