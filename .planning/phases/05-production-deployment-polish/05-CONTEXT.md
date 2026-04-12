# Phase 05: Production Deployment & Polish - Context

## Objective
Secure and deploy the application for public access and finalize UI/UX polish.

## Requirements Mapping
- **DEPLOY-01**: Railway deployment for Backend (FastAPI) and PostgreSQL.
- **DEPLOY-02**: Vercel deployment for Frontend (React/Vite).

## Key Decisions (from User)
- **D-01 (Deployment)**: Update `frontend/vercel.json` for flexibility. Ensure `backend/Dockerfile` and `backend/Procfile` are ready for Railway.
- **D-02 (CORS)**: Correctly configure CORS in `backend/main.py` for the production frontend URL.
- **D-03 (UI Polish - Loaders)**: Implement **Skeleton Loaders** using `framer-motion` for all major tables and charts (`GeneTable`, `VariantTable`, `TissueExpressionChart`).
- **D-04 (UI Polish - Dark Mode)**: Implement **Dark Mode**: Add `dark` variants to Tailwind classes and a `ThemeToggle` component. Respect system preferences.
- **D-05 (Resilience - Frontend)**: Implement a global `ErrorBoundary` in the frontend to handle crashes gracefully.
- **D-06 (Resilience - Backend)**: Enhance backend error handling: Provide meaningful error messages and status codes for external API failures (NCBI, Ensembl, VEP). Handle 503/504 cleanly.
- **D-07 (Migration)**: Finalize `alembic` setup for production database migrations.

## Deferred Ideas
- None.

## the agent's Discretion
- Choose the exact skeleton loader styling (e.g. shimmer effect, pulsing).
- Select the `framer-motion` transition types for smooth entry/exit of skeletons.
- Determine the placement of the `ThemeToggle` (likely in a top navigation bar or header).
- Specific error message phrasing for API failures.

## Reference Source Files
- `backend/main.py` (CORS)
- `backend/services/*.py` (Error handling)
- `frontend/src/App.tsx` (Theme provider, ErrorBoundary)
- `frontend/src/components/` (Tables, Charts, Loaders)
- `frontend/tailwind.config.ts` (Dark mode strategy)
