from dataclasses import dataclass

from app.core.config import Settings
from app.providers.factory import ProviderFactory


@dataclass
class StatusService:
    settings: Settings
    providers: ProviderFactory

    def get_status(self) -> dict:
        ollama_available, models, ollama_message = self.providers.ollama_status()
        openai_available = bool(self.settings.openai_api_key)
        return {
            "openai": {
                "available": openai_available,
                "configured": openai_available,
                "message": (
                    "OpenAI está configurado."
                    if openai_available
                    else "Falta OPENAI_API_KEY; Ollama y el resto de la aplicación siguen disponibles."
                ),
                "models": [
                    self.settings.openai_generation_model,
                    self.settings.openai_embedding_model,
                ],
            },
            "ollama": {
                "available": ollama_available,
                "configured": ollama_available,
                "message": ollama_message,
                "models": models,
            },
            "chroma_available": True,
            "defaults": {
                "openai_generation": self.settings.openai_generation_model,
                "openai_embedding": self.settings.openai_embedding_model,
                "ollama_generation": self.settings.ollama_generation_model,
                "ollama_embedding": self.settings.ollama_embedding_model,
            },
        }
