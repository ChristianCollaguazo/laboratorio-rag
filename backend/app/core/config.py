from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=("../.env", ".env"), env_file_encoding="utf-8", extra="ignore"
    )

    openai_api_key: str | None = Field(default=None, repr=False)
    openai_generation_model: str = "gpt-6-luna"
    openai_embedding_model: str = "text-embedding-3-small"
    ollama_base_url: str = "http://localhost:11434"
    ollama_generation_model: str = "qwen3:8b"
    ollama_embedding_model: str = "qwen3-embedding:0.6b"
    rag_data_dir: Path = Path(__file__).resolve().parents[3] / "data"
    rag_max_upload_mb: int = 15
    frontend_origin: str = "http://localhost:5173"

    @property
    def sqlite_path(self) -> Path:
        return self.rag_data_dir / "rag.sqlite3"

    @property
    def chroma_path(self) -> Path:
        return self.rag_data_dir / "chroma"


@lru_cache
def get_settings() -> Settings:
    return Settings()
