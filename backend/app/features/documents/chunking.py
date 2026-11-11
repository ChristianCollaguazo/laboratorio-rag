from langchain_text_splitters import RecursiveCharacterTextSplitter

from .models import Chunk, ChunkingOptions, Document


def split_document(document: Document, options: ChunkingOptions) -> list[Chunk]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=options.chunk_size,
        chunk_overlap=options.chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""],
        length_function=len,
    )
    chunks: list[Chunk] = []
    position = 0
    for page in document.pages:
        for content in splitter.split_text(page.text):
            content = content.strip()
            if not content:
                continue
            chunks.append(
                Chunk(
                    id=f"{document.id}:p{page.page}:c{position:03d}",
                    document_id=document.id,
                    document_title=document.title,
                    page=page.page,
                    position=position,
                    text=content,
                )
            )
            position += 1
    return chunks
