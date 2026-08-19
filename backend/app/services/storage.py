from __future__ import annotations

import shutil
from pathlib import Path

from fastapi import HTTPException, UploadFile

from app.config import UPLOAD_DIR

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
MAX_UPLOAD_BYTES = 10 * 1024 * 1024


def _extension(filename: str | None) -> str:
    ext = Path(filename or "").suffix.lower()
    if ext == ".jpeg":
        return ".jpg"
    return ext


def validate_image(file: UploadFile) -> str:
    ext = _extension(file.filename)
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=422, detail="jpg, png, webp, gif 이미지만 업로드할 수 있습니다.")
    return ext


def save_project_image(slug: str, sort_order: int, file: UploadFile, ext: str) -> str:
    folder = UPLOAD_DIR / "portfolio" / slug
    folder.mkdir(parents=True, exist_ok=True)

    filename = f"{sort_order:03d}{ext}"
    destination = folder / filename
    suffix = 1
    while destination.exists():
        filename = f"{sort_order:03d}-{suffix}{ext}"
        destination = folder / filename
        suffix += 1

    size = 0
    try:
        with destination.open("wb") as buffer:
            while chunk := file.file.read(1024 * 64):
                size += len(chunk)
                if size > MAX_UPLOAD_BYTES:
                    raise HTTPException(status_code=422, detail="이미지 파일은 10MB 이하만 업로드할 수 있습니다.")
                buffer.write(chunk)
    except HTTPException:
        destination.unlink(missing_ok=True)
        raise

    if size == 0:
        destination.unlink(missing_ok=True)
        raise HTTPException(status_code=422, detail="빈 파일은 업로드할 수 없습니다.")

    return f"/uploads/portfolio/{slug}/{filename}"


def _safe_upload_path(image_url: str) -> Path | None:
    if not image_url.startswith("/uploads/"):
        return None
    relative = image_url[len("/uploads/") :]
    path = (UPLOAD_DIR / relative).resolve()
    try:
        path.relative_to(UPLOAD_DIR.resolve())
    except ValueError:
        return None
    return path


def delete_managed_file(image_url: str) -> None:
    path = _safe_upload_path(image_url)
    if path is not None:
        path.unlink(missing_ok=True)


def delete_project_uploads(slug: str) -> None:
    folder = (UPLOAD_DIR / "portfolio" / slug).resolve()
    try:
        folder.relative_to((UPLOAD_DIR / "portfolio").resolve())
    except ValueError:
        return
    if folder.is_dir():
        shutil.rmtree(folder, ignore_errors=True)
