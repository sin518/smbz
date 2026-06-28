import asyncpg
from fastapi import APIRouter, Depends, HTTPException, Request

from app.db import get_connection
from app.schemas.ai_analysis import AiQuickAnalysisCachePutRequest, AiQuickAnalysisCacheResponse
from app.services.ai_analysis_cache import get_ai_quick_analysis_cache, upsert_ai_quick_analysis_cache
from app.services.auth import get_user_by_session_token


router = APIRouter()


@router.get("/quick-analysis-cache/{request_hash}", response_model=AiQuickAnalysisCacheResponse)
async def get_quick_analysis_cache(
    request_hash: str,
    request: Request,
    source: str,
    connection: asyncpg.Connection = Depends(get_connection),
) -> AiQuickAnalysisCacheResponse:
    user_id = await require_user_id(connection, request)
    cached = await get_ai_quick_analysis_cache(connection, user_id, source, request_hash)

    if not cached:
        raise HTTPException(status_code=404, detail="未找到 AI 分析缓存")

    return cached


@router.put("/quick-analysis-cache/{request_hash}", response_model=AiQuickAnalysisCacheResponse)
async def put_quick_analysis_cache(
    request_hash: str,
    body: AiQuickAnalysisCachePutRequest,
    request: Request,
    connection: asyncpg.Connection = Depends(get_connection),
) -> AiQuickAnalysisCacheResponse:
    user_id = await require_user_id(connection, request)
    return await upsert_ai_quick_analysis_cache(connection, user_id, body.source, request_hash, body)


async def require_user_id(connection: asyncpg.Connection, request: Request) -> str:
    session = await get_user_by_session_token(connection, request.cookies.get("sm1_session"))
    user = session.get("user") if session else None

    if not isinstance(user, dict) or not user.get("id"):
        raise HTTPException(status_code=401, detail="请先登录后再进行 AI 分析")

    return str(user["id"])
