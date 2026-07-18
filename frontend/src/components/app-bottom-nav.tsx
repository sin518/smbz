import Link from "next/link";
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
  return (
    <nav
      className="app-responsive-nav fixed bottom-[calc(10px+env(safe-area-inset-bottom))] left-1/2 z-30 grid h-[62px] -translate-x-1/2 grid-cols-3 rounded-[28px] border border-[#e5d8bc]/90 bg-[var(--color-surface)]/95 p-1.5 shadow-[0_12px_36px_rgba(42,32,13,0.16)] backdrop-blur-xl"
      aria-label="主导航"
    >
      {navItems.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          aria-current={item.key === active ? "page" : undefined}
          className={cn(
            "flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-[22px] text-[var(--color-nav-text)] transition-colors",
            item.key === active && "bg-[#fbf2df] text-[#a67416]"
          )}
        >
          <item.icon size={21} strokeWidth={1.8} />
          <span className="text-[11px] font-medium leading-none">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
