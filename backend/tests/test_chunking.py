from app.rag import split_document
from app.schemas import ChunkingConfig


def test_chunking_preserves_page_metadata_and_stable_ids():
    document = {
        "id": "doc_demo", "title": "Demo",
        "pages": [
            {"page": 1, "text": "A" * 160 + " final de página uno."},
            {"page": 2, "text": "B" * 180 + " final de página dos."},
        ],
    }
    chunks = split_document(document, ChunkingConfig(chunk_size=100, chunk_overlap=20))

    assert len(chunks) >= 4
    assert chunks[0]["id"] == "doc_demo:p1:c000"
    assert {chunk["page"] for chunk in chunks} == {1, 2}
    assert all(len(chunk["text"]) <= 100 for chunk in chunks)
    assert [chunk["position"] for chunk in chunks] == list(range(len(chunks)))


def test_overlap_must_be_smaller_than_size():
    try:
        ChunkingConfig(chunk_size=100, chunk_overlap=100)
    except ValueError as error:
        assert "menor" in str(error)
    else:
        raise AssertionError("La configuración inválida debió rechazarse")
