from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import relationship
from sqlalchemy.types import JSON

from app.database import Base

PROJECT_CATEGORIES = ("drawing", "3d", "integrated")


class Project(Base):
    """Portfolio.tsx / api.ts `Project` 타입에 대응하는 테이블."""

    __tablename__ = "projects"
    __table_args__ = (
        CheckConstraint(
            "category IN ('drawing', '3d', 'integrated')",
            name="ck_projects_category",
        ),
        Index("idx_projects_category", "category"),
        Index("idx_projects_featured", "is_featured", "sort_order"),
        Index("idx_projects_slug", "slug", unique=True),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    slug = Column(String(100), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False)
    thumbnail_url = Column(String(500), nullable=True)
    tags = Column(JSON, nullable=False, default=list)
    is_featured = Column(Boolean, nullable=False, server_default="0", default=False)
    sort_order = Column(Integer, nullable=False, server_default="0", default=0)
    created_at = Column(DateTime, nullable=False, server_default=func.now(), default=func.now())
    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        default=func.now(),
        onupdate=func.now(),
    )

    images = relationship(
        "ProjectImage",
        back_populates="project",
        cascade="all, delete-orphan",
        order_by="ProjectImage.sort_order",
    )


class ProjectImage(Base):
    """ProjectDetail.images 항목에 대응하는 테이블."""

    __tablename__ = "project_images"
    __table_args__ = (Index("idx_project_images_project_id", "project_id"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(
        Integer,
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )
    image_url = Column(String(500), nullable=False)
    caption = Column(String(200), nullable=True)
    sort_order = Column(Integer, nullable=False, server_default="0", default=0)
    created_at = Column(DateTime, nullable=False, server_default=func.now(), default=func.now())

    project = relationship("Project", back_populates="images")
