"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { ReadonlyURLSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { AppBottomNav } from "@/components/app-bottom-nav";
import { getCurrentDemoChart } from "@/lib/bazi";
import { chinaLocationOptions } from "@/lib/locations/china";
import { cn } from "@/lib/utils";

const baziFormSchema = z.object({
  name: z.string().trim().max(20, "姓名不能超过 20 个字").optional(),
  gender: z.enum(["male", "female"], {
    required_error: "请选择性别"
  }),
  calendar: z.enum(["solar", "lunar", "pillars"]),
  birthTime: z.string().min(1, "请选择出生时间"),
  province: z.string().min(1, "请选择省份"),
  city: z.string().min(1, "请选择城市"),
  district: z.string().min(1, "请选择区县"),
  group: z.string().min(1, "请选择分组"),
  save: z.boolean()
});

type BaziFormValues = z.infer<typeof baziFormSchema>;

const defaultValues: BaziFormValues = {
  name: "",
  gender: "male",
  calendar: "solar",
  birthTime: "1990-01-01T00:00",
  province: "北京市",
  city: "北京市",
  district: "东城区",
  group: "全部",
  save: true
};

export function BaziHomeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const chart = useMemo(() => getCurrentDemoChart(new Date("2026-04-30T10:41:00+08:00")), []);
  const initialValues = useMemo(() => getInitialFormValues(searchParams), [searchParams]);
  const [birthPickerOpen, setBirthPickerOpen] = useState(false);
  const {
    control,
    register,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<BaziFormValues>({
    resolver: zodResolver(baziFormSchema),
    defaultValues: initialValues
  });
  const birthTime = useWatch({ control, name: "birthTime" });
  const calendar = useWatch({ control, name: "calendar" });
  const province = useWatch({ control, name: "province" });
  const city = useWatch({ control, name: "city" });
  const district = useWatch({ control, name: "district" });
  const location = `${province} ${city} ${district}`;
  const locationMeta = getLocationMeta(location);
  const solarTimeText = formatBirthTime(birthTime);
  const cities = getCities(province);
  const districts = getDistricts(province, city);

  useEffect(() => {
    if (!cities.some((item) => item.city === city)) {
      const nextCity = cities[0]?.city ?? "";
      setValue("city", nextCity);
      setValue("district", getDistricts(province, nextCity)[0] ?? "");
    }
  }, [city, cities, province, setValue]);

  useEffect(() => {
    if (!districts.includes(district)) {
      setValue("district", districts[0] ?? "");
    }
  }, [district, districts, setValue]);

  function onSubmit(values: BaziFormValues) {
    const selectedLocation = formatLocation(values);
    if (values.save) {
      window.localStorage.setItem(
        "sm1:last-bazi-input",
        JSON.stringify({
          ...values,
          location: selectedLocation,
          savedAt: new Date().toISOString()
        })
      );
    }
    router.push(`/bazi/demo?${buildChartQuery(values)}`);
  }

  return (
    <main className="mx-auto flex h-dvh max-w-[430px] flex-col overflow-hidden bg-paper text-ink shadow-soft">
      <header className="shrink-0 bg-white px-5 pb-3 pt-7">
        <div className="flex items-center justify-center">
          <h1 className="text-[24px] font-semibold tracking-normal">赛博八字</h1>
        </div>
      </header>

      <div className="min-h-0 flex-1 space-y-2.5 overflow-hidden px-3 pb-[74px] pt-3">
      <section>
        <form onSubmit={handleSubmit(onSubmit)} className="rounded-2xl bg-white px-4 pb-4 pt-3 shadow-soft">
          <FieldRow label="姓名" error={errors.name?.message}>
            <input
              {...register("name")}
              className="w-full bg-transparent text-right text-[16px] text-ink outline-none placeholder:text-[#c5c5c5]"
              placeholder="请输入姓名"
            />
          </FieldRow>

          <div className="grid grid-cols-[1fr_1.85fr] gap-2.5 border-b border-[#deddd9] py-2.5">
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <SegmentedControl
                  ariaLabel="选择性别"
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { label: "男", value: "male" },
                    { label: "女", value: "female" }
                  ]}
                />
              )}
            />
            <Controller
              name="calendar"
              control={control}
              render={({ field }) => (
                <SegmentedControl
                  ariaLabel="选择历法"
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { label: "公历", value: "solar" },
                    { label: "农历", value: "lunar" },
                    { label: "四柱", value: "pillars" }
                  ]}
                />
              )}
            />
          </div>

          <FieldRow label="出生时间" required error={errors.birthTime?.message}>
            <button
              type="button"
              onClick={() => setBirthPickerOpen(true)}
              className="flex w-full min-w-0 items-center justify-end gap-1 text-right text-[15px] text-ink"
              aria-label="选择出生时间"
            >
              {formatPickerLabel(birthTime)}
              <ChevronRight size={19} strokeWidth={2} className="shrink-0 text-[#bfbfbf]" />
            </button>
          </FieldRow>

          <FieldRow label="出生地点" error={errors.province?.message || errors.city?.message || errors.district?.message}>
            <div className="grid min-w-0 grid-cols-3 gap-2">
              <select {...register("province")} className="min-w-0 bg-transparent text-right text-[14px] text-ink outline-none" aria-label="省份">
                {chinaLocationOptions.map((item) => (
                  <option key={item.province} value={item.province}>
                    {item.province}
                  </option>
                ))}
              </select>
              <select {...register("city")} className="min-w-0 bg-transparent text-right text-[14px] text-ink outline-none" aria-label="城市">
                {cities.map((item) => (
                  <option key={item.city} value={item.city}>
                    {item.city}
                  </option>
                ))}
              </select>
              <select {...register("district")} className="min-w-0 bg-transparent text-right text-[14px] text-ink outline-none" aria-label="区县">
                {districts.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </FieldRow>

          <FieldRow label="分组" error={errors.group?.message}>
            <button type="button" className="flex w-full items-center justify-end gap-1 text-[16px] text-ink">
              全部
              <ChevronRight size={19} strokeWidth={2} className="text-[#bfbfbf]" />
            </button>
          </FieldRow>

          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 py-2.5">
            <div className="min-w-0 space-y-0.5 text-[12px] leading-5 text-[#999894]">
              <p>真太阳时： {solarTimeText}</p>
              <p>
                地址经纬： 北纬{locationMeta.latitude.toFixed(2)} 东经{locationMeta.longitude.toFixed(2)}
              </p>
            </div>
            <Controller
              name="save"
              control={control}
              render={({ field }) => (
                <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[15px]">
                  <span>保存</span>
                  <button
                    type="button"
                    onClick={() => field.onChange(!field.value)}
                    className={cn(
                      "relative h-7 w-12 overflow-hidden rounded-full transition-colors",
                      field.value ? "bg-gold" : "bg-[#d7d7d7]"
                    )}
                    aria-pressed={field.value}
                    aria-label="是否保存"
                  >
                    <span
                      className={cn(
                        "absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                        field.value ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>
              )}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-1 h-12 w-full rounded-full bg-black text-[20px] font-semibold text-[#e8d4a7] shadow-[0_10px_18px_rgba(0,0,0,0.12)]"
          >
            开始排盘
          </button>
        </form>
      </section>

      <section>
        <div className="grid grid-cols-[1fr_auto] gap-3 rounded-2xl bg-white p-3 shadow-soft">
          <div>
            <div className="grid max-w-[132px] grid-cols-4 gap-3 text-center text-[23px] leading-tight">
              {chart.pillars.map((pillar, index) => (
                <div key={`${pillar.stem}${pillar.branch}-${index}`}>
                  <div>{pillar.stem}</div>
                  <div>{pillar.branch}</div>
                </div>
              ))}
            </div>
            <div className="mt-2 space-y-0.5 text-[12px] leading-5 text-[#818086]">
              <p>农历： {chart.lunarText}</p>
              <p>公历： {chart.solarText}</p>
            </div>
          </div>
          <div className="flex flex-col items-end justify-center gap-3">
            <p className="text-[22px]">{chart.currentHour}</p>
            <Link href="/bazi/demo" className="flex h-9 w-28 items-center justify-center rounded-full border border-[#d6d2cb] text-[16px] font-semibold text-[#55514b]">
              即时排盘
            </Link>
          </div>
        </div>
      </section>

      </div>

      <AppBottomNav active="chart" />
      <BirthTimePickerSheet
        open={birthPickerOpen}
        value={birthTime}
        calendar={calendar}
        onCalendarChange={(nextCalendar) => setValue("calendar", nextCalendar)}
        onClose={() => setBirthPickerOpen(false)}
        onConfirm={(nextValue) => {
          setValue("birthTime", nextValue, { shouldDirty: true, shouldValidate: true });
          setBirthPickerOpen(false);
        }}
      />
    </main>
  );
}

function FieldRow({
  label,
  required,
  error,
  children
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-[#deddd9] py-2.5">
      <div className="grid grid-cols-[88px_1fr] items-center gap-2">
        <label className="text-[17px] font-medium text-ink">
          {label}
          {required ? <span className="ml-1 text-[11px] font-normal text-[#999894]">(必填)</span> : null}
        </label>
        {children}
      </div>
      {error ? <p className="mt-2 text-right text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

function SegmentedControl<TValue extends string>({
  value,
  onChange,
  options,
  ariaLabel
}: {
  value: TValue;
  onChange: (value: TValue) => void;
  options: Array<{ label: string; value: TValue }>;
  ariaLabel: string;
}) {
  return (
    <div className="flex h-9 items-center rounded-full border border-[#deddd9] p-1" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "h-full flex-1 rounded-full text-[15px] font-medium transition-colors",
            option.value === value ? "bg-gold text-white" : "text-[#9b9b9b]"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function BirthTimePickerSheet({
  open,
  value,
  calendar,
  onCalendarChange,
  onClose,
  onConfirm
}: {
  open: boolean;
  value: string;
  calendar: BaziFormValues["calendar"];
  onCalendarChange: (value: BaziFormValues["calendar"]) => void;
  onClose: () => void;
  onConfirm: (value: string) => void;
}) {
  const [draft, setDraft] = useState(() => parseBirthTime(value));
  const [quickInput, setQuickInput] = useState("");
  const [daylightSaving, setDaylightSaving] = useState(false);
  const years = useMemo(() => buildNumberRange(1920, 2050), []);
  const months = useMemo(() => buildNumberRange(1, 12), []);
  const hours = useMemo(() => buildNumberRange(0, 23), []);
  const minutes = useMemo(() => buildNumberRange(0, 59), []);
  const days = useMemo(() => buildNumberRange(1, getDaysInMonth(draft.year, draft.month)), [draft.month, draft.year]);

  useEffect(() => {
    if (open) {
      setDraft(parseBirthTime(value));
      setQuickInput("");
    }
  }, [open, value]);

  useEffect(() => {
    const maxDay = getDaysInMonth(draft.year, draft.month);
    if (draft.day > maxDay) {
      setDraft((current) => ({ ...current, day: maxDay }));
    }
  }, [draft.day, draft.month, draft.year]);

  if (!open) {
    return null;
  }

  const updateDraft = (key: keyof BirthTimeParts, nextValue: number) => {
    setDraft((current) => ({ ...current, [key]: nextValue }));
  };
  const applyQuickInput = () => {
    const parsed = parseCompactBirthTime(quickInput);
    if (parsed) {
      setDraft(parsed);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65">
      <button className="absolute inset-0 cursor-default" type="button" aria-label="关闭出生时间选择" onClick={onClose} />
      <section className="relative w-full max-w-[430px] rounded-t-[28px] bg-white px-5 pb-8 pt-7 shadow-soft">
        <div className="grid grid-cols-[1fr_48px_86px] items-center gap-4">
          <div className="grid h-12 grid-cols-3 rounded-full bg-[#f4f4f3] p-1">
            {[
              { label: "公历", value: "solar" },
              { label: "农历", value: "lunar" },
              { label: "四柱", value: "pillars" }
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onCalendarChange(option.value as BaziFormValues["calendar"])}
                className={cn(
                  "rounded-full text-[18px] font-semibold",
                  calendar === option.value ? "bg-white text-ink shadow-sm" : "text-[#cfcfce]"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setDraft(parseBirthTime(new Date().toISOString().slice(0, 16)))}
            className="h-12 rounded-full bg-[#f4f4f3] text-[18px] font-semibold"
          >
            今
          </button>
          <button
            type="button"
            onClick={() => onConfirm(toBirthTimeValue(daylightSaving ? shiftBirthTime(draft, -1) : draft))}
            className="h-12 rounded-full bg-black text-[20px] font-semibold text-[#e8d4a7]"
          >
            确定
          </button>
        </div>

        <div className="mt-5 grid h-14 grid-cols-[minmax(0,1fr)_72px] items-center gap-2 rounded-full bg-[#f4f4f3] p-1.5 text-[#c7c7c7]">
          <input
            value={quickInput}
            onChange={(event) => setQuickInput(event.target.value.replace(/\D/g, "").slice(0, 12))}
            inputMode="numeric"
            placeholder="输入年月日时分，如199303270255"
            className="min-w-0 bg-transparent px-4 text-[15px] font-semibold outline-none placeholder:text-[#cfcfce]"
            aria-label="快速输入出生年月日时分"
          />
          <button
            type="button"
            onClick={applyQuickInput}
            disabled={quickInput.length !== 12}
            className="h-11 rounded-full bg-white text-[16px] font-semibold text-[#9d9b98] disabled:text-[#d4d4d4]"
          >
            查询
          </button>
        </div>

        <div className="mt-6 border-t border-[#f0f0ef] pt-4">
          <div className="grid grid-cols-5 text-center text-[20px] font-semibold text-[#3d3a36]">
            <span className="rounded-full bg-[#f4f1ed] py-3 text-[#a99156]">年</span>
            <span className="py-3">月</span>
            <span className="py-3">日</span>
            <span className="py-3">时</span>
            <span className="py-3">分</span>
          </div>
          <div className="relative mt-2 grid h-60 grid-cols-5 overflow-hidden">
            <div className="pointer-events-none absolute left-0 right-0 top-[96px] h-12 rounded-2xl bg-[#f3f3f2]" />
            <PickerColumn values={years} selected={draft.year} onSelect={(nextValue) => updateDraft("year", nextValue)} />
            <PickerColumn values={months} selected={draft.month} onSelect={(nextValue) => updateDraft("month", nextValue)} padValue />
            <PickerColumn values={days} selected={draft.day} onSelect={(nextValue) => updateDraft("day", nextValue)} padValue />
            <PickerColumn values={hours} selected={draft.hour} onSelect={(nextValue) => updateDraft("hour", nextValue)} padValue />
            <PickerColumn values={minutes} selected={draft.minute} onSelect={(nextValue) => updateDraft("minute", nextValue)} padValue />
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2 text-[18px] text-[#777]">
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#999] text-sm">?</span>
          <span>夏令时</span>
          <button
            type="button"
            onClick={() => setDaylightSaving((current) => !current)}
            className={cn("relative h-8 w-14 rounded-full transition-colors", daylightSaving ? "bg-gold" : "bg-[#e2e2e2]")}
            aria-pressed={daylightSaving}
            aria-label="是否使用夏令时"
          >
            <span
              className={cn(
                "absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow-sm transition-transform",
                daylightSaving && "translate-x-6"
              )}
            />
          </button>
        </div>
      </section>
    </div>
  );
}

function PickerColumn({
  values,
  selected,
  onSelect,
  padValue
}: {
  values: number[];
  selected: number;
  onSelect: (value: number) => void;
  padValue?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const settleTimerRef = useRef<number | null>(null);
  const hasPositionedRef = useRef(false);
  const selectedIndex = Math.max(0, values.indexOf(selected));

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) {
      return;
    }

    const top = selectedIndex * PICKER_ITEM_HEIGHT;

    if (!hasPositionedRef.current) {
      container.scrollTop = top;
      hasPositionedRef.current = true;
      return;
    }

    if (Math.abs(container.scrollTop - top) > 1) {
      container.scrollTo({
        top,
        behavior: "smooth"
      });
    }
  }, [selectedIndex]);

  useEffect(() => {
    return () => {
      if (settleTimerRef.current) {
        window.clearTimeout(settleTimerRef.current);
      }
    };
  }, []);

  const settleToNearestValue = () => {
    const container = scrollRef.current;
    if (!container) {
      return;
    }

    const nextIndex = Math.min(values.length - 1, Math.max(0, Math.round(container.scrollTop / PICKER_ITEM_HEIGHT)));
    const nextValue = values[nextIndex];

    container.scrollTo({
      top: nextIndex * PICKER_ITEM_HEIGHT,
      behavior: "smooth"
    });

    if (nextValue !== selected) {
      onSelect(nextValue);
    }
  };

  const handleScroll = () => {
    if (settleTimerRef.current) {
      window.clearTimeout(settleTimerRef.current);
    }

    settleTimerRef.current = window.setTimeout(settleToNearestValue, 90);
  };

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="relative z-10 h-60 overflow-y-auto snap-y snap-mandatory py-24 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {values.map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onSelect(value)}
          className={cn(
            "flex h-12 w-full snap-center items-center justify-center text-center text-[20px] font-semibold transition-colors",
            value === selected ? "text-[26px] text-black" : "text-[#d1d1d1]"
          )}
        >
          {padValue ? pad(value) : value}
        </button>
      ))}
    </div>
  );
}

function formatBirthTime(value: string) {
  if (!value) {
    return "请选择出生时间";
  }

  return value.replace("T", " ");
}

function formatPickerLabel(value: string) {
  return formatBirthTime(value).replaceAll("-", "/");
}

function getCities(province: string) {
  return chinaLocationOptions.find((item) => item.province === province)?.cities ?? chinaLocationOptions[0].cities;
}

function getDistricts(province: string, city: string) {
  return getCities(province).find((item) => item.city === city)?.districts ?? getCities(province)[0]?.districts ?? [];
}

function getLocationMeta(location: string) {
  const normalized = location.replace(/\s/g, "");
  const knownLocations = [
    { keyword: "佛山", latitude: 23.02, longitude: 113.12 },
    { keyword: "南海", latitude: 23.04, longitude: 113.14 },
    { keyword: "北京", latitude: 39.9, longitude: 116.4 },
    { keyword: "上海", latitude: 31.23, longitude: 121.47 },
    { keyword: "杭州", latitude: 30.25, longitude: 120.16 },
    { keyword: "成都", latitude: 30.57, longitude: 104.07 }
  ];
  const matched = knownLocations.find((item) => normalized.includes(item.keyword));

  // TODO: Replace this demo lookup with a geocoding service and true solar-time calculation.
  return matched ?? { latitude: 39, longitude: 120 };
}

function buildChartQuery(values: BaziFormValues) {
  const params = new URLSearchParams({
    name: values.name?.trim() || "未命名",
    gender: values.gender,
    birthTime: values.birthTime,
    location: formatLocation(values),
    calendar: values.calendar
  });

  return params.toString();
}

function formatLocation(values: Pick<BaziFormValues, "province" | "city" | "district">) {
  return `${values.province} ${values.city} ${values.district}`;
}

function getInitialFormValues(searchParams: ReadonlyURLSearchParams): BaziFormValues {
  const locationParts = parseLocationParam(searchParams.get("location"));
  const values = {
    ...defaultValues,
    name: searchParams.get("name") ?? defaultValues.name,
    gender: toGender(searchParams.get("gender")),
    calendar: toCalendarValue(searchParams.get("calendar")),
    birthTime: searchParams.get("birthTime") ?? defaultValues.birthTime,
    ...locationParts
  };

  return normalizeLocationValues(values);
}

function parseLocationParam(location: string | null) {
  if (!location) {
    return {};
  }

  const parts = location.split(/\s+/).filter(Boolean);

  return {
    province: parts[0] ?? defaultValues.province,
    city: parts[1] ?? defaultValues.city,
    district: parts[2] ?? defaultValues.district
  };
}

function normalizeLocationValues(values: BaziFormValues): BaziFormValues {
  const province = chinaLocationOptions.some((item) => item.province === values.province) ? values.province : defaultValues.province;
  const cities = getCities(province);
  const city = cities.some((item) => item.city === values.city) ? values.city : cities[0]?.city ?? defaultValues.city;
  const districts = getDistricts(province, city);
  const district = districts.includes(values.district) ? values.district : districts[0] ?? defaultValues.district;

  return {
    ...values,
    province,
    city,
    district
  };
}

function toGender(value: string | null): BaziFormValues["gender"] {
  return value === "female" ? "female" : "male";
}

function toCalendarValue(value: string | null): BaziFormValues["calendar"] {
  if (value === "lunar" || value === "pillars") {
    return value;
  }

  return "solar";
}

type BirthTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

function parseBirthTime(value: string): BirthTimeParts {
  const fallback = {
    year: 1990,
    month: 1,
    day: 1,
    hour: 0,
    minute: 0
  };

  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) {
    return fallback;
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5])
  };
}

function toBirthTimeValue(value: BirthTimeParts) {
  return `${value.year}-${pad(value.month)}-${pad(value.day)}T${pad(value.hour)}:${pad(value.minute)}`;
}

function parseCompactBirthTime(value: string) {
  if (!/^\d{12}$/.test(value)) {
    return null;
  }

  const parsed = {
    year: Number(value.slice(0, 4)),
    month: Number(value.slice(4, 6)),
    day: Number(value.slice(6, 8)),
    hour: Number(value.slice(8, 10)),
    minute: Number(value.slice(10, 12))
  };
  const maxDay = getDaysInMonth(parsed.year, parsed.month);

  if (parsed.year < 1920 || parsed.year > 2050 || parsed.month < 1 || parsed.month > 12) {
    return null;
  }

  if (parsed.day < 1 || parsed.day > maxDay || parsed.hour > 23 || parsed.minute > 59) {
    return null;
  }

  return parsed;
}

function shiftBirthTime(value: BirthTimeParts, hours: number) {
  const date = new Date(value.year, value.month - 1, value.day, value.hour + hours, value.minute);

  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes()
  };
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function buildNumberRange(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

const PICKER_ITEM_HEIGHT = 48;
