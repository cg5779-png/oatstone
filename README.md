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

## 배포 (GitHub Actions → EC2 / PM2)

`main`에 푸시하면 [Deploy](../.github/workflows/deploy.yml) 워크플로가 SSH로 서버에 접속해 `deploy.sh`를 실행합니다. 성공·실패는 GitHub Actions 탭에서 확인할 수 있습니다.

필요한 Secrets: `SERVER_HOST`, `SERVER_USER`, `SERVER_SSH_KEY`

서버에 저장소가 아직 없다면 최초 한 번:

```bash
git clone https://github.com/cg5779-png/oatstone.git /var/www/oatstone
```

이후 푸시마다 `deploy.sh`가 서버에 복사되고 (`/var/www/oatstone/deploy.sh`), `git pull` → `pip install` → `alembic upgrade head` → 프론트 빌드 → `pm2 restart all` 순으로 배포됩니다.

## 명세서

| 문서 | 설명 |
|------|------|
| [docs/front.md](docs/front.md) | 프론트엔드 명세서 |
| [docs/backend.md](docs/backend.md) | 백엔드 명세서 |
| [docs/db.md](docs/db.md) | DB 설계 명세서 |
| [docs/guide.md](docs/guide.md) | 전체 프로젝트 가이드 |

© 2026 OATSTONE
