from typing import Any

from pydantic import BaseModel, Field


class AiQuickAnalysisCachePutRequest(BaseModel):
    source: str = Field(min_length=1, max_length=80)
    requestPayload: dict[str, Any]
    responseBody: dict[str, Any]


class AiQuickAnalysisCacheResponse(BaseModel):
    source: str
    requestHash: str
    responseBody: dict[str, Any]
    createdAt: str
    updatedAt: str
