#!/usr/bin/env bash
set -euo pipefail
python -m pip install 'uv==0.12.5'
uv sync --frozen --no-dev
npm --prefix web ci
npm --prefix web run build
