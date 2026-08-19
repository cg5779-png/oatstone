# OATSTONE — Corporate Website

React + FastAPI. 로컬은 SQLite, 서버는 PostgreSQL.

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

## 배포 (GitHub Actions)

`main`에 푸시하면 CI가 프론트 빌드·백엔드 기동을 확인하고, 통과 시 Docker 이미지를 `ghcr.io/cg5779-png/oatstone` 에 올립니다.

서버에서 최초 한 번:

```bash
git clone https://github.com/cg5779-png/oatstone.git
cd oatstone
cp deploy/env.example .env
# .env 값을 실제 비밀번호·도메인·SMTP로 수정
docker compose pull
docker compose up -d
```

이후 배포는 `main` 푸시 후 서버에서 `docker compose pull && docker compose up -d` 이면 됩니다. GitHub Packages가 private이면 서버에서 `ghcr.io` 로그인이 필요합니다.

## 명세서

| 문서 | 설명 |
|------|------|
| [docs/front.md](docs/front.md) | 프론트엔드 명세서 |
| [docs/backend.md](docs/backend.md) | 백엔드 명세서 |
| [docs/db.md](docs/db.md) | DB 설계 명세서 |
| [docs/guide.md](docs/guide.md) | 전체 프로젝트 가이드 |

© 2026 OATSTONE
