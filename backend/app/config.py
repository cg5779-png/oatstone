import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./oatstone.db")
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
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", str(BACKEND_ROOT / "uploads")))
