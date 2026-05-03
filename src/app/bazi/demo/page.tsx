import Link from "next/link";
import { ChevronLeft, MoreHorizontal, Sparkles } from "lucide-react";
import { LunarUtil } from "lunar-typescript";
import { BaziProfileHero } from "@/components/bazi/bazi-profile-hero";
import { ProfessionalDetail } from "@/components/bazi/professional-detail";
import { getSelfSeatStage } from "@/lib/bazi/changsheng";
import { calculateBaziChart } from "@/lib/bazi/calculate";
import { demoBaziChart, type ChartColumn, type LuckColumn } from "@/lib/bazi/demo";
import { calculateShenshaForPillar, type ShenshaContext } from "@/lib/bazi/shensha";
import type { EarthlyBranch, HeavenlyStem } from "@/lib/bazi";
import { cn } from "@/lib/utils";

const tabs = [
  { key: "info", label: "基本信息" },
  { key: "chart", label: "基本排盘" },
  { key: "detail", label: "专业细盘" },
  { key: "notes", label: "断事笔记" }
] as const;

type BaziTab = (typeof tabs)[number]["key"];

type DemoBaziPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DemoBaziPage({ searchParams }: DemoBaziPageProps) {
  const params = (await searchParams) ?? {};
  const activeTab = toTab(getParam(params, "tab"));
  const hasInput = Boolean(getParam(params, "birthTime"));
  const calculatedChart = hasInput
    ? calculateBaziChart({
        name: getParam(params, "name"),
        gender: getParam(params, "gender") === "female" ? "female" : "male",
        birthTime: getParam(params, "birthTime"),
        location: getParam(params, "location"),
        calendar: toCalendar(getParam(params, "calendar"))
      })
    : demoBaziChart;
  const { profile, columns, luckCycles, years } = calculatedChart;
  const queryBirthTime = formatQueryBirthTime(getParam(params, "birthTime"));
  const profileView = {
    ...profile,
    name: getParam(params, "name") || profile.name,
    gender: getParam(params, "gender") === "female" ? "女" : profile.gender,
    solar: queryBirthTime || profile.solar,
    solarTime: queryBirthTime || profile.solarTime,
    location: getParam(params, "location") || profile.location
  };

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-white text-ink shadow-soft">
      <header className="sticky top-0 z-30 bg-white pt-12">
        <div className="flex h-16 items-center justify-between px-5">
          <Link href={buildBackHref(params)} className="flex h-10 w-10 items-center justify-center" aria-label="返回">
            <ChevronLeft size={34} strokeWidth={1.8} />
          </Link>
          <h1 className="text-[28px] font-semibold">问真八字</h1>
          <button className="flex h-10 w-10 items-center justify-center" aria-label="更多">
            <MoreHorizontal size={30} strokeWidth={2} />
          </button>
        </div>
        <nav className="grid grid-cols-4 bg-black text-center text-[19px] text-white">
          {tabs.map((tab) => (
            <Link key={tab.key} href={buildTabHref(params, tab.key)} className={cn("py-4", activeTab === tab.key && "text-[#c9ad70]")}>
              {tab.label}
            </Link>
          ))}
        </nav>
      </header>

      <BaziProfileHero
        name={profileView.name}
        zodiac={profileView.zodiac}
        lunar={profileView.lunar}
        solar={profileView.solarTime}
        editHref={buildBackHref(params)}
      />

      {activeTab === "info" ? (
        <section className="bg-[#f4f4f2] px-3 pb-4 pt-3">
          <div className="overflow-hidden rounded-[22px] bg-white shadow-soft">
            <InfoRow left={`姓名： ${profileView.name} (阴 乾造)`} right={`性别： ${profileView.gender}`} />
            <InfoRow left={`农历： ${profileView.lunar}`} right={`生肖： ${profileView.zodiac}`} muted />
            <InfoRow left={`阳历： ${profileView.solar}`} />
            <InfoRow left={`真太阳时： ${profileView.solarTime}`} muted />
            <InfoRow left={`出生地区： ${profileView.location}`} />
            <InfoRow left={`人元司令分野： ${profileView.commander}`} muted />
            <InfoRow left={`出生节气： ${profileView.birthSolarTerm}`} />
            <div className="grid grid-cols-2 bg-[#ececec] text-[14px]">
              {profile.solarTerms.map((term) => (
                <div key={term.label} className="truncate px-4 py-3">
                  <span className="text-mutedInk">{term.label}：</span>
                  {term.value}
                </div>
              ))}
            </div>
            <InfoRow left={`星座： ${profileView.constellation}`} right={`星宿： ${profileView.lunarMansion}`} />
            <InfoRow left={`胎元： ${profileView.fetusOrigin}`} right={`空亡： ${profileView.voidBranch}`} muted />
            <InfoRow left={`命宫： ${profileView.lifePalace}`} right={`身宫： ${profileView.bodyPalace}`} />
          </div>
        </section>
      ) : null}

      {activeTab === "chart" ? (
        <section className="bg-white">
          <div className="border-b bg-[#f7f7f7] px-5 py-3 text-[16px] text-[#999]">
            点击文字十神、十二长生、纳音、神煞可查看知识解析
          </div>
          <div className="grid grid-cols-[72px_repeat(4,minmax(0,1fr))] text-center">
            <TableLabel rowIndex={0}>日期</TableLabel>
            {columns.map((column) => (
              <TableCell key={column.title} rowIndex={0} muted>
                {column.title}
              </TableCell>
            ))}
            <TableLabel rowIndex={1}>主星</TableLabel>
            {columns.map((column) => (
              <TableCell key={column.title} rowIndex={1}>{column.mainStar}</TableCell>
            ))}
            <TableLabel rowIndex={2} large>天干</TableLabel>
            {columns.map((column) => (
              <StemBranchCell key={column.title} value={column.pillar.stem} rowIndex={2} />
            ))}
            <TableLabel rowIndex={3} large>地支</TableLabel>
            {columns.map((column) => (
              <StemBranchCell key={column.title} value={column.pillar.branch} rowIndex={3} />
            ))}
            <TableLabel rowIndex={4} stack>藏干</TableLabel>
            {columns.map((column) => (
              <StackCell key={column.title} items={column.hiddenStems} rowIndex={4} gold />
            ))}
            <TableLabel rowIndex={5} stack>副星</TableLabel>
            {columns.map((column) => (
              <StackCell key={column.title} items={column.subStars} rowIndex={5} />
            ))}
            <TableLabel rowIndex={6}>星运</TableLabel>
            {columns.map((column) => (
              <TableCell key={column.title} rowIndex={6}>{column.phase}</TableCell>
            ))}
            <TableLabel rowIndex={7}>自坐</TableLabel>
            {columns.map((column) => (
              <TableCell key={column.title} rowIndex={7}>{column.selfSeat}</TableCell>
            ))}
            <TableLabel rowIndex={8}>空亡</TableLabel>
            {columns.map((column) => (
              <TableCell key={column.title} rowIndex={8}>{column.voidBranch}</TableCell>
            ))}
            <TableLabel rowIndex={9}>纳音</TableLabel>
            {columns.map((column) => (
              <TableCell key={column.title} rowIndex={9}>{column.nayin}</TableCell>
            ))}
            <TableLabel rowIndex={10} stack>神煞</TableLabel>
            {columns.map((column) => (
              <StackCell key={column.title} items={column.shensha} rowIndex={10} gold />
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === "chart" ? (
        <section className="bg-[#f4f4f2] pb-8 pt-4">
          <ChartInsightActions columns={columns} href={buildGanzhiHref(params)} aiCommandHref={buildAiCommandHref(params)} />
        </section>
      ) : null}

      {activeTab === "detail" ? (
        <ProfessionalDetail columns={columns} luckCycles={luckCycles} commander={profile.commander} />
      ) : null}

      {activeTab === "notes" ? (
        <section className="bg-[#f4f4f2] px-4 py-6">
          <div className="rounded-[22px] bg-white p-5 text-[17px] leading-8 shadow-soft">
            断事笔记正在开发中。
          </div>
        </section>
      ) : null}
    </main>
  );
}

function InfoRow({ left, right, muted }: { left: string; right?: string; muted?: boolean }) {
  return (
    <div className={cn("flex min-h-[44px] items-center gap-3 px-4 py-2 text-[15px]", muted ? "bg-[#ececec]" : "bg-white")}>
      <p className="min-w-0 flex-1 truncate whitespace-nowrap">{left}</p>
      {right ? <p className="max-w-[42%] shrink-0 truncate whitespace-nowrap text-right">{right}</p> : null}
    </div>
  );
}

function ChartInsightActions({ columns, href, aiCommandHref }: { columns: ChartColumn[]; href: string; aiCommandHref: string }) {
  const relations = buildOriginalRelations(columns);

  return (
    <section className="mt-4 border-t border-[#eeeeee] bg-white px-4 py-7">
      <div className="grid grid-cols-[minmax(0,1fr)_128px] gap-4">
        <Link href={href} className="flex h-14 items-center justify-center rounded-full bg-white text-[24px] font-semibold shadow-[0_6px_22px_rgba(0,0,0,0.08)]">
          智能干支图示 ›
        </Link>
        <Link href={aiCommandHref} className="flex h-14 items-center justify-center rounded-full bg-white text-[24px] font-semibold shadow-[0_6px_22px_rgba(0,0,0,0.08)]">
          AI指令 ›
        </Link>
      </div>

      <div className="mt-7 space-y-4 text-[20px] leading-8">
        <p><span className="font-semibold text-[#9b8749]">原局天干：</span>{relations.stems}</p>
        <p><span className="font-semibold text-[#9b8749]">原局地支：</span>{relations.branches}</p>
        <p><span className="font-semibold text-[#9b8749]">原局整柱：</span>{relations.pillars}</p>
      </div>
    </section>
  );
}

function buildOriginalRelations(columns: ChartColumn[]) {
  const stems = columns.map((column) => column.pillar.stem);
  const branches = columns.map((column) => column.pillar.branch);
  const pillars = columns.map((column) => `${column.pillar.stem}${column.pillar.branch}`);

  return {
    stems: formatRelationText(findStemRelations(stems)),
    branches: formatRelationText(findBranchRelations(branches)),
    pillars: formatRelationText(findPillarRelations(pillars))
  };
}

function findStemRelations(stems: string[]) {
  const relations = [
    ["甲", "己", "甲己合化土"],
    ["乙", "庚", "乙庚合化金"],
    ["丙", "辛", "丙辛合化水"],
    ["丁", "壬", "丁壬合化木"],
    ["戊", "癸", "戊癸合化火"]
  ];

  return relations.filter(([left, right]) => stems.includes(left) && stems.includes(right)).map(([, , label]) => label);
}

function findBranchRelations(branches: string[]) {
  const relations = [
    ["子", "丑", "子丑合土"],
    ["寅", "亥", "寅亥合木"],
    ["卯", "戌", "卯戌合火"],
    ["辰", "酉", "辰酉合金"],
    ["巳", "申", "巳申合水"],
    ["午", "未", "午未合土"],
    ["子", "午", "子午相冲"],
    ["丑", "未", "丑未相冲"],
    ["寅", "申", "寅申相冲"],
    ["卯", "酉", "卯酉相冲"],
    ["辰", "戌", "辰戌相冲"],
    ["巳", "亥", "巳亥相冲"]
  ];

  return relations.filter(([left, right]) => branches.includes(left) && branches.includes(right)).map(([, , label]) => label);
}

function findPillarRelations(pillars: string[]) {
  const repeats = pillars.filter((pillar, index) => pillars.indexOf(pillar) !== index);

  return Array.from(new Set(repeats.map((pillar) => `${pillar}伏吟`)));
}

function formatRelationText(items: string[]) {
  return items.length ? items.join("｜") : "暂无明显合冲刑害";
}

function ProfessionalChart({ columns }: { columns: DetailColumn[] }) {
  return (
    <section className="bg-white">
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

function TableLabel({ children, rowIndex, large, stack }: { children: React.ReactNode; rowIndex: number; large?: boolean; stack?: boolean }) {
  return <div className={cn("flex items-center justify-center border-b border-[#ededed] px-2 text-[17px] text-[#969696]", getRowClass(rowIndex, large, stack))}>{children}</div>;
}

function TableCell({ children, muted, rowIndex }: { children: React.ReactNode; muted?: boolean; rowIndex: number }) {
  return (
    <div className={cn("flex items-center justify-center border-b border-[#ededed] px-1 text-[17px]", getRowClass(rowIndex), muted && "text-[#969696]")}>
      {children}
    </div>
  );
}

function StemBranchCell({ value, rowIndex }: { value: string; rowIndex: number }) {
  const color = value === "乙" || value === "卯" ? "text-[#2ea84c]" : value === "庚" ? "text-[#bf8d10]" : "text-[#c40000]";

  return <div className={cn("flex items-center justify-center border-b border-[#ededed] px-1 text-[36px] font-semibold", getRowClass(rowIndex, true), color)}>{value}</div>;
}

function StackCell({ items, gold, rowIndex }: { items: string[]; gold?: boolean; rowIndex: number }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center border-b border-[#ededed] px-1",
        rowIndex === 10 ? "text-[14px] leading-6" : "text-[16px] leading-7",
        getRowClass(rowIndex, false, true),
        gold && "text-[#9b8749]"
      )}
    >
      {items.map((item) => (
        <p key={item}>{item}</p>
      ))}
    </div>
  );
}

function getRowClass(rowIndex: number, large?: boolean, stack?: boolean) {
  return cn(
    rowIndex % 2 === 0 ? "bg-white" : "bg-[#f8f8f8]",
    large ? "min-h-[88px]" : stack ? (rowIndex === 10 ? "min-h-[156px] py-3" : "min-h-[108px] py-3") : "min-h-[58px] py-3"
  );
}

function LuckScroller({ title, items, dense }: { title: string; items: typeof demoBaziChart.luckCycles; dense?: boolean }) {
  const visibleItems = dense ? items.slice(0, 10) : items;

  return (
    <div className={cn("mt-4 grid bg-white", dense ? "grid-cols-[52px_1fr]" : "grid-cols-[58px_1fr]")}>
      <div className={cn("flex items-center justify-center border-r font-semibold text-[#777] [writing-mode:vertical-rl]", dense ? "text-[24px]" : "text-[26px]")}>{title}</div>
      <div className={cn(dense ? "grid grid-cols-10 overflow-hidden" : "flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden")}>
        {visibleItems.map((item) => (
          <div
            key={`${title}-${item.year}`}
            className={cn(
              dense ? "min-w-0 px-0.5 py-2 text-[11px]" : "min-w-[82px] px-3 py-4 text-[17px]",
              "border-r text-center",
              item.active && "bg-[#e7e7e7] font-semibold"
            )}
          >
            <p className="truncate">{item.year}</p>
            {item.age ? <p className={cn("truncate", dense ? "text-[9px]" : "text-sm")}>{dense ? formatDenseAge(item.age) : item.age}</p> : null}
            <p className={cn("mt-1 leading-tight", dense ? "text-[20px]" : "text-[30px]", getStemColorClass(item.stem))}>{item.stem}</p>
            <p className={cn("leading-tight", dense ? "text-[20px]" : "text-[30px]", getStemColorClass(item.branch))}>{item.branch}</p>
            <p className={cn("mt-0.5 truncate text-[#b00020]", dense ? "text-[9px]" : "text-sm")}>{item.tags.join(" ")}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

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

function buildDetailColumns(columns: ChartColumn[], luckCycles: LuckColumn[], years: LuckColumn[]): DetailColumn[] {
  const activeYear = years.find((item) => item.active) ?? years[0];
  const activeLuck = luckCycles.find((item) => item.active) ?? luckCycles[0];
  const natalContext: ShenshaContext = {
    year: columns[0].pillar,
    month: columns[1].pillar,
    day: columns[2].pillar,
    time: columns[3].pillar
  };
  const dayStem = columns[2].pillar.stem;
  const yearColumn = activeYear ? buildLuckDetailColumn("流年", activeYear, dayStem, natalContext) : undefined;
  const luckColumn = activeLuck ? buildLuckDetailColumn("大运", activeLuck, dayStem, natalContext) : undefined;

  return [
    ...(yearColumn ? [yearColumn] : []),
    ...(luckColumn ? [luckColumn] : []),
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
    mainStar: item.tags[0] ?? title,
    stem,
    branch,
    hiddenStems,
    subStars: item.tags,
    phase: getSelfSeatStage(dayStem, branch),
    selfSeat: getSelfSeatStage(stem, branch),
    voidBranch: getXunKong(`${stem}${branch}`),
    nayin: getNayin(`${stem}${branch}`),
    shensha: calculateShenshaForPillar(pillar, natalContext)
  };
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

function formatDenseAge(age: string) {
  return age.replace(/~.*岁$/, "岁");
}

function buildMonths(): LuckColumn[] {
  const monthTerms = [
    ["立春", "2/4", "庚", "寅"],
    ["惊蛰", "3/5", "辛", "卯"],
    ["清明", "4/5", "壬", "辰"],
    ["立夏", "5/5", "癸", "巳"],
    ["芒种", "6/5", "甲", "午"],
    ["小暑", "7/7", "乙", "未"],
    ["立秋", "8/7", "丙", "申"],
    ["白露", "9/7", "丁", "酉"],
    ["寒露", "10/8", "戊", "戌"],
    ["立冬", "11/7", "己", "亥"]
  ];

  return monthTerms.map(([term, date, stem, branch], index) => ({
    year: term,
    age: date,
    stem,
    branch,
    tags: [],
    active: index === 4
  }));
}

function getStemColorClass(value: string) {
  const element = getElement(value);
  const colors: Record<string, string> = {
    火: "text-[#c40000]",
    金: "text-[#bf8d10]",
    土: "text-[#8b6f43]",
    木: "text-[#2ea84c]",
    水: "text-[#3f7edb]"
  };

  return colors[element] ?? "";
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

function getElement(value: string) {
  const stemElements: Record<string, string> = {
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
  const branchElements: Record<string, string> = {
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

  return stemElements[value] ?? branchElements[value] ?? "";
}

function getParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function formatQueryBirthTime(value: string) {
  if (!value) {
    return "";
  }

  return value.replace("T", " ");
}

function toTab(value: string): BaziTab {
  if (value === "info" || value === "detail" || value === "notes") {
    return value;
  }

  return "chart";
}

function toCalendar(value: string) {
  if (value === "lunar" || value === "pillars") {
    return value;
  }

  return "solar";
}

function buildTabHref(params: Record<string, string | string[] | undefined>, tab: BaziTab) {
  const nextParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (key === "tab") {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => nextParams.append(key, item));
      return;
    }

    if (value) {
      nextParams.set(key, value);
    }
  });

  if (tab !== "chart") {
    nextParams.set("tab", tab);
  }

  const query = nextParams.toString();

  return query ? `/bazi/demo?${query}` : "/bazi/demo";
}

function buildGanzhiHref(params: Record<string, string | string[] | undefined>) {
  const nextParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => nextParams.append(key, item));
      return;
    }

    if (value) {
      nextParams.set(key, value);
    }
  });

  const query = nextParams.toString();

  return query ? `/bazi/demo/ganzhi?${query}` : "/bazi/demo/ganzhi";
}

function buildAiCommandHref(params: Record<string, string | string[] | undefined>) {
  const nextParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => nextParams.append(key, item));
      return;
    }

    if (value) {
      nextParams.set(key, value);
    }
  });

  const query = nextParams.toString();

  return query ? `/bazi/demo/ai-command?${query}` : "/bazi/demo/ai-command";
}

function buildBackHref(params: Record<string, string | string[] | undefined>) {
  const nextParams = new URLSearchParams();

  ["name", "gender", "birthTime", "location", "calendar"].forEach((key) => {
    const value = params[key];
    if (Array.isArray(value)) {
      if (value[0]) {
        nextParams.set(key, value[0]);
      }
      return;
    }

    if (value) {
      nextParams.set(key, value);
    }
  });

  const query = nextParams.toString();

  return query ? `/?${query}` : "/";
}
