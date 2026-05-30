import { NextResponse } from "next/server";
import { z } from "zod";
import { calculateQimen } from "taibu-core/qimen";

export const runtime = "nodejs";

const qimenCalculateSchema = z.object({
  year: z.number().int().min(1900).max(2100),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59).optional(),
  timezone: z.string().trim().min(1).max(80).optional(),
  question: z.string().trim().max(120).optional(),
  panType: z.literal("zhuan").optional(),
  juMethod: z.enum(["chaibu", "maoshan"]).optional(),
  zhiFuJiGong: z.enum(["ji_liuyi", "ji_wugong"]).optional()
});

export async function POST(request: Request) {
  let rawInput: unknown;

  try {
    rawInput = await request.json();
  } catch {
    return NextResponse.json({ error: "请求体必须是 JSON" }, { status: 400 });
  }

  const parsed = qimenCalculateSchema.safeParse(rawInput);

  if (!parsed.success) {
    return NextResponse.json({ error: "奇门排盘参数无效" }, { status: 400 });
  }

  try {
    const chart = await calculateQimen(parsed.data);
    return NextResponse.json({ chart });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "奇门排盘失败" },
      { status: 500 }
    );
  }
}
