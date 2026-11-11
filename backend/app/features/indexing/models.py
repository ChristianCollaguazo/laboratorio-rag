from dataclasses import dataclass

from app.providers.models import ProviderSpec


@dataclass(frozen=True)
class IndexRecord:
    id: str
    collection_name: str
    embedding: ProviderSpec
    chunk_size: int
    chunk_overlap: int
    distance_metric: str
    document_ids: list[str]
    chunk_count: int
    embedding_sample: list[float]
    created_at: str

    @classmethod
    def from_record(cls, record: dict) -> "IndexRecord":
        return cls(
            id=record["id"],
            collection_name=record["collection_name"],
            embedding=ProviderSpec(
                record["provider"], record["model"], record["dimension"]
            ),
            chunk_size=record["chunk_size"],
            chunk_overlap=record["chunk_overlap"],
            distance_metric=record["distance_metric"],
            document_ids=record["document_ids"],
            chunk_count=record["chunk_count"],
            embedding_sample=record["embedding_sample"],
            created_at=record["created_at"],
        )

    def to_record(self) -> dict:
        return {
            "id": self.id,
            "collection_name": self.collection_name,
            "provider": self.embedding.provider,
            "model": self.embedding.model,
            "dimension": self.embedding.dimensions,
            "chunk_size": self.chunk_size,
            "chunk_overlap": self.chunk_overlap,
            "distance_metric": self.distance_metric,
            "document_ids": self.document_ids,
            "chunk_count": self.chunk_count,
            "embedding_sample": self.embedding_sample,
            "created_at": self.created_at,
        }
