"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CalendarClock, ChevronDown, ChevronRight, Compass, Hash, MessageSquareText, UserRound, Users, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { calculateQimenChart } from "@/lib/qimen";
import { chinaLocationOptions } from "@/lib/locations/china";
import { cn } from "@/lib/utils";
import {
  DivinationProfileCard,
  DivinationTimePickerSheet,
  formatDateTimeLocal as formatSharedDateTimeLocal,
  saveSharedProfile
} from "@/components/shared/divination-profile-card";

const qimenFormSchema = z.object({
  name: z.string().trim().max(20, "姓名不能超过 20 个字").optional(),
  gender: z.enum(["male", "female"]),
  method: z.enum(["time", "question"]),
  divinationType: z.enum(["wealth", "single", "relationship", "promotion", "job", "cooperation", "lawsuit"]),
  dateTime: z.string().min(1, "请选择起局时间"),
  question: z.string().trim().min(1, "请填写求测问题").max(80, "问题不能超过 80 个字"),
  plateType: z.enum(["zhuan", "fei"]),
  juMode: z.enum(["auto", "manual"]),
  manualDunType: z.enum(["yin", "yang"]).optional(),
  manualJu: z.coerce.number().int().min(1, "请选择 1-9 局").max(9, "请选择 1-9 局").optional(),
  province: z.string().min(1, "请选择省份"),
  city: z.string().min(1, "请选择城市"),
  district: z.string().min(1, "请选择区县"),
  save: z.boolean()
}).superRefine((values, context) => {
  if (values.juMode === "manual" && !values.manualJu) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["manualJu"],
      message: "请选择专业局数"
    });
  }

  if (values.juMode === "manual" && !values.manualDunType) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["manualDunType"],
      message: "请选择阴遁或阳遁"
    });
  }
});

type QimenFormValues = z.infer<typeof qimenFormSchema>;

const defaultValues: QimenFormValues = {
  name: "",
  gender: "male",
  method: "time",
  divinationType: "wealth",
  dateTime: "",
  question: "",
  plateType: "zhuan",
  juMode: "auto",
  manualDunType: "yang",
  manualJu: 1,
  province: "北京市",
  city: "北京市",
  district: "东城区",
  save: true
};

const divinationTypeOptions = [
  { label: "财运走势", value: "wealth" },
  { label: "单身姻缘", value: "single" },
  { label: "伴侣感情", value: "relationship" },
  { label: "工作升职", value: "promotion" },
  { label: "工作求职", value: "job" },
  { label: "合作谈判", value: "cooperation" },
  { label: "官司诉讼", value: "lawsuit" }
] as const;

const plateTypeOptions = [
  { label: "转盘", value: "zhuan" }
] as const;

const juOptions = [
  { label: "自动选局", value: "auto" },
  { label: "阴遁一局", value: "yin-1" },
  { label: "阴遁二局", value: "yin-2" },
  { label: "阴遁三局", value: "yin-3" },
  { label: "阴遁四局", value: "yin-4" },
  { label: "阴遁五局", value: "yin-5" },
  { label: "阴遁六局", value: "yin-6" },
  { label: "阴遁七局", value: "yin-7" },
  { label: "阴遁八局", value: "yin-8" },
  { label: "阴遁九局", value: "yin-9" },
  { label: "阳遁一局", value: "yang-1" },
  { label: "阳遁二局", value: "yang-2" },
  { label: "阳遁三局", value: "yang-3" },
  { label: "阳遁四局", value: "yang-4" },
  { label: "阳遁五局", value: "yang-5" },
  { label: "阳遁六局", value: "yang-6" },
  { label: "阳遁七局", value: "yang-7" },
  { label: "阳遁八局", value: "yang-8" },
  { label: "阳遁九局", value: "yang-9" }
] as const;

export function QimenHomeClient({ embedded = false }: { embedded?: boolean } = {}) {
  const Shell = embedded ? "section" : "main";
  const router = useRouter();
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [divinationTypeOpen, setDivinationTypeOpen] = useState(false);
  const [juPickerOpen, setJuPickerOpen] = useState(false);
  const {
    control,
    register,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<QimenFormValues>({
    resolver: zodResolver(qimenFormSchema),
    defaultValues
  });
  const divinationType = useWatch({ control, name: "divinationType" });
  const dateTime = useWatch({ control, name: "dateTime" });
  const plateType = useWatch({ control, name: "plateType" });
  const juMode = useWatch({ control, name: "juMode" });
  const manualDunType = useWatch({ control, name: "manualDunType" });
  const manualJu = useWatch({ control, name: "manualJu" });
  const province = useWatch({ control, name: "province" });
  const city = useWatch({ control, name: "city" });
  const district = useWatch({ control, name: "district" });
  const cities = getCities(province);
  const districts = getDistricts(province, city);

  useEffect(() => {
    const currentDateTime = formatSharedDateTimeLocal(new Date());
    setValue("dateTime", currentDateTime);
    // Run once after hydration so server and client do not render different minutes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  async function onSubmit(values: QimenFormValues) {
    const location = formatLocation(values);
    const nextChart = calculateQimenChart({
      dateTime: values.dateTime,
      location,
      method: values.method,
      question: values.question,
      plateType: values.plateType,
      manualDunType: values.juMode === "manual" ? values.manualDunType : undefined,
      manualJu: values.juMode === "manual" ? values.manualJu : undefined
    });
    const payload = {
      input: { ...values, location, question: values.question.trim() },
      chart: nextChart,
      savedAt: new Date().toISOString()
    };

    window.localStorage.setItem("sm1:current-qimen-result", JSON.stringify(payload));

    if (values.save) {
      window.localStorage.setItem("sm1:last-qimen-input", JSON.stringify(payload));
      await saveSharedProfile({
        source: "奇门档案",
        name: values.name?.trim() ?? "",
        gender: values.gender,
        dateTime: values.dateTime,
        location
      });
    }

    router.push("/qimen/result");
  }

  return (
    <Shell className={cn("light-surface-text-scope app-responsive-shell text-ink", embedded ? "bg-transparent pb-0 shadow-none" : "min-h-screen bg-[#F8F7EE] pb-8 shadow-soft")}>
      {!embedded ? <header className="mx-auto w-full max-w-[430px] px-5 pb-2 pt-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="-ml-2 flex h-10 w-10 items-center justify-center" aria-label="返回首页">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-[24px] font-semibold">奇门遁甲</h1>
          <span className="h-10 w-10" />
        </div>
      </header> : null}

      <div className={cn("mx-auto w-full max-w-[430px] space-y-4", embedded ? "px-0 pt-0" : "px-4 pt-4")}>
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
                dateTime={dateTime}
                dateTimeError={errors.dateTime?.message}
                onOpenTimePicker={() => setTimePickerOpen(true)}
                onApplyProfile={(profile) => {
                  setValue("name", profile.name, { shouldDirty: true, shouldValidate: true });
                  setValue("gender", profile.gender, { shouldDirty: true, shouldValidate: true });
                  setValue("dateTime", profile.dateTime, { shouldDirty: true, shouldValidate: true });
                }}
              />
            )}
          />

          <FormCard>
            <Controller
              name="divinationType"
              control={control}
              render={({ field }) => (
                <FieldRow icon={Compass} label="求测类型" error={errors.divinationType?.message}>
                  <button
                    type="button"
                    onClick={() => setDivinationTypeOpen(true)}
                    className="flex w-full min-w-0 items-center justify-end gap-1 text-right text-[18px] font-semibold text-[#aaa8a1]"
                    aria-label="选择求测类型"
                  >
                    {getOptionLabel(divinationTypeOptions, field.value)}
                    <ChevronDown size={20} strokeWidth={2.5} className="shrink-0 text-[#302f2c]" />
                  </button>
                </FieldRow>
              )}
            />

            <FieldRow icon={MessageSquareText} label="求测问题" error={errors.question?.message} last>
              <input
                {...register("question")}
                className="w-full bg-transparent text-right text-[18px] font-semibold text-ink outline-none placeholder:text-[#bdbbb5]"
                placeholder="请一句话描述你的问题"
              />
            </FieldRow>
          </FormCard>

          <FormCard>
            <Controller
              name="plateType"
              control={control}
              render={({ field }) => (
                <FieldRow icon={Compass} label="奇门类型">
                  <SegmentedText
                    value={field.value}
                    onChange={field.onChange}
                    options={plateTypeOptions}
                    ariaLabel="选择奇门类型"
                  />
                </FieldRow>
              )}
            />

            <FieldRow icon={Hash} label="局数" error={errors.manualJu?.message || errors.manualDunType?.message} last>
              <button
                type="button"
                onClick={() => setJuPickerOpen(true)}
                className="flex w-full min-w-0 items-center justify-end gap-1 text-right text-[18px] font-semibold text-[#55514a]"
                aria-label="选择局数"
              >
                {formatJuLabel(juMode, manualDunType, manualJu)}
                <ChevronRight size={18} strokeWidth={2.4} className="shrink-0 text-[#bfbfbf]" />
              </button>
            </FieldRow>
          </FormCard>

          <div className="hidden">
            <select {...register("province")} aria-label="省份">
              {chinaLocationOptions.map((item) => (
                <option key={item.province} value={item.province}>
                  {item.province}
                </option>
              ))}
            </select>
            <select {...register("city")} aria-label="城市">
              {cities.map((item) => (
                <option key={item.city} value={item.city}>
                  {item.city}
                </option>
              ))}
            </select>
            <select {...register("district")} aria-label="区县">
              {districts.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <Controller name="method" control={control} render={({ field }) => <input type="hidden" value={field.value} readOnly />} />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mx-auto block h-14 w-[68%] rounded-full bg-black text-[22px] font-semibold text-[#e8d4a7] shadow-soft disabled:opacity-70"
          >
            开始排盘
          </button>
        </form>
      </div>
      <DivinationTimePickerSheet
        open={timePickerOpen}
        value={dateTime}
        onClose={() => setTimePickerOpen(false)}
        onConfirm={(nextValue) => {
          setValue("dateTime", nextValue, { shouldDirty: true, shouldValidate: true });
          setTimePickerOpen(false);
        }}
      />
      <OptionSheet
        open={divinationTypeOpen}
        title="选择求测类型"
        options={divinationTypeOptions}
        value={divinationType}
        onClose={() => setDivinationTypeOpen(false)}
        onSelect={(value) => {
          setValue("divinationType", value, { shouldDirty: true, shouldValidate: true });
          setDivinationTypeOpen(false);
        }}
      />
      <OptionSheet
        open={juPickerOpen}
        title="选择局数"
        options={juOptions}
        value={juMode === "manual" ? `${manualDunType ?? "yang"}-${manualJu ?? 1}` : "auto"}
        onClose={() => setJuPickerOpen(false)}
        onSelect={(value) => {
          if (value === "auto") {
            setValue("juMode", "auto", { shouldDirty: true, shouldValidate: true });
          } else {
            const [nextDunType, nextJuText] = value.split("-");
            const nextJu = Number(nextJuText);
            setValue("juMode", "manual", { shouldDirty: true, shouldValidate: true });
            setValue("manualDunType", nextDunType === "yin" ? "yin" : "yang", { shouldDirty: true, shouldValidate: true });
            setValue("manualJu", nextJu, { shouldDirty: true, shouldValidate: true });
          }
          setJuPickerOpen(false);
        }}
      />
    </Shell>
  );
}

function FormCard({ children }: { children: React.ReactNode }) {
  return <section className="rounded-[22px] bg-white px-4 shadow-soft">{children}</section>;
}

function FieldRow({
  icon: Icon,
  label,
  error,
  last,
  children
}: {
  icon: typeof CalendarClock;
  label: string;
  error?: string;
  last?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("py-4", !last && "border-b border-[#ebe7dd]")}>
      <div className="grid grid-cols-[112px_1fr] items-center gap-2">
        <label className="flex items-center gap-2 text-[18px] font-semibold text-ink">
          <Icon size={19} className="text-[#a58024]" />
          {label}
        </label>
        {children}
      </div>
      {error ? <p className="mt-2 text-right text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

function SegmentedPill<TValue extends string>({
  value,
  onChange,
  options,
  ariaLabel
}: {
  value: TValue;
  onChange: (value: TValue) => void;
  options: ReadonlyArray<{ label: string; value: TValue }>;
  ariaLabel: string;
}) {
  return (
    <div className="ml-auto grid h-10 w-[104px] grid-cols-2 rounded-full bg-[#f2f2f0] p-1" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-full text-[19px] font-semibold leading-none transition-colors",
            option.value === value ? "bg-black text-[#e8d4a7]" : "text-[#8b8985]"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function SegmentedText<TValue extends string>({
  value,
  onChange,
  options,
  ariaLabel
}: {
  value: TValue;
  onChange: (value: TValue) => void;
  options: ReadonlyArray<{ label: string; value: TValue }>;
  ariaLabel: string;
}) {
  return (
    <div className="ml-auto flex min-w-0 items-center justify-end gap-5" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "text-[18px] font-semibold transition-colors",
            option.value === value ? "text-ink" : "text-[#aaa8a1]"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function OptionSheet<TValue extends string>({
  open,
  title,
  options,
  value,
  onClose,
  onSelect
}: {
  open: boolean;
  title: string;
  options: ReadonlyArray<{ label: string; value: TValue }>;
  value: TValue;
  onClose: () => void;
  onSelect: (value: TValue) => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-8">
      <button className="absolute inset-0 cursor-default" type="button" aria-label="关闭选择弹窗" onClick={onClose} />
      <section className="relative w-full max-w-[340px] rounded-2xl bg-[#fffef7] px-6 pb-6 pt-5 shadow-soft">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center text-[#5d5a55]" aria-label="关闭">
          <X size={28} strokeWidth={2.2} />
        </button>
        <h2 className="mt-8 text-center text-[25px] font-semibold">{title}</h2>
        <div className="mt-6 grid max-h-[56vh] grid-cols-2 gap-4 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value)}
              className={cn(
                "min-h-12 rounded-lg border-2 px-2 text-[18px] font-semibold leading-tight",
                option.value === value ? "border-black bg-black text-[#e8d4a7]" : "border-[#d8c8a6] text-[#6f5a25]"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function getOptionLabel<TValue extends string>(options: ReadonlyArray<{ label: string; value: TValue }>, value: TValue) {
  return options.find((option) => option.value === value)?.label ?? "请选择";
}

function formatJuLabel(
  mode: QimenFormValues["juMode"],
  manualDunType: QimenFormValues["manualDunType"],
  manualJu: QimenFormValues["manualJu"]
) {
  if (mode === "auto") {
    return "自动选局";
  }

  return `${manualDunType === "yin" ? "阴遁" : "阳遁"}${manualJu ?? 1}局`;
}

function formatDateTimeLocal(date: Date) {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

function formatDisplayDateTime(value: string) {
  if (!value) {
    return "未选择时间";
  }
  return value.replace("T", " ");
}

function formatPickerLabel(value: string) {
  return formatDisplayDateTime(value).replaceAll("-", "/");
}

function getCities(province: string) {
  return chinaLocationOptions.find((item) => item.province === province)?.cities ?? chinaLocationOptions[0].cities;
}

function getDistricts(province: string, city: string) {
  return getCities(province).find((item) => item.city === city)?.districts ?? getCities(province)[0]?.districts ?? [];
}

function formatLocation(values: Pick<QimenFormValues, "province" | "city" | "district">) {
  return `${values.province} ${values.city} ${values.district}`;
}

type TimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

function QimenTimePickerSheet({
  open,
  value,
  onClose,
  onConfirm
}: {
  open: boolean;
  value: string;
  onClose: () => void;
  onConfirm: (value: string) => void;
}) {
  const [draft, setDraft] = useState(() => parseDateTime(value));
  const [quickInput, setQuickInput] = useState("");
  const years = useMemo(() => buildNumberRange(1920, 2050), []);
  const months = useMemo(() => buildNumberRange(1, 12), []);
  const hours = useMemo(() => buildNumberRange(0, 23), []);
  const minutes = useMemo(() => buildNumberRange(0, 59), []);
  const days = useMemo(() => buildNumberRange(1, getDaysInMonth(draft.year, draft.month)), [draft.month, draft.year]);

  useEffect(() => {
    if (open) {
      setDraft(parseDateTime(value));
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

  const updateDraft = (key: keyof TimeParts, nextValue: number) => {
    setDraft((current) => ({ ...current, [key]: nextValue }));
  };
  const applyQuickInput = () => {
    const parsed = parseCompactDateTime(quickInput);
    if (parsed) {
      setDraft(parsed);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65">
      <button className="absolute inset-0 cursor-default" type="button" aria-label="关闭起局时间选择" onClick={onClose} />
      <section className="relative w-full max-w-[430px] rounded-t-[28px] bg-white px-5 pb-8 pt-7 shadow-soft">
        <div className="grid grid-cols-[1fr_48px_86px] items-center gap-4">
          <div className="grid h-12 grid-cols-1 rounded-full bg-[#f4f4f3] p-1">
            <span className="flex items-center justify-center rounded-full bg-white text-[18px] font-semibold text-ink shadow-sm">公历</span>
          </div>
          <button
            type="button"
            onClick={() => setDraft(parseDateTime(formatDateTimeLocal(new Date())))}
            className="h-12 rounded-full bg-[#f4f4f3] text-[18px] font-semibold"
          >
            今
          </button>
          <button
            type="button"
            onClick={() => onConfirm(toDateTimeValue(draft))}
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
            placeholder="输入年月日时分，如202605050833"
            className="min-w-0 bg-transparent px-4 text-[15px] font-semibold outline-none placeholder:text-[#cfcfce]"
            aria-label="快速输入起局年月日时分"
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
      container.scrollTo({ top, behavior: "smooth" });
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

    container.scrollTo({ top: nextIndex * PICKER_ITEM_HEIGHT, behavior: "smooth" });

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
      {values.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onSelect(item)}
          className={cn(
            "flex h-12 w-full snap-center items-center justify-center text-center text-[20px] font-semibold transition-colors",
            item === selected ? "text-[26px] text-black" : "text-[#d1d1d1]"
          )}
        >
          {padValue ? pad(item) : item}
        </button>
      ))}
    </div>
  );
}

function parseDateTime(value: string): TimeParts {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) {
    return {
      year: 2026,
      month: 5,
      day: 5,
      hour: 8,
      minute: 0
    };
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5])
  };
}

function toDateTimeValue(value: TimeParts) {
  return `${value.year}-${pad(value.month)}-${pad(value.day)}T${pad(value.hour)}:${pad(value.minute)}`;
}

function parseCompactDateTime(value: string) {
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
