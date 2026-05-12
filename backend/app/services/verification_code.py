import random
import time
from dataclasses import dataclass
from uuid import uuid4

from fastapi import HTTPException

from app.core.config import get_settings


CODE_TTL_SECONDS = 5 * 60
SEND_COOLDOWN_SECONDS = 60
MAX_VERIFY_ATTEMPTS = 5


@dataclass
class VerificationRecord:
    code: str
    expires_at: float
    next_send_at: float
    attempts_left: int
    request_id: str


_records: dict[str, VerificationRecord] = {}


def normalize_china_phone(phone: str) -> str:
    return phone.replace(" ", "").replace("-", "")


def mask_phone(phone: str) -> str:
    if len(phone) != 11:
        return phone
    return f"{phone[:3]}****{phone[-4:]}"


async def send_verification_code(raw_phone: str) -> dict[str, int | str | None]:
    phone = normalize_china_phone(raw_phone)
    now = time.time()
    current = _records.get(phone)

    if current and current.next_send_at > now:
        wait = int(current.next_send_at - now + 0.999)
        raise HTTPException(status_code=429, detail=f"请 {wait} 秒后再获取验证码")

    code = f"{random.randint(0, 999999):06d}"
    record = VerificationRecord(
        code=code,
        request_id=str(uuid4()),
        attempts_left=MAX_VERIFY_ATTEMPTS,
        expires_at=now + CODE_TTL_SECONDS,
        next_send_at=now + SEND_COOLDOWN_SECONDS,
    )
    _records[phone] = record
    await deliver_verification_code(phone, code)

    return {
        "requestId": record.request_id,
        "expiresIn": CODE_TTL_SECONDS,
        "cooldown": SEND_COOLDOWN_SECONDS,
        "devCode": code if should_expose_dev_code() else None,
    }


def verify_code(raw_phone: str, code: str) -> dict[str, str]:
    phone = normalize_china_phone(raw_phone)
    record = _records.get(phone)
    now = time.time()

    if not record:
        raise HTTPException(status_code=400, detail="请先获取验证码")

    if record.expires_at <= now:
        _records.pop(phone, None)
        raise HTTPException(status_code=400, detail="验证码已过期，请重新获取")

    if record.attempts_left <= 0:
        _records.pop(phone, None)
        raise HTTPException(status_code=429, detail="验证码错误次数过多，请重新获取")

    if record.code != code.strip():
        record.attempts_left -= 1
        raise HTTPException(status_code=400, detail=f"验证码不正确，还可尝试 {record.attempts_left} 次")

    _records.pop(phone, None)
    return {"phone": phone, "maskedPhone": mask_phone(phone)}


async def deliver_verification_code(phone: str, code: str) -> None:
    settings = get_settings()
    if settings.sms_provider == "development":
        print(f"[verification-code] {mask_phone(phone)} code: {code}")
        return

    # TODO: 接入正式短信厂商。密钥只能从后端环境变量读取，不能进入前端包。
    raise HTTPException(status_code=503, detail="短信服务暂未配置，请联系管理员")


def should_expose_dev_code() -> bool:
    settings = get_settings()
    return not settings.is_production and settings.sms_provider == "development"
