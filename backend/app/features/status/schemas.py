from pydantic import BaseModel

from app.providers.schemas import ProviderStatusView


class StatusView(BaseModel):
    openai: ProviderStatusView
    ollama: ProviderStatusView
    chroma_available: bool
    defaults: dict[str, str]
