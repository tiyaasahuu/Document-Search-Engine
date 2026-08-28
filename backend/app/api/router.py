from fastapi import APIRouter
from app.api.routes import health, upload, search

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(upload.router, tags=["Documents"])
api_router.include_router(search.router, tags=["Search"])


