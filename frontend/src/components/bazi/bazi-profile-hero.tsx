"use client";

import Link from "next/link";
import { Eye, EyeOff, Pencil } from "lucide-react";
import { useState } from "react";

export interface BaziProfileHeroProps {
  name: string;
  zodiac: string;
  lunar: string;
  solar: string;
  editHref: string;
}

export function BaziProfileHero({ name, zodiac, lunar, solar, editHref }: BaziProfileHeroProps) {
  const [visible, setVisible] = useState(true);
  const displayName = visible ? name : "已隐藏";
  const displayLunar = visible ? lunar : "****年**月**日 **时";
  const displaySolar = visible ? solar : "****-**-** **:**";

  return (
    <section className="mx-4 mt-3 rounded-[16px] border border-[#eadfca] bg-[rgba(255,255,255,0.88)] px-4 py-4 text-ink shadow-[0_10px_28px_rgba(67,48,20,0.07)] backdrop-blur-sm">
      <div className="grid grid-cols-[56px_minmax(0,1fr)_80px] items-center gap-3">
        <div className="relative flex h-14 w-14 items-center justify-center rounded-[14px] bg-[#262520] text-[25px] font-semibold text-[#f4dfb3] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
          {zodiac}
          <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white bg-[#b6382d]" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[19px] font-semibold tracking-[0.04em] text-ink">{displayName}</p>
          <div className="mt-1.5 space-y-1 text-[12px] font-medium leading-4 text-mutedInk">
            <p className="truncate">农历：{displayLunar} 乾造</p>
            <p className="truncate">阳历：{displaySolar}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 text-[#9a6d20]">
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#eadfca] bg-[#faf6ec] transition-colors hover:bg-[#f3ead9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b6382d] focus-visible:ring-offset-2"
            aria-label={visible ? "隐藏资料" : "显示资料"}
          >
            {visible ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>
          <Link href={editHref} className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#eadfca] bg-[#faf6ec] transition-colors hover:bg-[#f3ead9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b6382d] focus-visible:ring-offset-2" aria-label="编辑资料">
            <Pencil size={20} />
          </Link>
        </div>
      </div>
    </section>
  );
}
