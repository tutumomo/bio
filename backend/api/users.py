import uuid
from fastapi import APIRouter, Depends, Response, Query, HTTPException
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from backend.auth.dependencies import get_current_user
from backend.core.database import get_db
from backend.models.user import SearchHistory, User

router = APIRouter(prefix="/api/user", tags=["user"])


@router.get("/me")
async def get_me(user: User = Depends(get_current_user)):
    return {
        "id": str(user.id),
        "email": user.email,
        "name": user.name,
        "avatar_url": user.avatar_url,
        "provider": user.provider,
    }


@router.get("/history")
async def get_history(
    limit: int = Query(50, ge=1, le=200),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(SearchHistory)
        .where(SearchHistory.user_id == user.id)
        .order_by(desc(SearchHistory.searched_at))
        .limit(limit)
    )
    result = await db.execute(stmt)
    rows = result.scalars().all()
    return {
        "history": [
            {
                "id": str(row.id),
                "query": row.query,
                "gene_count": row.gene_count,
                "variant_count": row.variant_count,
                "searched_at": row.searched_at.isoformat(),
            }
            for row in rows
        ],
        "total": len(rows),
    }


@router.delete("/history/{history_id}")
async def delete_history_entry(
    history_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        entry_uuid = uuid.UUID(history_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid history ID format")

    stmt = select(SearchHistory).where(
        SearchHistory.id == entry_uuid,
        SearchHistory.user_id == user.id,
    )
    result = await db.execute(stmt)
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="History entry not found")
    await db.delete(entry)
    await db.commit()
    return {"status": "ok"}


@router.delete("/history")
async def clear_history(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import delete as sql_delete
    stmt = sql_delete(SearchHistory).where(
        SearchHistory.user_id == user.id
    )
    await db.execute(stmt)
    await db.commit()
    return {"status": "ok"}


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token")
    return {"status": "ok"}
