#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../../lsv-backend"
API_PORT=3001 NODE_ENV=test node --env-file=../.env.test dist/main.js
