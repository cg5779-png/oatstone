# OATSTONE 프로젝트 전체 가이드

## 1. 프로젝트 소개

**OATSTONE**은 공간 디자인 전문 회사의 공식 홈페이지입니다.  
클라이언트가 OATSTONE의 서비스(현장 실측 → 도면 작성 → 3D 디자인)를 직관적으로 이해하고, 프로젝트 의뢰까지 자연스럽게 이어지도록 설계되었습니다.

| 항목 | 내용 |
|------|------|
| 회사명 | OATSTONE (Outset Attitude Tone) |
| 목표 | 브랜드 신뢰 구축 + 의뢰 전환 |
| UI 방향 | Instagram 스타일 — 심플, 이미지 중심 |
| 기술 스택 | React + FastAPI + SQLite |

## 2. 개발 단계 (Phase)

| Phase | 범위 | 상태 |
|-------|------|------|
| **Phase 1** | 프론트엔드 UI 완전 구현 + 백엔드/DB 스켈레톤 | ✅ 현재 |
| Phase 2 | API 완전 구현, DB 시드, 관리자 패널 | 예정 |

## 3. 프로젝트 구조

```
000-OATSTONE/
├── docs/
│   ├── front.md          # 프론트엔드 명세서
│   ├── backend.md        # 백엔드 명세서
│   ├── db.md             # DB 설계 명세서
│   └── guide.md          # 이 문서
├── frontend/             # React (Vite) — Phase 1 완성
│   ├── public/assets/oatstone-logo.png
│   └── src/
│       ├── components/
│       │   ├── layout/   # Header, Footer, MobileMenu
│       │   ├── sections/ # Hero, About, Services, Process, Portfolio, Contact
│       │   └── ui/       # Button, Card, Modal, Toast
│       ├── hooks/        # useFadeIn, useScrollSpy, useInquiries
│       ├── data/         # mockData (데모용)
│       └── services/     # api.ts (API + Mock fallback)
├── backend/              # FastAPI 스켈레톤
│   └── app/
│       ├── main.py       # Health + CORS + DB init
│       ├── models/       # SQLAlchemy 모델 (정의만)
│       ├── schemas/      # Pydantic 스키마 (정의만)
│       └── routers/      # api.py (스텁)
└── README.md
```

## 4. 빠른 시작

### 원클릭 실행 (권장)

프로젝트 루트에서 한 번에 설치·실행·브라우저 열기:

```bash
npm start
```

Windows: `start.bat` 더블클릭

| URL | 설명 |
|-----|------|
| http://localhost:5173 | 웹사이트 (자동 열림) |
| http://localhost:8000/docs | API 문서 |

### 프론트엔드만 실행

```bash
cd frontend
npm install
npm run dev
```

> 백엔드 없이도 Mock 데이터로 포트폴리오·문의 폼이 동작합니다.

### 백엔드만 실행 (선택)

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## 5. Phase 1 구현 현황

### 프론트엔드 ✅

- [x] Header (Sticky + Scroll Spy)
- [x] MobileMenu (풀스크린 오버레이)
- [x] Hero / About / Services / Process / Portfolio / Contact
- [x] 공용 UI: Button, Card, Modal, Toast
- [x] Hooks: useFadeIn, useScrollSpy, useInquiries, useProjects
- [x] FastAPI 연동 (Portfolio 목록/상세, Contact 문의)
- [x] 반응형 (모바일/태블릿/데스크톱)

### 백엔드 / DB

- [x] FastAPI 앱 + CORS + Health Check
- [x] SQLAlchemy 모델 + Alembic 마이그레이션
- [x] `GET /api/projects`, `GET /api/projects/{id}`, `POST /api/inquiries`
- [x] 포트폴리오 시드 7건

## 6. 환경 변수

### Frontend (`frontend/.env.example`)

개발 시 `VITE_API_URL`을 비워 두면 Vite가 `/api`를 `http://localhost:8000`으로 프록시합니다.

```
# VITE_API_URL=http://localhost:8000
```

## 7. 개발 워크플로우

```
프로젝트 루트에서 npm run dev
  → FastAPI(8000) + React(5173)
  → health 확인 후 브라우저 열림
```

## 8. 테스트 체크리스트 (Phase 1)

- [x] 모든 섹션 모바일/데스크톱 표시
- [x] 포트폴리오 그리드 + 모달
- [x] Contact 폼 제출 (API)
- [x] 네비게이션 smooth scroll
- [x] 햄버거 메뉴 (MobileMenu)

---

© 2026 OATSTONE — Outset Attitude Tone
