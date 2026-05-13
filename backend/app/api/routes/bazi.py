import asyncpg
from fastapi import APIRouter, Depends, HTTPException, Request

from app.db import get_connection
from app.schemas.bazi import BaziChartInput, BaziChartResponse, BaziChartsResponse
from app.services.auth import get_user_by_session_token
from app.services.bazi import create_bazi_chart, get_bazi_chart, list_bazi_charts


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
    return {"chart": await create_bazi_chart(connection, user_id, body)}


@router.get("/charts/{chart_id}", response_model=BaziChartResponse)
async def get_chart(chart_id: str, request: Request, connection: asyncpg.Connection = Depends(get_connection)) -> dict[str, object]:
    user_id = await require_user_id(connection, request)
    chart = await get_bazi_chart(connection, user_id, chart_id)

    if not chart:
        raise HTTPException(status_code=404, detail="未找到该八字排盘记录")

    return {"chart": chart}


async def require_user_id(connection: asyncpg.Connection, request: Request) -> str:
    session = await get_user_by_session_token(connection, request.cookies.get("sm1_session"))
    user = session.get("user") if session else None

    if not isinstance(user, dict) or not user.get("id"):
        raise HTTPException(status_code=401, detail="请先登录后再保存排盘")

    return str(user["id"])
