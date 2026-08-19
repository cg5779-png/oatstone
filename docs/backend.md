# OATSTONE 백엔드 개발 명세서

> **기준:** 완성된 프론트엔드 UI·타입(`api.ts`, Contact, Portfolio)  
> **원칙:** 화면에 존재하는 데이터만 DB·API로 다룬다.  
> **DB:** 개발·프로덕션 모두 **SQLite** 사용

---

## 1. 프론트엔드 대비 백엔드 역할

현재 홈페이지는 SPA이며, 섹션별 데이터 출처와 DB 필요 여부는 다음과 같다.

| 섹션 | 프론트 데이터 | DB 테이블 | API |
|------|----------------|-----------|-----|
| Hero | 정적 카피 | — | — |
| About OATSTONE | 정적 카피 | — | — |
| Services | `Services.tsx` 상수 4건 | — | — |
| Process | `Process.tsx` 5단계 | — | — |
| Portfolio | `Project` / `ProjectDetail` | `projects`, `project_images` | `GET /api/projects`, `GET /api/projects/{id}` |
| Contact | `InquiryPayload` | `inquiries` | `POST /api/inquiries` |

**DB 범위:** Contact 문의 + Portfolio 프로젝트·이미지.  
Hero / About / Services / Process는 카피성 콘텐츠라 테이블을 두지 않는다.  
포트폴리오 이미지 파일은 계속 `public/assets/portfolio/`에 두고, DB에는 URL·메타데이터만 저장한다.

---

## 2. 기술 스택

| 항목 | 내용 |
|------|------|
| 프레임워크 | FastAPI 0.110+ |
| 언어 | Python 3.11+ |
| 데이터베이스 | **SQLite 3** (개발·프로덕션 동일) |
| ORM | SQLAlchemy 2.0 |
| 검증 | Pydantic v2 (`field_validator`, 한글 오류 메시지) |
| 메일 | Python `smtplib` (네이버 SMTP) |
| API 문서 | Swagger UI `/docs`, ReDoc `/redoc` |

---

## 3. 구현 범위

### 3.1 포함 (In Scope)

| 기능 | 설명 |
|------|------|
| Health Check | `GET /api/health` (페이지 미사용, 가동 확인) |
| 포트폴리오 목록 | `GET /api/projects` → `projects` (`sort_order`) |
| 포트폴리오 상세 | `GET /api/projects/{id}` → `projects` + `project_images` |
| 문의 접수 | `POST /api/inquiries` → 검증 → SMTP → `inquiries` INSERT |
| CORS | 프론트엔드 Origin 허용 |
| 한글 검증 오류 | Pydantic 422 응답을 한글 `detail`로 변환 |

### 3.2 제외 (Out of Scope)

프론트 페이지에 **호출부가 없는** 엔드포인트는 두지 않는다.

| 제외 항목 | 사유 |
|-----------|------|
| `GET /api/inquiries` | 관리자 UI 없음 |
| `POST/PUT/DELETE /api/projects` | 포트폴리오는 시드·정적 자산, CMS 없음 |
| `GET /api/projects?category=` 등 필터 | Portfolio는 전체 그리드만 표시 |
| `GET /api/project-images` | 이미지는 상세 응답에 포함 |
| JWT / 관리자 인증 | 디자인에 없음 |
| 이미지 업로드 API | `scripts/sync-portfolio.mjs` |
| PostgreSQL 등 DB 전환 | SQLite 단일 DB 정책 |
| Rate limiting, WebSocket | 현재 요구사항 없음 |

---

## 4. 프로젝트 구조

```
backend/
├── .env.example              # SMTP·DB·CORS 설정 예시
├── .env                      # 로컬/서버 비밀값 (git 제외)
├── requirements.txt
├── alembic.ini
├── migrations/
│   ├── env.py
│   └── versions/
│       └── 001_initial_schema.py
├── oatstone.db               # SQLite 파일 (마이그레이션으로 생성)
└── app/
    ├── main.py               # FastAPI 앱, CORS, 예외 핸들러, 라우터 등록
    ├── config.py             # 환경 변수 로드
    ├── database.py           # Engine, Session, Alembic upgrade, get_db
    ├── exceptions.py         # 422 한글 변환 핸들러
    ├── seed.py               # 포트폴리오 시드
    ├── models/
    │   ├── inquiry.py        # inquiries
    │   └── project.py        # projects, project_images
    ├── schemas/
    │   ├── inquiry.py        # InquiryCreate, InquiryResponse
    │   └── project.py        # ProjectResponse, ProjectDetailResponse
    ├── services/
    │   └── email.py          # SMTP 문의 메일 발송
    └── routers/
        └── api.py            # health, projects, inquiries
```

---

## 5. 데이터베이스 (SQLite)

앱 기동 시 `init_db()`가 **Alembic `upgrade head`** 로 스키마를 맞추고, 연결마다 WAL · `foreign_keys=ON`을 적용한다.

```
projects 1 ── N project_images
inquiries          (독립)
```

프론트 `Project` / `ProjectDetail` / `InquiryPayload`와 컬럼을 맞춘다.

### 5.1 `inquiries` — Contact 문의

`Contact.tsx` + `useInquiries.ts` + `InquiryPayload`와 1:1.

| 컬럼 | 타입 | 제약 | 프론트 대응 |
|------|------|------|-------------|
| id | INTEGER | PK, AUTOINCREMENT | 응답 `id` |
| name | VARCHAR(100) | NOT NULL | `name` 1~100자 |
| email | VARCHAR(200) | NOT NULL | `email` |
| phone | VARCHAR(20) | NOT NULL | `phone` 10~20자 |
| project_type | VARCHAR(50) | NOT NULL, CHECK | `drawing` \| `3d` \| `integrated` \| `other` |
| message | TEXT | NOT NULL | `message` 10~2000자 |
| status | VARCHAR(20) | DEFAULT `pending`, CHECK | UI 미노출 (`pending` \| `read` \| `replied`) |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 응답 `created_at` |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP, 트리거 | 내부 갱신 |

**CHECK:** `ck_inquiries_project_type`, `ck_inquiries_status`  
**인덱스:** `idx_inquiries_created_at` (`created_at` DESC), `idx_inquiries_status` (`status`)  
**트리거:** `trg_inquiries_updated_at`

### 5.2 `projects` — Portfolio 목록

`frontend/src/services/api.ts` 의 `Project` + 매니페스트 `slug`.

| 컬럼 | 타입 | 제약 | 프론트 대응 |
|------|------|------|-------------|
| id | INTEGER | PK, AUTOINCREMENT | `Project.id` |
| slug | VARCHAR(100) | NOT NULL, UNIQUE | 매니페스트 `slug` (예: `a-public`) |
| title | VARCHAR(200) | NOT NULL | `title` (공공시설 등) |
| description | TEXT | NOT NULL | `description` |
| category | VARCHAR(50) | NOT NULL, CHECK | `drawing` \| `3d` \| `integrated` |
| thumbnail_url | VARCHAR(500) | NULL | `thumbnail_url` (첫 이미지 또는 커버) |
| tags | JSON | NOT NULL | `tags: string[]` |
| is_featured | BOOLEAN | DEFAULT 0 | `is_featured` (`id <= 4` 시드) |
| sort_order | INTEGER | DEFAULT 0 | 그리드 순서 (시드는 `id`와 동일) |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | `created_at` |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP, 트리거 | 내부 갱신 |

**CHECK:** `ck_projects_category` — 문의의 `other`는 포트폴리오 분류에 쓰지 않는다.  
**인덱스:** `idx_projects_category`, `idx_projects_featured` (`is_featured`, `sort_order`), `idx_projects_slug` UNIQUE  
**트리거:** `trg_projects_updated_at`

### 5.3 `project_images` — Portfolio 상세 갤러리

`ProjectDetail.images` 와 1:1.

| 컬럼 | 타입 | 제약 | 프론트 대응 |
|------|------|------|-------------|
| id | INTEGER | PK, AUTOINCREMENT | `images[].id` |
| project_id | INTEGER | FK → `projects.id` ON DELETE CASCADE | 부모 프로젝트 |
| image_url | VARCHAR(500) | NOT NULL | `images[].image_url` (`/assets/portfolio/...`) |
| caption | VARCHAR(200) | NULL | `images[].caption` |
| sort_order | INTEGER | DEFAULT 0 | 갤러리 순서 (1부터) |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 내부 |

**인덱스:** `idx_project_images_project_id` (`project_id`)

### 5.4 시드 데이터 (프론트 포트폴리오 7건)

`python -m app.seed`가 `frontend/src/data/portfolio-manifest.json` + `portfolioData.ts` 메타를 넣어 이미 데이터가 있으면 건너뛴다.

| id | slug | title | category | featured | 이미지 수 |
|----|------|-------|----------|----------|-----------|
| 1 | a-public | 공공시설 | integrated | ✓ | 22 |
| 2 | b-medical | 의료시설 | integrated | ✓ | 15 |
| 3 | c-office | 업무시설 | integrated | ✓ | 14 |
| 4 | d-education | 교육시설 | integrated | ✓ | 23 |
| 5 | e-commercial | 상업시설 | integrated | — | 11 |
| 6 | f-exhibition | 전시기획시설 | integrated | — | 37 |
| 7 | g-exterior | 익스테리어 | 3d | — | 28 |

합계 **150**장. 썸네일은 매니페스트 `images[0]`.

### 5.5 SQLite 환경별 설정

| 환경 | DATABASE_URL 예시 | 비고 |
|------|-------------------|------|
| 개발 | `sqlite:///./oatstone.db` | `backend/` 기준 상대 경로 |
| 프로덕션 | `sqlite:////var/www/oatstone/data/oatstone.db` | 절대 경로 권장, 디렉터리 사전 생성 |

- 개발·프로덕션 **동일 DBMS(SQLite)**. 별도 RDBMS 전환 계획 없음.
- 프로덕션: `oatstone.db` 파일 **일 1회 이상 백업** 권장 (cron + 파일 복사).
- 기동 시 `PRAGMA journal_mode=WAL`, `PRAGMA foreign_keys=ON`.

### 5.6 마이그레이션 (Alembic)

스키마 적용은 `create_all()` 대신 Alembic 리비전을 사용한다.

| 리비전 | 내용 |
|--------|------|
| `001_initial_schema` | `inquiries`, `projects`, `project_images` + 인덱스 + `updated_at` 트리거 |

기존 `create_all()`로 만든 DB에도 테이블이 있으면 생성은 건너뛰고 인덱스·트리거만 맞춘 뒤 버전을 기록한다.

```bash
cd backend
venv\Scripts\alembic upgrade head   # 스키마만 (Windows)
python -m app.seed                  # 마이그레이션 + 포트폴리오 시드
```

---

## 6. API 명세

프론트 `frontend/src/services/api.ts` 타입 및 Vite 프록시(`/api` → `localhost:8000`)와 일치한다.

공개 엔드포인트는 **4개**다. 페이지가 쓰지 않는 CRUD·필터·관리자 API는 두지 않는다.

| Method | Path | 프론트 호출 | DB |
|--------|------|-------------|-----|
| GET | `/api/health` | 없음 (가동 확인) | — |
| GET | `/api/projects` | `fetchProjects()` → `Project[]` | `projects` |
| GET | `/api/projects/{id}` | `fetchProject(id)` → `ProjectDetail` | `projects` + `project_images` |
| POST | `/api/inquiries` | `submitInquiry()` → `{ message }` | `inquiries` INSERT |

응답에 **프론트 타입이 없는 컬럼은 넣지 않는다.**

| 테이블 컬럼 | API 노출 |
|-------------|----------|
| `projects.slug` | ❌ (매니페스트·시드 전용) |
| `projects.sort_order` | ❌ (정렬에만 사용) |
| `projects.updated_at` | ❌ |
| `project_images.project_id` | ❌ (경로 `{id}`로 충분) |
| `project_images.sort_order` | ❌ (배열 순서로 반영) |
| `project_images.created_at` | ❌ |
| `inquiries.status` | ❌ (내부, 기본 `pending`) |
| `inquiries.updated_at` | ❌ |

### 6.1 Health Check

```
GET /api/health
```

**Response 200:**

```json
{
  "status": "ok",
  "service": "OATSTONE API"
}
```

### 6.2 포트폴리오 목록

`Portfolio.tsx` 마운트 시 그리드용. 카테고리 필터·페이지네이션 없음.

```
GET /api/projects
```

**정렬:** `projects.sort_order ASC`, `id ASC`

**Response 200** — `Project[]` (배열 그대로. `{ items, total }` 래핑 없음):

```json
[
  {
    "id": 1,
    "title": "공공시설",
    "description": "공공기관 및 공공공간을 위한 도면 작성과 3D 디자인 프로젝트입니다.",
    "category": "integrated",
    "thumbnail_url": "/assets/portfolio/a-public/001.jpg",
    "tags": ["공공시설", "평면도", "3D"],
    "is_featured": true,
    "created_at": "2026-01-15T10:00:00"
  }
]
```

| 응답 필드 | DB |
|-----------|-----|
| id | `projects.id` |
| title | `projects.title` |
| description | `projects.description` |
| category | `projects.category` (`drawing` \| `3d` \| `integrated`) |
| thumbnail_url | `projects.thumbnail_url` |
| tags | `projects.tags` JSON → `string[]` |
| is_featured | `projects.is_featured` |
| created_at | `projects.created_at` |

`images`는 목록에 포함하지 않는다. 그리드는 `thumbnail_url`만 쓴다.

### 6.3 포트폴리오 상세

그리드 클릭 → 모달. `id`는 숫자 PK (`slug` 조회 없음).

```
GET /api/projects/{id}
```

**Response 200** — `ProjectDetail` (목록 필드 + `images`):

```json
{
  "id": 1,
  "title": "공공시설",
  "description": "공공기관 및 공공공간을 위한 도면 작성과 3D 디자인 프로젝트입니다.",
  "category": "integrated",
  "thumbnail_url": "/assets/portfolio/a-public/001.jpg",
  "tags": ["공공시설", "평면도", "3D"],
  "is_featured": true,
  "created_at": "2026-01-15T10:00:00",
  "images": [
    {
      "id": 1,
      "image_url": "/assets/portfolio/a-public/001.jpg",
      "caption": "공공시설 01"
    }
  ]
}
```

| 응답 필드 | DB |
|-----------|-----|
| (목록과 동일) | `projects.*` |
| images[].id | `project_images.id` |
| images[].image_url | `project_images.image_url` |
| images[].caption | `project_images.caption` |

`images` 순서: `project_images.sort_order ASC`.

**Response 404:** `{"detail": "프로젝트를 찾을 수 없습니다."}`

### 6.4 문의 접수 (Contact)

`Contact.tsx` → `useInquiries` → `submitInquiry()`.

```
POST /api/inquiries
Content-Type: application/json
```

**Request Body** — `InquiryPayload` (프론트 타입과 동일, `inquiries` 컬럼 1:1):

```json
{
  "name": "홍길동",
  "email": "hong@example.com",
  "phone": "010-1234-5678",
  "project_type": "integrated",
  "message": "카페 인테리어 의뢰를 원합니다."
}
```

| 필드 | 타입 | 필수 | 검증 | DB |
|------|------|------|------|-----|
| name | string | ✓ | 1~100자, trim | `inquiries.name` |
| email | string | ✓ | 이메일 형식 | `inquiries.email` |
| phone | string | ✓ | 10~20자 | `inquiries.phone` |
| project_type | string | ✓ | `drawing`, `3d`, `integrated`, `other` | `inquiries.project_type` |
| message | string | ✓ | 10~2000자 | `inquiries.message` |

클라이언트가 보내지 않는 컬럼: `status` = `pending`, `created_at` / `updated_at` = NOW.

**처리 순서:**

1. Pydantic 유효성 검사 (실패 시 422, 한글 `detail`)
2. SMTP로 `INQUIRY_RECIPIENT`(기본 `oootn@naver.com`)에 메일 발송
3. `inquiries` INSERT
4. 성공 응답 반환

**Response 201:**

```json
{
  "id": 1,
  "message": "문의가 성공적으로 접수되었습니다. 빠른 시일 내에 연락드리겠습니다.",
  "created_at": "2026-03-19T09:00:00"
}
```

| 응답 필드 | 출처 |
|-----------|------|
| id | `inquiries.id` |
| message | **안내 문구** (DB `inquiries.message`가 아님) |
| created_at | `inquiries.created_at` |

프론트는 Toast에 `message`만 사용한다. `id`·`created_at`은 포함해도 무시된다.

**Response 오류:**

| 코드 | 상황 | detail 예시 |
|------|------|-------------|
| 422 | 입력값 오류 | `메시지는 10자 이상 입력해 주세요.` |
| 502 | SMTP 전송 실패 | `이메일 전송에 실패했습니다. 잠시 후 다시 시도해 주세요.` |
| 503 | SMTP 미설정 | `SMTP 설정이 필요합니다. backend/.env 파일에...` |

**메일 내용:**

- **To:** `INQUIRY_RECIPIENT`
- **Reply-To:** 문의자 `email`
- **Subject:** `[OATSTONE 문의] {name} · {project_type 한글 라벨}`
- **Body:** 이름, 이메일, 연락처, 프로젝트 유형, 메시지

---

## 7. Pydantic 스키마

### 7.1 문의 — `backend/app/schemas/inquiry.py`

프론트 `InquiryPayload`와 필드·enum 일치.

```python
class InquiryCreate(BaseModel):
    name: str
    email: str
    phone: str
    project_type: Literal["drawing", "3d", "integrated", "other"]
    message: str


class InquiryResponse(BaseModel):
    id: int
    message: str          # 안내 문구. DB inquiries.message 가 아님
    created_at: datetime
```

프로젝트 유형 한글 라벨 (`CATEGORY_LABELS`):

| 값 | 라벨 | 사용처 |
|----|------|--------|
| drawing | 도면 작성 | Contact select, Portfolio category |
| 3d | 3D 디자인 | Contact, Portfolio |
| integrated | 통합 패키지 | Contact, Portfolio |
| other | 기타 | **Contact만** (`inquiries.project_type`). `projects.category` CHECK에 없음 |

### 7.2 포트폴리오 — `backend/app/schemas/project.py`

프론트 `Project` / `ProjectDetail` 과 동일.

```python
class ProjectImageResponse(BaseModel):
    id: int
    image_url: str
    caption: str | None = None


class ProjectResponse(BaseModel):
    id: int
    title: str
    description: str
    category: str
    thumbnail_url: str | None
    tags: list[str]
    is_featured: bool
    created_at: datetime


class ProjectDetailResponse(ProjectResponse):
    images: list[ProjectImageResponse] = []
```

---

## 8. 프론트엔드 연동

### 8.1 Contact 흐름

```
Contact.tsx
  → useInquiries (클라이언트 한글 검증)
  → submitInquiry() in api.ts
  → POST /api/inquiries (Vite proxy)
  → FastAPI
  → Toast (성공/실패)
```

- 네트워크 오류는 한글 안내로 throw. Mock fallback 없음.

### 8.2 Portfolio 흐름

```
Portfolio.tsx
  → fetchProjects() / fetchProject(id)
  → GET /api/projects , GET /api/projects/{id}
```

함수 시그니처는 API 응답과 같다 (`Project[]`, `ProjectDetail`).  
`frontend/src/services/api.ts`가 Vite 프록시(`/api` → FastAPI)로 위 엔드포인트를 호출한다.  
목록 실패 시 재시도, 상세 실패 시 Toast로 안내한다.

### 8.3 개발 실행

루트에서:

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- Vite `server.proxy['/api']` → backend

---

## 9. 환경 변수

`backend/.env` (`.env.example` 참고):

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `DATABASE_URL` | `sqlite:///./oatstone.db` | SQLite 연결 문자열 |
| `CORS_ORIGINS` | `http://localhost:5173,...` | 허용 Origin (쉼표 구분) |
| `DEBUG` | `true` | 디버그 모드 |
| `INQUIRY_RECIPIENT` | `oootn@naver.com` | 문의 수신 메일 |
| `SMTP_HOST` | `smtp.naver.com` | SMTP 서버 |
| `SMTP_PORT` | `465` | SMTP 포트 |
| `SMTP_USE_SSL` | `true` | SSL 사용 여부 |
| `SMTP_USER` | — | 발송 계정 (필수) |
| `SMTP_PASSWORD` | — | 앱 비밀번호 (필수) |
| `SMTP_FROM` | `SMTP_USER` | From 헤더 |

프로덕션 추가 예시:

```env
DATABASE_URL=sqlite:////var/www/oatstone/data/oatstone.db
CORS_ORIGINS=https://your-domain.com
DEBUG=false
```

---

## 10. CORS

```python
allow_origins = CORS_ORIGINS  # 환경 변수
allow_credentials = True
allow_methods = ["*"]
allow_headers = ["*"]
```

프로덕션 배포 시 실제 도메인을 `CORS_ORIGINS`에 등록한다.

---

## 11. 에러 처리

| HTTP | 상황 |
|------|------|
| 404 | `GET /api/projects/{id}` 대상 없음 |
| 422 | 요청 본문 검증 실패 → `{"detail": "한글 메시지"}` |
| 502 | 메일 발송 실패 |
| 503 | SMTP 미구성 |
| 500 | 예기치 않은 서버 오류 |

`app/exceptions.py`의 `validation_exception_handler`가 Pydantic 영문 메시지를 한글로 변환한다.

프론트 `parseApiError()`가 `detail`(문자열·배열)을 한글로 추가 변환한다.

---

## 12. 의존성

`backend/requirements.txt`:

```
fastapi>=0.110.0
uvicorn[standard]>=0.27.0
sqlalchemy>=2.0.0
alembic>=1.13.0
pydantic[email]>=2.0.0
python-multipart>=0.0.9
python-dotenv>=1.0.0
```

---

## 13. 실행·배포

### 13.1 로컬

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
copy .env.example .env         # SMTP 값 입력
alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload --port 8000
```

### 13.2 프로덕션 (개요)

| 구성요소 | 방식 |
|----------|------|
| Frontend | `npm run build` → `frontend/dist` 정적 호스팅 (Nginx 등) |
| Backend | `uvicorn app.main:app --host 0.0.0.0 --port 8000` (systemd/supervisor) |
| Reverse Proxy | `/api` → FastAPI, `/` → 정적 파일 |
| DB | SQLite 파일 단일 인스턴스, 백업 스크립트 |
| Secrets | `.env`는 서버에만 배치, 저장소에 커밋 금지 |

---

## 14. 포트폴리오 데이터

이미지 파일은 프론트 정적 자산으로 유지하고, **메타·URL은 SQLite**에 둔다.

```
D:/.../project/프로젝트A~G-*
  → scripts/sync-portfolio.mjs
  → frontend/public/assets/portfolio/{slug}/
  → frontend/public/assets/portfolio-covers/   (메인 커버)
  → frontend/src/data/portfolio-manifest.json
  → python -m app.seed
  → projects / project_images
```

현재 UI는 `GET /api/projects*` 로 DB 메타를 읽고, 이미지 파일은 `public/assets/portfolio/` 경로를 그대로 사용한다.

프로젝트 7건 (A~G): 공공·의료·업무·교육·상업·전시기획·익스테리어.

---

## 15. 구현 체크리스트

| 항목 | 상태 |
|------|------|
| `GET /api/health` | ✅ |
| `GET /api/projects` | ✅ |
| `GET /api/projects/{id}` | ✅ |
| `POST /api/inquiries` (검증 + DB 저장) | ✅ |
| SMTP 메일 발송 | ✅ (`.env` 설정 필요) |
| `inquiries` SQLite 테이블 | ✅ |
| `projects` / `project_images` 테이블 | ✅ |
| 포트폴리오 시드 7건·150장 | ✅ |
| Alembic `001_initial_schema` | ✅ |
| 422 한글 오류 | ✅ |
| CORS | ✅ |
| 프론트 Portfolio fetch → API 전환 | ✅ |
| 관리자 API/인증 | ⛔ 범위 외 |

---

## 16. 향후 확장 (본 명세 범위 밖)

아래는 **현재 디자인·프론트에 없으므로** 별도 요구 시에만 검토한다.

- 관리자 페이지 + 문의 목록 조회
- 포트폴리오 CMS / 이미지 업로드 API
- 문의 Rate limiting
