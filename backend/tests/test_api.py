from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import app


def test_openapi_describes_each_feature_group():
    tags = {tag["name"]: tag["description"] for tag in app.openapi()["tags"]}

    assert set(tags) == {"status", "documents", "indexing", "query", "learning"}
    assert "OpenAI" in tags["status"]
    assert "chunks" in tags["documents"]
    assert "Chroma" in tags["indexing"]
    assert "LLM" in tags["query"]
    assert "educativos" in tags["learning"]


def test_default_data_directory_remains_compatible():
    settings = Settings(_env_file=None)
    assert settings.rag_data_dir.name == "data"
    assert settings.rag_data_dir.parent.name == "RAG"


def test_app_starts_without_credentials_and_supports_local_preprocessing(tmp_path, monkeypatch):
    with TestClient(app) as client:
        status = client.get("/api/v1/status")
        assert status.status_code == 200
        assert status.json()["chroma_available"] is True

        created = client.post(
            "/api/v1/documents/text",
            json={"title": "Demo API", "text": "Un texto suficientemente claro para dividir."},
        )
        assert created.status_code == 201
        document_id = created.json()["id"]

        chunks = client.post(
            f"/api/v1/documents/{document_id}/chunks",
            json={"chunk_size": 100, "chunk_overlap": 20},
        )
        assert chunks.status_code == 201
        assert chunks.json()["chunks"][0]["document_id"] == document_id

        monkeypatch.setattr(app.state.container.providers.settings, "openai_api_key", None)
        missing_provider = client.post(
            "/api/v1/indices",
            json={
                "chunk_set_ids": [chunks.json()["id"]],
                "embedding": {"provider": "openai", "model": "text-embedding-3-small", "dimensions": 1536},
            },
        )
        assert missing_provider.status_code == 503
        assert "OPENAI_API_KEY" in missing_provider.json()["detail"]

        assert client.delete(f"/api/v1/documents/{document_id}").status_code == 204
        assert client.get("/api/status").status_code == 404


def test_index_rejects_dimensions_above_the_openai_model_limit():
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/indices",
            json={
                "chunk_set_ids": ["not_used"],
                "embedding": {
                    "provider": "openai",
                    "model": "text-embedding-3-small",
                    "dimensions": 1588,
                },
            },
        )

    assert response.status_code == 422
    assert "máximo 1536" in str(response.json()["detail"])
