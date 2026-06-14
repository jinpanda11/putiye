#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${PUTIYUAN_APP_DIR:-/opt/putiyuan/current}"
BRANCH="${PUTIYUAN_BRANCH:-main}"
SERVICE="${PUTIYUAN_SERVICE:-putiyuan.service}"
PYTHON_BIN="${PUTIYUAN_PYTHON_BIN:-python3}"
FORCE=0

if [[ "${1:-}" == "--force" ]]; then
  FORCE=1
fi

LOCK_FILE="/tmp/putiyuan-update.lock"
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  echo "[putiyuan-update] another update is running"
  exit 0
fi

cd "$APP_DIR"

if [[ ! -d .git ]]; then
  echo "[putiyuan-update] $APP_DIR is not a git repository"
  exit 1
fi

git fetch --prune origin "$BRANCH"
LOCAL_REV="$(git rev-parse HEAD)"
REMOTE_REV="$(git rev-parse "origin/$BRANCH")"

if [[ "$FORCE" != "1" && "$LOCAL_REV" == "$REMOTE_REV" ]]; then
  echo "[putiyuan-update] no update: $LOCAL_REV"
  exit 0
fi

if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
  echo "[putiyuan-update] local tracked files changed; refusing to pull"
  git status --short
  exit 1
fi

echo "[putiyuan-update] updating $LOCAL_REV -> $REMOTE_REV"
git pull --ff-only origin "$BRANCH"

"$PYTHON_BIN" -m py_compile server.py
systemctl restart "$SERVICE"
systemctl --no-pager --full status "$SERVICE" | sed -n '1,12p'

echo "[putiyuan-update] done"
