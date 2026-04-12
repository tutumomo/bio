import pytest
import uuid
from datetime import date, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

from httpx import ASGITransport, AsyncClient

from backend.main import app
from backend.models.user import User, SearchHistory
from backend.auth.dependencies import get_current_user, get_optional_user
from backend.core.database import get_db

@pytest.mark.asyncio
async def test_search_history_logging():
    # Mock data
    user_id = uuid.uuid4()
    mock_user = MagicMock(spec=User)
    mock_user.id = user_id
    mock_user.daily_query_count = 0
    mock_user.last_query_date = date.today()
    
    # Mock dependencies
    async def override_get_optional_user():
        return mock_user

    mock_db = AsyncMock()
    # Explicitly make add sync
    mock_db.add = MagicMock()
    # Mock the select(SearchHistory) result to return no duplicate (empty scalar_one_or_none)
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
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
            response = await client.get("/api/genes/search?q=BRCA1")
            assert response.status_code == 200
            
            # Verify SearchHistory was created and added to DB
            assert mock_db.add.called
            history_entry = mock_db.add.call_args[0][0]
            assert isinstance(history_entry, SearchHistory)
            assert history_entry.query == "BRCA1"
            assert history_entry.user_id == user_id
            assert mock_db.commit.called

    # Cleanup
    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_search_history_duplicate_check():
    # Mock data
    user_id = uuid.uuid4()
    mock_user = MagicMock(spec=User)
    mock_user.id = user_id
    mock_user.daily_query_count = 0
    mock_user.last_query_date = date.today()
    
    # Mock existing history
    mock_history = MagicMock(spec=SearchHistory)
    mock_history.id = uuid.uuid4()
    
    # Mock dependencies
    async def override_get_optional_user():
        return mock_user

    mock_db = AsyncMock()
    # Explicitly make add sync
    mock_db.add = MagicMock()
    # Mock the select(SearchHistory) result to return the duplicate
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = mock_history
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
            response = await client.get("/api/genes/search?q=BRCA1")
            assert response.status_code == 200
            
            # Verify SearchHistory was NOT added (it was updated)
            assert not mock_db.add.called
            # Verify searched_at was updated on the existing history entry
            # In our implementation we use func.now() which is an expression, so we can't easily check the value
            assert mock_db.commit.called

    # Cleanup
    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_get_history_paginated():
    # Mock data
    user_id = uuid.uuid4()
    mock_user = MagicMock(spec=User)
    mock_user.id = user_id
    
    # Mock dependencies
    async def override_get_current_user():
        return mock_user

    mock_db = AsyncMock()
    # Explicitly make add and delete sync
    mock_db.add = MagicMock()
    mock_db.delete = MagicMock()
    
    # Mock count result
    mock_count_result = MagicMock()
    mock_count_result.scalar.return_value = 25
    
    # Mock history list
    mock_history_rows = [
        MagicMock(
            id=uuid.uuid4(),
            query="BRCA1",
            gene_count=1,
            variant_count=None,
            filters=None,
            searched_at=datetime.now()
        )
        for _ in range(10)
    ]
    mock_list_result = MagicMock()
    mock_list_result.scalars.return_value.all.return_value = mock_history_rows
    
    # Use a list for side_effect for sequential calls
    mock_db.execute.side_effect = [mock_count_result, mock_list_result]

    async def override_get_db():
        yield mock_db

    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/users/me/history?limit=10&offset=0")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 25
        assert len(data["history"]) == 10
        assert data["history"][0]["query"] == "BRCA1"

    # Cleanup
    app.dependency_overrides.clear()
