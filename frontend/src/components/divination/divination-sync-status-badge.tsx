/**
 * 占术记录同步状态 Badge 组件(通用)
 */
interface DivinationSyncStatusBadgeProps {
  status?: "pending" | "synced" | "failed";
}

export function DivinationSyncStatusBadge({ status = "pending" }: DivinationSyncStatusBadgeProps) {
  const config = {
    pending: {
      bg: "bg-[#fff8e6]",
      text: "text-[#c4a24d]",
      label: "待同步"
    },
    synced: {
      bg: "bg-[#e7f5e9]",
      text: "text-[#4a8f5a]",
      label: "已同步"
    },
    failed: {
      bg: "bg-[#ffe8e8]",
      text: "text-[#c75450]",
      label: "上传失败"
    }
  };

  const style = config[status];

  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
}
