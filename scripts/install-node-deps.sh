#!/bin/sh
set -eu

binary="$1"
lock_hash="$(sha256sum package-lock.json | cut -d ' ' -f 1)"

if [ ! -x "node_modules/.bin/$binary" ] || [ "$(cat node_modules/.lockfile-hash 2>/dev/null || true)" != "$lock_hash" ]; then
  npm install --prefer-offline --no-audit --no-fund
  printf '%s' "$lock_hash" > node_modules/.lockfile-hash
else
  echo "Dépendances déjà à jour."
fi
