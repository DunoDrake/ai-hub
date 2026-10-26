#!/usr/bin/env bash
# Start AI Hub: local manager for Backlog.md project boards.
# Usage: ./start.sh [port]
# Env overrides: PORT, AI_HUB_DATA_DIR, BACKLOG_BIN, AI_HUB_DASH_FROM, AI_HUB_DASH_TO
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT="${1:-${PORT:-4880}}"

if ! command -v node >/dev/null 2>&1; then
	echo "Node.js is required but was not found in PATH." >&2
	exit 1
fi
if ! command -v "${BACKLOG_BIN:-backlog}" >/dev/null 2>&1; then
	echo "Backlog.md CLI not found. Install it: npm i -g backlog.md" >&2
	exit 1
fi

echo "Starting AI Hub on http://127.0.0.1:${PORT}/ (Ctrl+C to stop)"
exec env PORT="$PORT" node "$HERE/server.mjs"
