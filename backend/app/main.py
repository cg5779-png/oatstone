from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import CORS_ORIGINS, UPLOAD_DIR
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
