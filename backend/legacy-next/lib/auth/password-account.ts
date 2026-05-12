import "server-only";
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "crypto";
import { maskPhone, normalizeChinaPhone } from "@/lib/auth/verification-code";
import { getSqlClient } from "@/lib/db/neon";

export type AuthUser = {
  id: string;
  phone?: string;
  email?: string;
  name?: string | null;
  image?: string | null;
  level: string;
};

type AccountRecord = {
  id: string;
  phone: string | null;
  email: string | null;
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
};

export class PasswordAuthError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
  }
}

export async function registerWithPassword(rawIdentifier: string, password: string): Promise<AuthUser> {
  const identifier = normalizeAccountIdentifier(rawIdentifier);
  const sql = getSqlClient();
  await ensurePasswordAuthTables();

  const existing =
    identifier.kind === "phone"
      ? asRows<Pick<AccountRow, "id">>(await sql`
          SELECT id FROM "User"
          WHERE phone = ${identifier.value}
          LIMIT 1
        `)
      : asRows<Pick<AccountRow, "id">>(await sql`
          SELECT id FROM "User"
          WHERE email = ${identifier.value}
          LIMIT 1
        `);

  if (existing.length > 0) {
    throw new PasswordAuthError("该账号已注册，请直接登录", 409);
  }

  const salt = randomBytes(16).toString("hex");
  const account: AccountRecord = {
    id: randomUUID(),
    phone: identifier.kind === "phone" ? identifier.value : null,
    email: identifier.kind === "email" ? identifier.value : null,
    passwordSalt: salt,
    passwordHash: hashPassword(password, salt),
    createdAt: new Date().toISOString()
  };

  await sql`
    INSERT INTO "User" (id, phone, email, "createdAt", "updatedAt")
    VALUES (${account.id}, ${account.phone}, ${account.email}, ${account.createdAt}, ${account.createdAt})
  `;

  await sql`
    INSERT INTO "PasswordCredential" (id, "userId", "passwordHash", "passwordSalt", "createdAt", "updatedAt")
    VALUES (${randomUUID()}, ${account.id}, ${account.passwordHash}, ${account.passwordSalt}, ${account.createdAt}, ${account.createdAt})
  `;

  return toAuthUser(account);
}

export async function loginWithPassword(rawIdentifier: string, password: string): Promise<AuthUser> {
  const identifier = normalizeAccountIdentifier(rawIdentifier);
  const sql = getSqlClient();
  await ensurePasswordAuthTables();

  const rows =
    identifier.kind === "phone"
      ? asRows<AccountRow>(await sql`
          SELECT
            u.id,
            u.phone,
            u.email,
            u."createdAt",
            c."passwordHash",
            c."passwordSalt"
          FROM "User" u
          INNER JOIN "PasswordCredential" c ON c."userId" = u.id
          WHERE u.phone = ${identifier.value}
          LIMIT 1
        `)
      : asRows<AccountRow>(await sql`
          SELECT
            u.id,
            u.phone,
            u.email,
            u."createdAt",
            c."passwordHash",
            c."passwordSalt"
          FROM "User" u
          INNER JOIN "PasswordCredential" c ON c."userId" = u.id
          WHERE u.email = ${identifier.value}
          LIMIT 1
        `);
  const account = rows[0]
    ? {
        id: rows[0].id,
        phone: rows[0].phone,
        email: rows[0].email,
        createdAt: rows[0].createdAt instanceof Date ? rows[0].createdAt.toISOString() : String(rows[0].createdAt),
        passwordHash: rows[0].passwordHash,
        passwordSalt: rows[0].passwordSalt
      }
    : null;

  if (!account) {
    throw new PasswordAuthError("账号不存在，请先注册", 404);
  }

  if (!isPasswordMatch(password, account)) {
    throw new PasswordAuthError("账号或密码不正确", 401);
  }

  return toAuthUser(account);
}

export async function upsertPhoneUser(rawPhone: string): Promise<AuthUser> {
  const phone = normalizeChinaPhone(rawPhone);
  if (!/^1[3-9]\d{9}$/.test(phone)) {
    throw new PasswordAuthError("请输入正确的手机号", 400);
  }

  const sql = getSqlClient();
  await ensurePasswordAuthTables();

  const existing = asRows<Pick<AccountRow, "id" | "phone" | "email">>(await sql`
    SELECT id, phone, email
    FROM "User"
    WHERE phone = ${phone}
    LIMIT 1
  `)[0];

  if (existing) {
    return toAuthUser({
      id: existing.id,
      phone: existing.phone,
      email: existing.email,
      passwordHash: "",
      passwordSalt: "",
      createdAt: new Date().toISOString()
    });
  }

  const createdAt = new Date().toISOString();
  const account: AccountRecord = {
    id: randomUUID(),
    phone,
    email: null,
    passwordHash: "",
    passwordSalt: "",
    createdAt
  };

  await sql`
    INSERT INTO "User" (id, phone, email, "createdAt", "updatedAt")
    VALUES (${account.id}, ${account.phone}, ${account.email}, ${createdAt}, ${createdAt})
  `;

  return toAuthUser(account);
}

export async function createUserSession(userId: string) {
  const sql = getSqlClient();
  await ensurePasswordAuthTables();

  const token = randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30);

  await sql`
    INSERT INTO "Session" (id, token, "userId", "expiresAt", "createdAt", "updatedAt")
    VALUES (${randomUUID()}, ${token}, ${userId}, ${expiresAt.toISOString()}, ${now.toISOString()}, ${now.toISOString()})
  `;

  return token;
}

export async function getUserBySessionToken(token: string) {
  const sql = getSqlClient();
  await ensurePasswordAuthTables();

  const rows = asRows<SessionUserRow>(await sql`
    SELECT
      s.id as "sessionId",
      s.token,
      s."expiresAt",
      u.id,
      u.phone,
      u.email,
      u.name,
      u.image
    FROM "Session" s
    INNER JOIN "User" u ON u.id = s."userId"
    WHERE s.token = ${token}
      AND s."expiresAt" > NOW()
    LIMIT 1
  `);

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    session: {
      id: row.sessionId,
      token: row.token,
      expiresAt: row.expiresAt
    },
    user: {
      id: row.id,
      phone: row.phone ? maskPhone(row.phone) : undefined,
      email: row.email,
      name: row.name,
      image: row.image,
      level: "初学弟子"
    }
  };
}

export async function ensurePasswordAuthTables() {
  const sql = getSqlClient();

  await sql`
    CREATE TABLE IF NOT EXISTS "User" (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      phone TEXT UNIQUE,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS email TEXT`;
  await sql`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS phone TEXT`;
  await sql`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS name TEXT`;
  await sql`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS image TEXT`;
  await sql`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()`;
  await sql`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"(email) WHERE email IS NOT NULL`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_key" ON "User"(phone) WHERE phone IS NOT NULL`;

  await sql`
    CREATE TABLE IF NOT EXISTS "PasswordCredential" (
      id TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL UNIQUE REFERENCES "User"(id) ON DELETE CASCADE,
      "passwordHash" TEXT NOT NULL,
      "passwordSalt" TEXT NOT NULL,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "Session" (
      id TEXT PRIMARY KEY,
      "expiresAt" TIMESTAMPTZ NOT NULL,
      token TEXT NOT NULL UNIQUE,
      "ipAddress" TEXT,
      "userAgent" TEXT,
      "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

function hashPassword(password: string, salt: string) {
  return scryptSync(password, salt, 64).toString("hex");
}

function isPasswordMatch(password: string, account: AccountRecord) {
  const expected = Buffer.from(account.passwordHash, "hex");
  const received = Buffer.from(hashPassword(password, account.passwordSalt), "hex");

  return expected.length === received.length && timingSafeEqual(expected, received);
}

function toAuthUser(account: AccountRecord): AuthUser {
  return {
    id: account.id,
    phone: account.phone ? maskPhone(account.phone) : undefined,
    email: account.email ? maskEmail(account.email) : undefined,
    level: "初学弟子"
  };
}

type AccountRow = {
  id: string;
  phone: string | null;
  email: string | null;
  createdAt: Date | string;
  passwordHash: string;
  passwordSalt: string;
};

type SessionUserRow = {
  sessionId: string;
  token: string;
  expiresAt: Date | string;
  id: string;
  phone: string | null;
  email: string | null;
  name: string | null;
  image: string | null;
};

function asRows<T>(result: unknown): T[] {
  return Array.isArray(result) ? (result as T[]) : [];
}

function normalizeAccountIdentifier(value: string): { kind: "phone" | "email"; value: string } {
  const trimmed = value.trim();
  const phone = normalizeChinaPhone(trimmed);

  if (/^1[3-9]\d{9}$/.test(phone)) {
    return { kind: "phone", value: phone };
  }

  const email = trimmed.toLowerCase();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { kind: "email", value: email };
  }

  throw new PasswordAuthError("请输入正确的手机号或邮箱", 400);
}

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!name || !domain) {
    return email;
  }

  const visible = name.slice(0, Math.min(3, name.length));
  return `${visible}${name.length > 3 ? "***" : "*"}@${domain}`;
}
