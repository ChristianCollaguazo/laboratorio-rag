from pydantic import BaseModel, Field, model_validator


class EmbeddingLabRequest(BaseModel):
    query: str = Field(min_length=1, max_length=200)
    candidates: list[str] = Field(min_length=2, max_length=6)
    model: str | None = Field(default=None, min_length=1, max_length=200)
    dimensions: int | None = Field(default=1536, ge=2, le=8192)

    @model_validator(mode="after")
    def normalize_words(self) -> "EmbeddingLabRequest":
        self.query = self.query.strip()
        self.candidates = [item.strip() for item in self.candidates]
        if not self.query or any(not item for item in self.candidates):
            raise ValueError(
                "La consulta y los textos candidatos no pueden estar vacíos."
            )
        if len({item.casefold() for item in self.candidates}) != len(self.candidates):
            raise ValueError("Los textos candidatos deben ser diferentes entre sí.")
        return self


class EmbeddingLabPoint(BaseModel):
    id: str
    text: str
    embedding_sample: list[float]


class EmbeddingLabCandidate(EmbeddingLabPoint):
    distance: float
    rank: int


class EmbeddingLabUsage(BaseModel):
    prompt_tokens: int
    total_tokens: int


class EmbeddingLabView(BaseModel):
    model: str
    dimension: int
    query: EmbeddingLabPoint
    candidates: list[EmbeddingLabCandidate]
    recovered: EmbeddingLabCandidate
    usage: EmbeddingLabUsage
