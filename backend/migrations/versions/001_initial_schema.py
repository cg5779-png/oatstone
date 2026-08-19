"""initial oatstone schema

Revision ID: 001_initial_schema
Revises:
Create Date: 2026-08-19

inquiries, projects, project_images + indexes + updated_at triggers.
SQLite(로컬) / PostgreSQL(서버) 모두 적용. 기존 테이블은 건너뛴다.
"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

revision: str = "001_initial_schema"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

SQLITE_UPDATED_AT_TRIGGER = """
CREATE TRIGGER IF NOT EXISTS trg_{table}_updated_at
AFTER UPDATE ON {table}
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE {table}
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.id;
END;
"""

POSTGRES_UPDATED_AT_FN = """
CREATE OR REPLACE FUNCTION oatstone_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.updated_at IS NOT DISTINCT FROM OLD.updated_at THEN
        NEW.updated_at = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
"""

POSTGRES_UPDATED_AT_TRIGGER = """
DROP TRIGGER IF EXISTS trg_{table}_updated_at ON {table};
CREATE TRIGGER trg_{table}_updated_at
BEFORE UPDATE ON {table}
FOR EACH ROW
EXECUTE PROCEDURE oatstone_set_updated_at();
"""


def _dialect_name() -> str:
    return op.get_bind().dialect.name


def _is_sqlite() -> bool:
    return _dialect_name() == "sqlite"


def _table_names() -> set[str]:
    try:
        return set(inspect(op.get_bind()).get_table_names())
    except Exception:
        return set()


def _create_updated_at_triggers() -> None:
    if _is_sqlite():
        op.execute(sa.text(SQLITE_UPDATED_AT_TRIGGER.format(table="inquiries")))
        op.execute(sa.text(SQLITE_UPDATED_AT_TRIGGER.format(table="projects")))
        return

    op.execute(sa.text(POSTGRES_UPDATED_AT_FN))
    op.execute(sa.text(POSTGRES_UPDATED_AT_TRIGGER.format(table="inquiries")))
    op.execute(sa.text(POSTGRES_UPDATED_AT_TRIGGER.format(table="projects")))


def _drop_updated_at_triggers() -> None:
    if _is_sqlite():
        op.execute(sa.text("DROP TRIGGER IF EXISTS trg_projects_updated_at"))
        op.execute(sa.text("DROP TRIGGER IF EXISTS trg_inquiries_updated_at"))
        return

    op.execute(sa.text("DROP TRIGGER IF EXISTS trg_projects_updated_at ON projects"))
    op.execute(sa.text("DROP TRIGGER IF EXISTS trg_inquiries_updated_at ON inquiries"))
    op.execute(sa.text("DROP FUNCTION IF EXISTS oatstone_set_updated_at()"))


def upgrade() -> None:
    existing = _table_names()

    if "inquiries" not in existing:
        op.create_table(
            "inquiries",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("name", sa.String(length=100), nullable=False),
            sa.Column("email", sa.String(length=200), nullable=False),
            sa.Column("phone", sa.String(length=20), nullable=False),
            sa.Column("project_type", sa.String(length=50), nullable=False),
            sa.Column("message", sa.Text(), nullable=False),
            sa.Column("status", sa.String(length=20), server_default="pending", nullable=False),
            sa.Column(
                "created_at",
                sa.DateTime(),
                server_default=sa.text("CURRENT_TIMESTAMP"),
                nullable=False,
            ),
            sa.Column(
                "updated_at",
                sa.DateTime(),
                server_default=sa.text("CURRENT_TIMESTAMP"),
                nullable=False,
            ),
            sa.PrimaryKeyConstraint("id"),
            sa.CheckConstraint(
                "project_type IN ('drawing', '3d', 'integrated', 'other')",
                name="ck_inquiries_project_type",
            ),
            sa.CheckConstraint(
                "status IN ('pending', 'read', 'replied')",
                name="ck_inquiries_status",
            ),
        )

    if "projects" not in existing:
        op.create_table(
            "projects",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("slug", sa.String(length=100), nullable=False),
            sa.Column("title", sa.String(length=200), nullable=False),
            sa.Column("description", sa.Text(), nullable=False),
            sa.Column("category", sa.String(length=50), nullable=False),
            sa.Column("thumbnail_url", sa.String(length=500), nullable=True),
            sa.Column("tags", sa.JSON(), nullable=False),
            sa.Column("is_featured", sa.Boolean(), server_default=sa.false(), nullable=False),
            sa.Column("sort_order", sa.Integer(), server_default="0", nullable=False),
            sa.Column(
                "created_at",
                sa.DateTime(),
                server_default=sa.text("CURRENT_TIMESTAMP"),
                nullable=False,
            ),
            sa.Column(
                "updated_at",
                sa.DateTime(),
                server_default=sa.text("CURRENT_TIMESTAMP"),
                nullable=False,
            ),
            sa.PrimaryKeyConstraint("id"),
            sa.CheckConstraint(
                "category IN ('drawing', '3d', 'integrated')",
                name="ck_projects_category",
            ),
        )

    if "project_images" not in existing:
        op.create_table(
            "project_images",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("project_id", sa.Integer(), nullable=False),
            sa.Column("image_url", sa.String(length=500), nullable=False),
            sa.Column("caption", sa.String(length=200), nullable=True),
            sa.Column("sort_order", sa.Integer(), server_default="0", nullable=False),
            sa.Column(
                "created_at",
                sa.DateTime(),
                server_default=sa.text("CURRENT_TIMESTAMP"),
                nullable=False,
            ),
            sa.PrimaryKeyConstraint("id"),
            sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        )

    op.execute(sa.text("DROP INDEX IF EXISTS idx_inquiries_created_at"))
    op.execute(sa.text("CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries (created_at DESC)"))
    op.execute(sa.text("CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries (status)"))
    op.execute(sa.text("CREATE INDEX IF NOT EXISTS idx_projects_category ON projects (category)"))
    op.execute(
        sa.text("CREATE INDEX IF NOT EXISTS idx_projects_featured ON projects (is_featured, sort_order)")
    )
    op.execute(sa.text("CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_slug ON projects (slug)"))
    op.execute(
        sa.text("CREATE INDEX IF NOT EXISTS idx_project_images_project_id ON project_images (project_id)")
    )
    _create_updated_at_triggers()


def downgrade() -> None:
    _drop_updated_at_triggers()
    op.execute(sa.text("DROP INDEX IF EXISTS idx_project_images_project_id"))
    op.execute(sa.text("DROP INDEX IF EXISTS idx_projects_slug"))
    op.execute(sa.text("DROP INDEX IF EXISTS idx_projects_featured"))
    op.execute(sa.text("DROP INDEX IF EXISTS idx_projects_category"))
    op.execute(sa.text("DROP INDEX IF EXISTS idx_inquiries_status"))
    op.execute(sa.text("DROP INDEX IF EXISTS idx_inquiries_created_at"))
    op.drop_table("project_images")
    op.drop_table("projects")
    op.drop_table("inquiries")
