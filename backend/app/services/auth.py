import asyncio
import hashlib
import hmac
import json
import re
from datetime import UTC, datetime, timedelta
from uuid import uuid4

import asyncpg
from fastapi import HTTPException, Response

from app.redis import optional_redis
from app.schemas.auth import AuthUser
from app.services.verification_code import mask_phone, normalize_china_phone


SESSION_COOKIE = "sm1_session"
SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30
SESSION_REDIS_PREFIX = "session:"
_auth_tables_ready = False
_auth_tables_lock = asyncio.Lock()


def set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        SESSION_COOKIE,
        token,
        httponly=True,
        samesite="lax",
        path="/",
        max_age=SESSION_MAX_AGE_SECONDS,
    )


def clear_auth_cookies(response: Response) -> None:
    for name in [
        "better-auth.session_token",
        "better-auth.session_data",
        "better-auth.account_data",
        "better-auth.dont_remember",
        "better-auth.oauth_state",
        "better-auth.state",
        SESSION_COOKIE,
    ]:
        response.delete_cookie(name, path="/", httponly=True, samesite="lax")


async def register_with_password(connection: asyncpg.Connection, raw_identifier: str, password: str) -> AuthUser:
    identifier_kind, identifier = normalize_account_identifier(raw_identifier)
    await ensure_password_auth_tables(connection)

    existing = await connection.fetchrow(
        f'SELECT id FROM "User" WHERE {identifier_kind} = $1 LIMIT 1',
        identifier,
    )
    if existing:
        raise HTTPException(status_code=409, detail="该账号已注册，请直接登录")

    user_id = str(uuid4())
    now = datetime.now(UTC)
    salt = uuid4().hex
    password_hash = hash_password(password, salt)

    await connection.execute(
        'INSERT INTO "User" (id, phone, email, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $4)',
        user_id,
        identifier if identifier_kind == "phone" else None,
        identifier if identifier_kind == "email" else None,
        now,
    )
    await connection.execute(
        'INSERT INTO "PasswordCredential" (id, "userId", "passwordHash", "passwordSalt", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $5)',
        str(uuid4()),
        user_id,
        password_hash,
        salt,
        now,
    )

    return to_auth_user(user_id, identifier if identifier_kind == "phone" else None, identifier if identifier_kind == "email" else None)


async def login_with_password(connection: asyncpg.Connection, raw_identifier: str, password: str) -> AuthUser:
    identifier_kind, identifier = normalize_account_identifier(raw_identifier)
    await ensure_password_auth_tables(connection)

    row = await connection.fetchrow(
        f'''
        SELECT u.id, u.phone, u.email, c."passwordHash", c."passwordSalt"
        FROM "User" u
        INNER JOIN "PasswordCredential" c ON c."userId" = u.id
        WHERE u.{identifier_kind} = $1
        LIMIT 1
        ''',
        identifier,
    )

    if not row:
        raise HTTPException(status_code=404, detail="账号不存在，请先注册")

    if not is_password_match(password, row["passwordHash"], row["passwordSalt"]):
        raise HTTPException(status_code=401, detail="账号或密码不正确")

    return to_auth_user(row["id"], row["phone"], row["email"])


async def upsert_phone_user(connection: asyncpg.Connection, raw_phone: str) -> AuthUser:
    phone = normalize_china_phone(raw_phone)
    if not re.match(r"^1[3-9]\d{9}$", phone):
        raise HTTPException(status_code=400, detail="请输入正确的手机号")

    await ensure_password_auth_tables(connection)
    existing = await connection.fetchrow('SELECT id, phone, email FROM "User" WHERE phone = $1 LIMIT 1', phone)
    if existing:
        return to_auth_user(existing["id"], existing["phone"], existing["email"])

    user_id = str(uuid4())
    now = datetime.now(UTC)
    await connection.execute(
        'INSERT INTO "User" (id, phone, email, "createdAt", "updatedAt") VALUES ($1, $2, NULL, $3, $3)',
        user_id,
        phone,
        now,
    )
    return to_auth_user(user_id, phone, None)


async def create_user_session(connection: asyncpg.Connection, user_id: str) -> str:
    await ensure_password_auth_tables(connection)
    token = str(uuid4())
    now = datetime.now(UTC)
    expires_at = now + timedelta(seconds=SESSION_MAX_AGE_SECONDS)
    await connection.execute(
        'INSERT INTO "Session" (id, token, "userId", "expiresAt", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $5)',
        str(uuid4()),
        token,
        user_id,
        expires_at,
        now,
    )
    await cache_session_token(connection, token)
    return token


async def get_user_by_session_token(connection: asyncpg.Connection, token: str | None) -> dict[str, object] | None:
    if not token:
        return None

    cached = await get_cached_session(token)
    if cached:
        return cached

    session = await get_user_by_session_token_from_database(connection, token)
    if not session:
        return None

    await set_cached_session(token, session)
    return session


async def delete_session_token(token: str | None) -> None:
    if not token:
        return

    async with optional_redis() as redis:
        if redis is None:
            return
        try:
            await redis.delete(redis_session_key(token))
        except Exception as error:
            print(f"[redis] delete session failed: {type(error).__name__}: {error}")


async def delete_user_session(connection: asyncpg.Connection, token: str | None) -> None:
    if not token:
        return

    await delete_session_token(token)
    try:
        await ensure_password_auth_tables(connection)
        await connection.execute('DELETE FROM "Session" WHERE token = $1', token)
    except asyncpg.PostgresError as error:
        print(f"[database] delete session failed: {error}")


async def delete_account(connection: asyncpg.Connection, user_id: str, email: str | None) -> None:
    cleanup_tables = [
        ('"AiReport"', '"chartId" IN (SELECT id FROM "BaziChart" WHERE "profileId" IN (SELECT id FROM "BaziProfile" WHERE "userId" = $1))'),
        ('"BaziChart"', '"profileId" IN (SELECT id FROM "BaziProfile" WHERE "userId" = $1)'),
        ('"BaziProfile"', '"userId" = $1'),
        ('"DivinationProfile"', '"userId" = $1'),
        ('"PasswordCredential"', '"userId" = $1'),
        ('"Session"', '"userId" = $1'),
        ('"Account"', '"userId" = $1'),
        ('"Verification"', "identifier = $1 OR value = $1"),
        ('"User"', "id = $1 OR email = $2"),
        ('"session"', '"userId" = $1'),
        ('"account"', '"userId" = $1'),
        ('"verification"', "identifier = $1 OR value = $1"),
        ('"user"', "id = $1 OR email = $2"),
    ]

    for table, where in cleanup_tables:
        try:
            if "$2" in where:
                await connection.execute(f"DELETE FROM {table} WHERE {where}", user_id, email)
            else:
                await connection.execute(f"DELETE FROM {table} WHERE {where}", user_id)
        except asyncpg.UndefinedTableError:
            continue


async def ensure_password_auth_tables(connection: asyncpg.Connection) -> None:
    global _auth_tables_ready
    if _auth_tables_ready:
        return

    async with _auth_tables_lock:
        if _auth_tables_ready:
            return

        await ensure_password_auth_tables_uncached(connection)
        _auth_tables_ready = True


async def ensure_password_auth_tables_uncached(connection: asyncpg.Connection) -> None:
    await connection.execute(
        '''
        CREATE TABLE IF NOT EXISTS "User" (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE,
          phone TEXT UNIQUE,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        '''
    )
    await connection.execute('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS email TEXT')
    await connection.execute('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS phone TEXT')
    await connection.execute('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS name TEXT')
    await connection.execute('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS image TEXT')
    await connection.execute('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()')
    await connection.execute('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()')
    await connection.execute('CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"(email) WHERE email IS NOT NULL')
    await connection.execute('CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_key" ON "User"(phone) WHERE phone IS NOT NULL')
    await connection.execute(
        '''
        CREATE TABLE IF NOT EXISTS "PasswordCredential" (
          id TEXT PRIMARY KEY,
          "userId" TEXT NOT NULL UNIQUE REFERENCES "User"(id) ON DELETE CASCADE,
          "passwordHash" TEXT NOT NULL,
          "passwordSalt" TEXT NOT NULL,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        '''
    )
    await connection.execute(
        '''
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
        '''
    )


def hash_password(password: str, salt: str) -> str:
    return hashlib.scrypt(password.encode(), salt=salt.encode(), n=16384, r=8, p=1, dklen=64).hex()


def is_password_match(password: str, expected_hash: str, salt: str) -> bool:
    return hmac.compare_digest(hash_password(password, salt), expected_hash)


def normalize_account_identifier(value: str) -> tuple[str, str]:
    trimmed = value.strip()
    phone = normalize_china_phone(trimmed)
    if re.match(r"^1[3-9]\d{9}$", phone):
        return "phone", phone

    email = trimmed.lower()
    if re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", email):
        return "email", email

    raise HTTPException(status_code=400, detail="请输入正确的手机号或邮箱")


def to_auth_user(user_id: str, phone: str | None, email: str | None) -> AuthUser:
    return AuthUser(id=user_id, phone=mask_phone(phone) if phone else None, email=mask_email(email) if email else None)


def mask_email(email: str) -> str:
    name, _, domain = email.partition("@")
    if not name or not domain:
        return email
    visible = name[: min(3, len(name))]
    suffix = "***" if len(name) > 3 else "*"
    return f"{visible}{suffix}@{domain}"


async def cache_session_token(connection: asyncpg.Connection, token: str) -> None:
    session = await get_user_by_session_token_from_database(connection, token)
    if session:
        await set_cached_session(token, session)


async def get_user_by_session_token_from_database(connection: asyncpg.Connection, token: str) -> dict[str, object] | None:
    await ensure_password_auth_tables(connection)
    row = await connection.fetchrow(
        '''
        SELECT s.id as "sessionId", s.token, s."expiresAt", u.id, u.phone, u.email, u.name, u.image
        FROM "Session" s
        INNER JOIN "User" u ON u.id = s."userId"
        WHERE s.token = $1 AND s."expiresAt" > NOW()
        LIMIT 1
        ''',
        token,
    )

    if not row:
        return None

    return {
        "session": {
            "id": row["sessionId"],
            "token": row["token"],
            "expiresAt": row["expiresAt"].isoformat(),
        },
        "user": AuthUser(
            id=row["id"],
            phone=mask_phone(row["phone"]) if row["phone"] else None,
            email=row["email"],
            name=row["name"],
            image=row["image"],
        ).model_dump(),
    }


async def get_cached_session(token: str) -> dict[str, object] | None:
    async with optional_redis() as redis:
        if redis is None:
            return None

        try:
            raw = await redis.get(redis_session_key(token))
        except Exception as error:
            print(f"[redis] read session failed: {type(error).__name__}: {error}")
            return None

    if not raw:
        return None

    try:
        value = json.loads(raw)
    except json.JSONDecodeError:
        return None

    return value if isinstance(value, dict) else None


async def set_cached_session(token: str, session: dict[str, object]) -> None:
    async with optional_redis() as redis:
        if redis is None:
            return

        try:
            await redis.setex(
                redis_session_key(token),
                SESSION_MAX_AGE_SECONDS,
                json.dumps(session, ensure_ascii=False),
            )
        except Exception as error:
            print(f"[redis] write session failed: {type(error).__name__}: {error}")


def redis_session_key(token: str) -> str:
    return f"{SESSION_REDIS_PREFIX}{token}"
