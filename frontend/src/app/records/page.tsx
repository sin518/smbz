"use client";

import Link from "next/link";
import { Search, UserRoundCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { AppBottomNav } from "@/components/app-bottom-nav";

type SessionUser = {
  id?: string;
  phone?: string;
  email?: string | null;
  name?: string | null;
} | null;

export default function RecordsPage() {
  const [sessionUser, setSessionUser] = useState<SessionUser>(null);
  const [status, setStatus] = useState<"loading" | "ready">("loading");

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
        const data = response.ok ? ((await response.json()) as { session?: unknown; user?: SessionUser } | null) : null;

        if (mounted) {
          setSessionUser(data?.session && data.user?.id ? data.user : null);
        }
      } catch {
        if (mounted) {
          setSessionUser(null);
        }
      } finally {
        if (mounted) {
          setStatus("ready");
        }
      }
    }

    void loadSession();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  return (
    <main className="light-surface-text-scope mx-auto min-h-screen max-w-[430px] bg-paper pb-28 text-ink shadow-soft">
      <header className="sticky top-0 z-20 bg-[#F8F7EE] px-5 pb-5 pt-14">
        <div className="flex items-center justify-between">
          <h1 className="text-[30px] font-semibold">排盘记录</h1>
          <Link href="/" className="rounded-full bg-black px-5 py-2 text-[16px] font-semibold text-[#e8d4a7]">
            新建
          </Link>
        </div>
        <div className="mt-5 flex h-12 items-center gap-3 rounded-full bg-[#f2f2f0] px-4 text-[#8b8985]">
          <Search size={21} />
          <span className="text-[16px]">搜索姓名、地点、四柱</span>
        </div>
      </header>

      {status === "loading" ? <RecordsLoadingCard /> : sessionUser ? <RecordsContent user={sessionUser} /> : <LoginRequiredCard />}

      <AppBottomNav active="records" />
    </main>
  );
}

function RecordsContent({ user }: { user: SessionUser }) {
  const accountName = user?.name || user?.phone || user?.email || "已登录用户";

  return (
    <>
      <section className="px-4 pt-5">
        <div className="rounded-[22px] bg-white p-5 shadow-soft">
          <p className="text-sm text-mutedInk">当前账号</p>
          <h2 className="mt-2 break-all text-[22px] font-semibold">{accountName}</h2>
          <p className="mt-2 text-[14px] leading-6 text-mutedInk">只会显示该账号保存到数据库的排盘记录。</p>
        </div>
      </section>

      <section className="px-4 pt-5">
        <div className="rounded-[22px] bg-white p-6 text-center shadow-soft">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f6f0e2] text-[#a58024]">
            <Search size={27} />
          </div>
          <h2 className="mt-4 text-[22px] font-semibold">暂无排盘记录</h2>
          <p className="mt-3 text-[15px] leading-7 text-mutedInk">演示记录已清空。新建排盘并保存后，会在这里显示当前账号自己的记录。</p>
          <Link href="/" className="mt-5 flex h-12 items-center justify-center rounded-full bg-black text-[18px] font-semibold text-[#e8d4a7]">
            新建排盘
          </Link>
        </div>
      </section>
    </>
  );
}

function RecordsLoadingCard() {
  return (
    <section className="px-4 pt-10">
      <div className="rounded-[22px] bg-white p-6 text-center shadow-soft">
        <div className="mx-auto h-14 w-14 animate-pulse rounded-full bg-[#f6f0e2]" />
        <h2 className="mt-4 text-[22px] font-semibold">正在读取记录</h2>
        <p className="mt-3 text-[15px] leading-7 text-mutedInk">请稍候，正在确认当前登录状态。</p>
      </div>
    </section>
  );
}

function LoginRequiredCard() {
  return (
    <section className="px-4 pt-10">
      <div className="rounded-[22px] bg-white p-6 text-center shadow-soft">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f6f0e2] text-[#a58024]">
          <UserRoundCheck size={28} />
        </div>
        <h2 className="mt-4 text-[22px] font-semibold">登录后查看排盘记录</h2>
        <p className="mt-3 text-[15px] leading-7 text-mutedInk">当前未登录，记录列表已隐藏。登录后会显示已保存的排盘和 AI 报告。</p>
        <Link href="/settings/login?next=%2Frecords" className="mt-5 flex h-12 items-center justify-center rounded-full bg-black text-[18px] font-semibold text-[#e8d4a7]">
          去登录
        </Link>
      </div>
    </section>
  );
}
