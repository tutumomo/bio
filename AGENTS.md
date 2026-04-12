# Repository Guidelines

## Project Structure & Module Organization
This repository is split into `backend/` and `frontend/`. The FastAPI app lives in `backend/`, with API routers in `backend/api/`, shared config and DB setup in `backend/core/`, SQLAlchemy models in `backend/models/`, Pydantic schemas in `backend/schemas/`, and external-service integrations in `backend/services/`. Backend tests live in `backend/tests/`. The React app lives in `frontend/src/`, organized into `components/`, `pages/`, `hooks/`, and `lib/`. Reference docs and prior design notes are in `docs/`.

## Build, Test, and Development Commands
Backend:
`cd backend && pip install -r requirements.txt` installs dependencies.
`cd backend && uvicorn backend.main:app --reload --port 8000` runs the API locally.
`cd backend && pytest` runs the backend test suite.

Frontend:
`cd frontend && npm install` installs dependencies.
`cd frontend && npm run dev` starts Vite on port `3000`.
`cd frontend && npm run build` creates the production bundle.
`cd frontend && npm run lint` runs the TypeScript type check (`tsc --noEmit`).

Database:
`docker-compose up -d db` starts PostgreSQL locally, or use `bash brew-setup.sh` for a Homebrew setup.

## Coding Style & Naming Conventions
Python uses 4-space indentation, type hints, and clear async boundaries. Keep modules focused and place new API integrations under `backend/services/`. React and TypeScript files use 2-space indentation, strict typing, and the `@/*` import alias for `frontend/src/*`. Use `PascalCase` for components and pages (`GeneDetailPage.tsx`), `camelCase` for hooks and utilities (`useGeneSearch.ts`, `source-links.ts`), and keep route-facing UI under `pages/`.

## Testing Guidelines
Add backend tests under `backend/tests/` with names like `test_<feature>.py`. Favor API and service-level tests that match the existing `pytest` + `pytest-asyncio` setup. The current frontend has no dedicated test runner; at minimum, run `npm run lint` and verify critical flows manually in the Vite app before opening a PR.

## Commit & Pull Request Guidelines
Recent history follows short Conventional Commit-style subjects such as `feat: add rate limiting with slowapi`. Keep commits scoped and imperative. For pull requests, include a concise summary, note any config or schema changes, link related issues, and attach screenshots for frontend changes. If you touch both apps, describe backend and frontend impact separately.

## Security & Configuration Tips
Do not commit secrets. Backend development requires `DATABASE_URL`, `JWT_SECRET`, and OAuth credentials when testing sign-in flows; frontend expects `VITE_API_URL`. Keep local overrides in environment variables and verify CORS-sensitive changes against `FRONTEND_URL`.
