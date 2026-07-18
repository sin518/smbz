"use client";

import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NotepadText, SlidersHorizontal, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type NavKey = "chart" | "records" | "settings";

const navItems: Array<{
  key: NavKey;
  label: string;
  href: string;
  icon: typeof Sparkles;
}> = [
  { key: "chart", label: "首页", href: "/", icon: Sparkles },
  { key: "records", label: "记录", href: "/records", icon: NotepadText },
  { key: "settings", label: "设置", href: "/settings", icon: SlidersHorizontal }
];

export function AppBottomNav({ active }: { active: NavKey }) {
  const router = useRouter();
  const [visualActive, setVisualActive] = useState(active);
  const [isIndicatorMoving, setIsIndicatorMoving] = useState(false);
  const [movementDirection, setMovementDirection] = useState<"left" | "right">("right");
  const navigationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeIndex = navItems.findIndex((item) => item.key === visualActive);

  useEffect(() => {
    setVisualActive(active);

    return () => {
      if (navigationTimerRef.current) {
        clearTimeout(navigationTimerRef.current);
      }
      if (settleTimerRef.current) {
        clearTimeout(settleTimerRef.current);
      }
    };
  }, [active]);

  const handleNavigation = (event: MouseEvent<HTMLAnchorElement>, item: (typeof navItems)[number]) => {
    if (item.key === active || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    event.preventDefault();
    const targetIndex = navItems.findIndex((navItem) => navItem.key === item.key);
    setMovementDirection(targetIndex > activeIndex ? "right" : "left");
    setIsIndicatorMoving(true);
    setVisualActive(item.key);

    if (navigationTimerRef.current) {
      clearTimeout(navigationTimerRef.current);
    }
    if (settleTimerRef.current) {
      clearTimeout(settleTimerRef.current);
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    settleTimerRef.current = setTimeout(() => setIsIndicatorMoving(false), prefersReducedMotion ? 0 : 190);
    navigationTimerRef.current = setTimeout(() => router.push(item.href), prefersReducedMotion ? 0 : 360);
  };

  return (
    <nav
      className="liquid-glass app-responsive-nav fixed bottom-[calc(10px+env(safe-area-inset-bottom))] left-1/2 z-30 grid h-[62px] -translate-x-1/2 grid-cols-3 rounded-[28px] border border-white/60 p-1.5"
      aria-label="主导航"
    >
      <span
        aria-hidden="true"
        className="liquid-nav-indicator pointer-events-none absolute bottom-1.5 left-1.5 top-1.5 rounded-[22px] motion-reduce:transition-none"
        style={{
          width: "calc((100% - 12px) / 3)",
          transform: `translateX(${activeIndex * 100}%) scaleX(${isIndicatorMoving ? 1.12 : 1})`,
          transformOrigin: movementDirection === "right" ? "left center" : "right center"
        }}
      />
      {navItems.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          onClick={(event) => handleNavigation(event, item)}
          aria-current={item.key === active ? "page" : undefined}
          className={cn(
            "relative z-10 flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-[22px] text-[var(--color-nav-text)] transition-colors duration-200",
            item.key === visualActive && "text-[#a67416]"
          )}
        >
          <item.icon size={21} strokeWidth={1.8} />
          <span className="text-[11px] font-medium leading-none">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
