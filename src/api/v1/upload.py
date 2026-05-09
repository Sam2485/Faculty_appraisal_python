from fastapi import APIRouter, UploadFile, File, Form, Depends
from src.setup.errors import AppError
from typing import Optional
import os
from google.cloud import storage
import uuid
from src.setup.dependencies import CurrentUser

router = APIRouter(tags=["Upload"])

GCP_BUCKET_NAME = os.getenv("GCP_STORAGE_BUCKET")
GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID")

@router.post("/upload")
async def upload_file(
    current_user: CurrentUser,
    file: UploadFile = File(...),
    folder: Optional[str] = Form(None)
):
    file_uuid = str(uuid.uuid4())
    safe_filename = file.filename.replace(" ", "_")

    if folder:
        public_id = f"{folder}/{file_uuid}_{safe_filename}"
    else:
        public_id = f"faculty/{current_user.email}/{file_uuid}_{safe_filename}"

    if not GCP_BUCKET_NAME:
        return {
            "url": f"https://storage.example.com/{public_id}",
            "publicId": public_id,
            "name": file.filename,
            "type": file.content_type
        }

    try:
        storage_client = storage.Client(project=GCP_PROJECT_ID)
        bucket = storage_client.bucket(GCP_BUCKET_NAME)
        blob = bucket.blob(public_id)
        blob.upload_from_file(file.file, content_type=file.content_type)
        return {
            "url": blob.public_url,
            "publicId": public_id,
            "name": file.filename,
            "type": file.content_type
        }
    except Exception as e:
        raise AppError(
            "Your file could not be uploaded. Please try again.",
            detail=f"GCS upload failed: {type(e).__name__}: {e}",
            status_code=500,
        )
