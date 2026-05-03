"use client";

import { ArrowLeft, ArrowRight, Settings } from "lucide-react";
import { useMemo, useState } from "react";
import type { ChartColumn } from "@/lib/bazi/demo";
import { buildBaziFlow, getValueElement, type BaziFlow, type FiveElement, type FlowLine } from "@/lib/bazi/flow";
import { cn } from "@/lib/utils";

type InsightTab = "ganzhi" | "flow" | "palace" | "family";

type GanzhiInsightClientProps = {
  columns: ChartColumn[];
};

const tabs: Array<{ key: InsightTab; label: string }> = [
  { key: "ganzhi", label: "干支" },
  { key: "flow", label: "流通" },
  { key: "palace", label: "宫位" },
  { key: "family", label: "六亲" }
];

export function GanzhiInsightClient({ columns }: GanzhiInsightClientProps) {
  const [activeTab, setActiveTab] = useState<InsightTab>("ganzhi");
  const relations = useMemo(() => buildRelations(columns), [columns]);
  const flow = useMemo(() => buildBaziFlow(columns), [columns]);

  return (
    <section className="px-5 pb-10">
      <div className="grid grid-cols-4 rounded-[18px] bg-[#eeeeee] p-1 text-center text-[24px] font-semibold">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn("h-14 rounded-[16px]", activeTab === tab.key && "bg-white shadow-sm")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "ganzhi" ? <GanzhiPanel columns={columns} relations={relations} /> : null}
      {activeTab === "flow" ? <FlowPanel flow={flow} /> : null}
      {activeTab === "palace" ? <LockedPanel text="八字年、月、日、时所居的位置，便是宫位。宫位标记着时间、空间、身体、六亲等，由此可以推演命主的诸多信息，是八字断命中不可忽略的侧面。问真八字宫位图示，清晰标明命主八字的宫位代表要素。" /> : null}
      {activeTab === "family" ? <LockedPanel text="命主的六亲，由五行间的生克关系推导，通过十神表达。六亲图示基于命盘要素清晰标明亲属关系，方便快速进行相关事项推导。" /> : null}
    </section>
  );
}

function FlowPanel({ flow }: { flow: BaziFlow }) {
  return (
    <div className="pt-10">
      <div className="rounded-[8px] bg-[#f0f0f0] px-5 py-7 text-center text-[18px] font-semibold leading-[1.55] text-[#222]">
        <p>流通代表八字五行循环相生、通行不悖，是判断命主格局层次的重要指标。</p>
        <p className="mt-3">下方按年、月、日、时宫位顺序，标明命盘天干与地支的具体流通走向。</p>
      </div>

      <div className="mt-9 rounded-[8px] border border-[#eee] px-4 py-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[16px] text-[#999]">流通判断</p>
            <p className="mt-1 text-[24px] font-semibold text-[#9b8749]">{flow.summary.level}</p>
          </div>
          <div className="rounded-full bg-[#f4efe4] px-4 py-2 text-[14px] font-semibold text-[#9b8749]">
            分值 {flow.summary.score}/12
          </div>
        </div>
        <p className="mt-3 text-[15px] leading-6 text-[#666]">{flow.summary.text}</p>
      </div>

      <ElementCycle counts={flow.elementCounts} />

      <FlowTrack title="天干流通" lines={flow.stemLines} />
      <FlowTrack title="地支流通" lines={flow.branchLines} />
    </div>
  );
}

function ElementCycle({ counts }: { counts: BaziFlow["elementCounts"] }) {
  return (
    <div className="mt-9">
      <p className="text-center text-[18px] font-semibold text-[#9b8749]">五行循环</p>
      <div className="mt-5 grid grid-cols-5 items-center gap-2">
        {counts.map((item, index) => (
          <div key={item.element} className="relative flex flex-col items-center">
            <span className={cn("flex h-10 w-10 items-center justify-center rounded-full border border-[#d8d8d8] bg-white text-[18px] font-semibold", getElementColorClass(item.element))}>
              {item.element}
            </span>
            <span className="mt-2 text-[13px] text-[#999]">{item.count}处</span>
            {index < counts.length - 1 ? <span className="absolute left-[calc(50%+22px)] top-5 h-px w-[calc(100%-28px)] bg-[#d7d7d7]" /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function FlowTrack({ title, lines }: { title: string; lines: FlowLine[] }) {
  return (
    <div className="mt-10">
      <p className="text-center text-[18px] font-semibold text-[#9b8749]">{title}</p>
      <div className="mt-5 space-y-4">
        {lines.map((line) => (
          <FlowStep key={`${title}-${line.fromTitle}-${line.toTitle}`} line={line} />
        ))}
      </div>
    </div>
  );
}

function FlowStep({ line }: { line: FlowLine }) {
  const isBlocked = line.relation === "克";

  return (
    <div className="grid grid-cols-[64px_1fr_64px] items-center gap-3">
      <FlowValue value={line.fromValue} element={line.fromElement} title={line.fromTitle} />
      <div className="relative flex items-center justify-center">
        <span className={cn("absolute left-0 right-0 top-1/2 h-px -translate-y-1/2", isBlocked ? "bg-[#dec9c9]" : "bg-[#d7d7d7]")} />
        <span className="relative flex min-w-[76px] items-center justify-center gap-1 bg-white px-2 text-[14px] text-[#666]">
          {line.direction === "backward" ? <ArrowLeft size={15} strokeWidth={1.8} /> : null}
          <span className={cn(isBlocked ? "text-[#a65b5b]" : "text-[#666]")}>{line.relation}</span>
          {line.direction !== "backward" ? <ArrowRight size={15} strokeWidth={1.8} /> : null}
        </span>
      </div>
      <FlowValue value={line.toValue} element={line.toElement} title={line.toTitle} />
    </div>
  );
}

function FlowValue({ value, element, title }: { value: string; element: FiveElement; title: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className={cn("flex h-9 w-9 items-center justify-center rounded-full border border-[#d8d8d8] bg-white text-[16px] font-semibold", getElementColorClass(element))}>
        {value}
      </span>
      <span className="mt-1 text-[12px] text-[#aaa]">{title.replace("柱", "")}</span>
    </div>
  );
}

function GanzhiPanel({ columns, relations }: { columns: ChartColumn[]; relations: ReturnType<typeof buildRelations> }) {
  return (
    <div className="pt-10">
      <RelationLines title="天干关系" relations={relations.stemLines} />

      <div className="mt-12 grid grid-cols-4 items-center text-center">
        {columns.map((column) => (
          <p key={column.title} className="text-[22px] text-[#999]">{column.title}</p>
        ))}
        {columns.map((column) => (
          <p key={`${column.title}-stem`} className={cn("mt-5 text-[52px] leading-none font-semibold", getColorClass(column.pillar.stem))}>
            {column.pillar.stem}
          </p>
        ))}
        {columns.map((column) => (
          <p key={`${column.title}-branch`} className={cn("mt-6 text-[52px] leading-none font-semibold", getColorClass(column.pillar.branch))}>
            {column.pillar.branch}
          </p>
        ))}
      </div>

      <p className="mt-8 text-center text-[20px] text-[#9b8749]">{relations.pillarSummary}</p>
      <RelationLines title="地支关系" relations={relations.branchLines} lower />

      <div className="mt-16 flex justify-end">
        <button type="button" className="flex items-center gap-2 text-[22px] text-[#333]">
          <Settings size={25} />
          干支设置
        </button>
      </div>
    </div>
  );
}

function RelationLines({ title, relations, lower }: { title: string; relations: RelationLine[]; lower?: boolean }) {
  return (
    <div className={cn(lower ? "mt-12" : "", "space-y-4")}>
      <p className="text-center text-[18px] text-[#9b8749]">{title}</p>
      {relations.length ? (
        <div className="space-y-5">
          {relations.map((item) => (
            <LineRelation key={`${item.leftPillar}-${item.rightPillar}-${item.left}-${item.right}-${item.label}`} relation={item} />
          ))}
        </div>
      ) : (
        <p className="py-6 text-center text-[18px] text-[#aaa]">暂无明显关系</p>
      )}
    </div>
  );
}

function LineRelation({ relation }: { relation: RelationLine }) {
  const leftPosition = `${getPillarCenterPercent(relation.leftIndex)}%`;
  const width = `${(relation.rightIndex - relation.leftIndex) * 25}%`;

  return (
    <div className="relative h-8 text-[14px]">
      <span className="absolute top-1/2 h-px -translate-y-1/2 bg-[#d7d7d7]" style={{ left: leftPosition, width }} />
      <span className="absolute top-1/2 z-10 flex -translate-y-1/2 items-center justify-center text-[#666]" style={{ left: leftPosition, width }}>
        <span className="bg-white px-2 text-center leading-none">{relation.label}</span>
      </span>
      <span
        className={cn(
          "absolute top-0 z-20 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border border-[#d8d8d8] bg-white text-[14px]",
          getColorClass(relation.left)
        )}
        style={{ left: leftPosition }}
      >
        {relation.left}
      </span>
      <span
        className={cn(
          "absolute top-0 z-20 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border border-[#d8d8d8] bg-white text-[14px]",
          getColorClass(relation.right)
        )}
        style={{ left: `${getPillarCenterPercent(relation.rightIndex)}%` }}
      >
        {relation.right}
      </span>
    </div>
  );
}

function LockedPanel({ text }: { text: string }) {
  return (
    <div className="pt-28">
      <div className="rounded-[8px] bg-[#f0f0f0] px-6 py-10 text-center text-[22px] font-semibold leading-[1.65]">
        {text}
      </div>
      <div className="mt-10 flex justify-center">
        <button type="button" className="h-16 rounded-full bg-[#b89a5c] px-16 text-[26px] font-semibold text-white">
          开通会员解锁
        </button>
      </div>
    </div>
  );
}

type RelationLine = {
  left: string;
  right: string;
  leftIndex: number;
  rightIndex: number;
  leftPillar: string;
  rightPillar: string;
  label: string;
};

function getPillarCenterPercent(index: number) {
  return (index + 0.5) * 25;
}

function buildRelations(columns: ChartColumn[]) {
  const stemLines = buildPairLines(columns, "stem");
  const branchLines = buildPairLines(columns, "branch");
  const repeats = columns
    .map((column) => `${column.pillar.stem}${column.pillar.branch}`)
    .filter((pillar, index, all) => all.indexOf(pillar) !== index);

  return {
    stemLines,
    branchLines,
    pillarSummary: repeats.length ? `${Array.from(new Set(repeats)).join("、")}伏吟` : "原局干支关系"
  };
}

function buildPairLines(columns: ChartColumn[], type: "stem" | "branch") {
  const lines: RelationLine[] = [];

  columns.forEach((leftColumn, leftIndex) => {
    columns.slice(leftIndex + 1).forEach((rightColumn, slicedRightIndex) => {
      const rightIndex = leftIndex + slicedRightIndex + 1;
      const left = type === "stem" ? leftColumn.pillar.stem : leftColumn.pillar.branch;
      const right = type === "stem" ? rightColumn.pillar.stem : rightColumn.pillar.branch;
      const labels = type === "stem" ? getStemRelationLabels(left, right) : getBranchRelationLabels(left, right);

      labels.forEach((label) => {
        lines.push({
          left,
          right,
          leftIndex,
          rightIndex,
          leftPillar: leftColumn.title.replace("柱", ""),
          rightPillar: rightColumn.title.replace("柱", ""),
          label
        });
      });
    });
  });

  return lines;
}

function getStemRelationLabels(left: string, right: string) {
  const labels: string[] = [];
  const combo = findRule(left, right, STEM_COMBOS);

  if (combo) {
    labels.push(combo);
  }

  const control = getStemControlLabel(left, right);
  if (control) {
    labels.push(control);
  }

  return labels;
}

function getBranchRelationLabels(left: string, right: string) {
  return [
    findRule(left, right, BRANCH_COMBOS),
    findRule(left, right, BRANCH_CLASHES),
    findRule(left, right, BRANCH_HARMS),
    findRule(left, right, BRANCH_BREAKS),
    findRule(left, right, BRANCH_PUNISHMENTS),
    findRule(left, right, BRANCH_HALF_COMBOS)
  ].filter(Boolean) as string[];
}

function findRule(left: string, right: string, rules: Array<[string, string, string]>) {
  return rules.find(([ruleLeft, ruleRight]) => (ruleLeft === left && ruleRight === right) || (ruleLeft === right && ruleRight === left))?.[2];
}

function getStemControlLabel(left: string, right: string) {
  const leftElement = getElement(left);
  const rightElement = getElement(right);

  if (!leftElement || !rightElement) {
    return "";
  }

  if (controls(leftElement) === rightElement) {
    return "克";
  }

  if (controls(rightElement) === leftElement) {
    return "克";
  }

  return "";
}

function controls(element: string) {
  const map: Record<string, string> = {
    木: "土",
    土: "水",
    水: "火",
    火: "金",
    金: "木"
  };

  return map[element] ?? "";
}

const STEM_COMBOS: Array<[string, string, string]> = [
  ["甲", "己", "合化土"],
  ["乙", "庚", "合化金"],
  ["丙", "辛", "合化水"],
  ["丁", "壬", "合化木"],
  ["戊", "癸", "合化火"]
];

const BRANCH_COMBOS: Array<[string, string, string]> = [
  ["子", "丑", "六合土"],
  ["寅", "亥", "六合木"],
  ["卯", "戌", "六合火"],
  ["辰", "酉", "六合金"],
  ["巳", "申", "六合水"],
  ["午", "未", "六合土"]
];

const BRANCH_CLASHES: Array<[string, string, string]> = [
  ["子", "午", "冲"],
  ["丑", "未", "冲"],
  ["寅", "申", "冲"],
  ["卯", "酉", "冲"],
  ["辰", "戌", "冲"],
  ["巳", "亥", "冲"]
];

const BRANCH_HARMS: Array<[string, string, string]> = [
  ["子", "未", "害"],
  ["丑", "午", "害"],
  ["寅", "巳", "害"],
  ["卯", "辰", "害"],
  ["申", "亥", "害"],
  ["酉", "戌", "害"]
];

const BRANCH_BREAKS: Array<[string, string, string]> = [
  ["子", "酉", "破"],
  ["丑", "辰", "破"],
  ["寅", "亥", "破"],
  ["卯", "午", "破"],
  ["巳", "申", "破"],
  ["未", "戌", "破"]
];

const BRANCH_PUNISHMENTS: Array<[string, string, string]> = [
  ["寅", "巳", "刑"],
  ["巳", "申", "刑"],
  ["申", "寅", "刑"],
  ["丑", "戌", "刑"],
  ["戌", "未", "刑"],
  ["未", "丑", "刑"],
  ["子", "卯", "刑"]
];

const BRANCH_HALF_COMBOS: Array<[string, string, string]> = [
  ["申", "子", "半合水局"],
  ["子", "辰", "半合水局"],
  ["亥", "卯", "半合木局"],
  ["卯", "未", "半合木局"],
  ["寅", "午", "半合火局"],
  ["午", "戌", "半合火局"],
  ["巳", "酉", "半合金局"],
  ["酉", "丑", "半合金局"]
];

function getColorClass(value: string) {
  const element = getElement(value);
  return element ? getElementColorClass(element) : "text-[#333]";
}

function getElementColorClass(element: FiveElement) {
  const colors: Record<string, string> = {
    火: "text-[#c40000]",
    金: "text-[#bf8d10]",
    土: "text-[#8b6f43]",
    木: "text-[#2ea84c]",
    水: "text-[#3f7edb]"
  };

  return colors[element];
}

function getElement(value: string) {
  return getValueElement(value) ?? "";
}
