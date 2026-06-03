"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CalendarClock, ChevronDown, Compass } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { calculateQimenChart } from "@/lib/qimen-api";
import { cn } from "@/lib/utils";
import {
  DivinationTimePickerSheet,
  SharedFieldRow,
  SharedFormCard,
  formatDateTimeLocal
} from "@/components/shared/divination-profile-card";

const qimenFormSchema = z.object({
  dateTime: z.string().min(1, "请选择起卦时间"),
  question: z.string().trim().max(80, "占事不能超过 80 个字"),
  plateType: z.literal("zhuan"),
  juMethod: z.enum(["chaibu", "maoshan"]),
  zhiFuJiGong: z.enum(["ji_liuyi", "ji_wugong"])
});

type QimenFormValues = z.infer<typeof qimenFormSchema>;

const defaultValues: QimenFormValues = {
  dateTime: "",
  question: "",
  plateType: "zhuan",
  juMethod: "chaibu",
  zhiFuJiGong: "ji_liuyi"
};

const plateTypeOptions = [
  { label: "转盘", value: "zhuan" }
] as const;

const juMethodOptions = [
  { label: "拆补法", value: "chaibu" },
  { label: "茅山法", value: "maoshan" }
] as const;

const zhiFuJiGongOptions = [
  { label: "寄六仪", value: "ji_liuyi" },
  { label: "寄戊宫", value: "ji_wugong" }
] as const;

export function QimenHomeClient({ embedded = false }: { embedded?: boolean } = {}) {
  const Shell = embedded ? "section" : "main";
  const router = useRouter();
  const [timePickerOpen, setTimePickerOpen] = useState(false);
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
  const dateTime = useWatch({ control, name: "dateTime" });

  useEffect(() => {
    const currentDateTime = formatDateTimeLocal(new Date());
    setValue("dateTime", currentDateTime);
    // Run once after hydration so server and client do not render different minutes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(values: QimenFormValues) {
    const dateParts = parseDateTimeLocal(values.dateTime);
    const nextChart = await calculateQimenChart({
      ...dateParts,
      timezone: "Asia/Shanghai",
      question: values.question.trim(),
      panType: values.plateType,
      juMethod: values.juMethod,
      zhiFuJiGong: values.zhiFuJiGong
    });
    const payload = {
      input: { ...values, question: values.question.trim() },
      chart: nextChart,
      savedAt: new Date().toISOString()
    };

    window.localStorage.setItem("sm1:current-qimen-result", JSON.stringify(payload));
    window.localStorage.setItem("sm1:last-qimen-input", JSON.stringify(payload));

    router.push("/qimen/result");
  }

  return (
    <Shell className={cn("light-surface-text-scope app-responsive-shell text-ink", embedded ? "bg-transparent pb-0 shadow-none" : "min-h-screen bg-[#F8F7EE] pb-8 shadow-soft")}>
      {!embedded ? <header className="px-5 pb-2 pt-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="-ml-2 flex h-10 w-10 items-center justify-center" aria-label="返回首页">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-[24px] font-semibold">奇门遁甲</h1>
          <span className="h-10 w-10" />
        </div>
      </header> : null}

      <div className={cn("space-y-4", embedded ? "px-0 pt-0" : "px-4 pt-4")}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <section className="pt-1">
            <label htmlFor="qimen-question" className="block text-center text-[15px] font-semibold text-[#8b8985]">
              占事（选填）
            </label>
            <textarea
              {...register("question")}
              id="qimen-question"
              rows={2}
              className="mt-3 min-h-[62px] w-full resize-none rounded-lg border border-[#d8c8a6] bg-transparent px-4 py-3 text-center text-[17px] font-semibold text-ink outline-none placeholder:text-[#8b8985]"
              placeholder="例如：此次合作能否成功？"
            />
            {errors.question?.message ? <p className="mt-2 text-right text-sm text-red-600">{errors.question.message}</p> : null}
          </section>

          <SharedFormCard>
            <SharedFieldRow icon={CalendarClock} label="起卦时间" error={errors.dateTime?.message} last>
              <button
                type="button"
                onClick={() => setTimePickerOpen(true)}
                className="flex w-full min-w-0 items-center justify-end gap-1 text-right text-[18px] font-semibold text-[#55514a]"
                aria-label="选择起卦时间"
              >
                {dateTime ? formatPickerLabel(dateTime) : "请选择"}
                <ChevronDown size={20} strokeWidth={2.5} className="shrink-0 text-[#302f2c]" />
              </button>
            </SharedFieldRow>
          </SharedFormCard>

          <SharedFormCard>
            <Controller
              name="plateType"
              control={control}
              render={({ field }) => (
                <SharedFieldRow icon={Compass} label="奇门类型">
                  <SegmentedText value={field.value} onChange={field.onChange} options={plateTypeOptions} ariaLabel="选择奇门类型" />
                </SharedFieldRow>
              )}
            />

            <Controller
              name="juMethod"
              control={control}
              render={({ field }) => (
                <SharedFieldRow icon={Compass} label="定局法">
                  <InlineChoiceGroup value={field.value} onChange={field.onChange} options={juMethodOptions} ariaLabel="选择定局法" />
                </SharedFieldRow>
              )}
            />

            <Controller
              name="zhiFuJiGong"
              control={control}
              render={({ field }) => (
                <SharedFieldRow icon={Compass} label="直符寄宫" last>
                  <InlineChoiceGroup value={field.value} onChange={field.onChange} options={zhiFuJiGongOptions} ariaLabel="选择直符寄宫" />
                </SharedFieldRow>
              )}
            />
          </SharedFormCard>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mx-auto mt-10 block h-14 w-[68%] rounded-full bg-black text-[22px] font-semibold text-[#e8d4a7] shadow-soft disabled:opacity-70"
          >
            {isSubmitting ? "起课中" : "起课"}
          </button>
        </form>
      </div>
      <DivinationTimePickerSheet
        open={timePickerOpen}
        value={dateTime}
        ariaLabel="关闭起卦时间选择"
        onClose={() => setTimePickerOpen(false)}
        onConfirm={(nextValue) => {
          setValue("dateTime", nextValue, { shouldDirty: true, shouldValidate: true });
          setTimePickerOpen(false);
        }}
      />
    </Shell>
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

function InlineChoiceGroup<TValue extends string>({
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
    <div className="ml-auto flex min-w-0 items-center justify-end gap-2" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={option.value === value}
          className={cn(
            "rounded-lg px-3 py-2 text-[16px] font-semibold leading-none transition-colors",
            option.value === value ? "bg-[#e7f0ff] text-[#4e9ee9]" : "text-[#55514a]"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
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

function parseDateTimeLocal(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) {
    throw new Error("起局时间格式无效");
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5])
  };
}
