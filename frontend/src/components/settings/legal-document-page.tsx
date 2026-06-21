import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export type LegalSection = {
  title: string;
  paragraphs?: readonly string[];
  items?: readonly string[];
};

export function LegalDocumentPage({
  title,
  effectiveDate,
  introduction,
  sections
}: {
  title: string;
  effectiveDate: string;
  introduction: string;
  sections: readonly LegalSection[];
}) {
  return (
    <main className="light-surface-text-scope app-responsive-shell min-h-dvh bg-[#F8F7EE] pb-12 text-ink shadow-soft">
      <header className="sticky top-0 z-20 grid h-[96px] grid-cols-[44px_minmax(0,1fr)_44px] items-end border-b border-[#ebe7dd] bg-[#F8F7EE]/95 px-5 pb-4 backdrop-blur">
        <Link href="/settings/login" className="-ml-2 flex h-10 w-10 items-center justify-center" aria-label="返回登录">
          <ChevronLeft size={28} strokeWidth={2} />
        </Link>
        <h1 className="pb-1 text-center text-[22px] font-semibold">{title}</h1>
        <span className="h-10 w-10" />
      </header>

      <article className="px-6 pt-7">
        <p className="text-[13px] text-mutedInk">生效日期：{effectiveDate}</p>
        <p className="mt-5 text-[15px] leading-7 text-[#55514a]">{introduction}</p>

        <div className="mt-8 space-y-8">
          {sections.map((section, index) => (
            <section key={section.title} aria-labelledby={`legal-section-${index}`}>
              <h2 id={`legal-section-${index}`} className="text-[18px] font-semibold text-ink">
                {index + 1}. {section.title}
              </h2>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph} className="mt-3 text-[15px] leading-7 text-[#66615a]">
                  {paragraph}
                </p>
              ))}
              {section.items?.length ? (
                <ul className="mt-3 space-y-2 text-[15px] leading-7 text-[#66615a]">
                  {section.items.map((item) => (
                    <li key={item} className="grid grid-cols-[18px_minmax(0,1fr)] gap-1">
                      <span aria-hidden="true">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>

        <p className="mt-10 border-t border-[#e5decb] pt-5 text-[13px] leading-6 text-[#9b9383]">
          本文本为通用版本。若服务功能、运营主体或个人信息处理方式发生变化，我们将根据实际情况更新并依法履行必要的告知义务。
        </p>
      </article>
    </main>
  );
}
