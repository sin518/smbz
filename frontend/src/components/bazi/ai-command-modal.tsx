"use client";

import Link from "next/link";
import { Check, Copy, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { buildAiCommandText, getAiCommandFocusDescription, type AiCommandFocus } from "@/lib/ai/bazi-command";
import type { DemoBaziChart } from "@/lib/bazi/demo";
import { cn } from "@/lib/utils";

const commandTypes = ["全项", "事业", "财运", "婚恋", "子女", "六亲", "健康", "学业"] as const;

type CommandType = AiCommandFocus;

type AiCommandModalProps = {
  chart: DemoBaziChart;
  closeHref: string;
  useSolarTime?: boolean;
};

export function AiCommandModal({ chart, closeHref, useSolarTime }: AiCommandModalProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedType, setSelectedType] = useState<CommandType>("全项");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "selected">("idle");
  const commandTextRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const commandText = useMemo(
    () => buildAiCommandText({ chart, focus: selectedType, useSolarTime }),
    [chart, selectedType, useSolarTime]
  );

  function handleClose(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    setIsOpen(false);
    router.replace(closeHref);
  }

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

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/62 px-5 py-8">
      <section
        className="flex max-h-[88vh] w-full max-w-[386px] flex-col overflow-hidden rounded-[20px] bg-white text-ink shadow-[0_22px_80px_rgba(0,0,0,0.3)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-command-title"
      >
        <header className="relative flex min-h-[72px] items-center justify-center border-b border-[#eeeeee] px-14">
          <h2 id="ai-command-title" className="text-[28px] font-extrabold tracking-normal">
            Ai指令复制
          </h2>
          <Link
            href={closeHref}
            onClick={handleClose}
            className="absolute right-5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-[#2f2f2f]"
            aria-label="关闭 AI 指令复制"
          >
            <X size={34} strokeWidth={2.2} />
          </Link>
        </header>

        <div className="overflow-y-auto px-8 pb-8 pt-7">
          <p className="text-[20px] font-semibold leading-8">
            （请复制以下AI提示词，粘贴到 DeepSeek、ChatGPT、豆包等第三方AI大模型中使用）
          </p>

          <div className="mt-7 rounded-[2px] bg-white px-4 py-5 text-[20px] leading-8 text-[#767676] shadow-[0_8px_28px_rgba(0,0,0,0.08)]">
            <p>建议开启“深度思考”模式，并关闭“联网搜索”功能，以便模型更专注地进行盘面分析或相关训练。</p>
            <p className="mt-3">
              温馨提示：目前AI在易学领域仍处于早期探索阶段，生成内容可能存在不准确或主观推测的情况，请保持理性判断，结果仅供学术参考与娱乐使用。
            </p>
            <p className="mt-3 text-[#9b8749]">{getAiCommandFocusDescription(selectedType)}</p>
          </div>

          <div className="mt-7 grid grid-cols-4 gap-x-4 gap-y-5">
            {commandTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                className={cn(
                  "flex h-[48px] items-center justify-center rounded-full text-[20px] font-bold transition",
                  selectedType === type ? "bg-[#ad9255] text-white shadow-[0_8px_18px_rgba(173,146,85,0.28)]" : "bg-[#fbfbfb] text-[#4a4a4a] shadow-[0_8px_20px_rgba(0,0,0,0.05)]"
                )}
              >
                {type}
              </button>
            ))}
          </div>

          <section className="mt-7 rounded-[10px] border border-[#eee8dc] bg-[#fffdf8] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-[18px] font-bold text-[#2f2d2a]">AI提示词</h3>
              <button
                type="button"
                onClick={handleCopy}
                className="flex h-9 items-center gap-1 rounded-full bg-[#ad9255] px-3 text-[14px] font-bold text-white"
              >
                {copyStatus === "idle" ? <Copy size={16} /> : <Check size={16} />}
                {copyStatus === "copied" ? "已复制" : copyStatus === "selected" ? "已选中" : "复制"}
              </button>
            </div>
            <textarea
              ref={commandTextRef}
              value={commandText}
              readOnly
              className="max-h-[240px] min-h-[240px] w-full resize-none overflow-y-auto border-0 bg-transparent p-0 text-[14px] leading-6 text-[#5f5b52] outline-none [font-family:inherit]"
              aria-label="AI提示词内容"
            />
            {copyStatus === "selected" ? <p className="mt-2 text-[13px] text-[#9b8749]">已自动选中文本，可直接使用复制快捷键。</p> : null}
          </section>

          <button
            type="button"
            onClick={handleCopy}
            className="mt-10 flex h-[72px] w-full items-center justify-center rounded-full bg-[#ad9255] text-[25px] font-extrabold text-white shadow-[0_12px_28px_rgba(173,146,85,0.24)]"
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
