"use client";

// react-admin 依赖浏览器端路由和存储能力，需要在客户端动态加载。
import dynamic from "next/dynamic";

const AdminApp = dynamic(() => import("@/components/admin/admin-app").then((module) => module.AdminApp), {
  ssr: false
});

export default function AdminPage() {
  return <AdminApp />;
}
