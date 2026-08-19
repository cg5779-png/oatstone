"""API 라우터 — backend.md §6 공개 엔드포인트 4개."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models.inquiry import Inquiry
from app.models.project import Project
from app.schemas.inquiry import InquiryCreate, InquiryResponse
from app.schemas.project import ProjectDetailResponse, ProjectResponse
from app.services.email import EmailDeliveryError, EmailNotConfiguredError, send_inquiry_email

router = APIRouter(prefix="/api")

INQUIRY_SUCCESS_MESSAGE = "문의가 성공적으로 접수되었습니다. 빠른 시일 내에 연락드리겠습니다."


class HealthResponse(BaseModel):
    status: str
    service: str


@router.get("/health", response_model=HealthResponse, tags=["health"])
def health_check():
    return HealthResponse(status="ok", service="OATSTONE API")


@router.get("/projects", response_model=list[ProjectResponse], tags=["projects"])
def list_projects(db: Session = Depends(get_db)):
    """Portfolio 그리드. 필터·페이지네이션 없음."""
    return (
        db.query(Project)
        .order_by(Project.sort_order.asc(), Project.id.asc())
        .all()
    )


@router.get("/projects/{project_id}", response_model=ProjectDetailResponse, tags=["projects"])
def get_project(project_id: int, db: Session = Depends(get_db)):
    """Portfolio 모달. images는 sort_order 순."""
    project = (
        db.query(Project)
        .options(selectinload(Project.images))
        .filter(Project.id == project_id)
        .first()
    )
    if project is None:
        raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다.")
    return project


@router.post("/inquiries", response_model=InquiryResponse, status_code=201, tags=["inquiries"])
def create_inquiry(payload: InquiryCreate, db: Session = Depends(get_db)):
    try:
        send_inquiry_email(payload)
    except EmailNotConfiguredError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except EmailDeliveryError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    inquiry = Inquiry(
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        project_type=payload.project_type,
        message=payload.message,
    )
    db.add(inquiry)
    db.commit()
    db.refresh(inquiry)

    return InquiryResponse(
        id=inquiry.id,
        message=INQUIRY_SUCCESS_MESSAGE,
        created_at=inquiry.created_at,
    )
