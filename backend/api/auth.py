from fastapi import APIRouter, Response
from fastapi.responses import RedirectResponse
import httpx
from backend.auth.jwt import create_access_token
from backend.core.config import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.get("/login/{provider}")
async def login(provider: str):
    if provider == "google":
        redirect_uri = "{}/api/auth/callback/google".format(settings.frontend_url)
        url = (
            "https://accounts.google.com/o/oauth2/v2/auth"
            "?client_id={}"
            "&redirect_uri={}"
            "&response_type=code"
            "&scope=openid email profile"
        ).format(settings.google_client_id, redirect_uri)
        return RedirectResponse(url)
    elif provider == "github":
        redirect_uri = "{}/api/auth/callback/github".format(settings.frontend_url)
        url = (
            "https://github.com/login/oauth/authorize"
            "?client_id={}"
            "&redirect_uri={}"
            "&scope=read:user user:email"
        ).format(settings.github_client_id, redirect_uri)
        return RedirectResponse(url)
    return {"error": "Unsupported provider"}

@router.get("/callback/{provider}")
async def callback(provider: str, code: str, response: Response):
    if provider == "google":
        async with httpx.AsyncClient() as client:
            token_resp = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": settings.google_client_id,
                    "client_secret": settings.google_client_secret,
                    "redirect_uri": "{}/api/auth/callback/google".format(settings.frontend_url),
                    "grant_type": "authorization_code",
                },
            )
            tokens = token_resp.json()
            if "access_token" not in tokens:
                return RedirectResponse(url="{}?auth_error=token_exchange_failed".format(settings.frontend_url))
            user_resp = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": "Bearer {}".format(tokens['access_token'])},
            )
            user_info = user_resp.json()
        jwt_token = create_access_token({
            "sub": user_info["id"],
            "email": user_info.get("email"),
            "name": user_info.get("name"),
            "avatar": user_info.get("picture"),
            "provider": "google",
        })
    elif provider == "github":
        async with httpx.AsyncClient() as client:
            token_resp = await client.post(
                "https://github.com/login/oauth/access_token",
                json={
                    "client_id": settings.github_client_id,
                    "client_secret": settings.github_client_secret,
                    "code": code,
                },
                headers={"Accept": "application/json"},
            )
            tokens = token_resp.json()
            if "access_token" not in tokens:
                return RedirectResponse(url="{}?auth_error=token_exchange_failed".format(settings.frontend_url))
            user_resp = await client.get(
                "https://api.github.com/user",
                headers={"Authorization": "Bearer {}".format(tokens['access_token'])},
            )
            user_info = user_resp.json()
        jwt_token = create_access_token({
            "sub": str(user_info["id"]),
            "email": user_info.get("email"),
            "name": user_info.get("login"),
            "avatar": user_info.get("avatar_url"),
            "provider": "github",
        })
    else:
        return {"error": "Unsupported provider"}

    response = RedirectResponse(url=settings.frontend_url)
    response.set_cookie(
        key="access_token",
        value=jwt_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=7 * 24 * 60 * 60,
    )
    return response
