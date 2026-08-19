# OATSTONE 프론트엔드 개발 명세서

> 실제 구현(`frontend/src`) 기준. 공개 사이트(싱글 페이지) + 관리자(Admin) 라우트로 구성된다.

## 1. 개요

| 항목 | 내용 |
|------|------|
| 프로젝트명 | OATSTONE Corporate Website |
| 기술 스택 | React 18, Vite 5, TypeScript, React Router 6, 순수 CSS(컴포넌트별 파일, BEM 네이밍) |
| 디자인 방향 | Instagram 스타일 — 직관적, 심플, 이미지 중심 |
| 반응형 | 모바일 우선(Mobile First). 브레이크포인트는 `768px` 단일 기준 |
| 라우팅 | 공개 사이트는 싱글 페이지(앵커 스크롤), `/admin/*`는 React Router 라우트 |

## 2. 브랜드 아이덴티티 (CI)

### 2.1 컬러 팔레트 (`src/styles/variables.css`)

| 용도 | 변수 | HEX |
|------|------|-----|
| 배경 (Primary) | `--color-white` | `#FFFFFF` |
| 로고 색상 | `--color-gray` | `#808080` |
| 텍스트 / 강조 | `--color-gray-dark` | `#4A4A4A` |
| 서브 배경 | `--color-gray-light` | `#F5F5F5` |
| 보조 텍스트 | `--color-gray-text` | `#A0A0A0` |
| 구분선 | `--color-border` | `#E8E8E8` |

기타 변수: `--header-height: 64px`, `--max-width: 1200px`, `--radius: 12px`, `--radius-pill: 28px`, `--shadow-sm`, `--shadow-md`.

### 2.2 타이포그래피

- **Primary Font:** `Inter` (`--font-family`)
- **섹션 제목(`.section-title`):** 1.75rem, 600 weight, letter-spacing 0.02em
- **섹션 부제(`.section-subtitle`):** 1rem, 300 weight

### 2.3 로고

| 위치 | 파일 |
|------|------|
| Header / Hero / Admin | `/assets/oatstone-logo.png` |
| Footer | `/assets/oatstone-logo-footer.png` |

## 3. 라우트 구조

```
/                        HomePage (싱글 페이지, 섹션 앵커: #hero #about #process #portfolio #contact)
/admin/login             AdminLogin
/admin                   → /admin/portfolio 로 리다이렉트
/admin/portfolio         AdminPortfolioList (JWT 필요)
/admin/portfolio/new     AdminPortfolioEditor — 신규 등록
/admin/portfolio/:id     AdminPortfolioEditor — 수정
*                        → / 로 리다이렉트
```

`/admin`, `/admin/portfolio*`는 `App.tsx`의 `ProtectedAdmin`이 `useAuth()`의 `token` 유무로 보호한다. 토큰이 없으면 `/admin/login`으로 이동.

## 4. 공개 사이트 섹션별 상세

### 4.1 Header

- **구성:** 로고 | 네비게이션(About, Process, Portfolio, Contact) | CTA 버튼("의뢰하기") | 모바일 햄버거
- **동작:** `useScrollSpy`로 현재 섹션에 `active` 클래스 부여, `scrollY > 20`이면 `header--scrolled` 클래스 추가
- **모바일:** 햄버거 클릭 → `MobileMenu` 풀스크린 오버레이 (열림 시 `body` 스크롤 잠금)
- **Sticky:** CSS로 상단 고정

### 4.2 Hero Section (`#hero`)

- OATSTONE 로고, 태그라인 "Outset · Attitude · Tone", 타이틀/설명, CTA 버튼(`#contact`로 스크롤)
- 장식용 pebble div 2개 (`hero__pebble--large/small`)

### 4.3 About Section (`#about`)

- 회사 소개 2문단 + "Outset / Attitude / Tone" 3개 가치 카드 (`ValueIcon` 사용)
- 2-column 그리드 (텍스트 + 카드), `useFadeIn`으로 진입 애니메이션

### 4.4 Process Section (`#process`)

- 5단계 타임라인 (하드코딩 상수, DB 없음): 의뢰 접수 → 현장 확인/실측 → 협의 → 도면 작성 → 3D 디자인 제공
- 각 단계: 번호 + 제목 + 설명, 마지막 단계 제외 연결선 표시

### 4.5 Portfolio Section (`#portfolio`)

- **데이터:** `useProjects` 훅이 `GET /api/projects`(목록) / `GET /api/projects/{id}`(상세)를 호출
- **그리드:** 정사각형 썸네일, hover 시 카테고리 + 제목 오버레이. 로딩 중 스켈레톤 7개, 에러 시 재시도 버튼, 빈 목록 안내 문구
- **상세 모달:** `React.lazy`로 지연 로드되는 `Modal` 컴포넌트. 대표 이미지 + 설명 + 태그 + 갤러리(`images[]`)
- **실패 처리:** 상세 조회 실패 시 `Toast`로 에러 안내(모달은 열지 않음)

### 4.6 Contact / Inquiry Section (`#contact`)

- **폼 필드:** 이름(text), 이메일(email), 연락처(tel), 프로젝트 유형(select), 메시지(textarea) — 모두 필수
- **프로젝트 유형 옵션:** 도면 작성(`drawing`), 3D 디자인(`3d`), 통합 패키지(`integrated`), 기타(`other`)
- **클라이언트 검증:** `useInquiries`가 제출 전 이름/이메일/연락처/메시지 길이·형식을 검사(백엔드 검증 규칙과 동일)
- **제출:** `POST /api/inquiries` → 성공 시 폼 초기화 + Toast, 실패 시 에러 Toast
- **연락처 정보:** 이메일(`oootn@naver.com`), 전화 2회선(하드코딩 상수 `CONTACT_PHONES`)

### 4.7 Footer

- 로고(`oatstone-logo-footer.png`) + Copyright 문구. SNS 링크 없음.

## 5. 관리자(Admin) 화면

포트폴리오 프로젝트를 등록·수정·삭제하고 이미지를 업로드하는 내부 관리 화면. 공개 네비게이션에는 노출되지 않는다.

### 5.1 인증

- `AdminLogin` → `POST /api/admin/login` (아이디/비밀번호) → JWT를 `localStorage`(`oatstone_admin_token`)에 저장
- `useAuth`(Context)가 앱 부팅 시 저장된 토큰으로 `GET /api/admin/me`를 호출해 유효성 확인, 실패 시 자동 로그아웃
- 이후 모든 `adminApi.ts` 요청에 `Authorization: Bearer <token>` 헤더 첨부, 401 응답 시 자동 로그아웃 후 로그인 페이지로 이동

### 5.2 AdminLayout

- 사이드바(로고, "포트폴리오" 메뉴, "사이트 보기" 링크, 로그아웃 버튼) + `<Outlet />`

### 5.3 AdminPortfolioList (`/admin/portfolio`)

- `GET /api/admin/projects` 테이블: 대표 이미지, 제목(+추천 뱃지), 카테고리, 이미지 수, 정렬 순서, 수정/삭제 액션
- 삭제 시 `window.confirm` 확인 후 `DELETE /api/admin/projects/{id}` (첨부 이미지 파일도 함께 삭제됨)

### 5.4 AdminPortfolioEditor (`/admin/portfolio/new`, `/admin/portfolio/:id`)

- **폼 필드:** 제목, 슬러그(신규일 때만 입력 가능, 비우면 자동 생성), 카테고리(`drawing`/`3d`/`integrated`), 정렬 순서, 설명, 태그(쉼표 구분), 추천 여부
- **신규 등록:** `POST /api/admin/projects` → 성공 시 선택된 이미지 파일을 이어서 업로드 → 상세 페이지로 리다이렉트
- **이미지 업로드:** `POST /api/admin/projects/{id}/images` (multipart). 새 이미지는 항상 기존 이미지 뒤(최댓값 `sort_order` + 1)부터 순서대로 추가됨. 서버가 반환한 `image_url`은 `/uploads/portfolio/{slug}/...` 경로
- **이미지 삭제 / 대표 지정:** `DELETE /api/admin/projects/{id}/images/{imageId}`, `PUT /api/admin/projects/{id}/thumbnail`

## 6. 컴포넌트 / 디렉터리 구조

```
src/
├── App.tsx                # 라우팅 (/, /admin/*)
├── main.tsx                # BrowserRouter + AuthProvider 부트스트랩
├── components/
│   ├── layout/
│   │   ├── Header.tsx / Header.css
│   │   ├── Footer.tsx / Footer.css
│   │   └── MobileMenu.tsx / MobileMenu.css
│   ├── sections/
│   │   ├── Hero.tsx, About.tsx, Process.tsx, Portfolio.tsx, Contact.tsx
│   │   └── (각 컴포넌트별 .css)
│   └── ui/
│       ├── Button.tsx, Card.tsx, Modal.tsx, Toast.tsx
│       └── LineIcon.tsx   # ValueIcon 등 인라인 SVG 아이콘
├── constants/
│   └── navigation.ts       # NAV_ITEMS, scrollToSection()
├── hooks/
│   ├── useAuth.tsx         # 관리자 인증 Context
│   ├── useFadeIn.ts        # IntersectionObserver 진입 애니메이션
│   ├── useInquiries.ts     # Contact 폼 상태·검증·제출
│   ├── useProjects.ts      # Portfolio 목록/상세 fetch 상태
│   └── useScrollSpy.ts     # 네비게이션 active 표시
├── data/
│   ├── portfolio-manifest.json  # 시드용 프로젝트/이미지 매니페스트 (백엔드 app/seed.py가 읽음)
│   └── portfolio.ts, portfolioData.ts  # 레거시 Mock fetch 구현 — 현재 어떤 컴포넌트에서도 import하지 않음(미사용)
├── pages/
│   ├── HomePage.tsx
│   └── admin/
│       ├── AdminLayout.tsx, AdminLogin.tsx
│       ├── AdminPortfolioList.tsx, AdminPortfolioEditor.tsx
│       └── admin.css
├── services/
│   ├── api.ts               # 공개 API (health, projects, inquiries)
│   └── adminApi.ts          # 관리자 API (JWT 첨부, 401 처리)
├── utils/
│   └── validationMessages.ts  # 서버 422 오류 → 한글 메시지 변환
└── styles/
    ├── variables.css
    └── global.css
```

## 7. API 연동

### 7.1 공개 API (`services/api.ts`)

| Method | Endpoint | 용도 |
|--------|----------|------|
| GET | `/api/health` | 헬스 체크(직접 호출부 없음) |
| GET | `/api/projects` | 포트폴리오 목록 |
| GET | `/api/projects/{id}` | 프로젝트 상세 |
| POST | `/api/inquiries` | 의뢰 문의 제출 |

### 7.2 관리자 API (`services/adminApi.ts`, 전부 `Authorization: Bearer` 필요)

| Method | Endpoint | 용도 |
|--------|----------|------|
| POST | `/api/admin/login` | 로그인 → JWT 발급 |
| GET | `/api/admin/me` | 토큰 유효성 확인 |
| GET | `/api/admin/projects` | 관리자용 프로젝트 목록 |
| GET | `/api/admin/projects/{id}` | 관리자용 프로젝트 상세 |
| POST | `/api/admin/projects` | 프로젝트 생성 |
| PUT | `/api/admin/projects/{id}` | 프로젝트 수정 |
| DELETE | `/api/admin/projects/{id}` | 프로젝트 삭제 |
| POST | `/api/admin/projects/{id}/images` | 이미지 업로드(다중) |
| DELETE | `/api/admin/projects/{id}/images/{imageId}` | 이미지 삭제 |
| PUT | `/api/admin/projects/{id}/thumbnail` | 대표 이미지 지정 |

상세 요청/응답 스키마는 `docs/backend.md` 참고.

- **Base URL:** 개발 환경은 비워 두면 Vite가 `/api`, `/uploads`를 `http://localhost:8000`으로 프록시(`vite.config.ts`). 프론트를 다른 출처에서 띄울 때만 `VITE_API_URL`을 절대경로로 지정.
- **오류 처리:** `utils/validationMessages.ts`의 `parseApiError()`가 FastAPI 422 응답(`detail`)을 한글 메시지로 변환.

## 8. 반응형 브레이크포인트

| 이름 | 범위 |
|------|------|
| mobile | ≤ 768px |
| desktop | > 768px |

CSS 전반에 단일 브레이크포인트(`max-width: 768px`)만 사용한다.

## 9. 애니메이션 & 인터랙션

- 섹션 진입: `useFadeIn`(IntersectionObserver) → `.fade-in.visible`로 opacity/translateY 전환
- Portfolio 모달: `React.lazy` + `Suspense`로 지연 로드, ESC/backdrop 클릭으로 닫힘
- 스크롤: `html { scroll-behavior: smooth }` + `scrollToSection()`
- Toast: 4초 후 자동 닫힘

## 10. 접근성 (a11y)

- 시맨틱 HTML (`header`, `main`, `section`, `footer`)
- 폼 `label`-`input` 연결, 모달/메뉴에 `role="dialog"` + `aria-modal`
- 이미지 `alt`, 버튼 `aria-label`(로고, 햄버거 등)
- 키보드: 모달 ESC 닫기

## 11. 성능

- 포트폴리오 이미지 `loading="lazy"`
- 코드 스플리팅: `Modal`을 `React.lazy`로 분리
- 인증 확인 실패 시 자동 로그아웃으로 불필요한 관리자 요청 방지
