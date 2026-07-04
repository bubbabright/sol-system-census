#!/usr/bin/env bash
# Deploy the static site to Cloudflare Pages via direct upload.
#
# `wrangler pages deploy <dir>` uploads the given directory as-is with no
# ignore-file support (unlike Workers static assets' .assetsignore) — so we
# can't just point it at the repo root, or worker/ and archive/ would get
# published as public static files. Stage only the real site files into a
# throwaway temp dir instead.
set -euo pipefail
cd "$(dirname "$0")"

STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

cp index.html app.js data.js portrait.js styles.css "$STAGE/"

npx wrangler pages deploy "$STAGE" --project-name=sol-system-census "$@"
