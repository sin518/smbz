"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";

import { AiCommandAction } from "@/components/shared/ai-command-action";

type SessionResponse = {
  session?: unknown;
  user?: unknown;
};

export function ProtectedAiCommandAction({
  loginNextHref,
  authorizedHref,
  onAuthorized,
  className,
  label,
  expanded,
  controls
}: {
  loginNextHref: string;
  authorizedHref?: string;
  onAuthorized?: () => void | Promise<void>;
  className?: string;
  label?: ReactNode;
  expanded?: boolean;
  controls?: string;
}) {
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  async function handleClick() {
    if (checking) {
      return;
    }

    setChecking(true);

    try {
      const response = await fetch("/api/auth/get-session", {
        method: "GET",
        credentials: "include"
      });
      const data = response.ok ? ((await response.json()) as SessionResponse | null) : null;

      if (data?.session && data.user) {
        if (onAuthorized) {
          await onAuthorized();
        } else if (authorizedHref) {
          router.push(authorizedHref);
        }
        return;
      }
    } catch {
      // Fall through to login when the session cannot be verified.
    } finally {
      setChecking(false);
    }

    router.push(`/settings/login?next=${encodeURIComponent(loginNextHref)}`);
  }

  return (
    <AiCommandAction
      onClick={() => void handleClick()}
      loading={checking}
      className={className}
      label={label}
      expanded={expanded}
      controls={controls}
    />
  );
}
