from pydantic import BaseModel, Field


class ProfileIn(BaseModel):
    source: str = Field(min_length=1, max_length=20)
    name: str = Field(default="", max_length=20)
    gender: str = Field(pattern=r"^(male|female)$")
    dateTime: str = Field(min_length=1)
    location: str | None = Field(default=None, max_length=80)


class ProfileOut(ProfileIn):
    id: str


class ProfilesResponse(BaseModel):
    profiles: list[ProfileOut]


class ProfileResponse(BaseModel):
    profile: ProfileOut | None
