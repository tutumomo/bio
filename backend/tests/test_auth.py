import pytest
from backend.auth.jwt import create_access_token, verify_access_token

def test_jwt_roundtrip():
    token = create_access_token({"sub": "test-user-id", "email": "test@example.com"})
    payload = verify_access_token(token)
    assert payload["sub"] == "test-user-id"
    assert payload["email"] == "test@example.com"

def test_jwt_invalid_token():
    payload = verify_access_token("invalid.token.here")
    assert payload is None
