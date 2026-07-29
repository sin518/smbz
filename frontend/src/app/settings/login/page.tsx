import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginClient } from "@/components/settings/login-client";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginClient />
    </Suspense>
  );
}
export const metadata: Metadata = {
  title: "登录"
};
