import { NextResponse } from "next/server";
import { z } from "zod";
import { calculateDaliuren, toDaliurenText } from "taibu-core/daliuren";

export const runtime = "nodejs";

const daliurenCalculateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59).optional(),
  timezone: z.string().trim().min(1).max(80).optional(),
  question: z.string().trim().max(120).optional(),
  birthYear: z.number().int().min(1900).max(2100).optional(),
  gender: z.enum(["male", "female"]).optional()
});

export async function POST(request: Request) {
  let rawInput: unknown;

  try {
    rawInput = await request.json();
  } catch {
    return NextResponse.json({ error: "请求体必须是 JSON" }, { status: 400 });
  }

  const parsed = daliurenCalculateSchema.safeParse(rawInput);

  if (!parsed.success) {
    return NextResponse.json({ error: "大六壬起课参数无效" }, { status: 400 });
  }

  try {
    const chart = calculateDaliuren(parsed.data);
    return NextResponse.json({
      chart,
      canonicalText: toDaliurenText(chart, { detailLevel: "full" })
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "大六壬起课失败" },
      { status: 500 }
    );
  }
}
