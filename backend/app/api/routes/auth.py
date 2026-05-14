from urllib.parse import quote

import asyncpg
from authlib.integrations.base_client.errors import OAuthError
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import RedirectResponse

from app.core.config import get_settings
from app.core.oauth import oauth
from app.db import acquire_connection, get_connection
from app.schemas.auth import (
    LoginResponse,
    PasswordAuthRequest,
    RegisterPasswordRequest,
    SmsLoginRequest,
    SuccessResponse,
    VerificationCodeRequest,
    VerificationCodeResponse,
)
from app.services.auth import (
    clear_auth_cookies,
    create_user_session,
    delete_account,
    get_user_by_session_token,
    login_with_password,
    register_with_password,
    set_session_cookie,
    upsert_phone_user,
)
from app.services.verification_code import send_verification_code, verify_code
from app.services.oauth_account import upsert_oauth_user


router = APIRouter()
settings = get_settings()


@router.get("/get-session")
async def get_session(request: Request, connection: asyncpg.Connection = Depends(get_connection)) -> dict[str, object] | None:
    token = request.cookies.get("sm1_session")
    return await get_user_by_session_token(connection, token)


@router.post("/verification-code", response_model=VerificationCodeResponse)
async def request_verification_code(body: VerificationCodeRequest) -> dict[str, int | str | None]:
    return await send_verification_code(body.phone)


@router.post("/login", response_model=LoginResponse)
async def login_with_sms(
    body: SmsLoginRequest,
    response: Response,
    connection: asyncpg.Connection = Depends(get_connection),
) -> dict[str, object]:
    verify_code(body.phone, body.code)
    user = await upsert_phone_user(connection, body.phone)
    token = await create_user_session(connection, user.id)
    set_session_cookie(response, token)
    return {"user": user}


@router.post("/password/register", response_model=LoginResponse)
async def register_password(
    body: RegisterPasswordRequest,
    response: Response,
    connection: asyncpg.Connection = Depends(get_connection),
) -> dict[str, object]:
    user = await register_with_password(connection, body.identifier, body.password)
    token = await create_user_session(connection, user.id)
    set_session_cookie(response, token)
    return {"user": user}


@router.post("/password/login", response_model=LoginResponse)
async def login_password(
    body: PasswordAuthRequest,
    response: Response,
    connection: asyncpg.Connection = Depends(get_connection),
) -> dict[str, object]:
    user = await login_with_password(connection, body.identifier, body.password)
    token = await create_user_session(connection, user.id)
    set_session_cookie(response, token)
    return {"user": user}


@router.post("/logout", response_model=SuccessResponse)
async def logout(response: Response) -> dict[str, bool]:
    clear_auth_cookies(response)
    return {"success": True}


@router.post("/delete-account", response_model=SuccessResponse)
async def delete_current_account(
    request: Request,
    response: Response,
    connection: asyncpg.Connection = Depends(get_connection),
) -> dict[str, bool]:
    session = await get_user_by_session_token(connection, request.cookies.get("sm1_session"))
    user = session.get("user") if session else None

    if not isinstance(user, dict) or not user.get("id"):
        raise HTTPException(status_code=401, detail="请先登录后再注销账号")

    await delete_account(connection, str(user["id"]), user.get("email") if isinstance(user.get("email"), str) else None)
    clear_auth_cookies(response)
    return {"success": True}


@router.get("/oauth/{provider}/login")
async def oauth_login(provider: str, request: Request) -> Response:
    client = oauth.create_client(provider)
    if client is None:
        raise HTTPException(status_code=503, detail="第三方登录暂未配置，请检查后端 OAuth 环境变量")

    next_path = sanitize_next_path(request.query_params.get("next"))
    if next_path:
        request.session["oauth_next"] = next_path

    redirect_uri = f"{str(request.base_url).rstrip('/')}/api/auth/oauth/{provider}/callback"
    return await client.authorize_redirect(request, redirect_uri)


@router.get("/oauth/{provider}/callback")
async def oauth_callback(
    provider: str,
    request: Request,
) -> RedirectResponse:
    client = oauth.create_client(provider)
    if client is None:
        raise HTTPException(status_code=503, detail="第三方登录暂未配置，请检查后端 OAuth 环境变量")

    try:
        token = await client.authorize_access_token(request)
        profile = await get_oauth_profile(provider, client, token)
        async with acquire_connection() as connection:
            user = await upsert_oauth_user(
                connection,
                provider=provider,
                provider_account_id=profile["account_id"],
                email=profile.get("email"),
                name=profile.get("name"),
                image=profile.get("image"),
                access_token=token.get("access_token"),
                refresh_token=token.get("refresh_token"),
                id_token=token.get("id_token"),
                scope=token.get("scope"),
            )
            session_token = await create_user_session(connection, user.id)
    except OAuthError as error:
        print(f"[oauth:{provider}] provider error: {error.error} {error.description}")
        return oauth_error_redirect("第三方授权失败，请重新登录")
    except HTTPException as error:
        print(f"[oauth:{provider}] service error: {error.detail}")
        return oauth_error_redirect(str(error.detail))
    except asyncpg.PostgresError as error:
        print(f"[oauth:{provider}] database error: {error}")
        return oauth_error_redirect("登录成功但账号保存失败，请检查数据库表结构")
    except Exception as error:
        print(f"[oauth:{provider}] callback error: {type(error).__name__}: {error}")
        return oauth_error_redirect("第三方登录回调失败，请稍后重试")

    next_path = sanitize_next_path(request.session.pop("oauth_next", None))
    redirect_url = f"{settings.frontend_url}{next_path or '/'}"
    redirect = RedirectResponse(redirect_url)
    set_session_cookie(redirect, session_token)
    return redirect


@router.post("/sign-in/social")
async def social_sign_in_redirect(body: dict[str, str]) -> dict[str, str]:
    provider = body.get("provider")
    if provider not in {"google", "github"}:
        raise HTTPException(status_code=400, detail="不支持的第三方登录方式")

    next_path = sanitize_next_path(body.get("callbackURL")) or "/"
    return {"url": f"/api/auth/oauth/{provider}/login?next={next_path}", "redirect": "true"}


async def get_oauth_profile(provider: str, client: object, token: dict[str, object]) -> dict[str, str | None]:
    if provider == "google":
        userinfo = token.get("userinfo")
        if not isinstance(userinfo, dict):
            userinfo = await client.parse_id_token(token)
        account_id = str(userinfo.get("sub") or "")
        if not account_id:
            raise HTTPException(status_code=400, detail="Google 登录未返回用户标识")
        return {
            "account_id": account_id,
            "email": str(userinfo.get("email")) if userinfo.get("email") else None,
            "name": str(userinfo.get("name")) if userinfo.get("name") else None,
            "image": str(userinfo.get("picture")) if userinfo.get("picture") else None,
        }

    if provider == "github":
        response = await client.get("user", token=token)
        userinfo = response.json()
        account_id = str(userinfo.get("id") or "")
        if not account_id:
            raise HTTPException(status_code=400, detail="GitHub 登录未返回用户标识")
        email = userinfo.get("email") or await get_github_primary_email(client, token)
        return {
            "account_id": account_id,
            "email": str(email) if email else None,
            "name": str(userinfo.get("name") or userinfo.get("login") or "") or None,
            "image": str(userinfo.get("avatar_url")) if userinfo.get("avatar_url") else None,
        }

    raise HTTPException(status_code=400, detail="不支持的第三方登录方式")


async def get_github_primary_email(client: object, token: dict[str, object]) -> str | None:
    response = await client.get("user/emails", token=token)
    emails = response.json()
    if not isinstance(emails, list):
        return None

    for item in emails:
        if isinstance(item, dict) and item.get("primary") and item.get("verified") and item.get("email"):
            return str(item["email"])

    return None


def sanitize_next_path(value: str | None) -> str | None:
    if not value or not value.startswith("/") or value.startswith("//"):
        return None
    return value


def oauth_error_redirect(message: str) -> RedirectResponse:
    return RedirectResponse(f"{settings.frontend_url}/settings/login?error={quote(message)}")
