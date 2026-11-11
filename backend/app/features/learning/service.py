from dataclasses import dataclass

from app.core.config import Settings
from app.providers.ports import ProviderRegistry

from .embedding_math import build_embedding_lab_result


@dataclass
class LearningService:
    settings: Settings
    providers: ProviderRegistry

    def create_embedding_example(
        self,
        query: str,
        candidates: list[str],
        model: str | None,
        dimensions: int | None,
    ) -> dict:
        selected_model = model or self.settings.openai_embedding_model
        vectors, usage = self.providers.openai_embedding_batch(
            [query, *candidates], selected_model, dimensions
        )
        return build_embedding_lab_result(
            query=query,
            candidates=candidates,
            vectors=vectors,
            model=selected_model,
            usage=usage,
        )
