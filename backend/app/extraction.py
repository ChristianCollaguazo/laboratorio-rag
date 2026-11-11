from io import BytesIO

from pypdf import PdfReader


class ExtractionError(ValueError):
    pass


def extract_txt(content: bytes) -> list[dict[str, object]]:
    try:
        text = content.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise ExtractionError("El TXT debe estar codificado en UTF-8.") from exc
    if not text.strip():
        raise ExtractionError("El archivo TXT está vacío.")
    return [{"page": 1, "text": text}]


def extract_pdf(content: bytes) -> list[dict[str, object]]:
    try:
        reader = PdfReader(BytesIO(content))
        if reader.is_encrypted:
            raise ExtractionError("El PDF está cifrado y no se puede procesar.")
        pages = [
            {"page": number, "text": page.extract_text() or ""}
            for number, page in enumerate(reader.pages, start=1)
        ]
    except ExtractionError:
        raise
    except Exception as exc:
        raise ExtractionError("No se pudo leer el PDF.") from exc
    if not any(str(page["text"]).strip() for page in pages):
        raise ExtractionError(
            "El PDF no contiene texto seleccionable. Esta versión no incluye OCR."
        )
    return pages
