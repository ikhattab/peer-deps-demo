#!/usr/bin/env bash
# Packs each demo package into tarballs/. The scenarios install these
# tarballs the same way they'd install published versions from a registry.
set -euo pipefail
cd "$(dirname "$0")"
command rm -rf tarballs && mkdir tarballs
for pkg in theme-v1 theme-v2 ui-v1 ui-v2 ui-v3; do
  (cd "packages/$pkg" && npm pack --silent --pack-destination ../../tarballs >/dev/null)
done
ls tarballs
