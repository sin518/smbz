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
      <div className="flex items-center gap-3">
        <h2
          id="daliuren-analysis-basis-title"
          className="flex items-center gap-1.5 text-[14px] font-semibold text-[var(--daliuren-title)]"
        >
          <ListChecks size={15} aria-hidden="true" />
          判断依据
        </h2>
      </div>

      <dl className="mt-2 grid grid-cols-2 gap-2">
        <BasisItem
          term="贵人布法"
          value={`${guiRen.dayNight} · ${guiRen.yinYang}${guiRen.guiRenBranch}临${guiRen.groundBranch} · ${guiRen.direction}`}
          detail={guiRen.basis.join("；")}
        />
        <TransmissionBasisItem transmission={transmission} />
        <div className="col-span-2 rounded-[5px] border border-[var(--daliuren-card-border)] bg-[var(--daliuren-card-bg)] px-2.5 py-2">
          <dt className="text-[10px] font-semibold text-[var(--daliuren-title)]">关键格局</dt>
          <dd className="mt-1 text-[12px] font-semibold leading-5 text-[var(--daliuren-strong)]">{patternText}</dd>
        </div>
      </dl>

      <div className="mt-2 rounded-[5px] border border-[var(--daliuren-card-border)] bg-[var(--daliuren-card-bg)] px-2.5 py-2">
        <h3 className="text-[10px] font-semibold text-[var(--daliuren-title)]">应期触发线索</h3>
        {timing.clues.length > 0 ? (
          <>
            <ul className="mt-1 space-y-1.5" aria-label="应期触发线索">
              {timing.clues.map((clue) => (
                <li key={`${clue.branch}-${clue.roles.join("-")}`} className="text-[12px] leading-5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-semibold text-[var(--daliuren-strong)]">{clue.window}</span>
                    <span className="shrink-0 text-right text-[10px] font-semibold text-[var(--daliuren-muted)]">
                      {clue.kind === "conditional" ? "条件线索" : "基础线索"}
                    </span>
                  </div>
                  <p className="text-[10px] leading-4 text-[var(--daliuren-muted)]">
                    {clue.roles.join("、")} · {clue.basis.join("；")}
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-1.5 border-t border-[var(--daliuren-card-border)] pt-1.5 text-[10px] leading-4 text-[var(--daliuren-muted)]">
              {timing.note}
            </p>
          </>
        ) : (
          <p className="mt-1 flex items-start gap-1.5 text-[12px] leading-5 text-[var(--daliuren-muted)]" role="status">
            <CircleAlert size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            {timing.note}
          </p>
        )}
      </div>

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

function TransmissionBasisItem({
  transmission,
}: {
  transmission: DaliurenOutput["analysisBasis"]["transmission"];
}) {
  return (
    <div className="min-w-0 rounded-[5px] border border-[var(--daliuren-card-border)] bg-[var(--daliuren-card-bg)] px-2.5 py-2">
      <dt className="text-[10px] font-semibold text-[var(--daliuren-title)]">发用取传</dt>
      <dd className="mt-1 text-[12px] font-semibold leading-5 text-[var(--daliuren-strong)]">
        {transmission.method}课 · 初传{transmission.initialBranch}
      </dd>
      {transmission.derivationComplete && transmission.steps.length > 0 ? (
        <dd className="mt-0.5">
          <details className="group">
            <summary className="cursor-pointer list-none text-[10px] font-semibold leading-4 text-[var(--daliuren-muted)] marker:content-none">
              <span className="group-open:hidden">查看推导</span>
              <span className="hidden group-open:inline">收起推导</span>
            </summary>
            <ol className="mt-1.5 space-y-1 border-l border-[var(--daliuren-card-border)] pl-2.5">
              {transmission.steps.map((step, index) => (
                <li key={`${step.gate}-${index}`} className="text-[10px] leading-4 text-[var(--daliuren-muted)]">
                  <span className="font-semibold text-[var(--daliuren-strong)]">
                    {index + 1}. {step.gate}
                  </span>
                  <span>：{step.summary}</span>
                </li>
              ))}
            </ol>
            {transmission.harmDepth ? (
              <div className="mt-2 rounded-[4px] bg-[var(--daliuren-panel-bg)] px-2 py-1.5">
                <p className="text-[10px] font-semibold text-[var(--daliuren-strong)]">
                  涉害深浅 · {transmission.harmDepth.subtype}
                </p>
                <ul className="mt-1 space-y-1">
                  {transmission.harmDepth.candidates.map((candidate) => (
                    <li
                      key={`${candidate.lesson}-${candidate.branch}`}
                      className="text-[10px] leading-4 text-[var(--daliuren-muted)]"
                    >
                      <span className={candidate.selected ? "font-semibold text-[var(--daliuren-strong)]" : undefined}>
                        {candidate.lesson}{candidate.branch}：{candidate.depth}重
                        {candidate.selected ? "（取用）" : ""}
                      </span>
                      <span>
                        {" · "}
                        {candidate.path.map((segment) => (
                          `${segment.groundBranch}${segment.hitCount > 0 ? `(${segment.hitCount})` : ""}`
                        )).join("→")}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-1 text-[10px] leading-4 text-[var(--daliuren-muted)]">
                  {transmission.harmDepth.decision}
                </p>
              </div>
            ) : null}
          </details>
        </dd>
      ) : null}
    </div>
  );
}
