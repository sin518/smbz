"use client";

import { CalendarClock, ChevronDown, Loader2, Trash2, UserRound, Users, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { cn } from "@/lib/utils";

type GenderValue = "male" | "female";

export type SharedProfileValue = {
  id?: string;
  source: string;
  name: string;
  gender: GenderValue;
  dateTime: string;
  location?: string;
};

type ProfilesResponse = {
  profiles?: SharedProfileValue[];
};

const LOCAL_PROFILE_CACHE_KEY = "sm1:shared-profiles";

type DivinationProfileCardProps = {
  nameInputProps: UseFormRegisterReturn;
  nameError?: string;
  gender: GenderValue;
  onGenderChange: (value: GenderValue) => void;
  dateTime: string;
  dateTimeError?: string;
  onOpenTimePicker: () => void;
  onApplyProfile?: (profile: SharedProfileValue) => void;
};

export function DivinationProfileCard({
  nameInputProps,
  nameError,
  gender,
  onGenderChange,
  dateTime,
  dateTimeError,
  onOpenTimePicker,
  onApplyProfile
}: DivinationProfileCardProps) {
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);

  return (
    <SharedFormCard>
      <SharedFieldRow icon={UserRound} label="姓名" error={nameError}>
        <div className="flex min-w-0 items-center justify-end gap-2">
          <input
            {...nameInputProps}
            className="min-w-0 flex-1 bg-transparent text-right text-[18px] font-semibold text-ink outline-none placeholder:text-[#bdbbb5]"
            placeholder="请输入姓名"
          />
          <button
            type="button"
            onClick={() => setProfileSheetOpen(true)}
            className="h-9 rounded-lg border border-[#33312e] px-3 text-[15px] font-semibold"
          >
            档案
          </button>
        </div>
      </SharedFieldRow>

      <SharedFieldRow icon={Users} label="性别">
        <SharedSegmentedPill
          value={gender}
          onChange={onGenderChange}
          options={[
            { label: "男", value: "male" },
            { label: "女", value: "female" }
          ]}
          ariaLabel="选择性别"
        />
      </SharedFieldRow>

      <SharedFieldRow icon={CalendarClock} label="出生时间" error={dateTimeError} last>
        <button
          type="button"
          onClick={onOpenTimePicker}
          className="flex w-full min-w-0 items-center justify-end gap-1 text-right text-[18px] font-semibold text-[#aaa8a1]"
          aria-label="选择出生时间"
        >
          {dateTime ? formatPickerLabel(dateTime) : "请选择"}
          <ChevronDown size={20} strokeWidth={2.5} className="shrink-0 text-[#302f2c]" />
        </button>
      </SharedFieldRow>

      {profileSheetOpen ? (
        <SharedProfileSheet
          onClose={() => setProfileSheetOpen(false)}
          onApply={(profile) => {
            onApplyProfile?.(profile);
            setProfileSheetOpen(false);
          }}
        />
      ) : null}
    </SharedFormCard>
  );
}

function SharedProfileSheet({
  onClose,
  onApply
}: {
  onClose: () => void;
  onApply: (profile: SharedProfileValue) => void;
}) {
  const [profiles, setProfiles] = useState<SharedProfileValue[]>([]);
  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const [cloudUnavailable, setCloudUnavailable] = useState(false);
  const [deletingProfileId, setDeletingProfileId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const localProfiles = getLocalProfiles();

    if (localProfiles.length > 0) {
      setProfiles(localProfiles);
      setStatus("ready");
    }

    async function loadProfiles() {
      try {
        const response = await fetchWithTimeout("/api/profiles", {
          method: "GET",
          credentials: "include"
        });
        const data = response.ok ? ((await response.json()) as ProfilesResponse) : null;

        if (!mounted) {
          return;
        }

        const nextProfiles = dedupeProfiles([...(data?.profiles ?? []), ...localProfiles]);
        setProfiles(nextProfiles);
        setCloudUnavailable(!response.ok);
        setStatus("ready");
      } catch {
        if (mounted) {
          setProfiles(localProfiles);
          setCloudUnavailable(true);
          setStatus("ready");
        }
      }
    }

    void loadProfiles();

    return () => {
      mounted = false;
    };
  }, []);

  async function deleteProfile(profile: SharedProfileValue) {
    const deleteKey = getProfileDeleteKey(profile);
    setDeletingProfileId(deleteKey);
    setProfiles((current) => current.filter((item) => getProfileDeleteKey(item) !== deleteKey));
    deleteLocalProfile(profile);

    if (profile.id && !profile.id.startsWith("local-")) {
      try {
        const response = await fetchWithTimeout(`/api/profiles/${encodeURIComponent(profile.id)}`, {
          method: "DELETE",
          credentials: "include"
        });
        setCloudUnavailable(!response.ok);
      } catch {
        setCloudUnavailable(true);
      }
    }

    setDeletingProfileId(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
      <button className="absolute inset-0 cursor-default" type="button" aria-label="关闭档案选择" onClick={onClose} />
      <section className="relative w-full max-w-[430px] rounded-t-[24px] bg-[#fffef7] px-5 pb-7 pt-5 shadow-soft">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center text-[#77736b]" aria-label="关闭">
          <X size={25} />
        </button>
        <h2 className="pr-12 text-[23px] font-semibold text-ink">选择通用档案</h2>
        <p className="mt-1 text-[14px] leading-6 text-[#8f8b82]">八字、六爻、奇门共用姓名、性别和出生时间。</p>
        {cloudUnavailable ? (
          <p className="mt-3 rounded-xl bg-[#f8f3e7] px-3 py-2 text-[13px] leading-5 text-[#9b761f]">
            云端档案暂时不可用，已优先显示本机最近保存的资料。
          </p>
        ) : null}

        {status === "loading" ? (
          <div className="mt-5 rounded-xl bg-white px-4 py-5 text-center shadow-sm">
            <p className="text-[18px] font-semibold text-ink">正在读取档案</p>
            <p className="mt-2 text-[14px] leading-6 text-[#8f8b82]">会同时检查本机最近资料和当前账号档案。</p>
          </div>
        ) : profiles.length > 0 ? (
          <div className="mt-5 space-y-3">
            {profiles.map((profile) => (
              <div
                key={profile.id ?? `${profile.source}-${profile.name}-${profile.dateTime}`}
                className="grid grid-cols-[minmax(0,1fr)_116px] items-center gap-3 rounded-xl border border-[#e6dfd0] bg-white px-4 py-3 shadow-sm"
              >
                <button type="button" onClick={() => onApply(profile)} className="min-w-0 text-left" aria-label={`选择${profile.name || "未填写姓名"}档案`}>
                  <span className="block min-w-0 truncate text-[18px] font-semibold text-ink">{profile.name || "未填写姓名"}</span>
                  <p className="mt-2 text-[15px] font-semibold text-[#77736b]">
                    {profile.gender === "female" ? "女" : "男"} · {formatPickerLabel(profile.dateTime)}
                  </p>
                </button>
                <div className="flex items-center justify-end gap-2">
                  <span className="min-w-[68px] shrink-0 rounded-full bg-[#f4efe2] px-3 py-1 text-center text-[13px] font-semibold text-[#a58024]">{profile.source}</span>
                  <button
                    type="button"
                    onClick={() => void deleteProfile(profile)}
                    disabled={deletingProfileId === getProfileDeleteKey(profile)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f8f3e7] text-[#b95c45] disabled:opacity-55"
                    aria-label={`删除${profile.name || "未填写姓名"}档案`}
                  >
                    {deletingProfileId === getProfileDeleteKey(profile) ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} strokeWidth={2.1} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-xl bg-white px-4 py-5 text-center shadow-sm">
            <p className="text-[18px] font-semibold text-ink">暂无可用档案</p>
            <p className="mt-2 text-[14px] leading-6 text-[#8f8b82]">保存一次八字、六爻、奇门或紫微资料后，这里会自动显示。</p>
          </div>
        )}
      </section>
    </div>
  );
}

export function SharedFormCard({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-[22px] bg-white px-4 shadow-soft", className)}>{children}</section>;
}

export function SharedFieldRow({
  icon: Icon,
  label,
  error,
  last,
  children
}: {
  icon: LucideIcon;
  label: string;
  error?: string;
  last?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={cn("py-4", !last && "border-b border-[#ebe7dd]")}>
      <div className="grid grid-cols-[112px_1fr] items-center gap-2">
        <label className="flex items-center gap-2 text-[18px] font-semibold text-ink">
          <Icon size={19} className="text-[#a58024]" />
          {label}
        </label>
        {children}
      </div>
      {error ? <p className="mt-2 text-right text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

export function SharedSegmentedPill<TValue extends string>({
  value,
  onChange,
  options,
  ariaLabel
}: {
  value: TValue;
  onChange: (value: TValue) => void;
  options: ReadonlyArray<{ label: string; value: TValue }>;
  ariaLabel: string;
}) {
  return (
    <div className="ml-auto grid h-10 w-[104px] grid-cols-2 rounded-full bg-[#f2f2f0] p-1" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-full text-[19px] font-semibold leading-none transition-colors",
            option.value === value ? "bg-black text-[#e8d4a7]" : "text-[#8b8985]"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function DivinationTimePickerSheet({
  open,
  value,
  onClose,
  onConfirm,
  ariaLabel = "关闭时间选择"
}: {
  open: boolean;
  value: string;
  onClose: () => void;
  onConfirm: (value: string) => void;
  ariaLabel?: string;
}) {
  const [draft, setDraft] = useState(() => parseDateTime(value));
  const years = useMemo(() => buildNumberRange(1920, 2050), []);
  const months = useMemo(() => buildNumberRange(1, 12), []);
  const hours = useMemo(() => buildNumberRange(0, 23), []);
  const minutes = useMemo(() => buildNumberRange(0, 59), []);
  const days = useMemo(() => buildNumberRange(1, getDaysInMonth(draft.year, draft.month)), [draft.month, draft.year]);

  useEffect(() => {
    if (open) {
      setDraft(parseDateTime(value));
    }
  }, [open, value]);

  useEffect(() => {
    const maxDay = getDaysInMonth(draft.year, draft.month);
    if (draft.day > maxDay) {
      setDraft((current) => ({ ...current, day: maxDay }));
    }
  }, [draft.day, draft.month, draft.year]);

  if (!open) {
    return null;
  }

  const updateDraft = (key: keyof TimeParts, nextValue: number) => {
    setDraft((current) => ({ ...current, [key]: nextValue }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65">
      <button className="absolute inset-0 cursor-default" type="button" aria-label={ariaLabel} onClick={onClose} />
      <section className="relative w-full max-w-[430px] rounded-t-[28px] bg-white px-5 pb-8 pt-7 shadow-soft">
        <div className="grid h-12 grid-cols-1 rounded-full bg-[#f4f4f3] p-1">
          <span className="flex items-center justify-center rounded-full bg-white text-[18px] font-semibold text-ink shadow-sm">公历</span>
        </div>

        <div className="mt-6 border-t border-[#f0f0ef] pt-4">
          <div className="grid grid-cols-5 text-center text-[20px] font-semibold text-[#3d3a36]">
            <span className="rounded-full bg-[#f4f1ed] py-3 text-[#a99156]">年</span>
            <span className="py-3">月</span>
            <span className="py-3">日</span>
            <span className="py-3">时</span>
            <span className="py-3">分</span>
          </div>
          <div className="relative mt-2 grid h-60 grid-cols-5 overflow-hidden">
            <div className="pointer-events-none absolute left-0 right-0 top-[96px] h-12 rounded-2xl bg-[#f3f3f2]" />
            <PickerColumn values={years} selected={draft.year} onSelect={(nextValue) => updateDraft("year", nextValue)} />
            <PickerColumn values={months} selected={draft.month} onSelect={(nextValue) => updateDraft("month", nextValue)} padValue />
            <PickerColumn values={days} selected={draft.day} onSelect={(nextValue) => updateDraft("day", nextValue)} padValue />
            <PickerColumn values={hours} selected={draft.hour} onSelect={(nextValue) => updateDraft("hour", nextValue)} padValue />
            <PickerColumn values={minutes} selected={draft.minute} onSelect={(nextValue) => updateDraft("minute", nextValue)} padValue />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-[1fr_1.35fr] items-center gap-3">
          <button
            type="button"
            onClick={() => onConfirm(formatDateTimeLocal(new Date()))}
            className="h-12 rounded-full bg-[#f4f4f3] text-[18px] font-semibold text-ink"
          >
            今
          </button>
          <button
            type="button"
            onClick={() => onConfirm(toDateTimeValue(draft))}
            className="h-12 rounded-full bg-black text-[20px] font-semibold text-[#e8d4a7]"
          >
            确定
          </button>
        </div>
      </section>
    </div>
  );
}

type TimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

function PickerColumn({
  values,
  selected,
  onSelect,
  padValue
}: {
  values: number[];
  selected: number;
  onSelect: (value: number) => void;
  padValue?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const settleTimerRef = useRef<number | null>(null);
  const hasPositionedRef = useRef(false);
  const selectedIndex = Math.max(0, values.indexOf(selected));

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) {
      return;
    }

    const top = selectedIndex * PICKER_ITEM_HEIGHT;

    if (!hasPositionedRef.current) {
      container.scrollTop = top;
      hasPositionedRef.current = true;
      return;
    }

    if (Math.abs(container.scrollTop - top) > 1) {
      container.scrollTo({ top, behavior: "smooth" });
    }
  }, [selectedIndex]);

  useEffect(() => {
    return () => {
      if (settleTimerRef.current) {
        window.clearTimeout(settleTimerRef.current);
      }
    };
  }, []);

  const settleToNearestValue = () => {
    const container = scrollRef.current;
    if (!container) {
      return;
    }

    const nextIndex = Math.min(values.length - 1, Math.max(0, Math.round(container.scrollTop / PICKER_ITEM_HEIGHT)));
    const nextValue = values[nextIndex];

    container.scrollTo({ top: nextIndex * PICKER_ITEM_HEIGHT, behavior: "smooth" });

    if (nextValue !== selected) {
      onSelect(nextValue);
    }
  };

  const handleScroll = () => {
    if (settleTimerRef.current) {
      window.clearTimeout(settleTimerRef.current);
    }

    settleTimerRef.current = window.setTimeout(settleToNearestValue, 90);
  };

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="relative z-10 h-60 overflow-y-auto snap-y snap-mandatory py-24 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {values.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onSelect(item)}
          className={cn(
            "flex h-12 w-full snap-center items-center justify-center text-center text-[20px] font-semibold transition-colors",
            item === selected ? "text-[26px] text-black" : "text-[#d1d1d1]"
          )}
        >
          {padValue ? pad(item) : item}
        </button>
      ))}
    </div>
  );
}

export function formatDateTimeLocal(date: Date) {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

export async function saveSharedProfile(profile: Omit<SharedProfileValue, "id">) {
  saveLocalProfile(profile);

  try {
    await fetchWithTimeout("/api/profiles", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(profile)
    });
  } catch {
    // Profile saving should not block the divination flow.
  }
}

function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = 5000) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  return fetch(input, {
    ...init,
    signal: controller.signal
  }).finally(() => window.clearTimeout(timeout));
}

export function formatPickerLabel(value: string) {
  return formatDisplayDateTime(value).replaceAll("-", "/");
}

function formatDisplayDateTime(value: string) {
  if (!value) {
    return "未选择时间";
  }
  return value.replace("T", " ");
}

function getLocalProfiles() {
  if (typeof window === "undefined") {
    return [];
  }

  migrateLegacyProfileCache();

  try {
    const raw = window.localStorage.getItem(LOCAL_PROFILE_CACHE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return dedupeProfiles(parsed.filter(isSharedProfileValue)).slice(0, 10);
  } catch {
    return [];
  }
}

function saveLocalProfile(profile: Omit<SharedProfileValue, "id">) {
  if (typeof window === "undefined" || !profile.dateTime) {
    return;
  }

  const normalized: SharedProfileValue = {
    id: `local-${profile.source}-${profile.name}-${profile.gender}-${profile.dateTime}`,
    source: profile.source || "本机档案",
    name: profile.name ?? "",
    gender: profile.gender,
    dateTime: profile.dateTime,
    location: profile.location
  };
  const nextProfiles = dedupeProfiles([normalized, ...getLocalProfiles()]).slice(0, 10);

  window.localStorage.setItem(LOCAL_PROFILE_CACHE_KEY, JSON.stringify(nextProfiles));
}

function deleteLocalProfile(profile: SharedProfileValue) {
  if (typeof window === "undefined") {
    return;
  }

  const deleteKey = getProfileDeleteKey(profile);
  const nextProfiles = getLocalProfiles().filter((item) => getProfileDeleteKey(item) !== deleteKey);
  window.localStorage.setItem(LOCAL_PROFILE_CACHE_KEY, JSON.stringify(nextProfiles));
}

function getProfileDeleteKey(profile: SharedProfileValue) {
  return `${profile.name}-${profile.gender}-${profile.dateTime}`;
}

function migrateLegacyProfileCache() {
  const migrated = getLegacyProfiles();
  if (migrated.length === 0) {
    return;
  }

  const raw = window.localStorage.getItem(LOCAL_PROFILE_CACHE_KEY);
  const current = raw ? (JSON.parse(raw) as unknown) : [];
  const currentProfiles = Array.isArray(current) ? current.filter(isSharedProfileValue) : [];
  const nextProfiles = dedupeProfiles([...currentProfiles, ...migrated]).slice(0, 10);

  window.localStorage.setItem(LOCAL_PROFILE_CACHE_KEY, JSON.stringify(nextProfiles));
  window.localStorage.removeItem("sm1:last-bazi-input");
  window.localStorage.removeItem("sm1:last-qimen-input");
}

function getLegacyProfiles() {
  const profiles: SharedProfileValue[] = [];

  ["sm1:last-bazi-input", "sm1:last-qimen-input"].forEach((key) => {
    try {
      const raw = window.localStorage.getItem(key);
      const parsed = raw ? (JSON.parse(raw) as unknown) : null;

      if (!isLegacyProfileValue(parsed)) {
        return;
      }

      profiles.push({
        id: `local-${key}-${parsed.name}-${parsed.gender}-${parsed.birthTime}`,
        source: key.includes("bazi") ? "八字档案" : "奇门档案",
        name: parsed.name ?? "",
        gender: parsed.gender,
        dateTime: parsed.birthTime,
        location: parsed.location
      });
    } catch {
      // Ignore broken legacy cache entries.
    }
  });

  return profiles;
}

function isSharedProfileValue(value: unknown): value is SharedProfileValue {
  if (!value || typeof value !== "object") {
    return false;
  }

  const profile = value as Record<string, unknown>;

  return (
    typeof profile.source === "string" &&
    typeof profile.name === "string" &&
    (profile.gender === "male" || profile.gender === "female") &&
    typeof profile.dateTime === "string"
  );
}

function isLegacyProfileValue(value: unknown): value is {
  name?: string;
  gender: GenderValue;
  birthTime: string;
  location?: string;
} {
  if (!value || typeof value !== "object") {
    return false;
  }

  const profile = value as Record<string, unknown>;

  return (
    (profile.gender === "male" || profile.gender === "female") &&
    typeof profile.birthTime === "string"
  );
}

function dedupeProfiles(profiles: SharedProfileValue[]) {
  const seen = new Set<string>();
  return profiles.filter((profile) => {
    const key = `${profile.name}-${profile.gender}-${profile.dateTime}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function parseDateTime(value: string): TimeParts {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) {
    return {
      year: 2026,
      month: 5,
      day: 5,
      hour: 8,
      minute: 0
    };
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5])
  };
}

function toDateTimeValue(value: TimeParts) {
  return `${value.year}-${pad(value.month)}-${pad(value.day)}T${pad(value.hour)}:${pad(value.minute)}`;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function buildNumberRange(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

const PICKER_ITEM_HEIGHT = 48;
