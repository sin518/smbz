import asyncpg
from fastapi import APIRouter, Depends, HTTPException, Request

from app.db import get_connection
from app.schemas.divination_records import (
    DivinationRecordCloudListResponse,
    DivinationRecordSyncRequest,
    DivinationRecordSyncResponse,
    DivinationRecordType,
)
from app.schemas.bulk_delete import BulkDeleteRequest, BulkDeleteResponse
from app.services.auth import get_user_by_session_token
from app.services.divination_records import (
    delete_divination_record,
    delete_divination_records,
    list_divination_records,
    upsert_divination_record,
)


router = APIRouter(prefix="/sync", tags=["sync"])


@router.get("/records", response_model=DivinationRecordCloudListResponse)
async def get_cloud_divination_records(
    request: Request,
    connection: asyncpg.Connection = Depends(get_connection),
) -> DivinationRecordCloudListResponse:
    user_id = await require_user_id(connection, request)
    return DivinationRecordCloudListResponse(records=await list_divination_records(connection, user_id))


@router.delete("/records", response_model=BulkDeleteResponse)
async def remove_cloud_divination_records(
    body: BulkDeleteRequest,
    request: Request,
    connection: asyncpg.Connection = Depends(get_connection),
) -> BulkDeleteResponse:
    user_id = await require_user_id(connection, request)
    deleted_ids, missing_ids = await delete_divination_records(connection, user_id, body.ids)
    return BulkDeleteResponse(deletedIds=deleted_ids, missingIds=missing_ids)


@router.delete("/records/{record_id}")
async def remove_cloud_divination_record(
    record_id: str,
    request: Request,
    connection: asyncpg.Connection = Depends(get_connection),
) -> dict[str, bool]:
    user_id = await require_user_id(connection, request)
    deleted = await delete_divination_record(connection, user_id, record_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="未找到该云端排盘记录")
    return {"success": True}


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
