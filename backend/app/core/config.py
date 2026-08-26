from typing import List, Union
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Document & Research Intelligence Engine API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = True

    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5433/document_search_db"

    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 50

    # OCR Settings
    OCR_MIN_TEXT_CHARS: int = 50
    TESSERACT_CMD: str = ""

    # Text Chunking Settings
    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 50



    model_config = SettingsConfigDict(

        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
