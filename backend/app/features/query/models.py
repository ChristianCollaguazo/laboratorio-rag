from dataclasses import dataclass
from typing import Literal

from app.features.documents.models import Chunk
from app.providers.models import ProviderSpec


@dataclass(frozen=True)
class RetrievedChunk:
    chunk: Chunk
    distance: float


@dataclass(frozen=True)
class LlmMessage:
    role: Literal["system", "user"]
    content: str


@dataclass(frozen=True)
class RetrievalResult:
    chunks: list[RetrievedChunk]
    question: str
    context: str
    llm_messages: list[LlmMessage]
    source_count: int
    context_characters: int
    elapsed_ms: float


@dataclass(frozen=True)
class Usage:
    input_tokens: int | None = None
    output_tokens: int | None = None
    total_tokens: int | None = None


@dataclass(frozen=True)
class ChatResult:
    answer: str
    citations: list[str]
    invalid_citations: list[str]
    retrieval: RetrievalResult
    generation: ProviderSpec
    usage: Usage | None
    timings_ms: dict[str, float]
