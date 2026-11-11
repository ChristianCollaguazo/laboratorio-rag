import json
from dataclasses import dataclass
from urllib.error import URLError
from urllib.request import urlopen

from langchain_core.embeddings import Embeddings
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_ollama import ChatOllama, OllamaEmbeddings
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from openai import OpenAI

from app.core.config import Settings
from app.core.errors import ProviderUnavailableError
from app.providers.models import ProviderSpec


@dataclass
class ProviderFactory:
    settings: Settings

    def embeddings(self, config: ProviderSpec) -> Embeddings:
        if config.provider == "openai":
            if not self.settings.openai_api_key:
                raise ProviderUnavailableError(
                    "OPENAI_API_KEY no está configurada. Añádela al archivo .env del backend."
                )
            arguments: dict[str, object] = {
                "model": config.model,
                "api_key": self.settings.openai_api_key,
            }
            if config.dimensions is not None:
                arguments["dimensions"] = config.dimensions
            return OpenAIEmbeddings(**arguments)
        if not self.ollama_status()[0]:
            raise ProviderUnavailableError(
                f"Ollama no responde en {self.settings.ollama_base_url}. "
                "Inícialo y comprueba que el modelo esté descargado."
            )
        return OllamaEmbeddings(model=config.model, base_url=self.settings.ollama_base_url)

    def chat(self, config: ProviderSpec) -> BaseChatModel:
        if config.provider == "openai":
            if not self.settings.openai_api_key:
                raise ProviderUnavailableError(
                    "OPENAI_API_KEY no está configurada. Añádela al archivo .env del backend."
                )
            return ChatOpenAI(
                model=config.model,
                api_key=self.settings.openai_api_key,
                use_responses_api=True,
                output_version="responses/v1",
                reasoning={"effort": "none"},
                store=False,
                max_retries=2,
                timeout=60,
            )
        if not self.ollama_status()[0]:
            raise ProviderUnavailableError(
                f"Ollama no responde en {self.settings.ollama_base_url}."
            )
        return ChatOllama(
            model=config.model,
            base_url=self.settings.ollama_base_url,
            temperature=0,
        )

    def openai_embedding_batch(
        self, inputs: list[str], model: str, dimensions: int | None
    ) -> tuple[list[list[float]], dict[str, int]]:
        if not self.settings.openai_api_key:
            raise ProviderUnavailableError(
                "OPENAI_API_KEY no está configurada. Añádela al archivo .env del backend."
            )
        try:
            client = OpenAI(
                api_key=self.settings.openai_api_key,
                max_retries=2,
                timeout=60,
            )
            arguments: dict[str, object] = {
                "model": model,
                "input": inputs,
                "encoding_format": "float",
            }
            if dimensions is not None:
                arguments["dimensions"] = dimensions
            response = client.embeddings.create(**arguments)
        except Exception as exc:
            raise ProviderUnavailableError(
                "OpenAI no pudo generar los embeddings. Revisa la clave, el modelo y la conexión."
            ) from exc

        ordered = sorted(response.data, key=lambda item: item.index)
        vectors = [list(item.embedding) for item in ordered]
        return vectors, {
            "prompt_tokens": response.usage.prompt_tokens,
            "total_tokens": response.usage.total_tokens,
        }

    def ollama_status(self) -> tuple[bool, list[str], str]:
        try:
            with urlopen(f"{self.settings.ollama_base_url}/api/tags", timeout=1.2) as response:
                payload = json.load(response)
            models = [item["name"] for item in payload.get("models", [])]
            return True, models, "Ollama está disponible."
        except (URLError, TimeoutError, OSError, ValueError):
            return False, [], "Ollama no está instalado, no está iniciado o no responde."
