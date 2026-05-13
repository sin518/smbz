"use client";

import Link from "next/link";
import { ChevronRight, Cloud, CloudOff, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { AppBottomNav } from "@/components/app-bottom-nav";
import {
  getLocalBaziRecords,
  scheduleDailyBaziRecordSync,
  type LocalBaziRecord
} from "@/lib/bazi/local-records";

export default function RecordsPage() {
  const [records, setRecords] = useState<LocalBaziRecord[]>([]);

  useEffect(() => {
    setRecords(getLocalBaziRecords());
    scheduleDailyBaziRecordSync();
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

      <section className="px-4 pt-5">
        <div className="rounded-[22px] bg-white p-5 shadow-soft">
          <p className="text-sm text-mutedInk">本机记录</p>
          <h2 className="mt-2 text-[22px] font-semibold">本地优先保存</h2>
          <p className="mt-2 text-[14px] leading-6 text-mutedInk">打开记录页只读取本机数据；每天 03:30 后浏览器空闲时自动尝试同步到云端。</p>
        </div>
      </section>

      {records.length > 0 ? (
        <section className="space-y-3 px-4 pt-5">
          {records.map((record) => (
            <Link key={record.id} href={`/bazi/local/${record.id}`} className="block rounded-[22px] bg-white p-4 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-[21px] font-semibold">{record.name || "未命名"}</h2>
                    <span className="rounded-full bg-[#f6f0e2] px-2 py-0.5 text-[12px] font-semibold text-[#a58024]">
                      {record.gender === "female" ? "女" : "男"}
                    </span>
                    <SyncBadge status={record.syncStatus} />
                  </div>
                  <p className="mt-2 truncate text-[14px] font-semibold text-[#55514a]">{record.pillars || "四柱待生成"}</p>
                  <p className="mt-1 truncate text-[13px] leading-6 text-mutedInk">
                    {formatDateTime(record.birthTime)} · {record.location || "未知地"}
                  </p>
                  <p className="text-[13px] leading-6 text-mutedInk">
                    {formatCalendar(record.calendar)}{record.useSolarTime ? " · 真太阳时" : ""} · {formatCreatedAt(record.createdAt)}
                  </p>
                </div>
                <ChevronRight size={22} className="mt-1 shrink-0 text-[#b7b1a5]" />
              </div>
            </Link>
          ))}
        </section>
      ) : (
        <section className="px-4 pt-5">
          <div className="rounded-[22px] bg-white p-6 text-center shadow-soft">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f6f0e2] text-[#a58024]">
              <Search size={27} />
            </div>
            <h2 className="mt-4 text-[22px] font-semibold">暂无本机记录</h2>
            <p className="mt-3 text-[15px] leading-7 text-mutedInk">新建排盘并保存后，会先存到本机，不需要等待服务器。</p>
            <Link href="/" className="mt-5 flex h-12 items-center justify-center rounded-full bg-black text-[18px] font-semibold text-[#e8d4a7]">
              新建排盘
            </Link>
          </div>
        </section>
      )}

      <AppBottomNav active="records" />
    </main>
  );
}

function SyncBadge({ status }: { status: LocalBaziRecord["syncStatus"] }) {
  if (status === "synced") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#eef6ed] px-2 py-0.5 text-[11px] font-semibold text-[#5f8d55]">
        <Cloud size={12} />
        已同步
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#f6f0e2] px-2 py-0.5 text-[11px] font-semibold text-[#a58024]">
      <CloudOff size={12} />
      待同步
    </span>
  );
}

function formatDateTime(value: string) {
  return value.replace("T", " ");
}

function formatCreatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatCalendar(value: LocalBaziRecord["calendar"]) {
  if (value === "lunar") {
    return "农历";
  }

  if (value === "pillars") {
    return "四柱";
  }

  return "公历";
}
