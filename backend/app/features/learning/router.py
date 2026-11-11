from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.container import ApplicationContainer, get_container

from .schemas import EmbeddingLabRequest, EmbeddingLabView

router = APIRouter(prefix="/learning", tags=["learning"])


@router.post("/embeddings", response_model=EmbeddingLabView)
def create_embedding_example(request: EmbeddingLabRequest, container: Annotated[ApplicationContainer, Depends(get_container)]) -> dict:
    return container.learning.create_embedding_example(request.query, request.candidates, request.model, request.dimensions)
