import type { ReactNode } from "react";

import { ProtectedAiCommandAction } from "@/components/shared/protected-ai-command-action";

export function ProtectedAiCommandLink({
  href,
  className = "",
  children
}: {
  href: string;
  className?: string;
  children?: ReactNode;
}) {
  return <ProtectedAiCommandAction loginNextHref={href} authorizedHref={href} className={className} label={children} />;
}
