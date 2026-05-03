"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type SessionResponse = {
  session?: unknown;
  user?: unknown;
};

export function ProtectedAiCommandLink({ href }: { href: string }) {
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  async function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();

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
        router.push(href);
        return;
      }
    } catch {
      // Fall through to the login page.
    }

    router.push(`/settings/login?next=${encodeURIComponent(href)}`);
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      aria-disabled={checking}
      className="flex h-14 items-center justify-center rounded-full bg-white text-[24px] font-semibold shadow-[0_6px_22px_rgba(0,0,0,0.08)]"
    >
      {checking ? "检查中..." : "AI指令 ›"}
    </Link>
  );
}
