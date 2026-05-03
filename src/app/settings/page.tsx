import Link from "next/link";
import {
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  ChevronRight,
  CircleEllipsis,
  Compass,
  Crown,
  Diamond,
  Headphones,
  LockKeyhole,
  Moon,
  Settings2,
  Sparkles,
  Sun,
  UserRoundCheck
} from "lucide-react";
import { AppBottomNav } from "@/components/app-bottom-nav";

type SettingsItem = {
  label: string;
  icon: typeof Settings2;
  locked?: boolean;
  href?: string;
};

const quickItems: SettingsItem[] = [
  { label: "偏好设置", icon: Settings2 },
  { label: "联系反馈", icon: Headphones },
  { label: "生日提醒", icon: Bell },
  { label: "问真招聘", icon: BriefcaseBusiness }
];

const ruleItems: SettingsItem[] = [
  { label: "早晚子时", icon: Moon },
  { label: "真太阳时", icon: Sun },
  { label: "干支关系", icon: LockKeyhole, locked: true },
  { label: "地支藏干", icon: LockKeyhole, locked: true },
  { label: "人元司令", icon: LockKeyhole, locked: true },
  { label: "神煞设置", icon: LockKeyhole, locked: true },
  { label: "命宫身宫", icon: LockKeyhole, locked: true },
  { label: "更多", icon: CircleEllipsis }
];

const toolItems: SettingsItem[] = [
  { label: "紫微斗数", icon: Sparkles },
  { label: "问真罗盘", icon: Compass },
  { label: "吉真万年历", icon: CalendarDays }
];

export default function SettingsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#f1f1ef] pb-32 text-ink shadow-soft">
      <section className="rounded-b-[28px] bg-[#23262e] px-5 pb-[74px] pt-14 text-white">
        <Link href="/settings/login" className="flex items-center gap-4" aria-label="登录或查看账号">
          <div className="flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-full border-2 border-[#d8b96d] bg-black text-[42px] font-semibold text-[#d8b96d] shadow-[inset_0_0_18px_rgba(216,185,109,0.35)]">
            真
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[30px] font-light leading-none tracking-wide">134***46</p>
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
        </Link>
      </section>

      <div className="-mt-12 space-y-5 px-4">
        <Link
          href="/settings/login"
          className="flex min-h-[72px] items-center justify-between rounded-[18px] bg-[#f3c985] px-5 py-4 shadow-soft"
          aria-label="查看会员特权"
        >
          <div className="flex min-w-0 items-center gap-4">
            <Crown className="shrink-0 text-[#684000]" size={31} strokeWidth={2.4} />
            <div className="min-w-0">
              <h1 className="text-[27px] font-semibold leading-tight text-[#4f3200]">问真VIP会员</h1>
              <p className="mt-1 text-[17px] leading-tight text-[#5f3a05]">成为问真VIP享受15项特权</p>
            </div>
          </div>
          <span className="ml-3 inline-flex h-12 shrink-0 items-center rounded-full bg-[#6b4100] px-5 text-[18px] font-semibold text-white">
            会员特权
            <ChevronRight size={22} />
          </span>
        </Link>

        <SettingsGrid items={quickItems} columns="grid-cols-4" />

        <section className="rounded-[22px] bg-white px-5 pb-6 pt-7 shadow-soft">
          <div className="mb-7 flex items-center gap-3">
            <h2 className="text-[29px] font-semibold leading-none text-black">规则设置</h2>
            <span className="rounded-[7px] bg-[#f3cc8e] px-3 py-1 text-[17px] leading-none text-[#5f3a05]">VIP</span>
          </div>
          <SettingsGrid items={ruleItems} columns="grid-cols-4" nested />
        </section>

        <section className="rounded-[22px] bg-white px-5 pb-7 pt-7 shadow-soft">
          <h2 className="mb-7 text-[29px] font-semibold leading-none text-black">其他工具</h2>
          <SettingsGrid items={toolItems} columns="grid-cols-3" nested />
        </section>

        <section className="rounded-[22px] bg-white p-5 shadow-soft">
          <div className="flex items-start gap-3">
            <UserRoundCheck className="mt-0.5 shrink-0 text-[#a58024]" size={24} />
            <div>
              <h2 className="text-[20px] font-semibold">登录后可保存排盘</h2>
              <p className="mt-2 text-[15px] leading-7 text-mutedInk">
                参考登录页的存储说明，后续接入短信、账号密码或 Apple 登录后，会把记录同步到用户账号。
              </p>
            </div>
          </div>
        </section>
      </div>

      <AppBottomNav active="settings" />
    </main>
  );
}

function SettingsGrid({
  items,
  columns,
  nested = false
}: {
  items: SettingsItem[];
  columns: "grid-cols-3" | "grid-cols-4";
  nested?: boolean;
}) {
  return (
    <section className={nested ? "" : "rounded-[22px] bg-white px-4 py-7 shadow-soft"}>
      <div className={`grid ${columns === "grid-cols-4" ? "grid-cols-4" : "grid-cols-3"} gap-y-8`}>
        {items.map((item) => (
          <SettingsButton key={item.label} item={item} />
        ))}
      </div>
    </section>
  );
}

function SettingsButton({ item }: { item: SettingsItem }) {
  const Icon = item.icon;
  const content = (
    <>
      <span className="flex h-11 w-11 items-center justify-center rounded-full text-black">
        <Icon className={item.locked ? "text-[#b6a377]" : "text-black"} size={30} strokeWidth={1.75} />
      </span>
      <span className="mt-3 max-w-[4.5em] text-center text-[18px] leading-tight text-[#343a3f]">{item.label}</span>
    </>
  );

  if (item.href) {
    return (
      <Link href={item.href} className="flex min-h-[86px] flex-col items-center justify-start">
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className="flex min-h-[86px] flex-col items-center justify-start" aria-label={item.label}>
      {content}
    </button>
  );
}
