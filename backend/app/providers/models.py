from dataclasses import dataclass
from typing import Literal

ProviderName = Literal["openai", "ollama"]


@dataclass(frozen=True)
class ProviderSpec:
    provider: ProviderName
    model: str
    dimensions: int | None = None
