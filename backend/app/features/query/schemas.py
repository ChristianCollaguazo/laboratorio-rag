from pydantic import BaseModel, Field

from app.features.documents.schemas import ChunkView
from app.providers.schemas import ProviderConfig

from .models import ChatResult, RetrievalResult


class RetrieveRequest(BaseModel):
    index_id: str
    question: str = Field(min_length=1, max_length=20_000)
    top_k: int = Field(default=4, ge=1, le=20)
    embedding: ProviderConfig


class RetrievedChunkView(ChunkView):
    distance: float


class LlmMessageView(BaseModel):
    role: str
    content: str


class RetrievalView(BaseModel):
    chunks: list[RetrievedChunkView]
    question: str
    context: str
    llm_messages: list[LlmMessageView]
    source_count: int
    context_characters: int
    elapsed_ms: float

    @classmethod
    def from_domain(cls, result: RetrievalResult) -> "RetrievalView":
        return cls(
            chunks=[
                RetrievedChunkView(
                    **item.chunk.__dict__, distance=item.distance
                )
                for item in result.chunks
            ],
            question=result.question,
            context=result.context,
            llm_messages=[
                LlmMessageView.model_validate(message, from_attributes=True)
                for message in result.llm_messages
            ],
            source_count=result.source_count,
            context_characters=result.context_characters,
            elapsed_ms=result.elapsed_ms,
        )


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
    retrieved: list[RetrievedChunkView]
    question: str
    context: str
    llm_messages: list[LlmMessageView]
    source_count: int
    context_characters: int
    generation: ProviderConfig
    usage: UsageView | None = None
    timings_ms: dict[str, float]

    @classmethod
    def from_domain(cls, result: ChatResult) -> "ChatView":
        retrieval = RetrievalView.from_domain(result.retrieval)
        return cls(
            answer=result.answer,
            citations=result.citations,
            invalid_citations=result.invalid_citations,
            retrieved=retrieval.chunks,
            question=retrieval.question,
            context=retrieval.context,
            llm_messages=retrieval.llm_messages,
            source_count=retrieval.source_count,
            context_characters=retrieval.context_characters,
            generation=ProviderConfig(
                provider=result.generation.provider,
                model=result.generation.model,
                dimensions=result.generation.dimensions,
            ),
            usage=(UsageView.model_validate(result.usage, from_attributes=True) if result.usage else None),
            timings_ms=result.timings_ms,
        )
