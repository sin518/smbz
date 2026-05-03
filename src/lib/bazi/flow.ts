import type { ChartColumn } from "./demo";

export type FiveElement = "木" | "火" | "土" | "金" | "水";
export type FlowRelation = "生" | "克" | "同气";
export type FlowDirection = "forward" | "backward" | "neutral";

export type FlowLine = {
  fromTitle: string;
  toTitle: string;
  fromValue: string;
  toValue: string;
  fromElement: FiveElement;
  toElement: FiveElement;
  relation: FlowRelation;
  direction: FlowDirection;
};

export type ElementCount = {
  element: FiveElement;
  count: number;
};

export type BaziFlow = {
  stemLines: FlowLine[];
  branchLines: FlowLine[];
  elementCounts: ElementCount[];
  summary: {
    score: number;
    level: "流通较顺" | "流通平稳" | "流通受阻";
    text: string;
  };
};

const ELEMENT_ORDER: FiveElement[] = ["木", "火", "土", "金", "水"];

const GENERATES: Record<FiveElement, FiveElement> = {
  木: "火",
  火: "土",
  土: "金",
  金: "水",
  水: "木"
};

const CONTROLS: Record<FiveElement, FiveElement> = {
  木: "土",
  土: "水",
  水: "火",
  火: "金",
  金: "木"
};

export function buildBaziFlow(columns: ChartColumn[]): BaziFlow {
  const stemLines = buildSequentialLines(columns, "stem");
  const branchLines = buildSequentialLines(columns, "branch");
  const elementCounts = countElements(columns);
  const summary = summarizeFlow([...stemLines, ...branchLines]);

  return {
    stemLines,
    branchLines,
    elementCounts,
    summary
  };
}

export function getValueElement(value: string): FiveElement | null {
  const elements: Record<string, FiveElement> = {
    甲: "木",
    乙: "木",
    寅: "木",
    卯: "木",
    丙: "火",
    丁: "火",
    巳: "火",
    午: "火",
    戊: "土",
    己: "土",
    辰: "土",
    戌: "土",
    丑: "土",
    未: "土",
    庚: "金",
    辛: "金",
    申: "金",
    酉: "金",
    壬: "水",
    癸: "水",
    子: "水",
    亥: "水"
  };

  return elements[value] ?? null;
}

function buildSequentialLines(columns: ChartColumn[], type: "stem" | "branch") {
  const lines: FlowLine[] = [];

  columns.slice(0, -1).forEach((column, index) => {
    const nextColumn = columns[index + 1];
    const fromValue = type === "stem" ? column.pillar.stem : column.pillar.branch;
    const toValue = type === "stem" ? nextColumn.pillar.stem : nextColumn.pillar.branch;
    const fromElement = getValueElement(fromValue);
    const toElement = getValueElement(toValue);

    if (!fromElement || !toElement) {
      return;
    }

    lines.push({
      fromTitle: column.title,
      toTitle: nextColumn.title,
      fromValue,
      toValue,
      fromElement,
      toElement,
      ...compareElements(fromElement, toElement)
    });
  });

  return lines;
}

function compareElements(fromElement: FiveElement, toElement: FiveElement): Pick<FlowLine, "relation" | "direction"> {
  if (fromElement === toElement) {
    return { relation: "同气", direction: "neutral" };
  }

  if (GENERATES[fromElement] === toElement) {
    return { relation: "生", direction: "forward" };
  }

  if (GENERATES[toElement] === fromElement) {
    return { relation: "生", direction: "backward" };
  }

  if (CONTROLS[fromElement] === toElement) {
    return { relation: "克", direction: "forward" };
  }

  return { relation: "克", direction: "backward" };
}

function countElements(columns: ChartColumn[]) {
  const counts: Record<FiveElement, number> = {
    木: 0,
    火: 0,
    土: 0,
    金: 0,
    水: 0
  };

  columns.forEach((column) => {
    const stemElement = getValueElement(column.pillar.stem);
    const branchElement = getValueElement(column.pillar.branch);

    if (stemElement) {
      counts[stemElement] += 1;
    }

    if (branchElement) {
      counts[branchElement] += 1;
    }
  });

  return ELEMENT_ORDER.map((element) => ({ element, count: counts[element] }));
}

function summarizeFlow(lines: FlowLine[]): BaziFlow["summary"] {
  const supportCount = lines.filter((line) => line.relation === "生" || line.relation === "同气").length;
  const forwardCount = lines.filter((line) => line.direction === "forward" || line.direction === "neutral").length;
  const score = supportCount + forwardCount;

  if (score >= 8) {
    return {
      score,
      level: "流通较顺",
      text: "相生与同气较多，能量在宫位之间更容易承接。"
    };
  }

  if (score >= 5) {
    return {
      score,
      level: "流通平稳",
      text: "既有承接也有制约，适合结合旺衰和用神继续细看。"
    };
  }

  return {
    score,
    level: "流通受阻",
    text: "克制或逆向关系偏多，做判断时要留意宫位之间的牵制。"
  };
}
