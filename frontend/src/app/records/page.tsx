"use client";

import Link from "next/link";
import { Check, ChevronDown, ChevronRight, Cloud, CloudOff, ListChecks, RefreshCw, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppBottomNav } from "@/components/app-bottom-nav";
import {
  deleteCloudBaziRecord,
  deleteUnifiedBaziRecordWithRemote,
  fetchCloudBaziRecords,
  getUnifiedBaziRecords,
  scheduleBaziRecordAutoSync,
  syncPendingBaziRecords,
  type CloudBaziRecord,
  type LocalBaziRecord
} from "@/lib/bazi/local-records";
import {
  deleteDivinationRecordWithRemote,
  fetchCloudDivinationRecords,
  getLocalDivinationRecords,
  restoreLocalDivinationRecord,
  syncAllPendingRecords,
  type LocalDivinationRecord
} from "@/lib/divination/local-records";
import { DivinationSyncStatusBadge as DivinationSyncBadge } from "@/components/divination/divination-sync-status-badge";
import { cn } from "@/lib/utils";

type SessionResponse = {
  session?: unknown;
  user?: {
    id?: string | null;
  } | null;
};

type RecordsPageItem =
  | { kind: "bazi"; record: LocalBaziRecord | CloudBaziRecord; createdAt: string }
  | { kind: "divination"; record: LocalDivinationRecord; createdAt: string };

type RecordGroupKey = "bazi" | "liuyao" | "qimen" | "ziwei" | "daliuren";
type RecordFilter = "all" | RecordGroupKey;

type RecordGroup = {
  key: RecordGroupKey;
  title: string;
  description: string;
  items: RecordsPageItem[];
};

const recordFilters: Array<{ label: string; value: RecordFilter }> = [
  { label: "全部", value: "all" },
  { label: "八字", value: "bazi" },
  { label: "六爻", value: "liuyao" },
  { label: "紫微", value: "ziwei" },
  { label: "奇门", value: "qimen" },
  { label: "六壬", value: "daliuren" }
];

export default function RecordsPage() {
  const [records, setRecords] = useState<RecordsPageItem[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<RecordFilter>("all");
  const [deletingRecordKey, setDeletingRecordKey] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedRecordKeys, setSelectedRecordKeys] = useState<Set<string>>(() => new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<RecordGroupKey, boolean>>({
    bazi: false,
    liuyao: false,
    qimen: false,
    ziwei: false,
    daliuren: false
  });

  useEffect(() => {
    setRecords(getRecordsPageItems());
    scheduleBaziRecordAutoSync();

    let mounted = true;
    void fetchRecordsPageItemsFromCloud().then((nextRecords) => {
      if (mounted) {
        setRecords(nextRecords);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  async function handleManualSync() {
    const pendingBazi = getUnifiedBaziRecords().filter((record) => record.syncStatus !== "synced");
    const pendingDivination = getLocalDivinationRecords().filter((record) => record.syncStatus !== "synced");
    const totalPending = pendingBazi.length + pendingDivination.length;

    if (totalPending === 0) {
      setRecords(await fetchRecordsPageItemsFromCloud());
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
      const [nextBaziRecords, divinationResult] = await Promise.all([
        syncPendingBaziRecords(true),
        syncAllPendingRecords(),
        waitForMinimumUploadAnimation()
      ]);

      const attemptedBaziIds = new Set(pendingBazi.map((record) => record.id));
      const attemptedBaziRecords = nextBaziRecords.filter((record) => attemptedBaziIds.has(record.id));
      const pendingCount =
        attemptedBaziRecords.filter((record) => record.syncStatus !== "synced").length + divinationResult.failed;
      const failedCount =
        attemptedBaziRecords.filter((record) => record.syncStatus === "failed").length + divinationResult.failed;
      const successCount =
        attemptedBaziRecords.filter((record) => record.syncStatus === "synced").length + divinationResult.success;
      setRecords(await fetchRecordsPageItemsFromCloud());

      setSyncMessage(
        pendingCount > 0
          ? `上传未全部完成，${successCount > 0 ? `成功 ${successCount} 条，` : ""}${failedCount > 0 ? `失败 ${failedCount} 条，` : ""}仍有 ${pendingCount} 条待同步。`
          : "上传完成，记录已同步。"
      );
    } finally {
      setSyncing(false);
      window.setTimeout(() => setSyncMessage(""), 3200);
    }
  }

  async function handleDeleteRecord(item: RecordsPageItem) {
    const deleteMessage =
      item.record.serverId
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
      await deleteRecordItem(item);
      setRecords(await fetchRecordsPageItemsFromCloud());
    } catch {
      setSyncMessage("删除失败：云端记录没有删除成功，本机记录已保留。请稍后重试。");
      window.setTimeout(() => setSyncMessage(""), 3600);
    } finally {
      setDeletingRecordKey(null);
    }
  }

  async function deleteRecordItem(item: RecordsPageItem) {
    if (item.kind === "bazi") {
      if (item.record.origin === "cloud" && item.record.serverId) {
        await deleteCloudBaziRecord(item.record.serverId);
      } else {
        await deleteUnifiedBaziRecordWithRemote(item.record.id);
      }
      return;
    }

    await deleteDivinationRecordWithRemote(item.record);
  }

  const filteredRecords = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase("zh-CN");

    return records.filter((item) => {
      const matchesType = activeFilter === "all" || getRecordGroupKey(item) === activeFilter;
      const matchesQuery = !normalizedQuery || getRecordSearchText(item).toLocaleLowerCase("zh-CN").includes(normalizedQuery);
      return matchesType && matchesQuery;
    });
  }, [activeFilter, records, searchQuery]);
  const groupedRecords = getRecordGroups(filteredRecords);
  const hasActiveFilters = activeFilter !== "all" || Boolean(searchQuery.trim());
  const selectedRecords = records.filter((item) => selectedRecordKeys.has(getRecordKey(item)));
  const allFilteredSelected = filteredRecords.length > 0 && filteredRecords.every((item) => selectedRecordKeys.has(getRecordKey(item)));

  function selectFilter(filter: RecordFilter) {
    setActiveFilter(filter);
    if (filter !== "all") {
      setOpenGroups((current) => ({ ...current, [filter]: true }));
    }
  }

  function toggleSelectionMode() {
    setSelectionMode((current) => !current);
    setSelectedRecordKeys(new Set());
  }

  function toggleRecordSelection(item: RecordsPageItem) {
    const key = getRecordKey(item);
    setSelectedRecordKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function toggleSelectAllFiltered() {
    setSelectedRecordKeys((current) => {
      const next = new Set(current);
      if (allFilteredSelected) {
        filteredRecords.forEach((item) => next.delete(getRecordKey(item)));
      } else {
        filteredRecords.forEach((item) => next.add(getRecordKey(item)));
      }
      return next;
    });
  }

  async function handleBulkDelete() {
    if (selectedRecords.length === 0 || bulkDeleting) {
      return;
    }

    const cloudCount = selectedRecords.filter((item) => Boolean(item.record.serverId)).length;
    const confirmed = window.confirm(
      `确定删除选中的 ${selectedRecords.length} 条记录吗？${cloudCount > 0 ? `其中 ${cloudCount} 条已关联云端，将同步删除云端记录。` : ""}删除后无法恢复。`
    );
    if (!confirmed) {
      return;
    }

    setBulkDeleting(true);
    setSyncMessage("");
    let successCount = 0;
    let failedCount = 0;

    for (const item of selectedRecords) {
      try {
        await deleteRecordItem(item);
        successCount += 1;
      } catch {
        failedCount += 1;
      }
    }

    setRecords(await fetchRecordsPageItemsFromCloud());
    setSelectedRecordKeys(new Set());
    setSelectionMode(false);
    setBulkDeleting(false);
    setSyncMessage(failedCount > 0 ? `已删除 ${successCount} 条，${failedCount} 条删除失败并已保留。` : `已删除 ${successCount} 条记录。`);
    window.setTimeout(() => setSyncMessage(""), 3600);
  }

  return (
    <main className="light-surface-text-scope app-responsive-shell min-h-screen bg-[#F8F7EE] pb-28 text-ink shadow-soft">
      <header className="liquid-glass sticky top-0 z-20 border-b border-white/55 px-4 pb-4 pt-7">
        <div className="flex items-center justify-between">
          <h1 className="text-[28px] font-semibold tracking-[0.03em]">排盘记录</h1>
          <div className="flex items-center gap-2">
            {records.length > 0 ? (
              <button
                type="button"
                onClick={toggleSelectionMode}
                className="flex h-9 items-center gap-1 rounded-full border border-[#ded2b8] bg-[#fffdf7]/75 px-3 text-[12px] font-semibold text-mutedInk"
              >
                {selectionMode ? <X size={15} /> : <ListChecks size={15} />}
                {selectionMode ? "完成" : "批量"}
              </button>
            ) : null}
          </div>
        </div>
        <label className="mt-4 flex h-12 items-center gap-3 rounded-[18px] border border-white/70 bg-[var(--glass-surface)] px-4 text-[#8b8985] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
          <Search size={20} className="shrink-0" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="搜索姓名、地点、四柱、占事"
            className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-mutedInk"
          />
        </label>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="记录类型筛选">
          {recordFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              aria-pressed={activeFilter === filter.value}
              onClick={() => selectFilter(filter.value)}
              className={cn(
                "h-8 shrink-0 rounded-full border px-3.5 text-[12px] font-semibold transition-colors",
                activeFilter === filter.value
                  ? "border-[#b88b2d] bg-[#b88b2d] text-white"
                  : "border-[#ded2b8] bg-[#fffdf7]/75 text-mutedInk"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </header>

      {selectionMode ? (
        <section className="px-4 pt-4">
          <div className="liquid-glass flex min-h-[58px] items-center justify-between gap-3 rounded-[20px] border border-white/60 px-4">
            <div>
              <p className="text-[14px] font-semibold">已选择 {selectedRecords.length} 条</p>
              <button type="button" onClick={toggleSelectAllFiltered} className="mt-1 text-[12px] font-medium text-[#9b701f]">
                {allFilteredSelected ? "取消全选当前结果" : `全选当前结果（${filteredRecords.length}）`}
              </button>
            </div>
            <button
              type="button"
              onClick={() => void handleBulkDelete()}
              disabled={selectedRecords.length === 0 || bulkDeleting}
              className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-[#b95c4f] px-4 text-[13px] font-semibold text-white disabled:opacity-40"
            >
              {bulkDeleting ? <RefreshCw size={15} className="animate-spin" /> : <Trash2 size={15} />}
              删除
            </button>
          </div>
        </section>
      ) : null}

      <section className="px-4 pt-5">
        <div className="rounded-[22px] border border-[#e5d8bc] bg-[#fffdf7] p-4 shadow-soft">
          <p className="text-sm text-mutedInk">本机与云端记录</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <h2 className="text-[20px] font-semibold">本地优先保存</h2>
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
          <p className="mt-2 text-[14px] leading-6 text-mutedInk">登录后会读取云端记录；本机新记录会每 10 分钟自动尝试上传。</p>
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

      {filteredRecords.length > 0 ? (
        <section className="space-y-4 px-4 pt-5">
          {groupedRecords.map((group) => (
            <section key={group.key} className="space-y-3" aria-labelledby={`record-group-${group.key}`}>
              <button
                type="button"
                onClick={() => setOpenGroups((current) => ({ ...current, [group.key]: !current[group.key] }))}
                className="flex w-full items-center justify-between gap-3 rounded-[18px] border border-[#e5d8bc] bg-[#fffdf7] px-4 py-3 text-left shadow-soft"
                aria-expanded={openGroups[group.key]}
                aria-controls={`record-group-panel-${group.key}`}
              >
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span id={`record-group-${group.key}`} className="block text-[18px] font-semibold text-ink">{group.title}</span>
                    <span className="rounded-full bg-[#f6f0e2] px-2 py-0.5 text-[11px] font-semibold text-[#9b701f]">{group.items.length}</span>
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
                      selectionMode={selectionMode}
                      selected={selectedRecordKeys.has(getRecordKey(item))}
                      onToggleSelection={() => toggleRecordSelection(item)}
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
          <div className="rounded-[22px] border border-[#e5d8bc] bg-[#fffdf7] p-6 text-center shadow-soft">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f6f0e2] text-[#a58024]">
              <Search size={27} />
            </div>
            <h2 className="mt-4 text-[22px] font-semibold">{hasActiveFilters ? "没有匹配的记录" : "暂无本机记录"}</h2>
            <p className="mt-3 text-[15px] leading-7 text-mutedInk">
              {hasActiveFilters ? "请尝试更换关键词或记录类型。" : "新建排盘并保存后，会先存到本机，不需要等待服务器。"}
            </p>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setActiveFilter("all");
                }}
                className="mt-5 flex h-12 w-full items-center justify-center rounded-full bg-black text-[17px] font-semibold text-[#e8d4a7]"
              >
                清除筛选
              </button>
            ) : (
              <Link href="/" className="mt-5 flex h-12 items-center justify-center rounded-full bg-black text-[18px] font-semibold text-[#e8d4a7]">
                新建排盘
              </Link>
            )}
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
  selectionMode,
  selected,
  onToggleSelection,
  onDelete
}: {
  item: RecordsPageItem;
  deleting: boolean;
  selectionMode: boolean;
  selected: boolean;
  onToggleSelection: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={cn("rounded-[22px] border bg-[#fffdf7] p-4 shadow-soft transition-colors", selected ? "border-[#b88b2d]" : "border-[#e5d8bc]")}>
      <div className="flex items-start justify-between gap-3">
        {selectionMode ? (
          <button
            type="button"
            onClick={onToggleSelection}
            aria-label={`${selected ? "取消选择" : "选择"}${getRecordTitle(item)}记录`}
            aria-pressed={selected}
            className={cn(
              "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors",
              selected ? "border-[#b88b2d] bg-[#b88b2d] text-white" : "border-[#cfc4aa] bg-white/70 text-transparent"
            )}
          >
            <Check size={15} strokeWidth={2.4} />
          </button>
        ) : null}
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
                <DivinationSyncBadge status={item.record.syncStatus} />
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
        {!selectionMode ? <div className="flex shrink-0 items-center gap-1">
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
        </div> : null}
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

function getRecordsPageItems(
  cloudBaziRecords: CloudBaziRecord[] = [],
  cloudDivinationRecords: LocalDivinationRecord[] = []
): RecordsPageItem[] {
  const localBaziRecords = getUnifiedBaziRecords();
  const localDivinationRecords = getLocalDivinationRecords();
  const mergedBaziRecords = [
    ...localBaziRecords,
    ...cloudBaziRecords.filter(
      (cloudRecord) =>
        !localBaziRecords.some(
          (localRecord) => localRecord.id === cloudRecord.id || localRecord.serverId === cloudRecord.serverId
        )
    )
  ];
  const mergedDivinationRecords = [
    ...localDivinationRecords,
    ...cloudDivinationRecords.filter(
      (cloudRecord) =>
        !localDivinationRecords.some(
          (localRecord) => localRecord.id === cloudRecord.id || localRecord.serverId === cloudRecord.serverId
        )
    )
  ];
  const baziRecords = mergedBaziRecords.map((record) => ({
    kind: "bazi" as const,
    record,
    createdAt: record.createdAt
  }));
  const divinationRecords = mergedDivinationRecords.map((record) => ({
    kind: "divination" as const,
    record,
    createdAt: record.createdAt
  }));

  return [...baziRecords, ...divinationRecords].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
}

async function fetchRecordsPageItemsFromCloud() {
  const [cloudBaziRecords, cloudDivinationRecords] = await Promise.all([
    fetchCloudBaziRecords().catch(() => []),
    fetchCloudDivinationRecords().catch(() => [])
  ]);
  return getRecordsPageItems(cloudBaziRecords, cloudDivinationRecords);
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
      description: "当前为本地记录，已同步的记录会保存到云端。",
      items: []
    },
    {
      key: "qimen",
      title: "奇门遁甲",
      description: "当前为本地记录，已同步的记录会保存到云端。",
      items: []
    },
    {
      key: "ziwei",
      title: "紫微斗数",
      description: "当前为本地记录，已同步的记录会保存到云端。",
      items: []
    },
    {
      key: "daliuren",
      title: "大六壬",
      description: "当前为本地记录，已同步的记录会保存到云端。",
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

  return item.record.type;
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

  return getDivinationTypeConfig(item.record.type).summary;
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

function getRecordSearchText(item: RecordsPageItem) {
  return [
    getRecordTitle(item),
    getRecordSummary(item),
    getRecordDetail(item),
    getRecordMeta(item),
    item.kind === "bazi" ? "八字 四柱" : getDivinationTypeConfig(item.record.type).shortLabel
  ].join(" ");
}

function getRecordHref(item: RecordsPageItem) {
  if (item.kind === "bazi") {
    if (item.record.origin === "cloud" && item.record.serverId) {
      return `/bazi/${item.record.serverId}`;
    }
    return `/bazi/local/${item.record.id}`;
  }

  return getDivinationTypeConfig(item.record.type).href;
}

function handleOpenRecord(item: RecordsPageItem) {
  if (item.kind === "divination") {
    restoreLocalDivinationRecord(item.record);
  }
}

function formatDivinationType(value: LocalDivinationRecord["type"]) {
  return getDivinationTypeConfig(value).shortLabel;
}

function getDivinationTypeConfig(value: LocalDivinationRecord["type"]) {
  const config = {
    liuyao: { shortLabel: "六爻", summary: "六爻断事", href: "/liuyao/result" },
    qimen: { shortLabel: "奇门", summary: "奇门遁甲", href: "/qimen/result" },
    ziwei: { shortLabel: "紫微", summary: "紫微斗数", href: "/ziwei" },
    daliuren: { shortLabel: "六壬", summary: "大六壬", href: "/daliuren/result" }
  } satisfies Record<LocalDivinationRecord["type"], { shortLabel: string; summary: string; href: string }>;

  return config[value];
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
