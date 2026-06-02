"use client";

import { Check, Copy, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { QimenOutput } from "taibu-core/qimen";
import { buildQimenAiCommandText } from "@/lib/ai/qimen-command";

type QimenChart = QimenOutput;

type QimenAiCommandModalProps = {
  chart: QimenChart;
  onClose: () => void;
};

export function QimenAiCommandModal({ chart, onClose }: QimenAiCommandModalProps) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "selected">("idle");
  const commandTextRef = useRef<HTMLTextAreaElement>(null);
  const commandText = useMemo(() => buildQimenAiCommandText({ chart }), [chart]);

  async function handleCopy() {
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
        aria-labelledby="qimen-ai-command-title"
      >
        <header className="relative flex min-h-[52px] items-center justify-center border-b border-[var(--color-row-border)] px-12">
          <h2 id="qimen-ai-command-title" className="text-[24px] font-extrabold tracking-normal">
            AI指令复制
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-ink"
            aria-label="关闭AI指令复制"
          >
            <X size={28} strokeWidth={2.2} />
          </button>
        </header>

        <div className="overflow-y-auto px-5 pb-5 pt-4">
          <p className="text-[14px] font-semibold leading-5">
            （请复制以下AI提示词，粘贴到 DeepSeek、ChatGPT、豆包等第三方AI大模型中使用）
          </p>

          <div className="mt-3 rounded-[8px] bg-[var(--color-control)] px-3 py-3 text-[13px] leading-5 text-mutedInk shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
            <p>建议开启“深度思考”模式，并关闭“联网搜索”功能，使模型只根据本页奇门盘与固定规则推理。</p>
            <p className="mt-1.5">
              温馨提示：内容仅供国学传统文化研究与休闲娱乐参考，不构成投资、医疗、法律或人生决策依据。
            </p>
          </div>

          <section className="mt-4 rounded-[10px] border border-[var(--color-row-border)] bg-[var(--color-control)] p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3 className="text-[16px] font-bold text-ink">AI提示词</h3>
              <button
                type="button"
                onClick={handleCopy}
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
              className="h-[360px] w-full resize-none overflow-y-auto border-0 bg-transparent p-0 text-[12px] leading-5 text-ink outline-none [font-family:inherit]"
              aria-label="奇门AI提示词内容"
            />
            {copyStatus === "selected" ? <p className="mt-1.5 text-[12px] text-[var(--color-icon)]">已自动选中文本，可直接使用复制快捷键。</p> : null}
          </section>

          <button
            type="button"
            onClick={handleCopy}
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
      // Fall through for browser shells without clipboard permission.
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
