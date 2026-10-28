#!/usr/bin/env bash
# Captures the three procedural arenas from the standalone combat (dev server on :5173).
OUT=${1:-/tmp/arena-shots}; mkdir -p "$OUT"
for scene in forest_route bois_clair_burning lion_sanctum; do
  PW_CHROMIUM=${PW_CHROMIUM:-/opt/pw-browsers/chromium} node "$(dirname "$0")/capture.mjs" \
    "http://127.0.0.1:5173/legacy-combat.html?qa=1&scene=$scene" "$OUT/$scene.png" 9000 \
    "document.querySelector('[data-qa=prepare]')?.click(); document.querySelectorAll('#tutorial button, #boss-tutorial button').forEach(b=>b.click())"
done
