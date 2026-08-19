from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_serializer, field_validator


class ProjectImageResponse(BaseModel):
    """ProjectDetail.images — project_images.id / image_url / caption"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    image_url: str
    caption: str | None = None


class ProjectResponse(BaseModel):
    """Portfolio 그리드 — api.ts `Project`. slug·sort_order·updated_at 은 응답에 넣지 않음."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    category: str
    thumbnail_url: str | None
    tags: list[str]
    is_featured: bool
    created_at: datetime

    @field_validator("tags", mode="before")
    @classmethod
    def coerce_tags(cls, value: object) -> list[str]:
        if value is None:
            return []
        if isinstance(value, list):
            return [str(item) for item in value]
        return []

    @field_serializer("created_at")
    def serialize_created_at(self, value: datetime) -> str:
        return value.replace(microsecond=0).isoformat(timespec="seconds")


class ProjectDetailResponse(ProjectResponse):
    """Portfolio 모달 — api.ts `ProjectDetail`"""

    images: list[ProjectImageResponse] = []
