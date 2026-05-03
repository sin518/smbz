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
    <section className="bg-[radial-gradient(circle_at_50%_0%,#302a20,#111_55%,#080808)] px-5 py-5 text-white">
      <div className="grid grid-cols-[82px_minmax(0,1fr)_84px] items-center gap-3">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#c9ad70] text-4xl">{zodiac}</div>
        <div className="min-w-0 text-[12px] font-semibold leading-5">
          <p className="truncate text-[12px] text-[#d7bc7d]">{displayName}</p>
          <p className="truncate">农历：{displayLunar} 乾造</p>
          <p className="truncate">阳历：{displaySolar}</p>
        </div>
        <div className="flex justify-end gap-2 text-[#e9d29b]">
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10"
            aria-label={visible ? "隐藏资料" : "显示资料"}
          >
            {visible ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>
          <Link href={editHref} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10" aria-label="编辑资料">
            <Pencil size={20} />
          </Link>
        </div>
      </div>
    </section>
  );
}
