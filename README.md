# NaijaGaz

> Cooking gas, almost instantly. PWA + Wasm core + WhatsApp-first ordering.

**Live:** https://obiverse.github.io/naijagaz/

This repo holds the customer-facing PWA and the Apps Script broker that
bridges it to the operator's Google Sheet. See
[docs/naijagaz-whitepaper-v2.md](docs/naijagaz-whitepaper-v2.md) for the
full grimoire (currently at v2.4).

## Order channels

[docs/config.js](docs/config.js) exports `ORDER_MODE`:

- `'whatsapp'` (default) — `Place order` opens WhatsApp at `+12409750431`
  with a structured prefilled message. Operator pastes into the Sheet.
  Zero infrastructure to test end-to-end.
- `'broker'` — POSTs to the Apps Script Web App. Auto SMS via Termii.
  Requires the broker setup ([apps-script/README.md](apps-script/README.md)).

Flip the switch when ready to scale; nothing else changes.

## Architecture

```
Customer phone (PWA, offline-capable)
   │
   │  static HTML + Rust→Wasm core (~31KB)
   │  hosted on GitHub Pages, served from /docs/
   │
   ▼
Apps Script Web App  ──►  Google Sheet (orders, customers, riders, vendors)
   │
   │  on status edit
   ▼
Termii SMS  ──►  Customer / rider phone
```

The Wasm core ([crates/naijagaz-core/src/lib.rs](crates/naijagaz-core/src/lib.rs))
is pure logic — pricing, validation, formatting, refill cadence. It compiles
to a portable artifact that survives the Phase 1 migration to Postgres.

## Local development

Prerequisites: Rust stable, `wasm-pack`, Python 3 (for the dev server).

```bash
# Build the Wasm core, copy artifacts to docs/pkg/, stamp SW cache
./build.sh

# Build + serve at http://localhost:8088 (override with PORT=...)
./build.sh serve

# Just run the Rust tests
./build.sh test
```

## Deployment

### One-time setup

1. **Apps Script broker** — follow [apps-script/README.md](apps-script/README.md)
   to create the Sheet, deploy the Web App, set Script Properties, and wire
   triggers. Get the deployed `/exec` URL.
2. **Paste broker URL** into [docs/config.js](docs/config.js).
3. **GitHub Pages** — repository **Settings → Pages → Source: GitHub Actions**.
4. **Custom domain** (optional) — add `naijagaz.ng` in the same Pages settings;
   point DNS `A` records to GitHub Pages IPs and create a `CNAME` file at the
   repo root with `naijagaz.ng` inside.

### Subsequent deploys

```bash
git push origin main
```

Pages currently builds in **legacy / branch mode** from `main:/docs/`
(takes ~30-60s after each push). The Wasm artifacts in `docs/pkg/` are
checked in, so no Actions runner is required.

The [.github/workflows/deploy.yml](.github/workflows/deploy.yml) workflow
is wired up to take over once Actions is unblocked on the repo's owning
account. To switch back: GitHub repo → Settings → Pages → Source →
"GitHub Actions". The workflow runs `cargo test`, builds the Wasm fresh,
and publishes — useful for catching crate-level regressions in CI.

## File map

```
Cargo.toml                          workspace root
crates/naijagaz-core/               Rust → Wasm business logic
  src/lib.rs                          pricing, validation, naira format, refill cadence
  Cargo.toml
docs/                               GitHub Pages root (the PWA)
  index.html                          landing
  order.html                          4-step order flow
  track.html                          status timeline (?id=NG-…)
  again.html                          1-tap reorder
  shell.js                            Wasm boot + DOM bridge + draft persistence
  config.js                           BROKER_URL placeholder
  sw.js                               network-first service worker
  manifest.webmanifest                PWA manifest
  css/base.css                        cobalt + ember on ivory, mobile-first
  icon.svg / logo.svg                 the vesica flame
  pkg/naijagaz_core/                  wasm-pack output (generated, gitignored)
  naijagaz-whitepaper-v2.md           the grimoire
apps-script/
  Code.gs                             the broker (paste into Apps Script editor)
  README.md                           setup steps
build.sh                            build orchestration
.github/workflows/deploy.yml        Pages deployment
```

## Phase 0 success criteria

Per §18 of the whitepaper, by Day 60:
- 400+ completed orders
- 50%+ repeat customer rate
- 25%+ T6 (refill nudge) conversion
- Average rating ≥4.5
- Zero safety incidents
- Vendor relationship intact and profitable for vendor

If we hit these, we raise for Phase 1 (the cylinder swap pool).
If we miss, we debug honestly. No mercy.
