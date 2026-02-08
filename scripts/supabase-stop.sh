#!/usr/bin/env bash
# Stop local Supabase. On CLI 502, fall back to stopping containers via Docker.
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/backend"

if supabase stop 2>/dev/null; then
  echo "Supabase stopped."
  exit 0
fi

echo "supabase stop failed (e.g. 502); stopping containers via Docker..."

# Stop by compose project (Supabase CLI uses directory or project_id from config.toml)
for project in backend agentpress supabase; do
  if docker compose -p "$project" down 2>/dev/null; then
    echo "Stopped compose project: $project"
    exit 0
  fi
done

# Fallback: stop containers whose image name contains supabase
IDS=$(docker ps -a --format '{{.ID}} {{.Image}}' | grep -i supabase | awk '{print $1}' || true)
if [ -n "$IDS" ]; then
  echo "$IDS" | xargs docker rm -f
  echo "Stopped Supabase containers."
fi

echo "Done."
