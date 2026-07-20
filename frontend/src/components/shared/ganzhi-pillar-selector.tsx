"use client";

import { useState } from "react";
import { SEXAGENARY_CYCLE } from "taibu-core/utils";
import { cn } from "@/lib/utils";

export type GanzhiPillarKey = "yearPillar" | "monthPillar" | "dayPillar" | "hourPillar";
export type GanzhiPillarSelection = Record<GanzhiPillarKey, string>;

const pillarFields: ReadonlyArray<{ key: GanzhiPillarKey; label: string }> = [
  { key: "yearPillar", label: "年柱" },
  { key: "monthPillar", label: "月柱" },
  { key: "dayPillar", label: "日柱" },
  { key: "hourPillar", label: "时柱" }
];

export const JIAZI_XUN_GROUPS = Array.from({ length: 6 }, (_, groupIndex) => ({
  label: `${SEXAGENARY_CYCLE[groupIndex * 10]}旬`,
  values: SEXAGENARY_CYCLE.slice(groupIndex * 10, groupIndex * 10 + 10)
}));

export function GanzhiPillarSelector({
  value,
  onChange
}: {
  value: GanzhiPillarSelection;
  onChange: (value: GanzhiPillarSelection) => void;
}) {
  const [activeField, setActiveField] = useState<GanzhiPillarKey>("yearPillar");

  return (
    <div>
      <div className="grid grid-cols-4 gap-2" role="tablist" aria-label="选择四柱">
        {pillarFields.map((field) => (
          <button
            key={field.key}
            type="button"
            role="tab"
            aria-selected={activeField === field.key}
            onClick={() => setActiveField(field.key)}
            className={cn(
              "min-h-16 rounded-2xl border px-1.5 py-2 text-center transition-colors",
              activeField === field.key
                ? "border-black bg-black text-[#e8d4a7]"
                : "border-[#ece5d6] bg-[#fffdf8] text-[#5a554d]"
            )}
          >
            <span className="block text-xs font-semibold opacity-75">{field.label}</span>
            <span className="mt-0.5 block text-xl font-semibold">{value[field.key]}</span>
          </button>
        ))}
      </div>

      <div className="mt-3 max-h-[290px] space-y-3 overflow-y-auto rounded-2xl bg-[#f6f3ec] p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {JIAZI_XUN_GROUPS.map((group) => (
          <section key={group.label} aria-label={group.label}>
            <p className="mb-2 text-sm font-semibold text-[#8a7137]">{group.label}</p>
            <div className="grid grid-cols-5 gap-2">
              {group.values.map((item) => {
                const selected = value[activeField] === item;
                return (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onChange({ ...value, [activeField]: item })}
                    className={cn(
                      "h-10 rounded-xl text-[15px] font-semibold transition-colors",
                      selected ? "bg-black text-[#e8d4a7]" : "bg-white text-[#5a554d]"
                    )}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
