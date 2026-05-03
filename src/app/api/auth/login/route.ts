import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { normalizeChinaPhone, verifyCode, VerificationCodeError } from "@/lib/auth/verification-code";

const loginSchema = z.object({
  phone: z
    .string()
    .transform(normalizeChinaPhone)
    .pipe(z.string().regex(/^1[3-9]\d{9}$/, "请输入正确的手机号")),
  code: z.string().trim().regex(/^\d{6}$/, "请输入 6 位验证码")
});

export async function POST(request: Request) {
  try {
    const body = loginSchema.parse(await request.json());
    const user = verifyCode(body.phone, body.code);
    const response = NextResponse.json({
      user: {
        id: randomUUID(),
        phone: user.maskedPhone,
        level: "初学弟子"
      }
    });

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

    if (error instanceof VerificationCodeError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json({ message: "登录失败，请稍后再试" }, { status: 500 });
  }
}
