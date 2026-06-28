"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import type { BaziInfoCategory } from "@/components/bazi/bazi-info-category-tabs";
import { branchElements, controls, hiddenStems, stemElements } from "@/lib/bazi/five-elements";
import { LoginBlurGate } from "@/components/shared/login-blur-gate";
import {
  buildPatternProfile,
  comboDescriptions,
  comboOptions,
  patternDescriptions,
  patternOptions,
  strengthDescriptions,
  strengthOptions,
  type ElementRole,
  type PatternProfile,
  type StrengthKey
} from "@/lib/bazi/pattern-profile";
import type { ChartColumn, LuckColumn } from "@/lib/bazi/demo";
import { cn } from "@/lib/utils";

type BaziPatternProfilePanelProps = {
  columns: ChartColumn[];
  luckCycles?: LuckColumn[];
  years?: LuckColumn[];
};

const elementColorClasses: Record<ElementRole["element"], string> = {
  木: "text-[#4d9b59]",
  火: "text-[#d94e3f]",
  土: "text-[#aa8750]",
  金: "text-[#c39135]",
  水: "text-[#4e8ccd]"
};

const reportCards: Record<BaziInfoCategory, { title: string }> = {
  事业谋划: { title: "事业谋划" },
  婚姻剖析: { title: "婚姻剖析" },
  财运前瞻: { title: "财运前瞻" },
  月度总结: { title: "月度总结" }
};

const pillarLabels = ["年柱", "月柱", "日柱", "时柱"] as const;
const yearStems = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;
const yearBranches = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;

export function BaziPatternProfilePanel({ columns }: BaziPatternProfilePanelProps) {
  const profile = useMemo(() => buildPatternProfile(columns), [columns]);
  const [selectedRoleKey, setSelectedRoleKey] = useState(profile.elementRoles[0]?.key ?? "喜");
  const [patternOpen, setPatternOpen] = useState(false);
  const [comboOpen, setComboOpen] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState(profile.selectedPattern);
  const [selectedCombo, setSelectedCombo] = useState(profile.primaryCombo);
  const selectedRole = profile.elementRoles.find((item) => item.key === selectedRoleKey) ?? profile.elementRoles[0];

  return (
    <div className="border-b-0 py-4">
      <section className="rounded-[12px] border border-[#eee1c8] bg-white px-4 py-4 text-ink shadow-[0_8px_24px_rgba(16,14,10,0.04)]">
        <div className="space-y-4">
          <section>
            <div className="mb-2 flex items-center justify-between text-[13px] font-semibold">
              <span>旺衰</span>
              <span className="text-[#8a6a24]">{profile.strength}</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-[12px] font-semibold">
              {strengthOptions.map((item) => (
                <StrengthPill key={item} item={item} active={item === profile.strength} />
              ))}
            </div>
            <p className="mt-2 rounded-[8px] bg-[#fbfaf4] px-3 py-2 text-[12px] leading-5 text-mutedInk">
              {strengthDescriptions[profile.strength]}
            </p>
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between text-[13px] font-semibold">
              <span>喜忌</span>
              <ChevronUp size={14} strokeWidth={2} className="text-[#d2a15b]" />
            </div>
            <div className="grid grid-cols-5 gap-1.5 text-center">
              {profile.elementRoles.map((item) => (
                <ElementRoleCard key={item.key} item={item} active={item.key === selectedRole?.key} onClick={() => setSelectedRoleKey(item.key)} />
              ))}
            </div>
            {selectedRole ? (
              <p className="mt-2 rounded-[8px] bg-[#fbfaf4] px-3 py-2 text-[12px] leading-5 text-mutedInk">
                <span className="font-semibold text-[#8a6a24]">{selectedRole.key}{selectedRole.element}：</span>
                {selectedRole.description}
              </p>
            ) : null}
          </section>

          <DrawerSection
            title="格局"
            value={profile.selectedPattern}
            open={patternOpen}
            onToggle={() => setPatternOpen((value) => !value)}
          >
            <div className="grid grid-cols-4 gap-x-2 gap-y-2 text-[12px] font-semibold">
              {patternOptions.map((item) => (
                <OptionChip key={item} active={item === selectedPattern} activeTone="neutral" onClick={() => setSelectedPattern(item)}>
                  {item}
                </OptionChip>
              ))}
            </div>
            <Explanation title={selectedPattern} body={patternDescriptions[selectedPattern]} />
          </DrawerSection>

          <DrawerSection
            title="十神组合"
            value={profile.primaryCombo}
            open={comboOpen}
            onToggle={() => setComboOpen((value) => !value)}
          >
            <div className="grid grid-cols-4 gap-x-2 gap-y-2 text-[12px] font-semibold">
              {comboOptions.map((item) => (
                <OptionChip key={item} active={item === selectedCombo} muted={profile.activeCombos.includes(item) && item !== selectedCombo} onClick={() => setSelectedCombo(item)}>
                  {item}
                </OptionChip>
              ))}
            </div>
            <Explanation title={selectedCombo} body={comboDescriptions[selectedCombo]} />
          </DrawerSection>
        </div>
      </section>
    </div>
  );
}

export function BaziTopicReportStack({ columns, luckCycles = [], years = [] }: BaziPatternProfilePanelProps) {
  const profile = useMemo(() => buildPatternProfile(columns), [columns]);

  return (
    <div className="border-b-0 pb-4">
      <AnalysisReportStack columns={columns} profile={profile} luckCycles={luckCycles} years={years} />
    </div>
  );
}

function AnalysisReportStack({ columns, profile, luckCycles, years }: { columns: ChartColumn[]; profile: PatternProfile; luckCycles: LuckColumn[]; years: LuckColumn[] }) {
  return (
    <section className="space-y-3">
      {(Object.keys(reportCards) as BaziInfoCategory[]).map((category, index) => (
        <AnalysisReportCard key={category} category={category} index={index} columns={columns} profile={profile} luckCycles={luckCycles} years={years} />
      ))}
    </section>
  );
}

function AnalysisReportCard({
  category,
  index,
  columns,
  profile,
  luckCycles,
  years
}: {
  category: BaziInfoCategory;
  index: number;
  columns: ChartColumn[];
  profile: PatternProfile;
  luckCycles: LuckColumn[];
  years: LuckColumn[];
}) {
  const report = reportCards[category];

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-[10px] bg-[#151326] text-white shadow-[0_10px_24px_rgba(22,18,40,0.16)]"
      )}
      style={{ zIndex: 10 - index }}
    >
      <div className={cn("relative px-4 py-4", category !== "月度总结" ? "min-h-[174px]" : "min-h-[92px]")}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(215,170,92,0.28),transparent_26%),linear-gradient(105deg,#17142a_0%,#262039_48%,#161425_100%)]" />
        <div className="absolute left-5 top-1/2 h-px w-[84px] -translate-y-1/2 bg-gradient-to-r from-transparent via-[#b79555] to-[#b79555] opacity-70" />
        <div className="absolute right-5 top-1/2 h-px w-[84px] -translate-y-1/2 bg-gradient-to-l from-transparent via-[#b79555] to-[#b79555] opacity-70" />
        <div className="relative flex min-h-[60px] items-center justify-center">
          <p className="text-center text-[20px] font-semibold tracking-[0.16em] text-[#ead7aa]">{report.title}</p>
        </div>
        {category !== "月度总结" ? <TopicBaziMiniChart category={category} columns={columns} /> : null}
        {category === "事业谋划" ? (
          <LoginBlurGate>
            <CareerPatternDetails columns={columns} profile={profile} luckCycles={luckCycles} years={years} />
          </LoginBlurGate>
        ) : null}
      </div>
    </article>
  );
}

type BaziHighlight = {
  value: string;
  badge: string;
};

function TopicBaziMiniChart({ category, columns }: { category: BaziInfoCategory; columns: ChartColumn[] }) {
  const dayColumn = columns.find((column) => column.title === "日柱") ?? columns[2];
  const highlights = getTopicHighlights(category, columns, dayColumn);

  function getCellHighlight(value: string) {
    return highlights.find((item) => item.value === value);
  }

  return (
    <div className="relative mt-2 rounded-[8px] bg-white px-3 py-2 text-[#aaa49d] shadow-[inset_0_0_0_1px_rgba(226,218,207,0.75)]">
      <div className="grid grid-cols-[22px_repeat(4,minmax(0,1fr))] items-center gap-y-1 text-center">
        <p className="text-[10px] leading-4 text-[#c9c3bc] [writing-mode:vertical-rl]">天干</p>
        {columns.map((column, index) => {
          const highlight = getCellHighlight(column.pillar.stem);
          return (
            <BaziMiniCell
              key={`${category}-stem-${column.title}`}
              label={pillarLabels[index]}
              value={column.pillar.stem}
              active={Boolean(highlight)}
              badge={highlight?.badge}
            />
          );
        })}
        <p className="text-[10px] leading-4 text-[#c9c3bc] [writing-mode:vertical-rl]">地支</p>
        {columns.map((column) => {
          const highlight = getCellHighlight(column.pillar.branch);
          return (
            <BaziMiniCell
              key={`${category}-branch-${column.title}`}
              value={column.pillar.branch}
              active={Boolean(highlight)}
              badge={highlight?.badge}
            />
          );
        })}
      </div>
    </div>
  );
}

function getTopicHighlights(category: BaziInfoCategory, columns: ChartColumn[], dayColumn?: ChartColumn): BaziHighlight[] {
  if (category === "事业谋划") {
    const luBranch = getLuBranch(dayColumn?.pillar.stem ?? "");
    return luBranch ? [{ value: luBranch, badge: "禄" }] : [];
  }

  if (category === "婚姻剖析") {
    const spousePalace = dayColumn?.pillar.branch;
    return spousePalace ? [{ value: spousePalace, badge: "婚" }] : [];
  }

  if (category === "财运前瞻") {
    const dayElement = dayColumn ? stemElements[dayColumn.pillar.stem] : undefined;
    const wealthElement = dayElement ? controls[dayElement] : undefined;

    return columns
      .flatMap((column) => {
        const values: string[] = [column.pillar.stem];
        const branchElement = branchElements[column.pillar.branch];
        const branchHidesWealth = hiddenStems[column.pillar.branch]?.some((item) => item.element === wealthElement);

        if (branchElement === wealthElement || branchHidesWealth) {
          values.push(column.pillar.branch);
        }

        return values;
      })
      .filter((value, index, values) => values.indexOf(value) === index)
      .filter((value) => (stemElements[value] ?? branchElements[value]) === wealthElement || hiddenStems[value]?.some((item) => item.element === wealthElement))
      .map((value) => ({ value, badge: "财" }));
  }

  return [];
}

function CareerPatternDetails({ columns, profile, luckCycles, years }: { columns: ChartColumn[]; profile: PatternProfile; luckCycles: LuckColumn[]; years: LuckColumn[] }) {
  const dayColumn = columns.find((column) => column.title === "日柱") ?? columns[2];
  const monthColumn = columns.find((column) => column.title === "月柱") ?? columns[1];
  const luBranch = getLuBranch(dayColumn?.pillar.stem ?? "");
  const luColumn = columns.find((column) => column.pillar.branch === luBranch);
  const comboParts = splitCareerCombo(profile.primaryCombo);
  const careerGods = getCareerTenGods(columns);
  const harmonyBranches = getHarmonyBranches(luBranch);
  const overview = buildCareerOverview(profile, dayColumn, monthColumn, luColumn);
  const advantage = buildCareerAdvantage(profile, careerGods, luColumn);
  const weakness = buildCareerWeakness(profile, careerGods);
  const careerGodText = buildCareerGodText(careerGods, profile);

  return (
    <section className="relative mt-3 rounded-[9px] bg-white px-3 py-3 text-[#6f6a62] shadow-[inset_0_0_0_1px_rgba(230,220,205,0.85)]">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h4 className="text-[14px] font-semibold text-[#2f2b26]">事业总格局</h4>
        <p className="shrink-0 text-[12px] font-semibold text-[#8a6a24]">{profile.primaryCombo}</p>
      </div>

      <div className="grid grid-cols-[42px_1fr] gap-x-2 gap-y-2">
        {comboParts.map((part) => (
          <CareerTraitRow key={part} label={part} description={buildCareerTraitDescription(part, columns, profile)} />
        ))}
      </div>

      <p className="mt-3 border-t border-[#f0e8dc] pt-3 text-[12px] leading-5 text-[#6f6a62]">
        {overview}
      </p>

      <CareerTextBlock
        title="职场优势"
        body={advantage}
      />
      <CareerTextBlock
        title="职场劣势"
        body={weakness}
      />

      <div className="mt-3 border-t border-[#f0e8dc] pt-3">
        <div className="mb-2 flex items-center justify-between">
          <h5 className="text-[13px] font-semibold text-[#2f2b26]">事业宫十神</h5>
          <span className="text-[11px] text-[#b08a50]">{careerGods.join("、")}</span>
        </div>
        <p className="text-[12px] leading-5 text-[#6f6a62]">
          {careerGodText}
        </p>
      </div>

      {harmonyBranches.length > 0 ? (
        <div className="mt-3 border-t border-[#f0e8dc] pt-3">
          <h5 className="mb-2 text-[13px] font-semibold text-[#2f2b26]">与你事业相合的属相</h5>
          <div className="flex gap-4">
            {harmonyBranches.map((branch) => (
              <span key={branch} className="flex h-8 w-8 items-center justify-center rounded-full border border-[#edd6b9] bg-[#fffaf4] text-[14px] font-semibold text-[#9a6c2f]">
                {branch}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <CareerTimingForecast columns={columns} profile={profile} luckCycles={luckCycles} years={years} />
    </section>
  );
}

type CareerTimingItem = {
  title: string;
  stars: number;
  tags: string[];
  body: string;
};

function CareerTimingForecast({ columns, profile, luckCycles, years }: { columns: ChartColumn[]; profile: PatternProfile; luckCycles: LuckColumn[]; years: LuckColumn[] }) {
  const items = buildCareerTimingItems(columns, profile, luckCycles, years);

  return (
    <div className="mt-3 border-t border-[#f0e8dc] pt-3">
      <div className="space-y-3">
        {items.map((item) => (
          <section key={item.title} className="border-b border-[#f0e8dc] pb-3 last:border-b-0 last:pb-0">
            <div className="mb-2 flex items-center gap-1.5">
              <h5 className="text-[13px] font-semibold text-[#2f2b26]">{item.title}</h5>
              <StarRating value={item.stars} />
            </div>
            <div className="mb-2 flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <span key={tag} className="rounded-[4px] border border-[#f0d8bf] bg-[#fff3e8] px-2 py-0.5 text-[11px] font-medium text-[#c47f3f]">
                  {tag}
                </span>
              ))}
            </div>
            <p className="text-[12px] leading-5 text-[#6f6a62]">{item.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}

function StarRating({ value }: { value: number }) {
  return (
    <span className="text-[12px]" aria-label={`${value}星`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index} className={index < value ? "text-[#d6a052]" : "text-[#eadfce]"}>
          ★
        </span>
      ))}
    </span>
  );
}

function CareerTraitRow({ label, description }: { label: string; description: string }) {
  return (
    <>
      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e5caa8] bg-white text-[12px] font-semibold text-[#c47f3f]">
        {label}
      </span>
      <p className="flex min-h-9 items-center text-[12px] leading-5 text-[#6f6a62]">{description}</p>
    </>
  );
}

function CareerTextBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-3 border-t border-[#f0e8dc] pt-3">
      <h5 className="mb-1 text-[13px] font-semibold text-[#2f2b26]">{title}</h5>
      <p className="text-[12px] leading-5 text-[#6f6a62]">{body}</p>
    </div>
  );
}

function splitCareerCombo(combo: string) {
  return combo.split("配").filter(Boolean);
}

const careerTraitDescriptions: Record<string, string> = {
  官杀: "有责任心、思维缜密、尊重领导，规则感强。",
  印: "心态稳，不怕事，能把压力转成学习与资质沉淀。",
  食伤: "有表达欲和输出能力，适合用技能、内容或方案显化价值。",
  比劫: "行动力与自主性较强，适合竞争型、协作型任务。",
  财: "重结果、资源与回报，适合围绕现实收益做规划。"
};

function buildCareerTraitDescription(part: string, columns: ChartColumn[], profile: PatternProfile) {
  const relatedGods = getGodsByGroup(part, columns);
  const base = careerTraitDescriptions[part] ?? comboDescriptions[profile.primaryCombo] ?? "结合当前命盘观察事业推进方式。";

  if (relatedGods.length === 0) {
    return base;
  }

  return `${relatedGods.join("、")}入局，${base}`;
}

function buildCareerOverview(profile: PatternProfile, dayColumn?: ChartColumn, monthColumn?: ChartColumn, luColumn?: ChartColumn) {
  const dayText = dayColumn ? `日主${dayColumn.pillar.stem}${dayColumn.pillar.branch}` : "日主";
  const monthText = monthColumn ? `月柱${monthColumn.pillar.stem}${monthColumn.pillar.branch}` : "月令";
  const luText = luColumn ? `禄神落在${luColumn.title}${luColumn.pillar.branch}` : "禄神不显于四柱地支";

  return `${dayText}，当前判为${profile.strength}，格局取${profile.selectedPattern}，事业主线为${profile.primaryCombo}。${monthText}定职业环境基调，${luText}；宜把规则压力转成资质、经验和稳定输出。`;
}

function buildCareerAdvantage(profile: PatternProfile, careerGods: string[], luColumn?: ChartColumn) {
  const luText = luColumn ? `禄神在${luColumn.title}，说明行动根气有落点；` : "";
  const officerText = careerGods.some((god) => ["正官", "七杀"].includes(god)) ? "官杀入局，适合有制度、目标和责任边界的岗位；" : "";
  const sealText = careerGods.some((god) => ["正印", "偏印"].includes(god)) ? "印星能承接压力，利学习、证书、专业训练和贵人资源。" : "若能补足印星式的学习与方法论，事业承载会更稳。";

  return `${profile.primaryCombo}成局。${luText}${officerText}${sealText}`;
}

function buildCareerWeakness(profile: PatternProfile, careerGods: string[]) {
  if (profile.strength === "弱" || profile.strength === "从弱") {
    return "日主偏弱，事业上不宜过早硬扛过量职责；遇到高压目标时，要先补足资源、流程和支持系统。";
  }

  if (careerGods.some((god) => ["食神", "伤官"].includes(god))) {
    return "食伤入局，想法与表达容易外放；需要避免一时锋芒冲撞规则，把输出落到可交付成果上。";
  }

  return "事业结构虽有主线，但临场表达和主动争取仍需训练；遇到变化时，提前准备方案会更稳。";
}

function buildCareerGodText(careerGods: string[], profile: PatternProfile) {
  if (careerGods.includes("七杀")) {
    return `七杀入局，事业上容易遇到竞争、指标和压力；${profile.primaryCombo.includes("印") ? "有印星承接时，可把压力化成资质和专业权威。" : "需看是否有印星或食伤来化解压力。"}`;
  }

  if (careerGods.includes("正官")) {
    return `正官入局，重规则、岗位责任和名誉秩序；配合${profile.primaryCombo}，适合在稳定体系中持续晋升。`;
  }

  return "事业宫十神以当前命局主线为准，重点看责任压力、印星承接和持续输出是否流通。";
}

function buildCareerTimingItems(columns: ChartColumn[], profile: PatternProfile, luckCycles: LuckColumn[], years: LuckColumn[]): CareerTimingItem[] {
  const dayColumn = columns.find((column) => column.title === "日柱") ?? columns[2];
  const dayElement = dayColumn ? stemElements[dayColumn.pillar.stem] : undefined;
  const wealthElement = dayElement ? controls[dayElement] : undefined;
  const luBranch = getLuBranch(dayColumn?.pillar.stem ?? "");
  const futureYears = getFutureLuckYears(years);
  const activeLuck = luckCycles.find((item) => item.active) ?? luckCycles[0];
  const changeYear = pickLuckYear(futureYears, (item) => getLuckBranch(item) === luBranch || getLuckStem(item) === dayColumn?.pillar.stem) ?? futureYears[0];
  const clashBranch = getOppositeBranch(luBranch || (dayColumn?.pillar.branch ?? ""));
  const clashYear = pickLuckYear(futureYears, (item) => getLuckBranch(item) === clashBranch) ?? futureYears[1] ?? futureYears[0];
  const harmonyBranches = getHarmonyBranches(luBranch);
  const harmonyYear = pickLuckYear(futureYears, (item) => {
    const branch = getLuckBranch(item);
    return harmonyBranches.includes(branch) || (wealthElement ? branchElements[branch] === wealthElement : false);
  }) ?? futureYears[2] ?? futureYears[0];
  const changeTag = formatLuckTag(changeYear, activeLuck);
  const clashTag = formatLuckTag(clashYear);
  const harmonyTag = formatLuckTag(harmonyYear);

  return [
    {
      title: "事业大变动",
      stars: 4,
      tags: [changeTag],
      body: `代表事业阶段出现明显转折。${changeYear ? `${getLuckGanZhi(changeYear)}流年触动命盘事业关键点，` : ""}${profile.strength === "弱" ? "弱身宜先补资源与支持，再承接新职责。" : "可主动争取岗位变化、项目升级或专业转型。"}`
    },
    {
      title: "冲击事业宫",
      stars: 3,
      tags: [clashTag],
      body: `事业宫容易受到外部环境冲击。${clashYear ? `${getLuckGanZhi(clashYear)}流年` : "对应流年"}需注意目标调整、团队变化或工作节奏突变，宜提前留出缓冲。`
    },
    {
      title: "合旺事业",
      stars: 3,
      tags: [harmonyTag],
      body: `事业状态有被带动的机会。${harmonyYear ? `${getLuckGanZhi(harmonyYear)}流年` : "对应流年"}与命盘形成相合或财星牵引时，适合推进资源合作、职位申请和长期计划。`
    }
  ];
}

function getFutureLuckYears(years: LuckColumn[]) {
  const currentYear = new Date().getFullYear();
  const future = years.filter((item) => Number(item.year) >= currentYear);
  return future.length > 0 ? future : years;
}

function pickLuckYear(years: LuckColumn[], predicate: (item: LuckColumn) => boolean) {
  return years.find(predicate);
}

function formatLuckTag(year?: LuckColumn, fallback?: LuckColumn) {
  const item = year ?? fallback;

  if (!item) {
    return "流年待定";
  }

  return `${item.year}${getLuckGanZhi(item)}年`;
}

function getLuckGanZhi(item: LuckColumn) {
  return `${getLuckStem(item)}${getLuckBranch(item)}`;
}

function getLuckStem(item: LuckColumn) {
  if (stemElements[String(item.stem)]) {
    return String(item.stem);
  }

  return getYearGanZhi(item.year).stem;
}

function getLuckBranch(item: LuckColumn) {
  if (branchElements[String(item.branch)]) {
    return String(item.branch);
  }

  return getYearGanZhi(item.year).branch;
}

function getYearGanZhi(yearText: string) {
  const year = Number(yearText);

  if (!Number.isFinite(year)) {
    return { stem: "", branch: "" };
  }

  const index = ((year - 1984) % 60 + 60) % 60;
  return {
    stem: yearStems[index % 10],
    branch: yearBranches[index % 12]
  };
}

function getOppositeBranch(branch: string) {
  const opposites: Record<string, string> = {
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

  return opposites[branch] ?? "";
}

function getCareerTenGods(columns: ChartColumn[]) {
  const gods = columns
    .flatMap((column) => [column.mainStar, ...column.subStars])
    .filter((god) => ["正官", "七杀", "正印", "偏印", "食神", "伤官"].includes(god));

  return Array.from(new Set(gods)).slice(0, 3).length > 0 ? Array.from(new Set(gods)).slice(0, 3) : ["官杀", "印星"];
}

function getGodsByGroup(group: string, columns: ChartColumn[]) {
  const groupMap: Record<string, string[]> = {
    官杀: ["正官", "七杀"],
    印: ["正印", "偏印"],
    食伤: ["食神", "伤官"],
    比劫: ["比肩", "劫财"],
    财: ["正财", "偏财"]
  };
  const allowed = groupMap[group] ?? [];

  return Array.from(new Set(columns.flatMap((column) => [column.mainStar, ...column.subStars]).filter((god) => allowed.includes(god))));
}

function getHarmonyBranches(branch: string) {
  const groups = [
    ["申", "子", "辰"],
    ["亥", "卯", "未"],
    ["寅", "午", "戌"],
    ["巳", "酉", "丑"]
  ];

  return groups.find((group) => group.includes(branch)) ?? [];
}

function BaziMiniCell({ label, value, active = false, badge }: { label?: string; value: string; active?: boolean; badge?: string }) {
  const element = stemElements[value] ?? branchElements[value];

  return (
    <div className="relative flex min-h-[38px] flex-col items-center justify-center">
      {label ? <p className="mb-0.5 text-[10px] leading-3 text-[#bcb6ae]">{label}</p> : null}
      <span
        className={cn(
          "relative flex h-8 w-8 items-center justify-center rounded-full text-[20px] font-semibold text-[#aaa49d]",
          active && element && elementColorClasses[element],
          active && "border border-[#d8a15c] bg-white shadow-[0_2px_8px_rgba(205,151,83,0.18)]"
        )}
      >
        {value}
        {badge ? <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border border-[#d8a15c] bg-white text-[9px] font-semibold text-[#c78a42]">{badge}</span> : null}
      </span>
    </div>
  );
}

function getLuBranch(stem: string) {
  const luBranches: Record<string, string> = {
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

  return luBranches[stem] ?? "";
}

function StrengthPill({ item, active }: { item: StrengthKey; active: boolean }) {
  return (
    <p className={cn("rounded-[6px] px-2 py-2 text-mutedInk", active && "bg-[#fbefe5] text-[#d08a43]")}>
      {item}
    </p>
  );
}

function ElementRoleCard({ item, active, onClick }: { item: ElementRole; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("min-w-0 rounded-[8px] bg-[#fbfaf4] px-1 py-2 transition hover:brightness-95", active && "bg-[#fbefe5] ring-1 ring-[#edd0aa]")}
    >
      <p className="text-[12px] font-semibold text-mutedInk">{item.key}</p>
      <p className={cn("mt-1 text-[18px] font-bold leading-5", elementColorClasses[item.element])}>{item.element}</p>
      <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-mutedInk">{item.subtitle}</p>
    </button>
  );
}

function DrawerSection({
  title,
  value,
  open,
  onToggle,
  children
}: {
  title: string;
  value: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const Icon = open ? ChevronUp : ChevronDown;

  return (
    <section>
      <button type="button" onClick={onToggle} className="mb-2 flex w-full items-center justify-between text-[13px] font-semibold">
        <span>{title}</span>
        <span className="flex items-center gap-1 text-[#8a6a24]">
          {value}
          <Icon size={14} strokeWidth={2} />
        </span>
      </button>
      {open ? <div className="space-y-2">{children}</div> : null}
    </section>
  );
}

function OptionChip({ children, active, activeTone = "accent", muted, onClick }: { children: ReactNode; active?: boolean; activeTone?: "accent" | "neutral"; muted?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-w-0 rounded-[6px] px-1.5 py-1.5 text-center leading-5 text-[#34312b] transition hover:brightness-95",
        active && (activeTone === "neutral" ? "bg-[#fbefe5] text-[#34312b]" : "bg-[#fbefe5] text-[#d08a43]"),
        muted && "text-[#8a6a24]"
      )}
    >
      {children}
    </button>
  );
}

function Explanation({ title, body }: { title: string; body?: string }) {
  return (
    <p className="rounded-[8px] bg-[#fbfaf4] px-3 py-2 text-[12px] leading-5 text-mutedInk">
      <span className="font-semibold text-[#8a6a24]">{title}：</span>
      {body ?? "暂无说明。"}
    </p>
  );
}
