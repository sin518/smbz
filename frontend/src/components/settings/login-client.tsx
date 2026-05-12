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

type VerificationResponse = {
  requestId: string;
  expiresIn: number;
  cooldown: number;
  devCode?: string;
};

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

type LoginMode = "sms" | "password";
type PasswordMode = "login" | "register";
type SessionStatus = "loading" | "signed-in" | "signed-out";
type EditableProfileField = "name" | "gender" | "birthTime" | "birthPlace";
type UserProfileSettings = {
  name: string;
  gender: string;
  birthTime: string;
  birthPlace: string;
};

const DEFAULT_SMS_MESSAGE = "当前为开发环境，验证码会显示在页面提示中";
const DEFAULT_PASSWORD_MESSAGE = "账号密码仅在本地开发服务中保存";

export function LoginClient({ profileRoute = false }: { profileRoute?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextHref = sanitizeNextHref(searchParams.get("next"));
  const oauthError = searchParams.get("error");
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>(profileRoute ? "loading" : "signed-out");
  const [sessionUser, setSessionUser] = useState<AuthSessionResponse["user"]>(null);
  const [loginMode, setLoginMode] = useState<LoginMode>("sms");
  const [passwordMode, setPasswordMode] = useState<PasswordMode>("login");
  const [phone, setPhone] = useState("");
  const [accountIdentifier, setAccountIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [loadingCode, setLoadingCode] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [agreementShake, setAgreementShake] = useState(false);
  const [message, setMessage] = useState(DEFAULT_SMS_MESSAGE);
  const [devCode, setDevCode] = useState<string | null>(null);

  const normalizedPhone = useMemo(() => phone.replace(/\s|-/g, ""), [phone]);
  const normalizedAccountIdentifier = useMemo(() => accountIdentifier.trim(), [accountIdentifier]);
  const isValidPasswordIdentifier = isPhoneOrEmail(normalizedAccountIdentifier);
  const isValidPassword = /^(?=.*[A-Za-z])(?=.*\d).{8,32}$/.test(password);
  const canRequestCode = /^1[3-9]\d{9}$/.test(normalizedPhone) && cooldown === 0 && !loadingCode;
  const canSmsLogin = /^1[3-9]\d{9}$/.test(normalizedPhone) && /^\d{6}$/.test(code) && agreed && !loggingIn;
  const passwordFormError = getPasswordFormError({
    identifier: normalizedAccountIdentifier,
    password,
    confirmPassword,
    mode: passwordMode
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
    let mounted = true;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      controller.abort();
    }, 5000);

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
          if (!profileRoute && data.user.id) {
            router.replace(buildUserSettingsHref(data.user.id));
            return;
          }
          setSessionStatus("signed-in");
        } else {
          if (profileRoute) {
            router.replace("/settings/login");
            return;
          }
          setSessionStatus("signed-out");
        }
      } catch {
        if (mounted) {
          if (profileRoute) {
            router.replace("/settings/login");
            return;
          }
          setSessionStatus("signed-out");
        }
      }
    }

    void loadSession();

    return () => {
      mounted = false;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setCooldown((value) => Math.max(value - 1, 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldown]);

  async function requestCode() {
    if (!agreed) {
      promptAgreement();
      return;
    }

    if (!/^1[3-9]\d{9}$/.test(normalizedPhone)) {
      setMessage("请输入正确的手机号");
      return;
    }

    setLoadingCode(true);
    setMessage("正在获取验证码...");

    try {
      const response = await fetch("/api/auth/verification-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalizedPhone })
      });
      const data = (await response.json()) as ApiResult<VerificationResponse>;

      if (!response.ok) {
        throw new Error(data.message ?? "验证码发送失败");
      }

      setCooldown(data.cooldown);
      setDevCode(data.devCode ?? null);
      setMessage(data.devCode ? `开发验证码：${data.devCode}` : "验证码已发送，请注意查收");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "验证码发送失败，请稍后再试");
    } finally {
      setLoadingCode(false);
    }
  }

  async function login() {
    if (!agreed) {
      promptAgreement();
      return;
    }

    if (!canSmsLogin) {
      setMessage("请填写手机号和 6 位验证码");
      return;
    }

    setLoggingIn(true);
    setMessage("正在登录...");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalizedPhone, code })
      });
      const data = (await response.json()) as ApiResult<LoginResponse>;

      if (!response.ok) {
        throw new Error(data.message ?? "登录失败");
      }

      window.localStorage.setItem("sm1:user", JSON.stringify(data.user));
      router.push(nextHref ?? buildUserSettingsHref(data.user.id));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "登录失败，请稍后再试");
    } finally {
      setLoggingIn(false);
    }
  }

  async function submitPasswordAuth() {
    if (!agreed) {
      promptAgreement();
      return;
    }

    if (!isValidPasswordIdentifier) {
      setMessage("请输入正确的手机号或邮箱");
      return;
    }

    if (passwordMode === "register" && !isValidPassword) {
      setMessage("密码需为 8-32 位，并同时包含字母和数字");
      return;
    }

    if (passwordMode === "register" && password !== confirmPassword) {
      setMessage("两次输入的密码不一致");
      return;
    }

    if (passwordMode === "login" && !password) {
      setMessage("请输入密码");
      return;
    }

    setLoggingIn(true);
    setMessage(passwordMode === "register" ? "正在注册..." : "正在登录...");

    try {
      const endpoint = passwordMode === "register" ? "/api/auth/password/register" : "/api/auth/password/login";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: normalizedAccountIdentifier,
          password,
          confirmPassword
        })
      });
      const data = (await response.json()) as ApiResult<LoginResponse>;

      if (!response.ok) {
        throw new Error(data.message ?? (passwordMode === "register" ? "注册失败" : "登录失败"));
      }

      window.localStorage.setItem("sm1:user", JSON.stringify(data.user));
      router.push(nextHref ?? buildUserSettingsHref(data.user.id));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : passwordMode === "register" ? "注册失败，请稍后再试" : "登录失败，请稍后再试");
    } finally {
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

    const nextQuery = encodeURIComponent(nextHref ?? "/settings/login");
    window.location.href = `/api/auth/oauth/${provider}/login?next=${nextQuery}`;
  }

  function switchLoginMode(nextMode: LoginMode) {
    setLoginMode(nextMode);
    setMessage(nextMode === "sms" ? DEFAULT_SMS_MESSAGE : DEFAULT_PASSWORD_MESSAGE);
  }

  if (sessionStatus === "loading") {
    return (
      <main className="light-surface-text-scope mx-auto flex min-h-screen max-w-[430px] items-center justify-center bg-paper text-ink shadow-soft">
        <Loader2 className="animate-spin text-[#a58024]" size={30} />
      </main>
    );
  }

  if (sessionStatus === "signed-in") {
    return <UserSettingsPage user={sessionUser} onSignedOut={() => setSessionStatus("signed-out")} />;
  }

  const showInlineMessage = message !== DEFAULT_SMS_MESSAGE && message !== DEFAULT_PASSWORD_MESSAGE;

  return (
    <main className="light-surface-text-scope relative mx-auto min-h-screen max-w-[430px] overflow-hidden bg-paper pb-10 text-ink shadow-soft">
      <header className="sticky top-0 z-20 bg-[#F8F7EE] px-5 pb-5 pt-14">
        <div className="grid grid-cols-[44px_minmax(0,1fr)_44px] items-center">
          <Link href="/settings" className="-ml-2 flex h-10 w-10 items-center justify-center text-ink" aria-label="返回设置">
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

          <div className="mt-6 grid h-10 grid-cols-2 rounded-full bg-[#f2f2f0] p-1">
            <button
              type="button"
              onClick={() => switchLoginMode("sms")}
              className={`rounded-full text-[15px] font-semibold transition-colors ${loginMode === "sms" ? "bg-black text-[#e8d4a7]" : "text-[#8b8985]"}`}
            >
              验证码登录
            </button>
            <button
              type="button"
              onClick={() => switchLoginMode("password")}
              className={`rounded-full text-[15px] font-semibold transition-colors ${loginMode === "password" ? "bg-black text-[#e8d4a7]" : "text-[#8b8985]"}`}
            >
              账号密码
            </button>
          </div>

          <p className="mb-5 mt-6 text-[16px] font-semibold text-[#55514a]">
            {loginMode === "sms" ? "未注册手机验证后即完成注册" : passwordMode === "login" ? "使用账号密码登录" : "创建账号密码登录"}
          </p>

          {loginMode === "sms" ? (
            <>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="h-[54px] w-full rounded-full border-0 bg-[#f2f2f0] px-6 text-[20px] text-ink outline-none placeholder:text-[#aaa8a1]"
                inputMode="tel"
                maxLength={13}
                placeholder="请输入手机号"
                aria-label="手机号"
              />
              {cooldown > 0 || devCode || code ? (
                <input
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="mt-[14px] h-[54px] w-full rounded-full border-0 bg-[#f2f2f0] px-6 text-[20px] text-ink outline-none placeholder:text-[#aaa8a1]"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="请输入验证码"
                  aria-label="验证码"
                />
              ) : null}
              <button
                type="button"
                onClick={cooldown > 0 || code ? login : requestCode}
                disabled={(cooldown <= 0 && !canRequestCode && !code) || loggingIn}
                className={`mt-[14px] flex h-[54px] w-full items-center justify-center rounded-full border-0 bg-black text-[20px] font-semibold text-[#e8d4a7] disabled:opacity-55 ${agreementShake ? "animate-agreement-shake" : ""}`}
              >
                {loadingCode || loggingIn ? <Loader2 className="animate-spin" size={22} /> : cooldown > 0 || code ? "登录并保存" : "获取验证码"}
              </button>
              {cooldown > 0 && !code ? <p className="mt-3 text-[13px] text-mutedInk">{cooldown}s 后可重新获取验证码</p> : null}
              {devCode ? (
                <button type="button" onClick={() => setCode(devCode)} className="mt-2 w-full text-center text-[13px] font-semibold text-[#a58024]">
                  填入开发验证码
                </button>
              ) : null}
            </>
          ) : (
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
                placeholder={passwordMode === "register" ? "设置密码" : "请输入密码"}
                ariaLabel="密码"
              />
              {passwordMode === "register" ? (
                <PasswordField
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  visible={showPassword}
                  onToggleVisible={() => setShowPassword((value) => !value)}
                  placeholder="请再次输入密码"
                  ariaLabel="确认密码"
                />
              ) : null}
              <button
                type="button"
                onClick={submitPasswordAuth}
                disabled={loggingIn}
                className={`flex h-[54px] w-full items-center justify-center rounded-full bg-black text-[20px] font-semibold text-[#e8d4a7] disabled:opacity-55 ${agreementShake ? "animate-agreement-shake" : ""}`}
              >
                {loggingIn ? <Loader2 className="animate-spin" size={22} /> : passwordMode === "register" ? "注册并登录" : "账号密码登录"}
              </button>
              <button
                type="button"
                onClick={() => setPasswordMode(passwordMode === "login" ? "register" : "login")}
                className="w-full text-center text-[14px] font-semibold text-[#a58024]"
              >
                {passwordMode === "login" ? "没有账号？立即注册" : "已有账号？返回登录"}
              </button>
              {passwordFormError ? <p className="px-4 text-[13px] leading-5 text-[#c62828]">{passwordFormError}</p> : null}
            </div>
          )}

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
  const storedUser = getStoredUser();
  const [profile, setProfile] = useState<UserProfileSettings>(() => getStoredProfile(user, storedUser));
  const [editingField, setEditingField] = useState<EditableProfileField | null>(null);
  const [draftValue, setDraftValue] = useState("");
  const userId = user?.id ?? storedUser?.id ?? "";
  const displayId = userId ? userId.slice(0, 8) : "未生成";
  const accountValue = storedUser?.phone || user?.email || storedUser?.email || "未绑定";
  const accountLabel = storedUser?.phone ? "手机号" : "邮箱";

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

function saveStoredProfile(profile: UserProfileSettings) {
  window.localStorage.setItem("sm1:user-settings", JSON.stringify(profile));
}

function formatProfileBirthTime(value: string) {
  if (!value) {
    return "未填写";
  }

  return value.replace("T", " ");
}

function sanitizeNextHref(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  return value;
}

function buildUserSettingsHref(id: string) {
  return `/settings/login/${encodeURIComponent(id)}`;
}

function isPhoneOrEmail(value: string) {
  return /^1[3-9]\d{9}$/.test(value.replace(/\s|-/g, "")) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getPasswordFormError({
  identifier,
  password,
  confirmPassword,
  mode
}: {
  identifier: string;
  password: string;
  confirmPassword: string;
  mode: PasswordMode;
}) {
  if (identifier && !isPhoneOrEmail(identifier)) {
    return "请输入正确的手机号或邮箱";
  }

  if (mode === "register" && password && password.length < 8) {
    return "密码至少需要 8 位";
  }

  if (mode === "register" && password && !/[A-Za-z]/.test(password)) {
    return "密码需包含字母";
  }

  if (mode === "register" && password && !/\d/.test(password)) {
    return "密码需包含数字";
  }

  if (mode === "register" && confirmPassword && password !== confirmPassword) {
    return "两次输入的密码不一致";
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
