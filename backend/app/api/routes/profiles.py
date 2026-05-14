import asyncpg
from fastapi import APIRouter, Depends, HTTPException, Request

from app.db import get_connection
from app.schemas.profiles import ProfileIn, ProfileResponse, ProfilesResponse
from app.services.auth import get_user_by_session_token
from app.services.profiles import delete_profile, list_profiles, upsert_profile


router = APIRouter()


@router.get("", response_model=ProfilesResponse)
async def get_profiles(request: Request, connection: asyncpg.Connection = Depends(get_connection)) -> dict[str, object]:
    session = await get_user_by_session_token(connection, request.cookies.get("sm1_session"))
    user = session.get("user") if session else None

    if not isinstance(user, dict) or not user.get("id"):
        return {"profiles": []}

    return {"profiles": await list_profiles(connection, str(user["id"]))}


@router.post("", response_model=ProfileResponse)
async def save_profile(
    body: ProfileIn,
    request: Request,
    connection: asyncpg.Connection = Depends(get_connection),
) -> dict[str, object]:
    session = await get_user_by_session_token(connection, request.cookies.get("sm1_session"))
    user = session.get("user") if session else None

    if not isinstance(user, dict) or not user.get("id"):
        raise HTTPException(status_code=401, detail="请先登录后再保存档案")

    return {"profile": await upsert_profile(connection, str(user["id"]), body)}


@router.delete("/{profile_id}")
async def remove_profile(
    profile_id: str,
    request: Request,
    connection: asyncpg.Connection = Depends(get_connection),
) -> dict[str, bool]:
    session = await get_user_by_session_token(connection, request.cookies.get("sm1_session"))
    user = session.get("user") if session else None

    if not isinstance(user, dict) or not user.get("id"):
        raise HTTPException(status_code=401, detail="请先登录后再删除档案")

    deleted = await delete_profile(connection, str(user["id"]), profile_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="未找到该档案")

    return {"success": True}
