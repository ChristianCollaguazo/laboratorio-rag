import uuid
from dataclasses import dataclass

from app.core.errors import ResourceNotFoundError, ValidationError
from app.infrastructure.sqlite.catalog import Catalog
from app.infrastructure.sqlite.repositories import DocumentRepository

from .chunking import split_document
from .extractors import extract_pdf, extract_txt
from .models import Chunk, ChunkSet, ChunkingOptions, Document, Page


@dataclass
class DocumentService:
    repository: DocumentRepository
    catalog: Catalog

    def list_documents(self) -> list[Document]:
        return [Document.from_record(item) for item in self.repository.list()]

    def get_document(self, document_id: str) -> Document | None:
        item = self.repository.get(document_id)
        return Document.from_record(item) if item else None

    def create_text(self, title: str, text: str) -> Document:
        normalized = text.strip()
        document = Document(
            id=f"doc_{uuid.uuid4().hex}",
            title=title.strip(),
            kind="text",
            text=normalized,
            pages=[Page(page=1, text=normalized)],
            created_at=self.catalog.now(),
        )
        self.repository.create(document.to_record())
        return document

    def create_upload(self, filename: str, content: bytes) -> Document:
        extension = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
        if extension == "txt":
            page_records, kind = extract_txt(content), "txt"
        elif extension == "pdf":
            page_records, kind = extract_pdf(content), "pdf"
        else:
            raise ValidationError("Solo se aceptan archivos TXT y PDF.")
        pages = [Page(page=int(item["page"]), text=str(item["text"])) for item in page_records]
        document = Document(
            id=f"doc_{uuid.uuid4().hex}",
            title=filename,
            kind=kind,
            text="\n\n".join(page.text for page in pages),
            pages=pages,
            created_at=self.catalog.now(),
        )
        self.repository.create(document.to_record())
        return document

    def create_chunks(self, document_id: str, options: ChunkingOptions) -> ChunkSet:
        document = self.get_document(document_id)
        if not document:
            raise ResourceNotFoundError("Documento no encontrado.")
        chunks = split_document(document, options)
        if not chunks:
            raise ValidationError("El documento no produjo fragmentos utilizables.")
        chunk_set = ChunkSet(
            id=f"chunks_{uuid.uuid4().hex}",
            document_id=document_id,
            options=options,
            chunks=chunks,
            created_at=self.catalog.now(),
        )
        self.repository.create_chunk_set(
            {
                "id": chunk_set.id,
                "document_id": document_id,
                "chunk_size": options.chunk_size,
                "chunk_overlap": options.chunk_overlap,
                "created_at": chunk_set.created_at,
            },
            [chunk.to_record() for chunk in chunks],
        )
        return chunk_set

    def get_chunk_set(self, chunk_set_id: str) -> ChunkSet | None:
        item = self.repository.get_chunk_set(chunk_set_id)
        if not item:
            return None
        return ChunkSet(
            id=item["id"],
            document_id=item["document_id"],
            options=ChunkingOptions(item["chunk_size"], item["chunk_overlap"]),
            chunks=[Chunk.from_record(chunk) for chunk in item["chunks"]],
            created_at=item["created_at"],
        )

    def delete_document_record(self, document_id: str) -> bool:
        return self.repository.delete(document_id)
