"use client";

import {
  ChevronRight,
  CircleDotDashed,
  Settings,
  Smartphone,
  Sun,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AppBottomNav } from "@/components/app-bottom-nav";
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
  accent?: boolean;
  right?: ReactNode;
};

const firstMenu: MenuItem[] = [
  { label: "已读主题", icon: CircleDotDashed, href: "/records" }
];

const secondMenu: MenuItem[] = [
  { label: "Android 版", icon: Smartphone, accent: true },
  {
    label: "外观",
    icon: Sun,
    right: <AppearanceSwitch />
  }
];

export default function SettingsPage() {
  const [authState, setAuthState] = useState<AuthState>({ status: "loading" });
  const profileHref = authState.status === "signed-in" && authState.userId ? buildUserSettingsHref(authState.userId) : "/settings/login";
  const loginLabel = authState.status === "signed-in" ? "已登录" : "登录";
  const userMenu = [
    secondMenu[0],
    { label: "用户资料", icon: Settings, href: profileHref },
    secondMenu[1]
  ].filter(Boolean) as MenuItem[];

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

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
    <main className="relative mx-auto min-h-screen max-w-[430px] overflow-hidden bg-paper pb-[108px] text-ink shadow-soft">
      <header className="sticky top-0 z-20 bg-[#F8F7EE] px-5 pb-5 pt-14">
        <h1 className="text-[30px] font-semibold">设置</h1>
      </header>

      <section className="px-4 pt-2">
        <div className="flex h-[126px] items-center justify-center rounded-[22px] bg-white shadow-soft">
          <Link
            href={profileHref}
            className="flex h-[52px] w-28 items-center justify-center rounded-full bg-black text-[24px] font-bold text-[#e8d4a7]"
          >
            {loginLabel}
          </Link>
        </div>
      </section>

      <MenuSection className="mt-5" items={firstMenu} />
      <MenuSection items={userMenu} />

      <AppBottomNav active="settings" />
    </main>
  );
}

function buildUserSettingsHref(id: string) {
  return `/settings/login/${encodeURIComponent(id)}`;
}

function MenuSection({ items, className }: { items: MenuItem[]; className?: string }) {
  return (
    <section className={cn("px-4 pt-4", className)}>
      <div className="overflow-hidden rounded-[22px] bg-white shadow-soft">
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
    <div className={cn("ml-[61px] flex h-16 items-center justify-between pr-[18px]", !last && "border-b border-[#ebe7dd]")}>
      <div className="-ml-[42px] flex items-center gap-[22px] text-[20px] font-bold text-[#33312e]">
        <Icon className={cn("w-6 text-[#a58024]", item.accent && "text-[#a58024]")} size={27} strokeWidth={1.7} />
        <span>{item.label}</span>
      </div>
      {item.right ?? <ChevronRight className="text-[#a9a59d]" size={32} strokeWidth={1.5} />}
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

function AppearanceSwitch() {
  return (
    <div className="flex h-7 w-[218px] items-center rounded-[10px] bg-[#f2f0e8] p-0.5 text-[15px] font-bold text-[#9d9a92]">
      <span className="flex-1 text-center leading-6">浅色</span>
      <span className="flex-1 border-l border-[#e0dbce] text-center leading-6">深色</span>
      <span className="flex-1 rounded-lg bg-black text-center leading-6 text-[#e8d4a7]">跟随系统</span>
    </div>
  );
}
