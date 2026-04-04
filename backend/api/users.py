from fastapi import APIRouter, Depends, Response
from backend.auth.dependencies import get_current_user

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

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token")
    return {"status": "ok"}
