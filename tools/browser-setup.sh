#!/usr/bin/env bash
# One-time local browser setup for KIRITSU QA. Runtime bundle stays zero-dep.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PLAYWRIGHT_BROWSERS_PATH="$(cd "$ROOT/.." && pwd)/.kiritsu-browsers"
echo "browser cache: $PLAYWRIGHT_BROWSERS_PATH"
cd "$ROOT"
npx playwright install chromium
