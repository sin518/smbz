from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


DivinationRecordType = Literal["liuyao", "qimen", "ziwei", "daliuren"]


class DivinationRecordSyncRequest(BaseModel):
    localId: str = Field(min_length=1, max_length=160)
    recordKey: str | None = Field(default=None, min_length=1, max_length=160)
    identityVersion: int | None = Field(default=None, ge=1)
    calculationVersion: int | None = Field(default=None, ge=1)
    lifecycleVersion: int = Field(default=1, ge=1)
    submissionMode: Literal["background", "explicit"] = "background"
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
    recordKey: str | None = None
    identityVersion: int | None = None
    calculationVersion: int | None = None
    lifecycleVersion: int = 1


class DivinationRecordCloudItem(BaseModel):
    id: str
    localId: str
    type: DivinationRecordType
    question: str
    summary: str
    detail: str
    payload: dict[str, Any]
    createdAt: str
    updatedAt: str
    recordKey: str | None = None
    identityVersion: int | None = None
    calculationVersion: int | None = None
    lifecycleVersion: int = 1
    deletedAt: str | None = None


class DivinationRecordCloudListResponse(BaseModel):
    records: list[DivinationRecordCloudItem]
