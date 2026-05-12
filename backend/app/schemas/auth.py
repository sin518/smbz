from pydantic import BaseModel, Field, field_validator, model_validator


class AuthUser(BaseModel):
    id: str
    phone: str | None = None
    email: str | None = None
    name: str | None = None
    image: str | None = None
    level: str = "初学弟子"


class SessionPayload(BaseModel):
    id: str
    token: str
    expiresAt: str


class SessionResponse(BaseModel):
    session: SessionPayload
    user: AuthUser


class VerificationCodeRequest(BaseModel):
    phone: str

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        phone = value.replace(" ", "").replace("-", "")
        if len(phone) != 11 or not phone.startswith("1") or not phone.isdigit() or phone[1] not in "3456789":
            raise ValueError("请输入正确的手机号")
        return phone


class VerificationCodeResponse(BaseModel):
    requestId: str
    expiresIn: int
    cooldown: int
    devCode: str | None = None


class SmsLoginRequest(VerificationCodeRequest):
    code: str = Field(pattern=r"^\d{6}$")


class PasswordAuthRequest(BaseModel):
    identifier: str = Field(min_length=1)
    password: str = Field(min_length=1, max_length=32)
    confirmPassword: str | None = None


class RegisterPasswordRequest(PasswordAuthRequest):
    password: str = Field(min_length=8, max_length=32)
    confirmPassword: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if not any(char.isalpha() for char in value) or not any(char.isdigit() for char in value):
            raise ValueError("密码需包含字母和数字")
        return value

    @model_validator(mode="after")
    def validate_confirm_password(self) -> "RegisterPasswordRequest":
        if self.password != self.confirmPassword:
            raise ValueError("两次输入的密码不一致")
        return self


class LoginResponse(BaseModel):
    user: AuthUser


class MessageResponse(BaseModel):
    message: str


class SuccessResponse(BaseModel):
    success: bool
