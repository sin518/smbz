"use client";

import { Check, Copy, X } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { useCachedAiCommand } from "@/components/shared/use-cached-ai-command";
import { useCopyFeedback } from "@/components/shared/use-copy-feedback";
import { buildZiweiAiCommandText, getZiweiAiCommandFocusDescription, type ZiweiAiCommandFocus } from "@/lib/ai/ziwei-command";
import type { ZiweiChart } from "@/lib/ziwei/calculate";
import { cn } from "@/lib/utils";

const commandTypes = ["全项", "命格", "事业", "财运", "婚恋", "健康", "大限", "流年"] as const;

type ZiweiAiCommandModalProps = {
  chart: ZiweiChart;
  onClose: () => void;
};

export function ZiweiAiCommandModal({ chart, onClose }: ZiweiAiCommandModalProps) {
  const [selectedType, setSelectedType] = useState<ZiweiAiCommandFocus>("全项");
  const { copyStatus, setCopyStatus } = useCopyFeedback();
  const commandTextRef = useRef<HTMLTextAreaElement>(null);
  const commandSource = useMemo(
    () => JSON.stringify({ chart, focus: selectedType }),
    [chart, selectedType]
  );
  const buildCommand = useCallback(
    () => buildZiweiAiCommandText({ chart, focus: selectedType }),
    [chart, selectedType]
  );
  const commandText = useCachedAiCommand({ namespace: "ziwei", source: commandSource, build: buildCommand });

  async function handleCopy() {
    if (!commandText) {
      return;
    }

    try {
      await copyText(commandText);
      setCopyStatus("copied");
    } catch {
      commandTextRef.current?.focus();
      commandTextRef.current?.select();
      setCopyStatus("selected");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/62 px-3 py-3">
      <section
        className="flex max-h-[96dvh] w-full max-w-[386px] flex-col overflow-hidden rounded-[18px] bg-[var(--color-surface)] text-ink shadow-[0_22px_80px_rgba(0,0,0,0.3)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ziwei-ai-command-title"
      >
        <header className="relative flex min-h-[52px] items-center justify-center border-b border-[var(--color-row-border)] px-12">
          <h2 id="ziwei-ai-command-title" className="text-[24px] font-extrabold tracking-normal">
            Ai指令复制
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-ink"
            aria-label="关闭 AI 指令复制"
          >
            <X size={28} strokeWidth={2.2} />
          </button>
        </header>

        <div className="overflow-y-auto px-5 pb-5 pt-4">
          <p className="text-[14px] font-semibold leading-5">
            （请复制以下AI提示词，粘贴到 DeepSeek、ChatGPT、豆包等第三方AI大模型中使用）
          </p>

          <div className="mt-3 rounded-[8px] bg-[var(--color-control)] px-3 py-3 text-[13px] leading-5 text-mutedInk shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
            <p>建议开启“深度思考”模式，并关闭“联网搜索”功能，以便模型更专注地进行紫微命盘分析。</p>
            <p className="mt-1.5">
              温馨提示：目前AI在易学领域仍处于早期探索阶段，生成内容可能存在不准确或主观推测的情况，请保持理性判断，结果仅供学术参考与娱乐使用。
            </p>
            <p className="mt-1.5 font-semibold text-[var(--color-icon)]">{getZiweiAiCommandFocusDescription(selectedType)}</p>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-x-3 gap-y-3">
            {commandTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setSelectedType(type);
                  setCopyStatus("idle");
                }}
                className={cn(
                  "flex h-10 items-center justify-center rounded-full text-[17px] font-bold transition",
                  selectedType === type ? "bg-[var(--color-primary)] text-[var(--color-primary-text)] shadow-[0_8px_18px_rgba(173,146,85,0.28)]" : "bg-[var(--color-control)] text-ink shadow-[0_8px_20px_rgba(0,0,0,0.05)]"
                )}
              >
                {type}
              </button>
            ))}
          </div>

          <section className="mt-4 rounded-[10px] border border-[var(--color-row-border)] bg-[var(--color-control)] p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3 className="text-[16px] font-bold text-ink">AI提示词</h3>
              <button
                type="button"
                onClick={handleCopy}
                disabled={!commandText}
                className="flex h-8 items-center gap-1 rounded-full bg-[var(--color-primary)] px-3 text-[13px] font-bold text-[var(--color-primary-text)]"
              >
                {copyStatus === "idle" ? <Copy size={15} /> : <Check size={15} />}
                {copyStatus === "copied" ? "已复制" : copyStatus === "selected" ? "已选中" : "复制"}
              </button>
            </div>
            <textarea
              ref={commandTextRef}
              value={commandText}
              readOnly
              className="h-[172px] w-full resize-none overflow-y-auto border-0 bg-transparent p-0 text-[12px] leading-5 text-ink outline-none [font-family:inherit]"
              aria-label="AI提示词内容"
            />
            {copyStatus === "selected" ? <p className="mt-1.5 text-[12px] text-[var(--color-icon)]">已自动选中文本，可直接使用复制快捷键。</p> : null}
          </section>

          <button
            type="button"
            onClick={handleCopy}
            disabled={!commandText}
            className="mt-5 flex h-14 w-full items-center justify-center rounded-full bg-[var(--color-primary)] text-[22px] font-extrabold text-[var(--color-primary-text)] shadow-[0_12px_28px_rgba(173,146,85,0.24)]"
          >
            {copyStatus === "copied" ? "已复制AI指令" : copyStatus === "selected" ? "已选中AI指令" : "复制AI指令"}
          </button>
        </div>
      </section>
    </div>
  );
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall through to the textarea copy path for browser shells without clipboard permission.
    }
  }

  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "true");
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  textArea.style.top = "0";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  const copied = document.execCommand("copy");
  document.body.removeChild(textArea);

  if (!copied) {
    throw new Error("Copy command failed");
  }
}
