import type { QimenOutput } from "taibu-core/qimen";

type QimenChart = QimenOutput;
type QimenPalace = QimenChart["palaces"][number];
type ChangShengStage = QimenPalace["heavenStemChangSheng"][number]["stages"][number]["stage"];

const PALACE_DISPLAY_ORDER = [4, 9, 2, 3, 5, 7, 8, 1, 6];

const ELEMENT_LEGEND = [
  { label: "木", representativeStem: "甲" },
  { label: "火", representativeStem: "丙" },
  { label: "水", representativeStem: "壬" },
  { label: "金", representativeStem: "庚" },
  { label: "土", representativeStem: "戊" }
] as const;

const STEM_ELEMENT: Record<string, "木" | "火" | "土" | "金" | "水"> = {
  甲: "木",
  乙: "木",
  丙: "火",
  丁: "火",
  戊: "土",
  己: "土",
  庚: "金",
  辛: "金",
  壬: "水",
  癸: "水"
};

const ELEMENT_TEXT_CLASS: Record<string, string> = {
  木: "text-[var(--qimen-wood)]",
  火: "text-[var(--qimen-fire)]",
  水: "text-[var(--qimen-water)]",
  金: "text-[var(--qimen-metal)]",
  土: "text-[var(--qimen-earth)]"
};

const ELEMENT_BG_CLASS: Record<string, string> = {
  木: "bg-[var(--qimen-wood)]",
  火: "bg-[var(--qimen-fire)]",
  水: "bg-[var(--qimen-water)]",
  金: "bg-[var(--qimen-metal)]",
  土: "bg-[var(--qimen-earth)]"
};

const CHANG_SHENG_SHORT: Record<ChangShengStage, string> = {
  长生: "生",
  沐浴: "浴",
  冠带: "冠",
  临官: "官",
  帝旺: "旺",
  衰: "衰",
  病: "病",
  死: "死",
  墓: "墓",
  绝: "绝",
  胎: "胎",
  养: "养"
};

export function QimenPalacePanel({ chart }: { chart: QimenChart }) {
  const globalFormations = chart.globalFormations.filter((item) => item.startsWith("全局"));
  const palaceFormations = chart.globalFormations.filter((item) => !item.startsWith("全局"));

  return (
    <>
      <section className="border-y border-[var(--qimen-rule)] py-2.5" aria-labelledby="qimen-month-phase-title">
        <h2 id="qimen-month-phase-title" className="text-[11px] font-medium tracking-[0.12em] text-[var(--qimen-muted)]">
          月令旺衰
        </h2>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--qimen-secondary)]">
          {ELEMENT_LEGEND.map((item) => (
            <span key={item.label} className="flex items-center gap-1">
              <i className={`h-1.5 w-1.5 rounded-full ${ELEMENT_BG_CLASS[item.label]}`} aria-hidden="true" />
              {item.label}{chart.monthPhase?.[item.representativeStem] ?? ""}
            </span>
          ))}
        </div>
      </section>

      <div className="mt-3 overflow-hidden rounded-[10px] border border-[var(--qimen-grid-border)] bg-[var(--qimen-grid-border)]">
        <div className="grid auto-rows-fr grid-cols-3 gap-px">
          {getDisplayPalaces(chart).map((palace) => (
            <QimenPalaceCell key={palace.palaceIndex} chart={chart} palace={palace} />
          ))}
        </div>
      </div>

      <section className="mt-4 border-y border-[var(--qimen-rule)] py-3" aria-labelledby="qimen-plate-highlights-title">
        <h2 id="qimen-plate-highlights-title" className="text-[12px] font-semibold tracking-[0.08em] text-[var(--qimen-primary)]">
          盘面要点
        </h2>
        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] leading-4">
          <PlateDetail label="旬首" value={chart.xunShou} />
          <PlateDetail label="值符" value={`${chart.zhiFu.star} · ${formatPalaceRef(chart, chart.zhiFu.palace)}`} />
          <PlateDetail label="值使" value={`${chart.zhiShi.gate} · ${formatPalaceRef(chart, chart.zhiShi.palace)}`} />
          <PlateDetail label="全局" value={globalFormations.map(trimFormationPrefix).join("、") || "暂无"} />
        </dl>
        <div className="mt-2 border-t border-[var(--qimen-rule)] pt-2 text-[11px] leading-5">
          <span className="text-[var(--qimen-muted)]">宫内格局</span>
          <p className="mt-0.5 text-[var(--qimen-secondary)]">
            {palaceFormations.map(formatFormation).join("、") || "暂无明显宫内格局"}
          </p>
        </div>
      </section>
    </>
  );
}

function QimenPalaceCell({ chart, palace }: { chart: QimenChart; palace: QimenPalace }) {
  const coordinateLabels = getCoordinateLabels(chart, palace.palaceIndex);

  if (palace.palaceIndex === 5) {
    return (
      <section
        className="flex min-h-[184px] flex-col bg-[var(--qimen-cell-bg)] p-1.5 text-[var(--qimen-secondary)]"
        aria-label={`${palace.palaceName}${palace.palaceIndex}宫`}
      >
        <PalaceHeader palace={palace} coordinateLabels={coordinateLabels} />
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="text-[11px] text-[var(--qimen-muted)]">{chart.dunType === "yang" ? "阳遁" : "阴遁"}</p>
          <p className="mt-1 text-[20px] font-semibold leading-none text-[var(--qimen-primary)]">{chart.juNumber}局</p>
          <p className="mt-3 flex items-center gap-1 text-[11px]">
            <span className="text-[9px] text-[var(--qimen-muted)]">地</span>
            <StemText stem={palace.earthStem} size="small" />
          </p>
          <p className="mt-1.5 text-[9px] text-[var(--qimen-muted)]">寄宫参看</p>
        </div>
      </section>
    );
  }

  const statuses = getStatusLabels(chart, palace);
  const heavenStems = palace.heavenStems?.length ? palace.heavenStems : [palace.heavenStem].filter(Boolean);

  return (
    <section
      className="flex min-h-[184px] min-w-0 flex-col bg-[var(--qimen-cell-bg)] p-1.5 text-[var(--qimen-secondary)]"
      aria-label={`${palace.palaceName}${palace.palaceIndex}宫`}
    >
      <PalaceHeader palace={palace} coordinateLabels={coordinateLabels} />

      <div className="mt-2 flex min-w-0 items-start justify-between gap-1">
        <p className="flex min-w-0 items-baseline gap-1">
          <span className="shrink-0 text-[9px] text-[var(--qimen-muted)]">天</span>
          <span className="flex min-w-0 items-center gap-0.5">
            {heavenStems.map((stem, index) => (
              <span key={`${stem}-${index}`} className="contents">
                {index > 0 ? <span className="text-[11px] text-[var(--qimen-muted)]">·</span> : null}
                <StemText stem={stem} />
              </span>
            ))}
          </span>
        </p>
        <p className="shrink-0 whitespace-nowrap text-[10px] text-[var(--qimen-deity)]">{palace.deity || "-"}</p>
      </div>

      <div className="mt-1 min-h-[14px] space-y-0.5 text-[9px] leading-[1.35] text-[var(--qimen-muted)]">
        {palace.heavenStemChangSheng.map((entry) => (
          <p key={entry.stem} className="truncate" title={formatChangShengFull(entry)}>
            {palace.heavenStemChangSheng.length > 1 ? `${entry.stem}｜` : ""}
            {entry.stages.map(({ branch, stage }) => `${branch}${CHANG_SHENG_SHORT[stage]}`).join(" · ")}
          </p>
        ))}
      </div>

      <p className="mt-2 text-[13px] font-semibold leading-4 text-[var(--qimen-primary)]">
        {palace.gate || "-"}
        <span className="ml-0.5 text-[9px] font-normal text-[var(--qimen-muted)]">·{palace.gateElement || "-"}</span>
      </p>
      <p className="mt-0.5 text-[11px] leading-4 text-[var(--qimen-secondary)]">
        {palace.star || "-"}
        <span className="ml-0.5 text-[9px] text-[var(--qimen-muted)]">·{palace.starElement || "-"}</span>
      </p>

      <div className="mt-auto flex min-w-0 items-end justify-between gap-1 pt-2">
        <p className="flex items-baseline gap-1">
          <span className="text-[9px] text-[var(--qimen-muted)]">地</span>
          <StemText stem={palace.earthStem} size="small" />
        </p>
        <div className="flex min-w-0 flex-wrap justify-end gap-0.5">
          {statuses.map((status) => (
            <span
              key={status}
              className="rounded-[3px] border border-[var(--qimen-status-border)] px-1 py-0.5 text-[8px] leading-none text-[var(--qimen-status-text)]"
            >
              {status}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function PalaceHeader({ palace, coordinateLabels }: { palace: QimenPalace; coordinateLabels: string[] }) {
  return (
    <header className="flex min-w-0 items-start justify-between gap-1 text-[9px] leading-3">
      <span className="truncate tracking-[0.08em] text-[var(--qimen-muted)]">
        {palace.palaceName}{palace.palaceIndex} · {palace.element}
      </span>
      {coordinateLabels.length ? (
        <span className="shrink-0 rounded-[3px] border border-[var(--qimen-coordinate-border)] bg-[var(--qimen-coordinate-bg)] px-1 py-0.5 font-semibold text-[var(--qimen-coordinate-text)]">
          {coordinateLabels.join("·")}
        </span>
      ) : null}
    </header>
  );
}

function StemText({ stem, size = "large" }: { stem: string | undefined; size?: "large" | "small" }) {
  const element = stem ? STEM_ELEMENT[stem] : undefined;
  return (
    <span
      className={`${size === "large" ? "text-[18px]" : "text-[15px]"} font-semibold leading-none ${element ? ELEMENT_TEXT_CLASS[element] : "text-[var(--qimen-muted)]"}`}
    >
      {stem || "-"}
    </span>
  );
}

function PlateDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[var(--qimen-muted)]">{label}</dt>
      <dd className="mt-0.5 break-words font-medium text-[var(--qimen-primary)]">{value}</dd>
    </div>
  );
}

function getDisplayPalaces(chart: QimenChart) {
  return PALACE_DISPLAY_ORDER
    .map((palaceIndex) => chart.palaces.find((palace) => palace.palaceIndex === palaceIndex))
    .filter((palace): palace is QimenPalace => Boolean(palace));
}

function getCoordinateLabels(chart: QimenChart, palaceIndex: number) {
  return [
    chart.nianMingPalace?.palaceIndex === palaceIndex ? "命" : null,
    chart.dayStemPalace?.palaceIndex === palaceIndex ? "日" : null,
    chart.hourStemPalace?.palaceIndex === palaceIndex ? "时" : null
  ].filter((label): label is string => Boolean(label));
}

function getStatusLabels(chart: QimenChart, palace: QimenPalace) {
  return [
    chart.kongWang.dayKong.palaces.includes(palace.palaceIndex) ? "日空" : null,
    chart.kongWang.hourKong.palaces.includes(palace.palaceIndex) ? "时空" : null,
    palace.isYiMa ? "马" : null,
    palace.isRuMu ? "入墓" : null
  ].filter((label): label is string => Boolean(label));
}

function formatChangShengFull(entry: QimenPalace["heavenStemChangSheng"][number]) {
  return `${entry.stem}：${entry.stages.map(({ branch, stage }) => `${branch}${stage}`).join("、")}`;
}

function formatPalaceRef(chart: QimenChart, palaceIndex: number) {
  const palace = chart.palaces.find((item) => item.palaceIndex === palaceIndex);
  return `${palace?.palaceName || ""}${palaceIndex}宫`;
}

function trimFormationPrefix(value: string) {
  return value.replace(/^全局/, "") || value;
}

function formatFormation(value: string) {
  return value.replace(/宫[:：]\s*/u, "宫·");
}
