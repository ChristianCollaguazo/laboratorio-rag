import hashlib

from app.features.documents.models import ChunkingOptions
from app.providers.models import ProviderSpec


def build_fingerprint(
    embedding: ProviderSpec, dimension: int, chunking: ChunkingOptions
) -> str:
    value = (
        f"{embedding.provider}|{embedding.model}|{dimension}|"
        f"{chunking.chunk_size}|{chunking.chunk_overlap}"
    )
    return hashlib.sha256(value.encode()).hexdigest()[:16]
