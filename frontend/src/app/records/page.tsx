"use client";

import Link from "next/link";
import { ChevronDown, ChevronRight, Cloud, CloudOff, RefreshCw, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { AppBottomNav } from "@/components/app-bottom-nav";
import {
  deleteUnifiedBaziRecordWithRemote,
  getUnifiedBaziRecords,
  scheduleBaziRecordAutoSync,
  syncPendingBaziRecords,
  type LocalBaziRecord
} from "@/lib/bazi/local-records";
import {
  deleteLocalDivinationRecord,
  getLocalDivinationRecords,
  restoreLocalDivinationRecord,
  type LocalDivinationRecord
} from "@/lib/divination/local-records";

type SessionResponse = {
  session?: unknown;
  user?: {
    id?: string | null;
  } | null;
};

type RecordsPageItem =
  | { kind: "bazi"; record: LocalBaziRecord; createdAt: string }
  | { kind: "divination"; record: LocalDivinationRecord; createdAt: string };

type RecordGroupKey = "bazi" | "liuyao" | "qimen";

type RecordGroup = {
  key: RecordGroupKey;
  title: string;
  description: string;
  items: RecordsPageItem[];
};

export default function RecordsPage() {
  const [records, setRecords] = useState<RecordsPageItem[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [deletingRecordKey, setDeletingRecordKey] = useState<string | null>(null);
  const [openGroups, setOpenGroups] = useState<Record<RecordGroupKey, boolean>>({
    bazi: false,
    liuyao: false,
    qimen: false
  });

  useEffect(() => {
    setRecords(getRecordsPageItems());
    scheduleBaziRecordAutoSync();
  }, []);

  async function handleManualSync() {
    const pendingRecords = getUnifiedBaziRecords().filter((record) => record.syncStatus !== "synced");
    if (pendingRecords.length === 0) {
      setRecords(getRecordsPageItems());
      setSyncMessage("当前没有需要上传的本机记录。");
      window.setTimeout(() => setSyncMessage(""), 3200);
      return;
    }

    setSyncing(true);
    setSyncMessage("正在检查登录状态。");

    try {
      const signedIn = await checkSignedIn();
      if (!signedIn) {
        setRecords(getRecordsPageItems());
        setSyncMessage("请先登录账号，再手动上传本机排盘记录。");
        return;
      }

      setSyncMessage("正在上传本机排盘记录，请勿关闭页面。");
      const [nextRecords] = await Promise.all([
        syncPendingBaziRecords(true),
        waitForMinimumUploadAnimation()
      ]);
      setRecords(getRecordsPageItems());
      const pendingCount = nextRecords.filter((record) => record.syncStatus !== "synced").length;
      const failedCount = nextRecords.filter((record) => record.syncStatus === "failed").length;
      setSyncMessage(
        pendingCount > 0
          ? `上传未全部完成，${failedCount > 0 ? `${failedCount} 条上传失败，` : ""}仍有 ${pendingCount} 条待同步。`
          : "上传完成，记录已同步。"
      );
    } finally {
      setSyncing(false);
      window.setTimeout(() => setSyncMessage(""), 3200);
    }
  }

  async function handleDeleteRecord(item: RecordsPageItem) {
    const deleteMessage =
      item.kind === "bazi" && item.record.serverId
        ? "删除后会同时删除数据库里的云端排盘记录，无法从当前浏览器恢复。确定删除吗？"
        : "删除后会移除本机记录，无法从当前浏览器恢复。确定删除吗？";
    const confirmed = window.confirm(deleteMessage);
    if (!confirmed) {
      return;
    }

    const recordKey = getRecordKey(item);
    setDeletingRecordKey(recordKey);
    setSyncMessage("");

    try {
      if (item.kind === "bazi") {
        await deleteUnifiedBaziRecordWithRemote(item.record.id);
      } else {
        deleteLocalDivinationRecord(item.record.id);
      }

      setRecords(getRecordsPageItems());
    } catch {
      setSyncMessage("删除失败：云端记录没有删除成功，本机记录已保留。请稍后重试。");
      window.setTimeout(() => setSyncMessage(""), 3600);
    } finally {
      setDeletingRecordKey(null);
    }
  }

  const groupedRecords = getRecordGroups(records);

  return (
    <main className="light-surface-text-scope app-responsive-shell min-h-screen bg-paper pb-28 text-ink shadow-soft">
      <header className="sticky top-0 z-20 bg-[#F8F7EE] px-5 pb-5 pt-14">
        <div className="flex items-center justify-between">
          <h1 className="text-[30px] font-semibold">排盘记录</h1>
          <Link href="/" className="rounded-full bg-black px-5 py-2 text-[16px] font-semibold text-[#e8d4a7]">
            新建
          </Link>
        </div>
        <div className="mt-5 flex h-12 items-center gap-3 rounded-full bg-[#f2f2f0] px-4 text-[#8b8985]">
          <Search size={21} />
          <span className="text-[16px]">搜索姓名、地点、四柱、占事</span>
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
          <p className="mt-2 text-[14px] leading-6 text-mutedInk">打开应用后会检查本机数据；浏览器在线时每 10 分钟自动尝试同步到云端。</p>
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
        <section className="space-y-4 px-4 pt-5">
          {groupedRecords.map((group) => (
            <section key={group.key} className="space-y-3" aria-labelledby={`record-group-${group.key}`}>
              <button
                type="button"
                onClick={() => setOpenGroups((current) => ({ ...current, [group.key]: !current[group.key] }))}
                className="flex w-full items-center justify-between gap-3 rounded-[18px] bg-white px-4 py-3 text-left shadow-soft"
                aria-expanded={openGroups[group.key]}
                aria-controls={`record-group-panel-${group.key}`}
              >
                <span className="min-w-0">
                  <span id={`record-group-${group.key}`} className="block text-[18px] font-semibold text-ink">
                    {group.title}
                  </span>
                  <span className="mt-1 block text-[13px] leading-5 text-mutedInk">{group.description}</span>
                </span>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f6f0e2] text-[#a58024]">
                  <ChevronDown
                    size={20}
                    className={openGroups[group.key] ? "rotate-180 transition-transform" : "transition-transform"}
                  />
                </span>
              </button>
              {openGroups[group.key] ? (
                <div id={`record-group-panel-${group.key}`} className="space-y-3">
                  {group.items.map((item) => (
                    <RecordCard
                      key={getRecordKey(item)}
                      item={item}
                      deleting={deletingRecordKey === getRecordKey(item)}
                      onDelete={() => void handleDeleteRecord(item)}
                    />
                  ))}
                </div>
              ) : null}
            </section>
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

function RecordCard({
  item,
  deleting,
  onDelete
}: {
  item: RecordsPageItem;
  deleting: boolean;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-[22px] bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <Link
          href={getRecordHref(item)}
          onClick={() => handleOpenRecord(item)}
          className="min-w-0 flex-1"
        >
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h2 className="truncate text-[21px] font-semibold">{getRecordTitle(item)}</h2>
            {item.kind === "bazi" ? (
              <>
                <span className="rounded-full bg-[#f6f0e2] px-2 py-0.5 text-[12px] font-semibold text-[#a58024]">
                  {item.record.gender === "female" ? "女" : "男"}
                </span>
                <SyncBadge status={item.record.syncStatus} />
                {item.record.origin === "profile" ? (
                  <span className="rounded-full bg-[#f2f2f0] px-2 py-0.5 text-[11px] font-semibold text-[#77736b]">档案</span>
                ) : null}
              </>
            ) : (
              <>
                <span className="rounded-full bg-[#e7f0ff] px-2 py-0.5 text-[12px] font-semibold text-[#4e85c7]">
                  {formatDivinationType(item.record.type)}
                </span>
                <LocalBadge />
              </>
            )}
          </div>
          <p className="mt-2 truncate text-[14px] font-semibold text-[#55514a]">{getRecordSummary(item)}</p>
          <p className="mt-1 truncate text-[13px] leading-6 text-mutedInk">
            {getRecordDetail(item)}
          </p>
          <p className="text-[13px] leading-6 text-mutedInk">
            {getRecordMeta(item)}
          </p>
        </Link>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#b07a69] transition-colors hover:bg-[#f8eee9] disabled:opacity-50"
            aria-label={`删除${getRecordTitle(item)}记录`}
          >
            {deleting ? <RefreshCw size={18} className="animate-spin" /> : <Trash2 size={18} />}
          </button>
          <Link
            href={getRecordHref(item)}
            onClick={() => handleOpenRecord(item)}
            className="flex h-9 w-7 items-center justify-center"
            aria-label={`打开${getRecordTitle(item)}记录`}
          >
            <ChevronRight size={22} className="text-[#b7b1a5]" />
          </Link>
        </div>
      </div>
    </div>
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

  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#f8eee9] px-2 py-0.5 text-[11px] font-semibold text-[#b35d45]">
        <CloudOff size={12} />
        上传失败
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

function LocalBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#f2f2f0] px-2 py-0.5 text-[11px] font-semibold text-[#77736b]">
      <Cloud size={12} />
      本地
    </span>
  );
}

function getRecordsPageItems(): RecordsPageItem[] {
  const baziRecords = getUnifiedBaziRecords().map((record) => ({
    kind: "bazi" as const,
    record,
    createdAt: record.createdAt
  }));
  const divinationRecords = getLocalDivinationRecords().map((record) => ({
    kind: "divination" as const,
    record,
    createdAt: record.createdAt
  }));

  return [...baziRecords, ...divinationRecords].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
}

function getRecordGroups(records: RecordsPageItem[]): RecordGroup[] {
  const groups: RecordGroup[] = [
    {
      key: "bazi",
      title: "八字排盘",
      description: "本机保存，已同步的记录删除时会同步删除云端。",
      items: []
    },
    {
      key: "liuyao",
      title: "六爻断事",
      description: "当前为本地记录，删除会移除本机浏览器里的排盘。",
      items: []
    },
    {
      key: "qimen",
      title: "奇门遁甲",
      description: "当前为本地记录，删除会移除本机浏览器里的排盘。",
      items: []
    }
  ];
  const groupMap = new Map(groups.map((group) => [group.key, group]));

  records.forEach((item) => {
    const key = getRecordGroupKey(item);
    groupMap.get(key)?.items.push(item);
  });

  return groups.filter((group) => group.items.length > 0);
}

function getRecordGroupKey(item: RecordsPageItem): RecordGroupKey {
  if (item.kind === "bazi") {
    return "bazi";
  }

  return item.record.type === "qimen" ? "qimen" : "liuyao";
}

function getRecordKey(item: RecordsPageItem) {
  return `${item.kind}-${item.record.id}`;
}

function getRecordTitle(item: RecordsPageItem) {
  return item.kind === "bazi" ? item.record.name || "未命名" : getDivinationQuestion(item.record);
}

function getRecordSummary(item: RecordsPageItem) {
  if (item.kind === "bazi") {
    return item.record.pillars || "四柱待生成";
  }

  return item.record.type === "qimen" ? "奇门遁甲" : "六爻断事";
}

function getRecordDetail(item: RecordsPageItem) {
  if (item.kind === "bazi") {
    return `${formatDateTime(item.record.birthTime)} · ${item.record.location || "未知地"}`;
  }

  return item.record.detail;
}

function getRecordMeta(item: RecordsPageItem) {
  if (item.kind === "bazi") {
    return `${formatCalendar(item.record.calendar)}${item.record.useSolarTime ? " · 真太阳时" : ""} · ${formatCreatedAt(item.record.createdAt)}`;
  }

  return `占事记录 · ${formatCreatedAt(item.record.createdAt)}`;
}

function getRecordHref(item: RecordsPageItem) {
  if (item.kind === "bazi") {
    return `/bazi/local/${item.record.id}`;
  }

  return item.record.type === "qimen" ? "/qimen/result" : "/liuyao/result";
}

function handleOpenRecord(item: RecordsPageItem) {
  if (item.kind === "divination") {
    restoreLocalDivinationRecord(item.record);
  }
}

function formatDivinationType(value: LocalDivinationRecord["type"]) {
  return value === "qimen" ? "奇门" : "六爻";
}

function getDivinationQuestion(record: LocalDivinationRecord) {
  const payloadQuestion = extractQuestionFromPayload(record.payload);
  return payloadQuestion || record.question?.trim() || "未填写占事";
}

function extractQuestionFromPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const record = payload as Record<string, unknown>;
  const input = record.input;

  if (input && typeof input === "object") {
    const inputRecord = input as Record<string, unknown>;

    if (typeof inputRecord.question === "string" && inputRecord.question.trim()) {
      return inputRecord.question.trim();
    }

    const nestedInput = inputRecord.input;
    if (nestedInput && typeof nestedInput === "object") {
      const nestedRecord = nestedInput as Record<string, unknown>;
      if (typeof nestedRecord.question === "string" && nestedRecord.question.trim()) {
        return nestedRecord.question.trim();
      }
    }
  }

  const chart = record.chart;
  if (chart && typeof chart === "object") {
    const chartRecord = chart as Record<string, unknown>;
    if (typeof chartRecord.question === "string" && chartRecord.question.trim()) {
      return chartRecord.question.trim();
    }
  }

  return "";
}

async function checkSignedIn() {
  try {
    const response = await fetch("/api/auth/get-session", {
      method: "GET",
      credentials: "include"
    });
    const data = response.ok ? ((await response.json()) as SessionResponse | null) : null;

    return Boolean(data?.session && data.user?.id);
  } catch {
    return false;
  }
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
