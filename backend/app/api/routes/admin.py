import json
from collections.abc import Sequence
from datetime import datetime
from typing import Any

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, Request, Response

from app.core.config import get_settings
from app.db import get_connection
from app.services.auth import get_user_by_session_token


router = APIRouter()

RangeValue = tuple[int, int]

USER_SORT_COLUMNS = {
    "id": 'u.id',
    "email": 'u.email',
    "phone": 'u.phone',
    "name": 'u.name',
    "createdAt": 'u."createdAt"',
    "updatedAt": 'u."updatedAt"',
    "lastLoginAt": 'last_login_at',
    "sessionCount": 'session_count',
    "accountProviders": 'account_providers',
    "divinationProfileCount": 'divination_profile_count',
    "baziChartCount": 'bazi_chart_count',
}
SESSION_SORT_COLUMNS = {
    "id": 's.id',
    "userId": 's."userId"',
    "createdAt": 's."createdAt"',
    "updatedAt": 's."updatedAt"',
    "expiresAt": 's."expiresAt"',
    "email": 'u.email',
    "phone": 'u.phone',
}
ACCOUNT_SORT_COLUMNS = {
    "id": 'a.id',
    "userId": 'a."userId"',
    "providerId": 'a."providerId"',
    "accountId": 'a."accountId"',
    "createdAt": 'a."createdAt"',
    "updatedAt": 'a."updatedAt"',
    "email": 'u.email',
}
DIVINATION_PROFILE_SORT_COLUMNS = {
    "id": 'p.id',
    "userId": 'p."userId"',
    "source": "p.source",
    "name": "p.name",
    "gender": "p.gender",
    "birthTime": 'p."birthTime"',
    "createdAt": 'p."createdAt"',
    "updatedAt": 'p."updatedAt"',
    "email": 'u.email',
}
BAZI_CHART_SORT_COLUMNS = {
    "id": "c.id",
    "profileId": 'c."profileId"',
    "userId": 'p."userId"',
    "name": "p.name",
    "gender": "p.gender",
    "birthTime": 'p."birthTime"',
    "createdAt": 'c."createdAt"',
    "updatedAt": 'c."updatedAt"',
    "email": 'u.email',
}


async def require_admin(request: Request, connection: asyncpg.Connection) -> dict[str, Any]:
    session = await get_user_by_session_token(connection, request.cookies.get("sm1_session"))
    user = session.get("user") if session else None
    if not isinstance(user, dict) or not user.get("id"):
        raise HTTPException(status_code=401, detail="请先登录管理员账号")

    settings = get_settings()
    admin_user_ids = parse_csv(settings.admin_user_ids)
    admin_emails = {email.lower() for email in parse_csv(settings.admin_emails)}
    email = str(user.get("email") or "").lower()
    user_id = str(user["id"])

    if not admin_user_ids and not admin_emails:
        raise HTTPException(status_code=403, detail="后台管理员白名单未配置，请设置 ADMIN_USER_IDS 或 ADMIN_EMAILS")

    if user_id not in admin_user_ids and email not in admin_emails:
        raise HTTPException(status_code=403, detail="当前账号没有后台管理权限")

    return user


@router.get("/users")
async def list_users(
    request: Request,
    response: Response,
    connection: asyncpg.Connection = Depends(get_connection),
) -> list[dict[str, Any]]:
    await require_admin(request, connection)
    range_value = parse_range(request)
    filter_value = parse_filter(request)
    sort_sql = parse_sort(request, USER_SORT_COLUMNS, 'u."createdAt" DESC')
    where_sql, args = build_user_filter(filter_value)
    joins = await build_user_metric_joins(connection)

    total = await fetch_count(connection, f'SELECT COUNT(*) FROM "User" u {where_sql}', args)
    rows = await fetch_all_optional(
        connection,
        f'''
        SELECT
          u.id,
          u.email,
          u.phone,
          u.name,
          u.image,
          u."createdAt",
          u."updatedAt",
          {joins["session_select"]},
          {joins["account_select"]},
          {joins["divination_profile_select"]},
          {joins["bazi_chart_select"]}
        FROM "User" u
        {joins["join_sql"]}
        {where_sql}
        ORDER BY {sort_sql}
        LIMIT ${len(args) + 1} OFFSET ${len(args) + 2}
        ''',
        [*args, range_limit(range_value), range_value[0]],
    )
    set_list_headers(response, "users", range_value, total)
    return [serialize_record(row) for row in rows]


@router.get("/me")
async def get_admin_me(
    request: Request,
    connection: asyncpg.Connection = Depends(get_connection),
) -> dict[str, Any]:
    user = await require_admin(request, connection)
    return {"id": user["id"], "email": user.get("email"), "phone": user.get("phone"), "name": user.get("name")}


@router.get("/users/{user_id}")
async def get_user(
    user_id: str,
    request: Request,
    connection: asyncpg.Connection = Depends(get_connection),
) -> dict[str, Any]:
    await require_admin(request, connection)
    joins = await build_user_metric_joins(connection)
    row = await connection.fetchrow(
        f'''
        SELECT
          u.id,
          u.email,
          u.phone,
          u.name,
          u.image,
          u."createdAt",
          u."updatedAt",
          {joins["session_select"]},
          {joins["account_select"]},
          {joins["divination_profile_select"]},
          {joins["bazi_chart_select"]}
        FROM "User" u
        {joins["join_sql"]}
        WHERE u.id = $1
        LIMIT 1
        ''',
        user_id,
    )
    if not row:
        raise HTTPException(status_code=404, detail="未找到用户")
    return serialize_record(row)


@router.get("/sessions")
async def list_sessions(
    request: Request,
    response: Response,
    connection: asyncpg.Connection = Depends(get_connection),
) -> list[dict[str, Any]]:
    await require_admin(request, connection)
    return await list_simple_resource(
        request,
        response,
        connection,
        resource="sessions",
        count_sql='SELECT COUNT(*) FROM "Session" s INNER JOIN "User" u ON u.id = s."userId"',
        list_sql='''
        SELECT
          s.id,
          s."userId",
          u.email,
          u.phone,
          u.name,
          s."expiresAt",
          s."ipAddress",
          s."userAgent",
          s."createdAt",
          s."updatedAt"
        FROM "Session" s
        INNER JOIN "User" u ON u.id = s."userId"
        ''',
        sort_columns=SESSION_SORT_COLUMNS,
        default_sort='s."createdAt" DESC',
        filter_builder=build_joined_user_filter,
    )


@router.get("/accounts")
async def list_accounts(
    request: Request,
    response: Response,
    connection: asyncpg.Connection = Depends(get_connection),
) -> list[dict[str, Any]]:
    await require_admin(request, connection)
    return await list_simple_resource(
        request,
        response,
        connection,
        resource="accounts",
        count_sql='SELECT COUNT(*) FROM "Account" a INNER JOIN "User" u ON u.id = a."userId"',
        list_sql='''
        SELECT
          a.id,
          a."userId",
          u.email,
          u.phone,
          u.name,
          a."providerId",
          a."accountId",
          a.scope,
          a."createdAt",
          a."updatedAt"
        FROM "Account" a
        INNER JOIN "User" u ON u.id = a."userId"
        ''',
        sort_columns=ACCOUNT_SORT_COLUMNS,
        default_sort='a."updatedAt" DESC',
        filter_builder=build_joined_user_filter,
    )


@router.get("/divination-profiles")
async def list_divination_profiles(
    request: Request,
    response: Response,
    connection: asyncpg.Connection = Depends(get_connection),
) -> list[dict[str, Any]]:
    await require_admin(request, connection)
    return await list_simple_resource(
        request,
        response,
        connection,
        resource="divination-profiles",
        count_sql='SELECT COUNT(*) FROM "DivinationProfile" p INNER JOIN "User" u ON u.id = p."userId"',
        list_sql='''
        SELECT
          p.id,
          p."userId",
          u.email,
          u.phone,
          p.source,
          p.name,
          p.gender,
          p."birthTime",
          p.location,
          p."createdAt",
          p."updatedAt"
        FROM "DivinationProfile" p
        INNER JOIN "User" u ON u.id = p."userId"
        ''',
        sort_columns=DIVINATION_PROFILE_SORT_COLUMNS,
        default_sort='p."updatedAt" DESC',
        filter_builder=build_profile_filter,
    )


@router.get("/bazi-charts")
async def list_bazi_charts(
    request: Request,
    response: Response,
    connection: asyncpg.Connection = Depends(get_connection),
) -> list[dict[str, Any]]:
    await require_admin(request, connection)
    return await list_simple_resource(
        request,
        response,
        connection,
        resource="bazi-charts",
        count_sql='''
        SELECT COUNT(*)
        FROM "BaziChart" c
        INNER JOIN "BaziProfile" p ON p.id = c."profileId"
        INNER JOIN "User" u ON u.id = p."userId"
        ''',
        list_sql='''
        SELECT
          c.id,
          c."profileId",
          p."userId",
          u.email,
          u.phone,
          p.name,
          p.gender,
          p."birthTime",
          p.calendar,
          p.location,
          p.longitude,
          p.latitude,
          p."useSolarTime",
          c."createdAt",
          c."updatedAt"
        FROM "BaziChart" c
        INNER JOIN "BaziProfile" p ON p.id = c."profileId"
        INNER JOIN "User" u ON u.id = p."userId"
        ''',
        sort_columns=BAZI_CHART_SORT_COLUMNS,
        default_sort='c."createdAt" DESC',
        filter_builder=build_bazi_filter,
    )


@router.get("/payments")
async def list_payments(
    request: Request,
    response: Response,
    connection: asyncpg.Connection = Depends(get_connection),
) -> list[dict[str, Any]]:
    await require_admin(request, connection)
    set_list_headers(response, "payments", parse_range(request), 0)
    return []


async def list_simple_resource(
    request: Request,
    response: Response,
    connection: asyncpg.Connection,
    *,
    resource: str,
    count_sql: str,
    list_sql: str,
    sort_columns: dict[str, str],
    default_sort: str,
    filter_builder: Any,
) -> list[dict[str, Any]]:
    range_value = parse_range(request)
    filter_value = parse_filter(request)
    where_sql, args = filter_builder(filter_value)
    total = await fetch_count_optional(connection, f"{count_sql} {where_sql}", args)
    rows = await fetch_all_optional(
        connection,
        f'''
        {list_sql}
        {where_sql}
        ORDER BY {parse_sort(request, sort_columns, default_sort)}
        LIMIT ${len(args) + 1} OFFSET ${len(args) + 2}
        ''',
        [*args, range_limit(range_value), range_value[0]],
    )
    set_list_headers(response, resource, range_value, total)
    return [serialize_record(row) for row in rows]


def parse_csv(value: str) -> set[str]:
    return {item.strip() for item in value.split(",") if item.strip()}


def parse_range(request: Request) -> RangeValue:
    raw = request.query_params.get("range")
    if raw:
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, list) and len(parsed) == 2:
                start = max(int(parsed[0]), 0)
                end = max(int(parsed[1]), start)
                return start, min(end, start + 99)
        except (TypeError, ValueError, json.JSONDecodeError):
            pass

    start = max(int(request.query_params.get("_start", 0)), 0)
    end = int(request.query_params.get("_end", start + 25)) - 1
    return start, max(end, start)


def parse_sort(request: Request, allowed_columns: dict[str, str], default_sort: str) -> str:
    raw = request.query_params.get("sort")
    field: str | None = None
    order = "ASC"
    if raw:
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, list) and len(parsed) == 2:
                field = str(parsed[0])
                order = str(parsed[1]).upper()
        except (TypeError, ValueError, json.JSONDecodeError):
            pass

    field = field or request.query_params.get("_sort")
    order = (request.query_params.get("_order") or order).upper()
    if order not in {"ASC", "DESC"}:
        order = "ASC"
    column = allowed_columns.get(field or "")
    return f"{column} {order}" if column else default_sort


def parse_filter(request: Request) -> dict[str, Any]:
    raw = request.query_params.get("filter")
    if not raw:
        return {}
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        return {}
    return parsed if isinstance(parsed, dict) else {}


def build_user_filter(filter_value: dict[str, Any]) -> tuple[str, list[Any]]:
    clauses: list[str] = []
    args: list[Any] = []
    q = str(filter_value.get("q") or "").strip()
    if q:
        args.append(f"%{q}%")
        clauses.append(f'(u.id ILIKE ${len(args)} OR u.email ILIKE ${len(args)} OR u.phone ILIKE ${len(args)} OR u.name ILIKE ${len(args)})')
    user_id = filter_value.get("userId") or filter_value.get("id")
    if isinstance(user_id, str) and user_id:
        args.append(user_id)
        clauses.append(f"u.id = ${len(args)}")
    return ("WHERE " + " AND ".join(clauses), args) if clauses else ("", args)


def build_joined_user_filter(filter_value: dict[str, Any]) -> tuple[str, list[Any]]:
    clauses: list[str] = []
    args: list[Any] = []
    q = str(filter_value.get("q") or "").strip()
    if q:
        args.append(f"%{q}%")
        clauses.append(f'(u.id ILIKE ${len(args)} OR u.email ILIKE ${len(args)} OR u.phone ILIKE ${len(args)} OR u.name ILIKE ${len(args)})')
    user_id = filter_value.get("userId")
    if isinstance(user_id, str) and user_id:
        args.append(user_id)
        clauses.append(f'u.id = ${len(args)}')
    return ("WHERE " + " AND ".join(clauses), args) if clauses else ("", args)


def build_profile_filter(filter_value: dict[str, Any]) -> tuple[str, list[Any]]:
    where_sql, args = build_joined_user_filter(filter_value)
    clauses = [where_sql.replace("WHERE ", "", 1)] if where_sql else []
    source = filter_value.get("source")
    if isinstance(source, str) and source:
        args.append(source)
        clauses.append(f"p.source = ${len(args)}")
    return ("WHERE " + " AND ".join(clauses), args) if clauses else ("", args)


def build_bazi_filter(filter_value: dict[str, Any]) -> tuple[str, list[Any]]:
    return build_joined_user_filter(filter_value)


async def build_user_metric_joins(connection: asyncpg.Connection) -> dict[str, str]:
    has_session = await table_exists(connection, "Session")
    has_account = await table_exists(connection, "Account")
    has_divination_profile = await table_exists(connection, "DivinationProfile")
    has_bazi_chart = await table_exists(connection, "BaziChart") and await table_exists(connection, "BaziProfile")

    joins: list[str] = []
    if has_session:
        joins.append(
            '''
            LEFT JOIN (
              SELECT "userId", COUNT(*) AS session_count, MAX("createdAt") AS last_login_at
              FROM "Session"
              GROUP BY "userId"
            ) s ON s."userId" = u.id
            '''
        )
    if has_account:
        joins.append(
            '''
            LEFT JOIN (
              SELECT "userId", STRING_AGG(DISTINCT "providerId", ', ' ORDER BY "providerId") AS account_providers
              FROM "Account"
              GROUP BY "userId"
            ) a ON a."userId" = u.id
            '''
        )
    if has_divination_profile:
        joins.append(
            '''
            LEFT JOIN (
              SELECT "userId", COUNT(*) AS profile_count
              FROM "DivinationProfile"
              GROUP BY "userId"
            ) dp ON dp."userId" = u.id
            '''
        )
    if has_bazi_chart:
        joins.append(
            '''
            LEFT JOIN (
              SELECT p."userId", COUNT(*) AS chart_count
              FROM "BaziChart" c
              INNER JOIN "BaziProfile" p ON p.id = c."profileId"
              GROUP BY p."userId"
            ) bc ON bc."userId" = u.id
            '''
        )

    return {
        "session_select": 'COALESCE(s.session_count, 0) AS session_count, s.last_login_at' if has_session else '0 AS session_count, NULL AS last_login_at',
        "account_select": "COALESCE(a.account_providers, '') AS account_providers" if has_account else "'' AS account_providers",
        "divination_profile_select": "COALESCE(dp.profile_count, 0) AS divination_profile_count" if has_divination_profile else "0 AS divination_profile_count",
        "bazi_chart_select": "COALESCE(bc.chart_count, 0) AS bazi_chart_count" if has_bazi_chart else "0 AS bazi_chart_count",
        "join_sql": "\n".join(joins),
    }


async def table_exists(connection: asyncpg.Connection, table_name: str) -> bool:
    value = await connection.fetchval("SELECT to_regclass($1)", f'"{table_name}"')
    return value is not None


def range_limit(range_value: RangeValue) -> int:
    return range_value[1] - range_value[0] + 1


def set_list_headers(response: Response, resource: str, range_value: RangeValue, total: int) -> None:
    end = range_value[0] + max(range_limit(range_value) - 1, 0)
    if total:
        end = min(end, total - 1)
    else:
        end = 0
    response.headers["Access-Control-Expose-Headers"] = "Content-Range, X-Total-Count"
    response.headers["Content-Range"] = f"{resource} {range_value[0]}-{end}/{total}"
    response.headers["X-Total-Count"] = str(total)


async def fetch_count(connection: asyncpg.Connection, sql: str, args: Sequence[Any]) -> int:
    value = await connection.fetchval(sql, *args)
    return int(value or 0)


async def fetch_count_optional(connection: asyncpg.Connection, sql: str, args: Sequence[Any]) -> int:
    try:
        return await fetch_count(connection, sql, args)
    except asyncpg.UndefinedTableError:
        return 0


async def fetch_all_optional(connection: asyncpg.Connection, sql: str, args: Sequence[Any]) -> list[asyncpg.Record]:
    try:
        return list(await connection.fetch(sql, *args))
    except asyncpg.UndefinedTableError:
        return []


def serialize_record(row: asyncpg.Record) -> dict[str, Any]:
    output: dict[str, Any] = {}
    for key, value in dict(row).items():
        if isinstance(value, datetime):
            output[key] = value.isoformat()
        else:
            output[key] = value
    return output
