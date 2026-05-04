import { NextResponse } from "next/server";
import { z } from "zod";
import { createUserSession, registerWithPassword, PasswordAuthError } from "@/lib/auth/password-account";

const registerSchema = z
  .object({
    identifier: z.string().trim().min(1, "请输入手机号或邮箱"),
    password: z
      .string()
      .min(8, "密码至少 8 位")
      .max(32, "密码不能超过 32 位")
      .regex(/[A-Za-z]/, "密码需包含字母")
      .regex(/\d/, "密码需包含数字"),
    confirmPassword: z.string()
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "两次输入的密码不一致",
    path: ["confirmPassword"]
  });

export async function POST(request: Request) {
  try {
    const body = registerSchema.parse(await request.json());
    const user = await registerWithPassword(body.identifier, body.password);
    const sessionToken = await createUserSession(user.id);
    const response = NextResponse.json({ user });

    response.cookies.set("sm1_session", sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0]?.message ?? "请求参数不正确" }, { status: 400 });
    }

    if (error instanceof PasswordAuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    console.error("[password-register]", error);

    return NextResponse.json({ message: getRegisterFailureMessage(error) }, { status: 500 });
  }
}

function getRegisterFailureMessage(error: unknown) {
  if (process.env.NODE_ENV !== "development") {
    return "注册失败，请稍后再试";
  }

  const message = error instanceof Error ? error.message : "";

  if (message.includes("DATABASE_URL")) {
    return "注册失败：数据库连接未配置，请检查 DATABASE_URL";
  }

  if (message.includes("relation") || message.includes("column") || message.includes("does not exist")) {
    return "注册失败：数据库表结构未初始化或字段不匹配，请检查 Prisma/数据库迁移";
  }

  if (message.includes("duplicate key")) {
    return "该账号已注册，请直接登录";
  }

  return "注册失败：服务端保存账号失败，请查看终端日志";
}
