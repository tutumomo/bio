import asyncio
from collections.abc import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import MetaData
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from backend.core.database import Base, get_db
from backend.main import app

TEST_DB_URL = "sqlite+aiosqlite:///./test.db"

engine = create_async_engine(TEST_DB_URL, echo=False)
TestSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def override_get_db():
    async with TestSessionLocal() as session:
        yield session

app.dependency_overrides[get_db] = override_get_db

# Tables compatible with SQLite (excludes PostgreSQL-specific types like JSONB/UUID)
SQLITE_COMPATIBLE_TABLES = {"gene_cache", "variant_cache"}


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


def _create_sqlite_tables(conn):
    """Create only SQLite-compatible tables."""
    tables = [
        t for t in Base.metadata.sorted_tables
        if t.name in SQLITE_COMPATIBLE_TABLES
    ]
    Base.metadata.create_all(conn, tables=tables)


def _drop_sqlite_tables(conn):
    """Drop only SQLite-compatible tables."""
    tables = [
        t for t in Base.metadata.sorted_tables
        if t.name in SQLITE_COMPATIBLE_TABLES
    ]
    Base.metadata.drop_all(conn, tables=tables)


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(_create_sqlite_tables)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(_drop_sqlite_tables)


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionLocal() as session:
        yield session


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
