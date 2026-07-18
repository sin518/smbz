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
      <header className="mb-3 flex h-[80px] shrink-0 flex-col items-center justify-center border-b border-[#e5d8bc]/90 bg-[var(--color-surface)]/80 px-5 shadow-[0_8px_22px_rgba(42,32,13,0.08)] backdrop-blur-xl">
        <h1 className="shrink-0 text-center text-[24px] font-semibold leading-none tracking-[0.04em] text-black sm:text-[26px]">赛博排盘</h1>
        <div className="mt-2.5 flex w-full min-w-0 items-center justify-center gap-2.5 text-[#a28e66]" aria-hidden="true">
          <span className="h-px w-6 shrink-0 bg-[#d9c9a3]" />
          <p className="min-w-0 truncate text-center text-[11px] font-medium tracking-[0.1em] sm:text-[12px]">选择一种排盘方式</p>
          <span className="h-px w-6 shrink-0 bg-[#d9c9a3]" />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(92px+env(safe-area-inset-bottom))] sm:px-6 sm:pb-[calc(104px+env(safe-area-inset-bottom))] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <section className="grid grid-cols-1 gap-3.5 sm:gap-4">
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
    <div className="group relative min-h-[132px] overflow-hidden rounded-[16px] border border-[#e5d8bc] bg-[#fffdf7] px-5 py-[18px] shadow-[0_8px_22px_rgba(70,53,20,0.055)] transition duration-200 active:scale-[0.99] sm:min-h-[150px] sm:px-6 sm:py-5">
      <Corner className="left-3 top-3 rotate-180" />
      <Corner className="bottom-3 right-3" />

      <div className="relative z-10 flex h-full flex-col justify-between gap-4">
        <div className="relative min-h-[48px] pr-[62px]">
          <h2 className="text-[26px] font-semibold leading-tight tracking-[0.02em] text-[#34322f] sm:text-[30px]">{card.title}</h2>
          <span
            className={cn(
              "absolute right-0 top-0 flex h-[50px] w-[50px] items-center justify-center rounded-full border-2 shadow-[inset_0_0_0_3px_rgba(255,255,255,0.12)] sm:h-[54px] sm:w-[54px]",
              card.tone === "red" && "border-[#d44623] bg-[#c92b12] text-[#f8d28b]",
              card.tone === "purple" && "border-[#8f7969] bg-[#40335d] text-[#f6c979]",
              card.tone === "brown" && "border-[#d19c51] bg-[#9a5f1f] text-[#ffe1a1]",
              card.tone === "gold" && "border-[#d9a450] bg-[#b07222] text-[#ffe0a6]"
            )}
          >
            <Icon size={25} strokeWidth={1.8} />
          </span>
        </div>

        <div className="flex items-end justify-between gap-3 pl-1">
          <p className="text-[16px] font-medium leading-snug text-[#74716a] sm:text-[18px]">{card.subtitle}</p>
          {card.suitable ? (
            <div className="shrink-0 rounded-full border border-[#ead9b4] bg-[#fbf4e4] px-2.5 py-1 text-right text-[11px] font-medium leading-[1.25] text-[#9a7a39] sm:text-[12px]">
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
        "pointer-events-none absolute h-6 w-6 border-b border-r border-[#dfcfa9] opacity-80",
        "after:absolute after:bottom-[-1px] after:right-[-1px] after:h-2.5 after:w-2.5 after:rounded-br-[8px] after:border-b after:border-r after:border-[#dfcfa9]",
        className
      )}
    />
  );
}
