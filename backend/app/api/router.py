from fastapi import APIRouter

from app.features.documents.router import router as documents_router
from app.features.indexing.router import router as indexing_router
from app.features.library.router import router as library_router
from app.features.learning.router import router as learning_router
from app.features.query.router import router as query_router
from app.features.status.router import router as status_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(status_router)
api_router.include_router(documents_router)
api_router.include_router(indexing_router)
api_router.include_router(library_router)
api_router.include_router(query_router)
api_router.include_router(learning_router)
