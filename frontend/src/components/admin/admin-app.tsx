"use client";

import simpleRestProvider from "ra-data-simple-rest";
import {
  Admin,
  Datagrid,
  DateField,
  EmailField,
  List,
  NumberField,
  Resource,
  SearchInput,
  Show,
  SimpleShowLayout,
  TextField,
  type AuthProvider,
  type DataProvider
} from "react-admin";

const dataProvider: DataProvider = simpleRestProvider("/api/admin");

const authProvider: AuthProvider = {
  async login() {
    return Promise.resolve();
  },
  async logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    return Promise.resolve();
  },
  async checkAuth() {
    const response = await fetch("/api/admin/me", { credentials: "include" });
    if (!response.ok) {
      throw new Error("请先登录管理员账号");
    }
  },
  async checkError(error) {
    const status = error?.status;
    if (status === 401 || status === 403) {
      throw new Error("当前账号没有后台管理权限");
    }
  },
  async getIdentity() {
    const response = await fetch("/api/admin/me", { credentials: "include" });
    if (!response.ok) {
      throw new Error("请先登录管理员账号");
    }
    const user = (await response.json()) as { id: string; email?: string | null; phone?: string | null; name?: string | null };
    return {
      id: user.id,
      fullName: user.name || user.email || user.phone || user.id
    };
  },
  async getPermissions() {
    return "admin";
  }
};

const searchFilters = [<SearchInput key="q" source="q" alwaysOn />];

export function AdminApp() {
  return (
    <Admin
      title="SM1 后台管理"
      basename="/admin"
      dataProvider={dataProvider}
      authProvider={authProvider}
      requireAuth
      disableTelemetry
    >
      <Resource name="users" options={{ label: "用户" }} list={UserList} show={UserShow} recordRepresentation="email" />
      <Resource name="sessions" options={{ label: "登录会话" }} list={SessionList} />
      <Resource name="accounts" options={{ label: "登录方式" }} list={AccountList} />
      <Resource name="divination-profiles" options={{ label: "命理档案" }} list={DivinationProfileList} />
      <Resource name="bazi-charts" options={{ label: "八字排盘" }} list={BaziChartList} />
      <Resource name="payments" options={{ label: "付款记录" }} list={PaymentList} />
    </Admin>
  );
}

function UserList() {
  return (
    <List filters={searchFilters} sort={{ field: "createdAt", order: "DESC" }} perPage={25}>
      <Datagrid rowClick="show" bulkActionButtons={false}>
        <TextField source="id" label="用户 ID" />
        <TextField source="name" label="用户名" />
        <EmailField source="email" label="邮箱" />
        <TextField source="phone" label="手机号" />
        <TextField source="accountProviders" label="登录方式" />
        <NumberField source="sessionCount" label="会话数" />
        <NumberField source="divinationProfileCount" label="档案数" />
        <NumberField source="baziChartCount" label="排盘数" />
        <DateField source="lastLoginAt" label="最近登录" showTime />
        <DateField source="createdAt" label="注册时间" showTime />
      </Datagrid>
    </List>
  );
}

function UserShow() {
  return (
    <Show>
      <SimpleShowLayout>
        <TextField source="id" label="用户 ID" />
        <TextField source="name" label="用户名" />
        <EmailField source="email" label="邮箱" />
        <TextField source="phone" label="手机号" />
        <TextField source="image" label="头像" />
        <TextField source="accountProviders" label="登录方式" />
        <NumberField source="sessionCount" label="会话数" />
        <NumberField source="divinationProfileCount" label="档案数" />
        <NumberField source="baziChartCount" label="排盘数" />
        <DateField source="lastLoginAt" label="最近登录" showTime />
        <DateField source="createdAt" label="注册时间" showTime />
        <DateField source="updatedAt" label="更新时间" showTime />
      </SimpleShowLayout>
    </Show>
  );
}

function SessionList() {
  return (
    <List filters={searchFilters} sort={{ field: "createdAt", order: "DESC" }} perPage={25}>
      <Datagrid bulkActionButtons={false}>
        <TextField source="id" label="会话 ID" />
        <TextField source="userId" label="用户 ID" />
        <EmailField source="email" label="邮箱" />
        <TextField source="phone" label="手机号" />
        <DateField source="createdAt" label="登录时间" showTime />
        <DateField source="expiresAt" label="过期时间" showTime />
        <TextField source="ipAddress" label="IP" />
        <TextField source="userAgent" label="设备" />
      </Datagrid>
    </List>
  );
}

function AccountList() {
  return (
    <List filters={searchFilters} sort={{ field: "updatedAt", order: "DESC" }} perPage={25}>
      <Datagrid bulkActionButtons={false}>
        <TextField source="id" label="绑定 ID" />
        <TextField source="userId" label="用户 ID" />
        <EmailField source="email" label="邮箱" />
        <TextField source="providerId" label="登录方式" />
        <TextField source="accountId" label="平台账号 ID" />
        <TextField source="scope" label="授权范围" />
        <DateField source="updatedAt" label="更新时间" showTime />
      </Datagrid>
    </List>
  );
}

function DivinationProfileList() {
  return (
    <List filters={searchFilters} sort={{ field: "updatedAt", order: "DESC" }} perPage={25}>
      <Datagrid bulkActionButtons={false}>
        <TextField source="id" label="档案 ID" />
        <TextField source="userId" label="用户 ID" />
        <EmailField source="email" label="邮箱" />
        <TextField source="source" label="来源" />
        <TextField source="name" label="姓名" />
        <TextField source="gender" label="性别" />
        <TextField source="birthTime" label="出生时间" />
        <TextField source="location" label="地点" />
        <DateField source="updatedAt" label="更新时间" showTime />
      </Datagrid>
    </List>
  );
}

function BaziChartList() {
  return (
    <List filters={searchFilters} sort={{ field: "createdAt", order: "DESC" }} perPage={25}>
      <Datagrid bulkActionButtons={false}>
        <TextField source="id" label="排盘 ID" />
        <TextField source="profileId" label="档案 ID" />
        <TextField source="userId" label="用户 ID" />
        <EmailField source="email" label="邮箱" />
        <TextField source="name" label="姓名" />
        <TextField source="gender" label="性别" />
        <TextField source="birthTime" label="出生时间" />
        <TextField source="calendar" label="历法" />
        <TextField source="location" label="地点" />
        <DateField source="createdAt" label="创建时间" showTime />
      </Datagrid>
    </List>
  );
}

function PaymentList() {
  return (
    <List sort={{ field: "createdAt", order: "DESC" }} perPage={25} empty={<EmptyPaymentState />}>
      <Datagrid bulkActionButtons={false}>
        <TextField source="id" label="付款 ID" />
        <TextField source="userId" label="用户 ID" />
        <EmailField source="email" label="邮箱" />
        <TextField source="provider" label="支付渠道" />
        <NumberField source="amount" label="金额" />
        <TextField source="status" label="状态" />
        <DateField source="createdAt" label="创建时间" showTime />
      </Datagrid>
    </List>
  );
}

function EmptyPaymentState() {
  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ margin: "0 0 8px", fontSize: 20 }}>付款记录暂未接入</h2>
      <p style={{ margin: 0, color: "#666" }}>当前数据库还没有付款表，后端已预留 /api/admin/payments 列表接口。</p>
    </div>
  );
}
