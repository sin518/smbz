"use client";

import Link from "next/link";
import { AppBottomNav } from "@/components/app-bottom-nav";
import { DivinationModuleMark, type DivinationModuleKey } from "@/components/shared/divination-module-mark";
import { cn } from "@/lib/utils";

type HomeCard = {
  title: string;
  subtitle: string;
  suitable?: string[];
  href?: string;
  moduleKey: DivinationModuleKey;
  tone: "red" | "purple" | "brown" | "gold";
};

const homeCards: HomeCard[] = [
  {
    title: "八字",
    subtitle: "四柱排盘 看清自己",
    suitable: ["看长期运势"],
    href: "/bazi",
    moduleKey: "bazi",
    tone: "red"
  },
  {
    title: "六爻",
    subtitle: "一事一问 推演变化",
    suitable: ["问具体事情"],
    href: "/liuyao",
    moduleKey: "liuyao",
    tone: "purple"
  },
  {
    title: "紫薇斗数",
    subtitle: "命盘结构 洞察格局",
    suitable: ["看人生格局"],
    href: "/ziwei/profile",
    moduleKey: "ziwei",
    tone: "gold"
  },
  {
    title: "奇门遁甲",
    subtitle: "起局分析 辅助决策",
    suitable: ["择时定方向"],
    href: "/qimen",
    moduleKey: "qimen",
    tone: "brown"
  },
  {
    title: "大六壬",
    subtitle: "起课问事 推演人事",
    suitable: ["断人事吉凶"],
    href: "/daliuren",
    moduleKey: "daliuren",
    tone: "brown"
  }
];

export function MetaphysicsHomeClient() {
  return (
    <main className="home-shell">
      <header className="home-header home-glass">
        <h1 className="home-title">赛博排盘</h1>
        <div className="home-tagline" aria-hidden="true">
          <span className="home-tagline-line" />
          <p className="home-tagline-text">选择一种排盘方式</p>
          <span className="home-tagline-line" />
        </div>
      </header>

      <div className="home-scroll">
        <section className="home-card-list">
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
  const content = (
    <div className="home-card">
      <Corner className="home-card-corner--top" />
      <Corner className="home-card-corner--bottom" />

      <div className="home-card-content">
        <div className="home-card-heading">
          <h2 className="home-card-title">{card.title}</h2>
          <span
            className={cn(
              "home-card-mark",
              card.tone === "red" && "home-card-mark--red",
              card.tone === "purple" && "home-card-mark--purple",
              card.tone === "brown" && "home-card-mark--brown",
              card.tone === "gold" && "home-card-mark--gold"
            )}
          >
            <DivinationModuleMark moduleKey={card.moduleKey} />
          </span>
        </div>

        <div className="home-card-details">
          <p className="home-card-description">{card.subtitle}</p>
          {card.suitable ? (
            <div className="home-card-suitable">
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
      <button type="button" className="home-card-link" aria-label={`${card.title}暂未开放`}>
        {content}
      </button>
    );
  }

  return (
    <Link href={card.href} prefetch={false} className="home-card-link">
      {content}
    </Link>
  );
}

function Corner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "home-card-corner",
        className
      )}
    />
  );
}
