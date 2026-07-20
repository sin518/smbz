"use client";

// 需要 useState + IntersectionObserver 让分类按钮与页面模块联动。
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export const baziInfoCategories = ["事业谋划", "婚姻剖析", "财运前瞻", "月度总结"] as const;
export type BaziInfoCategory = (typeof baziInfoCategories)[number];

export function BaziInfoCategoryTabs() {
  const [activeCategory, setActiveCategory] = useState<BaziInfoCategory>("事业谋划");

  useEffect(() => {
    const targets = baziInfoCategories
      .map((category) => document.querySelector<HTMLElement>(`[data-bazi-topic="${category}"]`))
      .filter((target): target is HTMLElement => Boolean(target));

    if (targets.length === 0) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];
        const nextCategory = visibleEntry?.target.getAttribute("data-bazi-topic") as BaziInfoCategory | null;

        if (nextCategory) {
          setActiveCategory(nextCategory);
        }
      },
      {
        root: null,
        rootMargin: "-152px 0px -55% 0px",
        threshold: [0.15, 0.35, 0.6]
      }
    );

    targets.forEach((target) => observer.observe(target));

    return () => observer.disconnect();
  }, []);

  function handleCategoryChange(category: BaziInfoCategory) {
    setActiveCategory(category);
    document.querySelector<HTMLElement>(`[data-bazi-topic="${category}"]`)?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  return (
    <div className="sticky top-[104px] z-20 -mx-4 border-y border-[#eee5d5] bg-[rgba(252,250,246,0.96)] px-4 backdrop-blur-md">
      <div className="grid grid-cols-4 text-center">
        {baziInfoCategories.map((category) => (
          <button
            key={category}
            type="button"
            aria-pressed={activeCategory === category}
            onClick={() => handleCategoryChange(category)}
            className={cn(
              "relative min-h-11 min-w-0 px-1 text-[12px] font-semibold leading-5 transition",
              activeCategory === category
                ? "text-[#982f27] after:absolute after:bottom-0 after:left-1/2 after:h-[2px] after:w-6 after:-translate-x-1/2 after:rounded-full after:bg-[#b6382d]"
                : "text-[#81796d] hover:text-[#93651b]"
            )}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}
