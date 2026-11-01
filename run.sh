#!/usr/bin/env bash
# Usage: ./run.sh <scenario>   e.g. ./run.sh 1-nested   (no argument = all four)
# Starts the local @acme registry, then for each scenario: a fresh install,
# the installed tree, and the app's output.
set -uo pipefail
cd "$(dirname "$0")"
[ -d tarballs ] || ./pack.sh >/dev/null

node registry.mjs & REGISTRY=$!
trap 'kill $REGISTRY 2>/dev/null' EXIT
sleep 0.5

run() {
  echo "==================== $1"
  ( cd "scenarios/$1"
    command rm -rf node_modules package-lock.json
    echo "## npm install"
    npm install --no-audit --no-fund --loglevel=error || exit
    echo; echo "## npm ls @acme/theme"
    npm ls @acme/theme
    echo "## node main.js"
    node main.js )
  echo
}

if [ $# -gt 0 ]; then run "$1"; else for s in scenarios/*/; do run "$(basename "$s")"; done; fi
