import io
import os
import logging
from typing import Tuple, Optional, List, Dict, Any
import pymupdf
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
    def extract_text_from_page(
        cls, page: pymupdf.Page, dpi: int = 200, return_blocks: bool = False
    ) -> Any:
        """
        Renders PyMuPDF page pixmap to an Image and executes Tesseract OCR.
        Returns (ocr_text_or_none, extraction_method) if return_blocks is False,
        or (ocr_text_or_none, extraction_method, blocks_data) if return_blocks is True.
        """
        cls._configure_tesseract()
        try:
            pix = page.get_pixmap(dpi=dpi)
            img_bytes = pix.tobytes("png")
            img = Image.open(io.BytesIO(img_bytes))

            data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)
            page_rect = page.rect
            img_w, img_h = img.size
            scale_x = page_rect.width / float(img_w) if img_w > 0 else 1.0
            scale_y = page_rect.height / float(img_h) if img_h > 0 else 1.0

            text_parts = []
            blocks: List[Dict[str, Any]] = []
            n_boxes = len(data.get("text", []))

            for i in range(n_boxes):
                w_text = data["text"][i].strip()
                if w_text:
                    text_parts.append(w_text)
                    left = float(data["left"][i]) * scale_x
                    top = float(data["top"][i]) * scale_y
                    width = float(data["width"][i]) * scale_x
                    height = float(data["height"][i]) * scale_y
                    bbox = [round(left, 2), round(top, 2), round(left + width, 2), round(top + height, 2)]
                    blocks.append({"text": w_text, "bbox": bbox})

            raw_string = ""
            try:
                raw_string = pytesseract.image_to_string(img) or ""
            except Exception:
                pass

            cleaned_text = " ".join(text_parts) if text_parts else raw_string.strip()
            if not cleaned_text:
                return (None, "ocr_failed", []) if return_blocks else (None, "ocr_failed")

            if return_blocks:
                return cleaned_text, "ocr", blocks
            return cleaned_text, "ocr"
        except pytesseract.TesseractNotFoundError as err:
            logger.error(f"Tesseract OCR executable not found on system: {err}")
            return (None, "ocr_failed", []) if return_blocks else (None, "ocr_failed")
        except Exception as err:
            logger.error(f"OCR processing failed for page {page.number + 1}: {err}")
            return (None, "ocr_failed", []) if return_blocks else (None, "ocr_failed")
