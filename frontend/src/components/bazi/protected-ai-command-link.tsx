"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type SessionResponse = {
  session?: unknown;
  user?: unknown;
};

export function ProtectedAiCommandLink({ href, className = "" }: { href: string; className?: string }) {
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
      className={`flex h-12 items-center justify-center rounded-full bg-black text-[17px] font-semibold text-[#e8d4a7] ${className}`}
    >
      {checking ? "检查中..." : "AI指令 ›"}
    </Link>
  );
}
