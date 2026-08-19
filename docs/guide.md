# OATSTONE 프로젝트 전체 가이드

## 1. 프로젝트 소개

**OATSTONE**은 공간 디자인 전문 회사의 공식 홈페이지다. 클라이언트가 OATSTONE의 서비스(현장 실측 → 도면 작성 → 3D 디자인)를 직관적으로 이해하고 프로젝트 의뢰까지 이어지도록 설계된 싱글 페이지 사이트와, 포트폴리오를 관리하는 내부 관리자(Admin) 화면으로 구성된다.

| 항목 | 내용 |
|------|------|
| 회사명 | OATSTONE (Outset · Attitude · Tone) |
| 목표 | 브랜드 신뢰 구축 + 의뢰 전환 + 포트폴리오 자체 관리 |
| UI 방향 | Instagram 스타일 — 심플, 이미지 중심 |
| 기술 스택 | React 18 + Vite + TypeScript (프론트), FastAPI + SQLAlchemy + Alembic (백엔드), SQLite (DB) |

## 2. 구현 현황

| 영역 | 상태 |
|------|------|
| 공개 사이트 (Hero/About/Process/Portfolio/Contact) | ✅ 완료 |
| Portfolio API 연동 (목록/상세) | ✅ 완료 |
| Contact 문의 API + SMTP 메일 발송 | ✅ 완료 |
| 관리자 로그인(JWT) | ✅ 완료 |
| 관리자 포트폴리오 CRUD + 이미지 업로드 | ✅ 완료 |
| 배포 자동화(CI/CD) | ⛔ 미구성 — 수동 배포 필요 |

세부 명세는 각 문서를 참고한다.

| 문서 | 내용 |
|------|------|
| [docs/front.md](front.md) | 프론트엔드 라우트·컴포넌트·API 연동 명세 |
| [docs/backend.md](backend.md) | 백엔드 API·인증·이미지 업로드 명세 |
| [docs/db.md](db.md) | SQLite 스키마·인덱스·시드 데이터 |

## 3. 프로젝트 구조

```
oatstone/
├── docs/                    # front.md, backend.md, db.md, guide.md(이 문서)
├── frontend/                 # React (Vite)
│   ├── public/assets/        # 로고, 포트폴리오 시드 이미지
│   └── src/
│       ├── components/
│       │   ├── layout/       # Header, Footer, MobileMenu
│       │   ├── sections/     # Hero, About, Process, Portfolio, Contact
│       │   └── ui/           # Button, Card, Modal, Toast, LineIcon
│       ├── pages/             # HomePage, admin/(AdminLogin, AdminLayout, AdminPortfolioList, AdminPortfolioEditor)
│       ├── hooks/             # useAuth, useFadeIn, useInquiries, useProjects, useScrollSpy
│       ├── services/          # api.ts(공개), adminApi.ts(관리자, JWT)
│       └── data/              # portfolio-manifest.json 등 시드 메타
├── backend/                   # FastAPI
│   └── app/
│       ├── main.py            # 앱 부트스트랩, CORS, 라우터, /uploads 마운트
│       ├── models/, schemas/   # SQLAlchemy 모델 / Pydantic 스키마
│       ├── services/           # auth.py, email.py, storage.py
│       └── routers/            # api.py(공개), admin.py(관리자)
├── scripts/                    # setup.mjs, run-backend.mjs, open-browser.mjs, sync-portfolio.mjs
├── package.json                 # 루트: npm run dev 오케스트레이션
└── start.bat                    # Windows 원클릭 실행
```

## 4. 빠른 시작

### 4.1 원클릭 실행 (권장)

프로젝트 루트에서:

```bash
npm run dev
```

Windows는 `start.bat` 더블클릭도 가능(`npm run dev`와 동일).

`npm run dev`(`predev` 훅으로 `scripts/setup.mjs`가 먼저 실행됨)가 하는 일:

1. 루트 npm 의존성 설치
2. `backend/venv` Python 가상환경 생성(없을 때만) + `pip install -r requirements.txt`
3. `frontend` npm 의존성 설치
4. `scripts/sync-portfolio.mjs`로 포트폴리오 이미지·매니페스트 동기화
5. FastAPI(8000)와 Vite(5173)를 동시에 실행하고, 헬스 체크 후 브라우저를 자동으로 연다

| URL | 설명 |
|-----|------|
| http://localhost:5173 | 공개 웹사이트 |
| http://localhost:5173/admin/login | 관리자 로그인 |
| http://localhost:8000/docs | FastAPI Swagger 문서 |

> 최초 실행 전 `backend/.env`를 `.env.example`로부터 생성하고 SMTP·관리자 계정 값을 채워야 문의 메일 발송/관리자 로그인이 동작한다. 상세는 `docs/backend.md` §11 참고.

### 4.2 프론트엔드만 실행

```bash
cd frontend
npm install
npm run dev
```

백엔드가 꺼져 있으면 `/api` 요청은 실패하고 화면에 한글 에러 메시지가 표시된다(별도 Mock 데이터 폴백 없음).

### 4.3 백엔드만 실행

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env              # Windows: copy .env.example .env
alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload --port 8000
```

## 5. 환경 변수

### Frontend (`frontend/.env.example`)

개발 시 `VITE_API_URL`을 비워 두면 Vite가 `/api`, `/uploads`를 `http://localhost:8000`으로 프록시한다. 프론트를 다른 출처에서 띄울 때만 값을 채운다.

```
# VITE_API_URL=http://localhost:8000
```

### Backend (`backend/.env.example`)

`DATABASE_URL`, `CORS_ORIGINS`, SMTP 설정(`SMTP_HOST/PORT/USER/PASSWORD`), 관리자 인증(`ADMIN_USERNAME/PASSWORD`, `JWT_SECRET`, `JWT_EXPIRE_HOURS`) 등 전체 변수 목록과 설명은 `docs/backend.md` §11에 정리되어 있다. **운영 배포 전 관리자 자격 증명과 `JWT_SECRET`은 반드시 기본값에서 교체한다.**

## 6. 개발 워크플로우

```
루트에서 npm run dev
  → setup.mjs (의존성 설치, 포트폴리오 동기화)
  → FastAPI(8000) + React(5173) 동시 기동
  → /api/health 확인 후 브라우저 자동 열림
```

DB 스키마를 바꿀 때는 `backend/`에서 `alembic revision --autogenerate -m "..."` 후 `alembic upgrade head`로 반영한다(`docs/db.md` §6).

## 7. 배포

이 저장소에는 CI/CD가 구성되어 있지 않다. `main` 브랜치에 push해도 자동으로 서비스에 반영되지 않으며, 서버에서 아래 절차를 수동으로 수행해야 한다.

1. 서버에서 `git pull`
2. `cd frontend && npm install && npm run build` → `frontend/dist`를 Nginx 등 정적 호스팅에 반영
3. `cd backend`에서 의존성 설치/마이그레이션(`alembic upgrade head`) 후 `uvicorn app.main:app --host 0.0.0.0 --port 8000`을 systemd/supervisor로 구동
4. 리버스 프록시에서 `/api`, `/uploads` → FastAPI, 그 외 `/` → 정적 파일로 라우팅

상세는 `docs/backend.md` §15(실행·배포) 참고.

## 8. 수동 확인 체크리스트

- [ ] 공개 사이트: 모바일/데스크톱에서 전 섹션 표시, 네비게이션 smooth scroll, 햄버거 메뉴
- [ ] Portfolio 그리드 로딩/에러/빈 상태 + 상세 모달
- [ ] Contact 폼 제출(성공/검증 실패/서버 오류 각 케이스) + 수신 메일 확인
- [ ] 관리자 로그인 성공/실패, 토큰 만료 시 자동 로그아웃
- [ ] 관리자 포트폴리오 생성 → 이미지 업로드 → 대표 이미지 지정 → 수정 → 삭제(파일도 삭제되는지)

---

© 2026 OATSTONE — Outset · Attitude · Tone
