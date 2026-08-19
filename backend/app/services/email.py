from email.mime.text import MIMEText
from email.utils import formatdate
import smtplib

from app.config import (
    INQUIRY_RECIPIENT,
    SMTP_FROM,
    SMTP_HOST,
    SMTP_PASSWORD,
    SMTP_PORT,
    SMTP_USER,
    SMTP_USE_SSL,
)
from app.schemas.inquiry import PROJECT_TYPE_LABELS, InquiryCreate


class EmailNotConfiguredError(Exception):
    pass


class EmailDeliveryError(Exception):
    pass


def _build_message(payload: InquiryCreate) -> MIMEText:
    project_label = PROJECT_TYPE_LABELS.get(payload.project_type, payload.project_type)
    body = f"""OATSTONE 웹사이트에서 새 문의가 접수되었습니다.

이름: {payload.name}
이메일: {payload.email}
연락처: {payload.phone}
프로젝트 유형: {project_label}

메시지:
{payload.message}
"""
    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = f"[OATSTONE 문의] {payload.name} · {project_label}"
    msg["From"] = SMTP_FROM
    msg["To"] = INQUIRY_RECIPIENT
    msg["Reply-To"] = payload.email
    msg["Date"] = formatdate(localtime=True)
    return msg


def send_inquiry_email(payload: InquiryCreate) -> None:
    if not SMTP_USER or not SMTP_PASSWORD:
        raise EmailNotConfiguredError(
            "SMTP 설정이 필요합니다. backend/.env 파일에 SMTP_USER, SMTP_PASSWORD를 입력해 주세요."
        )

    message = _build_message(payload)

    try:
        if SMTP_USE_SSL:
            with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=15) as server:
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.send_message(message, from_addr=SMTP_FROM, to_addrs=[INQUIRY_RECIPIENT])
        else:
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
                server.starttls()
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.send_message(message, from_addr=SMTP_FROM, to_addrs=[INQUIRY_RECIPIENT])
    except (smtplib.SMTPException, OSError, TimeoutError) as exc:
        raise EmailDeliveryError("이메일 전송에 실패했습니다. 잠시 후 다시 시도해 주세요.") from exc
