import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeChinaPhone, sendVerificationCode, VerificationCodeError } from "@/lib/auth/verification-code";

const requestSchema = z.object({
  phone: z
    .string()
    .transform(normalizeChinaPhone)
    .pipe(z.string().regex(/^1[3-9]\d{9}$/, "请输入正确的手机号"))
});

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const result = await sendVerificationCode(body.phone);

    return NextResponse.json({
      requestId: result.requestId,
      expiresIn: result.expiresIn,
      cooldown: result.cooldown,
      devCode: result.devCode
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0]?.message ?? "请求参数不正确" }, { status: 400 });
    }

    if (error instanceof VerificationCodeError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json({ message: "验证码发送失败，请稍后再试" }, { status: 500 });
  }
}
