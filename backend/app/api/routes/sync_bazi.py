from typing import Any, Literal

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from app.db import get_connection
from app.schemas.bazi import BaziChartInput
from app.services.auth import get_user_by_session_token
from app.services.bazi import create_or_update_local_bazi_chart
from app.services.record_identity import (
    RecordIdentityMismatchError,
    RecordLifecycleConflictError,
    build_bazi_identity_input,
    build_record_identity,
    validate_record_key,
)


router = APIRouter()


class BaziChartSyncRequest(BaseModel):
    localId: str = Field(min_length=1, max_length=160)
    recordKey: str | None = Field(default=None, min_length=1, max_length=160)
    identityVersion: int | None = Field(default=None, ge=1)
    calculationVersion: int | None = Field(default=None, ge=1)
    lifecycleVersion: int = Field(default=1, ge=1)
    submissionMode: Literal["background", "explicit"] = "background"
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
    recordKey: str
    identityVersion: int
    calculationVersion: int
    lifecycleVersion: int


@router.post("/sync/bazi", response_model=BaziChartSyncResponse)
async def sync_bazi_chart(
    body: BaziChartSyncRequest,
    request: Request,
    connection: asyncpg.Connection = Depends(get_connection),
) -> BaziChartSyncResponse:
    user_id = await require_user_id(connection, request)
    profile = body.chartJson.get("profile")
    canonical_birth_time = (
        profile.get("solar")
        if isinstance(profile, dict) and isinstance(profile.get("solar"), str)
        else body.birthTime
    )
    identity = build_record_identity(
        build_bazi_identity_input(
            name=body.name,
            gender=body.gender,
            birth_time=canonical_birth_time,
            location=body.location,
            longitude=body.longitude,
            latitude=body.latitude,
            use_solar_time=body.useSolarTime,
        )
    )
    try:
        validate_record_key(body.recordKey, str(identity["recordKey"]))
        if body.identityVersion is not None and body.identityVersion != int(identity["identityVersion"]):
            raise RecordIdentityMismatchError("identityVersion 与服务端身份契约不匹配")
        chart, created = await create_or_update_local_bazi_chart(
            connection,
            user_id,
            body.localId,
            BaziChartInput(
                **body.model_dump(
                    exclude={
                        "localId",
                        "recordKey",
                        "identityVersion",
                        "calculationVersion",
                        "lifecycleVersion",
                        "submissionMode",
                    }
                )
            ),
            record_key=str(identity["recordKey"]),
            identity_version=int(identity["identityVersion"]),
            calculation_version=body.calculationVersion or 1,
            lifecycle_version=body.lifecycleVersion,
            submission_mode=body.submissionMode,
        )
    except RecordIdentityMismatchError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    except RecordLifecycleConflictError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error

    return BaziChartSyncResponse(
        serverId=chart.id,
        syncedAt=chart.updatedAt,
        created=created,
        recordKey=chart.recordKey or str(identity["recordKey"]),
        identityVersion=chart.identityVersion or int(identity["identityVersion"]),
        calculationVersion=chart.calculationVersion or body.calculationVersion or 1,
        lifecycleVersion=chart.lifecycleVersion,
    )


async def require_user_id(connection: asyncpg.Connection, request: Request) -> str:
    session = await get_user_by_session_token(connection, request.cookies.get("sm1_session"))
    user = session.get("user") if session else None

    if not isinstance(user, dict) or not user.get("id"):
        raise HTTPException(status_code=401, detail="请先登录后再同步八字排盘")

    return str(user["id"])
