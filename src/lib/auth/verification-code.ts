import "server-only";
import { randomInt, randomUUID } from "crypto";

export type SendVerificationCodeResult = {
  requestId: string;
  expiresIn: number;
  cooldown: number;
  devCode?: string;
};

type VerificationRecord = {
  code: string;
  expiresAt: number;
  nextSendAt: number;
  attemptsLeft: number;
  requestId: string;
};

const CODE_TTL_SECONDS = 5 * 60;
const SEND_COOLDOWN_SECONDS = 60;
const MAX_VERIFY_ATTEMPTS = 5;

const records = new Map<string, VerificationRecord>();

export class VerificationCodeError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
  }
}

export function normalizeChinaPhone(phone: string) {
  return phone.replace(/\s|-/g, "");
}

export function maskPhone(phone: string) {
  return phone.replace(/^(\d{3})\d{4}(\d{4})$/, "$1****$2");
}

export async function sendVerificationCode(rawPhone: string): Promise<SendVerificationCodeResult> {
  const phone = normalizeChinaPhone(rawPhone);
  const now = Date.now();
  const current = records.get(phone);

  if (current && current.nextSendAt > now) {
    throw new VerificationCodeError(`请 ${Math.ceil((current.nextSendAt - now) / 1000)} 秒后再获取验证码`, 429);
  }

  const code = generateCode();
  const requestId = randomUUID();
  const record: VerificationRecord = {
    code,
    requestId,
    attemptsLeft: MAX_VERIFY_ATTEMPTS,
    expiresAt: now + CODE_TTL_SECONDS * 1000,
    nextSendAt: now + SEND_COOLDOWN_SECONDS * 1000
  };

  records.set(phone, record);
  await deliverVerificationCode(phone, code);

  return {
    requestId,
    expiresIn: CODE_TTL_SECONDS,
    cooldown: SEND_COOLDOWN_SECONDS,
    devCode: shouldExposeDevCode() ? code : undefined
  };
}

export function verifyCode(rawPhone: string, code: string) {
  const phone = normalizeChinaPhone(rawPhone);
  const record = records.get(phone);
  const now = Date.now();

  if (!record) {
    throw new VerificationCodeError("请先获取验证码", 400);
  }

  if (record.expiresAt <= now) {
    records.delete(phone);
    throw new VerificationCodeError("验证码已过期，请重新获取", 400);
  }

  if (record.attemptsLeft <= 0) {
    records.delete(phone);
    throw new VerificationCodeError("验证码错误次数过多，请重新获取", 429);
  }

  if (record.code !== code.trim()) {
    record.attemptsLeft -= 1;
    throw new VerificationCodeError(`验证码不正确，还可尝试 ${record.attemptsLeft} 次`, 400);
  }

  records.delete(phone);
  return {
    phone,
    maskedPhone: maskPhone(phone)
  };
}

function generateCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

async function deliverVerificationCode(phone: string, code: string) {
  const provider = process.env.SMS_PROVIDER ?? "development";

  if (provider === "development") {
    console.info(`[verification-code] ${maskPhone(phone)} code: ${code}`);
    return;
  }

  // TODO: 接入正式短信厂商。建议在此处封装阿里云/腾讯云发送器，密钥只从服务端环境变量读取。
  throw new VerificationCodeError("短信服务暂未配置，请联系管理员", 503);
}

function shouldExposeDevCode() {
  return process.env.NODE_ENV !== "production" && (process.env.SMS_PROVIDER ?? "development") === "development";
}
