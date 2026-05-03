import Link from "next/link";
import { BookOpen, NotepadText, SlidersHorizontal, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type NavKey = "chart" | "records" | "school" | "settings";

const navItems: Array<{
  key: NavKey;
  label: string;
  href: string;
  icon: typeof Sparkles;
}> = [
  { key: "chart", label: "排盘", href: "/", icon: Sparkles },
  { key: "records", label: "记录", href: "/records", icon: NotepadText },
  { key: "school", label: "学堂", href: "/school", icon: BookOpen },
  { key: "settings", label: "设置", href: "/settings", icon: SlidersHorizontal }
];

export function AppBottomNav({ active }: { active: NavKey }) {
  return (
    <nav className="fixed bottom-0 left-1/2 z-30 grid w-full max-w-[430px] -translate-x-1/2 grid-cols-4 border-t border-[#eceae6] bg-white pb-6 pt-3">
      {navItems.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={cn("flex flex-col items-center gap-1 text-[#77777b]", item.key === active && "text-[#a58024]")}
        >
          <item.icon size={27} strokeWidth={1.8} />
          <span className="text-[18px] font-medium">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
