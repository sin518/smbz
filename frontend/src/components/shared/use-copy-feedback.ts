"use client";

// 需要 useState/useEffect 管理复制操作的短暂反馈状态。
import { useEffect, useState } from "react";

export type CopyFeedbackStatus = "idle" | "copied" | "selected";

const COPY_STATUS_RESET_DELAY_MS = 5_000;

export function useCopyFeedback() {
  const [copyStatus, setCopyStatus] = useState<CopyFeedbackStatus>("idle");

  useEffect(() => {
    if (copyStatus !== "copied") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCopyStatus("idle");
    }, COPY_STATUS_RESET_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [copyStatus]);

  return { copyStatus, setCopyStatus };
}
