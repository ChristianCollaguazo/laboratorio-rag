import time
from dataclasses import dataclass

from langchain_core.messages import HumanMessage, SystemMessage

from app.core.errors import ResourceNotFoundError
from app.features.indexing.service import IndexingService
from app.infrastructure.chroma.vector_store import ChromaVectorStore
from app.providers.models import ProviderSpec
from app.providers.ports import ProviderRegistry

from .citations import validate_citations
from .models import ChatResult, RetrievalResult, RetrievedChunk, Usage
from .prompt_builder import build_context, build_llm_messages


@dataclass
class QueryService:
    indexing: IndexingService
    vector_store: ChromaVectorStore
    providers: ProviderRegistry

    def retrieve(
        self,
        index_id: str,
        question: str,
        top_k: int,
        embedding: ProviderSpec,
    ) -> RetrievalResult:
        started = time.perf_counter()
        index = self.indexing.get_index(index_id)
        if not index:
            raise ResourceNotFoundError("Índice no encontrado.")
        self.indexing.assert_compatible(index, embedding)
        matches = self.vector_store.search(
            index.collection_name,
            question,
            top_k,
            self.providers.embeddings(embedding),
        )
        chunks = [RetrievedChunk(item.chunk, item.distance) for item in matches]
        context = build_context([item.chunk for item in chunks])
        return RetrievalResult(
            chunks=chunks,
            question=question,
            context=context,
            llm_messages=build_llm_messages(question, context),
            source_count=len(chunks),
            context_characters=len(context),
            elapsed_ms=round((time.perf_counter() - started) * 1000, 2),
        )

    def chat(
        self,
        index_id: str,
        question: str,
        top_k: int,
        embedding: ProviderSpec,
        generation: ProviderSpec,
    ) -> ChatResult:
        total_started = time.perf_counter()
        retrieval = self.retrieve(index_id, question, top_k, embedding)
        generation_started = time.perf_counter()
        response = self.providers.chat(generation).invoke(
            [
                SystemMessage(retrieval.llm_messages[0].content),
                HumanMessage(retrieval.llm_messages[1].content),
            ]
        )
        answer = response.text if hasattr(response, "text") else str(response.content)
        allowed_ids = {item.chunk.id for item in retrieval.chunks}
        citations, invalid = validate_citations(answer, allowed_ids)
        usage_data = getattr(response, "usage_metadata", None)
        usage = (
            Usage(
                input_tokens=usage_data.get("input_tokens"),
                output_tokens=usage_data.get("output_tokens"),
                total_tokens=usage_data.get("total_tokens"),
            )
            if usage_data
            else None
        )
        return ChatResult(
            answer=answer,
            citations=citations,
            invalid_citations=invalid,
            retrieval=retrieval,
            generation=generation,
            usage=usage,
            timings_ms={
                "retrieval": retrieval.elapsed_ms,
                "generation": round(
                    (time.perf_counter() - generation_started) * 1000, 2
                ),
                "total": round((time.perf_counter() - total_started) * 1000, 2),
            },
        )
