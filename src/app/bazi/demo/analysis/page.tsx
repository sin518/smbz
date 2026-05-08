import Link from "next/link";
import { ChevronLeft, FileText, ShieldCheck, Sparkles } from "lucide-react";
import { demoAiReport } from "@/lib/ai/demo-report";
import { demoBaziChart } from "@/lib/bazi/demo";

export default function DemoAnalysisPage() {
  const { profile } = demoBaziChart;

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#F8F7EE] pb-10 text-ink shadow-soft">
      <header className="sticky top-0 z-30 bg-[#F8F7EE] pt-12">
        <div className="flex h-16 items-center justify-between px-5">
          <Link href="/bazi/demo" className="flex h-10 w-10 items-center justify-center" aria-label="返回排盘">
            <ChevronLeft size={34} strokeWidth={1.8} />
          </Link>
          <h1 className="text-[26px] font-semibold">AI 命理分析</h1>
          <div className="flex h-10 w-10 items-center justify-center text-[#b79a5b]">
            <Sparkles size={26} strokeWidth={1.8} />
          </div>
        </div>
      </header>

      <section className="bg-black px-5 py-6 text-white">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#d6bd7c] text-2xl text-[#d6bd7c]">
            {profile.zodiac}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-2xl font-semibold">{profile.name} 的分析报告</p>
            <p className="mt-2 text-sm leading-6 text-[#d8d8d8]">生成时间：{demoAiReport.generatedAt}</p>
            <p className="text-sm leading-6 text-[#d8d8d8]">模型：{demoAiReport.model}</p>
          </div>
        </div>
      </section>

      <section className="px-4 pt-4">
        <div className="rounded-[22px] bg-white p-5 shadow-soft">
          <div className="mb-3 flex items-center gap-2 text-[#a58024]">
            <FileText size={22} />
            <h2 className="text-xl font-semibold">报告摘要</h2>
          </div>
          <p className="text-[16px] leading-8 text-[#55514b]">{demoAiReport.summary}</p>
        </div>
      </section>

      <section className="space-y-4 px-4 pt-4">
        {demoAiReport.sections.map((section, index) => (
          <article key={section.title} className="overflow-hidden rounded-[22px] bg-white shadow-soft">
            <div className="border-b border-[#eee9dd] bg-[#fbf8f0] px-5 py-4">
              <p className="text-sm font-semibold text-[#a58024]">维度 {index + 1}</p>
              <h2 className="mt-1 text-[21px] font-semibold">{section.title}</h2>
              <p className="mt-1 text-[15px] text-mutedInk">{section.question}</p>
            </div>

            <ReportBlock title="推理过程" content={section.reasoning} />
            <ReportBlock title="分析结论" content={section.conclusion} />

            <div className="px-5 pb-5 pt-2">
              <h3 className="mb-2 text-[17px] font-semibold">现实建议</h3>
              <div className="space-y-2">
                {section.advice.map((item) => (
                  <p key={item} className="rounded-lg bg-[#f7f7f5] px-4 py-3 text-[16px] leading-7 text-[#55514b]">
                    {item}
                  </p>
                ))}
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="px-4 pt-4">
        <div className="rounded-[22px] border border-[#e5dcc7] bg-white p-5">
          <div className="mb-3 flex items-center gap-2 text-[#a58024]">
            <ShieldCheck size={22} />
            <h2 className="text-xl font-semibold">使用边界</h2>
          </div>
          <div className="space-y-2 text-[15px] leading-7 text-[#5f5a52]">
            {demoAiReport.disclaimers.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function ReportBlock({ title, content }: { title: string; content: string }) {
  return (
    <div className="px-5 pt-5">
      <h3 className="mb-2 text-[17px] font-semibold">{title}</h3>
      <p className="text-[16px] leading-8 text-[#55514b]">{content}</p>
    </div>
  );
}
