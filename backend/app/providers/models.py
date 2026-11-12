from dataclasses import dataclass
from typing import Literal

ProviderName = Literal["openai", "ollama"]

OPENAI_EMBEDDING_DIMENSION_LIMITS = {
    "text-embedding-3-small": 1536,
    "text-embedding-3-large": 3072,
}


@dataclass(frozen=True)
class ProviderSpec:
    provider: ProviderName
    model: str
    dimensions: int | None = None


def embedding_dimension_limit(config: ProviderSpec) -> int | None:
    if config.provider != "openai":
        return None
    return OPENAI_EMBEDDING_DIMENSION_LIMITS.get(config.model)
