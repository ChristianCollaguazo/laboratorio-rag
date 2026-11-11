import hashlib

import pytest
from langchain_core.embeddings import Embeddings
from langchain_core.language_models import SimpleChatModel
from pydantic import PrivateAttr

from app.config import Settings
from app.database import Catalog
from app.rag import RagService


class FakeEmbeddings(Embeddings):
    dimension = 12

    @staticmethod
    def _vector(text: str) -> list[float]:
        digest = hashlib.sha256(text.lower().encode()).digest()
        values = [(digest[index] / 127.5) - 1 for index in range(12)]
        norm = sum(value * value for value in values) ** 0.5
        return [value / norm for value in values]

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return [self._vector(text) for text in texts]

    def embed_query(self, text: str) -> list[float]:
        return self._vector(text)


class FakeChat(SimpleChatModel):
    _seen_messages: list = PrivateAttr(default_factory=list)

    @property
    def _llm_type(self) -> str:
        return "fake"

    def _call(self, messages, stop=None, run_manager=None, **kwargs) -> str:
        self._seen_messages = list(messages)
        return "La capital indicada es Quito [doc_fixed:p1:c000]."

    @property
    def seen_messages(self):
        return self._seen_messages


class FakeProviders:
    def __init__(self):
        self.chat_model = FakeChat()

    def embeddings(self, config):
        return FakeEmbeddings()

    def chat(self, config):
        return self.chat_model


@pytest.fixture
def service(tmp_path):
    settings = Settings(rag_data_dir=tmp_path, openai_api_key=None)
    return RagService(settings, Catalog(settings.sqlite_path), FakeProviders())
