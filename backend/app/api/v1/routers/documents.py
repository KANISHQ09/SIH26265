import hashlib
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request, Response
from sqlalchemy import select, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.deps import get_current_user, check_instrument_access
from app.models.enums import DocumentType, TrustLevel
from app.models.entities import Instrument, Document, User, FieldTrust
from app.schemas.document import DocumentResponse, OCRResultResponse
from app.adapters.storage.local_store import get_storage_adapter
from app.adapters.ocr.extractor import OCRExtractor
from app.services.audit_service import create_audit_log

router = APIRouter(prefix="/documents", tags=["Documents"])
storage = get_storage_adapter()


@router.post("/{instrument_id}/upload", response_model=DocumentResponse)
async def upload_document(
    instrument_id: str,
    request: Request,
    file: UploadFile = File(...),
    doc_type: DocumentType = Form(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Instrument).where(Instrument.id == instrument_id)
    instrument = (await db.execute(stmt)).scalars().first()
    if not instrument:
        raise HTTPException(status_code=404, detail="Instrument not found")

    check_instrument_access(instrument, current_user)

    # 1. Read bytes and compute cryptographic SHA-256 hash
    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty file uploaded.")
    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File exceeds 10MB limit.")

    sha256_hash = hashlib.sha256(file_bytes).hexdigest()

    # 2. Storage key: {instrument_id}/{sha256}_{filename}
    storage_key = f"{instrument_id}/{sha256_hash[:16]}_{file.filename}"
    await storage.save_file(file_bytes, storage_key)

    # 3. Mark previous versions of same doc_type as not current
    existing_stmt = select(Document).where(
        and_(
            Document.instrument_id == instrument_id,
            Document.doc_type == doc_type,
            Document.is_current == True
        )
    )
    existing_docs = (await db.execute(existing_stmt)).scalars().all()
    version_no = len(existing_docs) + 1
    for d in existing_docs:
        d.is_current = False

    # 4. Asynchronous OCR extraction
    ocr_result = OCRExtractor.extract_from_bytes(file_bytes, file.filename)

    # 5. Create Document record
    doc = Document(
        instrument_id=instrument_id,
        doc_type=doc_type,
        file_name=file.filename,
        storage_key=storage_key,
        sha256=sha256_hash,
        mime_type=file.content_type,
        size_bytes=len(file_bytes),
        version_no=version_no,
        ocr_json=ocr_result,
        uploaded_by=current_user.id,
        is_current=True,
    )
    db.add(doc)

    await create_audit_log(
        db=db,
        action="DOCUMENT_UPLOAD",
        entity_type="DOCUMENT",
        entity_id=doc.id,
        actor_id=current_user.id,
        actor_role=current_user.role.value,
        after_json={"file_name": file.filename, "sha256": sha256_hash, "doc_type": doc_type.value},
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    await db.commit()
    await db.refresh(doc)
    return doc


@router.get("/{id}/download")
async def download_document(
    id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Document).where(Document.id == id)
    doc = (await db.execute(stmt)).scalars().first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Access check on parent instrument
    instr_stmt = select(Instrument).where(Instrument.id == doc.instrument_id)
    instrument = (await db.execute(instr_stmt)).scalars().first()
    if instrument:
        check_instrument_access(instrument, current_user)

    # Audit log read of sensitive document (Mandatory for financial/security deposit portal)
    await create_audit_log(
        db=db,
        action="DOCUMENT_READ_DOWNLOAD",
        entity_type="DOCUMENT",
        entity_id=doc.id,
        actor_id=current_user.id,
        actor_role=current_user.role.value,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    await db.commit()

    file_bytes = await storage.get_file(doc.storage_key)
    return Response(
        content=file_bytes,
        media_type=doc.mime_type or "application/octet-stream",
        headers={"Content-Disposition": f'inline; filename="{doc.file_name}"'}
    )


@router.get("/instrument/{instrument_id}", response_model=List[DocumentResponse])
async def list_instrument_documents(
    instrument_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Instrument).where(Instrument.id == instrument_id)
    instrument = (await db.execute(stmt)).scalars().first()
    if not instrument:
        raise HTTPException(status_code=404, detail="Instrument not found")

    check_instrument_access(instrument, current_user)

    doc_stmt = (
        select(Document)
        .where(Document.instrument_id == instrument_id)
        .order_by(desc(Document.uploaded_at))
    )
    result = await db.execute(doc_stmt)
    return list(result.scalars().all())
