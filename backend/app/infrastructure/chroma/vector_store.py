from dataclasses import dataclass
from pathlib import Path

import chromadb
from langchain_chroma import Chroma
from langchain_core.documents import Document as LangChainDocument
from langchain_core.embeddings import Embeddings

from app.features.documents.models import Chunk


@dataclass(frozen=True)
class SearchResult:
    chunk: Chunk
    distance: float


class ChromaVectorStore:
    def __init__(self, path: Path):
        path.mkdir(parents=True, exist_ok=True)
        self.path = path
        self.client = chromadb.PersistentClient(path=str(path))

    def create_collection(
        self,
        collection_name: str,
        metadata: dict[str, str | int],
        chunks: list[Chunk],
        embeddings: Embeddings,
    ) -> None:
        try:
            store = Chroma(
                collection_name=collection_name,
                embedding_function=embeddings,
                persist_directory=str(self.path),
                collection_metadata=metadata,
            )
            documents = [
                LangChainDocument(
                    page_content=chunk.text,
                    metadata={
                        "chunk_id": chunk.id,
                        "document_id": chunk.document_id,
                        "document_title": chunk.document_title,
                        "page": chunk.page,
                        "position": chunk.position,
                    },
                )
                for chunk in chunks
            ]
            store.add_documents(documents, ids=[chunk.id for chunk in chunks])
        except Exception:
            self.delete_collection(collection_name, ignore_missing=True)
            raise

    def search(
        self,
        collection_name: str,
        question: str,
        top_k: int,
        embeddings: Embeddings,
    ) -> list[SearchResult]:
        store = Chroma(
            collection_name=collection_name,
            embedding_function=embeddings,
            persist_directory=str(self.path),
        )
        matches = store.similarity_search_with_score(question, k=top_k)
        return [
            SearchResult(
                chunk=Chunk(
                    id=document.metadata["chunk_id"],
                    document_id=document.metadata["document_id"],
                    document_title=document.metadata["document_title"],
                    page=int(document.metadata["page"]),
                    position=int(document.metadata["position"]),
                    text=document.page_content,
                ),
                distance=float(score),
            )
            for document, score in matches
        ]

    def delete_document(self, collection_name: str, document_id: str) -> int:
        collection = self.client.get_collection(collection_name)
        collection.delete(where={"document_id": document_id})
        return collection.count()

    def delete_collection(
        self, collection_name: str, *, ignore_missing: bool = False
    ) -> None:
        try:
            self.client.delete_collection(collection_name)
        except ValueError:
            if not ignore_missing:
                raise

    def clear_collections(self) -> None:
        collections = self.client.list_collections()
        for collection in collections:
            name = collection.name if hasattr(collection, "name") else str(collection)
            self.delete_collection(name, ignore_missing=True)
