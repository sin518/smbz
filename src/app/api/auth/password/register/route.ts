import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { registerWithPassword, PasswordAuthError } from "@/lib/auth/password-account";

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
    const response = NextResponse.json({ user });

    response.cookies.set("sm1_session", randomUUID(), {
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

    return NextResponse.json({ message: "注册失败，请稍后再试" }, { status: 500 });
  }
}
