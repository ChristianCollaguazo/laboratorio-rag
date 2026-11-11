import pytest

from app.features.documents.chunking import split_document
from app.features.documents.models import ChunkingOptions, Document, Page
from app.features.documents.schemas import ChunkingConfig


def test_chunking_preserves_page_metadata_and_stable_ids():
    document = Document(
        id="doc_demo", title="Demo", kind="text", text="",
        pages=[Page(1, "A" * 160 + " final de página uno."), Page(2, "B" * 180 + " final de página dos.")],
        created_at="2026-11-01T00:00:00Z",
    )
    chunks = split_document(document, ChunkingOptions(100, 20))

    assert len(chunks) >= 4
    assert chunks[0].id == "doc_demo:p1:c000"
    assert {chunk.page for chunk in chunks} == {1, 2}
    assert all(len(chunk.text) <= 100 for chunk in chunks)
    assert [chunk.position for chunk in chunks] == list(range(len(chunks)))


def test_overlap_must_be_smaller_than_size():
    with pytest.raises(ValueError, match="menor"):
        ChunkingConfig(chunk_size=100, chunk_overlap=100)
