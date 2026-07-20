"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarClock, Check, ChevronDown, Compass, Hand, Hash, Hexagon, Info, MessageSquareText, X } from "lucide-react";
import { Lunar, Solar } from "lunar-typescript";
import { resolveBaziPillars } from "taibu-core/bazi-pillars-resolve";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, type UseFormRegisterReturn, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { SharedFieldRow, SharedFormCard, SharedSegmentedPill, formatDateTimeLocal } from "@/components/shared/divination-profile-card";
import {
  DivinationFormBody,
  DivinationFormShell,
  DivinationSectionHeader,
  DivinationSubmitBar,
  divinationFormCardClass
} from "@/components/shared/divination-form-shell";
import { GanzhiPillarSelector } from "@/components/shared/ganzhi-pillar-selector";
import { castLiuyaoLine, type LiuyaoLine } from "@/lib/liuyao/casting";
import { cn } from "@/lib/utils";

const liuyaoFormSchema = z.object({
  yongShenMode: z.enum(["general", "specific"]),
  yongShenTargets: z.array(z.enum(["妻财", "官鬼", "父母", "子孙", "兄弟"])),
  question: z.string().trim().min(1, "请填写求测问题").max(80, "问题不能超过 80 个字"),
  castingMethod: z.enum(["shake", "number", "manual", "hexagram"]),
  numberMode: z.enum(["two", "three"]),
  numberFirst: z.string().trim(),
  numberSecond: z.string().trim(),
  numberThird: z.string().trim(),
  hexagramCode: z.string().regex(/^[01]{6}$/),
  manualLines: z.array(z.enum(["young-yang", "young-yin", "old-yang", "old-yin"]).nullable()).length(6),
  castingCalendar: z.enum(["solar", "lunar"]),
  castingTime: z.string().min(1, "请选择起卦时间"),
  castingGanzhiYear: z.string().min(2),
  castingGanzhiMonth: z.string().min(2),
  castingGanzhiDay: z.string().min(2),
  castingGanzhiHour: z.string().min(2)
}).superRefine((values, context) => {
  if (values.yongShenMode === "specific" && values.yongShenTargets.length < 1) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["yongShenTargets"],
      message: "请选择分析目标"
    });
  }

  if (values.castingMethod === "number") {
    validateCastingNumber(values.numberFirst, ["numberFirst"], context);
    validateCastingNumber(values.numberSecond, ["numberSecond"], context);
    if (values.numberMode === "three") {
      validateCastingNumber(values.numberThird, ["numberThird"], context);
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
type YongShenMode = LiuyaoFormValues["yongShenMode"];

const defaultValues: LiuyaoFormValues = {
  yongShenMode: "general",
  yongShenTargets: [],
  question: "",
  castingMethod: "shake",
  numberMode: "two",
  numberFirst: "",
  numberSecond: "",
  numberThird: "",
  hexagramCode: "111111",
  manualLines: [null, null, null, null, null, null],
  castingCalendar: "solar",
  castingTime: "",
  castingGanzhiYear: "甲子",
  castingGanzhiMonth: "甲子",
  castingGanzhiDay: "甲子",
  castingGanzhiHour: "甲子"
};

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
  { label: "爻卦", value: "hexagram" }
];

const numberModeOptions = [
  { label: "双数起卦", value: "two" },
  { label: "三数起卦", value: "three" }
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

const hexagramOptions: ReadonlyArray<{ name: string; code: string }> = [
  { name: "乾为天", code: "111111" },
  { name: "坤为地", code: "000000" },
  { name: "水雷屯", code: "100010" },
  { name: "山水蒙", code: "010001" },
  { name: "水天需", code: "111010" },
  { name: "天水讼", code: "010111" },
  { name: "地水师", code: "010000" },
  { name: "水地比", code: "000010" },
  { name: "风天小畜", code: "111011" },
  { name: "天泽履", code: "110111" },
  { name: "地天泰", code: "111000" },
  { name: "天地否", code: "000111" },
  { name: "天火同人", code: "101111" },
  { name: "火天大有", code: "111101" },
  { name: "地山谦", code: "001000" },
  { name: "雷地豫", code: "000100" },
  { name: "泽雷随", code: "100110" },
  { name: "山风蛊", code: "011001" },
  { name: "地泽临", code: "110000" },
  { name: "风地观", code: "000011" },
  { name: "火雷噬嗑", code: "100101" },
  { name: "山火贲", code: "101001" },
  { name: "山地剥", code: "000001" },
  { name: "地雷复", code: "100000" },
  { name: "天雷无妄", code: "100111" },
  { name: "山天大畜", code: "111001" },
  { name: "山雷颐", code: "100001" },
  { name: "泽风大过", code: "011110" },
  { name: "坎为水", code: "010010" },
  { name: "离为火", code: "101101" },
  { name: "泽山咸", code: "001110" },
  { name: "雷风恒", code: "011100" },
  { name: "天山遯", code: "001111" },
  { name: "雷天大壮", code: "111100" },
  { name: "火地晋", code: "000101" },
  { name: "地火明夷", code: "101000" },
  { name: "风火家人", code: "101011" },
  { name: "火泽睽", code: "110101" },
  { name: "水山蹇", code: "001010" },
  { name: "雷水解", code: "010100" },
  { name: "山泽损", code: "110001" },
  { name: "风雷益", code: "100011" },
  { name: "泽天夬", code: "111110" },
  { name: "天风姤", code: "011111" },
  { name: "泽地萃", code: "000110" },
  { name: "地风升", code: "011000" },
  { name: "泽水困", code: "010110" },
  { name: "水风井", code: "011010" },
  { name: "泽火革", code: "101110" },
  { name: "火风鼎", code: "011101" },
  { name: "震为雷", code: "100100" },
  { name: "艮为山", code: "001001" },
  { name: "风山渐", code: "001011" },
  { name: "雷泽归妹", code: "110100" },
  { name: "雷火丰", code: "101100" },
  { name: "火山旅", code: "001101" },
  { name: "巽为风", code: "011011" },
  { name: "兑为泽", code: "110110" },
  { name: "风水涣", code: "010011" },
  { name: "水泽节", code: "110010" },
  { name: "风泽中孚", code: "110011" },
  { name: "雷山小过", code: "001100" },
  { name: "水火既济", code: "101010" },
  { name: "火水未济", code: "010101" }
];

export function LiuyaoHomeClient() {
  const router = useRouter();
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
  const yongShenMode = useWatch({ control, name: "yongShenMode" });
  const castingMethod = useWatch({ control, name: "castingMethod" });
  const numberMode = useWatch({ control, name: "numberMode" });
  const hexagramCode = useWatch({ control, name: "hexagramCode" });
  const castingCalendar = useWatch({ control, name: "castingCalendar" });
  const castingTime = useWatch({ control, name: "castingTime" });
  const castingGanzhiYear = useWatch({ control, name: "castingGanzhiYear" });
  const castingGanzhiMonth = useWatch({ control, name: "castingGanzhiMonth" });
  const castingGanzhiDay = useWatch({ control, name: "castingGanzhiDay" });
  const castingGanzhiHour = useWatch({ control, name: "castingGanzhiHour" });
  const manualLines = useWatch({ control, name: "manualLines" });

  useEffect(() => {
    const now = new Date();
    const currentTime = formatDateTimeLocal(now);
    const currentGanzhi = getGanzhiFromDateTime(currentTime);
    setValue("castingTime", currentTime);
    setValue("castingGanzhiYear", currentGanzhi.year);
    setValue("castingGanzhiMonth", currentGanzhi.month);
    setValue("castingGanzhiDay", currentGanzhi.day);
    setValue("castingGanzhiHour", currentGanzhi.hour);
    // Run once after hydration so the displayed minute stays stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(values: LiuyaoFormValues) {
    const payload = {
      input: {
        ...values,
        yongShenTargets: values.yongShenMode === "general" ? [] : values.yongShenTargets,
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
    <DivinationFormShell title="六爻断事" subtitle="一事一问，推演变化" icon={Hexagon} moduleMark="liuyao" tone="purple">
      <DivinationFormBody>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
          <SharedFormCard className={divinationFormCardClass}>
            <DivinationSectionHeader title="求测信息" description="聚焦所问之事，并选择分析方向" tone="purple" />
            <SharedFieldRow icon={CalendarClock} label="起卦时间" error={errors.castingTime?.message}>
              <button
                type="button"
                onClick={() => setCastingTimePickerOpen(true)}
                className="flex w-full min-w-0 items-center justify-end gap-1 text-right text-[18px] font-semibold text-[#55514a]"
                aria-label="选择起卦时间"
              >
                {formatCastingTimeTrigger(castingCalendar, castingTime, {
                  year: castingGanzhiYear,
                  month: castingGanzhiMonth,
                  day: castingGanzhiDay,
                  hour: castingGanzhiHour
                })}
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
                    {formatYongShenTriggerLabel(yongShenMode, field.value)}
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

          <SharedFormCard className={divinationFormCardClass}>
            <DivinationSectionHeader title="起卦方式" description="选择适合当前情境的起卦方法" tone="purple" />
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
            <SharedFormCard className={divinationFormCardClass}>
              <DivinationSectionHeader title="报数设置" description="输入直觉想到的数字完成起卦" tone="purple" />
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
            <SharedFormCard className={divinationFormCardClass}>
              <DivinationSectionHeader title="指定六爻" description="从上爻到初爻依次确认阴阳与动静" tone="purple" />
              <div className="space-y-2 py-3">
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

          {castingMethod === "hexagram" ? (
            <SharedFormCard className={divinationFormCardClass}>
              <DivinationSectionHeader title="选择爻卦" description="从六十四卦中选择目标卦象" tone="purple" />
              <Controller
                name="hexagramCode"
                control={control}
                render={({ field }) => (
                  <div className="space-y-3 py-3">
                    <div className="grid max-h-[360px] grid-cols-2 gap-2 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {hexagramOptions.map((option) => (
                        <HexagramChoice
                          key={option.name}
                          option={option}
                          selected={field.value === option.code}
                          onSelect={() => field.onChange(option.code)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              />
            </SharedFormCard>
          ) : null}
          </div>

          <DivinationSubmitBar label="开始起卦" busyLabel="起卦中" isBusy={isSubmitting} icon={Hexagon} />

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
      </DivinationFormBody>

      <LiuyaoTimePickerSheet
        open={castingTimePickerOpen}
        calendar={castingCalendar}
        value={castingTime}
        ganzhi={{
          year: castingGanzhiYear,
          month: castingGanzhiMonth,
          day: castingGanzhiDay,
          hour: castingGanzhiHour
        }}
        ariaLabel="关闭起卦时间选择"
        onClose={() => setCastingTimePickerOpen(false)}
        onConfirm={(nextValue) => {
          setValue("castingCalendar", nextValue.calendar, { shouldDirty: true, shouldValidate: true });
          setValue("castingTime", nextValue.value, { shouldDirty: true, shouldValidate: true });
          setValue("castingGanzhiYear", nextValue.ganzhi.year, { shouldDirty: true, shouldValidate: true });
          setValue("castingGanzhiMonth", nextValue.ganzhi.month, { shouldDirty: true, shouldValidate: true });
          setValue("castingGanzhiDay", nextValue.ganzhi.day, { shouldDirty: true, shouldValidate: true });
          setValue("castingGanzhiHour", nextValue.ganzhi.hour, { shouldDirty: true, shouldValidate: true });
          setCastingTimePickerOpen(false);
        }}
      />
      <YongShenSheet
        open={directionPickerOpen}
        title="选择分析目标"
        mode={yongShenMode}
        value={yongShenTargets}
        onClose={() => setDirectionPickerOpen(false)}
        onConfirm={(nextValue) => {
          setValue("yongShenMode", nextValue.mode, { shouldDirty: true, shouldValidate: true });
          setValue("yongShenTargets", nextValue.targets, { shouldDirty: true, shouldValidate: true });
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
    </DivinationFormShell>
  );
}

function YongShenSheet({
  open,
  title,
  mode,
  value,
  onClose,
  onConfirm
}: {
  open: boolean;
  title: string;
  mode: YongShenMode;
  value: YongShenValue[];
  onClose: () => void;
  onConfirm: (value: { mode: YongShenMode; targets: YongShenValue[] }) => void;
}) {
  const [draftMode, setDraftMode] = useState<YongShenMode>(mode);
  const [draftValue, setDraftValue] = useState<YongShenValue[]>(value);

  useEffect(() => {
    if (open) {
      setDraftMode(mode);
      setDraftValue(value);
    }
  }, [mode, open, value]);

  if (!open) {
    return null;
  }

  function toggleOption(nextValue: YongShenOptionValue) {
    if (nextValue === "通用") {
      setDraftMode("general");
      setDraftValue([]);
      return;
    }

    setDraftMode("specific");
    setDraftValue((current) => {
      return current.length === 1 && current[0] === nextValue ? [] : [nextValue];
    });
  }

  function handleConfirm() {
    onConfirm({ mode: draftMode, targets: draftMode === "general" ? [] : draftValue });
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
            const generalSelected = draftMode === "general";
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
          <p className="min-w-0 truncate text-[12px] text-[var(--liuyao-sheet-muted)]">已选：{formatYongShenLabel(draftMode, draftValue)}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setDraftMode("specific");
                setDraftValue([]);
              }}
              className="h-9 rounded-md border border-[var(--liuyao-sheet-border)] px-4 text-[13px] font-semibold"
            >
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

function formatYongShenLabel(mode: YongShenMode, value: readonly YongShenValue[]) {
  if (mode === "general") {
    return "通用";
  }

  if (!value.length) {
    return "未选择";
  }

  return value.join("、");
}

function formatYongShenTriggerLabel(mode: YongShenMode, value: readonly YongShenValue[]) {
  if (mode === "general") {
    return "通用分析";
  }

  return value.length ? `分析目标 ${value.length} 项` : "选择分析目标";
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

type GanzhiSelection = {
  year: string;
  month: string;
  day: string;
  hour: string;
};

type LiuyaoTimePickerResult = {
  calendar: LiuyaoFormValues["castingCalendar"];
  value: string;
  ganzhi: GanzhiSelection;
};

const PICKER_ITEM_HEIGHT = 48;
function LiuyaoTimePickerSheet({
  open,
  calendar,
  value,
  ganzhi,
  onClose,
  onConfirm,
  ariaLabel = "关闭时间选择"
}: {
  open: boolean;
  calendar: LiuyaoFormValues["castingCalendar"];
  value: string;
  ganzhi: GanzhiSelection;
  onClose: () => void;
  onConfirm: (value: LiuyaoTimePickerResult) => void;
  ariaLabel?: string;
}) {
  const [draftCalendar, setDraftCalendar] = useState<LiuyaoFormValues["castingCalendar"]>(calendar);
  const [draftTime, setDraftTime] = useState(() => parseDateTimeLocalParts(value));
  const [draftGanzhi, setDraftGanzhi] = useState<GanzhiSelection>(ganzhi);
  const [resolveError, setResolveError] = useState("");
  const [resolving, setResolving] = useState(false);
  const years = useMemo(() => buildNumberRange(1920, 2050), []);
  const months = useMemo(() => buildNumberRange(1, 12), []);
  const hours = useMemo(() => buildNumberRange(0, 23), []);
  const minutes = useMemo(() => buildNumberRange(0, 59), []);
  const days = useMemo(() => buildNumberRange(1, getDaysInMonth(draftTime.year, draftTime.month)), [draftTime.month, draftTime.year]);

  useEffect(() => {
    if (open) {
      setDraftCalendar(calendar);
      setDraftTime(parseDateTimeLocalParts(value));
      setDraftGanzhi(ganzhi);
      setResolveError("");
      setResolving(false);
    }
  }, [calendar, ganzhi, open, value]);

  useEffect(() => {
    const maxDay = getDaysInMonth(draftTime.year, draftTime.month);
    if (draftTime.day > maxDay) {
      setDraftTime((current) => ({ ...current, day: maxDay }));
    }
  }, [draftTime.day, draftTime.month, draftTime.year]);

  if (!open) {
    return null;
  }

  const updateTime = (key: keyof TimeParts, nextValue: number) => {
    setDraftTime((current) => ({ ...current, [key]: nextValue }));
  };

  const handleConfirm = async () => {
    const nextValue = toDateTimeValue(draftTime);
    let resolvedValue = nextValue;

    if (draftCalendar === "lunar") {
      setResolving(true);
      setResolveError("");
      try {
        const result = await resolveBaziPillars({
          yearPillar: draftGanzhi.year,
          monthPillar: draftGanzhi.month,
          dayPillar: draftGanzhi.day,
          hourPillar: draftGanzhi.hour
        });
        const referenceTime = new Date(nextValue).getTime();
        const candidates = result.candidates
          .map((candidate) => ({ ...candidate, time: new Date(candidate.solarText.replace(" ", "T")).getTime() }))
          .filter((candidate) => Number.isFinite(candidate.time));
        const nearest = candidates.reduce<(typeof candidates)[number] | undefined>((best, candidate) => {
          if (!best) return candidate;
          return Math.abs(candidate.time - referenceTime) < Math.abs(best.time - referenceTime) ? candidate : best;
        }, undefined);

        if (!nearest) {
          setResolveError("没有找到匹配时间，请检查四柱组合。");
          return;
        }
        resolvedValue = nearest.solarText.replace(" ", "T");
      } catch (error) {
        setResolveError(error instanceof Error ? error.message : "四柱反查失败，请稍后再试。");
        return;
      } finally {
        setResolving(false);
      }
    }

    onConfirm({
      calendar: draftCalendar,
      value: resolvedValue,
      ganzhi: draftCalendar === "solar" ? getGanzhiFromDateTime(resolvedValue) : draftGanzhi
    });
  };

  const handleToday = () => {
    const nowValue = formatDateTimeLocal(new Date());
    onConfirm({
      calendar: draftCalendar,
      value: nowValue,
      ganzhi: getGanzhiFromDateTime(nowValue)
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65">
      <button className="absolute inset-0 cursor-default" type="button" aria-label={ariaLabel} onClick={onClose} />
      <section className="relative w-full max-w-[430px] rounded-t-[28px] bg-white px-5 pb-8 pt-7 shadow-soft">
        <div className="grid h-12 grid-cols-2 rounded-full bg-[#f4f4f3] p-1">
          {calendarOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setDraftCalendar(option.value)}
              className={cn(
                "flex items-center justify-center rounded-full text-[18px] font-semibold transition-colors",
                draftCalendar === option.value ? "bg-white text-ink shadow-sm" : "text-[#8b8985]"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {draftCalendar === "solar" ? (
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
              <PickerColumn values={years} selected={draftTime.year} onSelect={(nextValue) => updateTime("year", nextValue)} />
              <PickerColumn values={months} selected={draftTime.month} onSelect={(nextValue) => updateTime("month", nextValue)} padValue />
              <PickerColumn values={days} selected={draftTime.day} onSelect={(nextValue) => updateTime("day", nextValue)} padValue />
              <PickerColumn values={hours} selected={draftTime.hour} onSelect={(nextValue) => updateTime("hour", nextValue)} padValue />
              <PickerColumn values={minutes} selected={draftTime.minute} onSelect={(nextValue) => updateTime("minute", nextValue)} padValue />
            </div>
          </div>
        ) : (
          <div className="mt-6 border-t border-[#f0f0ef] pt-4">
            <GanzhiPillarSelector
              value={{
                yearPillar: draftGanzhi.year,
                monthPillar: draftGanzhi.month,
                dayPillar: draftGanzhi.day,
                hourPillar: draftGanzhi.hour
              }}
              onChange={(nextValue) => setDraftGanzhi({
                year: nextValue.yearPillar,
                month: nextValue.monthPillar,
                day: nextValue.dayPillar,
                hour: nextValue.hourPillar
              })}
            />
          </div>
        )}

        {resolveError ? <p className="mt-3 text-center text-sm font-semibold text-red-600" role="alert">{resolveError}</p> : null}

        <div className="mt-5 grid grid-cols-[1fr_1.35fr] items-center gap-3">
          <button
            type="button"
            onClick={handleToday}
            className="h-12 rounded-full bg-[#f4f4f3] text-[18px] font-semibold text-ink"
          >
            今
          </button>
          <button
            type="button"
            disabled={resolving}
            onClick={() => void handleConfirm()}
            className="h-12 rounded-full bg-black text-[20px] font-semibold text-[#e8d4a7]"
          >
            {resolving ? "正在反查" : "确定"}
          </button>
        </div>
      </section>
    </div>
  );
}

type TimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

function PickerColumn<TValue extends string | number>({
  values,
  selected,
  onSelect,
  padValue
}: {
  values: TValue[];
  selected: TValue;
  onSelect: (value: TValue) => void;
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
          key={String(item)}
          type="button"
          onClick={() => onSelect(item)}
          className={cn(
            "flex h-12 w-full snap-center items-center justify-center text-center text-[20px] font-semibold transition-colors",
            item === selected ? "text-[26px] text-black" : "text-[#d1d1d1]"
          )}
        >
          {typeof item === "number" && padValue ? pad(item) : item}
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

function HexagramChoice({
  option,
  selected,
  onSelect
}: {
  option: { name: string; code: string };
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "grid min-h-[58px] grid-cols-[1fr_42px] items-center gap-2 rounded-lg border px-3 text-left transition-colors",
        selected ? "border-black bg-black text-[#e8d4a7]" : "border-[#e8e1cf] bg-[#fffef7] text-[#55514a]"
      )}
      aria-pressed={selected}
    >
      <span className="text-[15px] font-semibold leading-tight">{option.name}</span>
      <span className="flex flex-col-reverse items-center justify-center gap-[2px]" aria-hidden="true">
        {option.code.split("").map((line, index) => (
          <span key={`${option.code}-${index}`} className={line === "1" ? "h-[3px] w-8 rounded-full bg-current" : "flex w-8 gap-1"}>
            {line === "0" ? (
              <>
                <span className="h-[3px] flex-1 rounded-full bg-current" />
                <span className="h-[3px] flex-1 rounded-full bg-current" />
              </>
            ) : null}
          </span>
        ))}
      </span>
    </button>
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

  if (values.castingMethod === "hexagram") {
    return hexagramCodeToLiuyaoLines(values.hexagramCode);
  }

  return Array.from({ length: 6 }, (_, index) => castLiuyaoLine(index + 1));
}

function hexagramCodeToLiuyaoLines(code: string): LiuyaoLine[] {
  return code.split("").map((symbol, index) => symbolToLiuyaoLine(symbol, index + 1, false));
}

function buildTimeCastingLines(values: LiuyaoFormValues): LiuyaoLine[] {
  if (values.castingCalendar === "lunar") {
    return buildGanzhiTimeCastingLines(values);
  }

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

function buildGanzhiTimeCastingLines(values: Pick<LiuyaoFormValues, "castingGanzhiYear" | "castingGanzhiMonth" | "castingGanzhiDay" | "castingGanzhiHour">): LiuyaoLine[] {
  const yearBranchNumber = getBranchNumber(getGanzhiBranch(values.castingGanzhiYear));
  const monthNumber = getBranchNumber(getGanzhiBranch(values.castingGanzhiMonth));
  const dayNumber = getBranchNumber(getGanzhiBranch(values.castingGanzhiDay));
  const hourBranchNumber = getBranchNumber(getGanzhiBranch(values.castingGanzhiHour));
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

function formatCastingTimeTrigger(calendar: LiuyaoFormValues["castingCalendar"], value: string, ganzhi: GanzhiSelection) {
  if (calendar === "lunar") {
    return `${ganzhi.year} ${ganzhi.month} ${ganzhi.day} ${ganzhi.hour}`;
  }

  return formatDateTimeText(value);
}

function getGanzhiFromDateTime(value: string): GanzhiSelection {
  try {
    const date = parseDateTimeLocal(value);
    return getGanzhiFromTimeParts(date);
  } catch {
    return {
      year: "甲子",
      month: "甲子",
      day: "甲子",
      hour: "甲子"
    };
  }
}

function getGanzhiFromTimeParts(date: TimeParts): GanzhiSelection {
  const lunar = Solar.fromYmdHms(date.year, date.month, date.day, date.hour, date.minute, 0).getLunar();

  return {
    year: `${lunar.getYearGan()}${lunar.getYearZhi()}`,
    month: `${lunar.getMonthGan()}${lunar.getMonthZhi()}`,
    day: `${lunar.getDayGan()}${lunar.getDayZhi()}`,
    hour: `${lunar.getTimeGan()}${lunar.getTimeZhi()}`
  };
}

function parseDateTimeLocalParts(value: string): TimeParts {
  try {
    return parseDateTimeLocal(value);
  } catch {
    return parseDateTimeLocal(formatDateTimeLocal(new Date()));
  }
}

function toDateTimeValue(value: TimeParts) {
  return `${value.year}-${pad(value.month)}-${pad(value.day)}T${pad(value.hour)}:${pad(value.minute)}`;
}

function buildNumberRange(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function getGanzhiBranch(value: string) {
  return value.slice(-1);
}
