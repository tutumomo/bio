---
phase: 03-authentication-history
plan: 01
subsystem: Auth
tags: [auth, persistence, user-identity]
dependency_graph:
  requires: []
  provides: [USER-PERSISTENCE]
  affects: [backend/api/auth.py, backend/auth/dependencies.py, backend/api/users.py]
tech_stack: [FastAPI, SQLAlchemy, PostgreSQL, JWT]
key_files:
  - backend/api/auth.py
  - backend/auth/dependencies.py
  - backend/api/users.py
  - backend/models/user.py
decisions:
  - use-sqlalchemy-model-in-dependency: "Changed get_current_user to return a full SQLAlchemy User model instance instead of a dict payload to ensure downstream endpoints have direct access to database-backed user data."
metrics:
  duration: "30m"
  completed_date: "2025-01-24"
---

# Phase 03 Plan 01: Persistent Auth & User Identity Summary

Refactored the authentication flow to persist users in the PostgreSQL database and updated the current user dependency to return a full SQLAlchemy model instance.

## Key Changes

### 1. User Persistence in OAuth Callback
- Updated `backend/api/auth.py` to check for existing users or create new ones during the Google/GitHub callback.
- The JWT `sub` field now contains the internal UUID of the `User` record instead of the provider's ID.
- User metadata (email, name, avatar URL) is updated on every login.

### 2. Model-Backed Auth Dependency
- Refactored `backend/auth/dependencies.py` to fetch the `User` model from the database using the UUID stored in the JWT `sub`.
- Updated `get_current_user` and `get_optional_user` to return SQLAlchemy `User` instances.

### 3. Updated User Endpoints
- Updated `/api/user/me` and history-related endpoints in `backend/api/users.py` to work with the `User` model instance provided by the dependency.
- Ensured consistency across all user-related API calls.

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

### Automated Tests
- `pytest backend/tests/test_auth.py`: PASSED (Added new tests for model-backed dependency)
- `pytest backend/tests/test_genes_limit.py`: PASSED
- `pytest backend/tests/test_variants_filtering.py`: PASSED

### Self-Check: PASSED
- [x] Google/GitHub callback correctly identifies and persists user in DB
- [x] JWT sub field contains the internal UUID of the user
- [x] get_current_user dependency returns the SQLAlchemy User model instance

## Known Stubs
None.
