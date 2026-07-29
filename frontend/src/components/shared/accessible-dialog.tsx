"use client";

import { useEffect, useRef } from "react";
import type { ReactNode, RefObject } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])"
].join(",");

type AccessibleDialogProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  labelledBy?: string;
  ariaLabel?: string;
  initialFocusRef?: RefObject<HTMLElement | null>;
  returnFocusRef?: RefObject<HTMLElement | null>;
  className?: string;
  overlayClassName?: string;
  placement?: "bottom" | "center";
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
};

export function AccessibleDialog({
  open,
  onClose,
  children,
  labelledBy,
  ariaLabel,
  initialFocusRef,
  returnFocusRef,
  className,
  overlayClassName,
  placement = "bottom",
  closeOnBackdrop = true,
  closeOnEscape = true
}: AccessibleDialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const restoreFocusFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (restoreFocusFrameRef.current !== null) {
      window.cancelAnimationFrame(restoreFocusFrameRef.current);
      restoreFocusFrameRef.current = null;
    }

    const activeElement = returnFocusRef?.current ?? document.activeElement;
    if (
      activeElement instanceof HTMLElement &&
      activeElement !== document.body &&
      !dialogRef.current?.contains(activeElement)
    ) {
      triggerRef.current = activeElement;
    }
    const overlay = overlayRef.current;
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    const siblings = Array.from(document.body.children)
      .filter((element): element is HTMLElement => element instanceof HTMLElement && element !== overlay)
      .map((element) => ({ element, inert: element.inert }));

    document.body.style.overflow = "hidden";
    siblings.forEach(({ element }) => {
      element.inert = true;
    });

    const focusFrame = window.requestAnimationFrame(() => {
      const initialTarget =
        initialFocusRef?.current ??
        dialogRef.current?.querySelector<HTMLElement>("[data-dialog-autofocus]") ??
        dialogRef.current?.querySelector<HTMLElement>(focusableSelector) ??
        dialogRef.current;
      initialTarget?.focus();
    });

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      siblings.forEach(({ element, inert }) => {
        element.inert = inert;
      });
      const trigger = triggerRef.current;
      if (trigger?.isConnected) {
        restoreFocusFrameRef.current = window.requestAnimationFrame(() => {
          restoreFocusFrameRef.current = null;
          if (!dialog?.isConnected) {
            trigger.focus();
          }
        });
      }
    };
  }, [initialFocusRef, open, returnFocusRef]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape" && closeOnEscape) {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [])
      .filter((element) => !element.hidden && element.getAttribute("aria-hidden") !== "true");
    if (focusable.length === 0) {
      event.preventDefault();
      dialogRef.current?.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && (active === first || active === dialogRef.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return createPortal(
    <div
      ref={overlayRef}
      className={cn(
        "fixed inset-0 z-50 flex justify-center bg-black/65",
        placement === "center" ? "items-center" : "items-end",
        overlayClassName
      )}
      onMouseDown={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="app-responsive-shell contents">
        <section
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
          aria-label={labelledBy ? undefined : ariaLabel}
          tabIndex={-1}
          onKeyDown={handleKeyDown}
          className={cn("relative w-full max-w-[430px] bg-white shadow-soft", className)}
        >
          {children}
        </section>
      </div>
    </div>,
    document.body
  );
}
