import re


def validate_citations(
    answer: str, allowed_ids: set[str]
) -> tuple[list[str], list[str]]:
    candidates = set(re.findall(r"\[([^\[\]\n]+)\]", answer))
    valid = sorted(candidate for candidate in candidates if candidate in allowed_ids)
    invalid = sorted(
        candidate
        for candidate in candidates
        if candidate.startswith("doc_") and candidate not in allowed_ids
    )
    return valid, invalid
