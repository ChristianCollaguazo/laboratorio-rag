from typing import Literal

from pydantic import BaseModel, Field

from .models import ProviderSpec


class ProviderConfig(BaseModel):
    provider: Literal["openai", "ollama"]
    model: str = Field(min_length=1, max_length=200)
    dimensions: int | None = Field(default=None, ge=1, le=8192)

    def to_domain(self) -> ProviderSpec:
        return ProviderSpec(self.provider, self.model, self.dimensions)


class ProviderStatusView(BaseModel):
    available: bool
    configured: bool
    message: str
    models: list[str] = []
