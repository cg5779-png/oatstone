# OATSTONE 데이터베이스 설계 명세서

> 프론트엔드 `Project` / `ProjectDetail` / `InquiryPayload` 기준.  
> 상세 컬럼·시드는 `docs/backend.md` §5 와 동일.

## 1. 개요

| 항목 | 내용 |
|------|------|
| DBMS | SQLite 3 |
| ORM | SQLAlchemy 2.0 |
| 파일 | `backend/oatstone.db` |
| 저널 | WAL (`PRAGMA journal_mode=WAL`) |
| FK | `PRAGMA foreign_keys=ON` |
| 마이그레이션 | Alembic (`001_initial_schema`) |

## 2. ER 다이어그램

```
┌─────────────────┐       ┌─────────────────┐
│    projects     │       │ project_images  │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │──1:N──│ id (PK)         │
│ slug (UNIQUE)   │       │ project_id (FK) │
│ title           │       │ image_url       │
│ description     │       │ caption         │
│ category        │       │ sort_order      │
│ thumbnail_url   │       │ created_at      │
│ tags (JSON)     │       └─────────────────┘
│ is_featured     │
│ sort_order      │
│ created_at      │
│ updated_at      │
└─────────────────┘

┌─────────────────┐
│   inquiries     │
├─────────────────┤
│ id (PK)         │
│ name            │
│ email           │
│ phone           │
│ project_type    │
│ message         │
│ status          │
│ created_at      │
│ updated_at      │
└─────────────────┘
```

Hero / About / Services / Process 는 프론트 정적 카피이므로 테이블 없음.

## 3. 테이블 상세

### 3.1 projects (포트폴리오 프로젝트)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INTEGER | PK, AUTOINCREMENT | `Project.id` |
| slug | VARCHAR(100) | NOT NULL, UNIQUE | 매니페스트 slug |
| title | VARCHAR(200) | NOT NULL | 프로젝트명 |
| description | TEXT | NOT NULL | 상세 설명 |
| category | VARCHAR(50) | NOT NULL | drawing / 3d / integrated |
| thumbnail_url | VARCHAR(500) | NULL | 썸네일 URL |
| tags | JSON | NOT NULL | `string[]` |
| is_featured | BOOLEAN | DEFAULT 0 | 추천 여부 |
| sort_order | INTEGER | DEFAULT 0 | 그리드 순서 |
| created_at | DATETIME | DEFAULT NOW | 생성일 |
| updated_at | DATETIME | DEFAULT NOW | 수정일 (트리거) |

**인덱스:**
- `idx_projects_category` ON (category)
- `idx_projects_featured` ON (is_featured, sort_order)
- `idx_projects_slug` UNIQUE ON (slug)

### 3.2 project_images (프로젝트 이미지)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INTEGER | PK, AUTOINCREMENT | `images[].id` |
| project_id | INTEGER | FK → projects.id ON DELETE CASCADE | 프로젝트 |
| image_url | VARCHAR(500) | NOT NULL | `/assets/portfolio/...` |
| caption | VARCHAR(200) | NULL | 캡션 |
| sort_order | INTEGER | DEFAULT 0 | 갤러리 순서 |
| created_at | DATETIME | DEFAULT NOW | 생성일 |

**인덱스:** `idx_project_images_project_id` ON (project_id)

### 3.3 inquiries (의뢰 문의)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INTEGER | PK, AUTOINCREMENT | 문의 ID |
| name | VARCHAR(100) | NOT NULL | 이름 1~100자 |
| email | VARCHAR(200) | NOT NULL | 이메일 |
| phone | VARCHAR(20) | NOT NULL | 연락처 10~20자 |
| project_type | VARCHAR(50) | NOT NULL | drawing / 3d / integrated / other |
| message | TEXT | NOT NULL | 10~2000자 |
| status | VARCHAR(20) | DEFAULT 'pending' | pending / read / replied |
| created_at | DATETIME | DEFAULT NOW | 접수일 |
| updated_at | DATETIME | DEFAULT NOW | 수정일 (트리거) |

**인덱스:**
- `idx_inquiries_status` ON (status)
- `idx_inquiries_created_at` ON (created_at DESC)

## 4. 데이터 무결성 규칙

1. `projects.category` — CHECK IN ('drawing', '3d', 'integrated')
2. `inquiries.project_type` — CHECK IN ('drawing', '3d', 'integrated', 'other')
3. `inquiries.status` — CHECK IN ('pending', 'read', 'replied')
4. `projects.tags` — JSON 배열. 프론트는 `string[]` 로 사용
5. `project_images.project_id` — ON DELETE CASCADE

문의 `project_type`의 `other`는 Contact 전용이다. 포트폴리오 `category`에는 쓰지 않는다.

## 5. 초기 시드 데이터

프론트 포트폴리오 7건 (이미지 150장). `python -m app.seed` 가 테이블이 비어 있을 때만 삽입.

| id | slug | title | category | featured | 이미지 |
|----|------|-------|----------|----------|--------|
| 1 | a-public | 공공시설 | integrated | ✓ | 22 |
| 2 | b-medical | 의료시설 | integrated | ✓ | 15 |
| 3 | c-office | 업무시설 | integrated | ✓ | 14 |
| 4 | d-education | 교육시설 | integrated | ✓ | 23 |
| 5 | e-commercial | 상업시설 | integrated | — | 11 |
| 6 | f-exhibition | 전시기획시설 | integrated | — | 37 |
| 7 | g-exterior | 익스테리어 | 3d | — | 28 |

## 6. 백업 & 유지보수

- SQLite 파일 일 1회 이상 백업 권장
- DBMS는 SQLite 유지 (PostgreSQL 전환 계획 없음)
- 스키마 변경: `alembic revision` 후 `alembic upgrade head`
