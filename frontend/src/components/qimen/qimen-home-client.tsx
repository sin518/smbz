"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarClock, ChevronDown, Compass } from "lucide-react";
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
import {
  DivinationFormBody,
  DivinationFormShell,
  DivinationSectionHeader,
  DivinationSubmitBar,
  divinationFormCardClass
} from "@/components/shared/divination-form-shell";

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
    <DivinationFormShell title="奇门遁甲" subtitle="起局分析，辅助决策" icon={Compass} moduleMark="qimen" tone="brown" embedded={embedded}>
      <DivinationFormBody embedded={embedded}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <SharedFormCard className={divinationFormCardClass}>
              <DivinationSectionHeader title="占事与时间" description="说明所问之事，并确认起局时刻" tone="brown" />
              <div className="py-4">
                <label htmlFor="qimen-question" className="sr-only">占事（选填）</label>
                <textarea
                  {...register("question")}
                  id="qimen-question"
                  rows={2}
                  className="min-h-[76px] w-full resize-none rounded-[14px] border border-[#e1d2b3] bg-[#fffaf0] px-4 py-3 text-[16px] font-semibold leading-6 text-ink outline-none placeholder:text-[#aaa39a] focus:border-[#b68a3b]"
                  placeholder="例如：此次合作能否成功？"
                />
                {errors.question?.message ? <p className="mt-2 text-right text-sm text-red-600">{errors.question.message}</p> : null}
              </div>

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

            <SharedFormCard className={divinationFormCardClass}>
              <DivinationSectionHeader title="排盘设置" description="选择定局方法与直符寄宫规则" tone="brown" />
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
          </div>

          <DivinationSubmitBar label="开始起课" busyLabel="起课中" isBusy={isSubmitting} embedded={embedded} icon={Compass} />
        </form>
      </DivinationFormBody>
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
    </DivinationFormShell>
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
    <div className="ml-auto flex min-w-0 items-center justify-end gap-1.5" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={option.value === value}
          className={cn(
            "whitespace-nowrap rounded-lg border px-2 py-2 text-[15px] font-semibold leading-none transition-colors sm:px-3 sm:text-[16px]",
            option.value === value
              ? "border-[#dcc58f] bg-[#fbf4e4] text-[#9a6b1f]"
              : "border-transparent text-[#6f6a62]"
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
