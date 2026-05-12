import { NextResponse } from "next/server";
import { getSqlClient } from "@/lib/db/neon";

type SessionPayload = {
  user?: {
    id?: string | null;
    email?: string | null;
  } | null;
  session?: unknown;
};

const cleanupTables = [
  { table: '"AiReport"', where: '"chartId" IN (SELECT id FROM "BaziChart" WHERE "profileId" IN (SELECT id FROM "BaziProfile" WHERE "userId" = $1))' },
  { table: '"BaziChart"', where: '"profileId" IN (SELECT id FROM "BaziProfile" WHERE "userId" = $1)' },
  { table: '"BaziProfile"', where: '"userId" = $1' },
  { table: '"DivinationProfile"', where: '"userId" = $1' },
  { table: '"PasswordCredential"', where: '"userId" = $1' },
  { table: '"Session"', where: '"userId" = $1' },
  { table: '"Account"', where: '"userId" = $1' },
  { table: '"Verification"', where: 'identifier = $1 OR value = $1' },
  { table: '"User"', where: 'id = $1 OR email = $2' },
  { table: '"session"', where: '"userId" = $1' },
  { table: '"account"', where: '"userId" = $1' },
  { table: '"verification"', where: 'identifier = $1 OR value = $1' },
  { table: '"user"', where: 'id = $1 OR email = $2' }
];

const cookieNames = [
  "better-auth.session_token",
  "better-auth.session_data",
  "better-auth.account_data",
  "better-auth.dont_remember",
  "better-auth.oauth_state",
  "better-auth.state",
  "sm1_session"
];

export async function POST(request: Request) {
  const session = await getCurrentSession(request);
  const userId = session?.user?.id;
  const email = session?.user?.email ?? null;

  if (!session?.session || !userId) {
    return NextResponse.json({ message: "请先登录后再注销账号" }, { status: 401 });
  }

  const sql = getSqlClient();

  for (const item of cleanupTables) {
    await safeDelete(sql, `DELETE FROM ${item.table} WHERE ${item.where}`, [userId, email]);
  }

  try {
    await fetch(new URL("/api/auth/logout", request.url), {
      method: "POST",
      headers: {
        cookie: request.headers.get("cookie") ?? "",
        origin: request.headers.get("origin") ?? new URL(request.url).origin
      }
    });
  } catch {
    // Cookie expiry below is the important browser-facing fallback.
  }

  const response = NextResponse.json({ success: true });

  for (const name of cookieNames) {
    response.cookies.set(name, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0
    });
  }

  return response;
}

async function getCurrentSession(request: Request) {
  try {
    const response = await fetch(new URL("/api/auth/get-session", request.url), {
      method: "GET",
      headers: {
        cookie: request.headers.get("cookie") ?? ""
      }
    });

    return response.ok ? ((await response.json()) as SessionPayload | null) : null;
  } catch {
    return null;
  }
}

async function safeDelete(sql: ReturnType<typeof getSqlClient>, query: string, values: Array<string | null>) {
  try {
    await sql.query(query, values);
  } catch (error) {
    if (!isMissingTableError(error)) {
      throw error;
    }
  }
}

function isMissingTableError(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "42P01");
}
