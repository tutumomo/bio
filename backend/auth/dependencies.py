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
