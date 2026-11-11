import uuid
from dataclasses import dataclass

from app.core.errors import IndexCompatibilityError, ResourceNotFoundError, ValidationError
from app.features.documents.models import ChunkingOptions
from app.features.documents.service import DocumentService
from app.infrastructure.chroma.vector_store import ChromaVectorStore
from app.infrastructure.sqlite.catalog import Catalog
from app.infrastructure.sqlite.repositories import IndexRepository
from app.providers.models import ProviderSpec
from app.providers.ports import ProviderRegistry

from .fingerprint import build_fingerprint
from .models import IndexRecord


@dataclass
class IndexingService:
    documents: DocumentService
    repository: IndexRepository
    vector_store: ChromaVectorStore
    providers: ProviderRegistry
    catalog: Catalog

    def create_index(
        self, chunk_set_ids: list[str], embedding: ProviderSpec
    ) -> IndexRecord:
        chunk_sets = []
        for chunk_set_id in chunk_set_ids:
            chunk_set = self.documents.get_chunk_set(chunk_set_id)
            if not chunk_set:
                raise ResourceNotFoundError(
                    f"Conjunto de chunks no encontrado: {chunk_set_id}"
                )
            chunk_sets.append(chunk_set)
        configurations = {
            (item.options.chunk_size, item.options.chunk_overlap) for item in chunk_sets
        }
        if len(configurations) != 1:
            raise ValidationError(
                "Todos los documentos del índice deben usar el mismo chunking."
            )
        chunks = [chunk for item in chunk_sets for chunk in item.chunks]
        embedding_model = self.providers.embeddings(embedding)
        probe = embedding_model.embed_query(chunks[0].text)
        dimension = len(probe)
        if embedding.dimensions and embedding.dimensions != dimension:
            raise ValidationError(
                f"El proveedor devolvió {dimension} dimensiones, no {embedding.dimensions}."
            )
        chunk_size, chunk_overlap = configurations.pop()
        chunking = ChunkingOptions(chunk_size, chunk_overlap)
        fingerprint = build_fingerprint(embedding, dimension, chunking)
        collection_name = f"rag_{fingerprint}_{uuid.uuid4().hex[:8]}"
        self.vector_store.create_collection(
            collection_name,
            {
                "hnsw:space": "cosine",
                "provider": embedding.provider,
                "model": embedding.model,
                "dimension": dimension,
                "chunk_size": chunk_size,
                "chunk_overlap": chunk_overlap,
                "fingerprint": fingerprint,
            },
            chunks,
            embedding_model,
        )
        index = IndexRecord(
            id=f"index_{uuid.uuid4().hex}",
            collection_name=collection_name,
            embedding=ProviderSpec(embedding.provider, embedding.model, dimension),
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            distance_metric="cosine",
            document_ids=sorted({chunk.document_id for chunk in chunks}),
            chunk_count=len(chunks),
            embedding_sample=probe[:8],
            created_at=self.catalog.now(),
        )
        self.repository.create(index.to_record())
        return index

    def list_indices(self) -> list[IndexRecord]:
        return [IndexRecord.from_record(item) for item in self.repository.list()]

    def get_index(self, index_id: str) -> IndexRecord | None:
        item = self.repository.get(index_id)
        return IndexRecord.from_record(item) if item else None

    @staticmethod
    def assert_compatible(index: IndexRecord, embedding: ProviderSpec) -> None:
        expected_dimension = embedding.dimensions or index.embedding.dimensions
        if (
            index.embedding.provider != embedding.provider
            or index.embedding.model != embedding.model
            or index.embedding.dimensions != expected_dimension
        ):
            raise IndexCompatibilityError(
                "La consulta debe usar exactamente el proveedor, modelo y dimensión "
                "con que se creó el índice. Selecciona otro índice o reindexa."
            )

    def delete_index(self, index_id: str) -> bool:
        index = self.get_index(index_id)
        if not index:
            return False
        self.vector_store.delete_collection(index.collection_name, ignore_missing=True)
        return self.repository.delete(index_id)

    def delete_document(self, document_id: str) -> bool:
        if not self.documents.get_document(document_id):
            return False
        for index in self.list_indices():
            if document_id not in index.document_ids:
                continue
            try:
                remaining_count = self.vector_store.delete_document(
                    index.collection_name, document_id
                )
            except Exception as error:
                raise RuntimeError(
                    f"No se pudieron borrar los vectores del índice {index.id}."
                ) from error
            if remaining_count == 0:
                self.vector_store.delete_collection(
                    index.collection_name, ignore_missing=True
                )
                self.repository.delete(index.id)
            else:
                self.repository.update_contents(
                    index.id,
                    [item for item in index.document_ids if item != document_id],
                    remaining_count,
                )
        return self.documents.delete_document_record(document_id)
