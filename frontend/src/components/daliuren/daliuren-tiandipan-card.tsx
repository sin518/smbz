import type { DaliurenOutput } from "taibu-core/daliuren";
import {
  buildDaliurenGongAriaLabel,
  formatDaliurenCourseLabel,
  getDaliurenHourBranch,
  getDaliurenTransmissionStates,
  type DaliurenTransmissionState
} from "@/lib/daliuren/plate";
import { cn } from "@/lib/utils";

type GongInfo = DaliurenOutput["gongInfos"][number];

const platePositions = [
  { zhi: "巳", className: "col-start-1 row-start-1" },
  { zhi: "午", className: "col-start-2 row-start-1" },
  { zhi: "未", className: "col-start-3 row-start-1" },
  { zhi: "申", className: "col-start-4 row-start-1" },
  { zhi: "辰", className: "col-start-1 row-start-2" },
  { zhi: "酉", className: "col-start-4 row-start-2" },
  { zhi: "卯", className: "col-start-1 row-start-3" },
  { zhi: "戌", className: "col-start-4 row-start-3" },
  { zhi: "寅", className: "col-start-1 row-start-4" },
  { zhi: "丑", className: "col-start-2 row-start-4" },
  { zhi: "子", className: "col-start-3 row-start-4" },
  { zhi: "亥", className: "col-start-4 row-start-4" }
] as const;

const transmissionLabels: Record<DaliurenTransmissionState, string> = {
  chu: "初",
  zhong: "中",
  mo: "末"
};

export function DaliurenTianDiPanCard({ chart }: { chart: DaliurenOutput }) {
  const hourBranch = getDaliurenHourBranch(chart.dateInfo.ganZhi.hour);
  const courseLabel = formatDaliurenCourseLabel(chart.keTi.method, chart.sanChuan.method);
  const diurnalLabel = chart.dateInfo.diurnal ? "昼占" : "夜占";

  return (
    <section className="rounded-[16px] bg-[var(--daliuren-card-bg)] px-3 py-3 shadow-soft">
      <div className="flex items-center justify-between">
        <h2 className="text-[14px] font-semibold text-[var(--daliuren-title)]">天地盘</h2>
        <span className="text-[13px] font-semibold text-[var(--daliuren-title)]">十二位</span>
      </div>

      <div
        className="daliuren-plate relative mt-2 grid min-h-[344px] grid-cols-4 grid-rows-4 gap-1 rounded-xl border p-1.5"
        role="group"
        aria-label="大六壬天地盘十二位"
      >
        <div
          className="daliuren-plate-center col-start-2 col-end-4 row-start-2 row-end-4 flex flex-col items-center justify-center rounded-[6px] border px-2 text-center"
          role="group"
          aria-label={`月将加时，${chart.dateInfo.yueJiang}将加${hourBranch}时，${courseLabel}，${diurnalLabel}`}
        >
          <div aria-hidden="true">
            <p className="text-[10px] font-semibold tracking-[0.12em] text-[var(--daliuren-plate-muted)]">月将加时</p>
            <p className="mt-2 text-[15px] font-semibold leading-snug text-[var(--daliuren-plate-primary)]">
              {chart.dateInfo.yueJiang}将加{hourBranch}时
            </p>
            <p className="mt-1 text-[11px] font-semibold text-[var(--daliuren-plate-accent)]">
              {courseLabel} · {diurnalLabel}
            </p>
          </div>
        </div>

        {platePositions.map((position) => {
          const gong = chart.gongInfos.find((item) => item.diZhi === position.zhi);
          return gong ? (
            <DaliurenGongCell
              key={position.zhi}
              gong={gong}
              chart={chart}
              positionClassName={position.className}
            />
          ) : null;
        })}
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] font-semibold text-[var(--daliuren-muted)]" aria-label="盘面状态图例">
        <LegendDot state="chu" label="初传" />
        <LegendDot state="zhong" label="中传" />
        <LegendDot state="mo" label="末传" />
        <span className="flex items-center gap-1">
          <KongWangMark ariaHidden />
          空亡
        </span>
      </div>
    </section>
  );
}

function DaliurenGongCell({
  gong,
  chart,
  positionClassName
}: {
  gong: GongInfo;
  chart: DaliurenOutput;
  positionClassName: string;
}) {
  const transmissionStates = getDaliurenTransmissionStates(chart, gong.tianZhi);
  const primaryTransmission = transmissionStates[0] ?? "none";
  const isKongWang = chart.dateInfo.kongWang.includes(gong.tianZhi);
  const tianJiang = gong.tianJiang || gong.tianJiangShort || "-";

  return (
    <div
      className={cn("daliuren-gong-cell min-w-0 rounded-[6px] border px-1 py-1.5 text-center", positionClassName)}
      data-primary-transmission={primaryTransmission}
      role="group"
      aria-label={buildDaliurenGongAriaLabel({
        diZhi: gong.diZhi,
        tianZhi: gong.tianZhi,
        tianJiang,
        dunGan: gong.dunGan,
        wangShuai: gong.wangShuai,
        changSheng: gong.changSheng,
        transmissionStates,
        isKongWang
      })}
    >
      <div aria-hidden="true">
        <div className="flex min-w-0 items-center justify-between gap-0.5">
          <p className={cn("min-w-0 truncate text-[10px] font-semibold leading-none", getTianJiangTone(tianJiang))}>
            {tianJiang}
          </p>
          {transmissionStates.length > 0 ? <TransmissionBadge states={transmissionStates} /> : null}
        </div>
        <p className="mt-1 flex items-center justify-center gap-1 text-[18px] font-semibold leading-none text-[var(--daliuren-plate-primary)]">
          <span>{gong.tianZhi || "-"}</span>
          {isKongWang ? <KongWangMark ariaHidden /> : null}
        </p>
        <p className="daliuren-gong-meta mt-1 truncate font-semibold leading-none text-[var(--daliuren-plate-secondary)]">
          地{gong.diZhi || "-"} · 遁{gong.dunGan || "—"}
        </p>
        <p className="mt-1 truncate text-[9px] font-semibold leading-none text-[var(--daliuren-plate-muted)]">
          {gong.wangShuai || "—"} · {gong.changSheng || "—"}
        </p>
      </div>
    </div>
  );
}

function TransmissionBadge({ states }: { states: DaliurenTransmissionState[] }) {
  return (
    <span className="daliuren-transmission-badge inline-flex shrink-0 items-center overflow-hidden rounded-sm border">
      {states.map((state, index) => (
        <span
          key={state}
          className={cn("px-0.5 text-[8px] font-bold leading-[12px]", index > 0 && "border-l border-current/30")}
          data-transmission={state}
        >
          {transmissionLabels[state]}
        </span>
      ))}
    </span>
  );
}

function LegendDot({ state, label }: { state: DaliurenTransmissionState; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <i className="daliuren-legend-dot h-2 w-2 rounded-full" data-transmission={state} aria-hidden="true" />
      {label}
    </span>
  );
}

function KongWangMark({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <span
      className="daliuren-kongwang-mark inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[8px] font-bold leading-none"
      aria-hidden={ariaHidden || undefined}
      aria-label={ariaHidden ? undefined : "空亡"}
    >
      空
    </span>
  );
}

function getTianJiangTone(value: string) {
  if (["青龙", "龙", "六合", "合"].includes(value)) {
    return "text-[var(--daliuren-wood)]";
  }
  if (["朱雀", "雀", "腾蛇", "蛇"].includes(value)) {
    return "text-[var(--daliuren-fire)]";
  }
  if (["勾陈", "勾", "贵人", "贵", "太常", "常"].includes(value)) {
    return "text-[var(--daliuren-earth)]";
  }
  if (["白虎", "虎", "太阴", "阴"].includes(value)) {
    return "text-[var(--daliuren-metal)]";
  }
  if (["玄武", "武", "天后", "后"].includes(value)) {
    return "text-[var(--daliuren-water)]";
  }
  return "text-[var(--daliuren-plate-muted)]";
}
