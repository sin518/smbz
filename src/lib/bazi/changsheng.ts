import type { EarthlyBranch, HeavenlyStem } from "./index";

const STAGES = ["长生", "沐浴", "冠带", "临官", "帝旺", "衰", "病", "死", "墓", "绝", "胎", "养"] as const;

const YANG_SEQUENCE: EarthlyBranch[] = ["亥", "子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌"];
const YIN_SEQUENCE: EarthlyBranch[] = ["亥", "戌", "酉", "申", "未", "午", "巳", "辰", "卯", "寅", "丑", "子"];

const CHANG_SHENG_START: Record<HeavenlyStem, EarthlyBranch> = {
  甲: "亥",
  乙: "午",
  丙: "寅",
  丁: "酉",
  戊: "寅",
  己: "酉",
  庚: "巳",
  辛: "子",
  壬: "申",
  癸: "卯"
};

const YIN_STEMS: HeavenlyStem[] = ["乙", "丁", "己", "辛", "癸"];

export function getSelfSeatStage(stem: HeavenlyStem, branch: EarthlyBranch) {
  const sequence = YIN_STEMS.includes(stem) ? YIN_SEQUENCE : YANG_SEQUENCE;
  const startIndex = sequence.indexOf(CHANG_SHENG_START[stem]);
  const branchIndex = sequence.indexOf(branch);
  const stageIndex = (branchIndex - startIndex + sequence.length) % sequence.length;

  return STAGES[stageIndex];
}
