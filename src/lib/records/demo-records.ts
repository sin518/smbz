import { demoBaziChart } from "@/lib/bazi/demo";

export interface BaziRecordSummary {
  id: string;
  name: string;
  gender: "男" | "女";
  birthTime: string;
  location: string;
  calendar: string;
  pillars: string;
  createdAt: string;
  hasAiReport: boolean;
}

export const demoRecords: BaziRecordSummary[] = [
  {
    id: "demo",
    name: demoBaziChart.profile.name,
    gender: demoBaziChart.profile.gender,
    birthTime: demoBaziChart.profile.solar,
    location: demoBaziChart.profile.location,
    calendar: "公历",
    pillars: demoBaziChart.columns.map((column) => `${column.pillar.stem}${column.pillar.branch}`).join(" "),
    createdAt: "2026-05-01 09:20",
    hasAiReport: true
  },
  {
    id: "current",
    name: "即时排盘",
    gender: "男",
    birthTime: "2026-04-30 10:41",
    location: "未知地 北京时间",
    calendar: "公历",
    pillars: "丙午 壬辰 甲戌 己巳",
    createdAt: "2026-04-30 10:41",
    hasAiReport: false
  }
];
