"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CalendarDays, ChevronDown, Clock3, Folder, MapPin, Save } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { ReadonlyURLSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import {
  DivinationProfileCard,
  SharedFieldRow,
  SharedFormCard,
  saveSharedProfile
} from "@/components/shared/divination-profile-card";
import { calculateBaziChart } from "@/lib/bazi/calculate";
import { saveLocalBaziRecord, scheduleBaziRecordAutoSync } from "@/lib/bazi/local-records";
import { chinaLocationOptions } from "@/lib/locations/china";
import { cn } from "@/lib/utils";

const baziFormSchema = z.object({
  name: z.string().trim().max(20, "姓名不能超过 20 个字").optional(),
  gender: z.enum(["male", "female"], {
    required_error: "请选择性别"
  }),
  calendar: z.enum(["solar", "lunar", "pillars"]),
  birthTime: z.string().min(1, "请选择出生时间").superRefine((value, context) => {
    const parsed = parseBirthTimeForValidation(value);

    if (!parsed) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "出生时间格式不正确"
      });
      return;
    }

    if (parsed.year < 1900) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "出生年份不能早于 1900 年"
      });
      return;
    }

    if (parsed.date.getTime() > Date.now()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "出生时间不能晚于当前时间"
      });
    }
  }),
  province: z.string().min(1, "请选择省份"),
  city: z.string().min(1, "请选择城市"),
  district: z.string().min(1, "请选择区县"),
  useSolarTime: z.boolean(),
  group: z.string().min(1, "请选择分组"),
  save: z.boolean()
});

type BaziFormValues = z.infer<typeof baziFormSchema>;

const defaultValues: BaziFormValues = {
  name: "",
  gender: "male",
  calendar: "solar",
  birthTime: "",
  province: "北京市",
  city: "北京市",
  district: "东城区",
  useSolarTime: false,
  group: "全部",
  save: true
};

export function BaziHomeClient({ embedded = false, backHref = "/" }: { embedded?: boolean; backHref?: string } = {}) {
  const Shell = embedded ? "section" : "main";
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const useSolarTime = useWatch({ control, name: "useSolarTime" });
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

  async function onSubmit(values: BaziFormValues) {
    const selectedLocation = formatLocation(values);
    const chartQuery = buildChartQuery(values);
    const chartJson = calculateBaziChart({
      name: values.name?.trim(),
      gender: values.gender,
      birthTime: values.birthTime,
      location: selectedLocation,
      calendar: values.calendar
    });

    if (values.save) {
      window.localStorage.setItem(
        "sm1:last-bazi-input",
        JSON.stringify({
          ...values,
          location: selectedLocation,
          savedAt: new Date().toISOString()
        })
      );
      void saveSharedProfile({
        source: "八字档案",
        name: values.name?.trim() ?? "",
        gender: values.gender,
        dateTime: values.birthTime,
        location: selectedLocation
      });
      const localRecord = saveLocalBaziRecord({
        name: values.name?.trim() ?? "",
        gender: values.gender,
        birthTime: values.birthTime,
        calendar: values.calendar,
        location: selectedLocation,
        useSolarTime: values.useSolarTime,
        chartJson
      });
      scheduleBaziRecordAutoSync();
      router.push(`/bazi/local/${localRecord.id}`);
      return;
    }

    router.push(`/bazi/demo?${chartQuery}`);
  }

  return (
    <Shell
      className={cn(
        "light-surface-text-scope mx-auto max-w-[430px] bg-[#F8F7EE] text-ink",
        embedded ? "min-h-0 bg-transparent shadow-none" : "min-h-screen pb-8 shadow-soft"
      )}
    >
      {!embedded ? <header className="px-5 pb-2 pt-8">
        <div className="flex items-center justify-between">
          <Link href={backHref} className="-ml-2 flex h-10 w-10 items-center justify-center" aria-label="返回首页">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-[24px] font-semibold">赛博八字</h1>
          <span className="h-10 w-10" />
        </div>
      </header> : null}

      <div className={cn("space-y-4", embedded ? "px-0 pt-0" : "px-4 pt-4")}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Controller
            name="gender"
            control={control}
            render={({ field }) => (
              <DivinationProfileCard
                nameInputProps={register("name")}
                nameError={errors.name?.message}
                gender={field.value}
                onGenderChange={field.onChange}
                dateTime={birthTime}
                dateTimeError={errors.birthTime?.message}
                onOpenTimePicker={() => setBirthPickerOpen(true)}
                onApplyProfile={(profile) => {
                  setValue("name", profile.name, { shouldDirty: true, shouldValidate: true });
                  setValue("gender", profile.gender, { shouldDirty: true, shouldValidate: true });
                  setValue("birthTime", profile.dateTime, { shouldDirty: true, shouldValidate: true });
                }}
              />
            )}
          />

          <SharedFormCard>
            <Controller
              name="calendar"
              control={control}
              render={({ field }) => (
                <SharedFieldRow icon={CalendarDays} label="历法模式">
                  <CalendarModePill
                    value={field.value}
                    onChange={field.onChange}
                  />
                </SharedFieldRow>
              )}
            />

            <SharedFieldRow icon={MapPin} label="出生地点" error={errors.province?.message || errors.city?.message || errors.district?.message}>
              <div className="grid min-w-0 grid-cols-3 gap-1.5">
                <select {...register("province")} className="min-w-0 bg-transparent text-right text-[18px] font-semibold text-[#55514a] outline-none" aria-label="省份">
                  {chinaLocationOptions.map((item) => (
                    <option key={item.province} value={item.province}>
                      {item.province}
                    </option>
                  ))}
                </select>
                <select {...register("city")} className="min-w-0 bg-transparent text-right text-[18px] font-semibold text-[#55514a] outline-none" aria-label="城市">
                  {cities.map((item) => (
                    <option key={item.city} value={item.city}>
                      {item.city}
                    </option>
                  ))}
                </select>
                <select {...register("district")} className="min-w-0 bg-transparent text-right text-[18px] font-semibold text-[#55514a] outline-none" aria-label="区县">
                  {districts.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </SharedFieldRow>

            <SharedFieldRow icon={Folder} label="分组" error={errors.group?.message} last>
              <button type="button" className="flex w-full items-center justify-end gap-1 text-[18px] font-semibold text-[#55514a]">
                全部
                <ChevronDown size={20} strokeWidth={2.5} className="text-[#302f2c]" />
              </button>
            </SharedFieldRow>
          </SharedFormCard>

          <SharedFormCard>
            <Controller
              name="useSolarTime"
              control={control}
              render={({ field }) => (
                <SharedFieldRow icon={Clock3} label="真太阳时">
                  <div className="flex items-center justify-end gap-3">
                    <span className="text-[15px] font-semibold text-[#aaa8a1]">{field.value ? "已开启" : "未使用"}</span>
                    <button
                      type="button"
                      onClick={() => field.onChange(!field.value)}
                      className={cn(
                        "relative h-8 w-14 overflow-hidden rounded-full transition-colors",
                        field.value ? "bg-black" : "bg-[#d7d7d7]"
                      )}
                      aria-pressed={field.value}
                      aria-label="是否使用真太阳时"
                    >
                      <span
                        className={cn(
                          "absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow-sm transition-transform",
                          field.value ? "translate-x-6" : "translate-x-0"
                        )}
                      />
                    </button>
                  </div>
                </SharedFieldRow>
              )}
            />
            <SharedFieldRow icon={Clock3} label="校正时间">
              <span className={cn("block text-right text-[16px] font-semibold", useSolarTime ? "text-[#55514a]" : "text-[#aaa8a1]")}>
                {useSolarTime ? solarTimeText : "未启用"}
              </span>
            </SharedFieldRow>
            <SharedFieldRow icon={MapPin} label="经纬参考">
              <span className="block text-right text-[15px] font-semibold text-[#aaa8a1]">
                北纬{locationMeta.latitude.toFixed(2)} 东经{locationMeta.longitude.toFixed(2)}
              </span>
            </SharedFieldRow>
            <Controller
              name="save"
              control={control}
              render={({ field }) => (
                <SharedFieldRow icon={Save} label="保存记录" last>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => field.onChange(!field.value)}
                      className={cn(
                        "relative h-8 w-14 overflow-hidden rounded-full transition-colors",
                        field.value ? "bg-black" : "bg-[#d7d7d7]"
                      )}
                      aria-pressed={field.value}
                      aria-label="是否保存"
                    >
                      <span
                        className={cn(
                          "absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow-sm transition-transform",
                          field.value ? "translate-x-6" : "translate-x-0"
                        )}
                      />
                    </button>
                  </div>
                </SharedFieldRow>
              )}
            />
          </SharedFormCard>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mx-auto mt-10 block h-14 w-[68%] rounded-full bg-black text-[22px] font-semibold text-[#e8d4a7] shadow-soft disabled:opacity-70"
          >
            开始排盘
          </button>
        </form>
      </div>

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
    </Shell>
  );
}

function CalendarModePill({
  value,
  onChange
}: {
  value: BaziFormValues["calendar"];
  onChange: (value: BaziFormValues["calendar"]) => void;
}) {
  const options = [
    { label: "公", value: "solar", disabled: false },
    { label: "农", value: "lunar", disabled: true },
    { label: "柱", value: "pillars", disabled: true }
  ] as const;

  return (
    <div className="ml-auto grid h-10 w-[150px] grid-cols-3 rounded-full bg-[#f2f2f0] p-1" aria-label="选择历法">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => {
            if (!option.disabled) {
              onChange(option.value);
            }
          }}
          disabled={option.disabled}
          title={option.disabled ? "即将支持" : undefined}
          className={cn(
            "rounded-full text-[18px] font-semibold leading-none transition-colors",
            option.value === value ? "bg-black text-[#e8d4a7]" : "text-[#8b8985]",
            option.disabled && "cursor-not-allowed text-[#c9c7c0]"
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
  const [quickInputError, setQuickInputError] = useState("");
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
      setQuickInputError("");
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
      setQuickInputError("");
      return;
    }

    setQuickInputError("请输入有效的年月日时分");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65">
      <button className="absolute inset-0 cursor-default" type="button" aria-label="关闭出生时间选择" onClick={onClose} />
      <section className="relative w-full max-w-[430px] rounded-t-[28px] bg-white px-5 pb-8 pt-7 shadow-soft">
        <div className="grid grid-cols-[1fr_48px_86px] items-center gap-4">
          <div className="grid h-12 grid-cols-3 rounded-full bg-[#f4f4f3] p-1">
            {[
              { label: "公历", value: "solar", disabled: false },
              { label: "农历", value: "lunar", disabled: true },
              { label: "四柱", value: "pillars", disabled: true }
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  if (!option.disabled) {
                    onCalendarChange(option.value as BaziFormValues["calendar"]);
                  }
                }}
                disabled={option.disabled}
                title={option.disabled ? "即将支持" : undefined}
                className={cn(
                  "rounded-full text-[18px] font-semibold",
                  calendar === option.value ? "bg-white text-ink shadow-sm" : "text-[#cfcfce]",
                  option.disabled && "cursor-not-allowed opacity-55"
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
            onChange={(event) => {
              setQuickInput(event.target.value.replace(/\D/g, "").slice(0, 12));
              setQuickInputError("");
            }}
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
        {quickInputError ? <p className="mt-2 text-right text-sm font-semibold text-red-600">{quickInputError}</p> : null}

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
            className={cn("relative h-8 w-14 rounded-full transition-colors", daylightSaving ? "bg-black" : "bg-[#e2e2e2]")}
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
    calendar: values.calendar,
    useSolarTime: values.useSolarTime ? "true" : "false"
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
    useSolarTime: toBooleanParam(searchParams.get("useSolarTime")),
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
  return "solar";
}

function toBooleanParam(value: string | null) {
  return value === "1" || value === "true";
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

function parseBirthTimeForValidation(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  const parsed = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5])
  };

  if (
    parsed.month < 1 ||
    parsed.month > 12 ||
    parsed.day < 1 ||
    parsed.day > getDaysInMonth(parsed.year, parsed.month) ||
    parsed.hour < 0 ||
    parsed.hour > 23 ||
    parsed.minute < 0 ||
    parsed.minute > 59
  ) {
    return null;
  }

  const date = new Date(parsed.year, parsed.month - 1, parsed.day, parsed.hour, parsed.minute);

  return {
    ...parsed,
    date
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
