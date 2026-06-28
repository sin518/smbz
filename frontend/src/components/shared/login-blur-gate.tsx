"use client";

import { LockKeyhole } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

type SessionResponse = {
  session?: unknown;
  user?: unknown;
};

export function LoginBlurGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "signed-in" | "signed-out">("loading");
  const nextHref = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const response = await fetch("/api/auth/get-session", {
          method: "GET",
          credentials: "include"
        });
        const data = response.ok ? ((await response.json()) as SessionResponse | null) : null;

        if (!cancelled) {
          setStatus(data?.session && data.user ? "signed-in" : "signed-out");
        }
      } catch {
        if (!cancelled) {
          setStatus("signed-out");
        }
      }
    }

    void checkSession();

    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "signed-in") {
    return children;
  }

  return (
    <div className="relative" data-login-blur-gate="true">
      {status === "loading" ? (
        <div className="select-none opacity-70 blur-[4px]" aria-hidden="true">
          {children}
        </div>
      ) : (
        <div className="space-y-3 rounded-[9px] bg-white px-3 py-3 blur-[4px]" aria-hidden="true">
          <div className="h-4 w-32 rounded-full bg-[#d8cec0]" />
          <div className="grid grid-cols-[42px_1fr] gap-x-2 gap-y-2">
            <div className="h-9 w-9 rounded-full bg-[#eadcc8]" />
            <div className="space-y-2 py-1">
              <div className="h-3 rounded-full bg-[#d8cec0]" />
              <div className="h-3 w-4/5 rounded-full bg-[#e5dbcf]" />
            </div>
            <div className="h-9 w-9 rounded-full bg-[#eadcc8]" />
            <div className="space-y-2 py-1">
              <div className="h-3 rounded-full bg-[#d8cec0]" />
              <div className="h-3 w-3/4 rounded-full bg-[#e5dbcf]" />
            </div>
          </div>
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="border-t border-[#eee5d8] pt-3">
              <div className="mb-2 h-3 w-24 rounded-full bg-[#d8cec0]" />
              <div className="space-y-2">
                <div className="h-3 rounded-full bg-[#e2d8ca]" />
                <div className="h-3 w-5/6 rounded-full bg-[#e7ded3]" />
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center rounded-[9px] bg-white/62 px-4 text-center backdrop-blur-[1px]">
        <div className="rounded-[10px] border border-[#ead8bd] bg-white/95 px-4 py-3 shadow-[0_8px_24px_rgba(31,25,18,0.12)]">
          <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#fff3e4] text-[#b57936]">
            <LockKeyhole size={18} strokeWidth={1.8} />
          </div>
          <p className="text-[13px] font-semibold text-[#2f2b26]">登录后查看完整分析</p>
          <p className="mt-1 text-[11px] leading-4 text-[#8d857b]">事业格局、优势劣势与流年提示已为你生成</p>
          <button
            type="button"
            onClick={() => router.push(`/settings/login?next=${encodeURIComponent(nextHref)}`)}
            className="mt-3 rounded-full bg-black px-5 py-2 text-[12px] font-semibold text-[#ead7aa]"
          >
            去登录
          </button>
        </div>
      </div>
    </div>
  );
}
