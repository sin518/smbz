"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import type { MouseEventHandler, ReactNode } from "react";

import { cn } from "@/lib/utils";

type AiCommandActionBaseProps = {
  className?: string;
  label?: ReactNode;
  loading?: boolean;
  expanded?: boolean;
  controls?: string;
};

type AiCommandButtonProps = AiCommandActionBaseProps & {
  href?: never;
  onClick: MouseEventHandler<HTMLButtonElement>;
};

type AiCommandLinkProps = AiCommandActionBaseProps & {
  href: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

export type AiCommandActionProps = AiCommandButtonProps | AiCommandLinkProps;

const actionClassName =
  "flex h-12 w-full touch-manipulation items-center justify-center gap-2 rounded-full bg-black text-[17px] font-semibold text-[#e8d4a7] shadow-soft transition-opacity disabled:cursor-wait disabled:opacity-65";

export function AiCommandAction(props: AiCommandActionProps) {
  const content = (
    <>
      <Sparkles size={18} aria-hidden="true" />
      <span>{props.loading ? "检查中..." : props.label ?? "AI指令"}</span>
    </>
  );
  const accessibilityProps = {
    "aria-expanded": props.expanded,
    "aria-controls": props.controls
  };

  if (typeof props.href === "string") {
    return (
      <Link
        href={props.href}
        onClick={props.onClick}
        aria-disabled={props.loading || undefined}
        className={cn(actionClassName, props.loading && "pointer-events-none opacity-65", props.className)}
        {...accessibilityProps}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={props.onClick}
      disabled={props.loading}
      className={cn(actionClassName, props.className)}
      {...accessibilityProps}
    >
      {content}
    </button>
  );
}
