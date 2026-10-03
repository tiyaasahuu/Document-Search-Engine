from fastapi import APIRouter
from app.api.routes import health, auth, upload, search, rag, conversations

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(upload.router, tags=["Documents"])
api_router.include_router(search.router, tags=["Search"])
api_router.include_router(rag.router, tags=["RAG"])
api_router.include_router(conversations.router, tags=["Conversations"])




