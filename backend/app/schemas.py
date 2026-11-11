from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, model_validator

Provider = Literal["openai", "ollama"]


class ProviderConfig(BaseModel):
    provider: Provider
    model: str = Field(min_length=1, max_length=200)
    dimensions: int | None = Field(default=None, ge=1, le=8192)


class ChunkingConfig(BaseModel):
    chunk_size: int = Field(default=800, ge=100, le=8000)
    chunk_overlap: int = Field(default=120, ge=0, le=2000)

    @model_validator(mode="after")
    def overlap_is_smaller(self) -> "ChunkingConfig":
        if self.chunk_overlap >= self.chunk_size:
            raise ValueError("chunk_overlap debe ser menor que chunk_size")
        return self


class TextDocumentRequest(BaseModel):
    title: str = Field(min_length=1, max_length=240)
    text: str = Field(min_length=1, max_length=2_000_000)


class PageView(BaseModel):
    page: int
    text: str


class DocumentView(BaseModel):
    id: str
    title: str
    kind: Literal["text", "txt", "pdf"]
    text: str
    pages: list[PageView]
    created_at: datetime


class ChunkView(BaseModel):
    id: str
    document_id: str
    document_title: str
    page: int
    position: int
    text: str


class ChunkSetView(BaseModel):
    id: str
    document_id: str
    config: ChunkingConfig
    chunks: list[ChunkView]


class IndexRequest(BaseModel):
    chunk_set_ids: list[str] = Field(min_length=1)
    embedding: ProviderConfig


class IndexView(BaseModel):
    id: str
    collection_name: str
    embedding: ProviderConfig
    chunking: ChunkingConfig
    distance_metric: Literal["cosine"] = "cosine"
    document_ids: list[str]
    chunk_count: int
    embedding_sample: list[float] = []
    created_at: datetime


class RetrieveRequest(BaseModel):
    index_id: str
    question: str = Field(min_length=1, max_length=20_000)
    top_k: int = Field(default=4, ge=1, le=20)
    embedding: ProviderConfig


class RetrievedChunk(ChunkView):
    distance: float


class LlmMessageView(BaseModel):
    role: Literal["system", "user"]
    content: str


class RetrievalView(BaseModel):
    chunks: list[RetrievedChunk]
    question: str
    context: str
    llm_messages: list[LlmMessageView]
    source_count: int
    context_characters: int
    elapsed_ms: float


class ChatRequest(RetrieveRequest):
    generation: ProviderConfig


class UsageView(BaseModel):
    input_tokens: int | None = None
    output_tokens: int | None = None
    total_tokens: int | None = None


class ChatView(BaseModel):
    answer: str
    citations: list[str]
    invalid_citations: list[str]
    retrieved: list[RetrievedChunk]
    question: str
    context: str
    llm_messages: list[LlmMessageView]
    source_count: int
    context_characters: int
    generation: ProviderConfig
    usage: UsageView | None = None
    timings_ms: dict[str, float]


class ProviderStatus(BaseModel):
    available: bool
    configured: bool
    message: str
    models: list[str] = []


class StatusView(BaseModel):
    openai: ProviderStatus
    ollama: ProviderStatus
    chroma_available: bool
    defaults: dict[str, str]


class EmbeddingLabRequest(BaseModel):
    query: str = Field(min_length=1, max_length=200)
    candidates: list[str] = Field(min_length=2, max_length=6)
    model: str | None = Field(default=None, min_length=1, max_length=200)
    dimensions: int | None = Field(default=1536, ge=2, le=8192)

    @model_validator(mode="after")
    def normalize_words(self) -> "EmbeddingLabRequest":
        self.query = self.query.strip()
        self.candidates = [item.strip() for item in self.candidates]
        if not self.query or any(not item for item in self.candidates):
            raise ValueError("La consulta y las palabras candidatas no pueden estar vacías.")
        if len({item.casefold() for item in self.candidates}) != len(self.candidates):
            raise ValueError("Las palabras candidatas deben ser diferentes entre sí.")
        return self


class EmbeddingLabPoint(BaseModel):
    id: str
    text: str
    embedding_sample: list[float]


class EmbeddingLabCandidate(EmbeddingLabPoint):
    distance: float
    rank: int


class EmbeddingLabUsage(BaseModel):
    prompt_tokens: int
    total_tokens: int


class EmbeddingLabView(BaseModel):
    model: str
    dimension: int
    query: EmbeddingLabPoint
    candidates: list[EmbeddingLabCandidate]
    recovered: EmbeddingLabCandidate
    usage: EmbeddingLabUsage
