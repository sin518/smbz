import { BaziChartView, type BaziTab } from "@/components/bazi/bazi-chart-view";
import { calculateBaziChart } from "@/lib/bazi/calculate";
import { demoBaziChart } from "@/lib/bazi/demo";

type DemoBaziPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DemoBaziPage({ searchParams }: DemoBaziPageProps) {
  const params = (await searchParams) ?? {};
  const activeTab = toTab(getParam(params, "tab"));
  const hasInput = Boolean(getParam(params, "birthTime"));
  const chart = hasInput
    ? calculateBaziChart({
        name: getParam(params, "name"),
        gender: getParam(params, "gender") === "female" ? "female" : "male",
        birthTime: getParam(params, "birthTime"),
        location: getParam(params, "location"),
        calendar: toCalendar(getParam(params, "calendar"))
      })
    : demoBaziChart;
  const queryBirthTime = formatQueryBirthTime(getParam(params, "birthTime"));

  return (
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
        solarTime: queryBirthTime || chart.profile.solarTime,
        location: getParam(params, "location") || chart.profile.location
      }}
    />
  );
}

function getParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
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

function toCalendar(value: string) {
  if (value === "lunar" || value === "pillars") {
    return value;
  }

  return "solar";
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
  const nextParams = new URLSearchParams();

  ["name", "gender", "birthTime", "location", "calendar", "useSolarTime"].forEach((key) => {
    const value = params[key];
    if (Array.isArray(value)) {
      if (value[0]) {
        nextParams.set(key, value[0]);
      }
      return;
    }

    if (value) {
      nextParams.set(key, value);
    }
  });

  const query = nextParams.toString();

  return query ? `/bazi?${query}` : "/bazi";
}

function copyParams(params: Record<string, string | string[] | undefined>, omit: string[] = []) {
  const nextParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (omit.includes(key)) {
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
