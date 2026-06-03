"use client";

import { Compass, Hexagon, ScrollText, Sparkles, Stars } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { AppBottomNav } from "@/components/app-bottom-nav";
import { cn } from "@/lib/utils";

type HomeCard = {
  title: string;
  subtitle: string;
  suitable?: string[];
  href?: string;
  icon: LucideIcon;
  tone: "red" | "purple" | "brown" | "gold";
};

const homeCards: HomeCard[] = [
  {
    title: "八字",
    subtitle: "四柱排盘 看清自己",
    suitable: ["看长期运势"],
    href: "/bazi",
    icon: Sparkles,
    tone: "red"
  },
  {
    title: "六爻",
    subtitle: "一事一问 推演变化",
    suitable: ["问具体事情"],
    href: "/liuyao",
    icon: Hexagon,
    tone: "purple"
  },
  {
    title: "紫薇斗数",
    subtitle: "命盘结构 洞察格局",
    suitable: ["看人生格局"],
    href: "/ziwei/profile",
    icon: Stars,
    tone: "gold"
  },
  {
    title: "奇门遁甲",
    subtitle: "起局分析 辅助决策",
    suitable: ["择时定方向"],
    href: "/qimen",
    icon: Compass,
    tone: "brown"
  },
  {
    title: "大六壬",
    subtitle: "起课问事 推演人事",
    suitable: ["断人事吉凶"],
    href: "/daliuren",
    icon: ScrollText,
    tone: "brown"
  }
];

export function MetaphysicsHomeClient() {
  return (
    <main className="light-surface-text-scope app-responsive-shell flex h-dvh flex-col overflow-hidden bg-[#F8F7EE] text-ink shadow-soft">
      <header className="shrink-0 px-5 pb-5 pt-10 sm:px-8 sm:pb-7 sm:pt-12">
        <h1 className="text-center text-[30px] font-semibold tracking-normal text-black sm:text-[38px]">赛博排盘</h1>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[92px] sm:px-8 sm:pb-[116px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <section className="grid grid-cols-1 gap-3 sm:gap-5">
          {homeCards.map((card) => (
            <HomeFeatureCard key={card.title} card={card} />
          ))}
        </section>
      </div>

      <AppBottomNav active="chart" />
    </main>
  );
}

function HomeFeatureCard({ card }: { card: HomeCard }) {
  const Icon = card.icon;
  const content = (
    <div className="relative min-h-[124px] overflow-hidden border border-[#e5decb] bg-[#fffdf5] px-5 py-5 shadow-[0_10px_24px_rgba(54,45,24,0.05)] sm:min-h-[190px] md:px-7 sm:py-7">
      <Corner className="left-2 top-2 rotate-180" />
      <Corner className="right-2 top-2 -rotate-90" />
      <Corner className="bottom-2 left-2 rotate-90" />
      <Corner className="bottom-2 right-2" />

      <div className="relative z-10 flex h-full flex-col justify-between gap-5">
        <div className="relative min-h-[52px] pr-[66px]">
          <h2 className="text-[28px] font-semibold leading-tight text-[#34322f] sm:text-[34px]">{card.title}</h2>
          <span
            className={cn(
              "absolute right-0 top-0 flex h-[54px] w-[54px] items-center justify-center rounded-full border-2",
              card.tone === "red" && "border-[#d44623] bg-[#c92b12] text-[#f8d28b]",
              card.tone === "purple" && "border-[#8f7969] bg-[#40335d] text-[#f6c979]",
              card.tone === "brown" && "border-[#d19c51] bg-[#9a5f1f] text-[#ffe1a1]",
              card.tone === "gold" && "border-[#d9a450] bg-[#b07222] text-[#ffe0a6]"
            )}
          >
            <Icon size={28} strokeWidth={1.8} />
          </span>
        </div>

        <div className="flex items-end justify-between gap-3">
          <p className="text-[19px] font-semibold leading-snug text-[#74716a] sm:text-[22px]">{card.subtitle}</p>
          {card.suitable ? (
            <div className="shrink-0 text-right text-[11px] font-semibold leading-[1.45] text-[#9b9383] sm:text-[13px]">
              {card.suitable.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  if (!card.href) {
    return (
      <button type="button" className="block text-left" aria-label={`${card.title}暂未开放`}>
        {content}
      </button>
    );
  }

  return (
    <Link href={card.href} className="block">
      {content}
    </Link>
  );
}

function Corner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute h-7 w-7 border-b-2 border-r-2 border-[#e8e0ca]",
        "after:absolute after:bottom-[-2px] after:right-[-2px] after:h-3 after:w-3 after:rounded-br-[10px] after:border-b-2 after:border-r-2 after:border-[#e8e0ca]",
        className
      )}
    />
  );
}
