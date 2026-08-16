#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export BUTLER_UI_MODE="desktop"
export BUTLER_NO_BROWSER="1"
if [[ "${1:-}" != "--lan" && -z "${BUTLER_BIND:-}" ]]; then
  export BUTLER_BIND="127.0.0.1"
fi
exec python3 server/run_server_safe.py "$@"
