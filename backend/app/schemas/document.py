from typing import Optional, Any
from datetime import datetime
from pydantic import BaseModel
from app.models.enums import DocumentType


class DocumentResponse(BaseModel):
    id: str
    instrument_id: str
    doc_type: DocumentType
    file_name: str
    storage_key: str
    sha256: str
    mime_type: Optional[str] = None
    size_bytes: Optional[int] = None
    version_no: int
    ocr_json: Optional[Any] = None
    uploaded_by: Optional[str] = None
    uploaded_at: datetime
    is_current: bool

    class Config:
        from_attributes = True


class OCRResultResponse(BaseModel):
    document_id: str
    confidence: float
    extracted_fields: dict
    raw_text: Optional[str] = None
