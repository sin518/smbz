import Link from "next/link";
import { ChevronLeft } from "lucide-react";

type GanzhiPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function GanzhiPage({ searchParams }: GanzhiPageProps) {
  const params = (await searchParams) ?? {};

  return (
    <main className="light-surface-text-scope mx-auto min-h-screen max-w-[430px] bg-paper text-ink shadow-soft">
      <header className="sticky top-0 z-20 bg-[#F8F7EE] px-5 pt-12">
        <div className="flex h-16 items-center">
          <Link href={buildBackHref(params)} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d9d9d9]" aria-label="返回">
            <ChevronLeft size={28} strokeWidth={1.8} />
          </Link>
        </div>
      </header>
    </main>
  );
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
