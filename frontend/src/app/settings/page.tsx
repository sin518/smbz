"use client";

import {
  ChevronRight,
  CircleUserRound,
  Sparkles,
  Smartphone,
  Sun,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AppBottomNav } from "@/components/app-bottom-nav";
import { applyThemeMode, resolveStoredTheme, themeStorageKey, type ThemeMode } from "@/lib/theme";
import { cn } from "@/lib/utils";

type SessionResponse = {
  session?: unknown;
  user?: {
    id?: string | null;
  } | null;
};

type AuthState = {
  status: "loading" | "signed-in" | "signed-out";
  userId?: string;
};

type MenuItem = {
  label: string;
  icon: LucideIcon;
  href?: string;
  status?: string;
};

export default function SettingsPage() {
  const [authState, setAuthState] = useState<AuthState>({ status: "loading" });
  const profileHref = authState.status === "signed-in" && authState.userId ? buildUserSettingsHref(authState.userId) : "/settings/login";  

  const loginLabel = authState.status === "loading" ? "检查中" : authState.status === "signed-in" ? "已登录" : "登录";
  const accountDescription = authState.status === "signed-in" ? "同步排盘记录与个人资料" : "登录后同步记录与个人资料";
  const applicationItems: MenuItem[] = [
    { label: "Android 版", icon: Smartphone, status: "正在开发中" },
    { label: "用户资料", icon: CircleUserRound, href: profileHref }
  ];

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    const storedUserId = getStoredUserId();

    if (storedUserId) {
      setAuthState({ status: "signed-in", userId: storedUserId });
    }

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/get-session", {
          method: "GET",
          credentials: "include",
          signal: controller.signal
        });
        const data = response.ok ? ((await response.json()) as SessionResponse | null) : null;

        if (!mounted) {
          return;
        }

        if (data?.session && data.user?.id) {
          setAuthState({ status: "signed-in", userId: data.user.id });
          return;
        }
      } catch {
        // Session lookup failure should keep the page usable as signed out.
      }

      if (mounted) {
        const storedUserId = getStoredUserId();
        if (storedUserId) {
          setAuthState({ status: "signed-in", userId: storedUserId });
          return;
        }
        setAuthState({ status: "signed-out" });
      }
    }

    void loadSession();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  return (
    <main className="app-responsive-shell relative min-h-screen overflow-hidden bg-[#F8F7EE] pb-[108px] text-ink shadow-soft">
      <header className="px-5 pb-4 pt-8 sm:px-6">
        <h1 className="text-[30px] font-semibold tracking-[0.04em]">设置</h1>
      </header>

      <section className="px-4">
        <Link href={profileHref} className="liquid-glass flex min-h-[122px] items-center gap-4 rounded-[26px] border border-white/60 px-5 py-5">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#dfc995] bg-[#fff9e9]/80 text-[#a8781c] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
            <Sparkles size={27} strokeWidth={1.65} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[23px] font-semibold leading-tight">{loginLabel}</span>
            <span className="mt-2 block truncate text-[13px] text-mutedInk">{accountDescription}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1 text-[12px] font-medium text-[#96732e]">
            {authState.status === "signed-in" ? "管理账户" : "立即登录"}
            <ChevronRight size={18} strokeWidth={1.7} />
          </span>
        </Link>
      </section>

      <MenuSection title="应用" className="mt-5" items={applicationItems} />

      <section className="mt-5 px-4">
        <SectionTitle icon={Sun}>显示</SectionTitle>
        <div className="mt-2.5 rounded-[24px] border border-[#e5d8bc] bg-[#fffdf7] p-4 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[18px] font-semibold">外观</h2>
              <p className="mt-1 text-[12px] text-mutedInk">选择当前设备的显示主题</p>
            </div>
          </div>
          <AppearancePicker />
        </div>
      </section>

      <AppBottomNav active="settings" />
    </main>
  );
}

function buildUserSettingsHref(id: string) {
  return `/settings/login/${encodeURIComponent(id)}`;
}

function getStoredUserId() {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    const rawUser = window.localStorage.getItem("sm1:user");
    const user = rawUser ? (JSON.parse(rawUser) as { id?: string }) : null;
    return user?.id ?? "";
  } catch {
    return "";
  }
}

function SectionTitle({ children, icon: Icon }: { children: string; icon?: LucideIcon }) {
  return (
    <div className="flex items-center gap-2 px-1 text-[#8d7b56]">
      {Icon ? <Icon size={16} strokeWidth={1.7} /> : <span className="h-4 w-1 rounded-full bg-[#c5a45f]" />}
      <h2 className="text-[14px] font-semibold tracking-[0.12em]">{children}</h2>
    </div>
  );
}

function MenuSection({ title, items, className }: { title: string; items: MenuItem[]; className?: string }) {
  return (
    <section className={cn("px-4", className)}>
      <SectionTitle>{title}</SectionTitle>
      <div className="mt-2.5 overflow-hidden rounded-[24px] border border-[#e5d8bc] bg-[#fffdf7] shadow-soft">
        {items.map((item, index) => (
          <MenuRow key={item.label} item={item} last={index === items.length - 1} />
        ))}
      </div>
    </section>
  );
}

function MenuRow({ item, last }: { item: MenuItem; last: boolean }) {
  const Icon = item.icon;
  const content = (
      <div className={cn("ml-[61px] flex h-16 items-center justify-between pr-[18px]", !last && "border-b border-[var(--color-row-border)]")}>
      <div className="-ml-[42px] flex items-center gap-[18px] text-[17px] font-semibold text-ink">
        <Icon className="w-6 text-[var(--color-icon)]" size={23} strokeWidth={1.7} />
        <span>{item.label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        {item.status ? <span className="text-[12px] font-semibold text-[var(--color-danger)]">{item.status}</span> : null}
        <ChevronRight className="text-[var(--color-chevron)]" size={23} strokeWidth={1.5} />
      </div>
    </div>
  );

  if (item.href) {
    return (
      <Link href={item.href} className="block">
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className="block w-full text-left">
      {content}
    </button>
  );
}

function AppearancePicker() {
  const [mode, setMode] = useState<ThemeMode>("system");

  useEffect(() => {
    const storedMode = resolveStoredTheme(window.localStorage.getItem(themeStorageKey));
    setMode(storedMode);
    applyThemeMode(storedMode);
  }, []);

  const updateMode = (nextMode: ThemeMode) => {
    window.localStorage.setItem(themeStorageKey, nextMode);
    setMode(nextMode);
    applyThemeMode(nextMode);
  };

  return (
    <div className="mt-4 grid grid-cols-3 gap-2">
      {appearanceOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={mode === option.value}
          onClick={() => updateMode(option.value)}
          className={cn(
            "relative min-w-0 rounded-[15px] border bg-[var(--color-control)] p-2 text-center transition duration-200",
            mode === option.value
              ? "border-[#b88b2d] text-[#a8781c] shadow-[0_5px_16px_rgba(128,90,22,0.12)]"
              : "border-[var(--color-control-border)] text-[var(--color-secondary-text)]"
          )}
        >
          <ThemePreview mode={option.value} />
          <span className="mt-2 block truncate text-[12px] font-semibold">{option.label}</span>
          {mode === option.value ? <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#b88b2d] ring-2 ring-[var(--color-surface)]" /> : null}
        </button>
      ))}
    </div>
  );
}

function ThemePreview({ mode }: { mode: ThemeMode }) {
  return (
    <span
      className={cn(
        "relative block h-[54px] overflow-hidden rounded-[10px] border border-black/5",
        mode === "light" && "bg-[#fffdf7]",
        mode === "dark" && "bg-[#1b1c20]",
        mode === "system" && "bg-[linear-gradient(90deg,#fffdf7_0_50%,#1b1c20_50%)]"
      )}
      aria-hidden="true"
    >
      <span className={cn("absolute left-2 right-2 top-2 h-2 rounded-full", mode === "dark" ? "bg-white/15" : "bg-black/10")} />
      <span className={cn("absolute bottom-2 left-2 h-5 w-[44%] rounded-md", mode === "dark" ? "bg-[#8c6c2e]" : "bg-[#d8b76d]")} />
      <span className={cn("absolute bottom-2 right-2 h-5 w-[35%] rounded-md", mode === "dark" ? "bg-white/10" : "bg-black/5")} />
    </span>
  );
}

const appearanceOptions: Array<{ label: string; value: ThemeMode }> = [
  { label: "浅色", value: "light" },
  { label: "深色", value: "dark" },
  { label: "跟随系统", value: "system" }
];
