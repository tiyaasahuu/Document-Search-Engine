import io
import os
import logging
from typing import Tuple, Optional
import pymupdf as fitz
from PIL import Image
import pytesseract

from app.core.config import settings

logger = logging.getLogger(__name__)


class OCRService:
    @staticmethod
    def _configure_tesseract():
        """Configures tesseract_cmd if set in settings or env."""
        if settings.TESSERACT_CMD and os.path.exists(settings.TESSERACT_CMD):
            pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD

    @classmethod
    def is_tesseract_available(cls) -> bool:
        """Returns True if Tesseract executable is installed and available."""
        cls._configure_tesseract()
        try:
            pytesseract.get_tesseract_version()
            return True
        except Exception:
            return False

    @classmethod
    def extract_text_from_page(cls, page: fitz.Page, dpi: int = 200) -> Tuple[Optional[str], str]:
        """
        Renders PyMuPDF page pixmap to an Image and executes Tesseract OCR.
        Returns a tuple: (ocr_text_or_none, extraction_method).
        - Success: (ocr_text, "ocr")
        - Failure: (None, "ocr_failed")
        """
        cls._configure_tesseract()
        try:
            pix = page.get_pixmap(dpi=dpi)
            img_bytes = pix.tobytes("png")
            img = Image.open(io.BytesIO(img_bytes))

            raw_text = pytesseract.image_to_string(img)
            cleaned_text = raw_text.strip() if raw_text else ""
            return cleaned_text, "ocr"
        except pytesseract.TesseractNotFoundError as err:
            logger.error(f"Tesseract OCR executable not found on system: {err}")
            return None, "ocr_failed"
        except Exception as err:
            logger.error(f"OCR processing failed for page {page.number + 1}: {err}")
            return None, "ocr_failed"
