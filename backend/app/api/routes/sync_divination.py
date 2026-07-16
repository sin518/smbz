import asyncpg
from fastapi import APIRouter, Depends, HTTPException, Request

from app.db import get_connection
from app.schemas.divination_records import (
    DivinationRecordSyncRequest,
    DivinationRecordSyncResponse,
    DivinationRecordType,
)
from app.services.auth import get_user_by_session_token
from app.services.divination_records import upsert_divination_record


router = APIRouter(prefix="/sync", tags=["sync"])


@router.post("/{record_type}", response_model=DivinationRecordSyncResponse)
async def sync_divination_record(
    record_type: DivinationRecordType,
    body: DivinationRecordSyncRequest,
    request: Request,
    connection: asyncpg.Connection = Depends(get_connection),
) -> DivinationRecordSyncResponse:
    user_id = await require_user_id(connection, request)
    server_id, synced_at, created = await upsert_divination_record(connection, user_id, record_type, body)
    return DivinationRecordSyncResponse(
        serverId=server_id,
        syncedAt=synced_at.isoformat(),
        created=created,
    )


async def require_user_id(connection: asyncpg.Connection, request: Request) -> str:
    session = await get_user_by_session_token(connection, request.cookies.get("sm1_session"))
    user = session.get("user") if session else None

    if not isinstance(user, dict) or not user.get("id"):
        raise HTTPException(status_code=401, detail="请先登录后再同步排盘记录")

    return str(user["id"])
