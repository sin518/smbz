import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserBySessionToken } from "@/lib/auth/password-account";

export async function GET() {
  const token = (await cookies()).get("sm1_session")?.value;

  if (!token) {
    return NextResponse.json(null);
  }

  const session = await getUserBySessionToken(token);

  return NextResponse.json(session);
}
