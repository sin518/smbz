import Link from "next/link";
import {
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  Compass,
  Headphones,
  Settings2,
  Sparkles,
  UserRoundCheck
} from "lucide-react";
import { AppBottomNav } from "@/components/app-bottom-nav";
import { SettingsAccountEntry } from "@/components/settings/settings-account-entry";

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

const toolItems: SettingsItem[] = [
  { label: "紫微斗数", icon: Sparkles },
  { label: "问真罗盘", icon: Compass },
  { label: "吉真万年历", icon: CalendarDays }
];

export default function SettingsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#f1f1ef] pb-32 text-ink shadow-soft">
      <section className="rounded-b-[28px] bg-[#23262e] px-5 pb-[74px] pt-14 text-white">
        <SettingsAccountEntry />
      </section>

      <div className="mt-5 space-y-5 px-4">
        <SettingsGrid items={quickItems} columns="grid-cols-4" />

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
                参考登录页的存储说明，后续接入短信、账号密码、Google 或 GitHub 登录后，会把记录同步到用户账号。
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
