import asyncio
import hashlib
import io
import os

import aiofiles
from fastapi import APIRouter, File, Form, UploadFile
from google.cloud import storage

from src.setup.dependencies import CurrentUser
from src.setup.errors import AppError

router = APIRouter(tags=["Upload"])

GCP_BUCKET_NAME = os.getenv("GCP_STORAGE_BUCKET")
GCP_PROJECT_ID  = os.getenv("GCP_PROJECT_ID")
LOCAL_STORAGE_DIR = os.getenv("LOCAL_STORAGE_DIR", "./uploads")


# ── PDF optimisation ──────────────────────────────────────────────────────────

def _optimize_pdf(data: bytes) -> bytes:
    """
    Losslessly reduce a PDF's byte size using pikepdf.
    Falls back to the original bytes if pikepdf raises (e.g. encrypted PDF).
    """
    try:
        import pikepdf
        with pikepdf.open(io.BytesIO(data)) as pdf:
            out = io.BytesIO()
            pdf.save(
                out,
                compress_streams=True,
                recompress_streams=True,
                normalize_content=True,
                linearize=True,
            )
            return out.getvalue()
    except Exception:
        return data


# ── GCS helper (sync — called via asyncio.to_thread) ─────────────────────────

def _gcs_upsert(object_key: str, file_bytes: bytes, content_type: str) -> str:
    """
    Upload to GCS only when the object does not already exist.
    Returns the public URL in both cases (dedup or fresh upload).
    """
    client = storage.Client(project=GCP_PROJECT_ID)
    bucket = client.bucket(GCP_BUCKET_NAME)
    blob   = bucket.blob(object_key)
    if not blob.exists():
        blob.upload_from_string(file_bytes, content_type=content_type)
    return blob.public_url


# ── Upload endpoint ───────────────────────────────────────────────────────────

@router.post("/upload")
async def upload_file(
    current_user: CurrentUser,
    file: UploadFile = File(...),
    folder: str | None = Form(None),
):
    raw_bytes    = await file.read()
    content_type = file.content_type or "application/octet-stream"
    safe_name    = (file.filename or "file").replace(" ", "_")

    # Losslessly optimise PDFs before hashing so the stored file is always
    # the smallest valid representation of the same content.
    if content_type == "application/pdf":
        file_bytes = await asyncio.to_thread(_optimize_pdf, raw_bytes)
    else:
        file_bytes = raw_bytes

    # SHA-256 of the (possibly optimised) bytes is the deduplication key.
    # Two uploads of identical content → identical hash → same GCS object key
    # → no second write, same URL returned.
    content_hash = hashlib.sha256(file_bytes).hexdigest()

    if folder:
        object_key = f"{folder}/{content_hash}_{safe_name}"
    else:
        object_key = f"faculty/{current_user.email}/{content_hash}_{safe_name}"

    # ── Mock (no GCP configured) ──────────────────────────────────────────────
    if not GCP_BUCKET_NAME:
        return {
            "url":      f"https://storage.example.com/{object_key}",
            "publicId": object_key,
            "name":     file.filename,
            "type":     content_type,
            "deduped":  False,
        }

    # ── Local storage fallback ────────────────────────────────────────────────
    if os.getenv("USE_LOCAL_STORAGE", "false").lower() == "true":
        base_dir   = folder or f"faculty/{current_user.email}"
        target_dir = os.path.join(LOCAL_STORAGE_DIR, base_dir)
        os.makedirs(target_dir, exist_ok=True)
        local_path = os.path.join(target_dir, f"{content_hash}_{safe_name}")
        deduped    = os.path.exists(local_path)
        if not deduped:
            async with aiofiles.open(local_path, "wb") as fh:
                await fh.write(file_bytes)
        rel = os.path.relpath(local_path, LOCAL_STORAGE_DIR).replace("\\", "/")
        return {
            "url":      f"/uploads/{rel}",
            "publicId": rel,
            "name":     file.filename,
            "type":     content_type,
            "deduped":  deduped,
        }

    # ── GCS ───────────────────────────────────────────────────────────────────
    try:
        public_url = await asyncio.to_thread(
            _gcs_upsert, object_key, file_bytes, content_type
        )
        return {
            "url":      public_url,
            "publicId": object_key,
            "name":     file.filename,
            "type":     content_type,
        }
    except Exception as exc:
        raise AppError(
            "Your file could not be uploaded. Please try again.",
            detail=f"GCS upload failed: {type(exc).__name__}: {exc}",
            status_code=500,
        )
