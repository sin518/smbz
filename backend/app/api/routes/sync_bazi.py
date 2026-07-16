from typing import Any, Literal

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from app.db import get_connection
from app.schemas.bazi import BaziChartInput
from app.services.auth import get_user_by_session_token
from app.services.bazi import create_or_update_local_bazi_chart


router = APIRouter()


class BaziChartSyncRequest(BaseModel):
    localId: str = Field(min_length=1, max_length=160)
    name: str = Field(default="", max_length=20)
    gender: Literal["male", "female"]
    birthTime: str = Field(min_length=1)
    calendar: Literal["solar", "lunar", "pillars"] = "solar"
    location: str | None = Field(default=None, max_length=120)
    longitude: float | None = None
    latitude: float | None = None
    useSolarTime: bool = False
    chartJson: dict[str, Any]


class BaziChartSyncResponse(BaseModel):
    serverId: str
    syncedAt: str
    created: bool


@router.post("/sync/bazi", response_model=BaziChartSyncResponse)
async def sync_bazi_chart(
    body: BaziChartSyncRequest,
    request: Request,
    connection: asyncpg.Connection = Depends(get_connection),
) -> BaziChartSyncResponse:
    user_id = await require_user_id(connection, request)
    chart, created = await create_or_update_local_bazi_chart(
        connection,
        user_id,
        body.localId,
        BaziChartInput(**body.model_dump(exclude={"localId"})),
    )
    return BaziChartSyncResponse(
        serverId=chart.id,
        syncedAt=chart.updatedAt,
        created=created,
    )


async def require_user_id(connection: asyncpg.Connection, request: Request) -> str:
    session = await get_user_by_session_token(connection, request.cookies.get("sm1_session"))
    user = session.get("user") if session else None

    if not isinstance(user, dict) or not user.get("id"):
        raise HTTPException(status_code=401, detail="请先登录后再同步八字排盘")

    return str(user["id"])
