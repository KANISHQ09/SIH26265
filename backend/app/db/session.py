from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

import re

from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode

# Database engine
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+asyncpg://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

connect_args = {}

if "sqlite" in db_url:
    # SQLite needs check_same_thread=False
    connect_args = {"check_same_thread": False}
else:
    # asyncpg does not accept libpq query params (sslmode, channel_binding, endpoint, etc.)
    # Strip them from URL and configure SSL safely via connect_args
    parsed = urlsplit(db_url)
    unsupported_params = {
        "channel_binding",
        "sslmode",
        "sslrootcert",
        "sslcert",
        "sslkey",
        "sslpassword",
        "gssencmode",
        "endpoint",
        "pooler",
    }
    query_params = parse_qsl(parsed.query, keep_blank_values=True)
    has_ssl_request = any(k.lower() == "sslmode" and v.lower() in ("require", "verify-ca", "verify-full") for k, v in query_params)
    
    if "neon.tech" in (parsed.hostname or "") or "supabase.co" in (parsed.hostname or "") or has_ssl_request:
        connect_args["ssl"] = True

    filtered_query = [(k, v) for k, v in query_params if k.lower() not in unsupported_params]
    db_url = urlunsplit((
        parsed.scheme,
        parsed.netloc,
        parsed.path,
        urlencode(filtered_query),
        parsed.fragment,
    ))

engine = create_async_engine(
    db_url,
    echo=False,
    future=True,
    connect_args=connect_args,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
