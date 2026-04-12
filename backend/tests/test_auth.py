import pytest
import uuid
from unittest.mock import AsyncMock, MagicMock
from fastapi import HTTPException
from backend.auth.jwt import create_access_token, verify_access_token
from backend.auth.dependencies import get_current_user
from backend.models.user import User
from sqlalchemy.ext.asyncio import AsyncSession

def test_jwt_roundtrip():
    token = create_access_token({"sub": "test-user-id", "email": "test@example.com"})
    payload = verify_access_token(token)
    assert payload["sub"] == "test-user-id"
    assert payload["email"] == "test@example.com"

def test_jwt_invalid_token():
    payload = verify_access_token("invalid.token.here")
    assert payload is None

@pytest.mark.asyncio
async def test_get_current_user_valid():
    user_id = uuid.uuid4()
    token = create_access_token({"sub": str(user_id)})
    
    mock_user = User(id=user_id, email="test@example.com")
    mock_db = AsyncMock(spec=AsyncSession)
    
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = mock_user
    mock_db.execute.return_value = mock_result
    
    user = await get_current_user(access_token=token, db=mock_db)
    assert user.id == user_id
    assert user.email == "test@example.com"

@pytest.mark.asyncio
async def test_get_current_user_missing_token():
    with pytest.raises(HTTPException) as excinfo:
        await get_current_user(access_token=None, db=AsyncMock())
    assert excinfo.value.status_code == 401
    assert excinfo.value.detail == "Not authenticated"

@pytest.mark.asyncio
async def test_get_current_user_invalid_token():
    with pytest.raises(HTTPException) as excinfo:
        await get_current_user(access_token="invalid", db=AsyncMock())
    assert excinfo.value.status_code == 401
    assert excinfo.value.detail == "Invalid token"

@pytest.mark.asyncio
async def test_get_current_user_not_found():
    user_id = uuid.uuid4()
    token = create_access_token({"sub": str(user_id)})
    
    mock_db = AsyncMock(spec=AsyncSession)
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_db.execute.return_value = mock_result
    
    with pytest.raises(HTTPException) as excinfo:
        await get_current_user(access_token=token, db=mock_db)
    assert excinfo.value.status_code == 401
    assert excinfo.value.detail == "User not found"
