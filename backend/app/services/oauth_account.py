from datetime import UTC, datetime
from uuid import uuid4

import asyncpg

from app.schemas.auth import AuthUser
from app.services.auth import ensure_password_auth_tables


async def ensure_oauth_account_table(connection: asyncpg.Connection) -> None:
    await ensure_password_auth_tables(connection)
    await connection.execute(
        '''
        CREATE TABLE IF NOT EXISTS "Account" (
          id TEXT PRIMARY KEY,
          "accountId" TEXT NOT NULL,
          "providerId" TEXT NOT NULL,
          "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
          "accessToken" TEXT,
          "refreshToken" TEXT,
          "idToken" TEXT,
          "accessTokenExpiresAt" TIMESTAMPTZ,
          "refreshTokenExpiresAt" TIMESTAMPTZ,
          scope TEXT,
          password TEXT,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        '''
    )
    await connection.execute('CREATE INDEX IF NOT EXISTS "Account_userId_idx" ON "Account"("userId")')
    await connection.execute('CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_account_key" ON "Account"("providerId", "accountId")')


async def upsert_oauth_user(
    connection: asyncpg.Connection,
    *,
    provider: str,
    provider_account_id: str,
    email: str | None,
    name: str | None,
    image: str | None,
    access_token: str | None,
    refresh_token: str | None,
    id_token: str | None,
    scope: str | None,
) -> AuthUser:
    await ensure_oauth_account_table(connection)
    now = datetime.now(UTC)

    account = await connection.fetchrow(
        '''
        SELECT u.id, u.phone, u.email, u.name, u.image
        FROM "Account" a
        INNER JOIN "User" u ON u.id = a."userId"
        WHERE a."providerId" = $1 AND a."accountId" = $2
        LIMIT 1
        ''',
        provider,
        provider_account_id,
    )

    if account:
        user_id = account["id"]
        await connection.execute(
            '''
            UPDATE "User"
            SET email = COALESCE(email, $2),
                name = COALESCE($3, name),
                image = COALESCE($4, image),
                "updatedAt" = $5
            WHERE id = $1
            ''',
            user_id,
            email,
            name,
            image,
            now,
        )
    else:
        existing_user = await connection.fetchrow('SELECT id FROM "User" WHERE email = $1 LIMIT 1', email) if email else None
        user_id = existing_user["id"] if existing_user else str(uuid4())

        if existing_user:
            await connection.execute(
                '''
                UPDATE "User"
                SET name = COALESCE($2, name),
                    image = COALESCE($3, image),
                    "updatedAt" = $4
                WHERE id = $1
                ''',
                user_id,
                name,
                image,
                now,
            )
        else:
            await connection.execute(
                'INSERT INTO "User" (id, email, name, image, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $5)',
                user_id,
                email,
                name,
                image,
                now,
            )

    await connection.execute(
        '''
        INSERT INTO "Account" (
          id, "accountId", "providerId", "userId", "accessToken", "refreshToken", "idToken", scope, "createdAt", "updatedAt"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
        ON CONFLICT ("providerId", "accountId")
        DO UPDATE SET
          "userId" = EXCLUDED."userId",
          "accessToken" = EXCLUDED."accessToken",
          "refreshToken" = COALESCE(EXCLUDED."refreshToken", "Account"."refreshToken"),
          "idToken" = EXCLUDED."idToken",
          scope = EXCLUDED.scope,
          "updatedAt" = EXCLUDED."updatedAt"
        ''',
        str(uuid4()),
        provider_account_id,
        provider,
        user_id,
        access_token,
        refresh_token,
        id_token,
        scope,
        now,
    )

    row = await connection.fetchrow('SELECT id, phone, email, name, image FROM "User" WHERE id = $1', user_id)
    return AuthUser(
        id=row["id"],
        phone=row["phone"],
        email=row["email"],
        name=row["name"],
        image=row["image"],
    )
