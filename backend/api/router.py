from fastapi import APIRouter

from backend.api.routes.health import router as health_router
from backend.api.routes.diagnostics import router as diagnostics_router
from backend.api.routes.jobs import router as jobs_router
from backend.api.routes.providers import router as providers_router
from backend.api.routes.search import router as search_router


router = APIRouter()
router.include_router(diagnostics_router)
router.include_router(health_router)
router.include_router(jobs_router)
router.include_router(search_router)
router.include_router(providers_router)


__all__ = ["router"]
