#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Please run as root: sudo bash scripts/deploy/install-vps.sh <repo-url> [branch]"
  exit 1
fi

REPO_URL="${1:-}"
BRANCH="${2:-main}"
APP_ROOT="${PUTIYUAN_APP_ROOT:-/opt/putiyuan}"
APP_DIR="$APP_ROOT/current"
DATA_DIR="${PUTIYUAN_DATA_DIR:-/var/lib/putiyuan}"
ENV_FILE="/etc/putiyuan.env"
SERVICE_USER="${PUTIYUAN_USER:-putiyuan}"

if [[ -z "$REPO_URL" ]]; then
  echo "Usage: sudo bash scripts/deploy/install-vps.sh <repo-url> [branch]"
  exit 1
fi

apt-get update
apt-get install -y git python3 ca-certificates util-linux

if ! id "$SERVICE_USER" >/dev/null 2>&1; then
  useradd --system --home "$APP_ROOT" --shell /usr/sbin/nologin "$SERVICE_USER"
fi

mkdir -p "$APP_ROOT" "$DATA_DIR"

if [[ ! -d "$APP_DIR/.git" ]]; then
  rm -rf "$APP_DIR"
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
else
  git -C "$APP_DIR" fetch --prune origin "$BRANCH"
  git -C "$APP_DIR" checkout "$BRANCH"
  git -C "$APP_DIR" pull --ff-only origin "$BRANCH"
fi

git config --system --add safe.directory "$APP_DIR" || true

if [[ ! -f "$ENV_FILE" ]]; then
  SECRET="$(python3 - <<'PY'
import secrets
print(secrets.token_urlsafe(48))
PY
)"
  cat > "$ENV_FILE" <<EOF
PUTIYUAN_HOST=127.0.0.1
PUTIYUAN_PORT=3000
PUTIYUAN_DB_PATH=$DATA_DIR/data.db
PUTIYUAN_SECRET_KEY=$SECRET
PUTIYUAN_APP_DIR=$APP_DIR
PUTIYUAN_BRANCH=$BRANCH
PUTIYUAN_SERVICE=putiyuan.service
EOF
fi

cp "$APP_DIR/scripts/deploy/putiyuan.service" /etc/systemd/system/putiyuan.service
cp "$APP_DIR/scripts/deploy/putiyuan-update.service" /etc/systemd/system/putiyuan-update.service
cp "$APP_DIR/scripts/deploy/putiyuan-update.timer" /etc/systemd/system/putiyuan-update.timer
chmod +x "$APP_DIR/scripts/deploy/putiyuan-update.sh"

chown -R "$SERVICE_USER:$SERVICE_USER" "$APP_ROOT" "$DATA_DIR"
chmod 640 "$ENV_FILE"

systemctl daemon-reload
systemctl enable --now putiyuan.service
systemctl enable --now putiyuan-update.timer

echo "Installed."
echo "Service: systemctl status putiyuan.service"
echo "Auto update timer: systemctl list-timers putiyuan-update.timer"
echo "Local app: http://127.0.0.1:3000/"
