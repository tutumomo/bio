# Phase 03: Authentication & History

Add user identity and persist search history across sessions.

## Goal
Secure the platform with OAuth and implement user search history.

## Success Criteria
1. User can sign in using Google or GitHub (requires DB persistence).
2. User's previous searches are listed in the History tab.
3. Clicking a history entry re-renders the cached results without redundant API calls.

## Technical Objectives
1. Refactor `backend/api/auth.py` callback to create/update user in DB.
2. Refactor `backend/auth/dependencies.py`: `get_current_user` should return SQLAlchemy `User` model.
3. Implement history logging in `backend/api/genes.py` or `GenePipeline`.
4. Create `/api/users/me/history` endpoint.
5. Implement `frontend/src/pages/HistoryPage.tsx` and integrate with API.

## Mandatory Implementation Notes
- Use `User` and `SearchHistory` models in `backend/models/user.py`.
- Handle pagination for history.
- Ensure "Click-to-replay" works by passing stored filters and query back to the results view.

## Decisions
- D-01: OAuth 2.0 via Google and GitHub is mandatory (per ROADMAP).
- D-02: JWT `sub` MUST be the internal internal `User.id` (UUID) to ensure consistency.
- D-03: `get_current_user` MUST return the SQLAlchemy `User` instance for direct access to attributes.
- D-04: Use TanStack Query on frontend to handle history list and pagination.

## Deferred Ideas
- None.

## the agent's Discretion
- Exact layout of the HistoryPage rows.
- Choice of how to store and pass filters (JSONB in DB, Query parameters in URL).
