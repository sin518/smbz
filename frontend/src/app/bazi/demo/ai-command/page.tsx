import { redirect } from "next/navigation";
import { AiCommandModal } from "@/components/bazi/ai-command-modal";
import { BaziChartView, type BaziTab } from "@/components/bazi/bazi-chart-view";
import { calculateBaziChartOnBackend } from "@/lib/bazi/api";

type AiCommandPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AiCommandPage({ searchParams }: AiCommandPageProps) {
  const params = (await searchParams) ?? {};
  const chart = await buildChart(params);
  const activeTab = toTab(getParam(params, "tab"));
  const queryBirthTime = formatQueryBirthTime(getParam(params, "birthTime"));

  return (
    <>
      <BaziChartView
        chart={chart}
        activeTab={activeTab}
        backHref={buildBackHref(params)}
        getTabHref={(tab) => buildTabHref(params, tab)}
        aiCommandHref={buildToolHref(params, "/bazi/demo/ai-command")}
        profileOverride={{
          name: getParam(params, "name") || chart.profile.name,
          gender: getParam(params, "gender") === "female" ? "女" : chart.profile.gender,
          solar: queryBirthTime || chart.profile.solar,
          solarTime: chart.profile.solarTime,
          location: getParam(params, "location") || chart.profile.location
        }}
      />
      <AiCommandModal chart={chart} closeHref={buildBackHref(params)} useSolarTime={getParam(params, "useSolarTime") === "true"} />
    </>
  );
}

async function buildChart(params: Record<string, string | string[] | undefined>) {
  const birthTime = getParam(params, "birthTime");

  if (!birthTime) {
    redirect("/bazi");
  }

  return calculateBaziChartOnBackend({
    name: getParam(params, "name"),
    gender: getParam(params, "gender") === "female" ? "female" : "male",
    birthTime,
    location: getParam(params, "location"),
    calendar: toCalendar(getParam(params, "calendar")),
    useSolarTime: getParam(params, "useSolarTime") === "true",
    longitude: toNumberParam(getParam(params, "longitude")),
    latitude: toNumberParam(getParam(params, "latitude"))
  });
}

function getParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function toNumberParam(value: string) {
  if (!value.trim()) {
    return null;
  }

  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : null;
}

function toCalendar(value: string) {
  if (value === "lunar" || value === "pillars") {
    return value;
  }

  return "solar";
}

function formatQueryBirthTime(value: string) {
  if (!value) {
    return "";
  }

  return value.replace("T", " ");
}

function toTab(value: string): BaziTab {
  if (value === "info" || value === "detail") {
    return value;
  }

  return "chart";
}

function buildTabHref(params: Record<string, string | string[] | undefined>, tab: BaziTab) {
  const nextParams = copyParams(params, ["tab"]);

  if (tab !== "chart") {
    nextParams.set("tab", tab);
  }

  const query = nextParams.toString();

  return query ? `/bazi/demo?${query}` : "/bazi/demo";
}

function buildToolHref(params: Record<string, string | string[] | undefined>, pathname: string) {
  const query = copyParams(params).toString();

  return query ? `${pathname}?${query}` : pathname;
}

function buildBackHref(params: Record<string, string | string[] | undefined>) {
  const query = copyParams(params).toString();

  return query ? `/bazi/demo?${query}` : "/bazi/demo";
}

function copyParams(params: Record<string, string | string[] | undefined>, omit: string[] = []) {
  const omitted = new Set(omit);
  const nextParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (omitted.has(key)) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => nextParams.append(key, item));
      return;
    }

    if (value) {
      nextParams.set(key, value);
    }
  });

  return nextParams;
}
