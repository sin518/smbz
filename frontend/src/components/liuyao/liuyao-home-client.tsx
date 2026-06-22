"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CalendarClock, Check, ChevronDown, Compass, Hand, Hash, Info, ListChecks, MessageSquareText, Type, X } from "lucide-react";
import { Lunar, Solar } from "lunar-typescript";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, type UseFormRegisterReturn, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { DivinationTimePickerSheet, SharedFieldRow, SharedFormCard, SharedSegmentedPill, formatDateTimeLocal } from "@/components/shared/divination-profile-card";
import { castLiuyaoLine, type LiuyaoLine } from "@/lib/liuyao/casting";
import { cn } from "@/lib/utils";

const liuyaoFormSchema = z.object({
  yongShenTargets: z.array(z.enum(["妻财", "官鬼", "父母", "子孙", "兄弟"])).min(1, "请选择分析目标"),
  question: z.string().trim().min(1, "请填写求测问题").max(80, "问题不能超过 80 个字"),
  castingMethod: z.enum(["shake", "number", "manual", "time", "text"]),
  numberMode: z.enum(["two", "three"]),
  numberFirst: z.string().trim(),
  numberSecond: z.string().trim(),
  numberThird: z.string().trim(),
  textMode: z.enum(["two", "three"]),
  textFirst: z.string().trim(),
  textSecond: z.string().trim(),
  textThird: z.string().trim(),
  manualLines: z.array(z.enum(["young-yang", "young-yin", "old-yang", "old-yin"]).nullable()).length(6),
  castingCalendar: z.enum(["solar", "lunar"]),
  castingTime: z.string().min(1, "请选择起卦时间")
}).superRefine((values, context) => {
  if (values.castingMethod === "number") {
    validateCastingNumber(values.numberFirst, ["numberFirst"], context);
    validateCastingNumber(values.numberSecond, ["numberSecond"], context);
    if (values.numberMode === "three") {
      validateCastingNumber(values.numberThird, ["numberThird"], context);
    }
  }

  if (values.castingMethod === "text") {
    validateCastingText(values.textFirst, ["textFirst"], context);
    validateCastingText(values.textSecond, ["textSecond"], context);
    if (values.textMode === "three") {
      validateCastingText(values.textThird, ["textThird"], context);
    }
  }

  if (values.castingMethod === "manual") {
    values.manualLines.forEach((line, index) => {
      if (!line) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["manualLines", index],
          message: "请选择爻卦"
        });
      }
    });
  }
});

type LiuyaoFormValues = z.infer<typeof liuyaoFormSchema>;
type CastingMethodValue = LiuyaoFormValues["castingMethod"];
type ManualLineValue = NonNullable<LiuyaoFormValues["manualLines"][number]>;
type YongShenValue = LiuyaoFormValues["yongShenTargets"][number];
type YongShenOptionValue = YongShenValue | "通用";

const defaultValues: LiuyaoFormValues = {
  yongShenTargets: [],
  question: "",
  castingMethod: "shake",
  numberMode: "two",
  numberFirst: "",
  numberSecond: "",
  numberThird: "",
  textMode: "two",
  textFirst: "",
  textSecond: "",
  textThird: "",
  manualLines: [null, null, null, null, null, null],
  castingCalendar: "solar",
  castingTime: ""
};

const allYongShenTargets: YongShenValue[] = ["妻财", "官鬼", "父母", "子孙", "兄弟"];

const yongShenOptions: ReadonlyArray<{ label: YongShenOptionValue; title: string; description: string }> = [
  { label: "通用", title: "综合判断", description: "不清楚如何取用神时选择，由系统结合问题与全卦综合判断" },
  { label: "妻财", title: "钱和资源", description: "钱财/交易/资源/经营；婚恋多见于男问对象或以财为线索时" },
  { label: "官鬼", title: "工作与压力", description: "功名求官/工作事业/规则/压力/风险/疾病；婚恋多见于女问对象或以官为线索时" },
  { label: "父母", title: "学业与文书", description: "合同文书/证件/学业/房屋车辆/长辈" },
  { label: "子孙", title: "进展与结果", description: "子女后辈/医药" },
  { label: "兄弟", title: "人际与竞争", description: "同辈/合作/竞争" }
];

const castingMethodOptions: ReadonlyArray<{ label: string; value: CastingMethodValue }> = [
  { label: "摇卦", value: "shake" },
  { label: "报数", value: "number" },
  { label: "指定", value: "manual" },
  { label: "时间", value: "time" },
  { label: "汉字", value: "text" }
];

const numberModeOptions = [
  { label: "双数起卦", value: "two" },
  { label: "三数起卦", value: "three" }
] as const;

const textModeOptions = [
  { label: "双字起卦", value: "two" },
  { label: "三字起卦", value: "three" }
] as const;

const calendarOptions = [
  { label: "公历", value: "solar" },
  { label: "农历", value: "lunar" }
] as const;

const branchNumbers = {
  子: 1,
  丑: 2,
  寅: 3,
  卯: 4,
  辰: 5,
  巳: 6,
  午: 7,
  未: 8,
  申: 9,
  酉: 10,
  戌: 11,
  亥: 12
} as const;

const trigramKeysByNumber = {
  1: "111",
  2: "110",
  3: "101",
  4: "100",
  5: "011",
  6: "010",
  7: "001",
  8: "000"
} as const;

const manualLineOptions: ReadonlyArray<{ label: string; value: ManualLineValue; symbol: "yang" | "yin"; marker?: "circle" | "cross" }> = [
  { label: "少阳", value: "young-yang", symbol: "yang" },
  { label: "少阴", value: "young-yin", symbol: "yin" },
  { label: "老阳", value: "old-yang", symbol: "yang", marker: "circle" },
  { label: "老阴", value: "old-yin", symbol: "yin", marker: "cross" }
];

const manualLineLabels = ["初爻", "二爻", "三爻", "四爻", "五爻", "上爻"] as const;

export function LiuyaoHomeClient() {
  const router = useRouter();
  const [noticeOpen, setNoticeOpen] = useState(true);
  const [castingTimePickerOpen, setCastingTimePickerOpen] = useState(false);
  const [directionPickerOpen, setDirectionPickerOpen] = useState(false);
  const [castingMethodPickerOpen, setCastingMethodPickerOpen] = useState(false);
  const [manualLinePickerIndex, setManualLinePickerIndex] = useState<number | null>(null);
  const {
    control,
    register,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LiuyaoFormValues>({
    resolver: zodResolver(liuyaoFormSchema),
    defaultValues
  });
  const yongShenTargets = useWatch({ control, name: "yongShenTargets" });
  const castingMethod = useWatch({ control, name: "castingMethod" });
  const numberMode = useWatch({ control, name: "numberMode" });
  const textMode = useWatch({ control, name: "textMode" });
  const castingCalendar = useWatch({ control, name: "castingCalendar" });
  const castingTime = useWatch({ control, name: "castingTime" });
  const manualLines = useWatch({ control, name: "manualLines" });

  useEffect(() => {
    const currentTime = formatDateTimeLocal(new Date());
    setValue("castingTime", currentTime);
    // Run once after hydration so the displayed minute stays stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(values: LiuyaoFormValues) {
    const payload = {
      input: {
        ...values,
        question: values.question.trim()
      },
      savedAt: new Date().toISOString()
    };

    window.localStorage.setItem("sm1:current-liuyao-input", JSON.stringify(payload));

    if (values.castingMethod === "shake") {
      router.push("/liuyao/shake");
      return;
    }

    window.localStorage.removeItem("sm1:current-liuyao-draft");
    window.localStorage.setItem(
      "sm1:current-liuyao-casting",
      JSON.stringify({
        lines: buildDirectCastingLines(values),
        status: "complete",
        completedAt: new Date().toISOString()
      })
    );
    router.push("/liuyao/result");
  }

  return (
    <main className="light-surface-text-scope app-responsive-shell min-h-screen bg-[#F8F7EE] pb-8 text-ink shadow-soft">
      <header className="px-5 pb-2 pt-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="-ml-2 flex h-10 w-10 items-center justify-center" aria-label="返回首页">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-[24px] font-semibold">六爻断事</h1>
          <span className="h-10 w-10" />
        </div>
      </header>

      <div className="space-y-4 px-4 pt-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <SharedFormCard>
            <SharedFieldRow icon={CalendarClock} label="起卦时间" error={errors.castingTime?.message}>
              <button
                type="button"
                onClick={() => setCastingTimePickerOpen(true)}
                className="flex w-full min-w-0 items-center justify-end gap-1 text-right text-[18px] font-semibold text-[#55514a]"
                aria-label="选择起卦时间"
              >
                {formatDateTimeText(castingTime)}
                <ChevronDown size={20} strokeWidth={2.5} className="shrink-0 text-[#302f2c]" />
              </button>
            </SharedFieldRow>
            <Controller
              name="yongShenTargets"
              control={control}
              render={({ field }) => (
                <SharedFieldRow icon={Compass} label="分析目标" error={errors.yongShenTargets?.message}>
                  <button
                    type="button"
                    onClick={() => setDirectionPickerOpen(true)}
                    className="flex w-full min-w-0 items-center justify-end gap-1 text-right text-[18px] font-semibold text-[#55514a]"
                    aria-label="选择分析目标"
                  >
                    {formatYongShenTriggerLabel(field.value)}
                    <ChevronDown size={20} strokeWidth={2.5} className="shrink-0 text-[#302f2c]" />
                  </button>
                </SharedFieldRow>
              )}
            />

            <SharedFieldRow icon={MessageSquareText} label="求测问题" error={errors.question?.message} last>
              <input
                {...register("question")}
                className="w-full bg-transparent text-right text-[18px] font-semibold text-ink outline-none placeholder:text-[#bdbbb5]"
                placeholder="请一句话描述你的问题"
              />
            </SharedFieldRow>
          </SharedFormCard>

          <SharedFormCard>
            <Controller
              name="castingMethod"
              control={control}
              render={({ field }) => (
                <SharedFieldRow icon={Hand} label="起卦方式" error={errors.castingMethod?.message} last>
                  <button
                    type="button"
                    onClick={() => setCastingMethodPickerOpen(true)}
                    className="flex w-full min-w-0 items-center justify-end gap-1 text-right text-[18px] font-semibold text-[#55514a]"
                    aria-label="选择起卦方式"
                  >
                    {getOptionLabel(castingMethodOptions, field.value)}
                    <ChevronDown size={20} strokeWidth={2.5} className="shrink-0 text-[#302f2c]" />
                  </button>
                </SharedFieldRow>
              )}
            />
          </SharedFormCard>

          {castingMethod === "number" ? (
            <SharedFormCard>
              <Controller
                name="numberMode"
                control={control}
                render={({ field }) => (
                  <div className="border-b border-[#ebe7dd] py-4">
                    <RadioChoiceGroup value={field.value} onChange={field.onChange} options={numberModeOptions} className="justify-center" />
                  </div>
                )}
              />
              <NumberInputRow label="第一组数字" error={errors.numberFirst?.message} inputProps={register("numberFirst")} />
              <NumberInputRow label="第二组数字" error={errors.numberSecond?.message} inputProps={register("numberSecond")} last={numberMode !== "three"} />
              {numberMode === "three" ? (
                <NumberInputRow label="第三组数字" error={errors.numberThird?.message} inputProps={register("numberThird")} last />
              ) : null}
            </SharedFormCard>
          ) : null}

          {castingMethod === "manual" ? (
            <SharedFormCard>
              <div className="space-y-2 py-3">
                <div className="flex items-center gap-2 text-[17px] font-semibold text-ink">
                  <ListChecks size={18} className="text-[#a58024]" />
                  指定六爻
                </div>
                <div className="space-y-1.5">
                  {manualLineLabels.map((lineLabel, index) => ({ lineLabel, index })).reverse().map(({ lineLabel, index }) => (
                    <ManualLinePreview
                      key={lineLabel}
                      label={lineLabel}
                      value={manualLines[index]}
                      onClick={() => setManualLinePickerIndex(index)}
                    />
                  ))}
                </div>
              </div>
            </SharedFormCard>
          ) : null}

          {castingMethod === "time" ? (
            <SharedFormCard>
              <Controller
                name="castingCalendar"
                control={control}
                render={({ field }) => (
                  <SharedFieldRow icon={CalendarClock} label="历法" last>
                    <SharedSegmentedPill value={field.value} onChange={field.onChange} options={calendarOptions} ariaLabel="选择起卦历法" />
                  </SharedFieldRow>
                )}
              />
            </SharedFormCard>
          ) : null}

          {castingMethod === "text" ? (
            <SharedFormCard>
              <Controller
                name="textMode"
                control={control}
                render={({ field }) => (
                  <SharedFieldRow icon={Type} label="汉字形式">
                    <RadioChoiceGroup value={field.value} onChange={field.onChange} options={textModeOptions} />
                  </SharedFieldRow>
                )}
              />
              <div className="py-4">
                <div className="mb-3 text-[18px] font-semibold text-ink">起卦汉字</div>
                <div className={cn("grid gap-3", textMode === "three" ? "grid-cols-3" : "grid-cols-2")}>
                  <TextBoxInput label="第一个汉字" error={errors.textFirst?.message} inputProps={register("textFirst")} />
                  <TextBoxInput label="第二个汉字" error={errors.textSecond?.message} inputProps={register("textSecond")} />
                  {textMode === "three" ? <TextBoxInput label="第三个汉字" error={errors.textThird?.message} inputProps={register("textThird")} /> : null}
                </div>
              </div>
            </SharedFormCard>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mx-auto mt-10 block h-14 w-[68%] rounded-full bg-black text-[22px] font-semibold text-[#e8d4a7] shadow-soft disabled:opacity-70"
          >
            开始起卦
          </button>

          <aside className="mx-auto mt-7 w-full max-w-[398px] border-t border-[#e5decb] px-1 pt-5" aria-labelledby="liuyao-question-tip-title">
            <h2 id="liuyao-question-tip-title" className="flex items-center gap-2 text-[16px] font-semibold text-[#8f6f2e]">
              <Info size={18} strokeWidth={2.2} />
              友情提示
            </h2>
            <div className="mt-4 space-y-4 text-[14px] leading-6 text-[#66615a]">
              <div className="grid grid-cols-[24px_minmax(0,1fr)] gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#efe5cb] text-[12px] font-semibold text-[#8f6f2e]">1</span>
                <p>
                  <strong className="font-semibold text-[#55514a]">把问题说完整：</strong>
                  建议包含“能否/是否＋具体动作＋期限或对象”，例如“下周三与 XX 公司的合作签约能否成功？”
                </p>
              </div>
              <div className="grid grid-cols-[24px_minmax(0,1fr)] gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#efe5cb] text-[12px] font-semibold text-[#8f6f2e]">2</span>
                <p>
                  <strong className="font-semibold text-[#55514a]">聚焦单一事件：</strong>
                  每次只问一个具体问题，也可以问“今年的财运状况如何？”。避免只写“事业如何”，或同时询问多个不相干事件。
                </p>
              </div>
              <div className="grid grid-cols-[24px_minmax(0,1fr)] gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#efe5cb] text-[12px] font-semibold text-[#8f6f2e]">3</span>
                <p>
                  <strong className="font-semibold text-[#55514a]">可以替他人代测：</strong>
                  请说明对方与您的关系，并把问题描述清楚，例如“我的同事今年财运如何？”或“我的同事近期健康状况如何？”。两类事情请分开起卦。
                </p>
              </div>
            </div>
          </aside>
        </form>
      </div>

      <DivinationTimePickerSheet
        open={castingTimePickerOpen}
        value={castingTime}
        ariaLabel="关闭起卦时间选择"
        onClose={() => setCastingTimePickerOpen(false)}
        onConfirm={(nextValue) => {
          setValue("castingTime", nextValue, { shouldDirty: true, shouldValidate: true });
          setCastingTimePickerOpen(false);
        }}
      />
      <YongShenSheet
        open={directionPickerOpen}
        title="选择分析目标"
        value={yongShenTargets}
        onClose={() => setDirectionPickerOpen(false)}
        onConfirm={(value) => {
          setValue("yongShenTargets", value, { shouldDirty: true, shouldValidate: true });
          setDirectionPickerOpen(false);
        }}
      />
      <SimpleOptionSheet
        open={castingMethodPickerOpen}
        title="选择起卦方式"
        options={castingMethodOptions}
        value={castingMethod}
        onClose={() => setCastingMethodPickerOpen(false)}
        onSelect={(value) => {
          setValue("castingMethod", value, { shouldDirty: true, shouldValidate: true });
          setCastingMethodPickerOpen(false);
        }}
      />
      <ManualLinePickerSheet
        open={manualLinePickerIndex !== null}
        label={manualLinePickerIndex === null ? "" : manualLineLabels[manualLinePickerIndex]}
        value={manualLinePickerIndex === null ? null : manualLines[manualLinePickerIndex]}
        onClose={() => setManualLinePickerIndex(null)}
        onSelect={(value) => {
          if (manualLinePickerIndex !== null) {
            setValue(`manualLines.${manualLinePickerIndex}`, value, { shouldDirty: true, shouldValidate: true });
          }
          setManualLinePickerIndex(null);
        }}
      />
      <LiuyaoNoticeDialog open={noticeOpen} onClose={() => setNoticeOpen(false)} />
    </main>
  );
}

function LiuyaoNoticeDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 px-6 py-8">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="liuyao-notice-title"
        className="relative max-h-[calc(100dvh-2rem)] w-full max-w-[350px] overflow-y-auto rounded-[8px] border-2 border-[#b7924a] bg-[#fffef9] p-1 shadow-[0_22px_60px_rgba(0,0,0,0.22)]"
      >
        <div className="rounded-[5px] border border-[#d8c8a6] px-6 pb-6 pt-8 text-center text-[#55514a]">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-[#d8c8a6] bg-[#fffef9] text-[#77736b]"
            aria-label="关闭六爻断事须知"
          >
            <X size={18} strokeWidth={2} />
          </button>

          <div className="flex items-center gap-3 text-[#a58024]" aria-hidden="true">
            <span className="h-px flex-1 bg-[#d8c8a6]" />
            <span className="h-1.5 w-1.5 rotate-45 border border-[#b7924a]" />
            <span className="h-px flex-1 bg-[#d8c8a6]" />
          </div>
          <h2 id="liuyao-notice-title" className="mt-4 text-[24px] font-semibold text-[#8f6f2e]">
            六爻断事须知
          </h2>
          <p className="mt-2 text-[14px] font-medium text-[#a58024]">一事一问 · 据实起卦 · 理性参考</p>

          <p className="mt-6 text-[14px] leading-7 text-[#77736b]">
            六爻以卦象、月建日辰、动爻、世应与六亲关系综合推演，为当前问题提供趋势和风险参考。
          </p>

          <div className="mt-5 space-y-4 text-[14px] leading-6">
            <NoticeSection title="起卦前" lines={["静心片刻，只问一件最关心的事", "问题尽量具体，并说明对象与时间范围", "不清楚如何取用神时，可选择“通用分析”"]} />
            <NoticeSection title="起卦时" lines={["选择适合的起卦方式，按真实情况操作", "确认起卦时间与问题无误后再开始"]} />
            <NoticeSection title="查看结果" lines={["先看卦象结论，再核对用神、动变与应期依据", "内容仅供传统文化研究与休闲娱乐参考"]} />
          </div>

          <p className="mt-5 border-t border-[#e8dfcc] pt-4 text-[12px] leading-5 text-[#9b9383]">
            不构成医疗、投资、法律或其他现实决策依据，请结合实际情况理性判断。
          </p>

          <button
            type="button"
            onClick={onClose}
            className="mt-5 h-12 w-full rounded-full bg-black text-[17px] font-semibold text-[#e8d4a7]"
          >
            我已知晓
          </button>
        </div>
      </section>
    </div>
  );
}

function NoticeSection({ title, lines }: { title: string; lines: readonly string[] }) {
  return (
    <div>
      <h3 className="font-semibold text-[#8f6f2e]">{title}</h3>
      <div className="mt-1 space-y-0.5 text-[#66615a]">
        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </div>
  );
}

function YongShenSheet({
  open,
  title,
  value,
  onClose,
  onConfirm
}: {
  open: boolean;
  title: string;
  value: YongShenValue[];
  onClose: () => void;
  onConfirm: (value: YongShenValue[]) => void;
}) {
  const [draftValue, setDraftValue] = useState<YongShenValue[]>(value);

  useEffect(() => {
    if (open) {
      setDraftValue(value);
    }
  }, [open, value]);

  if (!open) {
    return null;
  }

  function toggleOption(nextValue: YongShenOptionValue) {
    setDraftValue((current) => {
      if (nextValue === "通用") {
        return isGeneralYongShenSelection(current) ? [] : allYongShenTargets;
      }

      return current.length === 1 && current[0] === nextValue ? [] : [nextValue];
    });
  }

  function handleConfirm() {
    onConfirm(draftValue);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3">
      <button className="absolute inset-0 cursor-default" type="button" aria-label="关闭选择弹窗" onClick={onClose} />
      <section className="liuyao-choice-sheet relative w-full max-w-[414px] overflow-hidden rounded-xl border border-[var(--liuyao-sheet-border)] bg-[var(--liuyao-sheet-bg)] text-[var(--liuyao-sheet-text)] shadow-soft">
        <header className="flex h-11 items-center justify-between border-b border-[var(--liuyao-sheet-border)] px-4">
          <h2 className="text-[14px] font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--liuyao-sheet-border)] text-[var(--liuyao-sheet-muted)]" aria-label="关闭">
            <X size={17} strokeWidth={2} />
          </button>
        </header>

        <div className="space-y-2 px-3 py-3">
          {yongShenOptions.map((option) => {
            const generalSelected = isGeneralYongShenSelection(draftValue);
            const selected = option.label === "通用" ? generalSelected : !generalSelected && draftValue.includes(option.label);
            return (
              <button
                key={option.label}
                type="button"
                onClick={() => toggleOption(option.label)}
                className={cn(
                  "flex min-h-[55px] w-full items-center justify-between rounded-md border px-3 text-left transition-colors",
                  selected
                    ? "border-[var(--liuyao-sheet-selected-border)] bg-[var(--liuyao-sheet-selected-bg)] text-[var(--liuyao-sheet-selected-text)]"
                    : "border-[var(--liuyao-sheet-border)] bg-[var(--liuyao-sheet-option-bg)] text-[var(--liuyao-sheet-text)]"
                )}
                aria-pressed={selected}
              >
                <span className="min-w-0">
                  <span className="flex items-baseline gap-2">
                    <span className="text-[15px] font-semibold">{option.label}</span>
                    <span className={cn("text-[14px] font-semibold", selected ? "text-[var(--liuyao-sheet-selected-text)]" : "text-[var(--liuyao-sheet-muted)]")}>{option.title}</span>
                  </span>
                  <span className={cn("mt-1 block text-[12px] leading-5", selected ? "text-[var(--liuyao-sheet-selected-text)]" : "text-[var(--liuyao-sheet-muted)]")}>{option.description}</span>
                </span>
                {selected ? <Check size={17} strokeWidth={2.4} className="ml-3 shrink-0 text-[#cfa51d]" /> : null}
              </button>
            );
          })}
        </div>

        <footer className="flex h-14 items-center justify-between border-t border-[var(--liuyao-sheet-border)] px-4">
          <p className="min-w-0 truncate text-[12px] text-[var(--liuyao-sheet-muted)]">已选：{formatYongShenLabel(draftValue)}</p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setDraftValue([])} className="h-9 rounded-md border border-[var(--liuyao-sheet-border)] px-4 text-[13px] font-semibold">
              清空
            </button>
            <button type="button" onClick={handleConfirm} className="h-9 rounded-md bg-[#d4ad28] px-4 text-[13px] font-semibold text-white">
              确认
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}

function formatYongShenLabel(value: readonly YongShenValue[]) {
  if (!value.length) {
    return "未选择";
  }

  if (isGeneralYongShenSelection(value)) {
    return "通用";
  }

  return value.join("、");
}

function formatYongShenTriggerLabel(value: readonly YongShenValue[]) {
  if (!value.length) {
    return "选择分析目标";
  }

  if (isGeneralYongShenSelection(value)) {
    return "通用分析";
  }

  return `分析目标 ${value.length} 项`;
}

function isGeneralYongShenSelection(value: readonly YongShenValue[]) {
  return allYongShenTargets.every((target) => value.includes(target));
}

function getOptionLabel<TValue extends string>(options: ReadonlyArray<{ label: string; value: TValue }>, value: TValue) {
  return options.find((option) => option.value === value)?.label ?? "请选择";
}

function RadioChoiceGroup<TValue extends string>({
  value,
  onChange,
  options,
  className
}: {
  value: TValue;
  onChange: (value: TValue) => void;
  options: ReadonlyArray<{ label: string; value: TValue }>;
  className?: string;
}) {
  return (
    <div className={cn("flex justify-end gap-4", className)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className="flex items-center gap-2 text-[16px] font-semibold text-[#55514a]"
          aria-pressed={option.value === value}
        >
          <span className={cn("flex h-5 w-5 items-center justify-center rounded-full border-2", option.value === value ? "border-black" : "border-[#d8c8a6]")}>
            {option.value === value ? <span className="h-2.5 w-2.5 rounded-full bg-black" /> : null}
          </span>
          {option.label}
        </button>
      ))}
    </div>
  );
}

function NumberInputRow({
  label,
  error,
  inputProps,
  last
}: {
  label: string;
  error?: string;
  inputProps: UseFormRegisterReturn;
  last?: boolean;
}) {
  return (
    <div className={cn("py-4", !last && "border-b border-[#ebe7dd]")}>
      <div className="grid grid-cols-[104px_1fr] items-center gap-3">
        <label className="whitespace-nowrap text-center text-[18px] font-semibold text-ink">{label}</label>
        <input
          {...inputProps}
          aria-label={label}
          inputMode="numeric"
          maxLength={3}
          onInput={(event) => {
            event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "").slice(0, 3);
          }}
          className="h-11 min-w-0 rounded-lg border border-[#d8c8a6] bg-[#fffef7] px-3 text-center text-[18px] font-semibold text-ink outline-none"
        />
      </div>
    </div>
  );
}

function TextBoxInput({ label, error, inputProps }: { label: string; error?: string; inputProps: UseFormRegisterReturn }) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <input
        {...inputProps}
        maxLength={1}
        className={cn(
          "h-16 w-full rounded-xl border bg-[#fffef7] text-center text-[28px] font-semibold text-ink outline-none",
          error ? "border-red-500" : "border-[#d8c8a6]"
        )}
        aria-label={label}
      />
      {error ? <span className="mt-1 block text-center text-xs font-semibold text-red-600">{error}</span> : null}
    </label>
  );
}

function ManualLinePreview({
  label,
  value,
  onClick
}: {
  label: string;
  value: ManualLineValue | null;
  onClick: () => void;
}) {
  const option = value ? getManualLineOption(value) : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="grid min-h-10 w-full grid-cols-[48px_1fr_48px] items-center gap-2 rounded-lg border border-[#e8e1cf] bg-[#fffef7] px-3 text-left"
    >
      <span className="text-[16px] font-semibold text-[#6f5a25]">{label}</span>
      <span className="flex justify-center">
        <span className="flex w-[82px] items-center justify-start">
          {option ? (
            <>
              <LineSymbol symbol={option.symbol} />
              {option.marker === "circle" ? <span className="ml-2 text-[18px] font-semibold leading-none text-[#55514a]">○</span> : null}
              {option.marker === "cross" ? <span className="ml-2 text-[18px] font-semibold leading-none text-[#55514a]">×</span> : null}
            </>
          ) : (
            <span className="h-2.5 w-14 rounded-full bg-[#e6dfd0]" />
          )}
        </span>
      </span>
      <span className="text-right text-[14px] font-semibold text-[#aaa8a1]">{option?.label ?? "请选择"}</span>
    </button>
  );
}

function ManualLinePickerSheet({
  open,
  label,
  value,
  onClose,
  onSelect
}: {
  open: boolean;
  label: string;
  value: ManualLineValue | null;
  onClose: () => void;
  onSelect: (value: ManualLineValue) => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-8">
      <button className="absolute inset-0 cursor-default" type="button" aria-label="关闭爻位选择弹窗" onClick={onClose} />
      <section className="relative w-full max-w-[340px] rounded-2xl bg-[#fffef7] px-6 pb-6 pt-5 shadow-soft">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center text-[#5d5a55]"
          aria-label="关闭"
        >
          <X size={28} strokeWidth={2.2} />
        </button>
        <h2 className="mt-8 text-center text-[25px] font-semibold text-[#32302d]">选择{label}</h2>
        <div className="mt-6 grid grid-cols-2 gap-4">
          {manualLineOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            className={cn(
              "grid min-h-12 grid-cols-[42px_1fr] items-center rounded-lg border-2 px-2 text-left text-[16px] font-semibold",
              option.value === value ? "border-black bg-black text-[#e8d4a7]" : "border-[#d8c8a6] bg-[#fffef7] text-[#55514a]"
            )}
          >
            <span>{option.label}</span>
            <span className="flex items-center justify-end gap-1">
              <LineSymbol symbol={option.symbol} active={option.value === value} />
              {option.marker === "circle" ? <span className="text-[18px] leading-none">○</span> : null}
              {option.marker === "cross" ? <span className="text-[18px] leading-none">×</span> : null}
            </span>
          </button>
        ))}
        </div>
      </section>
    </div>
  );
}

function getManualLineOption(value: ManualLineValue) {
  return manualLineOptions.find((option) => option.value === value) ?? manualLineOptions[0];
}

function buildDirectCastingLines(values: LiuyaoFormValues): LiuyaoLine[] {
  if (values.castingMethod === "manual" && values.manualLines.every(isManualLineValue)) {
    return values.manualLines.map((kind, index) => manualLineToLiuyaoLine(kind, index + 1));
  }

  if (values.castingMethod === "time") {
    return buildTimeCastingLines(values);
  }

  return Array.from({ length: 6 }, (_, index) => castLiuyaoLine(index + 1));
}

function buildTimeCastingLines(values: LiuyaoFormValues): LiuyaoLine[] {
  const lunar = getCastingLunar(values.castingTime, values.castingCalendar);
  const yearBranchNumber = getBranchNumber(lunar.getYearZhi());
  const hourBranchNumber = getBranchNumber(lunar.getTimeZhi());
  const monthNumber = Math.abs(lunar.getMonth());
  const dayNumber = lunar.getDay();
  const baseSum = yearBranchNumber + monthNumber + dayNumber;
  const timeSum = baseSum + hourBranchNumber;
  const upperNumber = moduloOneBased(baseSum, 8);
  const lowerNumber = moduloOneBased(timeSum, 8);
  const movingPosition = moduloOneBased(timeSum, 6);
  const lineKey = `${trigramKeysByNumber[lowerNumber]}${trigramKeysByNumber[upperNumber]}`;

  return lineKey.split("").map((symbol, index) => symbolToLiuyaoLine(symbol, index + 1, index + 1 === movingPosition));
}

function getCastingLunar(value: string, calendar: LiuyaoFormValues["castingCalendar"]) {
  const date = parseDateTimeLocal(value);

  if (calendar === "lunar") {
    return Lunar.fromYmdHms(date.year, date.month, date.day, date.hour, date.minute, 0);
  }

  return Solar.fromYmdHms(date.year, date.month, date.day, date.hour, date.minute, 0).getLunar();
}

function parseDateTimeLocal(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);

  if (!match) {
    throw new Error("Invalid castingTime format. Expected yyyy-MM-ddTHH:mm");
  }

  const [, year, month, day, hour, minute] = match;

  return {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute)
  };
}

function getBranchNumber(value: string) {
  const branch = value as keyof typeof branchNumbers;

  return branchNumbers[branch] ?? 1;
}

function moduloOneBased(value: number, divisor: 6 | 8) {
  const remainder = value % divisor;

  return (remainder === 0 ? divisor : remainder) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
}

function symbolToLiuyaoLine(symbol: string, position: number, changing: boolean): LiuyaoLine {
  if (symbol === "1") {
    return manualLineToLiuyaoLine(changing ? "old-yang" : "young-yang", position);
  }

  return manualLineToLiuyaoLine(changing ? "old-yin" : "young-yin", position);
}

function isManualLineValue(value: LiuyaoFormValues["manualLines"][number]): value is ManualLineValue {
  return value === "old-yin" || value === "young-yang" || value === "young-yin" || value === "old-yang";
}

function manualLineToLiuyaoLine(kind: ManualLineValue, position: number): LiuyaoLine {
  const lineByKind: Record<ManualLineValue, Pick<LiuyaoLine, "coins" | "total" | "changing">> = {
    "old-yin": { coins: [0, 0, 0], total: 6, changing: true },
    "young-yang": { coins: [1, 0, 0], total: 7, changing: false },
    "young-yin": { coins: [1, 1, 0], total: 8, changing: false },
    "old-yang": { coins: [1, 1, 1], total: 9, changing: true }
  };

  return {
    position,
    kind,
    ...lineByKind[kind]
  };
}

function LineSymbol({ symbol, active }: { symbol: "yang" | "yin"; active?: boolean }) {
  const colorClass = active ? "bg-[#e8d4a7]" : "bg-[#303030]";

  if (symbol === "yang") {
    return <span className={cn("block h-2.5 w-14 rounded-sm", colorClass)} />;
  }

  return (
    <span className="flex gap-1.5">
      <span className={cn("block h-2.5 w-6 rounded-sm", colorClass)} />
      <span className={cn("block h-2.5 w-6 rounded-sm", colorClass)} />
    </span>
  );
}

function SimpleOptionSheet<TValue extends string>({
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
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center text-[#5d5a55]"
          aria-label="关闭"
        >
          <X size={28} strokeWidth={2.2} />
        </button>
        <h2 className="mt-8 text-center text-[25px] font-semibold text-[#32302d]">{title}</h2>
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

function validateCastingNumber(value: string, path: string[], context: z.RefinementCtx) {
  if (!/^\d{1,3}$/.test(value) || Number(value) > 999) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path,
      message: "请输入 0-999"
    });
  }
}

function validateCastingText(value: string, path: string[], context: z.RefinementCtx) {
  if (!/^\p{Script=Han}$/u.test(value)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path,
      message: "请输入汉字"
    });
  }
}

function formatDateTimeText(value: string) {
  if (!value) {
    return "请选择";
  }

  return value.replace("T", " ");
}
