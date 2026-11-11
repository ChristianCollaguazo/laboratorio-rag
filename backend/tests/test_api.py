from fastapi.testclient import TestClient

from app.main import app


def test_app_starts_without_credentials_and_supports_local_preprocessing(tmp_path, monkeypatch):
    # El lifespan usa el directorio configurado; la prueba solo comprueba contratos sin proveedores.
    with TestClient(app) as client:
        status = client.get("/api/status")
        assert status.status_code == 200
        assert status.json()["chroma_available"] is True

        created = client.post(
            "/api/documents/text",
            json={"title": "Demo API", "text": "Un texto suficientemente claro para dividir."},
        )
        assert created.status_code == 201
        document_id = created.json()["id"]

        chunks = client.post(
            f"/api/documents/{document_id}/chunks",
            json={"chunk_size": 100, "chunk_overlap": 20},
        )
        assert chunks.status_code == 201
        assert chunks.json()["chunks"][0]["document_id"] == document_id

        monkeypatch.setattr(app.state.providers.settings, "openai_api_key", None)
        missing_provider = client.post(
            "/api/indices",
            json={
                "chunk_set_ids": [chunks.json()["id"]],
                "embedding": {"provider": "openai", "model": "text-embedding-3-small", "dimensions": 1536},
            },
        )
        assert missing_provider.status_code == 503
        assert "OPENAI_API_KEY" in missing_provider.json()["detail"]

        assert client.delete(f"/api/documents/{document_id}").status_code == 204
