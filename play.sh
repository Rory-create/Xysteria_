#!/usr/bin/env bash
# Exodus Protocol — dev launcher
# Usage: ./play.sh [port]
# Pulls latest changes from the dev branch, starts a local server, opens browser.
# Closing the browser tab shuts the server down automatically.

set -e
REPO="$(cd "$(dirname "$0")" && pwd)"
BRANCH="claude/sprite-designer-seedship-game-aMvl3"
PORT="${1:-8420}"

cd "$REPO"

echo ""
echo "  ╔══════════════════════════════╗"
echo "  ║     Exodus Protocol          ║"
echo "  ╚══════════════════════════════╝"
echo ""

# Pull latest
echo "  Checking for updates on $BRANCH..."
git fetch origin "$BRANCH" --quiet 2>/dev/null || echo "  (offline — skipping fetch)"
git checkout "$BRANCH" --quiet 2>/dev/null
git merge --ff-only "origin/$BRANCH" --quiet 2>/dev/null \
  && echo "  Up to date." \
  || echo "  (could not fast-forward — local changes may exist)"

echo ""

# Launch dev server (opens browser + waits for tab close)
exec python3 "$REPO/devserver.py" "$PORT"
