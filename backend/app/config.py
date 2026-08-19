import os
from pathlib import Path
from urllib.parse import quote_plus

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

APP_ENV = os.getenv("APP_ENV", os.getenv("ENV", "local")).strip().lower()
SERVER_ENVS = {"production", "prod", "server", "staging"}


def _normalize_database_url(url: str) -> str:
    url = url.strip()
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://") :]
    if url.startswith("postgresql+psycopg2://"):
        url = "postgresql+psycopg://" + url[len("postgresql+psycopg2://") :]
    elif url.startswith("postgresql://"):
        url = "postgresql+psycopg://" + url[len("postgresql://") :]
    return url


def _postgres_url_from_parts() -> str:
    user = quote_plus(os.getenv("POSTGRES_USER", "oatstone"))
    password = quote_plus(os.getenv("POSTGRES_PASSWORD", ""))
    host = os.getenv("POSTGRES_HOST", "127.0.0.1")
    port = os.getenv("POSTGRES_PORT", "5432")
    name = os.getenv("POSTGRES_DB", "oatstone")
    sslmode = os.getenv("POSTGRES_SSLMODE", "").strip()
    url = f"postgresql+psycopg://{user}:{password}@{host}:{port}/{name}"
    if sslmode:
        url += f"?sslmode={sslmode}"
    return url


def resolve_database_url() -> str:
    """로컬은 SQLite, 서버(APP_ENV=production|server)는 PostgreSQL. DATABASE_URL이 있으면 그대로 사용."""
    explicit = os.getenv("DATABASE_URL", "").strip()
    if explicit:
        return _normalize_database_url(explicit)
    if APP_ENV in SERVER_ENVS:
        return _postgres_url_from_parts()
    return "sqlite:///./oatstone.db"


DATABASE_URL = resolve_database_url()
IS_SQLITE = DATABASE_URL.startswith("sqlite")
IS_POSTGRES = DATABASE_URL.startswith("postgresql")


def mask_database_url(url: str) -> str:
    if "@" not in url or "://" not in url:
        return url
    scheme, rest = url.split("://", 1)
    creds, _, hostpart = rest.partition("@")
    if ":" not in creds:
        return url
    user = creds.split(":", 1)[0]
    return f"{scheme}://{user}:***@{hostpart}"


CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
    if origin.strip()
]
DEBUG = os.getenv("DEBUG", "true").lower() == "true"

INQUIRY_RECIPIENT = os.getenv("INQUIRY_RECIPIENT", "oootn@naver.com")
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.naver.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "465"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER or INQUIRY_RECIPIENT)
SMTP_USE_SSL = os.getenv("SMTP_USE_SSL", "true").lower() == "true"

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "oat4243")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "")
JWT_SECRET = os.getenv("JWT_SECRET", "")
JWT_EXPIRE_HOURS = int(os.getenv("JWT_EXPIRE_HOURS", "12"))

BACKEND_ROOT = Path(__file__).resolve().parent.parent
REPO_ROOT = BACKEND_ROOT.parent
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", str(BACKEND_ROOT / "uploads")))
FRONTEND_DIST = Path(os.getenv("FRONTEND_DIST", str(REPO_ROOT / "frontend" / "dist")))
