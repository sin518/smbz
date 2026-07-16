"use client";

import { Cloud, CloudOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

type SyncStatus = "pending" | "synced" | "failed";

interface BaziSyncStatusBadgeProps {
  status: SyncStatus;
  className?: string;
  showText?: boolean;
}

export function BaziSyncStatusBadge({ status, className, showText = true }: BaziSyncStatusBadgeProps) {
  const config = {
    pending: {
      icon: RefreshCw,
      text: "同步中",
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      iconClassName: "animate-spin"
    },
    synced: {
      icon: Cloud,
      text: "已同步",
      color: "text-green-600",
      bgColor: "bg-green-50",
      iconClassName: ""
    },
    failed: {
      icon: CloudOff,
      text: "同步失败",
      color: "text-red-600",
      bgColor: "bg-red-50",
      iconClassName: ""
    }
  };

  const { icon: Icon, text, color, bgColor, iconClassName } = config[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        bgColor,
        color,
        className
      )}
    >
      <Icon size={12} className={iconClassName} />
      {showText && <span>{text}</span>}
    </span>
  );
}
