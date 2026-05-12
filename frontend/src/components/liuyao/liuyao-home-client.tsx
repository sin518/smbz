"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ChevronDown, Compass, Hand, MessageSquareText, X } from "lucide-react";
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
import { cn } from "@/lib/utils";

const liuyaoFormSchema = z.object({
  name: z.string().trim().max(20, "姓名不能超过 20 个字").optional(),
  gender: z.enum(["male", "female"]),
  dateTime: z.string().min(1, "请选择出生时间"),
  divinationDirection: z.enum(["general", "career", "wealth", "relationship", "health", "cooperation", "interpersonal", "risk"]),
  question: z.string().trim().min(1, "请填写求测问题").max(80, "问题不能超过 80 个字"),
  castingMethod: z.enum(["shake"])
});

type LiuyaoFormValues = z.infer<typeof liuyaoFormSchema>;
type DirectionValue = LiuyaoFormValues["divinationDirection"];

const defaultValues: LiuyaoFormValues = {
  name: "",
  gender: "male",
  dateTime: "2026-05-05T08:00",
  divinationDirection: "general",
  question: "",
  castingMethod: "shake"
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
    { title: "是否选择", description: "哪个更合适 · 如何做出选择" }
  ]
};

export function LiuyaoHomeClient() {
  const router = useRouter();
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [directionPickerOpen, setDirectionPickerOpen] = useState(false);
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

  useEffect(() => {
    setValue("dateTime", formatDateTimeLocal(new Date()));
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
    router.push("/liuyao/shake");
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
            <SharedFieldRow icon={Hand} label="起卦方式" last>
              <span className="block text-right text-[18px] font-semibold text-[#55514a]">摇卦</span>
            </SharedFieldRow>
          </SharedFormCard>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mx-auto mt-10 block h-14 w-[68%] rounded-full bg-black text-[22px] font-semibold text-[#e8d4a7] shadow-soft disabled:opacity-70"
          >
            开始摇卦
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

function formatDirectionLabel(value: DirectionValue, topicTitle: string) {
  const directionLabel = getOptionLabel(directionOptions, value);
  return topicTitle ? `${directionLabel}-${topicTitle}` : directionLabel;
}

function getDirectionTopics<TValue extends string>(value: TValue) {
  return directionTopics[value as DirectionValue] ?? [];
}
