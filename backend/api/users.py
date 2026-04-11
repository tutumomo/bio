import uuid
from fastapi import APIRouter, Depends, Response, Query
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from backend.auth.dependencies import get_current_user
from backend.core.database import get_db
from backend.models.user import SearchHistory, User

router = APIRouter(prefix="/api/user", tags=["user"])


@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {
        "id": user["sub"],
        "email": user.get("email"),
        "name": user.get("name"),
        "avatar_url": user.get("avatar"),
        "provider": user.get("provider"),
    }


@router.get("/history")
async def get_history(
    limit: int = Query(50, ge=1, le=200),
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(SearchHistory)
        .where(SearchHistory.user_id == uuid.UUID(user["sub"]))
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


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token")
    return {"status": "ok"}
