"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Clock3, MapPin } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { ReadonlyURLSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import {
  DivinationProfileCard,
  DivinationTimePickerSheet,
  SharedFieldRow,
  SharedFormCard,
  saveSharedProfile
} from "@/components/shared/divination-profile-card";
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
  const Shell = embedded ? "section" : "main";
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialValues = useMemo(() => getInitialFormValues(searchParams), [searchParams]);
  const [birthPickerOpen, setBirthPickerOpen] = useState(false);
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
    const chartJson = calculateBaziChart(calculationInput);

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
    <Shell
      className={cn(
        "light-surface-text-scope app-responsive-shell bg-[#F8F7EE] text-ink",
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
            <SharedFieldRow icon={Clock3} label="校正时间" last>
              <span className={cn("block text-right text-[16px] font-semibold", useSolarTime ? "text-[#55514a]" : "text-[#aaa8a1]")}>
                {useSolarTime ? solarTimeText : "未启用"}
              </span>
            </SharedFieldRow>
          </SharedFormCard>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mx-auto mt-10 block h-14 w-[68%] rounded-full bg-black text-[22px] font-semibold text-[#e8d4a7] shadow-soft disabled:opacity-70"
          >
            {isSubmitting ? "排盘中" : "开始排盘"}
          </button>
        </form>
      </div>

      <DivinationTimePickerSheet
        open={birthPickerOpen}
        value={birthTime}
        ariaLabel="关闭出生时间选择"
        onClose={() => setBirthPickerOpen(false)}
        onConfirm={(nextValue) => {
          setValue("birthTime", nextValue, { shouldDirty: true, shouldValidate: true });
          setBirthPickerOpen(false);
        }}
      />
    </Shell>
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
  return "solar";
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
