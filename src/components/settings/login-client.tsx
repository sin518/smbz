"use client";

import { Apple, ChevronLeft, IdCard, Loader2, ShieldCheck, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
    level: string;
  };
};

export function LoginClient() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [loadingCode, setLoadingCode] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [message, setMessage] = useState("当前为开发环境，验证码会显示在页面提示中");
  const [devCode, setDevCode] = useState<string | null>(null);

  const normalizedPhone = useMemo(() => phone.replace(/\s|-/g, ""), [phone]);
  const canRequestCode = /^1[3-9]\d{9}$/.test(normalizedPhone) && cooldown === 0 && !loadingCode;
  const canLogin = /^1[3-9]\d{9}$/.test(normalizedPhone) && /^\d{6}$/.test(code) && agreed && !loggingIn;

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
      setMessage("请先阅读并同意用户协议和隐私政策");
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
    if (!canLogin) {
      setMessage(!agreed ? "请先阅读并同意用户协议和隐私政策" : "请填写手机号和 6 位验证码");
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
      router.push("/settings");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "登录失败，请稍后再试");
    } finally {
      setLoggingIn(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-[430px] flex-col overflow-hidden bg-[#0d0b0a] text-white shadow-soft">
      <section className="relative flex min-h-screen flex-col px-7 pb-10 pt-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(128,102,63,0.42),transparent_32%),linear-gradient(180deg,rgba(27,23,20,0.88),rgba(8,7,6,0.96))]" />
        <div className="absolute inset-x-8 top-28 h-[360px] rounded-full bg-[#6d5635]/20 blur-3xl" />

        <div className="relative z-10">
          <Link href="/settings" className="-ml-2 flex h-11 w-11 items-center justify-center" aria-label="返回设置">
            <ChevronLeft size={38} strokeWidth={2.4} />
          </Link>
        </div>

        <section className="relative z-10 mt-28 text-center">
          <h1 className="text-[40px] font-semibold leading-tight">登录提供存储功能</h1>
          <p className="mt-6 text-[22px] font-light leading-normal text-white/58">享受跨设备无缝同步的便利性和可靠性</p>
        </section>

        <section className="relative z-10 mt-16">
          <p className="mb-5 text-center text-[20px] text-white/72">未注册手机验证后即完成注册</p>
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="h-[70px] w-full rounded-full bg-white/70 px-9 text-[22px] text-[#2f2d2a] outline-none placeholder:text-white/80"
            inputMode="tel"
            maxLength={13}
            placeholder="请输入手机号"
            aria-label="手机号"
          />
          <div className="mt-5 grid grid-cols-[minmax(0,1fr)_132px] gap-3">
            <input
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              className="h-[66px] min-w-0 rounded-full bg-white/70 px-8 text-[22px] text-[#2f2d2a] outline-none placeholder:text-white/80"
              inputMode="numeric"
              maxLength={6}
              placeholder="验证码"
              aria-label="验证码"
            />
            <button
              type="button"
              onClick={requestCode}
              disabled={!canRequestCode}
              className="flex h-[66px] items-center justify-center rounded-full bg-white/78 px-3 text-[17px] font-medium text-[#737373] disabled:opacity-55"
              aria-label="获取验证码"
            >
              {loadingCode ? <Loader2 className="animate-spin" size={22} /> : cooldown > 0 ? `${cooldown}s` : "获取验证码"}
            </button>
          </div>
          <p className="mt-4 min-h-7 text-center text-[15px] leading-7 text-[#d8c29b]">{message}</p>
          <button
            type="button"
            onClick={login}
            disabled={!canLogin}
            className="mt-2 flex h-[66px] w-full items-center justify-center rounded-full bg-[#d8b96d] text-[22px] font-semibold text-[#1c1408] disabled:bg-white/28 disabled:text-white/55"
          >
            {loggingIn ? <Loader2 className="animate-spin" size={24} /> : "登录并保存"}
          </button>
          {devCode ? (
            <button type="button" onClick={() => setCode(devCode)} className="mt-3 w-full text-center text-[15px] text-white/55">
              填入开发验证码
            </button>
          ) : null}
        </section>

        <section className="relative z-10 mt-auto text-center">
          <p className="mb-6 text-[19px] text-white/54">其他登录方式</p>
          <div className="flex items-start justify-center gap-14">
            <LoginMethod label="账号密码登录" icon={IdCard} />
            <LoginMethod label="苹果登录" icon={Apple} />
          </div>
        </section>

        <label className="relative z-10 mt-12 flex items-center gap-3 text-[18px] leading-7 text-white/64">
          <input
            checked={agreed}
            onChange={(event) => setAgreed(event.target.checked)}
            type="checkbox"
            className="h-7 w-7 shrink-0 appearance-none rounded-full border-2 border-white/55 bg-transparent checked:border-[#d8b96d] checked:bg-[#d8b96d]"
            aria-label="同意用户协议和隐私政策"
          />
          <span>
            我已阅读并同意
            <Link href="/settings/login" className="text-white">
              《用户协议》
            </Link>
            和
            <Link href="/settings/login" className="text-white">
              《隐私政策》
            </Link>
          </span>
        </label>

        <div className="relative z-10 mt-8 flex justify-center text-white/45">
          <ShieldCheck size={18} />
          <span className="ml-2 text-sm">验证码 5 分钟内有效，请勿泄露给他人</span>
        </div>
      </section>
    </main>
  );
}

function LoginMethod({ label, icon }: { label: string; icon: LucideIcon }) {
  const Icon = icon;

  return (
    <button type="button" className="flex w-[92px] flex-col items-center" aria-label={label}>
      <span className="flex h-[66px] w-[66px] items-center justify-center rounded-full bg-white text-black">
        <Icon size={34} strokeWidth={2.1} />
      </span>
      <span className="mt-4 text-[18px] leading-tight text-white">{label}</span>
    </button>
  );
}
