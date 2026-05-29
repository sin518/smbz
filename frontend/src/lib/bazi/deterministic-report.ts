import { buildUsefulGodAnalysis } from "@/lib/ai/bazi-command";
import type { ChartColumn, DemoBaziChart } from "@/lib/bazi/demo";

export type BaziDeterministicReportType = "wuxing" | "personality";

export type BaziDeterministicReportSection = {
  title: string;
  body: string;
};

export type BaziDeterministicReport = {
  summary: string;
  sections: BaziDeterministicReportSection[];
};

type FiveElement = "木" | "火" | "土" | "金" | "水";

const stemElements: Record<string, FiveElement> = {
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

const dayMasterTraits: Record<string, string> = {
  甲: "甲木重原则与成长，适合在清晰目标中稳步扩展。",
  乙: "乙木柔韧细腻，擅长协调、审美与在变化中寻找生机。",
  丙: "丙火明朗主动，表达欲与带动力较强。",
  丁: "丁火敏锐细致，重感受、灵感与持续打磨。",
  戊: "戊土稳重承载，重秩序、责任与长期规划。",
  己: "己土包容务实，重安全感、照料细节与稳定积累。",
  庚: "庚金果断直接，执行力强，适合在规则与压力中锻炼能力。",
  辛: "辛金精细敏锐，重品质、边界、审美与专业表达。",
  壬: "壬水思路开阔，适应力强，擅长学习、流动与资源整合。",
  癸: "癸水细腻敏感，善于观察与共情，适合做精密判断。"
};

const tenGodTraitMap: Record<string, string> = {
  比肩: "比肩重自我边界与自主性，遇事倾向先靠自身判断。",
  劫财: "劫财带竞争与行动感，适合协作中争取主动，但要注意资源边界。",
  食神: "食神偏稳定输出、表达与享受感，适合长期沉淀能力。",
  伤官: "伤官偏表达、创新与突破规则，优点是锋利，风险是过度挑剔。",
  正财: "正财重现实秩序、执行与可见收益，适合把目标拆成可落地步骤。",
  偏财: "偏财重机会、资源与外部连接，适合开放场景中的灵活判断。",
  正官: "正官重规则、责任与名誉，适合在制度、资质、岗位责任中发展。",
  七杀: "七杀重压力、竞争与突破，适合高强度目标，但需要稳定节奏承接。",
  正印: "正印重学习、保护与系统支持，适合资质积累与专业框架。",
  偏印: "偏印重洞察、独立思考与非标准路径，适合研究型或策略型任务。"
};

export function buildBaziDeterministicReport(chart: DemoBaziChart, type: BaziDeterministicReportType): BaziDeterministicReport {
  return type === "wuxing" ? buildWuxingReport(chart) : buildPersonalityReport(chart);
}

function buildWuxingReport(chart: DemoBaziChart): BaziDeterministicReport {
  const analysis = buildUsefulGodAnalysis(chart.columns, chart.luckCycles);
  const dayColumn = getDayColumn(chart.columns);
  const monthColumn = getMonthColumn(chart.columns);
  const dayElement = stemElements[dayColumn?.pillar.stem ?? ""];

  return {
    summary: `日主${dayColumn?.pillar.stem ?? "待定"}${dayElement ?? ""}，以月令${monthColumn?.pillar.branch ?? "待定"}为纲做旺衰与调候判断。本报告只基于排盘数据和固定规则生成，不调用 AI。`,
    sections: [
      { title: "五行结构", body: analysis.elementDistribution },
      { title: "旺衰判断", body: analysis.strength },
      { title: "地支关系", body: analysis.branchAnalysis },
      { title: "格局线索", body: analysis.pattern },
      { title: "调候与通关", body: `${analysis.climate}\n${analysis.passage}` },
      { title: "喜忌建议", body: `${analysis.usefulGod}\n喜神：${analysis.favorableGod}\n条件用神：${analysis.conditionalGod}\n忌神：${analysis.unfavorableGod}` },
      { title: "大运复核", body: analysis.luckReview }
    ]
  };
}

function buildPersonalityReport(chart: DemoBaziChart): BaziDeterministicReport {
  const analysis = buildUsefulGodAnalysis(chart.columns, chart.luckCycles);
  const dayColumn = getDayColumn(chart.columns);
  const dayStem = dayColumn?.pillar.stem ?? "";
  const dominantTenGods = getDominantTenGods(chart.columns);
  const activeLuck = chart.luckCycles.find((item) => item.active);
  const traitLines = dominantTenGods.map((god) => tenGodTraitMap[god]).filter(Boolean);

  return {
    summary: `以日主${dayStem || "待定"}为性格底色，结合十神分布、地支关系和当前大运生成画像。本报告用于自我观察，不做绝对性格定论。`,
    sections: [
      { title: "日主底色", body: dayMasterTraits[dayStem] ?? "日主信息不足，暂不生成底色判断。" },
      { title: "核心特质", body: traitLines.length ? traitLines.join("\n") : "十神信息不足，暂不生成核心特质。" },
      { title: "优势倾向", body: buildStrengthText(dominantTenGods) },
      { title: "盲点提醒", body: buildBlindSpotText(dominantTenGods) },
      { title: "关系模式", body: analysis.branchAnalysis },
      { title: "阶段节奏", body: activeLuck ? `当前大运参考：${activeLuck.year} ${activeLuck.stem}${activeLuck.branch}（${activeLuck.age || "年龄待补"}）。${analysis.luckReview}` : analysis.luckReview }
    ]
  };
}

function getDayColumn(columns: ChartColumn[]) {
  return columns.find((column) => column.title === "日柱") ?? columns[2];
}

function getMonthColumn(columns: ChartColumn[]) {
  return columns.find((column) => column.title === "月柱") ?? columns[1];
}

function getDominantTenGods(columns: ChartColumn[]) {
  const counts = new Map<string, number>();

  columns.forEach((column) => {
    [column.mainStar, ...column.subStars].forEach((god) => {
      if (!god || god === "元男" || god === "元女") return;
      counts.set(god, (counts.get(god) ?? 0) + 1);
    });
  });

  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1])
    .map(([god]) => god)
    .slice(0, 4);
}

function buildStrengthText(gods: string[]) {
  const parts: string[] = [];

  if (gods.some((god) => god.includes("印"))) {
    parts.push("印星明显时，学习、吸收、复盘和借助系统资源的能力较强。");
  }
  if (gods.some((god) => god === "正官" || god === "七杀")) {
    parts.push("官杀明显时，对目标、责任和外部标准更敏感，适合在压力中建立秩序。");
  }
  if (gods.some((god) => god === "食神" || god === "伤官")) {
    parts.push("食伤明显时，表达、输出、创意和解决问题的主动性较强。");
  }
  if (gods.some((god) => god === "正财" || god === "偏财")) {
    parts.push("财星明显时，现实感、资源意识和结果导向更突出。");
  }

  return parts.length ? parts.join("\n") : "优势需要结合完整十神与大运继续观察。";
}

function buildBlindSpotText(gods: string[]) {
  const parts: string[] = [];

  if (gods.includes("伤官")) {
    parts.push("伤官强时容易对规则和低效流程不耐烦，表达锋利时要注意沟通成本。");
  }
  if (gods.includes("七杀")) {
    parts.push("七杀明显时容易长期处在压力驱动中，需要避免把紧绷感当成常态。");
  }
  if (gods.includes("劫财")) {
    parts.push("劫财明显时要注意竞争心与资源分配，合作前先讲清边界。");
  }
  if (gods.includes("偏印")) {
    parts.push("偏印明显时想法独立，但可能过度内耗或路径跳跃，需要用稳定输出校准。");
  }

  return parts.length ? parts.join("\n") : "暂未见特别突出的性格盲点，仍建议结合现实反馈校验。";
}
