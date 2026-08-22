#!/usr/bin/env bash
cd "$(dirname "$0")"
echo "ASCEND // SYSTEM v0.6.0.4 // SHAREABLE ENCRYPTED BETA"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 20+ is required."
  exit 1
fi
( sleep 1; command -v open >/dev/null && open http://localhost:3000 ) &
node server.mjs
