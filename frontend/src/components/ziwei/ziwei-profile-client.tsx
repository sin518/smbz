"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarClock, ChevronDown, ChevronRight, MapPin, Save, Stars } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import {
  DivinationProfileCard,
  DivinationTimePickerSheet,
  SharedFieldRow,
  SharedFormCard,
  formatDateTimeLocal,
  formatPickerLabel,
  saveSharedProfile
} from "@/components/shared/divination-profile-card";
import {
  DivinationFormBody,
  DivinationFormShell,
  DivinationSectionHeader,
  DivinationSubmitBar,
  divinationFormCardClass
} from "@/components/shared/divination-form-shell";
import { BaziLocationPickerSheet } from "@/components/bazi/bazi-location-picker-sheet";
import { chinaLocationOptions } from "@/lib/locations/china";
import { cn } from "@/lib/utils";

const ziweiProfileSchema = z.object({
  name: z.string().trim().max(20, "姓名不能超过 20 个字").optional(),
  gender: z.enum(["male", "female"]),
  birthTime: z.string().min(1, "请选择出生时间"),
  province: z.string().min(1, "请选择省份"),
  city: z.string().min(1, "请选择城市"),
  district: z.string().min(1, "请选择区县"),
  save: z.boolean()
});

type ZiweiProfileValues = z.infer<typeof ziweiProfileSchema>;

const defaultValues: ZiweiProfileValues = {
  name: "",
  gender: "male",
  birthTime: "",
  province: "北京市",
  city: "北京市",
  district: "东城区",
  save: true
};

export function ZiweiProfileClient() {
  const router = useRouter();
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const {
    control,
    register,
    setValue,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ZiweiProfileValues>({
    resolver: zodResolver(ziweiProfileSchema),
    defaultValues
  });
  const birthTime = useWatch({ control, name: "birthTime" });
  const province = useWatch({ control, name: "province" });
  const city = useWatch({ control, name: "city" });
  const district = useWatch({ control, name: "district" });
  const cities = getCities(province);
  const districts = getDistricts(province, city);

  useEffect(() => {
    reset(getSavedDefaults());
  }, [reset]);

  useEffect(() => {
    if (!birthTime) {
      setValue("birthTime", formatDateTimeLocal(new Date()));
    }
  }, [birthTime, setValue]);

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

  async function onSubmit(values: ZiweiProfileValues) {
    const location = formatLocation(values);
    const payload = {
      ...values,
      name: values.name?.trim() ?? "",
      location,
      savedAt: new Date().toISOString()
    };

    window.localStorage.setItem("sm1:current-ziwei-profile", JSON.stringify(payload));

    if (values.save) {
      window.localStorage.setItem("sm1:last-ziwei-profile", JSON.stringify(payload));
      await saveSharedProfile({
        source: "紫薇档案",
        name: values.name?.trim() ?? "",
        gender: values.gender,
        dateTime: values.birthTime,
        location
      });
    }

    router.push("/ziwei");
  }

  return (
    <DivinationFormShell title="紫薇斗数" subtitle="命盘结构，洞察格局" icon={Stars} moduleMark="ziwei" tone="gold">
      <DivinationFormBody>
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
                  onOpenTimePicker={() => setTimePickerOpen(true)}
                  showDateTime={false}
                  cardClassName={divinationFormCardClass}
                  header={<DivinationSectionHeader title="基本信息" description="用于命盘称呼与阴阳顺逆推演" tone="gold" />}
                  onApplyProfile={(profile) => {
                    setValue("name", profile.name, { shouldDirty: true, shouldValidate: true });
                    setValue("gender", profile.gender, { shouldDirty: true, shouldValidate: true });
                    setValue("birthTime", profile.dateTime, { shouldDirty: true, shouldValidate: true });
                  }}
                />
              )}
            />

            <SharedFormCard className={divinationFormCardClass}>
              <DivinationSectionHeader title="出生与排盘" description="确认出生资料及排盘记录设置" tone="gold" />
              <SharedFieldRow icon={CalendarClock} label="出生时间" error={errors.birthTime?.message}>
                <button
                  type="button"
                  onClick={() => setTimePickerOpen(true)}
                  className="flex w-full min-w-0 items-center justify-end gap-1 text-right text-[17px] font-semibold text-[#55514a]"
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

              <SharedFieldRow icon={Stars} label="排盘流派">
                <span className="block text-right text-[18px] font-semibold text-[#55514a]">三合紫薇</span>
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
                          "relative h-8 w-14 overflow-hidden rounded-full border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a58024]",
                          field.value ? "border-black bg-black" : "border-[#d8d3c8] bg-[#e5e1d8]"
                        )}
                        aria-pressed={field.value}
                        aria-label="是否保存"
                      >
                        <span className={cn("absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow-sm transition-transform", field.value ? "translate-x-6" : "translate-x-0")} />
                      </button>
                    </div>
                  </SharedFieldRow>
                )}
              />
            </SharedFormCard>
          </div>

          <DivinationSubmitBar label="开始排盘" busyLabel="排盘中" isBusy={isSubmitting} icon={Stars} />
        </form>
      </DivinationFormBody>

      <DivinationTimePickerSheet
        open={timePickerOpen}
        value={birthTime}
        onClose={() => setTimePickerOpen(false)}
        onConfirm={(nextValue) => {
          setValue("birthTime", nextValue, { shouldDirty: true, shouldValidate: true });
          setTimePickerOpen(false);
        }}
        ariaLabel="关闭出生时间选择"
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

function getSavedDefaults(): ZiweiProfileValues {
  if (typeof window === "undefined") {
    return defaultValues;
  }

  const raw = window.localStorage.getItem("sm1:last-ziwei-profile") ?? window.localStorage.getItem("sm1:current-ziwei-profile");
  if (!raw) {
    return defaultValues;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ZiweiProfileValues>;
    return {
      ...defaultValues,
      ...parsed,
      name: parsed.name ?? "",
      save: parsed.save ?? true
    };
  } catch {
    return defaultValues;
  }
}

function getCities(province: string) {
  return chinaLocationOptions.find((item) => item.province === province)?.cities ?? chinaLocationOptions[0].cities;
}

function getDistricts(province: string, city: string) {
  return getCities(province).find((item) => item.city === city)?.districts ?? getCities(province)[0]?.districts ?? [];
}

function formatLocation(values: Pick<ZiweiProfileValues, "province" | "city" | "district">) {
  return `${values.province} ${values.city} ${values.district}`;
}
