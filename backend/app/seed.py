"""SQLite 데이터베이스 초기화 및 포트폴리오 시드."""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

from sqlalchemy.orm import Session

from app.database import SessionLocal, init_db, verify_db_schema
from app.models.project import Project, ProjectImage

REPO_ROOT = Path(__file__).resolve().parents[2]
MANIFEST_PATH = REPO_ROOT / "frontend" / "src" / "data" / "portfolio-manifest.json"

# frontend/src/data/portfolioData.ts 와 동일
PROJECT_META: dict[str, dict] = {
    "공공시설": {
        "description": "공공기관 및 공공공간을 위한 도면 작성과 3D 디자인 프로젝트입니다.",
        "category": "integrated",
        "tags": ["공공시설", "평면도", "3D"],
    },
    "의료시설": {
        "description": "병원 및 의료시설 공간 설계, 평면도·천정면도·3D 시각화를 제공했습니다.",
        "category": "integrated",
        "tags": ["의료시설", "천정면도", "3D"],
    },
    "업무시설": {
        "description": "오피스 및 업무공간 환경개선을 위한 통합 설계 프로젝트입니다.",
        "category": "integrated",
        "tags": ["업무시설", "오피스", "3D"],
    },
    "교육시설": {
        "description": "대학 및 교육시설 공간 설계, 도면과 3D 렌더링을 제작했습니다.",
        "category": "integrated",
        "tags": ["교육시설", "평면도", "투시도"],
    },
    "상업시설": {
        "description": "상업공간 및 F&B 시설의 공간 기획과 3D 디자인 프로젝트입니다.",
        "category": "integrated",
        "tags": ["상업시설", "F&B", "3D"],
    },
    "전시기획시설": {
        "description": "전시·행사 공간 기획 및 부스·설치물 3D 디자인 프로젝트입니다.",
        "category": "integrated",
        "tags": ["전시", "기획", "3D"],
    },
    "익스테리어": {
        "description": "건물 외관 및 익스테리어 디자인, 조감도·투시도를 제작했습니다.",
        "category": "3d",
        "tags": ["익스테리어", "외관", "조감도"],
    },
}


def _load_manifest() -> list[dict]:
    if not MANIFEST_PATH.exists():
        raise FileNotFoundError(f"포트폴리오 매니페스트가 없습니다: {MANIFEST_PATH}")
    return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))


def seed_projects(db: Session) -> tuple[int, int]:
    """프론트 포트폴리오 7건을 시드. 이미 데이터가 있으면 건너뛴다."""
    existing = db.query(Project).count()
    if existing:
        return existing, db.query(ProjectImage).count()

    for item in _load_manifest():
        title = item["title"]
        meta = PROJECT_META.get(title, {})
        images: list[str] = item.get("images") or []
        created_at = datetime(2026, min(int(item["id"]), 12), 15, 10, 0, 0)

        project = Project(
            id=item["id"],
            slug=item["slug"],
            title=title,
            description=meta.get("description", f"{title} 프로젝트"),
            category=meta.get("category", "integrated"),
            thumbnail_url=images[0] if images else None,
            tags=meta.get("tags", [title]),
            is_featured=int(item["id"]) <= 4,
            sort_order=int(item["id"]),
            created_at=created_at,
            updated_at=created_at,
        )
        db.add(project)
        db.flush()

        for index, url in enumerate(images, start=1):
            db.add(
                ProjectImage(
                    project_id=project.id,
                    image_url=url,
                    caption=f"{title} {index:02d}",
                    sort_order=index,
                    created_at=created_at,
                )
            )

    db.commit()
    return db.query(Project).count(), db.query(ProjectImage).count()


def main() -> None:
    db_path = init_db()
    db = SessionLocal()
    try:
        project_count, image_count = seed_projects(db)
        info = verify_db_schema()
    finally:
        db.close()

    print("[OK] OATSTONE SQLite database ready")
    print(f"   path     : {info['database_path'] or db_path}")
    print(f"   tables   : {', '.join(sorted(info['tables']))}")
    print(f"   projects : {project_count} rows, {image_count} images")
    for table, indexes in info["table_indexes"].items():
        print(f"   indexes  : {table} → {', '.join(indexes)}")
    if info["journal_mode"]:
        print(f"   journal  : {info['journal_mode']}")
    if info["triggers"]:
        print(f"   triggers : {', '.join(info['triggers'])}")


if __name__ == "__main__":
    main()
