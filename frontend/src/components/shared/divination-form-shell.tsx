import { ArrowLeft, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DivinationTone = "red" | "purple" | "gold" | "brown";

export const divinationFormCardClass =
  "border border-[#e5d8bc] bg-[#fffdf7] shadow-[0_10px_28px_rgba(70,53,20,0.065)]";

const toneClasses: Record<DivinationTone, { badge: string; dot: string }> = {
  red: {
    badge: "border-[#d44623] bg-[#c92b12] text-[#f8d28b]",
    dot: "border-[#e05a37] bg-[#c92b12] shadow-[0_0_0_3px_rgba(201,43,18,0.08)]"
  },
  purple: {
    badge: "border-[#8f7969] bg-[#40335d] text-[#f6c979]",
    dot: "border-[#75658f] bg-[#40335d] shadow-[0_0_0_3px_rgba(64,51,93,0.08)]"
  },
  gold: {
    badge: "border-[#d9a450] bg-[#b07222] text-[#ffe0a6]",
    dot: "border-[#d9a450] bg-[#b07222] shadow-[0_0_0_3px_rgba(176,114,34,0.08)]"
  },
  brown: {
    badge: "border-[#d19c51] bg-[#9a5f1f] text-[#ffe1a1]",
    dot: "border-[#d19c51] bg-[#9a5f1f] shadow-[0_0_0_3px_rgba(154,95,31,0.08)]"
  }
};

export function DivinationFormShell({
  title,
  subtitle,
  icon: Icon,
  tone,
  embedded = false,
  backHref = "/",
  children
}: {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  tone: DivinationTone;
  embedded?: boolean;
  backHref?: string;
  children: ReactNode;
}) {
  const Shell = embedded ? "section" : "main";

  return (
    <Shell
      className={cn(
        "light-surface-text-scope app-responsive-shell relative overflow-x-hidden bg-[#F8F7EE] text-ink",
        embedded ? "min-h-0 bg-transparent shadow-none" : "min-h-screen shadow-soft"
      )}
    >
      {!embedded ? (
        <header className="relative overflow-hidden px-5 pb-5 pt-[calc(24px+env(safe-area-inset-top))]">
          <div className="pointer-events-none absolute -right-8 -top-12 h-36 w-36 rounded-full border border-[#ead9b4]/70" aria-hidden="true" />
          <div className="pointer-events-none absolute right-5 top-8 h-16 w-16 rounded-full border border-[#ead9b4]/45" aria-hidden="true" />
          <div className="relative grid grid-cols-[40px_1fr_40px] items-start">
            <Link
              href={backHref}
              className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-[#34322f] transition-colors hover:bg-white/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a58024]"
              aria-label="返回首页"
            >
              <ArrowLeft size={24} />
            </Link>
            <div className="pt-0.5 text-center">
              <h1 className="text-[25px] font-semibold leading-tight tracking-[0.04em] text-[#34322f]">{title}</h1>
              <div className="mt-2 flex items-center justify-center gap-2 text-[#a28e66]">
                <span className="h-px w-6 bg-[#d9c9a3]" aria-hidden="true" />
                <p className="min-w-0 truncate text-[11px] font-medium tracking-[0.1em]">{subtitle}</p>
                <span className="h-px w-6 bg-[#d9c9a3]" aria-hidden="true" />
              </div>
            </div>
            <span className="flex h-10 w-10 items-center justify-center">
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 shadow-[inset_0_0_0_2px_rgba(255,255,255,0.12)]",
                  toneClasses[tone].badge
                )}
                aria-hidden="true"
              >
                <Icon size={16} strokeWidth={1.9} />
              </span>
            </span>
          </div>
        </header>
      ) : null}

      {children}
    </Shell>
  );
}

export function DivinationFormBody({ embedded = false, children }: { embedded?: boolean; children: ReactNode }) {
  return (
    <div className={cn(embedded ? "px-0 pt-0" : "px-4 pb-[calc(104px+env(safe-area-inset-bottom))]")}>{children}</div>
  );
}

export function DivinationSectionHeader({
  title,
  description,
  tone = "red"
}: {
  title: string;
  description: string;
  tone?: DivinationTone;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-[#eee5d4] py-4">
      <span className={cn("mt-2 h-2 w-2 shrink-0 rounded-full border", toneClasses[tone].dot)} aria-hidden="true" />
      <div className="min-w-0">
        <h2 className="text-[19px] font-semibold leading-tight tracking-[0.03em] text-[#34322f]">{title}</h2>
        <p className="mt-1 text-[12px] leading-5 text-[#9a9388]">{description}</p>
      </div>
    </div>
  );
}

export function DivinationSubmitBar({
  label,
  busyLabel,
  isBusy,
  embedded = false,
  icon: Icon = Sparkles,
  type = "submit",
  onClick
}: {
  label: string;
  busyLabel?: string;
  isBusy: boolean;
  embedded?: boolean;
  icon?: LucideIcon;
  type?: "button" | "submit";
  onClick?: () => void;
}) {
  return (
    <div
      className={cn(
        "z-20 mt-5 border-t border-white/60 px-1 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3",
        !embedded && "liquid-glass fixed inset-x-0 bottom-0 mx-auto w-full max-w-[430px] px-4"
      )}
    >
      <button
        type={type}
        onClick={onClick}
        disabled={isBusy}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-full border border-[#a9843d] bg-black text-[20px] font-semibold tracking-[0.08em] text-[#e8d4a7] shadow-[0_10px_24px_rgba(24,19,10,0.2)] transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-65 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a58024]"
      >
        <Icon size={18} aria-hidden="true" />
        {isBusy && busyLabel ? busyLabel : label}
      </button>
    </div>
  );
}
