"use client";

import { ArrowLeft, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ZiweiAiCommandModal } from "@/components/ziwei/ziwei-ai-command-modal";
import { calculateZiweiChart, type ZiweiChart, type ZiweiPalace } from "@/lib/ziwei/calculate";
import { cn } from "@/lib/utils";

type StoredZiweiProfile = {
  name?: string;
  gender?: "male" | "female";
  birthTime?: string;
  location?: string;
};

type SessionResponse = {
  session?: unknown;
  user?: unknown;
};

const defaultProfile: Required<StoredZiweiProfile> = {
  name: "",
  gender: "male",
  birthTime: "1980-09-07T07:40",
  location: "北京市 北京市 东城区"
};

const palaceLayout: Record<string, string> = {
  巳: "col-start-1 row-start-1",
  午: "col-start-2 row-start-1",
  未: "col-start-3 row-start-1",
  申: "col-start-4 row-start-1",
  辰: "col-start-1 row-start-2",
  酉: "col-start-4 row-start-2",
  卯: "col-start-1 row-start-3",
  戌: "col-start-4 row-start-3",
  寅: "col-start-1 row-start-4",
  丑: "col-start-2 row-start-4",
  子: "col-start-3 row-start-4",
  亥: "col-start-4 row-start-4"
};
const leftDirections = ["南偏东", "东偏南", "正东方", "东偏北"] as const;
const rightDirections = ["西偏南", "正西方", "西偏北", "北偏西"] as const;

export function ZiweiChartClient() {
  const router = useRouter();
  const [chart, setChart] = useState<ZiweiChart | null>(null);
  const [isAiCommandOpen, setIsAiCommandOpen] = useState(false);
  const [checkingAiAccess, setCheckingAiAccess] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem("sm1:current-ziwei-profile") ?? window.localStorage.getItem("sm1:last-ziwei-profile");
    if (!raw) {
      setChart(calculateZiweiChart(defaultProfile));
      return;
    }

    try {
      const profile = JSON.parse(raw) as StoredZiweiProfile;
      setChart(calculateZiweiChart({
        ...defaultProfile,
        ...profile,
        gender: profile.gender ?? defaultProfile.gender,
        birthTime: profile.birthTime ?? defaultProfile.birthTime
      }));
    } catch {
      setChart(calculateZiweiChart(defaultProfile));
    }
  }, []);

  if (!chart) {
    return <main className="light-surface-text-scope mx-auto min-h-dvh max-w-[430px] bg-[#F8F7EE] shadow-soft" />;
  }

  async function openAiCommand() {
    if (checkingAiAccess) {
      return;
    }

    setCheckingAiAccess(true);

    try {
      const response = await fetch("/api/auth/get-session", {
        method: "GET",
        credentials: "include"
      });
      const data = response.ok ? ((await response.json()) as SessionResponse | null) : null;

      if (data?.session && data.user) {
        setIsAiCommandOpen(true);
        return;
      }
    } catch {
      // Fall through to the login page.
    } finally {
      setCheckingAiAccess(false);
    }

    router.push(`/settings/login?next=${encodeURIComponent("/ziwei")}`);
  }

  return (
    <main className="light-surface-text-scope mx-auto min-h-dvh max-w-[430px] bg-[#F8F7EE] pb-3 text-ink shadow-soft [font-family:'PingFang_SC','Microsoft_YaHei',sans-serif]">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between bg-[#F8F7EE] px-[15px] pb-1 pt-4">
        <Link href="/ziwei/profile" className="-ml-1 flex h-10 w-10 items-center justify-center" aria-label="返回资料页">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-[18px] font-medium">紫薇斗数</h1>
        <button type="button" className="-mr-1 flex h-10 w-10 items-center justify-center" aria-label="更多">
          <MoreHorizontal size={25} />
        </button>
      </header>

      <section className="mx-4 rounded-[18px] bg-white px-4 py-3 text-[13px] leading-[1.55] text-mutedInk shadow-soft">
        <div className="flex gap-10">
          <InfoLine label="姓名" value={chart.profile.name} />
          <InfoLine label="性别" value={chart.profile.gender} />
        </div>
        <InfoLine label="出生时间" value={chart.profile.solarText} />
        <InfoLine label="出生地点" value={chart.profile.location} />
        <InfoLine label="农历" value={chart.profile.lunarText} />
        <InfoLine label="命盘类型" value="三合紫薇斗数" />
      </section>

      <section className="mx-4 mt-3 rounded-[18px] bg-white px-1.5 py-2.5 shadow-soft">
        <div className="grid grid-cols-[20px_minmax(0,1fr)_20px] grid-rows-[20px_auto_20px]">
          <div className="col-start-2 grid grid-cols-4 items-end text-center text-[13px] font-semibold leading-none text-[#6f6a63]">
            <span />
            <span>正南方</span>
            <span>南偏西</span>
            <span />
          </div>

          <DirectionColumn labels={leftDirections} className="col-start-1 row-start-2" />

          <div className="col-start-2 row-start-2 overflow-hidden rounded-md border border-[#cfc8bd] bg-[#fffdf7]">
            <div className="grid grid-cols-4 grid-rows-4 bg-[#fdfbf4]">
              {chart.palaces.map((palace) => (
                <PalaceCell key={palace.branch} palace={palace} className={palaceLayout[palace.branch]} sihua={chart.sihua} />
              ))}
              <CenterPalace chart={chart} />
            </div>
          </div>

          <DirectionColumn labels={rightDirections} className="col-start-3 row-start-2" />

          <div className="col-start-2 row-start-3 grid grid-cols-4 items-start text-center text-[13px] font-semibold leading-none text-[#6f6a63]">
            <span />
            <span>北偏东</span>
            <span>正北方</span>
            <span />
          </div>
        </div>
      </section>

      <section className="mx-4 mt-3 rounded-[18px] bg-white px-4 py-3 shadow-soft">
        <button
          type="button"
          onClick={() => void openAiCommand()}
          disabled={checkingAiAccess}
          className="flex h-11 w-full items-center justify-center rounded-full bg-black text-[16px] font-semibold text-[#e8d4a7]"
        >
          {checkingAiAccess ? "检查中..." : "AI指令 ›"}
        </button>
        <p className="mt-2 text-[12px] leading-5 text-[#6f6a63]">
          复制紫微斗数分析提示词，粘贴到第三方 AI 大模型中使用。
        </p>
      </section>

      {isAiCommandOpen ? <ZiweiAiCommandModal chart={chart} onClose={() => setIsAiCommandOpen(false)} /> : null}
    </main>
  );
}

function DirectionColumn({ labels, className }: { labels: readonly string[]; className: string }) {
  return (
    <div className={cn("grid grid-rows-4 place-items-center text-[13px] font-semibold leading-tight text-[#6f6a63]", className)}>
      {labels.map((label) => (
        <span key={label} className="[writing-mode:vertical-rl]">
          {label}
        </span>
      ))}
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <p className="min-w-0">
      <span>{label}：</span>
      <b className="break-words font-semibold text-ink">{value}</b>
    </p>
  );
}

function PalaceCell({
  palace,
  className,
  sihua
}: {
  palace: ZiweiPalace;
  className: string;
  sihua: ZiweiChart["sihua"];
}) {
  const lowerLeftStars = getLowerLeftStars(palace);
  const upperLeftStars = getUpperLeftStars(palace);

  return (
    <div className={cn("relative min-h-[136px] border border-[#eaded2] bg-[#fffdf7] p-1.5 pb-8 text-[#2f2d2a]", className)}>
      <div className="flex min-h-[92px] flex-col content-start items-start justify-start overflow-hidden pr-1">
        <div className="flex max-h-[68px] flex-nowrap items-start justify-start gap-x-1 text-[12px] font-semibold leading-[1.05] text-[#34322f]">
          {upperLeftStars.length > 0 ? upperLeftStars.map((star, index) => {
            const mainStarIndex = palace.mainStars.indexOf(star);
            const isMainStar = mainStarIndex !== -1;
            const hasBrightness = isMainStar || STAR_BRIGHTNESS[star]?.[palace.branch];
            const transformation = getStarTransformation(star, sihua);

            return (
              <span
                key={star}
                className={cn(
                  "flex flex-col items-start whitespace-nowrap",
                  getStarSize(index),
                  getStarTone(star, index, sihua)
                )}
              >
                <span className="[writing-mode:vertical-rl]">{star}</span>
                {hasBrightness ? (
                  <>
                    <span className="text-[9px] leading-[10px] text-[#8b806d]">{getStarBrightness(star, palace.branch)}</span>
                    <TransformationMark transformation={transformation} />
                  </>
                ) : transformation ? <TransformationMark transformation={transformation} /> : null}
              </span>
            );
          }) : <span className="text-[#bbb6aa]">空宫</span>}
        </div>
        <div className="mt-1 w-full space-y-0.5 text-[6px] font-semibold leading-[7px] text-[#8b806d]">
          <p>
            <span className="text-[#c9432f]">流年：</span>
            {formatLimitAges(palace.annualAges)}
          </p>
          <p>
            <span className="text-[#2f72b8]">小限：</span>
            {formatLimitAges(palace.smallLimitAges)}
          </p>
        </div>
      </div>
      <div className="absolute bottom-2 left-2 flex max-w-[54px] flex-col items-start gap-0.5 overflow-hidden text-[9px] font-semibold leading-[10px]">
        {lowerLeftStars.map((star, index) => (
          <span key={star} className="flex items-center gap-1 whitespace-nowrap">
            <span className={getLowerLeftStarTone(star)}>{star}</span>
            {index === 0 ? <span className="text-[8px] font-medium text-[#8b806d]">{palace.ageRange}</span> : null}
          </span>
        ))}
      </div>
      <div className="absolute bottom-2 right-1 flex items-end justify-end gap-0.5 text-[10px] font-semibold leading-none">
        <span className="text-[#c9432f]">{palace.isBodyPalace ? `身｜${palace.palaceName}` : palace.palaceName}</span>
        <span className="flex flex-col items-center gap-0.5 text-[10px]">
          <span className="text-[#8b806d]">{palace.changSheng}</span>
          <span className="text-[#a58024] [writing-mode:vertical-rl]">{palace.stem}{palace.branch}</span>
        </span>
      </div>
    </div>
  );
}

function TransformationMark({ transformation }: { transformation?: string }) {
  if (!transformation) {
    return <span className="h-[12px]" aria-hidden="true" />;
  }

  return (
    <span className={cn(
      "rounded-[2px] px-0.5 text-[9px] font-semibold leading-[12px] text-white",
      getTransformationMarkTone(transformation)
    )}>
      {transformation}
    </span>
  );
}

function getStarTransformation(star: string, sihua: ZiweiChart["sihua"]) {
  return (Object.keys(sihua) as Array<keyof ZiweiChart["sihua"]>).find((key) => sihua[key] === star);
}

function getStarBrightness(star: string, branch: string) {
  const brightness = STAR_BRIGHTNESS[star]?.[branch];

  return brightness ?? "平";
}

function getUpperLeftStars(palace: ZiweiPalace) {
  const importantStars = palace.minorStars.filter(isUpperLeftStar);
  const changShengStar = isUpperLeftStar(palace.changSheng) ? [palace.changSheng] : [];

  return Array.from(new Set([...palace.mainStars, ...importantStars, ...changShengStar]));
}

function getLowerLeftStars(palace: ZiweiPalace) {
  const existingStars = [...palace.minorStars, palace.changSheng].filter(isLowerLeftStar);
  const fallbackStars = LOWER_LEFT_STARS_BY_BRANCH[palace.branch] ?? DEFAULT_LOWER_LEFT_STARS;

  return Array.from(new Set([...existingStars, ...fallbackStars]))
    .sort((a, b) => getLowerLeftStarPriority(a) - getLowerLeftStarPriority(b))
    .slice(0, 3);
}

function isUpperLeftStar(star: string) {
  return UPPER_LEFT_STARS.includes(star);
}

function isLowerLeftStar(star: string) {
  return !isUpperLeftStar(star) && LOWER_LEFT_STARS.includes(star);
}

function getLowerLeftStarPriority(star: string) {
  const index = LOWER_LEFT_PRIORITY.indexOf(star);

  return index === -1 ? LOWER_LEFT_PRIORITY.length : index;
}

function getLowerLeftStarTone(star: string) {
  if (["劫煞", "孤辰", "天空", "天伤", "大耗", "小耗"].includes(star)) {
    return "text-[#2f72b8]";
  }

  if (["天喜", "月德", "天德"].includes(star)) {
    return "text-[#c9432f]";
  }

  return "text-[#34322f]";
}

function getTransformationMarkTone(transformation: string) {
  switch (transformation) {
    case "禄":
      return "bg-[#2f9e44]";
    case "权":
      return "bg-[#7c3aed]";
    case "科":
      return "bg-[#2563eb]";
    case "忌":
      return "bg-[#c9432f]";
    default:
      return "bg-[#8b806d]";
  }
}

function getStarSize(index: number) {
  if (index >= 5) {
    return "text-[9px]";
  }

  if (index >= 3) {
    return "text-[10px]";
  }

  return "text-[12px]";
}

function formatLimitAges(ages: number[]) {
  const visibleAges = ages.slice(0, 5);

  return `${visibleAges.join(",")}${ages.length > visibleAges.length ? "..." : ""}`;
}

const STAR_BRIGHTNESS: Record<string, Record<string, string>> = {
  紫微: { 寅: "旺", 卯: "旺", 辰: "得", 巳: "旺", 午: "庙", 未: "庙", 申: "旺", 酉: "旺", 戌: "得", 亥: "旺", 子: "平", 丑: "庙" },
  天机: { 寅: "得", 卯: "旺", 辰: "利", 巳: "平", 午: "庙", 未: "陷", 申: "得", 酉: "旺", 戌: "利", 亥: "平", 子: "庙", 丑: "陷" },
  太阳: { 寅: "旺", 卯: "庙", 辰: "旺", 巳: "旺", 午: "旺", 未: "得", 申: "得", 酉: "陷", 戌: "不", 亥: "陷", 子: "陷", 丑: "不" },
  武曲: { 寅: "得", 卯: "利", 辰: "庙", 巳: "平", 午: "旺", 未: "庙", 申: "得", 酉: "利", 戌: "庙", 亥: "平", 子: "旺", 丑: "庙" },
  天同: { 寅: "利", 卯: "平", 辰: "平", 巳: "庙", 午: "陷", 未: "不", 申: "旺", 酉: "平", 戌: "平", 亥: "庙", 子: "旺", 丑: "不" },
  廉贞: { 寅: "庙", 卯: "平", 辰: "利", 巳: "陷", 午: "平", 未: "利", 申: "庙", 酉: "平", 戌: "利", 亥: "陷", 子: "平", 丑: "利" },
  天府: { 寅: "庙", 卯: "得", 辰: "庙", 巳: "得", 午: "旺", 未: "庙", 申: "得", 酉: "旺", 戌: "庙", 亥: "得", 子: "庙", 丑: "庙" },
  太阴: { 寅: "旺", 卯: "陷", 辰: "陷", 巳: "陷", 午: "不", 未: "不", 申: "利", 酉: "不", 戌: "旺", 亥: "庙", 子: "庙", 丑: "庙" },
  贪狼: { 寅: "平", 卯: "利", 辰: "庙", 巳: "陷", 午: "旺", 未: "庙", 申: "平", 酉: "利", 戌: "庙", 亥: "陷", 子: "旺", 丑: "庙" },
  巨门: { 寅: "庙", 卯: "庙", 辰: "陷", 巳: "旺", 午: "旺", 未: "不", 申: "庙", 酉: "庙", 戌: "陷", 亥: "旺", 子: "旺", 丑: "不" },
  天相: { 寅: "庙", 卯: "陷", 辰: "得", 巳: "得", 午: "庙", 未: "得", 申: "庙", 酉: "陷", 戌: "得", 亥: "得", 子: "庙", 丑: "庙" },
  天梁: { 寅: "庙", 卯: "庙", 辰: "庙", 巳: "陷", 午: "庙", 未: "旺", 申: "陷", 酉: "得", 戌: "庙", 亥: "陷", 子: "庙", 丑: "旺" },
  七杀: { 寅: "庙", 卯: "旺", 辰: "庙", 巳: "平", 午: "旺", 未: "庙", 申: "庙", 酉: "庙", 戌: "庙", 亥: "平", 子: "旺", 丑: "庙" },
  破军: { 寅: "得", 卯: "陷", 辰: "旺", 巳: "平", 午: "庙", 未: "旺", 申: "得", 酉: "陷", 戌: "旺", 亥: "平", 子: "庙", 丑: "旺" }
};

const DEFAULT_LOWER_LEFT_STARS = ["天德", "月德", "大耗"];

const UPPER_LEFT_STARS = [
  "左辅", "右弼", "文昌", "文曲", "天魁", "天钺",
  "禄存", "天马", "天刑", "天姚", "红鸾", "天喜", "咸池", "沐浴",
  "擎羊", "陀罗", "地空", "地劫", "火星", "铃星"
];

const LOWER_LEFT_STARS = [
  "博士", "力士", "青龙", "小耗", "将军", "奏书", "飞廉", "喜神", "病符", "大耗", "伏兵", "官府",
  "将星", "攀鞍", "岁驿", "息神", "华盖", "劫煞", "灾煞", "天煞", "指背", "咸池", "月煞", "亡神",
  "天德", "月德", "天寿", "孤辰", "寡宿", "天空", "天哭", "天虚", "天贵", "天伤", "恩光",
  "长生", "冠带", "临官", "帝旺", "衰", "病", "死", "墓", "绝", "胎", "养"
];

const LOWER_LEFT_PRIORITY = [
  "博士", "力士", "青龙", "小耗", "将军", "奏书", "飞廉", "喜神", "病符", "大耗", "伏兵", "官府",
  "将星", "攀鞍", "岁驿", "息神", "华盖", "劫煞", "灾煞", "天煞", "指背", "咸池", "月煞", "亡神",
  "天德", "月德", "天寿", "孤辰", "寡宿", "天空", "天哭", "天虚", "天贵", "天伤", "恩光",
  "长生", "冠带", "临官", "帝旺", "衰", "病", "死", "墓", "绝", "胎", "养"
];

const LOWER_LEFT_STARS_BY_BRANCH: Record<string, string[]> = {
  子: ["天德", "劫煞", "小耗"],
  丑: ["月德", "天喜", "大耗"],
  寅: ["华盖", "孤辰", "天德"],
  卯: ["天伤", "月德", "小耗"],
  辰: ["天贵", "天喜", "大耗"],
  巳: ["天喜", "孤辰", "劫煞"],
  午: ["天空", "月德", "天德"],
  未: ["天德", "大耗", "月德"],
  申: ["天贵", "劫煞", "小耗"],
  酉: ["咸池", "月德", "天喜"],
  戌: ["华盖", "天德", "大耗"],
  亥: ["天空", "天伤", "月德"]
};

function getStarTone(star: string, index: number, sihua: ZiweiChart["sihua"]) {
  if (index === 0 || Object.values(sihua).includes(star)) {
    return "text-[#c9432f]";
  }

  if (["文昌", "文曲", "禄存"].includes(star)) {
    return "text-[#7257c8]";
  }

  if (["火星", "铃星", "地空", "地劫", "天空", "劫煞", "擎羊", "陀罗"].includes(star)) {
    return "text-[#2f72b8]";
  }

  return "text-[#34322f]";
}

function CenterPalace({ chart }: { chart: ZiweiChart }) {
  return (
    <div className="col-start-2 col-end-4 row-start-2 row-end-4 flex min-h-[272px] flex-col items-center justify-center border border-[#eaded2] bg-[#fffdf7] px-3 text-center">
      <p className="text-[14px] font-semibold leading-5 text-[#34322f]">{chart.profile.yinYangGender} {chart.profile.fiveElementClass}</p>
      <p className="mt-1 text-[12px] leading-5 text-[#7d7972]">{chart.profile.solarText}</p>
      <p className="text-[12px] leading-5 text-[#7d7972]">农历：{chart.profile.lunarText}</p>
      <div className="mt-3 grid grid-cols-4 gap-1.5 text-[13px] font-semibold text-[#a58024]">
        {Object.values(chart.pillars).map((item) => (
          <span key={item} className="inline-flex flex-col items-center rounded bg-[#f8f4e8] px-1.5 py-1">
            <span className={getStemBranchTextTone(item[0])}>{item[0]}</span>
            <span className={getStemBranchTextTone(item[1])}>{item[1]}</span>
          </span>
        ))}
      </div>
      <div className="mt-2 grid w-full grid-cols-9 gap-0.5 text-center text-[8px] font-semibold leading-none">
        {chart.profile.majorLimitItems.map((item) => (
          <div key={item.stemBranch} className="min-w-0">
            <div className="mx-auto flex h-[32px] w-full max-w-[17px] flex-col items-center justify-center rounded bg-[#f8f4e8] px-0.5 py-0.5">
              <span className={getStemBranchTextTone(item.stemBranch[0])}>{item.stemBranch[0]}</span>
              <span className={getStemBranchTextTone(item.stemBranch[1])}>{item.stemBranch[1]}</span>
            </div>
            <p className="mt-1 text-[6px] text-[#6f6a63]">{item.ageText}</p>
            <p className="mt-0.5 text-[6px] text-[#9a8666]">{item.startYear}</p>
          </div>
        ))}
      </div>
      <p className="mt-1.5 text-[12px] font-semibold text-[#7d7972]">
        流年 {chart.profile.annualBranch} · 小限 {chart.profile.smallLimitBranch}
      </p>
      <p className="mt-1 text-[12px] font-semibold text-[#7d7972]">命宫 {chart.profile.lifeBranch} · 身宫 {chart.profile.bodyBranch}</p>
    </div>
  );
}

function getPillarTone(pillar: string) {
  const stem = pillar[0];
  const element = STEM_ELEMENT[stem] ?? BRANCH_ELEMENT[pillar[1]] ?? "土";

  switch (element) {
    case "木":
      return "bg-[#e8f4dd] text-[#2f7d32]";
    case "火":
      return "bg-[#fde7dc] text-[#c9432f]";
    case "土":
      return "bg-[#f6f0d8] text-[#a58024]";
    case "金":
      return "bg-[#f7efd9] text-[#bf8d10]";
    case "水":
      return "bg-[#e1eefb] text-[#2f72b8]";
    default:
      return "bg-[#f6f0e2] text-[#a58024]";
  }
}

function getStemBranchTextTone(value: string) {
  const element = STEM_ELEMENT[value] ?? BRANCH_ELEMENT[value] ?? "土";

  switch (element) {
    case "木":
      return "text-[#2ea84c]";
    case "火":
      return "text-[#c40000]";
    case "土":
      return "text-[#8b6f43]";
    case "金":
      return "text-[#bf8d10]";
    case "水":
      return "text-[#3f7edb]";
    default:
      return "text-[#8b6f43]";
  }
}

const STEM_ELEMENT: Record<string, string> = {
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

const BRANCH_ELEMENT: Record<string, string> = {
  寅: "木",
  卯: "木",
  巳: "火",
  午: "火",
  辰: "土",
  戌: "土",
  丑: "土",
  未: "土",
  申: "金",
  酉: "金",
  亥: "水",
  子: "水"
};
