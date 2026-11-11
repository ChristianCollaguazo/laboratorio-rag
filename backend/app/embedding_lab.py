from __future__ import annotations

import math
from typing import Any


def cosine_distance(left: list[float], right: list[float]) -> float:
    if len(left) != len(right) or not left:
        raise ValueError("Los vectores deben tener la misma dimensión y no estar vacíos.")
    dot = sum(a * b for a, b in zip(left, right, strict=True))
    left_norm = math.sqrt(sum(value * value for value in left))
    right_norm = math.sqrt(sum(value * value for value in right))
    if left_norm == 0 or right_norm == 0:
        raise ValueError("No se puede comparar un vector de magnitud cero.")
    return 1 - (dot / (left_norm * right_norm))


def build_embedding_lab_result(
    *,
    query: str,
    candidates: list[str],
    vectors: list[list[float]],
    model: str,
    usage: dict[str, int],
) -> dict[str, Any]:
    if len(vectors) != len(candidates) + 1:
        raise ValueError("OpenAI no devolvió un vector para cada entrada.")
    dimension = len(vectors[0])
    if dimension == 0 or any(len(vector) != dimension for vector in vectors):
        raise ValueError("Los embeddings devueltos no tienen una dimensión consistente.")

    query_point = {
        "id": "query",
        "text": query,
        "embedding_sample": vectors[0][:8],
    }
    ranked = sorted(
        (
            {
                "id": f"word_{index:03d}",
                "text": text,
                "embedding_sample": vectors[index][:8],
                "distance": cosine_distance(vectors[0], vectors[index]),
            }
            for index, text in enumerate(candidates, start=1)
        ),
        key=lambda item: item["distance"],
    )
    for rank, item in enumerate(ranked, start=1):
        item["rank"] = rank

    return {
        "model": model,
        "dimension": dimension,
        "query": query_point,
        "candidates": ranked,
        "recovered": ranked[0],
        "usage": {
            "prompt_tokens": usage.get("prompt_tokens", 0),
            "total_tokens": usage.get("total_tokens", 0),
        },
    }
