"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import type { BaziInfoCategory } from "@/components/bazi/bazi-info-category-tabs";
import { branchElements, buildFiveElementStats, controls, hiddenStems, stemElements } from "@/lib/bazi/five-elements";
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
import type { ChartColumn, DemoProfile, LuckColumn } from "@/lib/bazi/demo";
import { cn } from "@/lib/utils";

type BaziPatternProfilePanelProps = {
  columns: ChartColumn[];
  profile?: DemoProfile;
  luckCycles?: LuckColumn[];
  years?: LuckColumn[];
};

type SessionResponse = {
  session?: unknown;
  user?: unknown;
};

type MonthlySummary = {
  monthPillar: string;
  period: string;
  score: number;
  name: string;
  gender: string;
  trend: string;
  work: string;
  emotion: string;
  wealth: string;
  lifeReminder: string;
  lifeTips: Array<{ label: string; body: string }>;
  tenGodCombo: string[];
  tenGodText: string;
  branchRelation: string;
  seasonalElement: string;
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

export function BaziTopicReportStack({ columns, profile: displayProfile, luckCycles = [], years = [] }: BaziPatternProfilePanelProps) {
  const profile = useMemo(() => buildPatternProfile(columns), [columns]);

  return (
    <div className="border-b-0 pb-4">
      <AnalysisReportStack columns={columns} profile={profile} displayProfile={displayProfile} luckCycles={luckCycles} years={years} />
    </div>
  );
}

function AnalysisReportStack({ columns, profile, displayProfile, luckCycles, years }: { columns: ChartColumn[]; profile: PatternProfile; displayProfile?: DemoProfile; luckCycles: LuckColumn[]; years: LuckColumn[] }) {
  return (
    <section className="space-y-3">
      {(Object.keys(reportCards) as BaziInfoCategory[]).map((category, index) => (
        <AnalysisReportCard key={category} category={category} index={index} columns={columns} profile={profile} displayProfile={displayProfile} luckCycles={luckCycles} years={years} />
      ))}
    </section>
  );
}

function AnalysisReportCard({
  category,
  index,
  columns,
  profile,
  displayProfile,
  luckCycles,
  years
}: {
  category: BaziInfoCategory;
  index: number;
  columns: ChartColumn[];
  profile: PatternProfile;
  displayProfile?: DemoProfile;
  luckCycles: LuckColumn[];
  years: LuckColumn[];
}) {
  const report = reportCards[category];

  return (
    <article
      className={cn(
        "relative scroll-mt-[154px] overflow-hidden rounded-[10px] bg-[#151326] text-white shadow-[0_10px_24px_rgba(22,18,40,0.16)]"
      )}
      id={`bazi-topic-${category}`}
      data-bazi-topic={category}
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
          <AiAnalysisDrawer>
            <LoginBlurGate>
              <CareerPatternDetails columns={columns} profile={profile} luckCycles={luckCycles} years={years} />
            </LoginBlurGate>
          </AiAnalysisDrawer>
        ) : null}
        {category === "婚姻剖析" ? (
          <AiAnalysisDrawer>
            <LoginBlurGate>
              <MarriagePatternDetails columns={columns} profile={profile} years={years} />
            </LoginBlurGate>
          </AiAnalysisDrawer>
        ) : null}
        {category === "财运前瞻" ? (
          <AiAnalysisDrawer>
            <LoginBlurGate>
              <WealthPatternDetails columns={columns} profile={profile} luckCycles={luckCycles} years={years} />
            </LoginBlurGate>
          </AiAnalysisDrawer>
        ) : null}
        {category === "月度总结" ? (
          <AiAnalysisDrawer>
            <LoginBlurGate>
              <MonthlySummaryDetails columns={columns} profile={profile} displayProfile={displayProfile} />
            </LoginBlurGate>
          </AiAnalysisDrawer>
        ) : null}
      </div>
    </article>
  );
}

function AiAnalysisDrawer({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(false);
  const nextHref = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  async function handleToggle() {
    if (open) {
      setOpen(false);
      return;
    }

    if (authorized) {
      setOpen(true);
      return;
    }

    if (checking) {
      return;
    }

    setChecking(true);

    try {
      const response = await fetch("/api/auth/get-session", {
        method: "GET",
        credentials: "include"
      });
      const data = response.ok ? ((await response.json()) as SessionResponse | null) : null;

      if (data?.session && data.user) {
        setAuthorized(true);
        setOpen(true);
        return;
      }
    } catch {
      // Treat session lookup failure as signed out.
    } finally {
      setChecking(false);
    }

    router.push(`/settings/login?next=${encodeURIComponent(nextHref)}`);
  }

  return (
    <section className="relative mt-3">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => void handleToggle()}
        disabled={checking}
        className="flex h-10 w-full items-center justify-center rounded-full border border-[#d9b987] bg-[#fff6e9] text-[13px] font-semibold text-[#9a6c2f] shadow-[0_4px_12px_rgba(41,31,18,0.12)] transition hover:brightness-98"
      >
        {checking ? "检查中..." : "AI 分析"}
        <ChevronDown size={15} strokeWidth={2} className={cn("ml-1.5 transition-transform", open && "rotate-180")} />
      </button>
      {open ? children : null}
    </section>
  );
}

function MonthlySummaryDetails({ columns, profile, displayProfile }: { columns: ChartColumn[]; profile: PatternProfile; displayProfile?: DemoProfile }) {
  const fallbackSummary = useMemo(() => buildMonthlySummary(columns, profile, displayProfile), [columns, profile, displayProfile]);
  const aiAnalysis = useMonthlyAiAnalysis({
    columns,
    profile,
    fallback: fallbackSummary
  });
  const summary = aiAnalysis.data ?? fallbackSummary;

  return (
    <section className="relative mt-3 rounded-[9px] bg-white px-3 py-3 text-[#6f6a62] shadow-[inset_0_0_0_1px_rgba(230,220,205,0.85)]">
      <section>
        <h4 className="mb-3 text-[15px] font-semibold text-[#2f2b26]">基本信息</h4>
        <div className="space-y-2 border-b border-[#f0e8dc] pb-3 text-[12px] leading-5">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <MonthlyInfoLine label="周期" value={`${summary.monthPillar} ${summary.period}`} />
            <MonthlyInfoLine label="月度分数" value={`${summary.score}分`} strong />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <MonthlyInfoLine label="姓名" value={summary.name} />
            <MonthlyInfoLine label="性别" value={summary.gender} />
          </div>
        </div>
      </section>

      <section className="mt-3">
        <h4 className="mb-2 text-[15px] font-semibold text-[#2f2b26]">本月趋势</h4>
        <p className="text-[12px] leading-5 text-[#6f6a62]">{summary.trend}</p>
      </section>

      <section className="mt-3 border-t border-[#f0e8dc] pt-3">
        <span className="mb-2 inline-flex rounded-[4px] border border-[#f0d8bf] bg-[#fff3e8] px-2 py-0.5 text-[12px] font-semibold text-[#c47f3f]">
          工作上
        </span>
        <p className="text-[12px] leading-5 text-[#6f6a62]">{summary.work}</p>
      </section>

      <MonthlySummaryBlock label="情感上" body={summary.emotion} />
      <MonthlySummaryBlock label="财富上" body={summary.wealth} />

      <section className="mt-4 border-t border-[#f0e8dc] pt-3">
        <h4 className="mb-2 text-[15px] font-semibold text-[#2f2b26]">生活提醒</h4>
        <p className="text-[12px] leading-5 text-[#6f6a62]">{summary.lifeReminder}</p>
        <div className="mt-3 space-y-2">
          {summary.lifeTips.map((item) => (
            <div key={item.label}>
              <span className="mb-1 inline-flex rounded-[4px] border border-[#f0d8bf] bg-[#fff3e8] px-2 py-0.5 text-[12px] font-semibold text-[#c47f3f]">
                {item.label}
              </span>
              <p className="text-[12px] leading-5 text-[#6f6a62]">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-4 border-t border-[#f0e8dc] pt-3">
        <h4 className="mb-3 text-[15px] font-semibold text-[#2f2b26]">十神组合</h4>
        <div className="mb-2 flex items-center justify-center gap-4">
          {summary.tenGodCombo.map((item, index) => (
            <div key={item} className="flex items-center gap-4">
              <span className="flex h-10 min-w-10 items-center justify-center rounded-full border border-[#e8c79f] bg-[#fffaf4] px-3 text-[13px] font-semibold text-[#c47f3f]">
                {item}
              </span>
              {index < summary.tenGodCombo.length - 1 ? <span className="text-[16px] text-[#c47f3f]">+</span> : null}
            </div>
          ))}
        </div>
        <p className="text-[12px] leading-5 text-[#6f6a62]">{summary.tenGodText}</p>
      </section>

      <section className="mt-4 border-t border-[#f0e8dc] pt-3">
        <h4 className="mb-2 text-[15px] font-semibold text-[#2f2b26]">干支关系</h4>
        <p className="text-[12px] leading-5 text-[#6f6a62]">{summary.branchRelation}</p>
      </section>

      <section className="mt-4 border-t border-[#f0e8dc] pt-3">
        <h4 className="mb-2 text-[15px] font-semibold text-[#2f2b26]">五行四时</h4>
        <p className="text-[12px] leading-5 text-[#6f6a62]">{summary.seasonalElement}</p>
      </section>
    </section>
  );
}

function MonthlySummaryBlock({ label, body }: { label: string; body: string }) {
  return (
    <section className="mt-3 border-t border-[#f0e8dc] pt-3">
      <span className="mb-2 inline-flex rounded-[4px] border border-[#f0d8bf] bg-[#fff3e8] px-2 py-0.5 text-[12px] font-semibold text-[#c47f3f]">
        {label}
      </span>
      <p className="text-[12px] leading-5 text-[#6f6a62]">{body}</p>
    </section>
  );
}

function MonthlyInfoLine({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <p className="inline-flex min-w-0 max-w-full items-baseline whitespace-nowrap">
      <span className="mr-1 shrink-0 font-semibold text-[#7d776f]">{label}</span>
      <span className={cn("min-w-0 truncate", strong ? "font-semibold text-[#7d776f]" : "text-[#8d857b]")}>{value}</span>
    </p>
  );
}

type MonthlyAiAnalysisData = Pick<MonthlySummary, "trend" | "work" | "emotion" | "wealth" | "lifeReminder" | "lifeTips" | "tenGodText" | "branchRelation" | "seasonalElement">;

const monthlyAiRequestCache = new Map<string, Promise<MonthlyAiAnalysisData>>();

function useMonthlyAiAnalysis({ columns, profile, fallback }: { columns: ChartColumn[]; profile: PatternProfile; fallback: MonthlySummary }) {
  const aiFallback = useMemo<MonthlyAiAnalysisData>(
    () => ({
      trend: fallback.trend,
      work: fallback.work,
      emotion: fallback.emotion,
      wealth: fallback.wealth,
      lifeReminder: fallback.lifeReminder,
      lifeTips: fallback.lifeTips,
      tenGodText: fallback.tenGodText,
      branchRelation: fallback.branchRelation,
      seasonalElement: fallback.seasonalElement
    }),
    [fallback]
  );
  const [state, setState] = useState<{ status: "loading" | "ready" | "error"; data?: MonthlySummary }>({ status: "loading" });
  const payload = useMemo(
    () => ({
      pillars: columns.map((column) => ({
        title: column.title,
        stem: column.pillar.stem,
        branch: column.pillar.branch,
        mainStar: column.mainStar,
        subStars: column.subStars,
        hiddenStems: column.hiddenStems
      })),
      profile: {
        strength: profile.strength,
        selectedPattern: profile.selectedPattern,
        primaryCombo: profile.primaryCombo,
        activeCombos: profile.activeCombos
      },
      monthly: fallback
    }),
    [columns, fallback, profile.activeCombos, profile.primaryCombo, profile.selectedPattern, profile.strength]
  );

  useEffect(() => {
    let cancelled = false;
    const cacheKey = getMonthlyAiCacheKey(payload);

    async function loadAnalysis() {
      setState({ status: "loading" });

      try {
        const cached = readMonthlyAiCache(cacheKey);
        if (cached) {
          setState({ status: "ready", data: { ...fallback, ...cached } });
          return;
        }

        const request = monthlyAiRequestCache.get(cacheKey) ?? requestMonthlyAiAnalysis(payload, aiFallback);
        monthlyAiRequestCache.set(cacheKey, request);

        const parsed = await request;

        if (!cancelled) {
          writeMonthlyAiCache(cacheKey, parsed);
          setState({ status: "ready", data: { ...fallback, ...parsed } });
        }
      } catch {
        monthlyAiRequestCache.delete(cacheKey);
        if (!cancelled) {
          setState({ status: "error", data: fallback });
        }
      }
    }

    void loadAnalysis();

    return () => {
      cancelled = true;
    };
  }, [aiFallback, fallback, payload]);

  return state;
}

async function requestMonthlyAiAnalysis(payload: unknown, fallback: MonthlyAiAnalysisData) {
  const response = await fetch("/api/ai/quick-analysis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source: "bazi-monthly",
      responseFormat: "json_object",
      maxTokens: 1600,
      messages: [
        {
          role: "system",
          content: [
            "你是八字月度总结助手，只能基于用户提供的命盘、月度结构化数据、旺衰、格局与十神组合生成话术。",
            "不要重新判盘，不要编造未提供的神煞、年份或夸张断语。",
            "返回严格 JSON，不要 Markdown。",
            "JSON 字段：trend, work, emotion, wealth, lifeReminder, lifeTips, tenGodText, branchRelation, seasonalElement。",
            "lifeTips 必须保留输入的 label，只重写 body；其他字段每段 45-95 个中文字符。",
            "基本信息、周期、分数、姓名、性别、十神组合圆点不允许改。"
          ].join("\n")
        },
        {
          role: "user",
          content: JSON.stringify(payload)
        }
      ]
    })
  });
  const result = (await response.json()) as { content?: string };

  if (!response.ok) {
    throw new Error("AI 月度总结请求失败");
  }

  return parseMonthlyAiAnalysis(result.content, fallback);
}

function parseMonthlyAiAnalysis(content: string | undefined, fallback: MonthlyAiAnalysisData): MonthlyAiAnalysisData {
  if (!content) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(extractJsonObjectText(content)) as Partial<MonthlyAiAnalysisData>;

    return {
      trend: getNonEmptyString(parsed.trend, fallback.trend),
      work: getNonEmptyString(parsed.work, fallback.work),
      emotion: getNonEmptyString(parsed.emotion, fallback.emotion),
      wealth: getNonEmptyString(parsed.wealth, fallback.wealth),
      lifeReminder: getNonEmptyString(parsed.lifeReminder, fallback.lifeReminder),
      lifeTips: parseMonthlyLifeTips(parsed.lifeTips, fallback.lifeTips),
      tenGodText: getNonEmptyString(parsed.tenGodText, fallback.tenGodText),
      branchRelation: getNonEmptyString(parsed.branchRelation, fallback.branchRelation),
      seasonalElement: getNonEmptyString(parsed.seasonalElement, fallback.seasonalElement)
    };
  } catch {
    return fallback;
  }
}

function parseMonthlyLifeTips(input: unknown, fallback: MonthlyAiAnalysisData["lifeTips"]) {
  if (!Array.isArray(input)) {
    return fallback;
  }

  return fallback.map((item) => {
    const matched = input.find((value): value is Partial<{ label: string; body: string }> => {
      return typeof value === "object" && value !== null && "label" in value && (value as { label?: string }).label === item.label;
    });

    return {
      ...item,
      body: getNonEmptyString(matched?.body, item.body)
    };
  });
}

function getNonEmptyString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function getMonthlyAiCacheKey(payload: unknown) {
  return `bazi:monthly-ai:v1:${hashText(JSON.stringify(payload))}`;
}

function readMonthlyAiCache(key: string) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as MonthlyAiAnalysisData) : null;
  } catch {
    return null;
  }
}

function writeMonthlyAiCache(key: string, data: MonthlyAiAnalysisData) {
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Ignore storage quota or privacy mode failures.
  }
}

function buildMonthlySummary(columns: ChartColumn[], profile: PatternProfile, displayProfile?: DemoProfile): MonthlySummary {
  const now = new Date();
  const dayColumn = columns.find((column) => column.title === "日柱") ?? columns[2];
  const dayElement = dayColumn ? stemElements[dayColumn.pillar.stem] : "土";
  const monthInfo = getCurrentMonthPillarInfo(now);
  const monthElement = stemElements[monthInfo.stem] ?? branchElements[monthInfo.branch] ?? "土";
  const wealthElement = controls[dayElement];
  const wealthPercent = getElementPercentage(columns, wealthElement);
  const spouseBranch = dayColumn?.pillar.branch ?? "";
  const spouseElement = branchElements[spouseBranch] ?? "土";
  const monthGod = getMonthlyTenGod(dayElement, monthElement);
  const comboParts = splitCareerCombo(profile.primaryCombo).slice(0, 2);
  const tenGodCombo = comboParts.length >= 2 ? comboParts : [monthGod, profile.primaryCombo.replace(/配.*/, "") || "印"].filter(Boolean).slice(0, 2);
  const stats = buildFiveElementStats(columns);
  const monthElementStat = stats.find((item) => item.element === monthElement)?.percentage ?? 0;
  const supportScore = monthElement === dayElement ? 12 : controls[monthElement] === dayElement ? 8 : controls[dayElement] === monthElement ? -8 : 0;
  const strengthPenalty = profile.strength === "弱" || profile.strength === "从弱" ? -7 : 5;
  const score = Math.min(88, Math.max(18, Math.round(46 + monthElementStat * 0.7 + supportScore + strengthPenalty)));
  const monthPillar = `【${monthInfo.stem}${monthInfo.branch}月】`;
  const period = `${monthInfo.startMonth}月${monthInfo.startDay}日-${monthInfo.endMonth}月${monthInfo.endDay}日`;
  const pressureText = profile.strength === "弱" || profile.strength === "从弱"
    ? "外部阻力和内心负荷都会偏明显，压力增加时，内耗严重；这可能对你的健康造成挑战。"
    : "行动力和承接度会有所提升，但仍需要控制节奏，避免把所有事项同时推进。";
  const workText = profile.primaryCombo.includes("官杀")
    ? "压力和内耗是主旋律，建议收放自如。看自己当看身，面对上级、老板或客户，不如早做规划，大事复盘、小事复小盘。逢空云：多言数穷，不如守中。时下重量宜辨明，以待着光。"
    : "工作上适合先梳理优先级，再把资源投向稳定产出。少做临时冲动承诺，多用清单、复盘和阶段目标来降低返工。";

  return {
    monthPillar,
    period,
    score,
    name: displayProfile?.name || "未命名",
    gender: displayProfile?.gender || "男",
    trend: `本月运势偏${score >= 60 ? "稳" : "弱"}，${pressureText}如果你健康状况不佳，千万不要熬夜，也不要过度思考问题。可以重温一下路遥的《平凡的世界》，或许会有所启发。`,
    work: workText,
    emotion: "食色，性也。几经疲惫的身心，恐怕难得亲密。单身的你即便身陷花海，也难有正缘，要提防年长的烂桃花。有伴的你余力不在，与其轰轰烈烈又嘎然而止，逢场作戏不如平淡度过。",
    wealth: "合规合法是正道，不可逾越。无论工作或是生意，本分务实，或有生机。涉及法律、政策法规、伦理道德的情况，尤其谨慎选择，听取专业人士意见。",
    lifeReminder: `【${monthInfo.stem}${monthInfo.branch}月】月令五行属${monthElement}，日主五行属${dayElement}。本月宜把生活节奏放慢，少做临时消耗，多给身体、情绪和日程留出余量。`,
    lifeTips: [
      {
        label: "穿衣",
        body: `适宜选择${getMonthlyColorAdvice(dayElement, monthElement)}为主，材质以舒适、透气为先；若压力感明显，少用过于厚重或强刺激的搭配。`
      },
      {
        label: "佩戴",
        body: `可选简洁、低调、便于日常佩戴的配饰。${profile.strength === "弱" || profile.strength === "从弱" ? "以稳定心神、减少分心为重点。" : "以提醒节制、收束锋芒为重点。"}`
      },
      {
        label: "旅游",
        body: `出行适合近郊、短线和节奏可控的安排。若要远行，提前确认交通、天气与证件，避免临时变动打乱计划。`
      }
    ],
    tenGodCombo,
    tenGodText: `${tenGodCombo.join("配")}在本月形成观察重点。${profile.primaryCombo.includes("官杀") ? "规则、责任与外部要求会更突出，宜先稳住承载力，再推进目标。" : "本月宜看资源、表达与执行是否流通，先把确定性做好，再处理变化。"}财星为${wealthElement}，约占${formatPercentage(wealthPercent)}，求财更重稳健。`,
    branchRelation: `${monthInfo.branch}月与日支${spouseBranch || "待定"}相互作用，容易把关系、合作或内在情绪推到台前。若出现分歧，先降低反应速度，再做决定。`,
    seasonalElement: `当前月令属${monthElement}，命盘中${monthElement}约占${formatPercentage(monthElementStat)}。五行四时看，本月宜顺势调节作息与事务密度，避免单点过载。`
  };
}

function getMonthlyColorAdvice(dayElement: ElementRole["element"], monthElement: ElementRole["element"]) {
  if (dayElement === "水" || monthElement === "水") {
    return "深蓝、灰黑、白色";
  }

  if (dayElement === "木" || monthElement === "木") {
    return "青绿、米白、浅蓝";
  }

  if (dayElement === "火" || monthElement === "火") {
    return "暖红、米色、浅咖";
  }

  if (dayElement === "金" || monthElement === "金") {
    return "白色、金色、浅灰";
  }

  return "黄色、棕色、米色";
}

function getMonthlyTenGod(dayElement: ElementRole["element"], monthElement: ElementRole["element"]) {
  if (monthElement === dayElement) {
    return "比劫";
  }

  if (controls[monthElement] === dayElement) {
    return "印";
  }

  if (controls[dayElement] === monthElement) {
    return "财";
  }

  if (monthElement && controls[monthElement] && controls[controls[monthElement]] === dayElement) {
    return "官杀";
  }

  return "食伤";
}

function getCurrentMonthPillarInfo(date: Date) {
  const monthWindows = [
    { branch: "寅", startMonth: 2, startDay: 4, endMonth: 3, endDay: 5 },
    { branch: "卯", startMonth: 3, startDay: 6, endMonth: 4, endDay: 4 },
    { branch: "辰", startMonth: 4, startDay: 5, endMonth: 5, endDay: 5 },
    { branch: "巳", startMonth: 5, startDay: 6, endMonth: 6, endDay: 5 },
    { branch: "午", startMonth: 6, startDay: 6, endMonth: 7, endDay: 6 },
    { branch: "未", startMonth: 7, startDay: 7, endMonth: 8, endDay: 7 },
    { branch: "申", startMonth: 8, startDay: 8, endMonth: 9, endDay: 7 },
    { branch: "酉", startMonth: 9, startDay: 8, endMonth: 10, endDay: 7 },
    { branch: "戌", startMonth: 10, startDay: 8, endMonth: 11, endDay: 6 },
    { branch: "亥", startMonth: 11, startDay: 7, endMonth: 12, endDay: 6 },
    { branch: "子", startMonth: 12, startDay: 7, endMonth: 1, endDay: 5 },
    { branch: "丑", startMonth: 1, startDay: 6, endMonth: 2, endDay: 3 }
  ] as const;
  const currentMonth = date.getMonth() + 1;
  const currentDay = date.getDate();
  const window =
    monthWindows.find((item) => {
      if (item.startMonth < item.endMonth) {
        return (currentMonth === item.startMonth && currentDay >= item.startDay) || (currentMonth === item.endMonth && currentDay <= item.endDay);
      }

      return (currentMonth === item.startMonth && currentDay >= item.startDay) || (currentMonth === item.endMonth && currentDay <= item.endDay);
    }) ?? monthWindows[0];
  const yearStem = getYearStem(date.getFullYear());
  const stem = getMonthStem(yearStem, window.branch);

  return { ...window, stem };
}

function getYearStem(year: number) {
  return yearStems[((year - 4) % 10 + 10) % 10] ?? "甲";
}

function getMonthStem(yearStem: string, monthBranch: string) {
  const firstMonthStemByYearStem: Record<string, string> = {
    甲: "丙",
    己: "丙",
    乙: "戊",
    庚: "戊",
    丙: "庚",
    辛: "庚",
    丁: "壬",
    壬: "壬",
    戊: "甲",
    癸: "甲"
  };
  const branchIndex = ["寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑"].indexOf(monthBranch);
  const firstStem = firstMonthStemByYearStem[yearStem] ?? "丙";
  const firstStemIndex = yearStems.indexOf(firstStem as (typeof yearStems)[number]);

  return yearStems[(firstStemIndex + Math.max(0, branchIndex)) % 10] ?? "甲";
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
  const comboParts = useMemo(() => splitCareerCombo(profile.primaryCombo), [profile.primaryCombo]);
  const careerGods = useMemo(() => getCareerTenGods(columns), [columns]);
  const harmonyBranches = useMemo(() => getHarmonyBranches(luBranch), [luBranch]);
  const overview = buildCareerOverview(profile, dayColumn, monthColumn, luColumn);
  const advantage = buildCareerAdvantage(profile, careerGods, luColumn);
  const weakness = buildCareerWeakness(profile, careerGods);
  const careerGodText = buildCareerGodText(careerGods, profile);
  const timingItems = useMemo(() => buildCareerTimingItems(columns, profile, luckCycles, years), [columns, luckCycles, profile, years]);
  const fallbackAnalysis = useMemo(
    () => ({
      traitDescriptions: Object.fromEntries(comboParts.map((part) => [part, buildCareerTraitDescription(part, columns, profile)])),
      overview,
      advantage,
      weakness,
      careerGodText,
      timingItems
    }),
    [careerGodText, columns, comboParts, overview, profile, advantage, weakness, timingItems]
  );
  const aiAnalysis = useCareerAiAnalysis({
    columns,
    profile,
    comboParts,
    careerGods,
    luBranch,
    luColumn,
    timingItems,
    fallback: fallbackAnalysis
  });
  const analysis = aiAnalysis.data ?? fallbackAnalysis;

  return (
    <section className="relative mt-3 rounded-[9px] bg-white px-3 py-3 text-[#6f6a62] shadow-[inset_0_0_0_1px_rgba(230,220,205,0.85)]">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h4 className="text-[14px] font-semibold text-[#2f2b26]">事业总格局</h4>
        <p className="shrink-0 text-[12px] font-semibold text-[#8a6a24]">{profile.primaryCombo}</p>
      </div>

      <div className="grid grid-cols-[42px_1fr] gap-x-2 gap-y-2">
        {comboParts.map((part) => (
          <CareerTraitRow key={part} label={part} description={analysis.traitDescriptions[part] ?? fallbackAnalysis.traitDescriptions[part]} />
        ))}
      </div>

      <p className="mt-3 border-t border-[#f0e8dc] pt-3 text-[12px] leading-5 text-[#6f6a62]">
        {aiAnalysis.status === "loading" ? "AI 正在结合命盘、格局与十神组合生成分析..." : analysis.overview}
      </p>

      <CareerTextBlock
        title="职场优势"
        body={analysis.advantage}
      />
      <CareerTextBlock
        title="职场劣势"
        body={analysis.weakness}
      />

      <div className="mt-3 border-t border-[#f0e8dc] pt-3">
        <div className="mb-2 flex items-center justify-between">
          <h5 className="text-[13px] font-semibold text-[#2f2b26]">事业宫十神</h5>
          <span className="text-[11px] text-[#b08a50]">{careerGods.join("、")}</span>
        </div>
        <p className="text-[12px] leading-5 text-[#6f6a62]">
          {analysis.careerGodText}
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

      <CareerTimingForecast items={analysis.timingItems ?? fallbackAnalysis.timingItems} />
    </section>
  );
}

type CareerTimingItem = {
  title: string;
  stars: number;
  tags: string[];
  body: string;
};

type MarriageTimingItem = {
  tag: string;
  body: string;
};

type WealthLossWarningItem = {
  tag: string;
  body: string;
};

type CareerAiAnalysisData = {
  traitDescriptions: Record<string, string>;
  overview: string;
  advantage: string;
  weakness: string;
  careerGodText: string;
  timingItems: CareerTimingItem[];
};

const careerAiRequestCache = new Map<string, Promise<CareerAiAnalysisData>>();

function useCareerAiAnalysis({
  columns,
  profile,
  comboParts,
  careerGods,
  luBranch,
  luColumn,
  timingItems,
  fallback
}: {
  columns: ChartColumn[];
  profile: PatternProfile;
  comboParts: string[];
  careerGods: string[];
  luBranch: string;
  luColumn?: ChartColumn;
  timingItems: CareerTimingItem[];
  fallback: CareerAiAnalysisData;
}) {
  const [state, setState] = useState<{ status: "loading" | "ready" | "error"; data?: CareerAiAnalysisData }>({ status: "loading" });
  const payload = useMemo(
    () => ({
      pillars: columns.map((column) => ({
        title: column.title,
        stem: column.pillar.stem,
        branch: column.pillar.branch,
        mainStar: column.mainStar,
        subStars: column.subStars,
        hiddenStems: column.hiddenStems
      })),
      profile: {
        strength: profile.strength,
        selectedPattern: profile.selectedPattern,
        primaryCombo: profile.primaryCombo,
        activeCombos: profile.activeCombos
      },
      career: {
        comboParts,
        careerGods,
        luBranch,
        luColumn: luColumn ? `${luColumn.title}${luColumn.pillar.branch}` : "不显",
        timingItems
      }
    }),
    [careerGods, columns, comboParts, luBranch, luColumn, profile.activeCombos, profile.primaryCombo, profile.selectedPattern, profile.strength, timingItems]
  );

  useEffect(() => {
    let cancelled = false;
    const cacheKey = getCareerAiCacheKey(payload);

    async function loadAnalysis() {
      setState({ status: "loading" });

      try {
        const cached = readCareerAiCache(cacheKey);
        if (cached) {
          setState({ status: "ready", data: cached });
          return;
        }

        const request = careerAiRequestCache.get(cacheKey) ?? requestCareerAiAnalysis(payload, fallback);
        careerAiRequestCache.set(cacheKey, request);

        const parsed = await request;

        if (!cancelled) {
          writeCareerAiCache(cacheKey, parsed);
          setState({ status: "ready", data: parsed });
        }
      } catch {
        careerAiRequestCache.delete(cacheKey);
        if (!cancelled) {
          setState({ status: "error", data: fallback });
        }
      }
    }

    void loadAnalysis();

    return () => {
      cancelled = true;
    };
  }, [fallback, payload]);

  return state;
}

async function requestCareerAiAnalysis(payload: unknown, fallback: CareerAiAnalysisData) {
  const response = await fetch("/api/ai/quick-analysis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source: "bazi-career",
      responseFormat: "json_object",
      maxTokens: 1200,
      messages: [
        {
          role: "system",
          content: [
            "你是八字事业分析助手，只能基于用户提供的结构化命盘、旺衰、格局、十神组合生成话术。",
            "不要重新判盘，不要编造未提供的神煞或年份。",
            "返回严格 JSON，不要 Markdown。",
            "JSON 字段：traitDescriptions, overview, advantage, weakness, careerGodText, timingItems。",
            "traitDescriptions 的 key 必须覆盖输入 comboParts，每段 28-42 个中文字符；overview、advantage、weakness、careerGodText 每段 45-80 个中文字符。",
            "timingItems 必须保持输入的 title、stars、tags 不变，只重写 body，每段 45-75 个中文字符，必须结合对应年份、命盘强弱、格局与事业主线。"
          ].join("\n")
        },
        {
          role: "user",
          content: JSON.stringify(payload)
        }
      ]
    })
  });
  const result = (await response.json()) as { content?: string };

  if (!response.ok) {
    throw new Error("AI 分析请求失败");
  }

  return parseCareerAiAnalysis(result.content, fallback);
}

function getCareerAiCacheKey(payload: unknown) {
  return `bazi:career-ai:v2:${hashText(JSON.stringify(payload))}`;
}

function readCareerAiCache(key: string) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as CareerAiAnalysisData) : null;
  } catch {
    return null;
  }
}

function writeCareerAiCache(key: string, data: CareerAiAnalysisData) {
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Ignore storage quota or privacy mode failures.
  }
}

function hashText(input: string) {
  let hash = 0;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) | 0;
  }

  return Math.abs(hash).toString(36);
}

function parseCareerAiAnalysis(content: string | undefined, fallback: CareerAiAnalysisData): CareerAiAnalysisData {
  if (!content) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(extractJsonObjectText(content)) as Partial<CareerAiAnalysisData>;

    return {
      traitDescriptions: typeof parsed.traitDescriptions === "object" && parsed.traitDescriptions ? { ...fallback.traitDescriptions, ...parsed.traitDescriptions } : fallback.traitDescriptions,
      overview: typeof parsed.overview === "string" && parsed.overview.trim() ? parsed.overview.trim() : fallback.overview,
      advantage: typeof parsed.advantage === "string" && parsed.advantage.trim() ? parsed.advantage.trim() : fallback.advantage,
      weakness: typeof parsed.weakness === "string" && parsed.weakness.trim() ? parsed.weakness.trim() : fallback.weakness,
      careerGodText: typeof parsed.careerGodText === "string" && parsed.careerGodText.trim() ? parsed.careerGodText.trim() : fallback.careerGodText,
      timingItems: parseCareerTimingItems(parsed.timingItems, fallback.timingItems)
    };
  } catch {
    return fallback;
  }
}

function parseCareerTimingItems(input: unknown, fallback: CareerTimingItem[]) {
  if (!Array.isArray(input)) {
    return fallback;
  }

  return fallback.map((item) => {
    const matched = input.find((value): value is Partial<CareerTimingItem> => {
      return typeof value === "object" && value !== null && "title" in value && (value as Partial<CareerTimingItem>).title === item.title;
    });

    return {
      ...item,
      body: typeof matched?.body === "string" && matched.body.trim() ? matched.body.trim() : item.body
    };
  });
}

function extractJsonObjectText(content: string) {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");

  return start >= 0 && end > start ? candidate.slice(start, end + 1) : candidate;
}

function CareerTimingForecast({ items }: { items: CareerTimingItem[] }) {
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

function MarriagePatternDetails({ columns, profile, years }: { columns: ChartColumn[]; profile: PatternProfile; years: LuckColumn[] }) {
  const dayColumn = columns.find((column) => column.title === "日柱") ?? columns[2];
  const spouseBranch = dayColumn?.pillar.branch ?? "";
  const spouseElement = branchElements[spouseBranch] ?? "土";
  const spousePalaceGod = getSpousePalaceGod(dayColumn);
  const strongestGroup = splitCareerCombo(profile.primaryCombo)[0] ?? profile.selectedPattern.replace("格", "");
  const spouseElementPercent = getElementPercentage(columns, spouseElement);
  const spouseTypeTags = buildSpouseTypeTags(spouseElement, spousePalaceGod, strongestGroup);
  const risk = useMemo(() => buildMarriageRisk(profile, dayColumn), [dayColumn, profile]);
  const harmonyBranches = getHarmonyBranches(spouseBranch);
  const fallbackTimingItems = useMemo(() => buildMarriageTimingItems(spouseBranch, years), [spouseBranch, years]);
  const marriageAiAnalysis = useMarriageAiAnalysis({
    columns,
    profile,
    spouseBranch,
    spouseElement,
    spousePalaceGod,
    risk,
    timingItems: fallbackTimingItems
  });
  const timingItems = marriageAiAnalysis.data?.timingItems ?? fallbackTimingItems;

  return (
    <section className="relative mt-3 rounded-[9px] bg-white px-3 py-3 text-[#6f6a62] shadow-[inset_0_0_0_1px_rgba(230,220,205,0.85)]">
      <div className="grid grid-cols-3 gap-2 text-center">
        <MarriageSummaryBadge title="配偶星" value={spouseElement} />
        <MarriageSummaryBadge title="夫妻宫" value={spousePalaceGod} />
        <MarriageSummaryBadge title="本命最强" value={strongestGroup} />
      </div>

      <div className="mt-3 border-t border-[#f0e8dc] pt-3">
        <h4 className="mb-2 text-[13px] font-semibold text-[#2f2b26]">配偶类型</h4>
        <div className="grid grid-cols-3 gap-2">
          {spouseTypeTags.map((tag) => (
            <span key={tag} className="rounded-[4px] border border-[#efd7bc] bg-[#fff3e8] px-2 py-1 text-center text-[11px] font-medium text-[#c47f3f]">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3 border-t border-[#f0e8dc] pt-3">
        <h4 className="mb-2 text-[13px] font-semibold text-[#2f2b26]">配偶星状态</h4>
        <div className="relative flex h-6 items-center rounded-full bg-[#f5ebdf]">
          <div className="flex h-full items-center rounded-full bg-[#d99b4a] pl-3 text-[10px] font-semibold text-white" style={{ width: `${Math.max(18, spouseElementPercent)}%` }}>
            {formatPercentage(spouseElementPercent)}
          </div>
          <span className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#e6bf94] bg-white text-[13px] font-semibold text-[#c47f3f]">
            {risk.role}
          </span>
        </div>
        <p className="mt-2 text-[12px] leading-5 text-[#6f6a62]">
          夫妻宫为{spouseBranch}{spouseElement}，配偶星力量约{formatPercentage(spouseElementPercent)}。{risk.statusText}
        </p>
      </div>

      <div className="mt-3 border-t border-[#f0e8dc] pt-3">
        <h4 className="mb-2 text-[13px] font-semibold text-[#2f2b26]">二婚危险度</h4>
        <MarriageRiskDiagram risk={risk} />
        <p className="mt-2 text-[12px] leading-5 text-[#6f6a62]">{risk.body}</p>
      </div>

      {harmonyBranches.length > 0 ? (
        <div className="mt-3 border-t border-[#f0e8dc] pt-3">
          <h4 className="mb-2 text-[13px] font-semibold text-[#2f2b26]">伴侣属相提示</h4>
          <div className="flex gap-4">
            {harmonyBranches.map((branch) => (
              <span key={branch} className="flex h-8 w-8 items-center justify-center rounded-full border border-[#edd6b9] bg-[#fffaf4] text-[14px] font-semibold text-[#9a6c2f]">
                {branch}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-3 border-t border-[#f0e8dc] pt-3">
        <h4 className="mb-2 text-[13px] font-semibold text-[#2f2b26]">感情/婚恋年份提示</h4>
        <div className="space-y-3">
          {timingItems.map((item) => (
            <section key={item.tag} className="border-b border-[#f0e8dc] pb-3 last:border-b-0 last:pb-0">
              <span className="rounded-[4px] border border-[#f0d8bf] bg-[#fff3e8] px-2 py-0.5 text-[11px] font-medium text-[#c47f3f]">
                {item.tag}
              </span>
              <p className="mt-2 text-[12px] leading-5 text-[#6f6a62]">{item.body}</p>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}

function MarriageSummaryBadge({ title, value }: { title: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="mb-2 text-[12px] font-semibold text-[#2f2b26]">{title}</p>
      <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-[#e6bf94] bg-white text-[13px] font-semibold text-[#c47f3f]">
        {value}
      </span>
    </div>
  );
}

function MarriageRiskDiagram({ risk }: { risk: ReturnType<typeof buildMarriageRisk> }) {
  return (
    <div className="mx-auto flex max-w-[260px] flex-col items-center">
      <div className="grid w-full grid-cols-2 gap-5 px-1 text-center">
        {risk.tags.slice(0, 2).map((tag) => (
          <span key={tag} className="rounded-full border border-[#efd0ab] bg-white px-3 py-1 text-[12px] font-medium text-[#c47f3f]">
            {tag}
          </span>
        ))}
      </div>
      <div className="relative h-7 w-[72%]">
        <div className="absolute left-0 right-0 top-2 h-px bg-[#d9a05a]" />
        <div className="absolute left-0 top-0 h-2 w-px bg-[#d9a05a]" />
        <div className="absolute right-0 top-0 h-2 w-px bg-[#d9a05a]" />
        <div className="absolute left-1/2 top-2 h-5 w-px -translate-x-1/2 bg-[#d9a05a]" />
      </div>
      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e6bf94] bg-white text-[14px] font-semibold text-[#c47f3f]">
        {risk.level}
      </span>
    </div>
  );
}

type MarriageAiAnalysisData = {
  timingItems: MarriageTimingItem[];
};

const marriageAiRequestCache = new Map<string, Promise<MarriageAiAnalysisData>>();

function useMarriageAiAnalysis({
  columns,
  profile,
  spouseBranch,
  spouseElement,
  spousePalaceGod,
  risk,
  timingItems
}: {
  columns: ChartColumn[];
  profile: PatternProfile;
  spouseBranch: string;
  spouseElement: ElementRole["element"];
  spousePalaceGod: string;
  risk: ReturnType<typeof buildMarriageRisk>;
  timingItems: MarriageTimingItem[];
}) {
  const fallback = useMemo(() => ({ timingItems }), [timingItems]);
  const [state, setState] = useState<{ status: "loading" | "ready" | "error"; data?: MarriageAiAnalysisData }>({ status: "loading" });
  const payload = useMemo(
    () => ({
      pillars: columns.map((column) => ({
        title: column.title,
        stem: column.pillar.stem,
        branch: column.pillar.branch,
        mainStar: column.mainStar,
        subStars: column.subStars,
        hiddenStems: column.hiddenStems
      })),
      profile: {
        strength: profile.strength,
        selectedPattern: profile.selectedPattern,
        primaryCombo: profile.primaryCombo,
        activeCombos: profile.activeCombos
      },
      marriage: {
        spouseBranch,
        spouseElement,
        spousePalaceGod,
        risk,
        timingItems
      }
    }),
    [columns, profile.activeCombos, profile.primaryCombo, profile.selectedPattern, profile.strength, risk, spouseBranch, spouseElement, spousePalaceGod, timingItems]
  );

  useEffect(() => {
    let cancelled = false;
    const cacheKey = getMarriageAiCacheKey(payload);

    async function loadAnalysis() {
      setState({ status: "loading" });

      try {
        const cached = readMarriageAiCache(cacheKey);
        if (cached) {
          setState({ status: "ready", data: cached });
          return;
        }

        const request = marriageAiRequestCache.get(cacheKey) ?? requestMarriageAiAnalysis(payload, fallback);
        marriageAiRequestCache.set(cacheKey, request);

        const parsed = await request;

        if (!cancelled) {
          writeMarriageAiCache(cacheKey, parsed);
          setState({ status: "ready", data: parsed });
        }
      } catch {
        marriageAiRequestCache.delete(cacheKey);
        if (!cancelled) {
          setState({ status: "error", data: fallback });
        }
      }
    }

    void loadAnalysis();

    return () => {
      cancelled = true;
    };
  }, [fallback, payload]);

  return state;
}

async function requestMarriageAiAnalysis(payload: unknown, fallback: MarriageAiAnalysisData) {
  const response = await fetch("/api/ai/quick-analysis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source: "bazi-marriage",
      responseFormat: "json_object",
      maxTokens: 900,
      messages: [
        {
          role: "system",
          content: [
            "你是八字婚恋年份提示助手，只能基于用户提供的结构化命盘、夫妻宫、配偶星、风险结构与候选流年生成话术。",
            "不要重新判盘，不要编造未提供的神煞或年份，不要给绝对化断语。",
            "返回严格 JSON，不要 Markdown。",
            "JSON 字段：timingItems。",
            "timingItems 必须保持输入的 tag 不变，只重写 body；每段 45-75 个中文字符，必须结合对应年份、夫妻宫牵引、关系互动与沟通节奏。"
          ].join("\n")
        },
        {
          role: "user",
          content: JSON.stringify(payload)
        }
      ]
    })
  });
  const result = (await response.json()) as { content?: string };

  if (!response.ok) {
    throw new Error("AI 婚恋年份分析请求失败");
  }

  return parseMarriageAiAnalysis(result.content, fallback);
}

function parseMarriageAiAnalysis(content: string | undefined, fallback: MarriageAiAnalysisData): MarriageAiAnalysisData {
  if (!content) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(extractJsonObjectText(content)) as Partial<MarriageAiAnalysisData>;
    return {
      timingItems: parseMarriageTimingItems(parsed.timingItems, fallback.timingItems)
    };
  } catch {
    return fallback;
  }
}

function parseMarriageTimingItems(input: unknown, fallback: MarriageTimingItem[]) {
  if (!Array.isArray(input)) {
    return fallback;
  }

  return fallback.map((item) => {
    const matched = input.find((value): value is Partial<MarriageTimingItem> => {
      return typeof value === "object" && value !== null && "tag" in value && (value as Partial<MarriageTimingItem>).tag === item.tag;
    });

    return {
      ...item,
      body: typeof matched?.body === "string" && matched.body.trim() ? matched.body.trim() : item.body
    };
  });
}

function getMarriageAiCacheKey(payload: unknown) {
  return `bazi:marriage-ai:v1:${hashText(JSON.stringify(payload))}`;
}

function readMarriageAiCache(key: string) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as MarriageAiAnalysisData) : null;
  } catch {
    return null;
  }
}

function writeMarriageAiCache(key: string, data: MarriageAiAnalysisData) {
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Ignore storage quota or privacy mode failures.
  }
}

function WealthPatternDetails({ columns, profile, luckCycles, years }: { columns: ChartColumn[]; profile: PatternProfile; luckCycles: LuckColumn[]; years: LuckColumn[] }) {
  const dayColumn = columns.find((column) => column.title === "日柱") ?? columns[2];
  const dayElement = dayColumn ? stemElements[dayColumn.pillar.stem] : "土";
  const wealthElement = controls[dayElement];
  const wealthPercent = getElementPercentage(columns, wealthElement);
  const earningPercent = Math.min(96, Math.max(8, wealthPercent + getUsefulSupportScore(profile)));
  const wealthYears = useMemo(() => buildWealthYears(wealthElement, luckCycles, years), [luckCycles, wealthElement, years]);
  const wealthSources = useMemo(() => buildWealthSources(columns, wealthElement), [columns, wealthElement]);
  const fallbackLossWarnings = useMemo(() => buildLossWarnings(dayElement, wealthElement, years), [dayElement, wealthElement, years]);
  const wealthAiAnalysis = useWealthAiAnalysis({
    columns,
    profile,
    dayElement,
    wealthElement,
    wealthPercent,
    earningPercent,
    wealthYears,
    wealthSources,
    lossWarnings: fallbackLossWarnings
  });
  const displayWealthYears = wealthAiAnalysis.data?.wealthYears ?? wealthYears;
  const lossWarnings = wealthAiAnalysis.data?.lossWarnings ?? fallbackLossWarnings;

  return (
    <section className="relative mt-3 rounded-[9px] bg-white px-3 py-3 text-[#6f6a62] shadow-[inset_0_0_0_1px_rgba(230,220,205,0.85)]">
      <div className="grid grid-cols-2 gap-4 text-center">
        <WealthRing title="该数值用于衡量财星旺弱" value={wealthPercent} />
        <WealthRing title="该数值用于衡量赚钱能力" value={earningPercent} />
      </div>
      <p className="mt-3 border-t border-[#f0e8dc] pt-3 text-[12px] leading-5 text-[#6f6a62]">
        {buildWealthSummary(profile, wealthElement, wealthPercent, earningPercent)}
      </p>

      <div className="mt-3 border-t border-[#f0e8dc] pt-3">
        <h4 className="mb-2 text-[13px] font-semibold text-[#2f2b26]">近十年财运</h4>
        <div className="mb-2 flex flex-wrap gap-2">
          {wealthYears.map((item) => (
            <span key={item.tag} className="rounded-[4px] border border-[#f0d8bf] bg-[#fff3e8] px-2 py-0.5 text-[11px] font-medium text-[#c47f3f]">
              {item.tag}
            </span>
          ))}
        </div>
        <p className="text-[12px] leading-5 text-[#6f6a62]">
          {displayWealthYears.map((item) => item.body).join(" ")}
        </p>
      </div>

      <div className="mt-3 border-t border-[#f0e8dc] pt-3">
        <h4 className="mb-2 text-[13px] font-semibold text-[#2f2b26]">财源类型</h4>
        <div className="space-y-2">
          {wealthSources.map((item) => (
            <div key={item.title} className="grid grid-cols-[58px_1fr] gap-2">
              <span className="rounded-full border border-[#efd0ab] bg-[#fffaf4] px-2 py-1 text-center text-[12px] font-semibold text-[#c47f3f]">
                {item.title}
              </span>
              <p className="text-[12px] leading-5 text-[#6f6a62]">{item.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 border-t border-[#f0e8dc] pt-3">
        <h4 className="mb-2 text-[13px] font-semibold text-[#2f2b26]">破财注意</h4>
        <div className="space-y-3">
          {lossWarnings.map((item) => (
            <section key={item.tag} className="border-b border-[#f0e8dc] pb-3 last:border-b-0 last:pb-0">
              <span className="rounded-[4px] border border-[#f0d8bf] bg-[#fff3e8] px-2 py-0.5 text-[11px] font-medium text-[#c47f3f]">
                {item.tag}
              </span>
              <p className="mt-2 text-[12px] leading-5 text-[#6f6a62]">{item.body}</p>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}

function WealthRing({ title, value }: { title: string; value: number }) {
  const displayValue = Math.round(value * 10) / 10;
  const angle = Math.min(100, Math.max(0, value)) * 3.6;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="flex h-[74px] w-[74px] items-center justify-center rounded-full"
        style={{ background: `conic-gradient(#d99b4a ${angle}deg, #f3e8dc ${angle}deg)` }}
      >
        <div className="flex h-[56px] w-[56px] flex-col items-center justify-center rounded-full bg-white text-[#c47f3f]">
          <span className="text-[16px] font-semibold">{displayValue}%</span>
          <span className="text-[9px] text-[#b68a5c]">旺</span>
        </div>
      </div>
      <p className="max-w-[120px] text-[10px] leading-4 text-[#8d857b]">{title}</p>
    </div>
  );
}

type WealthAiAnalysisData = {
  wealthYears: WealthLossWarningItem[];
  lossWarnings: WealthLossWarningItem[];
};

const wealthAiRequestCache = new Map<string, Promise<WealthAiAnalysisData>>();

function useWealthAiAnalysis({
  columns,
  profile,
  dayElement,
  wealthElement,
  wealthPercent,
  earningPercent,
  wealthYears,
  wealthSources,
  lossWarnings
}: {
  columns: ChartColumn[];
  profile: PatternProfile;
  dayElement: ElementRole["element"];
  wealthElement: ElementRole["element"];
  wealthPercent: number;
  earningPercent: number;
  wealthYears: WealthLossWarningItem[];
  wealthSources: Array<{ title: string; body: string }>;
  lossWarnings: WealthLossWarningItem[];
}) {
  const fallback = useMemo(() => ({ wealthYears, lossWarnings }), [lossWarnings, wealthYears]);
  const [state, setState] = useState<{ status: "loading" | "ready" | "error"; data?: WealthAiAnalysisData }>({ status: "loading" });
  const payload = useMemo(
    () => ({
      pillars: columns.map((column) => ({
        title: column.title,
        stem: column.pillar.stem,
        branch: column.pillar.branch,
        mainStar: column.mainStar,
        subStars: column.subStars,
        hiddenStems: column.hiddenStems
      })),
      profile: {
        strength: profile.strength,
        selectedPattern: profile.selectedPattern,
        primaryCombo: profile.primaryCombo,
        activeCombos: profile.activeCombos
      },
      wealth: {
        dayElement,
        wealthElement,
        wealthPercent,
        earningPercent,
        wealthYears,
        wealthSources,
        lossWarnings
      }
    }),
    [columns, dayElement, earningPercent, lossWarnings, profile.activeCombos, profile.primaryCombo, profile.selectedPattern, profile.strength, wealthElement, wealthPercent, wealthSources, wealthYears]
  );

  useEffect(() => {
    let cancelled = false;
    const cacheKey = getWealthAiCacheKey(payload);

    async function loadAnalysis() {
      setState({ status: "loading" });

      try {
        const cached = readWealthAiCache(cacheKey);
        if (cached) {
          setState({ status: "ready", data: cached });
          return;
        }

        const request = wealthAiRequestCache.get(cacheKey) ?? requestWealthAiAnalysis(payload, fallback);
        wealthAiRequestCache.set(cacheKey, request);

        const parsed = await request;

        if (!cancelled) {
          writeWealthAiCache(cacheKey, parsed);
          setState({ status: "ready", data: parsed });
        }
      } catch {
        wealthAiRequestCache.delete(cacheKey);
        if (!cancelled) {
          setState({ status: "error", data: fallback });
        }
      }
    }

    void loadAnalysis();

    return () => {
      cancelled = true;
    };
  }, [fallback, payload]);

  return state;
}

async function requestWealthAiAnalysis(payload: unknown, fallback: WealthAiAnalysisData) {
  const response = await fetch("/api/ai/quick-analysis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source: "bazi-wealth",
      responseFormat: "json_object",
      maxTokens: 900,
      messages: [
        {
          role: "system",
          content: [
            "你是八字财运风险提示助手，只能基于用户提供的命盘、财星、赚钱能力、近十年财运和破财候选年份生成话术。",
            "不要重新判盘，不要编造未提供的神煞或年份，不要给投资建议或绝对化断语。",
            "返回严格 JSON，不要 Markdown。",
            "JSON 字段：wealthYears, lossWarnings。",
            "wealthYears 必须保持输入的 tag 不变，只重写 body；每段 45-75 个中文字符，必须结合近十年财运、财星状态、收入机会与稳健策略。",
            "lossWarnings 必须保持输入的 tag 不变，只重写 body；每段 45-75 个中文字符，必须结合对应年份、财星状态、日主强弱和风险缓冲建议。"
          ].join("\n")
        },
        {
          role: "user",
          content: JSON.stringify(payload)
        }
      ]
    })
  });
  const result = (await response.json()) as { content?: string };

  if (!response.ok) {
    throw new Error("AI 破财提示分析请求失败");
  }

  return parseWealthAiAnalysis(result.content, fallback);
}

function parseWealthAiAnalysis(content: string | undefined, fallback: WealthAiAnalysisData): WealthAiAnalysisData {
  if (!content) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(extractJsonObjectText(content)) as Partial<WealthAiAnalysisData>;
    return {
      wealthYears: parseWealthLossWarnings(parsed.wealthYears, fallback.wealthYears),
      lossWarnings: parseWealthLossWarnings(parsed.lossWarnings, fallback.lossWarnings)
    };
  } catch {
    return fallback;
  }
}

function parseWealthLossWarnings(input: unknown, fallback: WealthLossWarningItem[]) {
  if (!Array.isArray(input)) {
    return fallback;
  }

  return fallback.map((item) => {
    const matched = input.find((value): value is Partial<WealthLossWarningItem> => {
      return typeof value === "object" && value !== null && "tag" in value && (value as Partial<WealthLossWarningItem>).tag === item.tag;
    });

    return {
      ...item,
      body: typeof matched?.body === "string" && matched.body.trim() ? matched.body.trim() : item.body
    };
  });
}

function getWealthAiCacheKey(payload: unknown) {
  return `bazi:wealth-ai:v2:${hashText(JSON.stringify(payload))}`;
}

function readWealthAiCache(key: string) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as WealthAiAnalysisData) : null;
  } catch {
    return null;
  }
}

function writeWealthAiCache(key: string, data: WealthAiAnalysisData) {
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Ignore storage quota or privacy mode failures.
  }
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

function getSpousePalaceGod(dayColumn?: ChartColumn) {
  const firstSubStar = dayColumn?.subStars.find(Boolean);

  return firstSubStar && firstSubStar !== "元男" && firstSubStar !== "元女" ? firstSubStar : dayColumn?.mainStar.replace(/^元/, "") || "夫妻宫";
}

function getElementPercentage(columns: ChartColumn[], element: ElementRole["element"]) {
  return buildFiveElementStats(columns).find((item) => item.element === element)?.percentage ?? 0;
}

function formatPercentage(value: number) {
  return `${Math.round(value * 10) / 10}%`;
}

function buildSpouseTypeTags(element: ElementRole["element"], palaceGod: string, strongestGroup: string) {
  const elementTags: Record<ElementRole["element"], string[]> = {
    木: ["有责任感", "重成长", "讲原则"],
    火: ["热情直接", "表达主动", "重氛围"],
    土: ["踏实稳定", "顾家", "重承诺"],
    金: ["边界清晰", "讲规则", "审美强"],
    水: ["心思细腻", "适应力强", "善沟通"]
  };
  const godTags: Record<string, string[]> = {
    正官: ["克制", "尊重秩序"],
    七杀: ["强势", "行动快"],
    正财: ["务实", "会经营"],
    偏财: ["大气", "资源感强"],
    正印: ["包容", "有耐心"],
    偏印: ["敏感", "有距离感"],
    食神: ["温和", "会照顾"],
    伤官: ["表达强", "挑剔"],
    比肩: ["独立", "自我"],
    劫财: ["直爽", "竞争感"]
  };

  return Array.from(new Set([...(godTags[palaceGod] ?? []), ...(elementTags[element] ?? []), strongestGroup ? `${strongestGroup}明显` : "关系牵引"])).slice(0, 6);
}

function buildMarriageRisk(profile: PatternProfile, dayColumn?: ChartColumn) {
  const spouseGod = getSpousePalaceGod(dayColumn);
  const branch = dayColumn?.pillar.branch ?? "";
  const hasMixedSignals = ["伤官", "七杀", "劫财"].includes(spouseGod) || profile.primaryCombo.includes("食伤");
  const weakSelf = profile.strength === "弱" || profile.strength === "从弱";
  const tags = [
    hasMixedSignals ? "关系信号复杂" : "无明显混杂",
    weakSelf ? "承压感偏强" : "关系承载尚可"
  ];
  const level = hasMixedSignals && weakSelf ? "中" : hasMixedSignals ? "偏低" : "低";

  return {
    role: weakSelf ? "忌" : "喜",
    level,
    tags,
    statusText: weakSelf
      ? "日主偏弱时，亲密关系里容易先感受到压力，需要清楚边界与支持系统。"
      : "日主承载较稳，关系更适合在明确承诺与稳定节奏中推进。",
    body: `${branch ? `${branch}为夫妻宫，` : ""}${tags.join("，")}。整体风险为${level}，重点不在“必然变化”，而在沟通方式、责任分配和情绪节奏是否稳定。`
  };
}

function buildMarriageTimingItems(spouseBranch: string, years: LuckColumn[]): MarriageTimingItem[] {
  const futureYears = getFutureLuckYears(years);
  const harmonyBranches = getHarmonyBranches(spouseBranch);
  const opposite = getOppositeBranch(spouseBranch);
  const harmonyYear = pickLuckYear(futureYears, (item) => harmonyBranches.includes(getLuckBranch(item))) ?? futureYears[0];
  const clashYear = pickLuckYear(futureYears, (item) => getLuckBranch(item) === opposite) ?? futureYears[1] ?? futureYears[0];
  const sameElementYear = pickLuckYear(futureYears, (item) => branchElements[getLuckBranch(item)] === branchElements[spouseBranch]) ?? futureYears[2] ?? futureYears[0];

  return [
    {
      tag: formatLuckTag(harmonyYear),
      body: `${getLuckGanZhi(harmonyYear)}流年与夫妻宫有相合牵引，代表感情互动、关系确认或生活安排更容易被推动。`
    },
    {
      tag: formatLuckTag(clashYear),
      body: `${getLuckGanZhi(clashYear)}流年冲动夫妻宫，关系中容易出现观念变化、距离变化或沟通压力，宜提前留出缓冲。`
    },
    {
      tag: formatLuckTag(sameElementYear),
      body: `${getLuckGanZhi(sameElementYear)}流年加强夫妻宫同类气场，适合重新梳理相处模式、承诺边界和长期计划。`
    }
  ].filter((item) => item.tag !== "流年待定");
}

function getUsefulSupportScore(profile: PatternProfile) {
  if (profile.strength === "强" || profile.strength === "从强") {
    return 18;
  }

  return profile.primaryCombo.includes("印") ? 8 : 4;
}

function buildWealthSummary(profile: PatternProfile, wealthElement: ElementRole["element"], wealthPercent: number, earningPercent: number) {
  const wealthTone = wealthPercent >= 20 ? "财星不弱，容易遇到资源与收益机会" : "财星偏弱，求财更适合稳扎稳打";
  const earningTone = earningPercent >= 50 ? "赚钱能力有发挥空间" : "赚钱能力需要依赖专业、平台与节奏积累";

  return `${wealthTone}。当前财星为${wealthElement}，占比约${formatPercentage(wealthPercent)}；${earningTone}。${profile.strength === "弱" ? "日主偏弱时，不宜过早扩大投入，先保证承载力与现金流。" : "日主承载较足时，可把输出和机会转成可见收益。"}`;
}

function buildWealthYears(wealthElement: ElementRole["element"], luckCycles: LuckColumn[], years: LuckColumn[]) {
  const activeLuck = luckCycles.find((item) => item.active);
  const futureYears = getFutureLuckYears(years);
  const wealthYear = pickLuckYear(futureYears, (item) => getLuckElement(item) === wealthElement) ?? futureYears[0];
  const outputYear = pickLuckYear(futureYears, (item) => getLuckElement(item) && controls[getLuckElement(item) as ElementRole["element"]] === wealthElement) ?? futureYears[1] ?? futureYears[0];

  return [
    {
      tag: activeLuck ? `${activeLuck.year}${getLuckGanZhi(activeLuck)}大运` : formatLuckTag(wealthYear),
      body: activeLuck ? `${getLuckGanZhi(activeLuck)}大运牵动阶段性财运底色，宜观察稳定收入与长期项目。` : `${getLuckGanZhi(wealthYear)}流年财星显现，适合关注收入机会。`
    },
    {
      tag: formatLuckTag(wealthYear),
      body: `${getLuckGanZhi(wealthYear)}流年财星被引动，代表收益、订单、资源或现金流更容易被看见。`
    },
    {
      tag: formatLuckTag(outputYear),
      body: `${getLuckGanZhi(outputYear)}流年可通过技能输出、项目交付或内容表达带动财源。`
    }
  ].filter((item) => item.tag !== "流年待定").slice(0, 2);
}

function buildWealthSources(columns: ChartColumn[], wealthElement: ElementRole["element"]) {
  const visibleWealth = columns.some((column) => stemElements[column.pillar.stem] === wealthElement);
  const hiddenWealth = columns.some((column) => hiddenStems[column.pillar.branch]?.some((item) => item.element === wealthElement));
  const sources = [
    {
      title: "财富合身",
      body: visibleWealth ? "财星透出，代表从你的主业、岗位回报或明确合作中见财。" : "财星不透，适合先通过稳定职业能力积累收益。"
    }
  ];

  if (hiddenWealth) {
    sources.push({
      title: "正财",
      body: "财星藏于地支，代表长期积累、固定资源、项目沉淀或不张扬的收益。"
    });
  }

  sources.push({
    title: "偏财",
    body: "可关注额外副业、资源撮合、投资机会，但需要控制投入规模。"
  });

  return sources;
}

function buildLossWarnings(dayElement: ElementRole["element"], wealthElement: ElementRole["element"], years: LuckColumn[]): WealthLossWarningItem[] {
  const futureYears = getFutureLuckYears(years);
  const peerYear = pickLuckYear(futureYears, (item) => getLuckElement(item) === dayElement) ?? futureYears[0];
  const pressureYear = pickLuckYear(futureYears, (item) => {
    const element = getLuckElement(item);
    return element ? controls[element] === dayElement : false;
  }) ?? futureYears[1] ?? futureYears[0];
  const wealthRootYear = pickLuckYear(futureYears, (item) => getLuckElement(item) === wealthElement) ?? futureYears[2] ?? futureYears[0];

  return [
    {
      tag: formatLuckTag(peerYear),
      body: `${getLuckGanZhi(peerYear)}流年比劫或同党被引动，需防合作分财、冲动消费或人情支出。`
    },
    {
      tag: formatLuckTag(pressureYear),
      body: `${getLuckGanZhi(pressureYear)}流年外部压力增强，容易因责任、规则或突发事务增加开销。`
    },
    {
      tag: formatLuckTag(wealthRootYear),
      body: `${getLuckGanZhi(wealthRootYear)}流年财星被触动，机会增多，也要警惕投入过大导致本源受伤。`
    }
  ].filter((item) => item.tag !== "流年待定");
}

function getLuckElement(item: LuckColumn) {
  return stemElements[getLuckStem(item)] ?? branchElements[getLuckBranch(item)];
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
