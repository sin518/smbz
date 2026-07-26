import type { DaliurenOutput } from "taibu-core/daliuren";

export type DaliurenTransmissionState = "chu" | "zhong" | "mo";

const EARTHLY_BRANCHES = new Set("子丑寅卯辰巳午未申酉戌亥");

export function getDaliurenTransmissionStates(
  chart: Pick<DaliurenOutput, "sanChuan">,
  branch: string
): DaliurenTransmissionState[] {
  const states: DaliurenTransmissionState[] = [];

  if (branch === chart.sanChuan.chu[0]) {
    states.push("chu");
  }
  if (branch === chart.sanChuan.zhong[0]) {
    states.push("zhong");
  }
  if (branch === chart.sanChuan.mo[0]) {
    states.push("mo");
  }

  return states;
}

export function getDaliurenHourBranch(hourGanZhi: string): string {
  return Array.from(hourGanZhi).reverse().find((char) => EARTHLY_BRANCHES.has(char)) ?? "-";
}

export function formatDaliurenCourseLabel(method: string, fallback: string): string {
  const normalized = (method || fallback).trim();
  if (!normalized) {
    return "课式未定";
  }
  return normalized.endsWith("课") ? normalized : `${normalized}课`;
}

export function buildDaliurenGongAriaLabel({
  diZhi,
  tianZhi,
  tianJiang,
  dunGan,
  wangShuai,
  changSheng,
  transmissionStates,
  isKongWang
}: {
  diZhi: string;
  tianZhi: string;
  tianJiang: string;
  dunGan: string;
  wangShuai: string;
  changSheng: string;
  transmissionStates: DaliurenTransmissionState[];
  isKongWang: boolean;
}): string {
  const transmissionLabel = transmissionStates
    .map((state) => ({ chu: "初传", zhong: "中传", mo: "末传" })[state])
    .join("、");
  const statuses = [transmissionLabel, isKongWang ? "空亡" : ""].filter(Boolean).join("，");

  return [
    `${diZhi}位`,
    `天盘${tianZhi || "无"}`,
    `天将${tianJiang || "无"}`,
    `地盘${diZhi || "无"}`,
    `遁干${dunGan || "无"}`,
    `旺衰${wangShuai || "无"}`,
    `十二长生${changSheng || "无"}`,
    statuses
  ].filter(Boolean).join("，");
}
