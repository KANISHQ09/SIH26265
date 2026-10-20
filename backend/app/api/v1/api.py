from fastapi import APIRouter
from app.api.v1.routers import (
    auth,
    institutions,
    instruments,
    documents,
    verifications,
    discrepancies,
    release,
    dashboard,
    reports,
    admin,
    audit,
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(institutions.router)
api_router.include_router(instruments.router)
api_router.include_router(documents.router)
api_router.include_router(verifications.router)
api_router.include_router(discrepancies.router)
api_router.include_router(release.router)
api_router.include_router(dashboard.router)
api_router.include_router(reports.router)
api_router.include_router(admin.router)
api_router.include_router(audit.router)
