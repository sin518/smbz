"use client";

import { Check, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { chinaLocationOptions } from "@/lib/locations/china";
import { cn } from "@/lib/utils";

type LocationStep = "province" | "city" | "district";

export type BaziLocationValue = {
  province: string;
  city: string;
  district: string;
};

const steps: ReadonlyArray<{ key: LocationStep; label: string }> = [
  { key: "province", label: "省份" },
  { key: "city", label: "城市" },
  { key: "district", label: "区县" }
];

export function BaziLocationPickerSheet({
  open,
  value,
  onClose,
  onConfirm
}: {
  open: boolean;
  value: BaziLocationValue;
  onClose: () => void;
  onConfirm: (value: BaziLocationValue) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [step, setStep] = useState<LocationStep>("province");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (open) {
      setDraft(value);
      setStep("province");
      setQuery("");
    }
  }, [open, value]);

  const province = chinaLocationOptions.find((item) => item.province === draft.province) ?? chinaLocationOptions[0];
  const city = province.cities.find((item) => item.city === draft.city) ?? province.cities[0];
  const options = useMemo(() => {
    const values = step === "province"
      ? chinaLocationOptions.map((item) => item.province)
      : step === "city"
        ? province.cities.map((item) => item.city)
        : city?.districts ?? [];
    const keyword = query.trim().toLocaleLowerCase("zh-CN");
    return keyword ? values.filter((item) => item.toLocaleLowerCase("zh-CN").includes(keyword)) : values;
  }, [city?.districts, province.cities, query, step]);

  if (!open) return null;

  const selectOption = (option: string) => {
    if (step === "province") {
      const nextProvince = chinaLocationOptions.find((item) => item.province === option) ?? chinaLocationOptions[0];
      const nextCity = nextProvince.cities[0];
      setDraft({ province: option, city: nextCity?.city ?? "", district: nextCity?.districts[0] ?? "" });
      setStep("city");
    } else if (step === "city") {
      const nextCity = province.cities.find((item) => item.city === option) ?? province.cities[0];
      setDraft((current) => ({ ...current, city: option, district: nextCity?.districts[0] ?? "" }));
      setStep("district");
    } else {
      setDraft((current) => ({ ...current, district: option }));
    }
    setQuery("");
  };

  const selectedValue = draft[step];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="关闭出生地点选择" onClick={onClose} />
      <section className="relative w-full max-w-[430px] rounded-t-[28px] bg-white px-5 pb-8 pt-6 shadow-soft" aria-labelledby="bazi-location-title">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="bazi-location-title" className="text-xl font-semibold text-ink">选择出生地点</h2>
            <p className="mt-1 text-sm text-[#8b8985]">用于地点记录与真太阳时校正</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f4f4f3]" aria-label="关闭">
            <X size={20} />
          </button>
        </div>

        <label className="mt-5 flex h-12 items-center gap-2 rounded-2xl bg-[#f5f4f0] px-4">
          <Search size={19} className="text-[#99958d]" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[#aaa8a1]" placeholder={`搜索${steps.find((item) => item.key === step)?.label}`} aria-label="搜索地点" />
        </label>

        <div className="mt-4 grid grid-cols-3 gap-2" role="tablist" aria-label="地点选择步骤">
          {steps.map((item) => (
            <button key={item.key} type="button" role="tab" aria-selected={step === item.key} onClick={() => { setStep(item.key); setQuery(""); }} className={cn("h-11 rounded-xl text-sm font-semibold", step === item.key ? "bg-black text-[#e8d4a7]" : "bg-[#f5f4f0] text-[#77736c]") }>
              <span className="block text-xs opacity-70">{item.label}</span>
              <span className="block truncate px-1">{draft[item.key] || "请选择"}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 max-h-[320px] min-h-[220px] overflow-y-auto rounded-2xl bg-[#faf9f5] p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {options.length ? (
            <div className="grid grid-cols-2 gap-2">
              {options.map((option) => {
                const selected = selectedValue === option;
                return (
                  <button key={option} type="button" onClick={() => selectOption(option)} className={cn("flex min-h-11 items-center justify-between rounded-xl px-3 text-left text-[15px] font-semibold", selected ? "bg-[#eee3c9] text-[#6f571d]" : "bg-white text-[#55514a]") }>
                    <span className="truncate">{option}</span>
                    {selected ? <Check size={17} className="shrink-0" /> : null}
                  </button>
                );
              })}
            </div>
          ) : <p className="py-16 text-center text-sm text-[#99958d]">没有找到匹配地点</p>}
        </div>

        <div className="mt-4 rounded-2xl bg-[#f7f3e8] px-4 py-3 text-sm font-semibold text-[#776536]">
          已选择：{draft.province} · {draft.city} · {draft.district}
        </div>
        <button type="button" onClick={() => onConfirm(draft)} disabled={!draft.province || !draft.city || !draft.district} className="mt-4 h-12 w-full rounded-full bg-black text-lg font-semibold text-[#e8d4a7] disabled:opacity-50">确定</button>
      </section>
    </div>
  );
}
