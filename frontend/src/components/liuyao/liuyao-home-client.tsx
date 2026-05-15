"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CalendarClock, ChevronDown, Compass, Hand, Hash, ListChecks, MessageSquareText, Type, X } from "lucide-react";
import { Lunar, Solar } from "lunar-typescript";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, type UseFormRegisterReturn, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import {
  DivinationProfileCard,
  DivinationTimePickerSheet,
  SharedFieldRow,
  SharedFormCard,
  SharedSegmentedPill,
  formatDateTimeLocal,
  saveSharedProfile
} from "@/components/shared/divination-profile-card";
import { castLiuyaoLine, type LiuyaoLine } from "@/lib/liuyao/casting";
import { cn } from "@/lib/utils";

const liuyaoFormSchema = z.object({
  name: z.string().trim().max(20, "姓名不能超过 20 个字").optional(),
  gender: z.enum(["male", "female"]),
  dateTime: z.string().min(1, "请选择出生时间"),
  divinationDirection: z.enum(["general", "career", "wealth", "relationship", "health", "cooperation", "interpersonal", "risk"]),
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
type DirectionValue = LiuyaoFormValues["divinationDirection"];
type CastingMethodValue = LiuyaoFormValues["castingMethod"];
type ManualLineValue = NonNullable<LiuyaoFormValues["manualLines"][number]>;

const defaultValues: LiuyaoFormValues = {
  name: "",
  gender: "male",
  dateTime: "2026-05-05T08:00",
  divinationDirection: "general",
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
  castingTime: "2026-05-05T08:00"
};

const directionOptions = [
  { label: "感情婚姻", value: "relationship" },
  { label: "人际关系", value: "interpersonal" },
  { label: "事业学业", value: "career" },
  { label: "财运投资", value: "wealth" },
  { label: "合作事务", value: "cooperation" },
  { label: "风险问题", value: "risk" },
  { label: "健康状态", value: "health" },
  { label: "通用决策", value: "general" }
] as const;

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

const directionTopics: Record<DirectionValue, Array<{ title: string; description: string }>> = {
  relationship: [
    { title: "单身姻缘", description: "是否有缘分 · 何时出现对象" },
    { title: "暧昧发展", description: "能否在一起 · 关系会如何发展" },
    { title: "恋人关系", description: "感情状态如何 · 是否稳定长久" },
    { title: "前任复合", description: "是否还有机会 · 能否重新在一起" },
    { title: "婚姻状态", description: "婚姻是否稳定 · 是否存在问题" },
    { title: "分手/离婚判断", description: "是否应该分开 · 分开是否更好" }
  ],
  interpersonal: [
    { title: "关系好坏", description: "对方怎么看你 · 关系真实状态" },
    { title: "是否有小人", description: "是否被针对 · 是否有人暗中影响" },
    { title: "冲突结果", description: "矛盾会如何发展 · 结果会怎样" },
    { title: "人际信任判断", description: "对方是否可信 · 是否值得交往" }
  ],
  career: [
    { title: "是否能入职", description: "是否有机会录用 · 能否顺利入职" },
    { title: "Offer选择", description: "哪个更合适 · 如何做出选择" },
    { title: "工作发展", description: "前景如何 · 是否有发展空间" },
    { title: "升职判断", description: "是否有机会晋升 · 能否提升职位" },
    { title: "是否换工作", description: "是否适合跳槽 · 现在是否应改变" },
    { title: "考试结果", description: "是否能通过 · 结果是否理想" },
    { title: "升学选择", description: "选哪个更好 · 是否适合这个方向" }
  ],
  wealth: [
    { title: "财运走势", description: "最近财运如何 · 收入变化趋势" },
    { title: "投资判断", description: "是否适合投入 · 风险与机会如何" },
    { title: "项目盈利", description: "能否赚钱 · 收益情况如何" },
    { title: "创业判断", description: "是否适合创业 · 成功概率如何" }
  ],
  cooperation: [
    { title: "是否合作", description: "是否适合合作 · 是否值得推进" },
    { title: "合作能否成功", description: "能否谈成 · 合作是否顺利" },
    { title: "合作结果", description: "合作后发展如何 · 结果是好是坏" }
  ],
  risk: [
    { title: "是否有风险", description: "是否存在隐患 · 是否需要谨慎" },
    { title: "官司诉讼", description: "是否有利 · 结果走向如何" },
    { title: "是否被骗", description: "是否存在欺骗 · 是否会受损" },
    { title: "事情发展结果", description: "最终会如何发展 · 结果是好是坏" }
  ],
  health: [
    { title: "健康状况", description: "当前身体情况 · 是否存在问题" },
    { title: "疾病发展", description: "是否会加重 · 后续变化如何" }
  ],
  general: [
    { title: "是否可行", description: "这件事能不能做 · 成功可能性如何" },
    { title: "是否继续", description: "是否应该坚持 · 是否值得继续" },
    { title: "是否选择", description: "哪个更合适 · 如何做出选择" },
    { title: "今天天气", description: "是否适合出行" }
  ]
};

export function LiuyaoHomeClient() {
  const router = useRouter();
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [castingTimePickerOpen, setCastingTimePickerOpen] = useState(false);
  const [directionPickerOpen, setDirectionPickerOpen] = useState(false);
  const [castingMethodPickerOpen, setCastingMethodPickerOpen] = useState(false);
  const [manualLinePickerIndex, setManualLinePickerIndex] = useState<number | null>(null);
  const [selectedTopicTitle, setSelectedTopicTitle] = useState("");
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
  const dateTime = useWatch({ control, name: "dateTime" });
  const divinationDirection = useWatch({ control, name: "divinationDirection" });
  const castingMethod = useWatch({ control, name: "castingMethod" });
  const numberMode = useWatch({ control, name: "numberMode" });
  const textMode = useWatch({ control, name: "textMode" });
  const castingCalendar = useWatch({ control, name: "castingCalendar" });
  const castingTime = useWatch({ control, name: "castingTime" });
  const manualLines = useWatch({ control, name: "manualLines" });

  useEffect(() => {
    const currentTime = formatDateTimeLocal(new Date());
    setValue("dateTime", currentTime);
    setValue("castingTime", currentTime);
    // Run once after hydration so the displayed minute stays stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(values: LiuyaoFormValues) {
    const payload = {
      input: {
        ...values,
        name: values.name?.trim() ?? "",
        directionTopic: selectedTopicTitle,
        question: values.question.trim()
      },
      savedAt: new Date().toISOString()
    };

    window.localStorage.setItem("sm1:current-liuyao-input", JSON.stringify(payload));
    await saveSharedProfile({
      source: "六爻档案",
      name: values.name?.trim() ?? "",
      gender: values.gender,
      dateTime: values.dateTime
    });

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
    <main className="light-surface-text-scope mx-auto min-h-screen max-w-[430px] bg-[#F8F7EE] pb-8 text-ink shadow-soft">
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

          <SharedFormCard>
            <Controller
              name="divinationDirection"
              control={control}
              render={({ field }) => (
                <SharedFieldRow icon={Compass} label="求测方向" error={errors.divinationDirection?.message}>
                  <button
                    type="button"
                    onClick={() => setDirectionPickerOpen(true)}
                    className="flex w-full min-w-0 items-center justify-end gap-1 text-right text-[18px] font-semibold text-[#55514a]"
                    aria-label="选择求测方向"
                  >
                    {formatDirectionLabel(field.value, selectedTopicTitle)}
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
                  <SharedFieldRow icon={CalendarClock} label="历法">
                    <SharedSegmentedPill value={field.value} onChange={field.onChange} options={calendarOptions} ariaLabel="选择起卦历法" />
                  </SharedFieldRow>
                )}
              />
              <SharedFieldRow icon={CalendarClock} label="起卦时间" error={errors.castingTime?.message} last>
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
      <OptionSheet
        open={directionPickerOpen}
        title="选择求测方向"
        options={directionOptions}
        value={divinationDirection}
        onClose={() => setDirectionPickerOpen(false)}
        onSelect={(value, topicTitle) => {
          setValue("divinationDirection", value, { shouldDirty: true, shouldValidate: true });
          setSelectedTopicTitle(topicTitle ?? "");
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
    </main>
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
  onSelect: (value: TValue, topicTitle?: string) => void;
}) {
  const [expandedValue, setExpandedValue] = useState<TValue | null>(null);

  useEffect(() => {
    if (open) {
      setExpandedValue(null);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
      <button className="absolute inset-0 cursor-default" type="button" aria-label="关闭选择弹窗" onClick={onClose} />
      <section className="relative max-h-[70dvh] w-full max-w-[430px] overflow-hidden rounded-t-[18px] bg-[#fffef7] px-5 pb-8 pt-6 shadow-soft">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f0efea] text-[#9b9993]"
          aria-label="关闭"
        >
          <X size={32} strokeWidth={1.8} />
        </button>
        <h2 className="pr-16 text-left text-[22px] font-semibold leading-[3.5rem] text-[#32302d]">{title}</h2>
        <div className="mt-3 max-h-[calc(70dvh-116px)] space-y-4 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {options.map((option) => (
            <div key={option.value}>
              <button
                type="button"
                onClick={() => setExpandedValue((current) => (current === option.value ? null : option.value))}
                className={cn(
                  "relative flex min-h-[62px] w-full items-center rounded-md border border-[#e8e1cf] bg-[#fffef7] px-6 text-left text-[18px] font-semibold text-[#33312e]",
                  "before:absolute before:bottom-0 before:left-0 before:top-0 before:w-1.5 before:rounded-l-md before:bg-[#a58024]",
                  option.value === value && "border-[#d8c8a6] bg-[#f6f0e2]"
                )}
              >
                {option.label}
              </button>
              {expandedValue === option.value ? (
                <div className="rounded-b-md bg-[#f2f0df] px-5 py-4">
                  <div className="space-y-3">
                    {getDirectionTopics(option.value).map((topic) => (
                      <button
                        key={topic.title}
                        type="button"
                        onClick={() => onSelect(option.value, topic.title)}
                        className="grid min-h-[54px] w-full grid-cols-[108px_1fr] items-center rounded-md bg-[#fffef9] px-4 text-left"
                      >
                        <span className="text-[16px] font-semibold text-[#33312e]">{topic.title}</span>
                        <span className="min-w-0 text-[15px] font-semibold text-[#aaa8a1]">{topic.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
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

function formatDirectionLabel(value: DirectionValue, topicTitle: string) {
  const directionLabel = getOptionLabel(directionOptions, value);
  return topicTitle ? `${directionLabel}-${topicTitle}` : directionLabel;
}

function getDirectionTopics<TValue extends string>(value: TValue) {
  return directionTopics[value as DirectionValue] ?? [];
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
