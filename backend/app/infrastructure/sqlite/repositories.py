from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from .catalog import Catalog


@dataclass
class DocumentRepository:
    catalog: Catalog

    def create(self, document: dict[str, Any]) -> None:
        self.catalog.create_document(document)

    def list(self) -> list[dict[str, Any]]:
        return self.catalog.list_documents()

    def get(self, document_id: str) -> dict[str, Any] | None:
        return self.catalog.get_document(document_id)

    def create_chunk_set(
        self, chunk_set: dict[str, Any], chunks: list[dict[str, Any]]
    ) -> None:
        self.catalog.create_chunk_set(chunk_set, chunks)

    def get_chunk_set(self, chunk_set_id: str) -> dict[str, Any] | None:
        return self.catalog.get_chunk_set(chunk_set_id)

    def delete_chunk_sets_for_document(self, document_id: str) -> None:
        self.catalog.delete_chunk_sets_for_document(document_id)

    def delete(self, document_id: str) -> bool:
        return self.catalog.delete_document(document_id)


@dataclass
class IndexRepository:
    catalog: Catalog

    def create(self, index: dict[str, Any]) -> None:
        self.catalog.create_index(index)

    def list(self) -> list[dict[str, Any]]:
        return self.catalog.list_indices()

    def get(self, index_id: str) -> dict[str, Any] | None:
        return self.catalog.get_index(index_id)

    def delete(self, index_id: str) -> bool:
        return self.catalog.delete_index(index_id)

    def clear_library(self) -> None:
        self.catalog.clear_library()

    def update_contents(
        self, index_id: str, document_ids: list[str], chunk_count: int
    ) -> None:
        self.catalog.update_index_contents(index_id, document_ids, chunk_count)
