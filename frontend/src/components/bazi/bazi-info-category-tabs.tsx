"use client";

// 需要 useState 让分类按钮组在当前页面内切换选中态。
import { useState } from "react";
import { cn } from "@/lib/utils";

export const baziInfoCategories = ["事业谋划", "婚姻剖析", "财运前瞻", "月度总结"] as const;
export type BaziInfoCategory = (typeof baziInfoCategories)[number];
export const BAZI_INFO_CATEGORY_EVENT = "bazi-info-category-change";

export function BaziInfoCategoryTabs() {
  const [activeCategory, setActiveCategory] = useState<BaziInfoCategory>("事业谋划");

  function handleCategoryChange(category: BaziInfoCategory) {
    setActiveCategory(category);
    window.dispatchEvent(new CustomEvent<BaziInfoCategory>(BAZI_INFO_CATEGORY_EVENT, { detail: category }));
  }

  return (
    <div className="sticky top-[104px] z-20 -mx-4 border-b border-[#eee6d7] bg-[#fbfaf4] px-4">
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
                ? "text-[#c78a42] after:absolute after:bottom-0 after:left-1/2 after:h-[2px] after:w-6 after:-translate-x-1/2 after:rounded-full after:bg-[#c78a42]"
                : "text-[#8d8b84] hover:text-[#a26d2d]"
            )}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}
