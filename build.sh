#!/usr/bin/env bash
# ═══════════════════════════════════════════════
# NAIJAGAZ build — compiles the Wasm core and
# stages /docs/ for GitHub Pages deployment.
# ═══════════════════════════════════════════════

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
CRATE="$ROOT/crates/naijagaz-core"
OUT="$ROOT/docs/pkg/naijagaz_core"

cmd="${1:-all}"

build_core() {
  echo "─── building naijagaz-core (Rust → Wasm) ───"
  cd "$CRATE"
  wasm-pack build --target web --out-dir pkg --release
  mkdir -p "$OUT"
  cp pkg/naijagaz_core.js "$OUT/"
  cp pkg/naijagaz_core_bg.wasm "$OUT/"
  cp pkg/naijagaz_core.d.ts "$OUT/" 2>/dev/null || true
  cp pkg/naijagaz_core_bg.wasm.d.ts "$OUT/" 2>/dev/null || true
  size=$(wc -c < pkg/naijagaz_core_bg.wasm | awk '{print int($1/1024)}')
  echo "  → ${size}KB Wasm copied to docs/pkg/naijagaz_core/"
}

stamp_sw() {
  echo "─── stamping service worker cache version ───"
  local v
  v=$(git rev-parse --short HEAD 2>/dev/null || date +%Y%m%d%H%M)
  if [[ "$(uname)" == "Darwin" ]]; then
    sed -i '' "s/const CACHE = '[^']*'/const CACHE = 'ng-$v'/" "$ROOT/docs/sw.js"
  else
    sed -i "s/const CACHE = '[^']*'/const CACHE = 'ng-$v'/" "$ROOT/docs/sw.js"
  fi
  echo "  → CACHE = ng-$v"
}

run_tests() {
  echo "─── cargo test ───"
  cd "$ROOT"
  cargo test --workspace
}

serve() {
  local port="${PORT:-8088}"
  echo "─── serving docs/ at http://localhost:$port ───"
  cd "$ROOT/docs"
  python3 -m http.server "$port"
}

case "$cmd" in
  core)  build_core ;;
  sw)    stamp_sw ;;
  test)  run_tests ;;
  serve) build_core; stamp_sw; serve ;;
  all)   build_core; stamp_sw ;;
  *)
    echo "usage: $0 [all|core|sw|test|serve]"
    exit 1
    ;;
esac

echo "─── done ───"
