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
      className="app-bottom-nav home-glass"
      aria-label="主导航"
    >
      <span
        aria-hidden="true"
        className="app-bottom-nav-indicator"
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
          prefetch={false}
          onClick={(event) => handleNavigation(event, item)}
          aria-current={item.key === active ? "page" : undefined}
          className={cn(
            "app-bottom-nav-link",
            item.key === visualActive && "app-bottom-nav-link--active"
          )}
        >
          <item.icon size={21} strokeWidth={1.8} />
          <span className="app-bottom-nav-label">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
