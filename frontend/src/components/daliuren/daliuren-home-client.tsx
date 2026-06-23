"use client";

// 需要 useState + react-hook-form 管理时间弹层和表单状态。
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CalendarClock, CalendarDays, ChevronDown, Users } from "lucide-react";
import Link from "next/link";
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
    <main className="light-surface-text-scope app-responsive-shell min-h-screen bg-[#F8F7EE] pb-8 text-ink shadow-soft">
      <header className="px-5 pb-2 pt-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="-ml-2 flex h-10 w-10 items-center justify-center" aria-label="返回首页">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-[24px] font-semibold">大六壬</h1>
          <span className="h-10 w-10" />
        </div>
      </header>

      <div className="space-y-4 px-4 pt-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <section className="pt-1">
            <label htmlFor="daliuren-question" className="block text-center text-[15px] font-semibold text-[#8b8985]">
              占事
            </label>
            <textarea
              {...register("question")}
              id="daliuren-question"
              rows={2}
              className="mt-3 min-h-[62px] w-full resize-none content-center rounded-lg border border-[#d8c8a6] bg-transparent px-4 py-3 text-center text-[17px] font-semibold text-ink outline-none placeholder:text-[#8b8985]"
              placeholder="例如：此事下一步如何推进？"
            />
            {errors.question?.message ? <p className="mt-2 text-right text-sm text-red-600">{errors.question.message}</p> : null}
          </section>

          <SharedFormCard>
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

          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="mx-auto mt-10 block h-14 w-[68%] rounded-full bg-black text-[22px] font-semibold text-[#e8d4a7] shadow-soft disabled:opacity-70"
          >
            起课
          </button>
        </form>
      </div>

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
    </main>
  );
}
