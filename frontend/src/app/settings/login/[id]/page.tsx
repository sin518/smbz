import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginClient } from "@/components/settings/login-client";

export const metadata: Metadata = {
  title: "个人资料"
};

export default function UserSettingsPage() {
  return (
    <Suspense fallback={null}>
      <LoginClient profileRoute />
    </Suspense>
  );
}
