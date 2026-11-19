#!/usr/bin/env bash
# run_pipeline.sh <workdir> — compute metrics/tables and render charts for a fetched ticker.
# Needs uv (deps are resolved on the fly, nothing is installed globally).
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORK="${1:?usage: run_pipeline.sh <workdir>}"
export PYTHONDONTWRITEBYTECODE=1
DEPS=(--with pandas --with numpy --with matplotlib --with seaborn)
# Stage the whole compute output so a render failure leaves the last run intact.
STAGING="$(mktemp -d "$WORK/.pipeline.XXXXXX")"
trap 'rm -rf -- "$STAGING"' EXIT
SUMMARY="$(uv run -q "${DEPS[@]}" python "$DIR/analyze.py" "$WORK" "$STAGING")"
MPLBACKEND=Agg uv run -q "${DEPS[@]}" python "$DIR/charts.py" "$WORK" "$STAGING"
shopt -s nullglob
PNGS=("$STAGING"/[0-9][0-9]_*.png)
[[ -s "$STAGING/metrics.json" && -s "$STAGING/tables.md" && ${#PNGS[@]} -eq 9 ]] || { echo "Pipeline incomplete: ${#PNGS[@]}/9 new charts" >&2; exit 1; }
for PNG in "${PNGS[@]}"; do [[ -s "$PNG" ]] || exit 1; done
mkdir -p "$WORK/charts"
mv -- "${PNGS[@]}" "$WORK/charts/"
mv -- "$STAGING/metrics.json" "$STAGING/tables.md" "$WORK/"
printf 'wrote %s and %s\n' "$WORK/metrics.json" "$WORK/tables.md"
for PNG in "${PNGS[@]}"; do printf '%s\n' "$WORK/charts/${PNG##*/}"; done
echo "$SUMMARY" | tail -1  # last line = score & verdict
