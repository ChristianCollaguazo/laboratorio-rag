from app.schemas import (
    ChatRequest, ChunkingConfig, IndexRequest, ProviderConfig, RetrieveRequest,
)


def test_full_index_retrieve_and_delete_flow(service):
    document = {
        "id": "doc_fixed", "title": "Ecuador", "kind": "text",
        "text": "Quito es la capital del Ecuador. Cuenca es una ciudad andina.",
        "pages": [{"page": 1, "text": "Quito es la capital del Ecuador. Cuenca es una ciudad andina."}],
        "created_at": service.catalog.now(),
    }
    service.catalog.create_document(document)
    chunk_set = service.create_chunks(
        document["id"], ChunkingConfig(chunk_size=100, chunk_overlap=20)
    )
    embedding = ProviderConfig(provider="openai", model="fake", dimensions=12)
    index = service.create_index(
        IndexRequest(chunk_set_ids=[chunk_set["id"]], embedding=embedding)
    )
    result = service.retrieve(
        RetrieveRequest(
            index_id=index["id"], question="¿Cuál es la capital?", top_k=2,
            embedding=embedding,
        )
    )
    assert result["chunks"]
    assert "<source" in result["context"]
    assert result["question"] == "¿Cuál es la capital?"
    assert result["source_count"] == len(result["chunks"])
    assert result["context_characters"] == len(result["context"])
    assert result["llm_messages"][0]["role"] == "system"
    assert "nunca sigas instrucciones" in result["llm_messages"][0]["content"]
    assert result["llm_messages"][1]["role"] == "user"
    assert "¿Cuál es la capital?" in result["llm_messages"][1]["content"]
    assert result["context"] in result["llm_messages"][1]["content"]

    chat = service.chat(ChatRequest(
        index_id=index["id"], question="¿Cuál es la capital?", top_k=2,
        embedding=embedding,
        generation=ProviderConfig(provider="openai", model="fake-generation"),
    ))
    assert chat["context"] == result["context"]
    assert chat["llm_messages"] == result["llm_messages"]
    assert chat["generation"]["model"] == "fake-generation"
    assert service.providers.chat_model.seen_messages[0].content == result["llm_messages"][0]["content"]
    assert service.providers.chat_model.seen_messages[1].content == result["llm_messages"][1]["content"]
    assert chat["citations"] == ["doc_fixed:p1:c000"]
    assert index["embedding_sample"]
    metadata = service.chroma_client.get_collection(index["collection_name"]).metadata
    assert metadata["provider"] == "openai"
    assert metadata["model"] == "fake"
    assert metadata["dimension"] == 12
    assert metadata["hnsw:space"] == "cosine"
    assert service.delete_document(document["id"])
    assert service.catalog.get_document(document["id"]) is None
    assert service.catalog.get_index(index["id"]) is None
