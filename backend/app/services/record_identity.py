import hashlib
import json
import re
import unicodedata
from datetime import UTC, datetime
from typing import Any


RECORD_IDENTITY_VERSION = 1
_LOCAL_DATETIME_PATTERN = re.compile(r"^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})(?::(\d{2}))?(?:\.(\d+))?$")
_OFFSET_PATTERN = re.compile(r"(Z|[+-]\d{2}:\d{2})$", re.IGNORECASE)


class RecordIdentityMismatchError(ValueError):
    """客户端声明的身份与服务端按同一契约复算的身份不一致。"""


class RecordLifecycleConflictError(RuntimeError):
    """旧生命周期的后台写入试图覆盖或复活较新的记录。"""


def build_record_identity(value: dict[str, Any]) -> dict[str, Any]:
    canonical = canonicalize_record_identity(value)
    serialized = json.dumps(canonical, ensure_ascii=False, separators=(",", ":"), sort_keys=True)
    digest = hashlib.sha256(serialized.encode("utf-8")).hexdigest()
    return {
        "identityVersion": RECORD_IDENTITY_VERSION,
        "recordKey": f'{value["type"]}:v{RECORD_IDENTITY_VERSION}:{digest}',
        "canonical": canonical,
    }


def validate_record_key(supplied: str | None, computed: str) -> None:
    if supplied is not None and supplied != computed:
        raise RecordIdentityMismatchError("recordKey 与盘局身份不匹配")


def build_bazi_identity_input(
    *,
    name: str,
    gender: str,
    birth_time: str,
    location: str | None,
    longitude: float | None,
    latitude: float | None,
    use_solar_time: bool,
) -> dict[str, Any]:
    return {
        "type": "bazi",
        "name": name,
        "gender": gender,
        "birthTime": birth_time,
        "locationKey": location,
        "longitude": longitude,
        "latitude": latitude,
        "useSolarTime": use_solar_time,
    }


def build_divination_identity_input(
    record_type: str,
    payload: dict[str, Any],
    *,
    question: str,
    created_at: datetime,
) -> dict[str, Any]:
    occurred_at = created_at.isoformat()

    if record_type == "qimen":
        input_value = _mapping(payload.get("input"))
        return {
            "type": "qimen",
            "question": input_value.get("question", question),
            "dateTime": input_value.get("dateTime", occurred_at),
            "birthYear": input_value.get("birthYear"),
            "plateType": input_value.get("plateType"),
            "juMethod": input_value.get("juMethod"),
            "zhiFuJiGong": input_value.get("zhiFuJiGong"),
            "manualDunType": input_value.get("manualDunType"),
            "manualJu": input_value.get("manualJu"),
            "juMode": input_value.get("juMode"),
        }

    if record_type == "ziwei":
        profile = _mapping(payload.get("profile"))
        return {
            "type": "ziwei",
            "name": profile.get("name", question),
            "gender": profile.get("gender", "male"),
            "birthTime": profile.get("birthTime", occurred_at),
            "locationKey": profile.get("location"),
        }

    if record_type == "daliuren":
        input_value = _mapping(payload.get("input"))
        return {
            "type": "daliuren",
            "question": input_value.get("question", question),
            "dateTime": input_value.get("dateTime", occurred_at),
            "birthYear": input_value.get("birthYear", created_at.year),
            "gender": input_value.get("gender", "male"),
        }

    if record_type == "liuyao":
        stored_input = _mapping(payload.get("input"))
        input_value = _mapping(stored_input.get("input"))
        casting = _mapping(payload.get("casting"))
        lines = casting.get("lines")
        sorted_lines = sorted(
            (item for item in lines if isinstance(item, dict)) if isinstance(lines, list) else [],
            key=lambda item: int(item.get("position", 0)),
        )
        return {
            "type": "liuyao",
            "question": input_value.get("question", question),
            "completedAt": casting.get("completedAt", stored_input.get("savedAt", occurred_at)),
            "castingTime": input_value.get("castingTime"),
            "castingMethod": input_value.get("castingMethod"),
            "lineTotals": [item.get("total") for item in sorted_lines if item.get("total") is not None],
        }

    raise ValueError(f"Unsupported record identity type: {record_type}")


def canonicalize_record_identity(value: dict[str, Any]) -> dict[str, Any]:
    record_type = value.get("type")
    if record_type == "bazi":
        has_coordinates = value.get("longitude") is not None and value.get("latitude") is not None
        return {
            "birthTime": _normalize_datetime(value["birthTime"]),
            "gender": value["gender"],
            "latitude": _normalize_coordinate(value.get("latitude")),
            "locationKey": None if has_coordinates else _normalize_location_key(value.get("locationKey")),
            "longitude": _normalize_coordinate(value.get("longitude")),
            "name": _normalize_text(value.get("name", "")),
            "type": record_type,
            "useSolarTime": bool(value.get("useSolarTime")),
            "version": RECORD_IDENTITY_VERSION,
        }
    if record_type == "ziwei":
        return {
            "birthTime": _normalize_datetime(value["birthTime"]),
            "gender": value["gender"],
            "locationKey": _normalize_location_key(value.get("locationKey")),
            "name": _normalize_text(value.get("name", "")),
            "type": record_type,
            "version": RECORD_IDENTITY_VERSION,
        }
    if record_type == "qimen":
        return {
            "birthYear": value.get("birthYear"),
            "dateTime": _normalize_datetime(value["dateTime"]),
            "juMethod": _normalize_optional_text(value.get("juMethod")),
            "juMode": _normalize_optional_text(value.get("juMode")),
            "manualDunType": _normalize_optional_text(value.get("manualDunType")),
            "manualJu": value.get("manualJu"),
            "plateType": _normalize_optional_text(value.get("plateType")),
            "question": _normalize_text(value.get("question", "")),
            "type": record_type,
            "version": RECORD_IDENTITY_VERSION,
            "zhiFuJiGong": _normalize_optional_text(value.get("zhiFuJiGong")),
        }
    if record_type == "daliuren":
        return {
            "birthYear": value["birthYear"],
            "dateTime": _normalize_datetime(value["dateTime"]),
            "gender": value["gender"],
            "question": _normalize_text(value.get("question", "")),
            "type": record_type,
            "version": RECORD_IDENTITY_VERSION,
        }
    if record_type == "liuyao":
        return {
            "castingMethod": _normalize_optional_text(value.get("castingMethod")),
            "castingTime": _normalize_datetime(value["castingTime"]) if value.get("castingTime") else None,
            "completedAt": _normalize_datetime(value["completedAt"]),
            "lineTotals": [int(item) for item in value.get("lineTotals", [])],
            "question": _normalize_text(value.get("question", "")),
            "type": record_type,
            "version": RECORD_IDENTITY_VERSION,
        }
    raise ValueError(f"Unsupported record identity type: {record_type}")


def _normalize_text(value: str) -> str:
    normalized = unicodedata.normalize("NFKC", str(value)).strip()
    return re.sub(r"\s+", " ", normalized)


def _normalize_optional_text(value: object) -> str | None:
    return _normalize_text(str(value)) if value else None


def _normalize_location_key(value: object) -> str | None:
    return re.sub(r"\s+", "", _normalize_text(str(value))) if value else None


def _normalize_coordinate(value: object) -> str | None:
    if value is None:
        return None
    return f"{float(value):.6f}"


def _normalize_datetime(value: str) -> str:
    normalized = _normalize_text(value).replace(" ", "T", 1)
    local_match = _LOCAL_DATETIME_PATTERN.match(normalized)
    if local_match:
        return f'{local_match.group(1)}:{local_match.group(2) or "00"}'

    if _OFFSET_PATTERN.search(normalized):
        parsed = datetime.fromisoformat(normalized.replace("Z", "+00:00").replace("z", "+00:00"))
        utc_value = parsed.astimezone(UTC).replace(microsecond=0)
        return utc_value.isoformat().replace("+00:00", "Z")

    return normalized


def _mapping(value: object) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}
