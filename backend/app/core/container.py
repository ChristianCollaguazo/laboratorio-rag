from dataclasses import dataclass

from fastapi import Request

from app.features.documents.service import DocumentService
from app.features.indexing.service import IndexingService
from app.features.learning.service import LearningService
from app.features.query.service import QueryService
from app.features.status.service import StatusService
from app.infrastructure.chroma.vector_store import ChromaVectorStore
from app.infrastructure.sqlite.catalog import Catalog
from app.infrastructure.sqlite.repositories import DocumentRepository, IndexRepository
from app.providers.factory import ProviderFactory

from .config import Settings


@dataclass
class ApplicationContainer:
    settings: Settings
    catalog: Catalog
    providers: ProviderFactory
    documents: DocumentService
    indexing: IndexingService
    query: QueryService
    learning: LearningService
    status: StatusService

    @classmethod
    def build(cls, settings: Settings) -> "ApplicationContainer":
        settings.rag_data_dir.mkdir(parents=True, exist_ok=True)
        catalog = Catalog(settings.sqlite_path)
        providers = ProviderFactory(settings)
        vector_store = ChromaVectorStore(settings.chroma_path)
        documents = DocumentService(DocumentRepository(catalog), catalog)
        indexing = IndexingService(documents, IndexRepository(catalog), vector_store, providers, catalog)
        return cls(
            settings=settings,
            catalog=catalog,
            providers=providers,
            documents=documents,
            indexing=indexing,
            query=QueryService(indexing, vector_store, providers),
            learning=LearningService(settings, providers),
            status=StatusService(settings, providers),
        )


def get_container(request: Request) -> ApplicationContainer:
    return request.app.state.container
