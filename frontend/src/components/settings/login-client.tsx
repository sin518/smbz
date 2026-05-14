"use client";

import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  EyeOff,
  Github,
  IdCard,
  Loader2,
  MapPin,
  Power,
  Search,
  Smartphone,
  UsersRound,
  UserRound,
  type LucideIcon
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type ApiResult<T> = T & {
  message?: string;
};

class AuthRequestError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "AuthRequestError";
  }
}

type LoginResponse = {
  user: {
    id: string;
    phone: string;
    name?: string;
    email?: string;
    level: string;
  };
};

type AuthSessionResponse = {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  session?: unknown;
};

type SessionStatus = "loading" | "signed-in" | "signed-out";
type EditableProfileField = "name" | "gender" | "birthTime" | "birthPlace";
type UserProfileSettings = {
  name: string;
  gender: string;
  birthTime: string;
  birthPlace: string;
};

const DEFAULT_PASSWORD_MESSAGE = "账号密码仅在本地开发服务中保存";
const AUTH_REQUEST_TIMEOUT_MS = 10000;
const HOME_HREF = "/";

function getSafeNextHref(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return HOME_HREF;
  }

  return value;
}

function getLoginBackHref(nextHref: string) {
  const [pathname = "", query = ""] = nextHref.split("?");

  if (pathname === "/bazi/demo/ai-command") {
    return query ? `/bazi/demo?${query}` : "/bazi/demo";
  }

  if (pathname.startsWith("/bazi/") || pathname === "/bazi") {
    return nextHref;
  }

  return "/settings";
}

async function requestPasswordAuth(
  endpoint: "/api/auth/password/login" | "/api/auth/password/register",
  payload: {
    identifier: string;
    password: string;
    confirmPassword?: string;
    signal: AbortSignal;
  }
): Promise<LoginResponse> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    signal: payload.signal,
    body: JSON.stringify({
      identifier: payload.identifier,
      password: payload.password,
      confirmPassword: payload.confirmPassword
    })
  });
  const data = (await response.json()) as ApiResult<LoginResponse>;

  if (!response.ok) {
    throw new AuthRequestError(data.message ?? "登录失败", response.status);
  }

  return data;
}

export function LoginClient({ profileRoute = false }: { profileRoute?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oauthError = searchParams.get("error");
  const nextHref = getSafeNextHref(searchParams.get("next"));
  const backHref = getLoginBackHref(nextHref);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("loading");
  const [sessionUser, setSessionUser] = useState<AuthSessionResponse["user"]>(null);
  const [accountIdentifier, setAccountIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [agreementShake, setAgreementShake] = useState(false);
  const [message, setMessage] = useState(DEFAULT_PASSWORD_MESSAGE);

  const normalizedAccountIdentifier = useMemo(() => accountIdentifier.trim(), [accountIdentifier]);
  const isValidPasswordIdentifier = isPhoneOrEmail(normalizedAccountIdentifier);
  const isRegisterablePassword = /^(?=.*[A-Za-z])(?=.*\d).{8,32}$/.test(password);
  const passwordFormError = getPasswordFormError({
    identifier: normalizedAccountIdentifier
  });

  function promptAgreement() {
    setMessage("请点击下方同意用户协议和隐私政策选框");
    setAgreementShake(false);
    window.setTimeout(() => setAgreementShake(true), 0);
    window.setTimeout(() => setAgreementShake(false), 420);
  }

  useEffect(() => {
    if (oauthError) {
      setMessage(oauthError);
    }
  }, [oauthError]);

  useEffect(() => {
    if (!loggingIn) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setLoggingIn(false);
      setMessage("登录请求超时，请检查后端服务或数据库连接后重试");
    }, AUTH_REQUEST_TIMEOUT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [loggingIn]);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    const storedUser = getStoredUser();

    if (storedUser?.id) {
      setSessionUser(storedUser);
      setSessionStatus("signed-in");
      if (!profileRoute) {
        router.replace(nextHref);
      }
      return;
    }

    const finishSignedOut = () => {
      if (!mounted) {
        return;
      }

      if (getStoredUser()?.id) {
        setSessionStatus("signed-in");
        return;
      }

      if (profileRoute) {
        router.replace("/settings/login");
        return;
      }

      setSessionStatus("signed-out");
    };
    const timeoutId = window.setTimeout(() => {
      controller.abort();
      finishSignedOut();
    }, 2500);

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/get-session", {
          method: "GET",
          credentials: "include",
          signal: controller.signal
        });
        const data = response.ok ? ((await response.json()) as AuthSessionResponse | null) : null;

        if (!mounted) {
          return;
        }

        if (data?.session && data.user) {
          window.clearTimeout(timeoutId);
          setSessionUser(data.user);
          window.localStorage.setItem(
            "sm1:user",
            JSON.stringify({
              id: data.user.id,
              name: data.user.name,
              email: data.user.email,
              level: "初学弟子"
            })
          );
          if (!profileRoute) {
            router.replace(nextHref);
          }
          setSessionStatus("signed-in");
        } else {
          window.clearTimeout(timeoutId);
          finishSignedOut();
        }
      } catch {
        finishSignedOut();
      }
    }

    void loadSession();

    return () => {
      mounted = false;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  async function submitPasswordAuth() {
    if (!agreed) {
      promptAgreement();
      return;
    }

    if (!isValidPasswordIdentifier) {
      setMessage("请输入正确的手机号或邮箱");
      return;
    }

    if (!password) {
      setMessage("请输入密码");
      return;
    }

    setLoggingIn(true);
    setMessage("正在登录...");

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), AUTH_REQUEST_TIMEOUT_MS);

    try {
      let data: LoginResponse;

      try {
        data = await requestPasswordAuth("/api/auth/password/login", {
          identifier: normalizedAccountIdentifier,
          password,
          signal: controller.signal
        });
      } catch (error) {
        if (!(error instanceof AuthRequestError) || error.status !== 404) {
          throw error;
        }

        if (!isRegisterablePassword) {
          throw new Error("新账号密码需为 8-32 位，并同时包含字母和数字");
        }

        setMessage("账号不存在，正在自动注册...");
        data = await requestPasswordAuth("/api/auth/password/register", {
          identifier: normalizedAccountIdentifier,
          password,
          confirmPassword: password,
          signal: controller.signal
        });
      }

      window.localStorage.setItem("sm1:user", JSON.stringify(data.user));
      router.replace(nextHref);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setMessage("登录请求超时，请检查后端服务或数据库连接后重试");
      } else {
        setMessage(error instanceof Error ? error.message : "登录失败，请稍后再试");
      }
    } finally {
      window.clearTimeout(timeoutId);
      setLoggingIn(false);
    }
  }

  async function signInWithSocial(provider: "google" | "github") {
    if (!agreed) {
      promptAgreement();
      return;
    }

    setLoggingIn(true);
    setMessage(provider === "google" ? "正在跳转 Google 登录..." : "正在跳转 GitHub 登录...");

    const nextQuery = encodeURIComponent(nextHref);
    window.location.href = `/api/auth/oauth/${provider}/login?next=${nextQuery}`;
  }

  if (sessionStatus === "loading") {
    return (
      <main className="light-surface-text-scope mx-auto flex min-h-screen max-w-[430px] flex-col items-center justify-center bg-paper text-ink shadow-soft">
        <Loader2 className="animate-spin text-[#a58024]" size={30} />
        <p className="mt-4 text-[15px] font-semibold text-mutedInk">正在确认登录状态</p>
      </main>
    );
  }

  if (sessionStatus === "signed-in") {
    if (profileRoute) {
      return <UserSettingsPage user={sessionUser} onSignedOut={() => setSessionStatus("signed-out")} />;
    }

    return (
      <main className="light-surface-text-scope mx-auto flex min-h-screen max-w-[430px] flex-col items-center justify-center bg-paper text-ink shadow-soft">
        <Loader2 className="animate-spin text-[#a58024]" size={30} />
        <p className="mt-4 text-[15px] font-semibold text-mutedInk">正在进入首页</p>
      </main>
    );
  }

  const showInlineMessage = message !== DEFAULT_PASSWORD_MESSAGE;

  return (
    <main className="light-surface-text-scope relative mx-auto min-h-screen max-w-[430px] overflow-hidden bg-paper pb-10 text-ink shadow-soft">
      <header className="sticky top-0 z-20 bg-[#F8F7EE] px-5 pb-5 pt-14">
        <div className="grid grid-cols-[44px_minmax(0,1fr)_44px] items-center">
          <Link href={backHref} className="-ml-2 flex h-10 w-10 items-center justify-center text-ink" aria-label={backHref === "/settings" ? "返回设置" : "返回八字"}>
            <ChevronLeft size={28} strokeWidth={2.2} />
          </Link>
          <h1 className="text-center text-[22px] font-semibold">登录</h1>
          <span className="h-10 w-10" />
        </div>
      </header>

      <section className="px-4 pt-2">
        <div className="rounded-[22px] bg-white px-5 pb-6 pt-7 text-center shadow-soft">
          <h2 className="m-0 text-[26px] font-semibold leading-[1.25]">登录提供存储功能</h2>
          <p className="mt-3 text-[15px] leading-6 text-mutedInk">保存排盘记录，并在同一账号下查看历史报告。</p>

          <p className="mb-5 mt-6 text-[16px] font-semibold text-[#55514a]">
            使用手机号或邮箱密码登录
          </p>

          <div className="space-y-3">
            <input
              value={accountIdentifier}
              onChange={(event) => setAccountIdentifier(event.target.value)}
              className={`h-[54px] w-full rounded-full border-0 bg-[#f2f2f0] px-6 text-[20px] text-ink outline-none placeholder:text-[#aaa8a1] ${accountIdentifier && !isValidPasswordIdentifier ? "ring-2 ring-[#c62828]" : ""}`}
              inputMode="email"
              maxLength={80}
              placeholder="请输入手机号或邮箱"
              aria-label="手机号或邮箱"
            />
            <PasswordField
              value={password}
              onChange={setPassword}
              visible={showPassword}
              onToggleVisible={() => setShowPassword((value) => !value)}
              placeholder="请输入密码"
              ariaLabel="密码"
            />
            <button
              type="button"
              onClick={submitPasswordAuth}
              disabled={loggingIn}
              className={`flex h-[54px] w-full items-center justify-center rounded-full bg-black text-[20px] font-semibold text-[#e8d4a7] disabled:opacity-55 ${agreementShake ? "animate-agreement-shake" : ""}`}
            >
              {loggingIn ? <Loader2 className="animate-spin" size={22} /> : "登录 / 自动注册"}
            </button>
            <p className="px-4 text-center text-[13px] leading-5 text-[#a58024]">新手机号或邮箱会自动创建账号并登录</p>
            {passwordFormError ? <p className="px-4 text-[13px] leading-5 text-[#c62828]">{passwordFormError}</p> : null}
          </div>

          <p className="mt-3 min-h-5 text-center text-[13px] leading-5 text-mutedInk">{showInlineMessage ? message : ""}</p>
        </div>
      </section>

      <section className="px-4 pt-4 text-center">
        <div className="rounded-[22px] bg-white px-4 py-5 shadow-soft">
          <p className="mb-4 text-[16px] font-semibold text-[#55514a]">其他登录方式</p>
          <div className="flex justify-center gap-4">
            <LoginMethod label="Google登录" icon={Search} onClick={() => signInWithSocial("google")} />
            <LoginMethod label="GitHub登录" icon={Github} onClick={() => signInWithSocial("github")} />
          </div>
        </div>
      </section>

      <section className="px-4 pt-4">
        <label className={`flex items-center justify-center gap-1 whitespace-nowrap text-[13px] leading-5 text-mutedInk ${agreementShake ? "text-ink" : ""}`}>
          <input
            checked={agreed}
            onChange={(event) => setAgreed(event.target.checked)}
            type="checkbox"
            className="mr-0.5 h-3.5 w-3.5 shrink-0 appearance-none rounded-full border-[1.5px] border-[#aaa8a1] bg-transparent checked:border-black checked:bg-black"
            aria-label="同意用户协议和隐私政策"
          />
          <span>我已阅读并同意</span>
          <Link href="/settings/login" className="font-semibold text-ink">
            《用户协议》
          </Link>
          <span>和</span>
          <Link href="/settings/login" className="font-semibold text-ink">
            《隐私政策》
          </Link>
        </label>
      </section>
    </main>
  );
}

function UserSettingsPage({
  user,
  onSignedOut
}: {
  user: AuthSessionResponse["user"];
  onSignedOut: () => void;
}) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteWarningOpen, setDeleteWarningOpen] = useState(false);
  const [storedUser, setStoredUser] = useState<(LoginResponse["user"] & { email?: string; name?: string }) | null>(null);
  const [profile, setProfile] = useState<UserProfileSettings>(() => getDefaultProfile(user, null));
  const [editingField, setEditingField] = useState<EditableProfileField | null>(null);
  const [draftValue, setDraftValue] = useState("");
  const userId = user?.id ?? storedUser?.id ?? "";
  const displayId = userId ? userId.slice(0, 8) : "未生成";
  const accountValue = storedUser?.phone || user?.email || storedUser?.email || "未绑定";
  const accountLabel = storedUser?.phone ? "手机号" : "邮箱";

  useEffect(() => {
    const nextStoredUser = getStoredUser();
    setStoredUser(nextStoredUser);
    setProfile(getStoredProfile(user, nextStoredUser));
  }, [user]);

  function startEdit(field: EditableProfileField) {
    setEditingField(field);
    setDraftValue(profile[field]);
  }

  function saveEdit() {
    if (!editingField) {
      return;
    }

    const nextValue = draftValue.trim();
    const nextProfile = {
      ...profile,
      [editingField]: nextValue
    };

    setProfile(nextProfile);
    saveStoredProfile(nextProfile);

    if (editingField === "name") {
      const currentUser = getStoredUser();
      window.localStorage.setItem(
        "sm1:user",
        JSON.stringify({
          ...currentUser,
          id: currentUser?.id ?? user?.id,
          email: currentUser?.email ?? user?.email,
          name: nextValue
        })
      );
    }

    setEditingField(null);
  }

  async function signOut() {
    setSigningOut(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" }
      });
    } finally {
      window.localStorage.removeItem("sm1:user");
      window.localStorage.removeItem("sm1:user-settings");
      setSigningOut(false);
      onSignedOut();
      router.replace("/settings/login");
      router.refresh();
    }
  }

  async function deleteAccount() {
    setDeletingAccount(true);

    try {
      const response = await fetch("/api/auth/delete-account", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" }
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(data?.message ?? "账号注销失败，请稍后再试");
      }

      window.localStorage.removeItem("sm1:user");
      window.localStorage.removeItem("sm1:user-settings");
      setDeleteWarningOpen(false);
      onSignedOut();
      router.replace("/settings/login");
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "账号注销失败，请稍后再试");
    } finally {
      setDeletingAccount(false);
    }
  }

  return (
    <main className="light-surface-text-scope mx-auto min-h-dvh max-w-[430px] bg-[#f7f7f7] text-ink shadow-soft">
      <header className="grid h-[108px] grid-cols-[44px_minmax(0,1fr)_44px] items-center border-b border-[#f1f1f1] bg-white px-[22px] pt-[38px]">
        <Link href="/settings" className="-ml-2 flex h-10 w-10 items-center justify-center text-[#222]" aria-label="返回设置">
          <ChevronLeft size={34} strokeWidth={1.8} />
        </Link>
        <h1 className="text-center text-[24px] font-medium tracking-[0.08em]">个人设置</h1>
        <span />
      </header>

      <div>
        <section className="mt-[18px] bg-white pl-[17px]">
          <SettingsRow icon={IdCard} label="ID" value={displayId} />
          <SettingsRow icon={Smartphone} label={accountLabel} value={accountValue} actionable />
        </section>

        <p className="mt-[26px] px-[17px] pb-4 text-[14px] leading-[1.6] text-[#d95f68]">*输入出生信息，将会在用户列表排盘置顶，便于用户使用</p>

        <section className="bg-white pl-[17px]">
          <SettingsRow icon={UserRound} label="昵称" value={profile.name || "未填写"} actionable onClick={() => startEdit("name")} />
          <SettingsRow icon={UsersRound} label="性别" value={profile.gender || "未填写"} actionable onClick={() => startEdit("gender")} />
          <SettingsRow icon={Clock3} label="出生时间" value={formatProfileBirthTime(profile.birthTime)} actionable onClick={() => startEdit("birthTime")} />
          <SettingsRow icon={MapPin} label="出生地区" value={profile.birthPlace || "未填写"} actionable last onClick={() => startEdit("birthPlace")} />
        </section>

        <section className="mt-6 bg-white pl-[17px]">
          <SettingsRow icon={Power} label="账号注销" value="" actionable muted last onClick={() => setDeleteWarningOpen(true)} />
        </section>

        <section className="px-[15px] pt-7">
          <button
            type="button"
            onClick={signOut}
            disabled={signingOut}
            className="flex h-[54px] w-full items-center justify-center rounded-full bg-[#eeeeee] text-[18px] font-medium tracking-[0.08em] text-[#666] disabled:opacity-60"
          >
            {signingOut ? <Loader2 className="animate-spin" size={21} /> : "退出登录"}
          </button>
        </section>
      </div>

      {editingField ? (
        <ProfileEditDialog
          field={editingField}
          value={draftValue}
          onChange={setDraftValue}
          onClose={() => setEditingField(null)}
          onSave={saveEdit}
        />
      ) : null}

      {deleteWarningOpen ? (
        <DeleteAccountDialog
          deleting={deletingAccount}
          onClose={() => setDeleteWarningOpen(false)}
          onConfirm={deleteAccount}
        />
      ) : null}
    </main>
  );
}

function SettingsRow({
  icon,
  label,
  value,
  actionable = false,
  muted = false,
  last = false,
  onClick
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  actionable?: boolean;
  muted?: boolean;
  last?: boolean;
  onClick?: () => void;
}) {
  const Icon = icon;
  const content = (
    <>
      <Icon className={muted ? "text-[#b3b3b3]" : "text-[#6f7275]"} size={21} strokeWidth={1.9} />
      <span className={`text-[18px] font-medium ${muted ? "text-[#8a8a8a]" : "text-black"}`}>{label}</span>
      <span className="flex min-w-0 items-center justify-end text-right text-[16px] text-[#8d8d8d]">
        <span className="max-w-[160px] truncate">{value}</span>
        {actionable ? <ChevronRight className="ml-1 shrink-0 text-[#999]" size={20} strokeWidth={2.1} /> : null}
      </span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`grid min-h-[58px] w-full grid-cols-[38px_minmax(0,1fr)_auto] items-center gap-2 pr-[18px] text-left ${last ? "" : "border-b border-[#eeeeee]"}`}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={`grid min-h-[58px] grid-cols-[38px_minmax(0,1fr)_auto] items-center gap-2 pr-[18px] ${last ? "" : "border-b border-[#eeeeee]"}`}>
      {content}
    </div>
  );
}

function ProfileEditDialog({
  field,
  value,
  onChange,
  onClose,
  onSave
}: {
  field: EditableProfileField;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const titleMap: Record<EditableProfileField, string> = {
    name: "修改昵称",
    gender: "修改性别",
    birthTime: "修改出生时间",
    birthPlace: "修改出生地区"
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 px-4 pb-5">
      <div className="w-full max-w-[398px] rounded-[24px] bg-white p-5 shadow-soft">
        <div className="mb-5 flex items-center justify-between">
          <button type="button" onClick={onClose} className="text-[18px] text-[#888]">
            取消
          </button>
          <h2 className="text-[22px] font-semibold">{titleMap[field]}</h2>
          <button type="button" onClick={onSave} className="text-[18px] font-semibold text-[#a58024]">
            保存
          </button>
        </div>

        {field === "gender" ? (
          <div className="grid grid-cols-2 gap-3">
            {["男", "女"].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onChange(item)}
                className={`h-14 rounded-full text-[20px] font-medium ${value === item ? "bg-black text-[#e8d4a7]" : "bg-[#f2f2f0] text-[#555]"}`}
              >
                {item}
              </button>
            ))}
          </div>
        ) : (
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            type={field === "birthTime" ? "datetime-local" : "text"}
            maxLength={field === "name" ? 20 : 60}
            placeholder={field === "birthPlace" ? "请输入出生地区" : "请输入内容"}
            className="h-14 w-full rounded-[14px] bg-[#f2f2f0] px-4 text-[19px] outline-none"
            autoFocus
          />
        )}
      </div>
    </div>
  );
}

function DeleteAccountDialog({
  deleting,
  onClose,
  onConfirm
}: {
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 px-4 pb-5">
      <div className="w-full max-w-[398px] rounded-[24px] bg-white px-5 pb-5 pt-6 shadow-soft">
        <h2 className="text-center text-[22px] font-semibold tracking-[0.04em] text-black">确认注销账号？</h2>
        <p className="mt-4 text-[16px] leading-7 text-[#666]">
          注销账户会清空该账号的所有资料、排盘记录、AI 报告、登录信息和相关账号数据。删除后无法恢复。
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button type="button" onClick={onClose} disabled={deleting} className="h-[52px] rounded-full bg-[#eeeeee] text-[18px] font-medium text-[#666] disabled:opacity-65">
            取消
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="flex h-[52px] items-center justify-center rounded-full bg-[#bd3f59] text-[18px] font-semibold text-white disabled:opacity-65"
          >
            {deleting ? <Loader2 className="animate-spin" size={22} /> : "确认注销"}
          </button>
        </div>
      </div>
    </div>
  );
}

function getStoredProfile(
  user: AuthSessionResponse["user"],
  storedUser: (LoginResponse["user"] & { email?: string; name?: string }) | null
): UserProfileSettings {
  try {
    const rawProfile = window.localStorage.getItem("sm1:user-settings");
    if (rawProfile) {
      const profile = JSON.parse(rawProfile) as Partial<UserProfileSettings>;
      return {
        name: profile.name || user?.name || storedUser?.name || "",
        gender: profile.gender || "",
        birthTime: profile.birthTime || "",
        birthPlace: profile.birthPlace || ""
      };
    }
  } catch {
    // Ignore malformed local profile data and fall back to account data.
  }

  return {
    name: user?.name || storedUser?.name || "",
    gender: "",
    birthTime: "",
    birthPlace: ""
  };
}

function getDefaultProfile(
  user: AuthSessionResponse["user"],
  storedUser: (LoginResponse["user"] & { email?: string; name?: string }) | null
): UserProfileSettings {
  return {
    name: user?.name || storedUser?.name || "",
    gender: "",
    birthTime: "",
    birthPlace: ""
  };
}

function saveStoredProfile(profile: UserProfileSettings) {
  window.localStorage.setItem("sm1:user-settings", JSON.stringify(profile));
}

function formatProfileBirthTime(value: string) {
  if (!value) {
    return "未填写";
  }

  return value.replace("T", " ");
}

function isPhoneOrEmail(value: string) {
  return /^1[3-9]\d{9}$/.test(value.replace(/\s|-/g, "")) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getPasswordFormError({
  identifier
}: {
  identifier: string;
}) {
  if (identifier && !isPhoneOrEmail(identifier)) {
    return "请输入正确的手机号或邮箱";
  }

  return "";
}

function getStoredUser(): (LoginResponse["user"] & { email?: string; name?: string }) | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawUser = window.localStorage.getItem("sm1:user");
    return rawUser ? (JSON.parse(rawUser) as LoginResponse["user"] & { email?: string; name?: string }) : null;
  } catch {
    return null;
  }
}

function PasswordField({
  value,
  onChange,
  visible,
  onToggleVisible,
  placeholder,
  ariaLabel
}: {
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggleVisible: () => void;
  placeholder: string;
  ariaLabel: string;
}) {
  return (
    <div className="grid h-[54px] grid-cols-[minmax(0,1fr)_48px] items-center rounded-full bg-[#f2f2f0]">
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 bg-transparent px-6 pr-3 text-[20px] text-ink outline-none placeholder:text-[#aaa8a1]"
        type={visible ? "text" : "password"}
        maxLength={32}
        placeholder={placeholder}
        aria-label={ariaLabel}
      />
      <button type="button" onClick={onToggleVisible} className="flex h-full items-center justify-center text-[#59544d]" aria-label={visible ? "隐藏密码" : "显示密码"}>
        {visible ? <EyeOff size={21} /> : <Eye size={21} />}
      </button>
    </div>
  );
}

function LoginMethod({ label, icon, onClick }: { label: string; icon: LucideIcon; onClick?: () => void }) {
  const Icon = icon;

  return (
    <button type="button" onClick={onClick} className="flex w-[92px] flex-col items-center text-[15px]" aria-label={label}>
      <span className="mb-3 flex h-[46px] w-[46px] items-center justify-center rounded-full bg-[#f6f0e2] text-[#a58024]">
        <Icon size={24} strokeWidth={2.2} />
      </span>
      <span className="leading-tight text-[#55514a]">{label}</span>
    </button>
  );
}
