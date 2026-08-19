from datetime import datetime
import re
from typing import Literal

from pydantic import BaseModel, ConfigDict, field_serializer, field_validator

EMAIL_PATTERN = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")

PROJECT_TYPE_LABELS = {
    "drawing": "도면 작성",
    "3d": "3D 디자인",
    "integrated": "통합 패키지",
    "other": "기타",
}


class InquiryCreate(BaseModel):
    name: str
    email: str
    phone: str
    project_type: Literal["drawing", "3d", "integrated", "other"]
    message: str

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("이름을 입력해 주세요.")
        if len(value) > 100:
            raise ValueError("이름은 100자 이하로 입력해 주세요.")
        return value

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("이메일을 입력해 주세요.")
        if not EMAIL_PATTERN.match(value):
            raise ValueError("올바른 이메일 주소를 입력해 주세요.")
        return value

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("연락처를 입력해 주세요.")
        if len(value) < 10:
            raise ValueError("연락처는 10자 이상 입력해 주세요.")
        if len(value) > 20:
            raise ValueError("연락처는 20자 이하로 입력해 주세요.")
        return value

    @field_validator("message")
    @classmethod
    def validate_message(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("메시지를 입력해 주세요.")
        if len(value) < 10:
            raise ValueError("메시지는 10자 이상 입력해 주세요.")
        if len(value) > 2000:
            raise ValueError("메시지는 2000자 이하로 입력해 주세요.")
        return value


class InquiryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    message: str
    created_at: datetime

    @field_serializer("created_at")
    def serialize_created_at(self, value: datetime) -> str:
        return value.replace(microsecond=0).isoformat(timespec="seconds")
