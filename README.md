# OATSTONE — Corporate Website

React + FastAPI + SQLite 기반 OATSTONE 회사 홈페이지

## 실행

프로젝트 루트에서:

```bash
npm run dev
```

Windows: `start.bat` 더블클릭

> `npm run dev` 실행 시 패키지 설치(최초·변경 시) → Backend + Frontend 서버 실행 → 브라우저 자동 열기까지 한 번에 진행됩니다.
>
> 최초 실행 전 `backend/.env.example`을 `backend/.env`로 복사하고 SMTP·관리자 계정 값을 채워야 문의 메일 발송과 관리자 로그인이 동작합니다.

| URL | 설명 |
|-----|------|
| http://localhost:5173 | 웹사이트 |
| http://localhost:5173/admin/login | 관리자 로그인 (포트폴리오 등록/수정) |
| http://localhost:8000/docs | API 문서 |

## 명세서

| 문서 | 설명 |
|------|------|
| [docs/front.md](docs/front.md) | 프론트엔드 명세서 |
| [docs/backend.md](docs/backend.md) | 백엔드 명세서 |
| [docs/db.md](docs/db.md) | DB 설계 명세서 |
| [docs/guide.md](docs/guide.md) | 전체 프로젝트 가이드 |

## 배포

이 저장소에는 배포 자동화(CI/CD)가 구성되어 있지 않습니다. `main` push가 실제 서비스에 자동 반영되지 않으며, 수동 배포 절차는 [docs/backend.md](docs/backend.md#15-실행배포)를 참고하세요.

© 2026 OATSTONE
