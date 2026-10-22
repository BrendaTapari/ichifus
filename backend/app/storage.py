import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from app.config import settings

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
MAX_UPLOAD_BYTES = 8 * 1024 * 1024


def upload_dir() -> Path:
    path = Path(settings.UPLOAD_DIR)
    path.mkdir(parents=True, exist_ok=True)
    return path


def upload_url(filename: str | None) -> str | None:
    if not filename:
        return None
    return f"/uploads/{filename}"


def delete_file(filename: str | None) -> None:
    if not filename or "/" in filename or "\\" in filename or ".." in filename:
        return
    path = upload_dir() / filename
    if path.is_file():
        path.unlink()


def _looks_like_image(ext: str, data: bytes) -> bool:
    if ext in {".jpg", ".jpeg"}:
        return data.startswith(b"\xff\xd8\xff")
    if ext == ".png":
        return data.startswith(b"\x89PNG\r\n\x1a\n")
    if ext == ".gif":
        return data.startswith((b"GIF87a", b"GIF89a"))
    if ext == ".webp":
        return len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP"
    return False


def save_uploads(uploads: list[UploadFile], limit: int) -> list[str]:
    chosen = [item for item in uploads if item.filename]
    if len(chosen) > limit:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Podés subir hasta {limit} fotos por vez",
        )
    saved: list[str] = []
    try:
        for item in chosen:
            saved.append(save_upload(item))
    except Exception:
        for name in saved:
            delete_file(name)
        raise
    return saved


def save_upload(upload: UploadFile) -> str:
    ext = Path(upload.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se permiten imágenes JPG, PNG, WEBP o GIF",
        )
    try:
        data = upload.file.read(MAX_UPLOAD_BYTES + 1)
    finally:
        upload.file.close()
    if not data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El archivo está vacío")
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="La imagen supera el límite de 8 MB")
    if not _looks_like_image(ext, data):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El archivo no es una imagen válida")
    filename = f"{uuid.uuid4().hex}{ext}"
    (upload_dir() / filename).write_bytes(data)
    return filename
