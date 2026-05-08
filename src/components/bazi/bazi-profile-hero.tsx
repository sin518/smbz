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
    <section className="mx-4 mt-2 rounded-[22px] bg-white px-4 py-4 text-ink shadow-soft">
      <div className="grid grid-cols-[60px_minmax(0,1fr)_78px] items-center gap-4">
        <div className="flex h-[60px] w-[60px] items-center justify-center rounded-[18px] bg-black text-[26px] font-semibold text-[#e8d4a7]">{zodiac}</div>
        <div className="min-w-0">
          <p className="truncate text-[18px] font-semibold text-ink">{displayName}</p>
          <div className="mt-1 space-y-1 text-[13px] font-medium leading-4 text-mutedInk">
            <p className="truncate">农历：{displayLunar} 乾造</p>
            <p className="truncate">阳历：{displaySolar}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 text-[#a58024]">
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f6f0e2]"
            aria-label={visible ? "隐藏资料" : "显示资料"}
          >
            {visible ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>
          <Link href={editHref} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f6f0e2]" aria-label="编辑资料">
            <Pencil size={20} />
          </Link>
        </div>
      </div>
    </section>
  );
}
