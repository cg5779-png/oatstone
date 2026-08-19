#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/oatstone.co.kr"
VENV_DIR="$APP_DIR/backend/venv"

echo "[deploy] start $(date -Is)"

# GitHub Actions SSH는 로그인 셸이 아니라 PATH가 짧다.
# /etc/profile 은 읽지 않는다. set -u 와 debuginfod.sh 의 DEBUGINFOD_URLS 가 충돌한다.
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:${HOME}/.npm-global/bin:${HOME}/.local/bin:${PATH:-}"
if [ -s "${HOME}/.nvm/nvm.sh" ]; then
  set +u
  # shellcheck disable=SC1091
  . "${HOME}/.nvm/nvm.sh"
  nvm use default >/dev/null 2>&1 || nvm use node >/dev/null 2>&1 || true
  set -u
fi
if [ -d "${HOME}/.nvm/versions/node" ]; then
  for _nvm_bin in "${HOME}/.nvm/versions/node/"*/bin; do
    if [ -d "$_nvm_bin" ]; then
      PATH="${_nvm_bin}:${PATH}"
    fi
  done
  unset _nvm_bin
  export PATH
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

has_pip() {
  local py="$1"
  "$py" -m pip --version >/dev/null 2>&1
}

python_from_pm2() {
  command -v pm2 >/dev/null 2>&1 || return 1
  pm2 jlist 2>/dev/null | python3 -c '
import json, sys
try:
    apps = json.load(sys.stdin)
except Exception:
    sys.exit(1)
if not isinstance(apps, list):
    sys.exit(1)
for app in apps:
    env = app.get("pm2_env") or {}
    interp = env.get("exec_interpreter") or ""
    if "python" in interp:
        print(interp)
        sys.exit(0)
sys.exit(1)
' 2>/dev/null
}

pick_python() {
  local candidate
  for candidate in \
    "$VENV_DIR/bin/python" \
    "$APP_DIR/backend/.venv/bin/python" \
    "$APP_DIR/venv/bin/python" \
    "$APP_DIR/.venv/bin/python"
  do
    if [ -x "$candidate" ]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done
  if candidate="$(python_from_pm2)"; then
    if [ -x "$candidate" ] || command -v "$candidate" >/dev/null 2>&1; then
      printf '%s\n' "$candidate"
      return 0
    fi
  fi
  for candidate in python3 python; do
    if command -v "$candidate" >/dev/null 2>&1; then
      command -v "$candidate"
      return 0
    fi
  done
  return 1
}

install_python_pip() {
  if ! command -v sudo >/dev/null 2>&1; then
    return 1
  fi
  if ! sudo -n true >/dev/null 2>&1; then
    echo "[deploy] sudo 암호가 필요해서 python3-pip 자동 설치를 건너뜁니다."
    return 1
  fi
  # Amazon Linux는 dnf. 패키지가 없거나 권한이 없어도 배포가 멈추지 않게 한다.
  if command -v dnf >/dev/null 2>&1; then
    echo "[deploy] dnf install python3-pip python3-venv"
    sudo -n dnf install -y python3-pip python3-venv || sudo -n dnf install -y python3-pip || true
    return 0
  fi
  if command -v apt-get >/dev/null 2>&1; then
    echo "[deploy] apt-get install python3-pip python3-venv"
    sudo -n apt-get update -qq || true
    sudo -n DEBIAN_FRONTEND=noninteractive apt-get install -y python3-pip python3-venv || true
    return 0
  fi
  return 1
}

ensure_venv() {
  local base_python="$1"
  if [ -x "$VENV_DIR/bin/python" ]; then
    printf '%s\n' "$VENV_DIR/bin/python"
    return 0
  fi
  echo "[deploy] creating $VENV_DIR"
  if ! "$base_python" -m venv "$VENV_DIR"; then
    return 1
  fi
  printf '%s\n' "$VENV_DIR/bin/python"
}

if ! PYTHON="$(pick_python)"; then
  echo "[deploy] ERROR: python3를 찾을 수 없습니다."
  echo "[deploy] PATH=$PATH"
  exit 1
fi

echo "[deploy] python: $PYTHON ($("$PYTHON" --version 2>&1))"

if ! has_pip "$PYTHON"; then
  install_python_pip || true
fi

if ! has_pip "$PYTHON"; then
  if NEW_PYTHON="$(ensure_venv "$PYTHON")" && has_pip "$NEW_PYTHON"; then
    PYTHON="$NEW_PYTHON"
    echo "[deploy] python: $PYTHON (venv)"
  fi
fi

SKIP_BACKEND=0
if ! has_pip "$PYTHON"; then
  echo "[deploy] WARN: pip가 없어 백엔드 설치/마이그레이션을 건너뜁니다. 프론트 빌드와 pm2 restart는 진행합니다."
  SKIP_BACKEND=1
fi

if [ "$SKIP_BACKEND" -eq 0 ]; then
  echo "[deploy] pip install -r backend/requirements.txt"
  if ! "$PYTHON" -m pip install -r backend/requirements.txt; then
    echo "[deploy] retry pip install --user"
    "$PYTHON" -m pip install --user -r backend/requirements.txt
  fi

  echo "[deploy] alembic upgrade head"
  cd "$APP_DIR/backend"
  "$PYTHON" -m alembic upgrade head
  cd "$APP_DIR"
fi

if [ -f frontend/package.json ]; then
  echo "[deploy] frontend build"
  cd frontend
  npm ci
  npm run build
  cd "$APP_DIR"
fi

ensure_pm2() {
  if command -v pm2 >/dev/null 2>&1; then
    return 0
  fi
  local candidate
  for candidate in \
    "${HOME}/.npm-global/bin/pm2" \
    "${HOME}/.local/bin/pm2" \
    /usr/local/bin/pm2 \
    /usr/bin/pm2
  do
    if [ -x "$candidate" ]; then
      PATH="$(dirname "$candidate"):${PATH}"
      export PATH
      return 0
    fi
  done
  echo "[deploy] pm2 not found, installing to ${HOME}/.npm-global (no root)..."
  mkdir -p "${HOME}/.npm-global"
  npm install -g pm2 --prefix "${HOME}/.npm-global"
  PATH="${HOME}/.npm-global/bin:${PATH}"
  export PATH
  hash -r 2>/dev/null || true
  command -v pm2 >/dev/null 2>&1
}

if ! ensure_pm2; then
  echo "[deploy] ERROR: pm2를 설치하지 못했습니다."
  exit 1
fi
echo "[deploy] pm2: $(command -v pm2)"
ECOSYSTEM="$APP_DIR/ecosystem.config.cjs"
if pm2 describe oatstone >/dev/null 2>&1; then
  echo "[deploy] pm2 restart oatstone"
  pm2 restart oatstone --update-env
else
  echo "[deploy] no existing pm2 process, starting new"
  pm2 start "$ECOSYSTEM"
fi
pm2 save

echo "[deploy] success $(date -Is)"
