from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.container import ApplicationContainer, get_container

from .schemas import IndexRequest, IndexTraceabilityView, IndexView

router = APIRouter(prefix="/indices", tags=["indexing"])


@router.post("", response_model=IndexView, status_code=201)
def create_index(request: IndexRequest, container: Annotated[ApplicationContainer, Depends(get_container)]) -> IndexView:
    return IndexView.from_domain(container.indexing.create_index(request.chunk_set_ids, request.embedding.to_domain()))


@router.get("", response_model=list[IndexView])
def list_indices(container: Annotated[ApplicationContainer, Depends(get_container)]) -> list[IndexView]:
    return [IndexView.from_domain(item) for item in container.indexing.list_indices()]


@router.get("/{index_id}/traceability", response_model=IndexTraceabilityView)
def inspect_index(index_id: str, container: Annotated[ApplicationContainer, Depends(get_container)]) -> IndexTraceabilityView:
    return IndexTraceabilityView.from_domain(container.indexing.inspect_index(index_id))


@router.delete("/{index_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_index(index_id: str, container: Annotated[ApplicationContainer, Depends(get_container)]) -> None:
    if not container.indexing.delete_index(index_id):
        raise HTTPException(status_code=404, detail="Índice no encontrado.")
