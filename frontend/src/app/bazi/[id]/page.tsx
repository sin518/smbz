import { cookies } from "next/headers";
import Link from "next/link";
import { BaziChartView, type BaziTab } from "@/components/bazi/bazi-chart-view";
import type { DemoBaziChart } from "@/lib/bazi/demo";

type SavedBaziPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type SavedBaziChart = {
  id: string;
  name: string;
  gender: "male" | "female";
  birthTime: string;
  calendar: "solar" | "lunar" | "pillars";
  location?: string | null;
  useSolarTime: boolean;
  chartJson: DemoBaziChart;
};

export default async function SavedBaziPage({ params, searchParams }: SavedBaziPageProps) {
  const { id } = await params;
  const query = (await searchParams) ?? {};
  const chart = await fetchSavedBaziChart(id);

  if (!chart) {
    return (
      <main className="light-surface-text-scope mx-auto flex min-h-screen max-w-[430px] items-center justify-center bg-paper px-5 text-ink shadow-soft">
        <section className="rounded-[22px] bg-white p-6 text-center shadow-soft">
          <h1 className="text-[24px] font-semibold">未找到排盘记录</h1>
          <p className="mt-3 text-[15px] leading-7 text-mutedInk">这条记录可能不存在，或当前账号没有访问权限。</p>
          <Link href="/records" className="mt-5 flex h-12 items-center justify-center rounded-full bg-black text-[18px] font-semibold text-[#e8d4a7]">
            返回记录
          </Link>
        </section>
      </main>
    );
  }

  return (
    <BaziChartView
      chart={chart.chartJson}
      activeTab={toTab(getParam(query, "tab"))}
      backHref="/records"
      editHref={buildEditHref(chart)}
      getTabHref={(tab) => buildTabHref(chart.id, tab)}
      ganzhiHref={buildToolHref(chart, "/bazi/demo/ganzhi")}
      aiCommandHref={buildToolHref(chart, "/bazi/demo/ai-command")}
      profileOverride={{
        name: chart.name || chart.chartJson.profile.name,
        gender: chart.gender === "female" ? "女" : chart.chartJson.profile.gender,
        solar: formatQueryBirthTime(chart.birthTime) || chart.chartJson.profile.solar,
        solarTime: formatQueryBirthTime(chart.birthTime) || chart.chartJson.profile.solarTime,
        location: chart.location ?? chart.chartJson.profile.location
      }}
    />
  );
}

async function fetchSavedBaziChart(id: string): Promise<SavedBaziChart | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
  const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

  try {
    const response = await fetch(`${backendUrl}/api/bazi/charts/${id}`, {
      headers: cookieHeader ? { cookie: cookieHeader } : {},
      cache: "no-store"
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { chart?: SavedBaziChart };
    return data.chart ?? null;
  } catch {
    return null;
  }
}

function getParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function toTab(value: string): BaziTab {
  if (value === "info" || value === "detail") {
    return value;
  }

  return "chart";
}

function buildTabHref(id: string, tab: BaziTab) {
  if (tab === "chart") {
    return `/bazi/${id}`;
  }

  return `/bazi/${id}?tab=${tab}`;
}

function buildEditHref(chart: SavedBaziChart) {
  const params = buildChartParams(chart);
  const query = params.toString();

  return query ? `/bazi?${query}` : "/bazi";
}

function buildToolHref(chart: SavedBaziChart, pathname: string) {
  const query = buildChartParams(chart).toString();

  return query ? `${pathname}?${query}` : pathname;
}

function buildChartParams(chart: SavedBaziChart) {
  return new URLSearchParams({
    name: chart.name || "未命名",
    gender: chart.gender,
    birthTime: chart.birthTime,
    location: chart.location ?? "",
    calendar: chart.calendar,
    useSolarTime: chart.useSolarTime ? "true" : "false"
  });
}

function formatQueryBirthTime(value: string) {
  if (!value) {
    return "";
  }

  return value.replace("T", " ");
}
