import { Suspense } from "react";
import { LoginClient } from "@/components/settings/login-client";

export default function UserSettingsPage() {
  return (
    <Suspense fallback={null}>
      <LoginClient profileRoute />
    </Suspense>
  );
}
