from dataclasses import asdict, dataclass
from typing import Literal


@dataclass(frozen=True)
class Page:
    page: int
    text: str


@dataclass(frozen=True)
class Document:
    id: str
    title: str
    kind: Literal["text", "txt", "pdf"]
    text: str
    pages: list[Page]
    created_at: str

    @classmethod
    def from_record(cls, record: dict) -> "Document":
        return cls(
            id=record["id"],
            title=record["title"],
            kind=record["kind"],
            text=record["text"],
            pages=[Page(**page) for page in record["pages"]],
            created_at=record["created_at"],
        )

    def to_record(self) -> dict:
        return {**asdict(self), "pages": [asdict(page) for page in self.pages]}


@dataclass(frozen=True)
class Chunk:
    id: str
    document_id: str
    document_title: str
    page: int
    position: int
    text: str

    @classmethod
    def from_record(cls, record: dict) -> "Chunk":
        return cls(**{field: record[field] for field in cls.__dataclass_fields__})

    def to_record(self) -> dict:
        return asdict(self)


@dataclass(frozen=True)
class ChunkingOptions:
    chunk_size: int
    chunk_overlap: int


@dataclass(frozen=True)
class ChunkSet:
    id: str
    document_id: str
    options: ChunkingOptions
    chunks: list[Chunk]
    created_at: str
