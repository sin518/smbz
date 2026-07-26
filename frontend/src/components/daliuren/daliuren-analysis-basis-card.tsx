import { CircleAlert, ListChecks } from "lucide-react";
import type { DaliurenOutput } from "taibu-core/daliuren";

export function DaliurenAnalysisBasisCard({ chart }: { chart: DaliurenOutput }) {
  const { guiRen, transmission, keyPatterns, timing } = chart.analysisBasis;
  const patternText = keyPatterns.length > 0
    ? keyPatterns.map((pattern) => `${pattern.name}（${pattern.positions.join("、")}）`).join("、")
    : "当前可靠规则未命中";

  return (
    <section
      className="rounded-[8px] bg-[var(--daliuren-panel-bg)] px-3 py-2.5"
      aria-labelledby="daliuren-analysis-basis-title"
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="daliuren-analysis-basis-title"
          className="flex items-center gap-1.5 text-[14px] font-semibold text-[var(--daliuren-title)]"
        >
          <ListChecks size={15} aria-hidden="true" />
          判断依据
        </h2>
        <span className="text-[11px] font-semibold text-[var(--daliuren-muted)]">
          {timing.label}
        </span>
      </div>

      <dl className="mt-2 grid grid-cols-2 gap-2">
        <BasisItem
          term="贵人布法"
          value={`${guiRen.dayNight} · ${guiRen.yinYang}${guiRen.guiRenBranch}临${guiRen.groundBranch} · ${guiRen.direction}`}
          detail={guiRen.basis.join("；")}
        />
        <BasisItem
          term="发用取传"
          value={`${transmission.method}课 · 初传${transmission.initialBranch}`}
          detail={transmission.basis.join("；")}
        />
        <div className="col-span-2 rounded-[5px] border border-[var(--daliuren-card-border)] bg-[var(--daliuren-card-bg)] px-2.5 py-2">
          <dt className="text-[10px] font-semibold text-[var(--daliuren-title)]">关键格局</dt>
          <dd className="mt-1 text-[12px] font-semibold leading-5 text-[var(--daliuren-strong)]">{patternText}</dd>
        </div>
      </dl>

      <div className="mt-2 rounded-[5px] border border-[var(--daliuren-card-border)] bg-[var(--daliuren-card-bg)] px-2.5 py-2">
        <h3 className="text-[10px] font-semibold text-[var(--daliuren-title)]">应期候选</h3>
        {timing.candidates.length > 0 ? (
          <ul className="mt-1 space-y-1" aria-label={`${timing.label}候选`}>
            {timing.candidates.map((candidate) => (
              <li key={`${candidate.branch}-${candidate.roles.join("-")}`} className="text-[12px] leading-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="font-semibold text-[var(--daliuren-strong)]">{candidate.window}</span>
                  <span className="text-right text-[var(--daliuren-muted)]">
                    {candidate.roles.join("、")} · 置信度{candidate.confidence}
                  </span>
                </div>
                <p className="text-[10px] leading-4 text-[var(--daliuren-muted)]">{candidate.basis.join("；")}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 flex items-start gap-1.5 text-[12px] leading-5 text-[var(--daliuren-muted)]" role="status">
            <CircleAlert size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            {timing.note}
          </p>
        )}
      </div>

      <p className="mt-2 text-[10px] leading-4 text-[var(--daliuren-muted)]">
        当前未判定：九宗门完整推导、涉害深浅、斩关等扩展课格。AI 不得自行补算。
      </p>
    </section>
  );
}

function BasisItem({ term, value, detail }: { term: string; value: string; detail: string }) {
  return (
    <div className="min-w-0 rounded-[5px] border border-[var(--daliuren-card-border)] bg-[var(--daliuren-card-bg)] px-2.5 py-2">
      <dt className="text-[10px] font-semibold text-[var(--daliuren-title)]">{term}</dt>
      <dd className="mt-1 text-[12px] font-semibold leading-5 text-[var(--daliuren-strong)]">{value}</dd>
      <dd className="mt-0.5 text-[10px] leading-4 text-[var(--daliuren-muted)]">{detail}</dd>
    </div>
  );
}
