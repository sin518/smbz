"use client";

import Link from "next/link";
import { ChevronRight, Cloud, CloudOff, RefreshCw, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { AppBottomNav } from "@/components/app-bottom-nav";
import {
  deleteLocalBaziRecord,
  getLocalBaziRecords,
  scheduleDailyBaziRecordSync,
  syncPendingBaziRecords,
  type LocalBaziRecord
} from "@/lib/bazi/local-records";

export default function RecordsPage() {
  const [records, setRecords] = useState<LocalBaziRecord[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  useEffect(() => {
    setRecords(getLocalBaziRecords());
    scheduleDailyBaziRecordSync();
  }, []);

  async function handleManualSync() {
    setSyncing(true);
    setSyncMessage("正在上传本机排盘记录，请勿关闭页面。");

    try {
      const [nextRecords] = await Promise.all([
        syncPendingBaziRecords(true),
        waitForMinimumUploadAnimation()
      ]);
      setRecords(nextRecords);
      const pendingCount = nextRecords.filter((record) => record.syncStatus !== "synced").length;
      setSyncMessage(pendingCount > 0 ? `上传完成，仍有 ${pendingCount} 条等待下次同步。` : "上传完成，记录已同步。");
    } finally {
      setSyncing(false);
      window.setTimeout(() => setSyncMessage(""), 3200);
    }
  }

  function handleDeleteRecord(id: string) {
    const confirmed = window.confirm("删除后仅会移除本机记录，无法从当前浏览器恢复。确定删除吗？");
    if (!confirmed) {
      return;
    }

    setRecords(deleteLocalBaziRecord(id));
  }

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
          <div className="mt-2 flex items-center justify-between gap-3">
            <h2 className="text-[22px] font-semibold">本地优先保存</h2>
            <button
              type="button"
              onClick={handleManualSync}
              disabled={syncing}
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-black px-4 text-[14px] font-semibold text-[#e8d4a7] disabled:opacity-60"
            >
              <RefreshCw size={15} className={syncing ? "animate-spin" : undefined} />
              {syncing ? "上传中" : "手动上传"}
            </button>
          </div>
          <p className="mt-2 text-[14px] leading-6 text-mutedInk">打开记录页只读取本机数据；每天 03:30 后浏览器空闲时自动尝试同步到云端。</p>
          {syncing || syncMessage ? (
            <div className="mt-4 overflow-hidden rounded-2xl bg-[#f6f0e2] px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black text-[#e8d4a7]">
                  <RefreshCw size={16} className={syncing ? "animate-spin" : undefined} />
                  {syncing ? <span className="absolute inset-[-4px] animate-ping rounded-full border border-black/25" /> : null}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-[#4d4537]">{syncing ? "正在上传资料" : "上传状态"}</p>
                  <p className="mt-0.5 text-[13px] leading-5 text-[#8f7b52]">{syncMessage}</p>
                </div>
              </div>
              {syncing ? (
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white">
                  <div className="h-full w-1/2 animate-[sync-progress_1.1s_ease-in-out_infinite] rounded-full bg-black" />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      {records.length > 0 ? (
        <section className="space-y-3 px-4 pt-5">
          {records.map((record) => (
            <div key={record.id} className="rounded-[22px] bg-white p-4 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <Link href={`/bazi/local/${record.id}`} className="min-w-0 flex-1">
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
                </Link>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleDeleteRecord(record.id)}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-[#b07a69] transition-colors hover:bg-[#f8eee9]"
                    aria-label={`删除${record.name || "未命名"}记录`}
                  >
                    <Trash2 size={18} />
                  </button>
                  <Link href={`/bazi/local/${record.id}`} className="flex h-9 w-7 items-center justify-center" aria-label={`打开${record.name || "未命名"}记录`}>
                    <ChevronRight size={22} className="text-[#b7b1a5]" />
                  </Link>
                </div>
              </div>
            </div>
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

function waitForMinimumUploadAnimation() {
  return new Promise((resolve) => window.setTimeout(resolve, 2000));
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
