import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { GanzhiInsightClient } from "@/components/bazi/ganzhi-insight-client";
import { calculateBaziChart } from "@/lib/bazi/calculate";
import { demoBaziChart } from "@/lib/bazi/demo";

type GanzhiPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function GanzhiPage({ searchParams }: GanzhiPageProps) {
  const params = (await searchParams) ?? {};
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

  return (
    <main className="light-surface-text-scope mx-auto min-h-screen max-w-[430px] bg-paper text-ink shadow-soft">
      <header className="sticky top-0 z-20 bg-[#F8F7EE] px-5 pt-12">
        <div className="flex h-16 items-center">
          <Link href={buildBackHref(params)} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d9d9d9]" aria-label="返回">
            <ChevronLeft size={28} strokeWidth={1.8} />
          </Link>
        </div>
      </header>

      <GanzhiInsightClient columns={chart.columns} />
    </main>
  );
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
