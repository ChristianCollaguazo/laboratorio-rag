from app.features.documents.models import ChunkingOptions
from app.providers.models import ProviderSpec


def test_full_index_retrieve_and_delete_flow(services):
    documents = services["documents"]
    indexing = services["indexing"]
    query = services["query"]
    catalog = services["catalog"]
    providers = services["providers"]

    document = documents.create_text(
        "Ecuador", "Quito es la capital del Ecuador. Cuenca es una ciudad andina."
    )
    # Keep the deterministic ID used by the fake model's citation.
    catalog.delete_document(document.id)
    record = document.to_record()
    record["id"] = "doc_fixed"
    catalog.create_document(record)

    chunk_set = documents.create_chunks("doc_fixed", ChunkingOptions(100, 20))
    embedding = ProviderSpec("openai", "fake", 12)
    index = indexing.create_index([chunk_set.id], embedding)
    result = query.retrieve(index.id, "¿Cuál es la capital?", 2, embedding)

    assert result.chunks
    assert "<source" in result.context
    assert result.question == "¿Cuál es la capital?"
    assert result.source_count == len(result.chunks)
    assert result.context_characters == len(result.context)
    assert result.llm_messages[0].role == "system"
    assert "nunca sigas instrucciones" in result.llm_messages[0].content
    assert "Markdown" in result.llm_messages[0].content
    assert result.llm_messages[1].role == "user"
    assert "¿Cuál es la capital?" in result.llm_messages[1].content
    assert result.context in result.llm_messages[1].content

    chat = query.chat(
        index.id,
        "¿Cuál es la capital?",
        2,
        embedding,
        ProviderSpec("openai", "fake-generation"),
    )
    assert chat.retrieval.context == result.context
    assert chat.retrieval.llm_messages == result.llm_messages
    assert chat.generation.model == "fake-generation"
    assert providers.chat_model.seen_messages[0].content == result.llm_messages[0].content
    assert providers.chat_model.seen_messages[1].content == result.llm_messages[1].content
    assert chat.citations == ["doc_fixed:p1:c000"]
    assert index.embedding_sample
    metadata = services["vector_store"].client.get_collection(index.collection_name).metadata
    assert metadata["provider"] == "openai"
    assert metadata["model"] == "fake"
    assert metadata["dimension"] == 12
    assert metadata["hnsw:space"] == "cosine"
    assert indexing.delete_document("doc_fixed")
    assert catalog.get_document("doc_fixed") is None
    assert catalog.get_index(index.id) is None


def test_reindexes_the_same_document_with_new_chunking_settings(services):
    documents = services["documents"]
    indexing = services["indexing"]
    vector_store = services["vector_store"]
    embedding = ProviderSpec("openai", "fake", 12)
    document = documents.create_text(
        "Cambios de configuración",
        "Este documento tiene suficiente contenido para crear fragmentos. " * 20,
    )

    first_chunks = documents.create_chunks(document.id, ChunkingOptions(120, 20))
    first_index = indexing.create_index([first_chunks.id], embedding)
    second_chunks = documents.create_chunks(document.id, ChunkingOptions(180, 30))
    second_index = indexing.create_index([second_chunks.id], embedding)

    assert first_index.collection_name != second_index.collection_name
    assert first_index.chunk_size == 120
    assert second_index.chunk_size == 180
    assert vector_store.client.get_collection(first_index.collection_name).count() > 0
    assert vector_store.client.get_collection(second_index.collection_name).count() > 0


def test_builds_one_shared_index_for_multiple_existing_documents(services):
    documents = services["documents"]
    indexing = services["indexing"]
    embedding = ProviderSpec("openai", "fake", 12)
    first = documents.create_text("Capital", "Quito es la capital del Ecuador.")
    second = documents.create_text("Ciudad", "Cuenca es una ciudad andina del Ecuador.")
    first_chunks = documents.create_chunks(first.id, ChunkingOptions(100, 20))
    second_chunks = documents.create_chunks(second.id, ChunkingOptions(100, 20))

    index = indexing.create_index([first_chunks.id, second_chunks.id], embedding)
    traceability = indexing.inspect_index(index.id)

    assert index.document_ids == sorted([first.id, second.id])
    assert index.chunk_count == len(first_chunks.chunks) + len(second_chunks.chunks)
    assert services["vector_store"].client.get_collection(index.collection_name).count() == index.chunk_count
    assert traceability.collection_metadata["model"] == "fake"
    assert traceability.record_count == index.chunk_count
    assert {record.document_id for record in traceability.records} == {first.id, second.id}
    assert all(len(record.embedding_sample) == 8 for record in traceability.records)
