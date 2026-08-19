#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/oatstone.co.kr"

echo "[deploy] start $(date -Is)"

# GitHub Actions SSH는 로그인 셸이 아니라 PATH가 짧다.
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:${HOME}/.local/bin:${PATH:-}"
if [ -f /etc/profile ]; then
  # shellcheck disable=SC1091
  . /etc/profile
fi
if [ -f "${HOME}/.profile" ]; then
  # shellcheck disable=SC1090
  . "${HOME}/.profile"
fi
if [ -s "${HOME}/.nvm/nvm.sh" ]; then
  # shellcheck disable=SC1091
  . "${HOME}/.nvm/nvm.sh"
fi

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

pick_python() {
  local candidate
  for candidate in \
    "$APP_DIR/backend/venv/bin/python" \
    "$APP_DIR/backend/.venv/bin/python" \
    "$APP_DIR/venv/bin/python" \
    "$APP_DIR/.venv/bin/python"
  do
    if [ -x "$candidate" ]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done
  for candidate in python3 python; do
    if command -v "$candidate" >/dev/null 2>&1; then
      command -v "$candidate"
      return 0
    fi
  done
  return 1
}

if ! PYTHON="$(pick_python)"; then
  echo "[deploy] ERROR: python3를 찾을 수 없습니다."
  echo "[deploy] PATH=$PATH"
  exit 1
fi

echo "[deploy] python: $PYTHON ($("$PYTHON" --version 2>&1))"
echo "[deploy] pip install -r backend/requirements.txt"
if ! "$PYTHON" -m pip --version >/dev/null 2>&1; then
  echo "[deploy] ERROR: $PYTHON 에 pip 모듈이 없습니다. 서버에 python3-pip를 설치하거나 backend/venv를 만들어 주세요."
  exit 1
fi
"$PYTHON" -m pip install -r backend/requirements.txt

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
