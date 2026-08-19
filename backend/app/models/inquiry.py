from sqlalchemy import CheckConstraint, Column, DateTime, Index, Integer, String, Text, desc, func

from app.database import Base

PROJECT_TYPES = ("drawing", "3d", "integrated", "other")
INQUIRY_STATUSES = ("pending", "read", "replied")


class Inquiry(Base):
    __tablename__ = "inquiries"
    __table_args__ = (
        CheckConstraint(
            "project_type IN ('drawing', '3d', 'integrated', 'other')",
            name="ck_inquiries_project_type",
        ),
        CheckConstraint(
            "status IN ('pending', 'read', 'replied')",
            name="ck_inquiries_status",
        ),
        Index("idx_inquiries_created_at", desc("created_at")),
        Index("idx_inquiries_status", "status"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(200), nullable=False)
    phone = Column(String(20), nullable=False)
    project_type = Column(String(50), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String(20), nullable=False, server_default="pending", default="pending")
    created_at = Column(DateTime, nullable=False, server_default=func.now(), default=func.now())
    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        default=func.now(),
        onupdate=func.now(),
    )
