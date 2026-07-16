from fastapi import APIRouter, Depends, HTTPException, Request
import asyncpg

from app.db import get_connection
from app.schemas.bazi import BaziChartInput, BaziChartResponse, BaziChartsResponse
from app.services.auth import get_user_by_session_token
from app.services.bazi import create_bazi_chart, delete_bazi_chart, get_bazi_chart, list_bazi_charts
from app.services.record_save_helper import save_record_with_cache


router = APIRouter()


@router.get("/charts", response_model=BaziChartsResponse)
async def get_charts(request: Request, connection: asyncpg.Connection = Depends(get_connection)) -> dict[str, object]:
    user_id = await require_user_id(connection, request)
    return {"charts": await list_bazi_charts(connection, user_id)}


@router.post("/charts", response_model=BaziChartResponse)
async def save_chart(
    body: BaziChartInput,
    request: Request,
    connection: asyncpg.Connection = Depends(get_connection),
) -> dict[str, object]:
    user_id = await require_user_id(connection, request)

    # 尝试使用 Redis 缓存保存
    try:
        result = await save_record_with_cache(
            record_type="bazi",
            user_id=user_id,
            data=body.model_dump(),
        )
        return {"chart": {"id": result.id, **body.model_dump()}, "isPending": result.is_pending}
    except Exception:
        # Redis 不可用时降级到直接保存
        return {"chart": await create_bazi_chart(connection, user_id, body)}


@router.get("/charts/{chart_id}", response_model=BaziChartResponse)
async def get_chart(chart_id: str, request: Request, connection: asyncpg.Connection = Depends(get_connection)) -> dict[str, object]:
    user_id = await require_user_id(connection, request)
    chart = await get_bazi_chart(connection, user_id, chart_id)

    if not chart:
        raise HTTPException(status_code=404, detail="未找到该八字排盘记录")

    return {"chart": chart}


@router.delete("/charts/{chart_id}")
async def delete_chart(chart_id: str, request: Request, connection: asyncpg.Connection = Depends(get_connection)) -> dict[str, bool]:
    user_id = await require_user_id(connection, request)
    deleted = await delete_bazi_chart(connection, user_id, chart_id)

    if not deleted:
        raise HTTPException(status_code=404, detail="未找到该八字排盘记录")

    return {"ok": True}


async def require_user_id(connection: asyncpg.Connection, request: Request) -> str:
    session = await get_user_by_session_token(connection, request.cookies.get("sm1_session"))
    user = session.get("user") if session else None

    if not isinstance(user, dict) or not user.get("id"):
        raise HTTPException(status_code=401, detail="请先登录后再保存排盘")

    return str(user["id"])
