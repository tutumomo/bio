from datetime import date, datetime, timedelta
from typing import Optional, Any, Dict
import uuid
from fastapi import Cookie, HTTPException, Depends, Query
from sqlalchemy import select, desc, func
from sqlalchemy.ext.asyncio import AsyncSession
from backend.auth.jwt import verify_access_token
from backend.core.database import get_db
from backend.models.user import User, SearchHistory


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


async def check_query_limit(
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
) -> Optional[User]:
    """
    Dependency that enforces a daily query limit for authenticated users.
    Endpoints should manually call record_search_history.
    """
    if not current_user:
        return None

    # Enforce per-user daily query limit (100/day)
    today = date.today()
    if current_user.last_query_date != today:
        current_user.daily_query_count = 0
        current_user.last_query_date = today
    
    if current_user.daily_query_count >= 100:
        raise HTTPException(
            status_code=429, 
            detail="Daily query limit reached (100/day)"
        )
    
    current_user.daily_query_count += 1

    # Record history logic (to be called manually by endpoints to include counts)
    # We return the user object so endpoints can use it and commit changes
    return current_user


async def record_search_history(
    db: AsyncSession,
    user: User,
    query: str,
    gene_count: Optional[int] = None,
    variant_count: Optional[int] = None,
    filters: Optional[Dict[str, Any]] = None,
):
    """
    Helper function to record or update search history.
    Should be called after the search is successfully performed.
    """
    # Check for duplicate query within 5 minutes
    five_minutes_ago = datetime.now() - timedelta(minutes=5)
    stmt = (
        select(SearchHistory)
        .where(
            SearchHistory.user_id == user.id,
            SearchHistory.query == query,
            SearchHistory.searched_at >= five_minutes_ago
        )
        .order_by(desc(SearchHistory.searched_at))
        .limit(1)
    )
    
    result = await db.execute(stmt)
    last_history = result.scalar_one_or_none()
    
    if last_history:
        # Just update the timestamp and counts if they are new
        last_history.searched_at = func.now()
        if gene_count is not None:
            last_history.gene_count = gene_count
        if variant_count is not None:
            last_history.variant_count = variant_count
        if filters:
            last_history.filters = filters
    else:
        # Create new entry
        history_entry = SearchHistory(
            user_id=user.id,
            query=query,
            gene_count=gene_count,
            variant_count=variant_count,
            filters=filters,
        )
        db.add(history_entry)
        
    await db.commit()
