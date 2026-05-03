import Link from "next/link";
import { ChevronRight, FileText, Search } from "lucide-react";
import { AppBottomNav } from "@/components/app-bottom-nav";
import { demoRecords } from "@/lib/records/demo-records";

export default function RecordsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-paper pb-28 text-ink shadow-soft">
      <header className="sticky top-0 z-20 bg-white px-5 pb-5 pt-14">
        <div className="flex items-center justify-between">
          <h1 className="text-[30px] font-semibold">排盘记录</h1>
          <Link href="/" className="rounded-full bg-black px-5 py-2 text-[16px] font-semibold text-[#e8d4a7]">
            新建
          </Link>
        </div>
        <div className="mt-5 flex h-12 items-center gap-3 rounded-full bg-[#f2f2f0] px-4 text-[#8b8985]">
          <Search size={21} />
          <span className="text-[16px]">搜索姓名、地点、四柱</span>
        </div>
      </header>

      <section className="px-4 pt-5">
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="总记录" value={String(demoRecords.length)} />
          <StatCard label="AI 报告" value={String(demoRecords.filter((record) => record.hasAiReport).length)} />
          <StatCard label="分组" value="全部" />
        </div>
      </section>

      <section className="space-y-4 px-4 pt-5">
        {demoRecords.map((record) => (
          <Link key={record.id} href={record.id === "demo" ? "/bazi/demo" : "/bazi/demo"} className="block rounded-[22px] bg-white p-5 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-[23px] font-semibold">{record.name}</h2>
                  <span className="rounded-full bg-[#f6f0e2] px-2.5 py-1 text-sm font-medium text-[#967737]">{record.gender}</span>
                  {record.hasAiReport ? (
                    <span className="rounded-full bg-black px-2.5 py-1 text-sm font-medium text-[#e8d4a7]">已分析</span>
                  ) : null}
                </div>
                <p className="mt-3 text-[18px] font-medium">{record.pillars}</p>
                <div className="mt-3 space-y-1 text-[15px] leading-6 text-mutedInk">
                  <p>
                    {record.calendar}：{record.birthTime}
                  </p>
                  <p>{record.location}</p>
                  <p>保存于：{record.createdAt}</p>
                </div>
              </div>
              <ChevronRight className="mt-1 shrink-0 text-[#bbb]" size={24} />
            </div>
          </Link>
        ))}
      </section>

      <section className="px-4 pt-5">
        <div className="rounded-[22px] bg-white p-5 shadow-soft">
          <div className="mb-2 flex items-center gap-2 text-[#a58024]">
            <FileText size={22} />
            <h2 className="text-xl font-semibold">后续接入</h2>
          </div>
          <p className="text-[15px] leading-7 text-[#5f5a52]">
            当前为本地演示记录。正式版本会把用户输入、排盘 JSON、AI 报告分别保存到数据库，方便历史查询、付费报告和导出。
          </p>
        </div>
      </section>

      <AppBottomNav active="records" />
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] bg-white px-4 py-4 text-center shadow-soft">
      <p className="text-[22px] font-semibold">{value}</p>
      <p className="mt-1 text-sm text-mutedInk">{label}</p>
    </div>
  );
}
