from pathlib import Path
import os

from sqlalchemy import create_engine, event, inspect, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import DATABASE_URL, IS_POSTGRES, IS_SQLITE, mask_database_url

_engine_kwargs: dict = {}
if IS_SQLITE:
    _engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    _engine_kwargs["pool_pre_ping"] = True
    _engine_kwargs["pool_size"] = int(os.getenv("DB_POOL_SIZE", "5"))
    _engine_kwargs["max_overflow"] = int(os.getenv("DB_MAX_OVERFLOW", "10"))

engine = create_engine(DATABASE_URL, **_engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

TABLES = ("inquiries", "projects", "project_images")

REQUIRED_COLUMNS = {
    "inquiries": {
        "id",
        "name",
        "email",
        "phone",
        "project_type",
        "message",
        "status",
        "created_at",
        "updated_at",
    },
    "projects": {
        "id",
        "slug",
        "title",
        "description",
        "category",
        "thumbnail_url",
        "tags",
        "is_featured",
        "sort_order",
        "created_at",
        "updated_at",
    },
    "project_images": {
        "id",
        "project_id",
        "image_url",
        "caption",
        "sort_order",
        "created_at",
    },
}

REQUIRED_INDEXES = {
    "inquiries": {"idx_inquiries_created_at", "idx_inquiries_status"},
    "projects": {"idx_projects_category", "idx_projects_featured", "idx_projects_slug"},
    "project_images": {"idx_project_images_project_id"},
}


class Base(DeclarativeBase):
    pass


def _sqlite_file_path(url: str) -> Path | None:
    if not url.startswith("sqlite"):
        return None

    # sqlite:////absolute/path.db  or  sqlite:///./relative.db
    raw = url.removeprefix("sqlite:///")
    if raw.startswith("/"):
        return Path(raw)

    backend_root = Path(__file__).resolve().parent.parent
    return (backend_root / raw).resolve()


def _ensure_sqlite_directory(url: str) -> None:
    db_path = _sqlite_file_path(url)
    if db_path is None:
        return

    db_path.parent.mkdir(parents=True, exist_ok=True)


@event.listens_for(engine, "connect")
def _configure_sqlite_connection(dbapi_connection, _connection_record) -> None:
    if not IS_SQLITE:
        return

    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


def alembic_sqlalchemy_url() -> str:
    if IS_SQLITE:
        db_path = _sqlite_file_path(DATABASE_URL)
        if db_path is not None:
            return f"sqlite:///{db_path.as_posix()}"
    return DATABASE_URL


def alembic_config(cfg=None):
    from alembic.config import Config

    backend_root = Path(__file__).resolve().parent.parent
    if cfg is None:
        cfg = Config(str(backend_root / "alembic.ini"))
    cfg.set_main_option("script_location", str(backend_root / "migrations"))
    cfg.set_main_option("sqlalchemy.url", alembic_sqlalchemy_url().replace("%", "%%"))
    return cfg


def run_migrations() -> None:
    """Alembic upgrade head — 스키마 단일 적용 경로."""
    from alembic import command

    command.upgrade(alembic_config(), "head")


def init_db() -> Path | None:
    """Alembic 마이그레이션으로 스키마를 맞춘다 (로컬 SQLite / 서버 PostgreSQL)."""
    _ensure_sqlite_directory(DATABASE_URL)

    import app.models  # noqa: F401

    run_migrations()

    return _sqlite_file_path(DATABASE_URL)


def verify_db_schema() -> dict:
    """생성된 스키마 검증 (CLI/seed용)."""
    import app.models  # noqa: F401

    inspector = inspect(engine)
    tables = inspector.get_table_names()
    missing_tables = [name for name in TABLES if name not in tables]
    if missing_tables:
        raise RuntimeError(f"누락된 테이블: {', '.join(missing_tables)}")

    table_columns: dict[str, list[str]] = {}
    table_indexes: dict[str, list[str]] = {}

    for table in TABLES:
        columns = {col["name"] for col in inspector.get_columns(table)}
        missing_cols = REQUIRED_COLUMNS[table] - columns
        if missing_cols:
            raise RuntimeError(f"{table} 테이블에 누락된 컬럼: {', '.join(sorted(missing_cols))}")
        table_columns[table] = sorted(columns)

        indexes = {idx["name"] for idx in inspector.get_indexes(table) if idx["name"]}
        missing_idx = REQUIRED_INDEXES[table] - indexes
        if missing_idx:
            raise RuntimeError(f"{table} 테이블에 누락된 인덱스: {', '.join(sorted(missing_idx))}")
        table_indexes[table] = sorted(indexes)

    journal_mode = None
    triggers: list[str] = []
    expected_triggers = {"trg_inquiries_updated_at", "trg_projects_updated_at"}

    with engine.connect() as conn:
        if IS_SQLITE:
            journal_mode = conn.execute(text("PRAGMA journal_mode")).scalar()
            trigger_rows = conn.execute(
                text(
                    "SELECT name FROM sqlite_master "
                    "WHERE type='trigger' AND tbl_name IN ('inquiries', 'projects') "
                    "ORDER BY name"
                )
            ).fetchall()
            triggers = [row[0] for row in trigger_rows]
        elif IS_POSTGRES:
            trigger_rows = conn.execute(
                text(
                    "SELECT trigger_name FROM information_schema.triggers "
                    "WHERE event_object_table IN ('inquiries', 'projects') "
                    "ORDER BY trigger_name"
                )
            ).fetchall()
            triggers = [row[0] for row in trigger_rows]

    if IS_SQLITE or IS_POSTGRES:
        missing_triggers = expected_triggers - set(triggers)
        if missing_triggers:
            raise RuntimeError(f"누락된 트리거: {', '.join(sorted(missing_triggers))}")

    fks = inspector.get_foreign_keys("project_images")
    if not any(fk.get("referred_table") == "projects" for fk in fks):
        raise RuntimeError("project_images.project_id → projects.id FK가 없습니다.")

    return {
        "database_url": mask_database_url(DATABASE_URL),
        "dialect": "sqlite" if IS_SQLITE else "postgresql" if IS_POSTGRES else "other",
        "database_path": str(_sqlite_file_path(DATABASE_URL) or ""),
        "tables": tables,
        "table_columns": table_columns,
        "table_indexes": table_indexes,
        "journal_mode": journal_mode,
        "triggers": triggers,
    }


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
