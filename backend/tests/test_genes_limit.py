import pytest
import uuid
from datetime import date
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi import HTTPException
from httpx import ASGITransport, AsyncClient

from backend.main import app
from backend.models.user import User
from backend.auth.dependencies import get_optional_user
from backend.core.database import get_db

@pytest.mark.asyncio
async def test_search_genes_daily_limit():
    # Mock data
    user_id = uuid.uuid4()
    mock_user = MagicMock(spec=User)
    mock_user.id = user_id
    mock_user.daily_query_count = 100
    mock_user.last_query_date = date.today()
    
    # Mock dependencies
    async def override_get_optional_user():
        return {"sub": str(user_id), "email": "test@example.com"}

    mock_db = AsyncMock()
    # Mock the select(User) result
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = mock_user
    mock_db.execute.return_value = mock_result

    async def override_get_db():
        yield mock_db

    # Mock GenePipeline
    mock_results = [{"symbol": "BRCA1", "ncbi_id": "672"}]
    
    app.dependency_overrides[get_optional_user] = override_get_optional_user
    app.dependency_overrides[get_db] = override_get_db

    with patch("backend.api.genes.pipeline.search_genes_cached", new_callable=AsyncMock) as mock_search:
        mock_search.return_value = mock_results
        
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # 1. Test limit reached
            response = await client.get("/api/genes/search?q=BRCA1")
            assert response.status_code == 429
            assert response.json()["detail"] == "Daily query limit reached (100/day)"
            
            # 2. Test reset logic (new day)
            mock_user.last_query_date = date(2000, 1, 1)
            mock_user.daily_query_count = 100
            
            response = await client.get("/api/genes/search?q=BRCA1")
            assert response.status_code == 200
            assert mock_user.daily_query_count == 1
            assert mock_user.last_query_date == date.today()

            # 3. Test within limit
            mock_user.daily_query_count = 50
            mock_user.last_query_date = date.today()
            
            response = await client.get("/api/genes/search?q=BRCA1")
            assert response.status_code == 200
            assert mock_user.daily_query_count == 51

    # Cleanup
    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_search_genes_unauthenticated():
    # Mock dependencies
    async def override_get_optional_user():
        return None

    app.dependency_overrides[get_optional_user] = override_get_optional_user

    with patch("backend.api.genes.pipeline.search_genes_cached", new_callable=AsyncMock) as mock_search:
        mock_search.return_value = [{"symbol": "BRCA1"}]
        
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/api/genes/search?q=BRCA1")
            assert response.status_code == 200
            assert "genes" in response.json()

    # Cleanup
    app.dependency_overrides.clear()
