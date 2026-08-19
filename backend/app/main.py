from __future__ import annotations

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import CORS_ORIGINS, FRONTEND_DIST, UPLOAD_DIR
from app.database import SessionLocal, init_db
from app.exceptions import validation_exception_handler
from app.routers import admin, api
from app.seed import seed_projects


def bootstrap() -> None:
    init_db()
    db = SessionLocal()
    try:
        seed_projects(db)
    finally:
        db.close()


bootstrap()

app = FastAPI(
    title="OATSTONE API",
    description="OATSTONE 기업 웹사이트 백엔드 — health, projects, inquiries",
    version="1.0.0",
)

app.add_exception_handler(RequestValidationError, validation_exception_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api.router)
app.include_router(admin.router)

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


def _frontend_file(full_path: str) -> FileResponse | None:
    dist = FRONTEND_DIST.resolve()
    if not dist.is_dir():
        return None
    target = (dist / full_path).resolve()
    try:
        target.relative_to(dist)
    except ValueError:
        return None
    if target.is_file():
        return FileResponse(target)
    index = dist / "index.html"
    if index.is_file():
        return FileResponse(index)
    return None


@app.get("/{full_path:path}", include_in_schema=False)
def serve_frontend(full_path: str):
    response = _frontend_file(full_path)
    if response is None:
        raise StarletteHTTPException(status_code=404)
    return response
