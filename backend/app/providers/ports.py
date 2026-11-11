from typing import Protocol

from langchain_core.embeddings import Embeddings
from langchain_core.language_models.chat_models import BaseChatModel

from .models import ProviderSpec


class ProviderRegistry(Protocol):
    def embeddings(self, config: ProviderSpec) -> Embeddings: ...

    def chat(self, config: ProviderSpec) -> BaseChatModel: ...

    def openai_embedding_batch(
        self, inputs: list[str], model: str, dimensions: int | None
    ) -> tuple[list[list[float]], dict[str, int]]: ...
