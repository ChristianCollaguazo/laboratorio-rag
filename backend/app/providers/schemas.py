from typing import Literal

from pydantic import BaseModel, Field, model_validator

from .models import ProviderSpec, embedding_dimension_limit


class ProviderConfig(BaseModel):
    provider: Literal["openai", "ollama"]
    model: str = Field(min_length=1, max_length=200)
    dimensions: int | None = Field(default=None, ge=1, le=8192)

    @model_validator(mode="after")
    def validate_model_dimensions(self) -> "ProviderConfig":
        config = self.to_domain()
        limit = embedding_dimension_limit(config)
        if limit is not None and config.dimensions is not None and config.dimensions > limit:
            raise ValueError(
                f"{config.model} admite como máximo {limit} dimensiones; "
                f"se recibieron {config.dimensions}."
            )
        return self

    def to_domain(self) -> ProviderSpec:
        return ProviderSpec(self.provider, self.model, self.dimensions)


class ProviderStatusView(BaseModel):
    available: bool
    configured: bool
    message: str
    models: list[str] = []
