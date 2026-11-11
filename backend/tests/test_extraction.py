from io import BytesIO

import pytest
from reportlab.pdfgen.canvas import Canvas
from pypdf import PdfWriter

from app.features.documents.extractors import ExtractionError, extract_pdf, extract_txt


def test_txt_requires_utf8_and_content():
    assert extract_txt("hola".encode())[0]["text"] == "hola"
    with pytest.raises(ExtractionError):
        extract_txt(b"\xff")
    with pytest.raises(ExtractionError):
        extract_txt(b"   ")


def test_pdf_extracts_selectable_text_and_pages():
    output = BytesIO()
    canvas = Canvas(output)
    canvas.drawString(72, 720, "Quito es la capital del Ecuador")
    canvas.showPage()
    canvas.drawString(72, 720, "Segunda pagina")
    canvas.save()
    pages = extract_pdf(output.getvalue())
    assert len(pages) == 2
    assert "Quito" in pages[0]["text"]
    assert pages[1]["page"] == 2


def test_pdf_without_text_explains_ocr_limit():
    output = BytesIO()
    writer = PdfWriter()
    writer.add_blank_page(width=100, height=100)
    writer.write(output)
    with pytest.raises(ExtractionError, match="OCR"):
        extract_pdf(output.getvalue())
