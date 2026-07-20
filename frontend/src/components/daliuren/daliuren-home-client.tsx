"use client";

// 需要 useState + react-hook-form 管理时间弹层和表单状态。
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarClock, CalendarDays, ChevronDown, ScrollText, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import {
  DivinationTimePickerSheet,
  SharedFieldRow,
  SharedFormCard,
  SharedSegmentedPill,
  formatDateTimeLocal,
  formatPickerLabel
} from "@/components/shared/divination-profile-card";
import {
  DivinationFormBody,
  DivinationFormShell,
  DivinationSectionHeader,
  DivinationSubmitBar,
  divinationFormCardClass
} from "@/components/shared/divination-form-shell";

const currentYear = new Date().getFullYear();

const daliurenFormSchema = z.object({
  question: z.string().trim().min(1, "请填写占事").max(80, "占事不能超过 80 个字"),
  dateTime: z.string().min(1, "请选择起课时间"),
  birthYear: z.coerce
    .number({ invalid_type_error: "请填写出生年份" })
    .int("出生年份必须是整数")
    .min(1900, "出生年份不能早于 1900 年")
    .max(currentYear, `出生年份不能晚于 ${currentYear} 年`),
  gender: z.enum(["male", "female"])
});

type DaliurenFormValues = z.infer<typeof daliurenFormSchema>;
type DaliurenFormInputValues = Omit<DaliurenFormValues, "birthYear"> & {
  birthYear: number | "";
};

const defaultValues: DaliurenFormInputValues = {
  question: "",
  dateTime: "",
  birthYear: "",
  gender: "male"
};

export function DaliurenHomeClient() {
  const router = useRouter();
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const {
    control,
    register,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<DaliurenFormInputValues>({
    resolver: zodResolver(daliurenFormSchema),
    defaultValues
  });
  const dateTime = useWatch({ control, name: "dateTime" });

  useEffect(() => {
    setValue("dateTime", formatDateTimeLocal(new Date()));
    // Run once after hydration so server and client do not render different minutes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSubmit(values: DaliurenFormInputValues) {
    const birthYear = Number(values.birthYear);
    const payload = {
      input: {
        ...values,
        birthYear,
        question: values.question.trim()
      },
      savedAt: new Date().toISOString()
    };

    window.localStorage.setItem("sm1:current-daliuren-input", JSON.stringify(payload));
    window.localStorage.setItem("sm1:last-daliuren-input", JSON.stringify(payload));
    router.push("/daliuren/result");
  }

  return (
    <DivinationFormShell title="大六壬" subtitle="起课问事，推演人事" icon={ScrollText} tone="brown">
      <DivinationFormBody>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <SharedFormCard className={divinationFormCardClass}>
              <DivinationSectionHeader title="所问之事" description="聚焦一件具体事情，便于推演判断" tone="brown" />
              <div className="py-4">
                <label htmlFor="daliuren-question" className="sr-only">占事</label>
                <textarea
                  {...register("question")}
                  id="daliuren-question"
                  rows={2}
                  className="min-h-[76px] w-full resize-none rounded-[14px] border border-[#e1d2b3] bg-[#fffaf0] px-4 py-3 text-[16px] font-semibold leading-6 text-ink outline-none placeholder:text-[#aaa39a] focus:border-[#b68a3b]"
                  placeholder="例如：此事下一步如何推进？"
                />
                {errors.question?.message ? <p className="mt-2 text-right text-sm text-red-600">{errors.question.message}</p> : null}
              </div>
            </SharedFormCard>

            <SharedFormCard className={divinationFormCardClass}>
              <DivinationSectionHeader title="起课信息" description="确认起课时间与求测人资料" tone="brown" />
              <SharedFieldRow icon={CalendarClock} label="起课时间" error={errors.dateTime?.message}>
                <button
                  type="button"
                  onClick={() => setTimePickerOpen(true)}
                  className="flex w-full min-w-0 items-center justify-end gap-1 text-right text-[18px] font-semibold text-[#55514a]"
                  aria-label="选择起课时间"
                >
                  {dateTime ? formatPickerLabel(dateTime) : "请选择"}
                  <ChevronDown size={20} strokeWidth={2.5} className="shrink-0 text-[#302f2c]" />
                </button>
              </SharedFieldRow>

              <SharedFieldRow icon={CalendarDays} label="出生年份" error={errors.birthYear?.message}>
                <input
                  {...register("birthYear", { valueAsNumber: true })}
                  type="number"
                  inputMode="numeric"
                  min={1900}
                  max={currentYear}
                  className="min-w-0 bg-transparent text-right text-[18px] font-semibold text-[#55514a] outline-none placeholder:text-[#bdbbb5]"
                  placeholder="如 1990"
                />
              </SharedFieldRow>

              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <SharedFieldRow icon={Users} label="性别" last>
                    <SharedSegmentedPill
                      value={field.value}
                      onChange={field.onChange}
                      options={[
                        { label: "男", value: "male" },
                        { label: "女", value: "female" }
                      ]}
                      ariaLabel="选择性别"
                    />
                  </SharedFieldRow>
                )}
              />
            </SharedFormCard>
          </div>

          <DivinationSubmitBar label="开始起课" busyLabel="起课中" isBusy={isSubmitting} icon={ScrollText} />
        </form>
      </DivinationFormBody>

      <DivinationTimePickerSheet
        open={timePickerOpen}
        value={dateTime}
        ariaLabel="关闭起课时间选择"
        onClose={() => setTimePickerOpen(false)}
        onConfirm={(nextValue) => {
          setValue("dateTime", nextValue, { shouldDirty: true, shouldValidate: true });
          setTimePickerOpen(false);
        }}
      />
    </DivinationFormShell>
  );
}
