import time
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.api.v1.api import api_router
from app.db.session import engine, Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables are created
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
    description="Centralized AICTE Security Deposit / FDR Portal with 3-tier trust separation, state machine enforcement, and tamper-evident audit trails.",
    version="1.0.0",
)

# CORS Middleware
origins = list(settings.BACKEND_CORS_ORIGINS)
for o in [settings.FRONTEND_URL, "http://localhost:3000", "http://127.0.0.1:3000"]:
    if o and o not in origins:
        origins.append(o)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_process_time_and_request_id(request: Request, call_next):
    start_time = time.time()
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = f"{process_time:.4f}s"
    response.headers["X-Request-ID"] = request_id
    return response


# Include API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health")
@app.head("/health")
async def health_check():
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "api_docs": f"{settings.API_V1_STR}/docs"
    }


@app.get("/")
@app.head("/")
async def root():
    return {
        "message": "Welcome to Zetsu: AICTE Security Deposit / FDR Management Portal API",
        "docs": f"{settings.API_V1_STR}/docs",
        "health": "/health"
    }

