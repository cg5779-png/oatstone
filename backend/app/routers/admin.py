"""관리자 API — 로그인 및 포트폴리오 CRUD. 새 이미지는 기존 sort_order 최댓값 뒤에 삽입."""

from __future__ import annotations

import re
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload
from starlette.responses import Response

from app.database import get_db
from app.models.project import Project, ProjectImage
from app.schemas.admin import (
    AdminLoginRequest,
    AdminLoginResponse,
    AdminMeResponse,
    AdminProjectCreate,
    AdminProjectDetailResponse,
    AdminProjectImageResponse,
    AdminProjectListItem,
    AdminProjectUpdate,
    AdminThumbnailRequest,
)
from app.services.auth import create_access_token, get_current_admin, verify_credentials
from app.services.storage import (
    delete_managed_file,
    delete_project_uploads,
    save_project_image,
    validate_image,
)

router = APIRouter(prefix="/api/admin", tags=["admin"])

SLUG_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def _slugify_title(title: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    if not slug:
        slug = f"project-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
    return slug[:80]


def _normalize_slug(value: str) -> str:
    slug = value.strip().lower()
    if not SLUG_PATTERN.match(slug):
        raise HTTPException(
            status_code=422,
            detail="슬러그는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다.",
        )
    return slug[:100]


def _allocate_slug(db: Session, desired: str) -> str:
    slug = desired
    n = 2
    while db.query(Project).filter(Project.slug == slug).first() is not None:
        suffix = f"-{n}"
        slug = f"{desired[: 100 - len(suffix)]}{suffix}"
        n += 1
        if n > 1000:
            raise HTTPException(status_code=409, detail="사용 가능한 슬러그를 만들지 못했습니다.")
    return slug


def _resolve_slug(db: Session, title: str, explicit: str | None) -> str:
    if explicit:
        slug = _normalize_slug(explicit)
        if db.query(Project).filter(Project.slug == slug).first() is not None:
            raise HTTPException(status_code=409, detail="이미 사용 중인 슬러그입니다.")
        return slug
    return _allocate_slug(db, _slugify_title(title))


def _next_project_sort_order(db: Session) -> int:
    current = db.query(func.max(Project.sort_order)).scalar()
    return int(current or 0) + 1


def _next_image_sort_order(db: Session, project_id: int) -> int:
    """기존 이미지 뒤(최댓값 + 1)부터 순차 삽입. 빈 번호는 채우지 않는다."""
    current = (
        db.query(func.max(ProjectImage.sort_order))
        .filter(ProjectImage.project_id == project_id)
        .scalar()
    )
    return int(current or 0) + 1


def _get_project_or_404(db: Session, project_id: int) -> Project:
    project = (
        db.query(Project)
        .options(selectinload(Project.images))
        .filter(Project.id == project_id)
        .first()
    )
    if project is None:
        raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다.")
    return project


def _sync_thumbnail(project: Project) -> None:
    urls = {image.image_url for image in project.images}
    if project.thumbnail_url in urls:
        return
    ordered = sorted(project.images, key=lambda image: (image.sort_order, image.id))
    project.thumbnail_url = ordered[0].image_url if ordered else None


def _to_list_item(project: Project) -> AdminProjectListItem:
    return AdminProjectListItem(
        id=project.id,
        slug=project.slug,
        title=project.title,
        description=project.description,
        category=project.category,
        thumbnail_url=project.thumbnail_url,
        tags=list(project.tags or []),
        is_featured=bool(project.is_featured),
        sort_order=project.sort_order,
        image_count=len(project.images),
        created_at=project.created_at,
        updated_at=project.updated_at,
    )


def _to_detail(project: Project) -> AdminProjectDetailResponse:
    item = _to_list_item(project)
    images = sorted(project.images, key=lambda image: (image.sort_order, image.id))
    return AdminProjectDetailResponse(
        **item.model_dump(),
        images=[AdminProjectImageResponse.model_validate(image) for image in images],
    )


@router.post("/login", response_model=AdminLoginResponse)
def login(payload: AdminLoginRequest):
    if not verify_credentials(payload.username, payload.password):
        raise HTTPException(status_code=401, detail="아이디 또는 비밀번호가 올바르지 않습니다.")
    return AdminLoginResponse(access_token=create_access_token(payload.username))


@router.get("/me", response_model=AdminMeResponse)
def me(username: str = Depends(get_current_admin)):
    return AdminMeResponse(username=username)


@router.get("/projects", response_model=list[AdminProjectListItem])
def list_admin_projects(
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    projects = (
        db.query(Project)
        .options(selectinload(Project.images))
        .order_by(Project.sort_order.asc(), Project.id.asc())
        .all()
    )
    return [_to_list_item(project) for project in projects]


@router.get("/projects/{project_id}", response_model=AdminProjectDetailResponse)
def get_admin_project(
    project_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    return _to_detail(_get_project_or_404(db, project_id))


@router.post("/projects", response_model=AdminProjectDetailResponse, status_code=201)
def create_admin_project(
    payload: AdminProjectCreate,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    project = Project(
        slug=_resolve_slug(db, payload.title, payload.slug),
        title=payload.title,
        description=payload.description,
        category=payload.category,
        thumbnail_url=None,
        tags=payload.tags,
        is_featured=payload.is_featured,
        sort_order=payload.sort_order if payload.sort_order is not None else _next_project_sort_order(db),
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return _to_detail(_get_project_or_404(db, project.id))


@router.put("/projects/{project_id}", response_model=AdminProjectDetailResponse)
def update_admin_project(
    project_id: int,
    payload: AdminProjectUpdate,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    project = _get_project_or_404(db, project_id)
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(project, key, value)
    db.commit()
    return _to_detail(_get_project_or_404(db, project_id))


@router.delete("/projects/{project_id}", status_code=204)
def delete_admin_project(
    project_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    project = _get_project_or_404(db, project_id)
    slug = project.slug
    for image in project.images:
        delete_managed_file(image.image_url)
    db.delete(project)
    db.commit()
    delete_project_uploads(slug)
    return Response(status_code=204)


@router.post("/projects/{project_id}/images", response_model=AdminProjectDetailResponse)
def upload_project_images(
    project_id: int,
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    """선택한 파일을 기존 이미지 뒤쪽부터 sort_order를 1씩 증가시키며 삽입한다."""
    project = _get_project_or_404(db, project_id)
    incoming = [file for file in files if file.filename]
    if not incoming:
        raise HTTPException(status_code=422, detail="업로드할 이미지를 선택해 주세요.")

    next_order = _next_image_sort_order(db, project.id)
    first_url: str | None = None

    for file in incoming:
        ext = validate_image(file)
        image_url = save_project_image(project.slug, next_order, file, ext)
        db.add(
            ProjectImage(
                project_id=project.id,
                image_url=image_url,
                caption=f"{project.title} {next_order:02d}",
                sort_order=next_order,
            )
        )
        if first_url is None:
            first_url = image_url
        next_order += 1

    if not project.thumbnail_url and first_url:
        project.thumbnail_url = first_url

    db.commit()
    return _to_detail(_get_project_or_404(db, project.id))


@router.delete("/projects/{project_id}/images/{image_id}", response_model=AdminProjectDetailResponse)
def delete_project_image(
    project_id: int,
    image_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    project = _get_project_or_404(db, project_id)
    image = next((item for item in project.images if item.id == image_id), None)
    if image is None:
        raise HTTPException(status_code=404, detail="이미지를 찾을 수 없습니다.")

    delete_managed_file(image.image_url)
    db.delete(image)
    db.flush()
    db.refresh(project)
    _sync_thumbnail(project)
    db.commit()
    return _to_detail(_get_project_or_404(db, project.id))


@router.put("/projects/{project_id}/thumbnail", response_model=AdminProjectDetailResponse)
def set_project_thumbnail(
    project_id: int,
    payload: AdminThumbnailRequest,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    project = _get_project_or_404(db, project_id)
    image = next((item for item in project.images if item.id == payload.image_id), None)
    if image is None:
        raise HTTPException(status_code=404, detail="이미지를 찾을 수 없습니다.")
    project.thumbnail_url = image.image_url
    db.commit()
    return _to_detail(_get_project_or_404(db, project.id))
