"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BaziChartView, type BaziTab } from "@/components/bazi/bazi-chart-view";
import { getLocalBaziRecord, type LocalBaziRecord } from "@/lib/bazi/local-records";

export default function LocalBaziPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [record, setRecord] = useState<LocalBaziRecord | null>(null);
  const [ready, setReady] = useState(false);
  const id = params.id;

  useEffect(() => {
    setRecord(getLocalBaziRecord(id));
    setReady(true);
  }, [id]);

  if (!ready) {
    return <main className="app-responsive-shell min-h-screen bg-paper shadow-soft" />;
  }

  if (!record) {
    return (
      <main className="light-surface-text-scope app-responsive-shell flex min-h-screen items-center justify-center bg-paper px-5 text-ink shadow-soft">
        <section className="rounded-[22px] bg-white p-6 text-center shadow-soft">
          <h1 className="text-[24px] font-semibold">本机记录不存在</h1>
          <p className="mt-3 text-[15px] leading-7 text-mutedInk">这条记录可能已被清理，或不在当前浏览器里。</p>
          <Link href="/records" className="mt-5 flex h-12 items-center justify-center rounded-full bg-black text-[18px] font-semibold text-[#e8d4a7]">
            返回记录
          </Link>
        </section>
      </main>
    );
  }
  const displayChart = record.chartJson;

  return (
    <BaziChartView
      chart={displayChart}
      activeTab={toTab(searchParams.get("tab") ?? "")}
      backHref="/records"
      editHref={buildEditHref(record)}
      getTabHref={(tab) => buildTabHref(record.id, tab)}
      aiCommandHref={buildToolHref(record, "/bazi/demo/ai-command")}
      profileOverride={{
        name: record.name || displayChart.profile.name,
        gender: record.gender === "female" ? "女" : displayChart.profile.gender,
        solar: formatQueryBirthTime(record.birthTime) || displayChart.profile.solar,
        solarTime: displayChart.profile.solarTime,
        location: record.location ?? displayChart.profile.location
      }}
    />
  );
}

function toTab(value: string): BaziTab {
  if (value === "info" || value === "detail") {
    return value;
  }

  return "chart";
}

function buildTabHref(id: string, tab: BaziTab) {
  if (tab === "chart") {
    return `/bazi/local/${id}`;
  }

  return `/bazi/local/${id}?tab=${tab}`;
}

function buildEditHref(record: LocalBaziRecord) {
  const query = buildChartParams(record).toString();

  return query ? `/bazi?${query}` : "/bazi";
}

function buildToolHref(record: LocalBaziRecord, pathname: string) {
  const query = buildChartParams(record).toString();

  return query ? `${pathname}?${query}` : pathname;
}

function buildChartParams(record: LocalBaziRecord) {
  const params = new URLSearchParams({
    name: record.name || "未命名",
    gender: record.gender,
    birthTime: record.birthTime,
    location: record.location ?? "",
    calendar: record.calendar,
    useSolarTime: record.useSolarTime ? "true" : "false"
  });

  if (record.longitude !== undefined && record.longitude !== null) {
    params.set("longitude", String(record.longitude));
  }

  if (record.latitude !== undefined && record.latitude !== null) {
    params.set("latitude", String(record.latitude));
  }

  return params;
}

function formatQueryBirthTime(value: string) {
  return value ? value.replace("T", " ") : "";
}
