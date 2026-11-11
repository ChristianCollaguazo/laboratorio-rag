from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, model_validator

from .models import ChunkSet, ChunkingOptions, Document


class ChunkingConfig(BaseModel):
    chunk_size: int = Field(default=800, ge=100, le=8000)
    chunk_overlap: int = Field(default=120, ge=0, le=2000)

    @model_validator(mode="after")
    def validate_overlap(self) -> "ChunkingConfig":
        if self.chunk_overlap >= self.chunk_size:
            raise ValueError("chunk_overlap debe ser menor que chunk_size")
        return self

    def to_domain(self) -> ChunkingOptions:
        return ChunkingOptions(self.chunk_size, self.chunk_overlap)


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

    @classmethod
    def from_domain(cls, document: Document) -> "DocumentView":
        return cls.model_validate(document, from_attributes=True)


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

    @classmethod
    def from_domain(cls, chunk_set: ChunkSet) -> "ChunkSetView":
        return cls(
            id=chunk_set.id,
            document_id=chunk_set.document_id,
            config=ChunkingConfig(
                chunk_size=chunk_set.options.chunk_size,
                chunk_overlap=chunk_set.options.chunk_overlap,
            ),
            chunks=[ChunkView.model_validate(chunk, from_attributes=True) for chunk in chunk_set.chunks],
        )
