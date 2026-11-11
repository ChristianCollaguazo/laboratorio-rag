from fastapi.testclient import TestClient

from app.features.learning.embedding_math import build_embedding_lab_result, cosine_distance
from app.main import app


def test_embedding_lab_ranks_vectors_and_recovers_stored_text_by_id():
    result = build_embedding_lab_result(
        query="automóvil",
        candidates=["coche", "banana"],
        vectors=[[1.0, 0.0], [0.99, 0.1], [0.0, 1.0]],
        model="text-embedding-3-small",
        usage={"prompt_tokens": 3, "total_tokens": 3},
    )

    assert cosine_distance([1.0, 0.0], [1.0, 0.0]) == 0
    assert result["candidates"][0]["text"] == "coche"
    assert result["candidates"][0]["id"] == "word_001"
    assert result["recovered"]["text"] == "coche"
    assert result["dimension"] == 2
    assert result["usage"]["total_tokens"] == 3


def test_embedding_lab_api_uses_backend_provider_and_returns_real_contract(monkeypatch):
    with TestClient(app) as client:
        calls = []

        def fake_batch(inputs, model, dimensions):
            calls.append((inputs, model, dimensions))
            return (
                [[1.0, 0.0], [0.98, 0.2], [0.0, 1.0], [0.9, 0.3]],
                {"prompt_tokens": 4, "total_tokens": 4},
            )

        monkeypatch.setattr(app.state.container.providers, "openai_embedding_batch", fake_batch)
        response = client.post(
            "/api/v1/learning/embeddings",
            json={
                "query": "automóvil",
                "candidates": ["coche", "banana", "vehículo"],
                "model": "text-embedding-3-small",
                "dimensions": 2,
            },
        )

    assert response.status_code == 200
    payload = response.json()
    assert calls == [
        (
            ["automóvil", "coche", "banana", "vehículo"],
            "text-embedding-3-small",
            2,
        )
    ]
    assert payload["recovered"]["text"] == "coche"
    assert payload["query"]["embedding_sample"] == [1.0, 0.0]
    assert payload["usage"]["total_tokens"] == 4
