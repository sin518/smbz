"use client";

import { useEffect, useMemo, useState } from "react";
import { LunarUtil, Solar } from "lunar-typescript";
import { getSelfSeatStage } from "@/lib/bazi/changsheng";
import type { ChartColumn, LuckColumn } from "@/lib/bazi/demo";
import { calculateShenshaForPillar, type ShenshaContext } from "@/lib/bazi/shensha";
import type { EarthlyBranch, HeavenlyStem } from "@/lib/bazi";
import { cn } from "@/lib/utils";

type ProfessionalDetailProps = {
  columns: ChartColumn[];
  luckCycles: LuckColumn[];
  commander: string;
};

type DetailColumn = {
  title: string;
  mainStar: string;
  stem: string;
  branch: string;
  hiddenStems: string[];
  subStars: string[];
  phase: string;
  selfSeat: string;
  voidBranch: string;
  nayin: string;
  shensha: string[];
};

export function ProfessionalDetail({ columns, luckCycles, commander }: ProfessionalDetailProps) {
  const initialLuckIndex = Math.max(0, luckCycles.findIndex((item) => item.active));
  const [selectedLuckIndex, setSelectedLuckIndex] = useState(initialLuckIndex);
  const selectedLuck = luckCycles[selectedLuckIndex] ?? luckCycles[0];
  const years = useMemo(() => buildYearsForLuck(selectedLuck), [selectedLuck]);
  const initialYearIndex = Math.max(0, years.findIndex((item) => item.active));
  const [selectedYearIndex, setSelectedYearIndex] = useState(initialYearIndex);
  const selectedYear = years[selectedYearIndex] ?? years[0];
  const months = useMemo(() => buildMonthsForYear(Number(selectedYear?.year ?? new Date().getFullYear())), [selectedYear]);
  const initialMonthIndex = Math.max(0, months.findIndex((item) => item.active));
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(initialMonthIndex);
  const detailColumns = useMemo(() => buildDetailColumns(columns, selectedLuck, selectedYear), [columns, selectedLuck, selectedYear]);

  useEffect(() => {
    setSelectedMonthIndex(Math.max(0, months.findIndex((item) => item.active)));
  }, [months]);

  function handleLuckSelect(index: number) {
    const nextLuck = luckCycles[index] ?? luckCycles[0];
    const nextYears = buildYearsForLuck(nextLuck);
    const nextYearIndex = Math.max(0, nextYears.findIndex((item) => item.active));

    setSelectedLuckIndex(index);
    setSelectedYearIndex(nextYearIndex);
  }

  return (
    <section className="bg-paper pb-8 pt-4">
      <ProfessionalChart columns={detailColumns} />
      <div className="px-4 py-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[22px] bg-white px-4 py-4 text-[15px] leading-7 text-[#444] shadow-soft">
          <div>
            <p>起运：出生后4年10月17天10时起运</p>
            <p>交运：逢壬、丁年清明后2天交大运</p>
          </div>
          <div className="text-right">
            <p className="text-[18px]">40岁</p>
            <p>
              司令：<span className={getStemColorClass(getCommanderStem(commander))}>{getCommanderStem(commander)}</span>
            </p>
          </div>
        </div>
      </div>
      <LuckScroller title="大运" items={luckCycles} selectedIndex={selectedLuckIndex} onSelect={handleLuckSelect} />
      <LuckScroller title="流年" items={years} selectedIndex={selectedYearIndex} onSelect={setSelectedYearIndex} />
      <LuckScroller title="流月" items={months} selectedIndex={selectedMonthIndex} onSelect={setSelectedMonthIndex} />
    </section>
  );
}

function ProfessionalChart({ columns }: { columns: DetailColumn[] }) {
  return (
    <section className="mx-4 overflow-hidden rounded-[22px] bg-white shadow-soft">
      <div className="grid grid-cols-[64px_repeat(6,minmax(0,1fr))] text-center">
        <DetailLabel rowIndex={0}>日期</DetailLabel>
        {columns.map((column) => (
          <DetailCell key={column.title} rowIndex={0} muted>{column.title}</DetailCell>
        ))}

        <DetailLabel rowIndex={1}>主星</DetailLabel>
        {columns.map((column) => (
          <DetailCell key={column.title} rowIndex={1}>{column.mainStar}</DetailCell>
        ))}

        <DetailLabel rowIndex={2} large>天干</DetailLabel>
        {columns.map((column) => (
          <DetailPillarCell key={column.title} rowIndex={2} value={column.stem} />
        ))}

        <DetailLabel rowIndex={3} large>地支</DetailLabel>
        {columns.map((column) => (
          <DetailPillarCell key={column.title} rowIndex={3} value={column.branch} />
        ))}

        <DetailLabel rowIndex={4} stack>藏干</DetailLabel>
        {columns.map((column) => (
          <HiddenStemCell key={column.title} column={column} />
        ))}

        <DetailLabel rowIndex={5}>星运</DetailLabel>
        {columns.map((column) => (
          <DetailCell key={column.title} rowIndex={5}>{column.phase}</DetailCell>
        ))}

        <DetailLabel rowIndex={6}>自坐</DetailLabel>
        {columns.map((column) => (
          <DetailCell key={column.title} rowIndex={6}>{column.selfSeat}</DetailCell>
        ))}

        <DetailLabel rowIndex={7}>空亡</DetailLabel>
        {columns.map((column) => (
          <DetailCell key={column.title} rowIndex={7}>{column.voidBranch}</DetailCell>
        ))}

        <DetailLabel rowIndex={8}>纳音</DetailLabel>
        {columns.map((column) => (
          <DetailCell key={column.title} rowIndex={8}>{column.nayin}</DetailCell>
        ))}

        <DetailLabel rowIndex={9}>神煞</DetailLabel>
        {columns.map((column) => (
          <DetailShenshaCell key={column.title} items={column.shensha} />
        ))}
      </div>
    </section>
  );
}

function DetailLabel({ children, rowIndex, large, stack }: { children: React.ReactNode; rowIndex: number; large?: boolean; stack?: boolean }) {
  return (
    <div className={cn("flex items-center justify-center border-b border-[#ececec] px-2 text-[18px] text-[#999]", getDetailRowClass(rowIndex, large, stack))}>
      {children}
    </div>
  );
}

function DetailCell({ children, rowIndex, muted }: { children: React.ReactNode; rowIndex: number; muted?: boolean }) {
  return (
    <div className={cn("flex items-center justify-center border-b border-l border-[#ececec] px-1 text-[18px]", getDetailRowClass(rowIndex), muted && "text-[#999]")}>
      {children}
    </div>
  );
}

function DetailPillarCell({ value, rowIndex }: { value: string; rowIndex: number }) {
  return (
    <div className={cn("flex items-center justify-center border-b border-l border-[#ececec] px-1 text-[38px] font-semibold", getDetailRowClass(rowIndex, true), getStemColorClass(value))}>
      {value}
    </div>
  );
}

function HiddenStemCell({ column }: { column: DetailColumn }) {
  return (
    <div className={cn("flex flex-col items-center justify-center border-b border-l border-[#ececec] px-1 text-[15px] leading-7", getDetailRowClass(4, false, true))}>
      {column.hiddenStems.map((item, index) => {
        const stem = item.slice(0, 1);

        return (
          <p key={`${column.title}-${item}-${index}`} className="whitespace-nowrap">
            <span className={getStemColorClass(stem)}>{stem}</span>
            <span>{column.subStars[index] ? column.subStars[index] : item.slice(1)}</span>
          </p>
        );
      })}
    </div>
  );
}

function DetailShenshaCell({ items }: { items: string[] }) {
  return (
    <div className={cn("flex flex-col items-center justify-center border-b border-l border-[#ececec] px-1 text-[14px] leading-6 text-[#9b8749]", getDetailRowClass(9, false, true))}>
      {items.slice(0, 4).map((item) => (
        <p key={item} className="whitespace-nowrap">{item}</p>
      ))}
    </div>
  );
}

function getDetailRowClass(rowIndex: number, large?: boolean, stack?: boolean) {
  return cn(
    rowIndex % 2 === 0 ? "bg-white" : "bg-[#f8f8f8]",
    large ? "min-h-[86px]" : stack ? "min-h-[114px] py-3" : "min-h-[58px] py-3"
  );
}

function LuckScroller({ title, items, selectedIndex, onSelect }: { title: string; items: LuckColumn[]; selectedIndex: number; onSelect: (index: number) => void }) {
  const visibleItems = items.slice(0, 10);

  return (
    <div className="mx-4 mt-4 grid grid-cols-[52px_1fr] overflow-hidden rounded-[22px] bg-white shadow-soft">
      <div className="flex items-center justify-center border-r border-[#ebe7dd] text-[24px] font-semibold text-mutedInk [writing-mode:vertical-rl]">{title}</div>
      <div className="grid grid-cols-10 overflow-hidden">
        {visibleItems.map((item, index) => (
          <button
            key={`${title}-${item.year}-${index}`}
            type="button"
            onClick={() => onSelect(index)}
            className={cn(
              "min-w-0 border-r border-[#ebe7dd] px-0.5 py-2 text-center text-[11px]",
              index === selectedIndex && "bg-[#f6f0e2] font-semibold"
            )}
          >
            <p className="truncate">{item.year}</p>
            {item.age ? <p className="truncate text-[9px]">{formatDenseAge(item.age)}</p> : null}
            <p className={cn("mt-1 text-[20px] leading-tight", getStemColorClass(item.stem))}>{item.stem}</p>
            <p className={cn("text-[20px] leading-tight", getStemColorClass(item.branch))}>{item.branch}</p>
            <p className="mt-0.5 truncate text-[9px] text-[#b00020]">{item.tags.join(" ")}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function buildDetailColumns(columns: ChartColumn[], selectedLuck: LuckColumn, selectedYear: LuckColumn): DetailColumn[] {
  const natalContext: ShenshaContext = {
    year: columns[0].pillar,
    month: columns[1].pillar,
    day: columns[2].pillar,
    time: columns[3].pillar
  };
  const dayStem = columns[2].pillar.stem;

  return [
    buildLuckDetailColumn("流年", selectedYear, dayStem, natalContext),
    buildLuckDetailColumn("大运", selectedLuck, dayStem, natalContext),
    ...columns.map((column) => ({
      title: column.title,
      mainStar: column.mainStar,
      stem: column.pillar.stem,
      branch: column.pillar.branch,
      hiddenStems: column.hiddenStems,
      subStars: column.subStars,
      phase: column.phase,
      selfSeat: column.selfSeat,
      voidBranch: column.voidBranch,
      nayin: column.nayin,
      shensha: column.shensha
    }))
  ];
}

function buildLuckDetailColumn(title: string, item: LuckColumn, dayStem: HeavenlyStem, natalContext: ShenshaContext): DetailColumn {
  const stem = isHeavenlyStem(item.stem) ? item.stem : natalContext.day.stem;
  const branch = isEarthlyBranch(item.branch) ? item.branch : natalContext.day.branch;
  const hiddenStems = getHiddenStemsForBranch(branch);
  const pillar = { stem, branch };

  return {
    title,
    mainStar: getTenGod(dayStem, stem),
    stem,
    branch,
    hiddenStems,
    subStars: hiddenStems.map((item) => getTenGod(dayStem, item.slice(0, 1) as HeavenlyStem)),
    phase: getSelfSeatStage(dayStem, branch),
    selfSeat: getSelfSeatStage(stem, branch),
    voidBranch: getXunKong(`${stem}${branch}`),
    nayin: getNayin(`${stem}${branch}`),
    shensha: calculateShenshaForPillar(pillar, natalContext)
  };
}

function buildYearsForLuck(luck: LuckColumn) {
  const startYear = Number(luck?.year) || new Date().getFullYear();
  const currentYear = new Date().getFullYear();

  return Array.from({ length: 10 }, (_, index) => {
    const year = startYear + index;
    const ganZhi = Solar.fromYmd(year, 6, 1).getLunar().getYearInGanZhiByLiChun();

    return {
      year: String(year),
      age: "",
      stem: ganZhi.slice(0, 1),
      branch: ganZhi.slice(1, 2),
      tags: [],
      active: year === currentYear
    };
  });
}

function buildMonthsForYear(year: number): LuckColumn[] {
  const terms = [
    ["立春", 2, 5],
    ["惊蛰", 3, 6],
    ["清明", 4, 6],
    ["立夏", 5, 6],
    ["芒种", 6, 6],
    ["小暑", 7, 8],
    ["立秋", 8, 8],
    ["白露", 9, 8],
    ["寒露", 10, 9],
    ["立冬", 11, 8]
  ] as const;
  const today = new Date();

  return terms.map(([term, month, day], index) => {
    const ganZhi = Solar.fromYmd(year, month, day).getLunar().getMonthInGanZhiExact();

    return {
      year: term,
      age: `${month}/${day - 1}`,
      stem: ganZhi.slice(0, 1),
      branch: ganZhi.slice(1, 2),
      tags: [],
      active: today.getFullYear() === year ? today.getMonth() + 1 === month : index === 0
    };
  });
}

function getHiddenStemsForBranch(branch: EarthlyBranch) {
  const hidden: Record<EarthlyBranch, string[]> = {
    子: ["癸水"],
    丑: ["己土", "癸水", "辛金"],
    寅: ["甲木", "丙火", "戊土"],
    卯: ["乙木"],
    辰: ["戊土", "乙木", "癸水"],
    巳: ["丙火", "戊土", "庚金"],
    午: ["丁火", "己土"],
    未: ["己土", "丁火", "乙木"],
    申: ["庚金", "壬水", "戊土"],
    酉: ["辛金"],
    戌: ["戊土", "辛金", "丁火"],
    亥: ["壬水", "甲木"]
  };

  return hidden[branch] ?? [];
}

function getNayin(ganZhi: string) {
  return LunarUtil.NAYIN[ganZhi] ?? "—";
}

function getXunKong(ganZhi: string) {
  return LunarUtil.getXunKong(ganZhi) || "—";
}

function getTenGod(dayStem: HeavenlyStem, targetStem: HeavenlyStem) {
  const day = STEM_META[dayStem];
  const target = STEM_META[targetStem];

  if (!day || !target) {
    return "—";
  }

  if (target.element === day.element) {
    return target.yinYang === day.yinYang ? "比肩" : "劫财";
  }

  if (generates(day.element) === target.element) {
    return target.yinYang === day.yinYang ? "食神" : "伤官";
  }

  if (controls(day.element) === target.element) {
    return target.yinYang === day.yinYang ? "偏财" : "正财";
  }

  if (generates(target.element) === day.element) {
    return target.yinYang === day.yinYang ? "偏印" : "正印";
  }

  return target.yinYang === day.yinYang ? "七杀" : "正官";
}

function generates(element: Element) {
  const map: Record<Element, Element> = {
    木: "火",
    火: "土",
    土: "金",
    金: "水",
    水: "木"
  };

  return map[element];
}

function controls(element: Element) {
  const map: Record<Element, Element> = {
    木: "土",
    土: "水",
    水: "火",
    火: "金",
    金: "木"
  };

  return map[element];
}

function formatDenseAge(age: string) {
  return age.replace(/~.*岁$/, "岁");
}

function getStemColorClass(value: string) {
  const element = getElement(value);
  const colors: Record<Element, string> = {
    火: "text-[#c40000]",
    金: "text-[#bf8d10]",
    土: "text-[#8b6f43]",
    木: "text-[#2ea84c]",
    水: "text-[#3f7edb]"
  };

  return element ? colors[element] : "";
}

function getCommanderStem(value: string) {
  return /｜(.).+用事/.exec(value)?.[1] ?? value.slice(0, 1);
}

function isHeavenlyStem(value: string): value is HeavenlyStem {
  return ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"].includes(value);
}

function isEarthlyBranch(value: string): value is EarthlyBranch {
  return ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"].includes(value);
}

type Element = "木" | "火" | "土" | "金" | "水";

const STEM_META: Record<HeavenlyStem, { element: Element; yinYang: "阳" | "阴" }> = {
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

function getElement(value: string) {
  const branchElements: Record<string, Element> = {
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

  return isHeavenlyStem(value) ? STEM_META[value].element : branchElements[value] ?? undefined;
}
