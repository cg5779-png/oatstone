from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_serializer, field_validator

from app.schemas.project import ProjectImageResponse

CATEGORY = Literal["drawing", "3d", "integrated"]


class AdminLoginRequest(BaseModel):
    username: str
    password: str

    @field_validator("username", "password")
    @classmethod
    def required(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("아이디와 비밀번호를 입력해 주세요.")
        return value


class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AdminMeResponse(BaseModel):
    username: str


class AdminProjectImageResponse(ProjectImageResponse):
    sort_order: int


class AdminProjectListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    title: str
    description: str
    category: str
    thumbnail_url: str | None
    tags: list[str]
    is_featured: bool
    sort_order: int
    image_count: int
    created_at: datetime
    updated_at: datetime

    @field_validator("tags", mode="before")
    @classmethod
    def coerce_tags(cls, value: object) -> list[str]:
        if isinstance(value, list):
            return [str(item) for item in value]
        return []

    @field_serializer("created_at", "updated_at")
    def serialize_dt(self, value: datetime) -> str:
        return value.replace(microsecond=0).isoformat(timespec="seconds")


class AdminProjectDetailResponse(AdminProjectListItem):
    images: list[AdminProjectImageResponse] = []


class AdminProjectCreate(BaseModel):
    title: str
    description: str
    category: CATEGORY
    tags: list[str] = Field(default_factory=list)
    is_featured: bool = False
    sort_order: int | None = None
    slug: str | None = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("프로젝트 제목을 입력해 주세요.")
        if len(value) > 200:
            raise ValueError("프로젝트 제목은 200자 이하로 입력해 주세요.")
        return value

    @field_validator("description")
    @classmethod
    def validate_description(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("프로젝트 설명을 입력해 주세요.")
        if len(value) > 5000:
            raise ValueError("프로젝트 설명은 5000자 이하로 입력해 주세요.")
        return value

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip().lower()
        if not value:
            return None
        if len(value) > 100:
            raise ValueError("슬러그는 100자 이하로 입력해 주세요.")
        return value

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, value: list[str]) -> list[str]:
        tags = [item.strip() for item in value if item and item.strip()]
        if len(tags) > 20:
            raise ValueError("태그는 20개 이하로 입력해 주세요.")
        for tag in tags:
            if len(tag) > 50:
                raise ValueError("태그는 50자 이하로 입력해 주세요.")
        return tags


class AdminProjectUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    category: CATEGORY | None = None
    tags: list[str] | None = None
    is_featured: bool | None = None
    sort_order: int | None = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        if not value:
            raise ValueError("프로젝트 제목을 입력해 주세요.")
        if len(value) > 200:
            raise ValueError("프로젝트 제목은 200자 이하로 입력해 주세요.")
        return value

    @field_validator("description")
    @classmethod
    def validate_description(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        if not value:
            raise ValueError("프로젝트 설명을 입력해 주세요.")
        if len(value) > 5000:
            raise ValueError("프로젝트 설명은 5000자 이하로 입력해 주세요.")
        return value

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, value: list[str] | None) -> list[str] | None:
        if value is None:
            return None
        tags = [item.strip() for item in value if item and item.strip()]
        if len(tags) > 20:
            raise ValueError("태그는 20개 이하로 입력해 주세요.")
        for tag in tags:
            if len(tag) > 50:
                raise ValueError("태그는 50자 이하로 입력해 주세요.")
        return tags


class AdminThumbnailRequest(BaseModel):
    image_id: int
