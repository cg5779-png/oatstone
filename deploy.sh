#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/oatstone.co.kr"

echo "[deploy] start $(date -Is)"

if [ ! -d "$APP_DIR/.git" ]; then
  echo "[deploy] ERROR: $APP_DIR 에 git 저장소가 없습니다."
  echo "[deploy] 서버에서 한 번만 실행하세요:"
  echo "  git clone https://github.com/cg5779-png/oatstone.git $APP_DIR"
  exit 1
fi

cd "$APP_DIR"

# 이전 배포가 남긴 미추적 deploy.sh 때문에 pull이 막히지 않게 한다.
rm -f "$APP_DIR/deploy.sh"

echo "[deploy] git pull origin main"
git fetch origin main
git pull origin main

if [ -x "$APP_DIR/backend/venv/bin/pip" ]; then
  PIP="$APP_DIR/backend/venv/bin/pip"
  PYTHON="$APP_DIR/backend/venv/bin/python"
elif [ -x "$APP_DIR/venv/bin/pip" ]; then
  PIP="$APP_DIR/venv/bin/pip"
  PYTHON="$APP_DIR/venv/bin/python"
else
  PIP="pip"
  PYTHON="python3"
fi

echo "[deploy] pip install -r backend/requirements.txt"
"$PIP" install -r backend/requirements.txt

echo "[deploy] alembic upgrade head"
cd "$APP_DIR/backend"
"$PYTHON" -m alembic upgrade head
cd "$APP_DIR"

if [ -f frontend/package.json ]; then
  echo "[deploy] frontend build"
  cd frontend
  npm ci
  npm run build
  cd "$APP_DIR"
fi

echo "[deploy] pm2 restart all"
pm2 restart all

echo "[deploy] success $(date -Is)"
