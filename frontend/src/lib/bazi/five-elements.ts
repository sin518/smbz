import type { ChartColumn } from "@/lib/bazi/demo";

export type FiveElement = "木" | "火" | "土" | "金" | "水";
export type YinYang = "阳" | "阴";

export type StemMeta = {
  element: FiveElement;
  yinYang: YinYang;
};

export type HiddenStem = {
  stem: string;
  element: FiveElement;
  qi: "主气" | "中气" | "余气";
  weight: number;
};

export type FiveElementStats = {
  element: FiveElement;
  power: number;
  percentage: number;
  tenGodCount: number;
};

export const elementOrder: FiveElement[] = ["木", "火", "土", "金", "水"];

export const stemMeta: Record<string, StemMeta> = {
  甲: { element: "木", yinYang: "阳" },
  乙: { element: "木", yinYang: "阴" },
  丙: { element: "火", yinYang: "阳" },
  丁: { element: "火", yinYang: "阴" },
  戊: { element: "土", yinYang: "阳" },
  己: { element: "土", yinYang: "阴" },
  庚: { element: "金", yinYang: "阳" },
  辛: { element: "金", yinYang: "阴" },
  壬: { element: "水", yinYang: "阳" },
  癸: { element: "水", yinYang: "阴" }
};

export const stemElements = Object.fromEntries(
  Object.entries(stemMeta).map(([stem, meta]) => [stem, meta.element])
) as Record<string, FiveElement>;

export const branchElements: Record<string, FiveElement> = {
  子: "水",
  丑: "土",
  寅: "木",
  卯: "木",
  辰: "土",
  巳: "火",
  午: "火",
  未: "土",
  申: "金",
  酉: "金",
  戌: "土",
  亥: "水"
};

export const generates: Record<FiveElement, FiveElement> = {
  木: "火",
  火: "土",
  土: "金",
  金: "水",
  水: "木"
};

export const controls: Record<FiveElement, FiveElement> = {
  木: "土",
  火: "金",
  土: "水",
  金: "木",
  水: "火"
};

export const hiddenStems: Record<string, HiddenStem[]> = {
  子: [hidden("癸", "主气", 1)],
  丑: [hidden("己", "主气", 1), hidden("癸", "中气", 0.5), hidden("辛", "余气", 0.25)],
  寅: [hidden("甲", "主气", 1), hidden("丙", "中气", 0.5), hidden("戊", "余气", 0.25)],
  卯: [hidden("乙", "主气", 1)],
  辰: [hidden("戊", "主气", 1), hidden("乙", "中气", 0.5), hidden("癸", "余气", 0.25)],
  巳: [hidden("丙", "主气", 1), hidden("戊", "中气", 0.5), hidden("庚", "余气", 0.25)],
  午: [hidden("丁", "主气", 1), hidden("己", "中气", 0.5)],
  未: [hidden("己", "主气", 1), hidden("丁", "中气", 0.5), hidden("乙", "余气", 0.25)],
  申: [hidden("庚", "主气", 1), hidden("壬", "中气", 0.5), hidden("戊", "余气", 0.25)],
  酉: [hidden("辛", "主气", 1)],
  戌: [hidden("戊", "主气", 1), hidden("辛", "中气", 0.5), hidden("丁", "余气", 0.25)],
  亥: [hidden("壬", "主气", 1), hidden("甲", "中气", 0.5)]
};

export function countFiveElements(columns: ChartColumn[], includeHiddenStems = true) {
  const counts = createEmptyElementRecord();

  columns.forEach((column) => {
    const stemElement = stemElements[column.pillar.stem];
    const branchElement = branchElements[column.pillar.branch];
    const branchWeight = column.title === "月柱" ? 2 : 1;

    if (stemElement) {
      counts[stemElement] += 1;
    }

    if (branchElement) {
      counts[branchElement] += branchWeight;
    }

    if (includeHiddenStems) {
      hiddenStems[column.pillar.branch]?.forEach((item) => {
        counts[item.element] += item.weight * branchWeight;
      });
    }
  });

  return counts;
}

export function buildFiveElementStats(columns: ChartColumn[], includeHiddenStems = true): FiveElementStats[] {
  const powerCounts = countFiveElements(columns, includeHiddenStems);
  const tenGodCounts = countTenGodElements(columns);
  const total = elementOrder.reduce((sum, element) => sum + powerCounts[element], 0);

  return elementOrder.map((element) => ({
    element,
    power: powerCounts[element],
    percentage: total > 0 ? (powerCounts[element] / total) * 100 : 0,
    tenGodCount: tenGodCounts[element]
  }));
}

function countTenGodElements(columns: ChartColumn[]) {
  const counts = createEmptyElementRecord();

  columns.forEach((column) => {
    const stemElement = stemElements[column.pillar.stem];
    if (stemElement && column.mainStar && !column.mainStar.startsWith("元")) {
      counts[stemElement] += 1;
    }

    column.subStars.forEach((god, index) => {
      const hiddenStem = column.hiddenStems[index]?.slice(0, 1);
      const hiddenElement = hiddenStem ? stemElements[hiddenStem] : undefined;
      if (hiddenElement && god) {
        counts[hiddenElement] += 1;
      }
    });
  });

  return counts;
}

function hidden(stem: string, qi: HiddenStem["qi"], weight: number): HiddenStem {
  return {
    stem,
    element: stemElements[stem],
    qi,
    weight
  };
}

export function getGeneratingElement(element: FiveElement) {
  return elementOrder.find((item) => generates[item] === element) ?? element;
}

export function getControllingElement(element: FiveElement) {
  return elementOrder.find((item) => controls[item] === element) ?? element;
}

function createEmptyElementRecord() {
  return {
    木: 0,
    火: 0,
    土: 0,
    金: 0,
    水: 0
  } satisfies Record<FiveElement, number>;
}
