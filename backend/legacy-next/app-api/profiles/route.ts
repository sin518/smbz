import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/better-auth";
import { getSqlClient } from "@/lib/db/neon";
import { getUserBySessionToken } from "@/lib/auth/password-account";

type ProfileRow = {
  id: string;
  source: string;
  name: string | null;
  gender: "male" | "female";
  birthTime: string;
  location: string | null;
  updatedAt: Date | string;
};

const profileSchema = z.object({
  source: z.string().trim().min(1).max(20),
  name: z.string().trim().max(20).optional().default(""),
  gender: z.enum(["male", "female"]),
  dateTime: z.string().trim().min(1),
  location: z.string().trim().max(80).optional()
});

export async function GET(request: Request) {
  const session = await getCurrentSession(request);
  const userId = session?.user?.id;

  if (!session?.session || !userId) {
    return NextResponse.json({ profiles: [] });
  }

  try {
    const sql = getSqlClient();
    await ensureDivinationProfileTable(sql);
    const rows = await getProfiles(sql, userId);

    if (!rows) {
      return NextResponse.json({ profiles: [] }, { status: 503 });
    }

    return NextResponse.json({
      profiles: rows.map((row) => ({
        id: row.id,
        source: row.source,
        name: row.name ?? "",
        gender: row.gender,
        dateTime: row.birthTime,
        location: row.location ?? undefined
      }))
    });
  } catch {
    return NextResponse.json({ profiles: [] }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const session = await getCurrentSession(request);
  const userId = session?.user?.id;

  if (!session?.session || !userId) {
    return NextResponse.json({ message: "请先登录后再保存档案" }, { status: 401 });
  }

  const parsed = profileSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "档案参数不正确" }, { status: 400 });
  }

  try {
    const body = parsed.data;
    const sql = getSqlClient();
    await ensureDivinationProfileTable(sql);
    const rows = await upsertProfile(sql, userId, body);
    const row = rows?.[0];

    return NextResponse.json({
      profile: row
        ? {
            id: row.id,
            source: row.source,
            name: row.name ?? "",
            gender: row.gender,
            dateTime: row.birthTime,
            location: row.location ?? undefined
          }
        : null
    });
  } catch {
    return NextResponse.json({ message: "档案保存失败，请稍后再试" }, { status: 503 });
  }
}

async function getCurrentSession(request: Request) {
  const token = (await cookies()).get("sm1_session")?.value;

  if (token) {
    try {
      const session = await Promise.race([getUserBySessionToken(token), timeoutSessionLookup()]);

      if (session) {
        return session;
      }
    } catch {
      // Fall through to Better Auth session lookup.
    }
  }

  try {
    const session = await Promise.race([auth.api.getSession({ headers: request.headers }), timeoutSessionLookup()]);

    if (!session?.session || !session.user?.id) {
      return null;
    }

    return {
      session: session.session,
      user: {
        id: session.user.id
      }
    };
  } catch {
    return null;
  }
}

function timeoutSessionLookup() {
  return new Promise<null>((resolve) => {
    setTimeout(() => resolve(null), 4000);
  });
}

async function withDatabaseTimeout<T>(task: Promise<T>) {
  return Promise.race([task, timeoutDatabaseLookup()]);
}

function timeoutDatabaseLookup() {
  return new Promise<null>((resolve) => {
    setTimeout(() => resolve(null), 5000);
  });
}

async function ensureDivinationProfileTable(sql: ReturnType<typeof getSqlClient>) {
  const ready = await withDatabaseTimeout(createDivinationProfileTable(sql));
  if (!ready) {
    throw new Error("Divination profile database lookup timed out");
  }
}

async function createDivinationProfileTable(sql: ReturnType<typeof getSqlClient>) {
  await sql`
    CREATE TABLE IF NOT EXISTS "DivinationProfile" (
      id TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      source TEXT NOT NULL,
      name TEXT,
      gender TEXT NOT NULL,
      "birthTime" TEXT NOT NULL,
      location TEXT,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS "DivinationProfile_userId_updatedAt_idx" ON "DivinationProfile"("userId", "updatedAt" DESC)`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS "DivinationProfile_identity_key" ON "DivinationProfile"("userId", name, gender, "birthTime")`;

  return true;
}

async function getProfiles(sql: ReturnType<typeof getSqlClient>, userId: string) {
  const rows = await withDatabaseTimeout(sql`
    SELECT id, source, name, gender, "birthTime", location, "updatedAt"
    FROM "DivinationProfile"
    WHERE "userId" = ${userId}
    ORDER BY "updatedAt" DESC
    LIMIT 20
  `);

  if (!rows) {
    return null;
  }

  return asRows<ProfileRow>(rows);
}

async function upsertProfile(sql: ReturnType<typeof getSqlClient>, userId: string, body: z.infer<typeof profileSchema>) {
  const now = new Date().toISOString();
  const rows = await withDatabaseTimeout(sql`
    INSERT INTO "DivinationProfile" (id, "userId", source, name, gender, "birthTime", location, "createdAt", "updatedAt")
    VALUES (${randomUUID()}, ${userId}, ${body.source}, ${body.name}, ${body.gender}, ${body.dateTime}, ${body.location ?? null}, ${now}, ${now})
    ON CONFLICT ("userId", name, gender, "birthTime")
    DO UPDATE SET
      source = EXCLUDED.source,
      location = COALESCE(EXCLUDED.location, "DivinationProfile".location),
      "updatedAt" = EXCLUDED."updatedAt"
    RETURNING id, source, name, gender, "birthTime", location, "updatedAt"
  `);

  if (!rows) {
    return null;
  }

  return asRows<ProfileRow>(rows);
}

function asRows<T>(result: unknown): T[] {
  return Array.isArray(result) ? (result as T[]) : [];
}
