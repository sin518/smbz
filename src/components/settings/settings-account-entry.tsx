"use client";

import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SettingsAccountName } from "@/components/settings/settings-account-name";

type SessionResponse = {
  session?: unknown;
  user?: {
    id?: string | null;
  } | null;
};

export function SettingsAccountEntry() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  async function openAccount() {
    if (checking) {
      return;
    }

    setChecking(true);

    try {
      const response = await fetch("/api/auth/get-session", {
        method: "GET",
        credentials: "include"
      });
      const data = response.ok ? ((await response.json()) as SessionResponse | null) : null;

      if (data?.session && data.user?.id) {
        router.push(buildUserSettingsHref(data.user.id));
        return;
      }
    } catch {
      // Treat session lookup failure as signed out.
    }

    router.push("/settings/login");
  }

  return (
    <button type="button" onClick={openAccount} className="relative flex w-full items-center gap-5 overflow-hidden text-left" aria-label="登录或查看账号">
      <div className="pointer-events-none absolute -right-8 -top-6 h-44 w-44 rounded-full border-[14px] border-[#ece8dc] opacity-70">
        <div className="absolute inset-8 rounded-full border-[12px] border-[#ece8dc]" />
        <div className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#e2ded2]" />
      </div>
      <div className="flex h-[82px] w-[82px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[radial-gradient(circle_at_35%_25%,#f7d18d,#7b4d31_42%,#192235_76%)] text-[40px] font-semibold text-white shadow-[0_10px_24px_rgba(35,30,18,0.12)]">
        真
      </div>
      <div className="relative z-10 min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2 text-[#33312d]">
          <SettingsAccountName />
        </div>
        <p className="mt-3 text-[17px] leading-none text-[#8c887d]">
          <span>初学弟子</span>
          <span className="ml-3">已研究0个八字</span>
        </p>
      </div>
      <ChevronRight className="relative z-10 shrink-0 text-[#8c887d]" size={28} strokeWidth={2.2} />
    </button>
  );
}

function buildUserSettingsHref(id: string) {
  return `/settings/login/${encodeURIComponent(id)}`;
}
