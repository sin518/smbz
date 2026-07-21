from pydantic import BaseModel, Field, field_validator


class BulkDeleteRequest(BaseModel):
    ids: list[str] = Field(min_length=1, max_length=500)

    @field_validator("ids")
    @classmethod
    def normalize_ids(cls, values: list[str]) -> list[str]:
        normalized: list[str] = []
        seen: set[str] = set()

        for value in values:
            record_id = value.strip()
            if not record_id:
                raise ValueError("记录 ID 不能为空")
            if len(record_id) > 160:
                raise ValueError("记录 ID 过长")
            if record_id not in seen:
                normalized.append(record_id)
                seen.add(record_id)

        return normalized


class BulkDeleteResponse(BaseModel):
    deletedIds: list[str]
    missingIds: list[str]
