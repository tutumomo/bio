from typing import Optional
import uuid
from fastapi import Cookie, HTTPException, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.auth.jwt import verify_access_token
from backend.core.database import get_db
from backend.models.user import User


async def get_current_user(
    access_token: Optional[str] = Cookie(None),
    db: AsyncSession = Depends(get_db)
) -> User:
    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = verify_access_token(access_token)
    if payload is None or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    try:
        user_id = uuid.UUID(payload["sub"])
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
        
    return user


async def get_optional_user(
    access_token: Optional[str] = Cookie(None),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """Returns the current user payload, or None if not authenticated."""
    if not access_token:
        return None
    payload = verify_access_token(access_token)
    if payload is None or "sub" not in payload:
        return None

    try:
        user_id = uuid.UUID(payload["sub"])
    except ValueError:
        return None

    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()
