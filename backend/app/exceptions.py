import re

from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

FIELD_LABELS = {
    "name": "이름",
    "email": "이메일",
    "phone": "연락처",
    "project_type": "프로젝트 유형",
    "message": "메시지",
    "project_id": "프로젝트 번호",
    "username": "아이디",
    "password": "비밀번호",
    "title": "제목",
    "description": "설명",
    "category": "카테고리",
    "slug": "슬러그",
    "tags": "태그",
    "files": "이미지",
    "image_id": "이미지 번호",
    "sort_order": "정렬 순서",
}

AT_LEAST_PATTERN = re.compile(r"String should have at least (\d+) characters?")
AT_MOST_PATTERN = re.compile(r"String should have at most (\d+) characters?")
EXACT_LENGTH_PATTERN = re.compile(r"String should have (\d+) characters?")


def _has_batchim(word: str) -> bool:
    if not word:
        return False
    code = ord(word[-1])
    if 0xAC00 <= code <= 0xD7A3:
        return (code - 0xAC00) % 28 != 0
    return False


def _object_particle(word: str) -> str:
    return "을" if _has_batchim(word) else "를"


def _topic_particle(word: str) -> str:
    return "은" if _has_batchim(word) else "는"


def _subject_particle(word: str) -> str:
    return "이" if _has_batchim(word) else "가"


def translate_validation_error(error: dict) -> str:
    field = error.get("loc", ["", ""])[-1]
    field_label = FIELD_LABELS.get(str(field), str(field))
    message = str(error.get("msg", ""))

    if message.startswith("Value error, "):
        return message.removeprefix("Value error, ")

    at_least = AT_LEAST_PATTERN.search(message)
    if at_least:
        return f"{field_label}{_topic_particle(field_label)} {at_least.group(1)}자 이상 입력해 주세요."

    at_most = AT_MOST_PATTERN.search(message)
    if at_most:
        return f"{field_label}{_topic_particle(field_label)} {at_most.group(1)}자 이하로 입력해 주세요."

    exact = EXACT_LENGTH_PATTERN.search(message)
    if exact:
        return f"{field_label}{_topic_particle(field_label)} {exact.group(1)}자로 입력해 주세요."

    translations = {
        "Field required": f"{field_label}{_object_particle(field_label)} 입력해 주세요.",
        "Input should be a valid string": f"{field_label} 형식이 올바르지 않습니다.",
        "value is not a valid email address": "올바른 이메일 주소를 입력해 주세요.",
        "Input should be 'drawing', '3d', 'integrated' or 'other'": "프로젝트 유형을 선택해 주세요.",
        "Input should be 'drawing', '3d' or 'integrated'": "카테고리를 선택해 주세요.",
        "Input should be a valid integer": f"{field_label}{_subject_particle(field_label)} 올바르지 않습니다.",
    }

    for english, korean in translations.items():
        if english in message:
            return korean

    if message and message[0].isascii() and "should" in message:
        return f"{field_label}{_object_particle(field_label)} 확인해 주세요."

    return message or f"{field_label}{_object_particle(field_label)} 확인해 주세요."


async def validation_exception_handler(_request, exc: RequestValidationError):
    messages = [translate_validation_error(error) for error in exc.errors()]
    unique_messages = list(dict.fromkeys(messages))
    return JSONResponse(
        status_code=422,
        content={"detail": unique_messages[0] if len(unique_messages) == 1 else " · ".join(unique_messages)},
    )
