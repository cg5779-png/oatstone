# OATSTONE 프론트엔드 개발 명세서

## 1. 개요

| 항목 | 내용 |
|------|------|
| 프로젝트명 | OATSTONE Corporate Website |
| 기술 스택 | React 18, Vite, TypeScript, CSS Modules |
| 디자인 방향 | Instagram 스타일 — 직관적, 심플, 이미지 중심 |
| 반응형 | 모바일 우선(Mobile First), 태블릿·데스크톱 지원 |

## 2. 브랜드 아이덴티티 (CI)

### 2.1 컬러 팔레트

| 용도 | 색상 | HEX |
|------|------|-----|
| 배경 (Primary) | White | `#FFFFFF` |
| 텍스트 / 로고 | Medium Gray | `#808080` |
| 서브 배경 | Light Gray | `#F5F5F5` |
| 강조 / CTA | Dark Gray | `#4A4A4A` |
| 보조 텍스트 | Light Text Gray | `#A0A0A0` |
| 구분선 | Border Gray | `#E8E8E8` |

### 2.2 타이포그래피

- **Primary Font:** `Inter` (Google Fonts) — 로고의 기하학적 산세리프와 유사
- **Heading:** 600–700 weight, letter-spacing 0.02em
- **Body:** 400 weight, line-height 1.6
- **Tagline:** 300 weight, 0.875rem

### 2.3 로고

- 경로: `/assets/oatstone-logo.png`
- 헤더: 높이 40px (모바일), 48px (데스크톱)
- 푸터: 높이 32px, opacity 0.8

## 3. 페이지 구조

```
/ (Single Page Application)
├── Header (Sticky)
├── Hero Section
├── About Section
├── Services Section
├── Process Section
├── Portfolio Section (Instagram Grid)
├── Contact / Inquiry Section
└── Footer
```

## 4. 섹션별 상세 명세

### 4.1 Header

- **구성:** 로고 | 네비게이션(About, Services, Process, Portfolio, Contact) | CTA 버튼("의뢰하기")
- **동작:** 스크롤 시 배경 blur + 하단 border
- **모바일:** 햄버거 메뉴 → 풀스크린 오버레이 네비게이션
- **Sticky:** `position: sticky; top: 0; z-index: 100`

### 4.2 Hero Section

- **레이아웃:** 전체 뷰포트 높이(min-height: 100vh), 중앙 정렬
- **콘텐츠:**
  - OATSTONE 로고 (대형)
  - Tagline: "Outset Attitude Tone"
  - 서브카피: "오트스톤. 공간을 설계하고, 미래를 디자인합니다."
  - CTA: "프로젝트 의뢰하기" → Contact 섹션 스크롤
- **배경:** 흰색 + 미세한 그라데이션 또는 pebble 형태 장식 SVG

### 4.3 About Section

- **목적:** OATSTONE이 어떤 회사인지 직관적으로 전달
- **콘텐츠:**
  - 회사 소개 문단
  - "Outset Attitude Tone" 의미 설명
  - 핵심 가치 3가지 (카드 형태)
- **레이아웃:** 2-column (텍스트 + 이미지/일러스트), 모바일 1-column

### 4.4 Services Section

- **제공 서비스 카드 (4개):**

| 서비스 | 설명 |
|--------|------|
| 현장 실측 | 현장 방문, 실측, 클라이언트 협의 |
| 도면 작성 | 평면도, 천정면도, 입면도, 단면도, 상세도 |
| 3D 디자인 | 아이소메트릭, 투시도, 조감도 |
| 통합 제공 | 도면 + 3D 디자인 패키지 |

- **UI:** Instagram 스토리 하이라lights 스타일 원형 아이콘 + 라벨 (모바일) / 카드 그리드 (데스크톱)

### 4.5 Process Section

- **워크플로우 5단계 (타임라인 UI):**

```
1. 의뢰 접수 → 2. 현장 확인/실측 → 3. 협의 → 4. 도면 작성 → 5. 3D 디자인 제공
```

- **UI:** 수평 스텝 (데스크톱) / 수직 타임라인 (모바일)
- 각 단계: 번호 + 제목 + 간략 설명

### 4.6 Portfolio Section

- **UI:** Instagram 피드 그리드
  - 3-column (데스크톱), 2-column (태블릿), 1-column (모바일)
  - 정사각형(1:1) 썸네일, hover 시 프로젝트명 + 카테고리 오버레이
- **데이터:** FastAPI `/api/projects` 에서 fetch
- **상세 모달:** 클릭 시 이미지 확대 + 프로젝트 설명 + 사용 도면/3D 타입 태그

### 4.7 Contact / Inquiry Section

- **폼 필드:**

| 필드 | 타입 | 필수 |
|------|------|------|
| 이름 | text | ✓ |
| 이메일 | email | ✓ |
| 연락처 | tel | ✓ |
| 프로젝트 유형 | select | ✓ |
| 메시지 | textarea | ✓ |

- **프로젝트 유형 옵션:** 도면 작성, 3D 디자인, 통합 패키지, 기타
- **제출:** POST `/api/inquiries` → 성공/실패 토스트 메시지
- **연락처 정보:** 이메일, 전화 (선택)

### 4.8 Footer

- 로고 + Tagline
- SNS 링크 (Instagram, Behance 등 — placeholder)
- Copyright © 2026 OATSTONE

## 5. 컴포넌트 구조

```
src/
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── MobileMenu.tsx
│   ├── sections/
│   │   ├── Hero.tsx
│   │   ├── About.tsx
│   │   ├── Services.tsx
│   │   ├── Process.tsx
│   │   ├── Portfolio.tsx
│   │   └── Contact.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Modal.tsx
│       └── Toast.tsx
├── hooks/
│   ├── useScrollSpy.ts
│   └── useInquiries.ts
├── services/
│   └── api.ts
├── styles/
│   ├── variables.css
│   └── global.css
├── App.tsx
└── main.tsx
```

## 6. API 연동

| Method | Endpoint | 용도 |
|--------|----------|------|
| GET | `/api/projects` | 포트폴리오 목록 |
| GET | `/api/projects/{id}` | 프로젝트 상세 |
| POST | `/api/inquiries` | 의뢰 문의 제출 |

- Base URL: `http://localhost:8000` (개발), 환경변수 `VITE_API_URL`로 관리

## 7. 반응형 브레이크포인트

| 이름 | 범위 |
|------|------|
| mobile | < 768px |
| tablet | 768px – 1024px |
| desktop | > 1024px |

## 8. 애니메이션 & 인터랙션

- 섹션 진입: fade-in + slide-up (Intersection Observer)
- 포트폴리오 hover: scale(1.02) + overlay fade
- 버튼 hover: background transition 200ms
- 스크롤: smooth scroll (CSS `scroll-behavior: smooth`)

## 9. 접근성 (a11y)

- 시맨틱 HTML (`header`, `main`, `section`, `footer`)
- 이미지 alt 텍스트
- 폼 label 연결
- 키보드 네비게이션 지원
- 색상 대비 WCAG AA 준수

## 10. 성능

- 이미지 lazy loading
- 코드 스플리팅 (React.lazy for Modal)
- Lighthouse 목표: Performance 90+, Accessibility 90+
