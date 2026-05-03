import type { EarthlyBranch, HeavenlyStem, Pillar } from "./index";

export interface ShenshaContext {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  time: Pillar;
}

const TIAN_YI: Record<HeavenlyStem, EarthlyBranch[]> = {
  甲: ["丑", "未"],
  乙: ["子", "申"],
  丙: ["亥", "酉"],
  丁: ["亥", "酉"],
  戊: ["丑", "未"],
  己: ["子", "申"],
  庚: ["丑", "未"],
  辛: ["寅", "午"],
  壬: ["卯", "巳"],
  癸: ["卯", "巳"]
};

const TAI_JI: Record<HeavenlyStem, EarthlyBranch[]> = {
  甲: ["子", "午"],
  乙: ["子", "午"],
  丙: ["卯", "酉"],
  丁: ["卯", "酉"],
  戊: ["辰", "戌", "丑", "未"],
  己: ["辰", "戌", "丑", "未"],
  庚: ["寅", "亥"],
  辛: ["寅", "亥"],
  壬: ["巳", "申"],
  癸: ["巳", "申"]
};

const WEN_CHANG: Record<HeavenlyStem, EarthlyBranch> = {
  甲: "巳",
  乙: "午",
  丙: "申",
  丁: "酉",
  戊: "申",
  己: "酉",
  庚: "亥",
  辛: "子",
  壬: "寅",
  癸: "卯"
};

const LU_SHEN: Record<HeavenlyStem, EarthlyBranch> = {
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

const YANG_REN: Record<HeavenlyStem, EarthlyBranch> = {
  甲: "卯",
  乙: "寅",
  丙: "午",
  丁: "巳",
  戊: "午",
  己: "巳",
  庚: "酉",
  辛: "申",
  壬: "子",
  癸: "亥"
};

const BRANCH_CHONG: Record<EarthlyBranch, EarthlyBranch> = {
  子: "午",
  丑: "未",
  寅: "申",
  卯: "酉",
  辰: "戌",
  巳: "亥",
  午: "子",
  未: "丑",
  申: "寅",
  酉: "卯",
  戌: "辰",
  亥: "巳"
};

const GAN_HE: Record<HeavenlyStem, HeavenlyStem> = {
  甲: "己",
  己: "甲",
  乙: "庚",
  庚: "乙",
  丙: "辛",
  辛: "丙",
  丁: "壬",
  壬: "丁",
  戊: "癸",
  癸: "戊"
};

const FU_XING: Record<HeavenlyStem, EarthlyBranch[]> = {
  甲: ["寅", "子"],
  乙: ["卯", "丑"],
  丙: ["寅", "子"],
  丁: ["亥"],
  戊: ["申"],
  己: ["未"],
  庚: ["午"],
  辛: ["巳"],
  壬: ["辰"],
  癸: ["卯", "丑"]
};

const TIAN_CHU: Record<HeavenlyStem, EarthlyBranch> = {
  甲: "巳",
  乙: "午",
  丙: "巳",
  丁: "午",
  戊: "申",
  己: "酉",
  庚: "午",
  辛: "巳",
  壬: "亥",
  癸: "子"
};

const GUO_YIN: Record<HeavenlyStem, EarthlyBranch> = {
  甲: "戌",
  乙: "亥",
  丙: "丑",
  丁: "寅",
  戊: "丑",
  己: "寅",
  庚: "辰",
  辛: "巳",
  壬: "未",
  癸: "申"
};

const HONG_YAN: Record<HeavenlyStem, EarthlyBranch> = {
  甲: "午",
  乙: "申",
  丙: "寅",
  丁: "未",
  戊: "辰",
  己: "辰",
  庚: "戌",
  辛: "酉",
  壬: "子",
  癸: "申"
};

const YUE_DE: Record<EarthlyBranch, HeavenlyStem> = {
  寅: "丙",
  午: "丙",
  戌: "丙",
  申: "壬",
  子: "壬",
  辰: "壬",
  亥: "甲",
  卯: "甲",
  未: "甲",
  巳: "庚",
  酉: "庚",
  丑: "庚"
};

const TIAN_DE: Partial<Record<EarthlyBranch, { stem?: HeavenlyStem; branch?: EarthlyBranch }>> = {
  寅: { stem: "丁" },
  卯: { branch: "申" },
  辰: { stem: "壬" },
  巳: { stem: "辛" },
  午: { branch: "亥" },
  未: { stem: "甲" },
  申: { stem: "癸" },
  酉: { branch: "寅" },
  戌: { stem: "丙" },
  亥: { stem: "乙" },
  子: { branch: "巳" },
  丑: { stem: "庚" }
};

const GU_CHEN: Record<EarthlyBranch, EarthlyBranch> = {
  寅: "巳",
  卯: "巳",
  辰: "巳",
  巳: "申",
  午: "申",
  未: "申",
  申: "亥",
  酉: "亥",
  戌: "亥",
  亥: "寅",
  子: "寅",
  丑: "寅"
};

const SANG_MEN: Record<EarthlyBranch, EarthlyBranch> = {
  子: "寅",
  丑: "卯",
  寅: "辰",
  卯: "巳",
  辰: "午",
  巳: "未",
  午: "申",
  未: "酉",
  申: "戌",
  酉: "亥",
  戌: "子",
  亥: "丑"
};

const PI_MA: Record<EarthlyBranch, EarthlyBranch> = {
  子: "酉",
  丑: "戌",
  寅: "亥",
  卯: "子",
  辰: "丑",
  巳: "寅",
  午: "卯",
  未: "辰",
  申: "巳",
  酉: "午",
  戌: "未",
  亥: "申"
};

const GOU_JIAO: Record<EarthlyBranch, EarthlyBranch> = {
  子: "卯",
  丑: "辰",
  寅: "巳",
  卯: "午",
  辰: "未",
  巳: "申",
  午: "酉",
  未: "戌",
  申: "亥",
  酉: "子",
  戌: "丑",
  亥: "寅"
};

const SAN_HE_GROUPS: Array<{
  branches: EarthlyBranch[];
  taoHua: EarthlyBranch;
  yiMa: EarthlyBranch;
  huaGai: EarthlyBranch;
  jiangXing: EarthlyBranch;
  wangShen: EarthlyBranch;
  jieSha: EarthlyBranch;
  zaiSha: EarthlyBranch;
}> = [
  { branches: ["申", "子", "辰"], taoHua: "酉", yiMa: "寅", huaGai: "辰", jiangXing: "子", wangShen: "亥", jieSha: "巳", zaiSha: "午" },
  { branches: ["寅", "午", "戌"], taoHua: "卯", yiMa: "申", huaGai: "戌", jiangXing: "午", wangShen: "巳", jieSha: "亥", zaiSha: "子" },
  { branches: ["巳", "酉", "丑"], taoHua: "午", yiMa: "亥", huaGai: "丑", jiangXing: "酉", wangShen: "申", jieSha: "寅", zaiSha: "卯" },
  { branches: ["亥", "卯", "未"], taoHua: "子", yiMa: "巳", huaGai: "未", jiangXing: "卯", wangShen: "寅", jieSha: "申", zaiSha: "酉" }
];

const HONG_LUAN: Record<EarthlyBranch, EarthlyBranch> = {
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

const TIAN_XI: Record<EarthlyBranch, EarthlyBranch> = {
  子: "酉",
  丑: "申",
  寅: "未",
  卯: "午",
  辰: "巳",
  巳: "辰",
  午: "卯",
  未: "寅",
  申: "丑",
  酉: "子",
  戌: "亥",
  亥: "戌"
};

const JIN_SHEN_PILLARS = new Set(["乙丑", "己巳", "癸酉"]);

export function calculateShenshaForPillar(target: Pillar, context: ShenshaContext) {
  const result = new Set<string>();
  const targetStem = target.stem;
  const targetBranch = target.branch;
  const dayStem = context.day.stem;
  const dayBranch = context.day.branch;
  const yearBranch = context.year.branch;
  const monthBranch = context.month.branch;
  const yueDeStem = YUE_DE[monthBranch];
  const tianDe = TIAN_DE[monthBranch];

  addIf(result, TIAN_YI[dayStem].includes(targetBranch), "天乙贵人");
  addIf(result, TAI_JI[dayStem].includes(targetBranch), "太极贵人");
  addIf(result, WEN_CHANG[dayStem] === targetBranch, "文昌贵人");
  addIf(result, FU_XING[dayStem].includes(targetBranch), "福星贵人");
  addIf(result, TIAN_CHU[dayStem] === targetBranch, "天厨贵人");
  addIf(result, GUO_YIN[dayStem] === targetBranch, "国印贵人");
  addIf(result, HONG_YAN[dayStem] === targetBranch, "红艳煞");
  addIf(result, LU_SHEN[dayStem] === targetBranch, "禄神");
  addIf(result, YANG_REN[dayStem] === targetBranch, "羊刃");
  addIf(result, BRANCH_CHONG[YANG_REN[dayStem]] === targetBranch, "飞刃");
  addIf(result, yueDeStem === targetStem, "月德贵人");
  addIf(result, GAN_HE[yueDeStem] === targetStem, "月德合");
  addIf(result, tianDe?.stem === targetStem || tianDe?.branch === targetBranch, "天德贵人");
  addIf(result, tianDe?.stem ? GAN_HE[tianDe.stem] === targetStem : false, "天德合");
  addGroupStars(result, dayBranch, targetBranch);
  addGroupStars(result, yearBranch, targetBranch);
  addIf(result, isDeXiu(monthBranch, targetStem), "德秀贵人");
  addIf(result, JIN_SHEN_PILLARS.has(`${targetStem}${targetBranch}`), "金神");
  addIf(result, isDiZhuanDay(context.day, monthBranch) && targetStem === context.day.stem && targetBranch === context.day.branch, "地转日");
  addIf(result, isTongZi(monthBranch, targetBranch), "童子煞");
  addIf(result, HONG_LUAN[yearBranch] === targetBranch, "红鸾");
  addIf(result, TIAN_XI[yearBranch] === targetBranch, "天喜");
  addIf(result, GU_CHEN[yearBranch] === targetBranch, "孤辰");
  addIf(result, SANG_MEN[yearBranch] === targetBranch, "丧门");
  addIf(result, PI_MA[yearBranch] === targetBranch, "披麻");
  addIf(result, GOU_JIAO[yearBranch] === targetBranch, "勾绞煞");

  return Array.from(result);
}

function addGroupStars(result: Set<string>, referenceBranch: EarthlyBranch, targetBranch: EarthlyBranch) {
  const group = SAN_HE_GROUPS.find((item) => item.branches.includes(referenceBranch));
  if (!group) {
    return;
  }

  addIf(result, group.taoHua === targetBranch, "桃花");
  addIf(result, group.yiMa === targetBranch, "驿马");
  addIf(result, group.huaGai === targetBranch, "华盖");
  addIf(result, group.jiangXing === targetBranch, "将星");
  addIf(result, group.wangShen === targetBranch, "亡神");
  addIf(result, group.jieSha === targetBranch, "劫煞");
  addIf(result, group.zaiSha === targetBranch, "灾煞");
}

function isDeXiu(monthBranch: EarthlyBranch, targetStem: HeavenlyStem) {
  if (["寅", "午", "戌"].includes(monthBranch)) {
    return ["丙", "丁", "戊", "癸"].includes(targetStem);
  }

  if (["申", "子", "辰"].includes(monthBranch)) {
    return ["壬", "癸", "戊", "己"].includes(targetStem);
  }

  if (["巳", "酉", "丑"].includes(monthBranch)) {
    return ["庚", "辛", "乙", "庚"].includes(targetStem);
  }

  return ["甲", "乙", "丁", "壬"].includes(targetStem);
}

function isTongZi(monthBranch: EarthlyBranch, targetBranch: EarthlyBranch) {
  if (["寅", "卯", "辰", "申", "酉", "戌"].includes(monthBranch)) {
    return ["寅", "子"].includes(targetBranch);
  }

  return ["卯", "未", "辰"].includes(targetBranch);
}

function isDiZhuanDay(day: Pillar, monthBranch: EarthlyBranch) {
  const dayKey = `${day.stem}${day.branch}`;

  if (["寅", "卯", "辰"].includes(monthBranch)) {
    return ["乙卯", "辛卯"].includes(dayKey);
  }

  if (["巳", "午", "未"].includes(monthBranch)) {
    return ["丙午", "戊午"].includes(dayKey);
  }

  if (["申", "酉", "戌"].includes(monthBranch)) {
    return ["辛酉", "癸酉"].includes(dayKey);
  }

  return ["壬子", "丙子"].includes(dayKey);
}

function addIf(result: Set<string>, condition: boolean, label: string) {
  if (condition) {
    result.add(label);
  }
}
