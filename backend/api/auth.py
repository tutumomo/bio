from fastapi import APIRouter, Response, Depends
from fastapi.responses import RedirectResponse
import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.auth.jwt import create_access_token
from backend.core.config import settings
from backend.core.database import get_db
from backend.models.user import User

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
async def callback(provider: str, code: str, response: Response, db: AsyncSession = Depends(get_db)):
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
        
        provider_id = user_info["id"]
        email = user_info.get("email")
        name = user_info.get("name")
        avatar_url = user_info.get("picture")
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
        
        provider_id = str(user_info["id"])
        email = user_info.get("email")
        name = user_info.get("login")
        avatar_url = user_info.get("avatar_url")
    else:
        return {"error": "Unsupported provider"}

    # Common logic to persist user
    stmt = select(User).where(User.provider == provider, User.provider_id == provider_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        user = User(
            provider=provider,
            provider_id=provider_id,
            email=email,
            name=name,
            avatar_url=avatar_url
        )
        db.add(user)
    else:
        # Update existing fields
        user.email = email
        user.name = name
        user.avatar_url = avatar_url
    
    await db.commit()
    await db.refresh(user)
    
    jwt_token = create_access_token({
        "sub": str(user.id),
        "email": user.email,
        "name": user.name,
        "avatar": user.avatar_url,
        "provider": user.provider,
    })
    
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
