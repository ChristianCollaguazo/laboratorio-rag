import uuid
from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware

from .config import Settings, get_settings
from .database import Catalog
from .embedding_lab import build_embedding_lab_result
from .extraction import ExtractionError, extract_pdf, extract_txt
from .providers import ProviderFactory, ProviderUnavailable
from .rag import IndexCompatibilityError, NotFoundError, RagService
from .schemas import (
    ChatRequest, ChatView, ChunkingConfig, ChunkSetView, DocumentView,
    EmbeddingLabRequest, EmbeddingLabView, IndexRequest, IndexView,
    RetrieveRequest, RetrievalView, StatusView, TextDocumentRequest,
)


def index_view(item: dict) -> dict:
    return {
        "id": item["id"], "collection_name": item["collection_name"],
        "embedding": {
            "provider": item["provider"], "model": item["model"],
            "dimensions": item["dimension"],
        },
        "chunking": {
            "chunk_size": item["chunk_size"], "chunk_overlap": item["chunk_overlap"]
        },
        "distance_metric": item["distance_metric"],
        "document_ids": item["document_ids"], "chunk_count": item["chunk_count"],
        "embedding_sample": item["embedding_sample"], "created_at": item["created_at"],
    }


def chunk_set_view(item: dict) -> dict:
    return {
        "id": item["id"], "document_id": item["document_id"],
        "config": {
            "chunk_size": item["chunk_size"], "chunk_overlap": item["chunk_overlap"]
        },
        "chunks": item["chunks"],
    }


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    settings.rag_data_dir.mkdir(parents=True, exist_ok=True)
    app.state.catalog = Catalog(settings.sqlite_path)
    app.state.providers = ProviderFactory(settings)
    app.state.rag = RagService(settings, app.state.catalog, app.state.providers)
    yield


app = FastAPI(
    title="RAG educativa API",
    description="Pipeline RAG local, explícito e inspeccionable.",
    version="0.1.0",
    lifespan=lifespan,
)
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type"],
)


def catalog() -> Catalog:
    return app.state.catalog


def rag() -> RagService:
    return app.state.rag


def translate_error(exc: Exception) -> HTTPException:
    if isinstance(exc, NotFoundError):
        return HTTPException(status_code=404, detail=str(exc))
    if isinstance(exc, IndexCompatibilityError):
        return HTTPException(status_code=409, detail=str(exc))
    if isinstance(exc, ProviderUnavailable):
        return HTTPException(status_code=503, detail=str(exc))
    if isinstance(exc, (ValueError, ExtractionError)):
        return HTTPException(status_code=422, detail=str(exc))
    return HTTPException(status_code=500, detail=f"Error interno: {exc}")


@app.get("/api/status", response_model=StatusView)
def get_status() -> dict:
    providers: ProviderFactory = app.state.providers
    ollama_available, models, ollama_message = providers.ollama_status()
    openai_available = bool(settings.openai_api_key)
    return {
        "openai": {
            "available": openai_available, "configured": openai_available,
            "message": "OpenAI está configurado." if openai_available else
            "Falta OPENAI_API_KEY; Ollama y el resto de la aplicación siguen disponibles.",
            "models": [settings.openai_generation_model, settings.openai_embedding_model],
        },
        "ollama": {
            "available": ollama_available, "configured": ollama_available,
            "message": ollama_message, "models": models,
        },
        "chroma_available": True,
        "defaults": {
            "openai_generation": settings.openai_generation_model,
            "openai_embedding": settings.openai_embedding_model,
            "ollama_generation": settings.ollama_generation_model,
            "ollama_embedding": settings.ollama_embedding_model,
        },
    }


@app.get("/api/documents", response_model=list[DocumentView])
def list_documents(db: Annotated[Catalog, Depends(catalog)]) -> list[dict]:
    return db.list_documents()


@app.post("/api/documents/text", response_model=DocumentView, status_code=201)
def create_text_document(
    request: TextDocumentRequest, db: Annotated[Catalog, Depends(catalog)]
) -> dict:
    normalized = request.text.strip()
    item = {
        "id": f"doc_{uuid.uuid4().hex}", "title": request.title.strip(), "kind": "text",
        "text": normalized, "pages": [{"page": 1, "text": normalized}],
        "created_at": db.now(),
    }
    db.create_document(item)
    return item


@app.post("/api/documents/upload", response_model=DocumentView, status_code=201)
async def upload_document(
    file: Annotated[UploadFile, File()], db: Annotated[Catalog, Depends(catalog)]
) -> dict:
    content = await file.read(settings.rag_max_upload_mb * 1024 * 1024 + 1)
    if len(content) > settings.rag_max_upload_mb * 1024 * 1024:
        raise HTTPException(
            status_code=413, detail=f"El archivo supera {settings.rag_max_upload_mb} MB."
        )
    filename = file.filename or "documento"
    extension = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
    try:
        if extension == "txt":
            pages, kind = extract_txt(content), "txt"
        elif extension == "pdf":
            pages, kind = extract_pdf(content), "pdf"
        else:
            raise ExtractionError("Solo se aceptan archivos TXT y PDF.")
    except Exception as exc:
        raise translate_error(exc) from exc
    text = "\n\n".join(str(page["text"]) for page in pages)
    item = {
        "id": f"doc_{uuid.uuid4().hex}", "title": filename, "kind": kind,
        "text": text, "pages": pages, "created_at": db.now(),
    }
    db.create_document(item)
    return item


@app.post("/api/documents/{document_id}/chunks", response_model=ChunkSetView, status_code=201)
def create_chunks(
    document_id: str, config: ChunkingConfig,
    service: Annotated[RagService, Depends(rag)],
) -> dict:
    try:
        return chunk_set_view(service.create_chunks(document_id, config))
    except Exception as exc:
        raise translate_error(exc) from exc


@app.post("/api/indices", response_model=IndexView, status_code=201)
def create_index(
    request: IndexRequest, service: Annotated[RagService, Depends(rag)]
) -> dict:
    try:
        return index_view(service.create_index(request))
    except Exception as exc:
        raise translate_error(exc) from exc


@app.get("/api/indices", response_model=list[IndexView])
def list_indices(db: Annotated[Catalog, Depends(catalog)]) -> list[dict]:
    return [index_view(item) for item in db.list_indices()]


@app.post("/api/retrieve", response_model=RetrievalView)
def retrieve(
    request: RetrieveRequest, service: Annotated[RagService, Depends(rag)]
) -> dict:
    try:
        return service.retrieve(request)
    except Exception as exc:
        raise translate_error(exc) from exc


@app.post("/api/chat", response_model=ChatView)
def chat(request: ChatRequest, service: Annotated[RagService, Depends(rag)]) -> dict:
    try:
        return service.chat(request)
    except Exception as exc:
        raise translate_error(exc) from exc


@app.post("/api/learning/embeddings", response_model=EmbeddingLabView)
def learning_embeddings(request: EmbeddingLabRequest) -> dict:
    providers: ProviderFactory = app.state.providers
    model = request.model or providers.settings.openai_embedding_model
    inputs = [request.query, *request.candidates]
    try:
        vectors, usage = providers.openai_embedding_batch(
            inputs, model, request.dimensions
        )
        return build_embedding_lab_result(
            query=request.query,
            candidates=request.candidates,
            vectors=vectors,
            model=model,
            usage=usage,
        )
    except Exception as exc:
        raise translate_error(exc) from exc


@app.delete("/api/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: str, service: Annotated[RagService, Depends(rag)]
) -> None:
    if not service.delete_document(document_id):
        raise HTTPException(status_code=404, detail="Documento no encontrado.")


@app.delete("/api/indices/{index_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_index(index_id: str, service: Annotated[RagService, Depends(rag)]) -> None:
    if not service.delete_index(index_id):
        raise HTTPException(status_code=404, detail="Índice no encontrado.")
