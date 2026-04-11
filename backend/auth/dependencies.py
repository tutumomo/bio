from typing import Optional
from fastapi import Cookie, HTTPException
from backend.auth.jwt import verify_access_token


async def get_current_user(access_token: Optional[str] = Cookie(None)):
    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = verify_access_token(access_token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload


async def get_optional_user(access_token: Optional[str] = Cookie(None)) -> Optional[dict]:
    """Returns the current user payload, or None if not authenticated."""
    if not access_token:
        return None
    return verify_access_token(access_token)
