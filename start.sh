#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
command -v node >/dev/null 2>&1 || { echo "Node.js 18+ is required."; exit 1; }
if [ ! -f "node_modules/express/package.json" ]; then npm install; fi
npm start
