#!/usr/bin/env bash
# run_pipeline.sh <workdir> — compute metrics/tables and render charts for a fetched ticker.
# Needs uv (deps are resolved on the fly, nothing is installed globally).
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORK="${1:?usage: run_pipeline.sh <workdir>}"
export PYTHONDONTWRITEBYTECODE=1
DEPS=(--with pandas --with numpy --with matplotlib --with seaborn)
uv run -q "${DEPS[@]}" python "$DIR/analyze.py" "$WORK"
MPLBACKEND=Agg uv run -q "${DEPS[@]}" python "$DIR/charts.py" "$WORK" 2>&1 | grep -v -i "warning" || true
ls "$WORK"/charts
