import pytest
import httpx
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.ncbi import NCBIClient
from backend.core.resilience import retry_http

client = TestClient(app)

@pytest.mark.asyncio
async def test_ncbi_retry_on_503():
    """
    Verify that NCBIClient retries on 503 and eventually raises if it persists.
    """
    ncbi_client = NCBIClient()
    
    # Mock httpx.AsyncClient.get to return 503 twice then 200
    dummy_request = httpx.Request("GET", "https://example.com")
    mock_response_503 = httpx.Response(503, content=b"Service Unavailable", request=dummy_request)
    mock_response_200 = httpx.Response(200, json={"esearchresult": {"idlist": ["123"]}}, request=dummy_request)
    
    with patch("httpx.AsyncClient.get") as mock_get:
        mock_get.side_effect = [mock_response_503, mock_response_503, mock_response_200]
        
        # We need to mock the __aenter__ and __aexit__ since we use 'async with'
        # Actually patching AsyncClient might be easier
        with patch("httpx.AsyncClient", autospec=True) as mock_client_class:
            mock_client_instance = mock_client_class.return_value.__aenter__.return_value
            mock_client_instance.get.side_effect = [mock_response_503, mock_response_503, mock_response_200]
            
            # Decrease sleep time for tests
            with patch("asyncio.sleep", return_value=None):
                result = await ncbi_client.search_genes("BRCA1")
                assert result == ["123"]
                assert mock_client_instance.get.call_count == 3

@pytest.mark.asyncio
async def test_ncbi_fails_after_3_retries():
    """
    Verify that NCBIClient raises HTTPStatusError after all retries fail.
    """
    ncbi_client = NCBIClient()
    dummy_request = httpx.Request("GET", "https://example.com")
    mock_response_503 = httpx.Response(503, content=b"Service Unavailable", request=dummy_request)
    
    with patch("httpx.AsyncClient", autospec=True) as mock_client_class:
        mock_client_instance = mock_client_class.return_value.__aenter__.return_value
        mock_client_instance.get.return_value = mock_response_503
        
        with patch("asyncio.sleep", return_value=None):
            with pytest.raises(httpx.HTTPStatusError) as excinfo:
                await ncbi_client.search_genes("BRCA1")
            assert excinfo.value.response.status_code == 503
            assert mock_client_instance.get.call_count == 3

def test_api_returns_503_on_upstream_503():
    """
    Integration-style test for the FastAPI exception handler.
    We mock the NCBIClient to raise an HTTPStatusError and check if the API returns 503.
    """
    mock_response_503 = httpx.Response(503, content=b"Service Unavailable", request=httpx.Request("GET", "https://example.com"))
    
    # We want to trigger the exception handler in main.py
    # Let's mock the search_genes_cached in GenePipeline (which is used by the router)
    with patch("backend.api.genes.pipeline.search_genes_cached", new_callable=AsyncMock) as mock_search:
        mock_search.side_effect = httpx.HTTPStatusError("Service Unavailable", response=mock_response_503, request=mock_response_503.request)
        
        response = client.get("/api/genes/search?q=BRCA1")
        assert response.status_code == 503
        assert response.json()["error"] == "Upstream Service Error"
        assert response.json()["upstream_status"] == 503

def test_api_returns_504_on_upstream_timeout():
    """
    Integration-style test for the FastAPI timeout exception handler.
    """
    # Create a mock timeout exception
    timeout_exc = httpx.ReadTimeout("Request timed out", request=httpx.Request("GET", "https://example.com"))
    
    with patch("backend.api.genes.pipeline.search_genes_cached", new_callable=AsyncMock) as mock_search:
        mock_search.side_effect = timeout_exc
        
        response = client.get("/api/genes/search?q=BRCA1")
        assert response.status_code == 504
        assert response.json()["error"] == "Upstream Timeout"
