from typing import Any, Literal

from pydantic import BaseModel, Field


class BaziChartInput(BaseModel):
    name: str = Field(default="", max_length=20)
    gender: Literal["male", "female"]
    birthTime: str = Field(min_length=1)
    calendar: Literal["solar", "lunar", "pillars"] = "solar"
    location: str | None = Field(default=None, max_length=120)
    longitude: float | None = None
    latitude: float | None = None
    useSolarTime: bool = False
    chartJson: dict[str, Any]


class BaziChartSummary(BaseModel):
    id: str
    profileId: str
    name: str
    gender: Literal["male", "female"]
    birthTime: str
    calendar: Literal["solar", "lunar", "pillars"]
    location: str | None = None
    useSolarTime: bool
    pillars: str
    createdAt: str
    updatedAt: str


class BaziChartDetail(BaziChartSummary):
    chartJson: dict[str, Any]


class BaziChartResponse(BaseModel):
    chart: BaziChartDetail


class BaziChartsResponse(BaseModel):
    charts: list[BaziChartSummary]
