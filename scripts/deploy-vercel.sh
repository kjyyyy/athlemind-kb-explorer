#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if ! vercel whoami >/dev/null 2>&1; then
  echo "Run: vercel login"
  exit 1
fi

vercel link --yes 2>/dev/null || vercel link

: "${KB_API_URL:?Set KB_API_URL (terraform output kb_public_api_url)}"
: "${KB_API_TOKEN:?Set KB_API_TOKEN}"

printf '%s' "$KB_API_URL" | vercel env add KB_API_URL production --force
printf '%s' "$KB_API_TOKEN" | vercel env add KB_API_TOKEN production --force

vercel --prod
echo "Smoke: open deployment URL, ask 3 chat questions, confirm graph + drawer."