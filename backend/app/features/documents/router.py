from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.core.container import ApplicationContainer, get_container

from .schemas import ChunkingConfig, ChunkSetView, DocumentView, TextDocumentRequest

router = APIRouter(prefix="/documents", tags=["documents"])


@router.get("", response_model=list[DocumentView])
def list_documents(container: Annotated[ApplicationContainer, Depends(get_container)]) -> list[DocumentView]:
    return [DocumentView.from_domain(item) for item in container.documents.list_documents()]


@router.get("/{document_id}", response_model=DocumentView)
def get_document(document_id: str, container: Annotated[ApplicationContainer, Depends(get_container)]) -> DocumentView:
    document = container.documents.get_document(document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Documento no encontrado.")
    return DocumentView.from_domain(document)


@router.post("/text", response_model=DocumentView, status_code=201)
def create_text_document(request: TextDocumentRequest, container: Annotated[ApplicationContainer, Depends(get_container)]) -> DocumentView:
    return DocumentView.from_domain(container.documents.create_text(request.title, request.text))


@router.post("/upload", response_model=DocumentView, status_code=201)
async def upload_document(container: Annotated[ApplicationContainer, Depends(get_container)], file: Annotated[UploadFile, File()]) -> DocumentView:
    maximum = container.settings.rag_max_upload_mb * 1024 * 1024
    content = await file.read(maximum + 1)
    if len(content) > maximum:
        raise HTTPException(status_code=413, detail=f"El archivo supera {container.settings.rag_max_upload_mb} MB.")
    return DocumentView.from_domain(container.documents.create_upload(file.filename or "documento", content))


@router.post("/{document_id}/chunks", response_model=ChunkSetView, status_code=201)
def create_chunks(document_id: str, request: ChunkingConfig, container: Annotated[ApplicationContainer, Depends(get_container)]) -> ChunkSetView:
    return ChunkSetView.from_domain(container.documents.create_chunks(document_id, request.to_domain()))


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(document_id: str, container: Annotated[ApplicationContainer, Depends(get_container)]) -> None:
    if not container.indexing.delete_document(document_id):
        raise HTTPException(status_code=404, detail="Documento no encontrado.")
