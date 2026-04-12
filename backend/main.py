from contextlib import asynccontextmanager
import httpx
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from backend.core.config import settings
from backend.core.database import engine
from backend.core.rate_limiter import limiter
from backend.api.genes import router as genes_router
from backend.api.variants import router as variants_router
from backend.api.auth import router as auth_router
from backend.api.users import router as users_router
from backend.api.pathways import router as pathways_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await engine.dispose()


app = FastAPI(title="Helix Bio API", lifespan=lifespan)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.exception_handler(httpx.HTTPStatusError)
async def httpx_status_exception_handler(request: Request, exc: httpx.HTTPStatusError):
    status_code = 502 # Bad Gateway as default for upstream issues
    if exc.response.status_code in (503, 504):
        status_code = exc.response.status_code
        
    return JSONResponse(
        status_code=status_code,
        content={
            "error": "Upstream Service Error",
            "detail": f"The external API returned an error: {exc.response.status_code}",
            "upstream_status": exc.response.status_code
        },
    )

@app.exception_handler(httpx.TimeoutException)
async def httpx_timeout_exception_handler(request: Request, exc: httpx.TimeoutException):
    return JSONResponse(
        status_code=504,
        content={
            "error": "Upstream Timeout",
            "detail": "The external API request timed out."
        },
    )

@app.exception_handler(httpx.ConnectError)
async def httpx_connect_exception_handler(request: Request, exc: httpx.ConnectError):
    return JSONResponse(
        status_code=503,
        content={
            "error": "Upstream Connection Failed",
            "detail": "Could not connect to the external API."
        },
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(genes_router)
app.include_router(variants_router)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(pathways_router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
