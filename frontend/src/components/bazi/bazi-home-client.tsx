"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarClock, ChevronDown, ChevronRight, Clock3, MapPin, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ReadonlyURLSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import {
  DivinationProfileCard,
  SharedFieldRow,
  SharedFormCard,
  saveSharedProfile
} from "@/components/shared/divination-profile-card";
import {
  DivinationFormBody,
  DivinationFormShell,
  DivinationSectionHeader,
  DivinationSubmitBar,
  divinationFormCardClass
} from "@/components/shared/divination-form-shell";
import { BaziBirthTimePickerSheet } from "@/components/bazi/bazi-birth-time-picker-sheet";
import { BaziLocationPickerSheet } from "@/components/bazi/bazi-location-picker-sheet";
import { calculateBaziChart, type BaziCalculationRequest } from "@/lib/bazi/api";
import type { DemoBaziChart } from "@/lib/bazi/demo";
import { saveLocalBaziRecord, scheduleBaziRecordAutoSync } from "@/lib/bazi/local-records";
import { calculateLongitudeSolarTime } from "@/lib/bazi/solarTime";
import { chinaLocationOptions } from "@/lib/locations/china";
import { getChinaLocationCoordinate, type LocationCoordinate } from "@/lib/locations/coordinates";
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
  useSolarTime: z.boolean()
});

type BaziFormValues = z.infer<typeof baziFormSchema>;
type LocationLookupState = "idle" | "loading" | "ready" | "fallback" | "error";

const defaultValues: BaziFormValues = {
  name: "",
  gender: "male",
  calendar: "solar",
  birthTime: "",
  province: "北京市",
  city: "北京市",
  district: "东城区",
  useSolarTime: false
};

export function BaziHomeClient({ embedded = false, backHref = "/" }: { embedded?: boolean; backHref?: string } = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialValues = useMemo(() => getInitialFormValues(searchParams), [searchParams]);
  const [birthPickerOpen, setBirthPickerOpen] = useState(false);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [remoteLocationMeta, setRemoteLocationMeta] = useState<LocationCoordinate | null>(null);
  const [locationLookupState, setLocationLookupState] = useState<LocationLookupState>("idle");
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
  const localLocationMeta = useMemo(() => getLocationMeta(province, city, district), [city, district, province]);
  const locationMeta = remoteLocationMeta ?? localLocationMeta;
  const solarTimeCorrection = locationMeta ? calculateLongitudeSolarTime(birthTime, locationMeta.longitude) : null;
  const solarTimeText = formatSolarTimeText({
    birthTime,
    correction: solarTimeCorrection,
    lookupState: locationLookupState
  });
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

  useEffect(() => {
    const controller = new AbortController();
    setRemoteLocationMeta(null);

    if (!province || !city || !district) {
      setLocationLookupState("idle");
      return () => controller.abort();
    }

    setLocationLookupState(localLocationMeta?.precision === "district" ? "ready" : "loading");

    fetchLocationCoordinate({ province, city, district, signal: controller.signal })
      .then((coordinate) => {
        if (coordinate) {
          setRemoteLocationMeta(coordinate);
          setLocationLookupState("ready");
          return;
        }

        setLocationLookupState(localLocationMeta ? "fallback" : "error");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setLocationLookupState(localLocationMeta ? "fallback" : "error");
      });

    return () => controller.abort();
  }, [city, district, localLocationMeta, province]);

  async function onSubmit(values: BaziFormValues) {
    const selectedLocation = formatLocation(values);
    const selectedLocationMeta = await resolveLocationMeta(values);
    const calculationInput = {
      name: values.name?.trim(),
      gender: values.gender,
      birthTime: values.birthTime,
      location: selectedLocation,
      calendar: values.calendar,
      useSolarTime: values.useSolarTime,
      longitude: selectedLocationMeta?.longitude,
      latitude: selectedLocationMeta?.latitude
    };
    const chartJson = calculateBaziChart({
      ...calculationInput,
      calendar: values.calendar === "pillars" ? "solar" : values.calendar
    });

    window.localStorage.setItem(
      "sm1:last-bazi-input",
      JSON.stringify({
        ...values,
        location: selectedLocation,
        longitude: selectedLocationMeta?.longitude,
        latitude: selectedLocationMeta?.latitude,
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
      longitude: selectedLocationMeta?.longitude,
      latitude: selectedLocationMeta?.latitude,
      useSolarTime: values.useSolarTime,
      chartJson
    });
    scheduleBaziRecordAutoSync();
    router.push(`/bazi/local/${localRecord.id}`);
  }

  return (
    <DivinationFormShell title="赛博八字" subtitle="推演你的命理图谱" icon={Sparkles} tone="red" embedded={embedded} backHref={backHref}>
      <DivinationFormBody embedded={embedded}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
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
                  showDateTime={false}
                  cardClassName={divinationFormCardClass}
                  header={<DivinationSectionHeader title="基本信息" description="用于命盘称呼与阴阳顺逆推演" tone="red" />}
                  onApplyProfile={(profile) => {
                    setValue("name", profile.name, { shouldDirty: true, shouldValidate: true });
                    setValue("gender", profile.gender, { shouldDirty: true, shouldValidate: true });
                    setValue("birthTime", profile.dateTime, { shouldDirty: true, shouldValidate: true });
                  }}
                />
              )}
            />

            <SharedFormCard className={divinationFormCardClass}>
              <DivinationSectionHeader title="出生信息" description="请填写准确的出生时间与地点" tone="red" />
              <SharedFieldRow icon={CalendarClock} label="出生时间" error={errors.birthTime?.message}>
                <button
                  type="button"
                  onClick={() => setBirthPickerOpen(true)}
                  className={cn(
                    "flex w-full min-w-0 items-center justify-end gap-1 text-right text-[17px] font-semibold",
                    birthTime ? "text-[#55514a]" : "text-[#aaa8a1]"
                  )}
                  aria-label="选择出生时间"
                >
                  <span className="truncate">{birthTime ? formatPickerLabel(birthTime) : "请选择"}</span>
                  <ChevronDown size={19} strokeWidth={2.4} className="shrink-0 text-[#77736b]" />
                </button>
              </SharedFieldRow>
              <SharedFieldRow icon={MapPin} label="出生地点" error={errors.province?.message || errors.city?.message || errors.district?.message}>
                <button type="button" onClick={() => setLocationPickerOpen(true)} className="flex min-w-0 items-center justify-end gap-1.5 text-right text-[17px] font-semibold text-[#55514a]" aria-label="选择出生地点">
                  <span className="truncate">{province} · {city} · {district}</span>
                  <ChevronRight size={19} className="shrink-0 text-[#8b8985]" />
                </button>
              </SharedFieldRow>

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
                          "relative h-8 w-14 overflow-hidden rounded-full border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a58024]",
                          field.value ? "border-black bg-black" : "border-[#d8d3c8] bg-[#e5e1d8]"
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
              <SharedFieldRow icon={Clock3} label="校正时间" last>
                <span className={cn("block text-right text-[16px] font-semibold", useSolarTime ? "text-[#55514a]" : "text-[#aaa8a1]")}>
                  {useSolarTime ? solarTimeText : "未启用"}
                </span>
              </SharedFieldRow>
            </SharedFormCard>
          </div>

          <DivinationSubmitBar label="开始排盘" busyLabel="排盘中" isBusy={isSubmitting} embedded={embedded} />
        </form>
      </DivinationFormBody>

      <BaziBirthTimePickerSheet
        open={birthPickerOpen}
        value={birthTime}
        calendar={calendar === "pillars" ? "pillars" : "solar"}
        onClose={() => setBirthPickerOpen(false)}
        onConfirm={(nextValue, nextCalendar) => {
          setValue("birthTime", nextValue, { shouldDirty: true, shouldValidate: true });
          setValue("calendar", nextCalendar, { shouldDirty: true, shouldValidate: true });
          setBirthPickerOpen(false);
        }}
      />
      <BaziLocationPickerSheet
        open={locationPickerOpen}
        value={{ province, city, district }}
        onClose={() => setLocationPickerOpen(false)}
        onConfirm={(nextLocation) => {
          setValue("province", nextLocation.province, { shouldDirty: true, shouldValidate: true });
          setValue("city", nextLocation.city, { shouldDirty: true, shouldValidate: true });
          setValue("district", nextLocation.district, { shouldDirty: true, shouldValidate: true });
          setLocationPickerOpen(false);
        }}
      />
    </DivinationFormShell>
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

function getLocationMeta(province: string, city: string, district: string) {
  return getChinaLocationCoordinate(province, city, district);
}

async function resolveLocationMeta(values: Pick<BaziFormValues, "province" | "city" | "district">) {
  const remoteCoordinate = await fetchLocationCoordinate({
    province: values.province,
    city: values.city,
    district: values.district
  });

  return remoteCoordinate ?? getLocationMeta(values.province, values.city, values.district);
}

async function fetchLocationCoordinate({
  province,
  city,
  district,
  signal
}: {
  province: string;
  city: string;
  district: string;
  signal?: AbortSignal;
}): Promise<LocationCoordinate | null> {
  const params = new URLSearchParams({ province, city, district });
  const response = await fetch(`/api/locations/geocode?${params.toString()}`, {
    method: "GET",
    signal
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as Partial<LocationCoordinate>;

  if (typeof data.latitude !== "number" || typeof data.longitude !== "number") {
    return null;
  }

  return {
    latitude: data.latitude,
    longitude: data.longitude,
    precision: data.precision === "district" ? "district" : "city"
  };
}

function formatSolarTimeCorrection(correctedBirthTime: string, offsetMinutes: number) {
  const prefix = offsetMinutes > 0 ? "+" : "";

  return `${formatBirthTime(correctedBirthTime)} (${prefix}${offsetMinutes}分)`;
}

function formatSolarTimeText({
  birthTime,
  correction,
  lookupState
}: {
  birthTime: string;
  correction: ReturnType<typeof calculateLongitudeSolarTime>;
  lookupState: LocationLookupState;
}) {
  if (!birthTime) {
    return lookupState === "loading" ? "定位中" : "请选择出生时间";
  }

  if (correction) {
    return formatSolarTimeCorrection(correction.correctedBirthTime, correction.offsetMinutes);
  }

  if (lookupState === "loading") {
    return "正在定位经纬度";
  }

  if (lookupState === "fallback") {
    return "定位失败，暂按本地城市坐标";
  }

  return "缺少经纬度，暂按北京时间";
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
  return value === "pillars" ? "pillars" : value === "lunar" ? "lunar" : "solar";
}

function toBooleanParam(value: string | null) {
  return value === "1" || value === "true";
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

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}
