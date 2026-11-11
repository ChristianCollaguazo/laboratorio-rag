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
