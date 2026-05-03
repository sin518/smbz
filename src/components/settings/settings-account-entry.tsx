"use client";

import { ChevronRight, Diamond } from "lucide-react";
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
    <button type="button" onClick={openAccount} className="flex w-full items-center gap-4 text-left" aria-label="登录或查看账号">
      <div className="flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-full border-2 border-[#d8b96d] bg-black text-[42px] font-semibold text-[#d8b96d] shadow-[inset_0_0_18px_rgba(216,185,109,0.35)]">
        真
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <SettingsAccountName />
          <span className="inline-flex h-9 items-center gap-1 rounded-[8px] bg-white/35 px-3 text-[15px] font-medium text-white">
            <Diamond size={18} strokeWidth={1.8} />
            未开通会员
          </span>
        </div>
        <p className="mt-4 text-[17px] leading-none">
          <span className="text-[#d8b96d]">初学弟子</span>
          <span className="ml-3 text-white">您已研究0个八字</span>
        </p>
      </div>
      <ChevronRight className="shrink-0 text-white" size={31} strokeWidth={2.4} />
    </button>
  );
}

function buildUserSettingsHref(id: string) {
  return `/settings/login/${encodeURIComponent(id)}`;
}
