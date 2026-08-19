# OATSTONE 백엔드 개발 명세서

> **기준:** 실제 구현(`backend/app`) — 공개 API(health/projects/inquiries) + 관리자 API(로그인/포트폴리오 CRUD/이미지 업로드)  
> **DB:** 로컬 **SQLite**, 서버 **PostgreSQL** (`APP_ENV`로 자동 선택)

---

## 1. 프론트엔드 대비 백엔드 역할

| 영역 | 프론트 데이터 | DB 테이블 | API |
|------|----------------|-----------|-----|
| Hero / About / Process | 정적 카피 | — | — |
| Portfolio (공개) | `Project` / `ProjectDetail` | `projects`, `project_images` | `GET /api/projects`, `GET /api/projects/{id}` |
| Contact | `InquiryPayload` | `inquiries` | `POST /api/inquiries` |
| Admin — 포트폴리오 관리 | `AdminProject*` (adminApi.ts) | `projects`, `project_images` | `/api/admin/*` (JWT) |

포트폴리오 이미지는 두 경로로 존재한다: 초기 시드 이미지는 `frontend/public/assets/portfolio/`(정적 자산), 관리자 업로드 이미지는 `backend/uploads/portfolio/{slug}/`(백엔드가 `/uploads`로 서빙). 상세는 `docs/db.md` §3.2 참고.

---

## 2. 기술 스택

| 항목 | 내용 |
|------|------|
| 프레임워크 | FastAPI 0.110+ |
| 언어 | Python 3.11+ |
| 데이터베이스 | 로컬 SQLite 3 / 서버 PostgreSQL (`APP_ENV`) |
| ORM | SQLAlchemy 2.0 |
| 마이그레이션 | Alembic |
| 검증 | Pydantic v2 (`field_validator`, 한글 오류 메시지) |
| 인증 | PyJWT (HS256) + `HTTPBearer` |
| 메일 | Python `smtplib` (네이버 SMTP) |
| API 문서 | Swagger UI `/docs`, ReDoc `/redoc` |

---

## 3. 구현 범위

### 3.1 포함 (In Scope)

| 기능 | 설명 |
|------|------|
| Health Check | `GET /api/health` |
| 포트폴리오 목록/상세 (공개) | `GET /api/projects`, `GET /api/projects/{id}` |
| 문의 접수 | `POST /api/inquiries` → 검증 → SMTP → `inquiries` INSERT |
| 관리자 로그인 | `POST /api/admin/login` → JWT 발급 |
| 관리자 포트폴리오 CRUD | `/api/admin/projects*` (생성/수정/삭제/목록/상세) |
| 관리자 이미지 관리 | 업로드/삭제/대표 이미지 지정 |
| CORS | 프론트엔드 Origin 허용 |
| 한글 검증 오류 | Pydantic 422 응답을 한글 `detail`로 변환 |

### 3.2 제외 (Out of Scope)

| 제외 항목 | 사유 |
|-----------|------|
| `GET /api/inquiries` (공개/관리자 모두) | 문의 목록 조회 UI 없음 |
| `GET /api/projects?category=` 등 필터 | 공개 Portfolio는 전체 그리드만 표시 |
| 관리자 다중 계정 / 권한(role) | 단일 관리자 계정(`ADMIN_USERNAME`)만 지원 |
| Rate limiting, WebSocket | 현재 요구사항 없음 |

---

## 4. 프로젝트 구조

```
backend/
├── .env.example               # DB·CORS·SMTP·관리자 인증 설정 예시
├── .env                       # 로컬/서버 비밀값 (git 제외)
├── requirements.txt
├── alembic.ini
├── migrations/
│   ├── env.py
│   └── versions/
│       └── 001_initial_schema.py
├── oatstone.db                 # SQLite 파일 (마이그레이션으로 생성)
├── uploads/                    # 관리자 업로드 이미지 (/uploads로 서빙)
│   └── portfolio/{slug}/
└── app/
    ├── main.py                 # FastAPI 앱, CORS, 예외 핸들러, 라우터 등록, /uploads 마운트
    ├── config.py                # 환경 변수 로드
    ├── database.py              # Engine, Session, Alembic upgrade, get_db, 스키마 검증
    ├── exceptions.py            # 422 한글 변환 핸들러
    ├── seed.py                  # 포트폴리오 초기 시드
    ├── models/
    │   ├── inquiry.py           # Inquiry (inquiries)
    │   └── project.py           # Project, ProjectImage (projects, project_images)
    ├── schemas/
    │   ├── inquiry.py           # InquiryCreate, InquiryResponse
    │   ├── project.py           # ProjectResponse, ProjectDetailResponse (공개)
    │   └── admin.py             # AdminLogin*, AdminProject*, AdminThumbnailRequest
    ├── services/
    │   ├── auth.py               # JWT 발급/검증, 관리자 자격 확인
    │   ├── email.py              # SMTP 문의 메일 발송
    │   └── storage.py            # 이미지 업로드 저장/삭제
    └── routers/
        ├── api.py                # health, projects, inquiries (공개)
        └── admin.py              # 로그인 + 포트폴리오/이미지 CRUD (JWT 필요)
```

---

## 5. 데이터베이스

앱 기동 시 `init_db()`가 **Alembic `upgrade head`** 로 스키마를 맞추고, 연결마다 WAL · `foreign_keys=ON`을 적용한다. 테이블 컬럼·인덱스·트리거·시드 데이터의 전체 명세는 **`docs/db.md`** 를 참고한다(중복 방지).

```
projects 1 ── N project_images
inquiries          (독립)
```

기동 흐름: `bootstrap()`(`main.py`) → `init_db()`(Alembic upgrade) → `seed_projects()`(테이블이 비어 있을 때만 `portfolio-manifest.json` 삽입).

---

## 6. API 명세

### 6.1 공개 엔드포인트

| Method | Path | 프론트 호출 | 인증 |
|--------|------|-------------|------|
| GET | `/api/health` | 없음 (가동 확인) | — |
| GET | `/api/projects` | `fetchProjects()` → `Project[]` | — |
| GET | `/api/projects/{id}` | `fetchProject(id)` → `ProjectDetail` | — |
| POST | `/api/inquiries` | `submitInquiry()` → `{ id, message, created_at }` | — |

#### Health Check

```
GET /api/health
```
```json
{ "status": "ok", "service": "OATSTONE API" }
```

#### 포트폴리오 목록

```
GET /api/projects
```

정렬: `sort_order ASC, id ASC`. 응답은 배열 그대로(`{ items, total }` 래핑 없음), `images`는 포함하지 않는다.

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

#### 포트폴리오 상세

```
GET /api/projects/{id}
```

목록 필드 + `images: [{ id, image_url, caption }]` (`sort_order ASC` 정렬). 대상 없으면 `404 {"detail": "프로젝트를 찾을 수 없습니다."}`.

#### 문의 접수

```
POST /api/inquiries
Content-Type: application/json
```

```json
{
  "name": "홍길동",
  "email": "hong@example.com",
  "phone": "010-1234-5678",
  "project_type": "integrated",
  "message": "카페 인테리어 의뢰를 원합니다."
}
```

| 필드 | 필수 | 검증 |
|------|------|------|
| name | ✓ | 1~100자, trim |
| email | ✓ | 이메일 형식 |
| phone | ✓ | 10~20자 |
| project_type | ✓ | `drawing` \| `3d` \| `integrated` \| `other` |
| message | ✓ | 10~2000자 |

**처리 순서:** Pydantic 검증(422) → SMTP 발송(`INQUIRY_RECIPIENT`, 실패 시 502/503) → `inquiries` INSERT → 응답.

```json
{
  "id": 1,
  "message": "문의가 성공적으로 접수되었습니다. 빠른 시일 내에 연락드리겠습니다.",
  "created_at": "2026-03-19T09:00:00"
}
```

| 코드 | 상황 |
|------|------|
| 422 | 입력값 오류 |
| 502 | SMTP 전송 실패 |
| 503 | SMTP 미설정(`SMTP_USER`/`SMTP_PASSWORD` 없음) |

### 6.2 관리자 엔드포인트 (`/api/admin`, 전부 `Authorization: Bearer <JWT>` 필요 — `/login` 제외)

| Method | Path | 설명 |
|--------|------|------|
| POST | `/login` | 아이디/비밀번호 → JWT 발급 |
| GET | `/me` | 토큰 유효성 확인 → `{ username }` |
| GET | `/projects` | 관리자용 프로젝트 목록(이미지 개수 포함) |
| GET | `/projects/{id}` | 프로젝트 상세(이미지 배열 포함) |
| POST | `/projects` | 프로젝트 생성 |
| PUT | `/projects/{id}` | 프로젝트 부분 수정 |
| DELETE | `/projects/{id}` | 프로젝트 삭제(첨부 이미지·업로드 폴더 함께 삭제) |
| POST | `/projects/{id}/images` | 이미지 다중 업로드(multipart, `files`) |
| DELETE | `/projects/{id}/images/{imageId}` | 이미지 삭제(대표였다면 다음 이미지로 자동 승계) |
| PUT | `/projects/{id}/thumbnail` | 대표 이미지 지정(`{ image_id }`) |

#### 로그인

```
POST /api/admin/login
{ "username": "...", "password": "..." }
```

성공: `{ "access_token": "<jwt>", "token_type": "bearer" }`. 실패: `401 {"detail": "아이디 또는 비밀번호가 올바르지 않습니다."}`. `services/auth.py`가 `hmac.compare_digest`로 상수 시간 비교한다.

#### 프로젝트 생성/수정

```
POST /api/admin/projects
{
  "title": "string",
  "description": "string",
  "category": "drawing" | "3d" | "integrated",
  "tags": ["string"],
  "is_featured": false,
  "sort_order": null,
  "slug": null
}
```

- `slug`를 비우면 제목을 슬러그화(`_slugify_title`)해 자동 채번, 중복 시 `-2`, `-3`… 접미사 부여
- `slug`를 직접 지정하면 `^[a-z0-9]+(?:-[a-z0-9]+)*$` 형식 검사 + 중복 시 `409`
- `sort_order`를 비우면 현재 최댓값 + 1
- `PUT /projects/{id}`는 `AdminProjectUpdate`(전 필드 optional, `exclude_unset`)로 부분 수정. `slug`는 수정 불가

#### 이미지 업로드

```
POST /api/admin/projects/{id}/images
Content-Type: multipart/form-data
files: File[]
```

- 허용 확장자: `jpg`, `jpeg`(내부적으로 `jpg`로 정규화), `png`, `webp`, `gif`. 최대 10MB/파일
- 저장 경로: `backend/uploads/portfolio/{slug}/{sort_order:03d}{ext}`, 중복 파일명은 `-1`, `-2`… 접미사
- 새 이미지는 해당 프로젝트의 기존 최대 `sort_order` 다음 번호부터 순서대로 삽입(빈 번호를 채우지 않음)
- 대표 이미지(`thumbnail_url`)가 없던 프로젝트는 첫 업로드 이미지가 자동으로 대표가 됨

#### 이미지 삭제 / 대표 지정

- 이미지 삭제 시 파일도 함께 제거(`delete_managed_file`). 삭제한 이미지가 대표였다면 남은 이미지 중 `sort_order` 최솟값으로 대표를 재지정(`_sync_thumbnail`)
- 프로젝트 삭제 시 모든 이미지 파일 삭제 + `uploads/portfolio/{slug}/` 폴더 전체 삭제(`delete_project_uploads`)

---

## 7. 인증 (`app/services/auth.py`)

- 로그인 성공 시 `create_access_token()`이 `{ sub: username, exp }` 페이로드를 `JWT_SECRET`으로 HS256 서명, 만료는 `JWT_EXPIRE_HOURS`(기본 12시간)
- 보호된 라우트는 `Depends(get_current_admin)`으로 `HTTPBearer` 토큰을 검증하고, `sub`가 `ADMIN_USERNAME`과 일치하는지 재확인
- 토큰이 없거나 스킴이 `Bearer`가 아니거나 검증 실패 시 `401 {"detail": "로그인이 필요합니다."}`
- 프론트(`adminApi.ts`)는 401 응답을 받으면 저장된 토큰을 지우고 로그인 페이지로 되돌린다

**보안 설계:** `ADMIN_PASSWORD` / `JWT_SECRET`은 `config.py`에 기본값이 없다(빈 문자열). `.env`에 값을 채우지 않으면 `verify_credentials()`가 항상 `False`를 반환해 로그인이 막히고, 토큰 발급/검증도 `503`으로 거부된다 — 즉 미설정 상태로는 관리자 화면에 접근할 수 없다. `ADMIN_USERNAME`만 예시 기본값(`oat4243`)을 유지하며, `.env.example`의 나머지 값은 전부 `change_me` 플레이스홀더이므로 그대로는 로그인할 수 없다. 실제 `.env`는 절대 커밋하지 않는다.

---

## 8. 이미지 스토리지 (`app/services/storage.py`)

- 업로드 루트: `UPLOAD_DIR`(기본 `backend/uploads`), `main.py`가 `/uploads`로 정적 서빙
- `_safe_upload_path()`가 삭제 요청 경로를 `UPLOAD_DIR` 하위로만 강제해 경로 탈출을 방지
- 빈 파일(0바이트) 업로드는 거부, 10MB 초과 시 즉시 중단하고 부분 저장된 파일 삭제

---

## 9. Pydantic 스키마

### 9.1 문의 — `schemas/inquiry.py`

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

### 9.2 포트폴리오(공개) — `schemas/project.py`

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

### 9.3 관리자 — `schemas/admin.py`

- `AdminLoginRequest` / `AdminLoginResponse` / `AdminMeResponse`
- `AdminProjectListItem` — 공개 `ProjectResponse` + `slug`, `sort_order`, `image_count`, `updated_at`
- `AdminProjectDetailResponse(AdminProjectListItem)` — `images: list[AdminProjectImageResponse]` (`sort_order` 포함)
- `AdminProjectCreate` / `AdminProjectUpdate` — 제목 200자, 설명 5000자, 태그 최대 20개(각 50자) 제한 검증
- `AdminThumbnailRequest { image_id: int }`

프로젝트 유형/카테고리 한글 라벨(백엔드 `PROJECT_TYPE_LABELS` — `schemas/inquiry.py`, 프론트 `CATEGORY_LABELS` — `frontend/src/services/api.ts`. 둘 다 동일한 값을 라벨링):

| 값 | 라벨 | 사용처 |
|----|------|--------|
| drawing | 도면 작성 | Contact, Portfolio, Admin |
| 3d | 3D 디자인 | Contact, Portfolio, Admin |
| integrated | 통합 패키지 | Contact, Portfolio, Admin |
| other | 기타 | **Contact만.** `projects.category` CHECK에는 없음 |

---

## 10. 프론트엔드 연동

### 10.1 Contact 흐름

```
Contact.tsx → useInquiries(클라이언트 검증) → submitInquiry() → POST /api/inquiries → Toast
```

### 10.2 Portfolio 흐름 (공개)

```
Portfolio.tsx → useProjects → GET /api/projects , GET /api/projects/{id}
```

### 10.3 Admin 흐름

```
AdminLogin → POST /api/admin/login → JWT를 localStorage에 저장(useAuth)
AdminPortfolioList/Editor → adminApi.ts(Authorization 헤더 자동 첨부) → /api/admin/*
401 응답 → 자동 로그아웃 → /admin/login
```

### 10.4 개발 실행

루트에서 `npm run dev` (내부적으로 `npm run setup` 선행 후 backend/frontend 동시 실행):

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- Vite `server.proxy`가 `/api`, `/uploads`를 backend로 프록시

---

## 11. 환경 변수 (`backend/.env`, `.env.example` 참고)

| 변수 | 기본값(예시) | 설명 |
|------|--------------|------|
| `APP_ENV` | `local` | `local` → SQLite, `production`/`server`/`staging` → PostgreSQL |
| `DATABASE_URL` | (APP_ENV에 따름) | 지정 시 최우선. `postgres://` 도 허용 |
| `POSTGRES_HOST` / `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` | — | 서버에서 `DATABASE_URL` 없을 때 |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:3000` | 허용 Origin(쉼표 구분) |
| `DEBUG` | `true` | 디버그 모드 |
| `INQUIRY_RECIPIENT` | `oootn@naver.com` | 문의 수신 메일 |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USE_SSL` | `smtp.naver.com` / `465` / `true` | SMTP 서버 설정 |
| `SMTP_USER` / `SMTP_PASSWORD` | — (필수) | 발송 계정 / 앱 비밀번호 |
| `SMTP_FROM` | `SMTP_USER` | From 헤더 |
| `ADMIN_USERNAME` | `oat4243` | 관리자 로그인 아이디 |
| `ADMIN_PASSWORD` | — (필수, 미설정 시 로그인 항상 실패) | 관리자 로그인 비밀번호 |
| `JWT_SECRET` | — (필수, 미설정 시 토큰 발급/검증 503) | JWT 서명 키 |
| `JWT_EXPIRE_HOURS` | `12` | 토큰 만료 시간 |
| `UPLOAD_DIR` | `backend/uploads` | 관리자 업로드 이미지 저장 경로 |

프로덕션 추가 예시:

```env
DATABASE_URL=sqlite:////var/www/oatstone/data/oatstone.db
CORS_ORIGINS=https://oatstone.co.kr
DEBUG=false
```

---

## 12. CORS

```python
allow_origins = CORS_ORIGINS  # 환경 변수
allow_credentials = True
allow_methods = ["*"]
allow_headers = ["*"]
```

프로덕션 배포 시 실제 도메인을 `CORS_ORIGINS`에 등록한다.

---

## 13. 에러 처리

| HTTP | 상황 |
|------|------|
| 401 | 관리자 인증 실패/토큰 없음·만료 |
| 404 | 프로젝트/이미지 대상 없음 |
| 409 | 슬러그 중복 |
| 422 | 요청 본문 검증 실패 → `{"detail": "한글 메시지"}` |
| 502 | 메일 발송 실패 |
| 503 | SMTP 미구성 |
| 500 | 예기치 않은 서버 오류 |

`app/exceptions.py`의 `validation_exception_handler`가 Pydantic 영문 메시지를 한글로 변환한다. 프론트 `parseApiError()`(공개)/`utils/validationMessages.ts`(관리자)가 `detail`을 추가로 한글 변환한다.

---

## 14. 의존성 (`backend/requirements.txt`)

```
fastapi>=0.110.0
uvicorn[standard]>=0.27.0
sqlalchemy>=2.0.0
alembic>=1.13.0
pydantic[email]>=2.0.0
python-multipart>=0.0.9
python-dotenv>=1.0.0
PyJWT>=2.8.0
```

---

## 15. 실행·배포

### 15.1 로컬 (백엔드만)

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows / source venv/bin/activate (macOS·Linux)
pip install -r requirements.txt
copy .env.example .env         # SMTP·관리자 값 입력 (Windows), macOS/Linux는 cp
alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload --port 8000
```

> 루트에서 `npm run dev`를 실행하면 위 과정(가상환경 생성·설치·시드 포함)이 `scripts/setup.mjs` + `scripts/run-backend.mjs`로 자동 처리된다. 상세는 `docs/guide.md` 참고.

### 15.2 프로덕션 (개요)

| 구성요소 | 방식 |
|----------|------|
| Frontend + Backend | Docker 이미지 `ghcr.io/cg5779-png/oatstone` (FastAPI가 `frontend/dist` 제공) |
| Reverse Proxy | 호스트 `:8000` 또는 Nginx → 컨테이너 8000 |
| DB | PostgreSQL (`APP_ENV=production`), `pg_dump` 백업 |
| Secrets | `.env`는 서버에만 배치, 저장소에 커밋 금지. `ADMIN_PASSWORD`/`JWT_SECRET`은 기본값에서 반드시 교체 |

`main` 푸시 시 GitHub Actions가 이미지를 빌드해 GHCR에 올린다. 서버에서는 `docker compose pull && docker compose up -d`.

---

## 16. 포트폴리오 시드 데이터

이미지 파일은 정적 자산으로 유지하고, 메타·URL은 DB에 둔다.

```
scripts/sync-portfolio.mjs
  → frontend/public/assets/portfolio/{slug}/
  → frontend/public/assets/portfolio-covers/
  → frontend/src/data/portfolio-manifest.json
  → python -m app.seed (테이블이 비어 있을 때만 삽입)
  → projects / project_images
```

시드 7건(A~G: 공공·의료·업무·교육·상업·전시기획·익스테리어) 상세는 `docs/db.md` §5 참고. 시드 이후 등록되는 프로젝트는 전부 관리자 화면을 통해 추가된다.

---

## 17. 구현 체크리스트

| 항목 | 상태 |
|------|------|
| `GET /api/health` | ✅ |
| `GET /api/projects`, `GET /api/projects/{id}` | ✅ |
| `POST /api/inquiries` (검증 + SMTP + DB 저장) | ✅ |
| 관리자 로그인/JWT 인증 | ✅ |
| 관리자 포트폴리오 CRUD | ✅ |
| 관리자 이미지 업로드/삭제/대표 지정 | ✅ |
| Alembic `001_initial_schema` | ✅ |
| 422 한글 오류 변환 | ✅ |
| CORS | ✅ |
| 문의 목록 조회 API | ⛔ 범위 외 (UI 없음) |
| 관리자 다중 계정/권한 | ⛔ 범위 외 |
| 배포 자동화(CI/CD) | ✅ GitHub Actions → GHCR |
