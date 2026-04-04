from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.core.config import settings
from backend.api.genes import router as genes_router
from backend.api.variants import router as variants_router
from backend.api.auth import router as auth_router
from backend.api.users import router as users_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

app = FastAPI(title="Helix Bio API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(genes_router)
app.include_router(variants_router)
app.include_router(auth_router)
app.include_router(users_router)

@app.get("/api/health")
async def health():
    return {"status": "ok"}
