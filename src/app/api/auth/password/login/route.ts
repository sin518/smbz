import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { loginWithPassword, PasswordAuthError } from "@/lib/auth/password-account";

const loginSchema = z.object({
  identifier: z.string().trim().min(1, "请输入手机号或邮箱"),
  password: z.string().min(1, "请输入密码")
});

export async function POST(request: Request) {
  try {
    const body = loginSchema.parse(await request.json());
    const user = await loginWithPassword(body.identifier, body.password);
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

    return NextResponse.json({ message: "登录失败，请稍后再试" }, { status: 500 });
  }
}
