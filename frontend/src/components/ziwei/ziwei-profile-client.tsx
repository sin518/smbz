"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, MapPin, Save, Stars } from "lucide-react";
import Link from "next/link";
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
  saveSharedProfile
} from "@/components/shared/divination-profile-card";
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
  birthTime: "1980-09-07T07:40",
  province: "北京市",
  city: "北京市",
  district: "东城区",
  save: true
};

export function ZiweiProfileClient() {
  const router = useRouter();
  const [timePickerOpen, setTimePickerOpen] = useState(false);
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
    <main className="light-surface-text-scope mx-auto min-h-screen max-w-[430px] bg-[#F8F7EE] pb-8 text-ink shadow-soft">
      <header className="px-5 pb-2 pt-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="-ml-2 flex h-10 w-10 items-center justify-center" aria-label="返回首页">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-[24px] font-semibold">紫薇斗数</h1>
          <span className="h-10 w-10" />
        </div>
      </header>

      <div className="space-y-4 px-4 pt-4">
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
                onOpenTimePicker={() => setTimePickerOpen(true)}
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
                      className={cn("relative h-8 w-14 overflow-hidden rounded-full transition-colors", field.value ? "bg-black" : "bg-[#d7d7d7]")}
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="mx-auto mt-10 block h-14 w-[68%] rounded-full bg-black text-[22px] font-semibold text-[#e8d4a7] shadow-soft disabled:opacity-70"
          >
            开始排盘
          </button>
        </form>
      </div>

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
    </main>
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
