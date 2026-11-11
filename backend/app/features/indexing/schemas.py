from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.features.documents.schemas import ChunkingConfig
from app.providers.schemas import ProviderConfig

from .models import IndexRecord


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

    @classmethod
    def from_domain(cls, index: IndexRecord) -> "IndexView":
        return cls(
            id=index.id,
            collection_name=index.collection_name,
            embedding=ProviderConfig(
                provider=index.embedding.provider,
                model=index.embedding.model,
                dimensions=index.embedding.dimensions,
            ),
            chunking=ChunkingConfig(
                chunk_size=index.chunk_size,
                chunk_overlap=index.chunk_overlap,
            ),
            distance_metric="cosine",
            document_ids=index.document_ids,
            chunk_count=index.chunk_count,
            embedding_sample=index.embedding_sample,
            created_at=index.created_at,
        )
