from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


DivinationRecordType = Literal["liuyao", "qimen", "ziwei", "daliuren"]


class DivinationRecordSyncRequest(BaseModel):
    localId: str = Field(min_length=1, max_length=160)
    question: str = Field(default="", max_length=200)
    summary: str = Field(default="", max_length=120)
    detail: str = Field(default="", max_length=500)
    payload: dict[str, Any]
    createdAt: datetime


class DivinationRecordSyncResponse(BaseModel):
    success: bool = True
    serverId: str
    syncedAt: str
    created: bool
