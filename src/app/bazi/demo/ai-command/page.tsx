import { AiCommandModal } from "@/components/bazi/ai-command-modal";
import { calculateBaziChart } from "@/lib/bazi/calculate";
import { demoBaziChart } from "@/lib/bazi/demo";

type AiCommandPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AiCommandPage({ searchParams }: AiCommandPageProps) {
  const params = (await searchParams) ?? {};
  const chart = buildChart(params);

  return (
    <main className="min-h-screen bg-[#666]">
      <AiCommandModal chart={chart} closeHref={buildBackHref(params)} useSolarTime={getParam(params, "useSolarTime") === "true"} />
    </main>
  );
}

function buildChart(params: Record<string, string | string[] | undefined>) {
  const hasInput = Boolean(getParam(params, "birthTime"));

  if (!hasInput) {
    return demoBaziChart;
  }

  return calculateBaziChart({
    name: getParam(params, "name"),
    gender: getParam(params, "gender") === "female" ? "female" : "male",
    birthTime: getParam(params, "birthTime"),
    location: getParam(params, "location"),
    calendar: toCalendar(getParam(params, "calendar"))
  });
}

function getParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function toCalendar(value: string) {
  if (value === "lunar" || value === "pillars") {
    return value;
  }

  return "solar";
}

function buildBackHref(params: Record<string, string | string[] | undefined>) {
  const nextParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => nextParams.append(key, item));
      return;
    }

    if (value) {
      nextParams.set(key, value);
    }
  });

  const query = nextParams.toString();

  return query ? `/bazi/demo?${query}` : "/bazi/demo";
}
