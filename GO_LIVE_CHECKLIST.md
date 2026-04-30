# NaijaGaz — Go-Live Checklist

The PWA is live and stable. Below is everything to do before you serve
your first paying customer in Lugbe / Kubwa / Nyanya / Gwarinpa.

Cross items off as you complete them. Items marked **🔴 BLOCKER** must
ship before customer #1.

---

## Phase 0 — pre-launch

### Software (already shipped ✓)

- [x] PWA live at https://obiverse.github.io/naijagaz/
- [x] Wasm core (28KB, 9 tests passing) — pricing, naira, phone, refill cadence
- [x] Theme system (light + dark + system, persisted)
- [x] WhatsApp dual-operator routing (NG + US lines)
- [x] Order history + reorder + tracking + admin dashboard
- [x] Address book (saved addresses, default, quick-pick)
- [x] Pidgin (PCM) localization
- [x] Capability-token order IDs (un-enumerable)
- [x] Web Share API on success step
- [x] Mark-as-delivered for WhatsApp orders
- [x] iOS install gesture guide + Android 1-tap install
- [x] Service worker precache (17 assets) + update flow
- [x] OG image, JSON-LD, sitemap, robots
- [x] Analytics queue with 10+ funnel events

### 🔴 BLOCKER — Apps Script broker deployed

Follow [apps-script/README.md](apps-script/README.md) end-to-end.
~30 minutes on your Google account.

- [ ] Sheet `NaijaGaz Order Book` created with 4 tabs (`orders`, `customers`, `vendors`, `riders`)
- [ ] [apps-script/Code.gs](apps-script/Code.gs) pasted into the Sheet's Apps Script
- [ ] `ADMIN_SECRET` generated (`openssl rand -hex 24`) and stored in Script Properties
- [ ] Web App deployed (Anyone access; broker validates server-side)
- [ ] Web App URL pasted into [docs/config.js](docs/config.js) as `BROKER_URL`
- [ ] `ADMIN_SECRET` pasted into `docs/config.js`
- [ ] `ORDER_MODE` flipped to `'broker'`
- [ ] Triggers wired: `onStatusChange` (on edit) + `dailyRefillNudge` (9am Africa/Lagos)
- [ ] Verified end-to-end: place test order → Sheet row appears → admin updates status → SMS fires
- [ ] Broker pip on `/settings.html` shows green ("Connected · naijagaz-broker-v1")

### 🔴 BLOCKER — Termii (SMS)

- [ ] Termii account created at termii.com
- [ ] Sender ID registered (`NaijaGaz` or similar) and approved (1-3 business days in NG)
- [ ] ~₦20,000 credit loaded (covers ~5,000 SMS at ₦4 each)
- [ ] `TERMII_API_KEY` set in Apps Script Script Properties
- [ ] `TERMII_SENDER_ID` set
- [ ] Test SMS fired by editing a Sheet row's `status` to `CONFIRMED` — phone receives within 30s

### 🔴 BLOCKER — Vendor MoU signed

Per whitepaper §6.

- [ ] One vendor identified in/adjacent to Lugbe/Kubwa/Nyanya/Gwarinpa
- [ ] Modern fill scale verified (NOT eyeball)
- [ ] DPR / NMDPRA license confirmed
- [ ] Owner-operator with WhatsApp + answers it
- [ ] One-page MoU signed: ₦1,000-1,500 below retail per 12.5kg, 6-month term, daily settlement, exclusivity in our 4 districts
- [ ] First test fill executed (Operator on-site, weight verified)

### 🔴 BLOCKER — Riders onboarded

Per whitepaper §7.

- [ ] 3 freelance dispatch riders identified in the cluster
- [ ] Bikes, permits, phones verified
- [ ] Cylinder strap kits + branded vests + fire extinguishers ordered (~₦12,000 × 3)
- [ ] Onboarding agreement signed (per-delivery payment ₦800-1,200)
- [ ] Each rider added as a row in the `riders` Sheet tab
- [ ] WhatsApp group created with operator + riders + vendor

### 🔴 BLOCKER — Insurance + regulatory

Per whitepaper §8.

- [ ] Public liability insurance bound (~₦80,000/year)
- [ ] Riders' personal accident cover (~₦15,000/rider)
- [ ] NMDPRA registration started or confirmed not required for Phase 0 (operating as "technology coordinator for licensed vendor")
- [ ] 1-hour consult with Nigerian regulatory lawyer (~₦100,000) — verify coordinator framing
- [ ] CAC business name registration if not already

### 🟡 SHOULD — domain + branding

- [ ] `naijagaz.ng` domain registered (~₦25,000/year)
- [ ] Custom domain configured in GitHub Pages settings
- [ ] CNAME file in repo root: `naijagaz.ng`
- [ ] DNS A records pointing at GitHub Pages IPs
- [ ] HTTPS verified after propagation

### 🟡 SHOULD — pre-launch verification

- [ ] All 4 cylinder sizes price-verified at vendor (5 / 6 / 12.5 / 25 kg)
- [ ] All 4 districts addressable (rider knows the territory)
- [ ] PWA installed on at least one cofounder's phone (iOS + Android)
- [ ] Test order flow run by all three cofounders independently
- [ ] WhatsApp template message reviewed for clarity in both EN + PCM

---

## Day 0 — soft launch (Lugbe only)

Per whitepaper §12.

- [ ] 1,000 flyers printed (`Cooking gas in 90 minutes. ₦16,500/12.5kg. naijagaz.ng. WhatsApp 0814 965 3044`)
- [ ] Distributed in 5 Lugbe estates (apartment compounds, NOT standalone houses)
- [ ] Each cofounder personally onboards 5 customers from their network
- [ ] Posted on local Facebook groups + Nairaland Abuja section
- [ ] First 24h: ALL 3 cofounders standing by on WhatsApp, no exceptions
- [ ] Target: 20 orders by Day 12

## Days 1-14 — daily ops

- [ ] Daily 8am stand-up: orders pending, riders allocated, vendor confirmed
- [ ] Daily 9pm review: every order audited, every complaint logged
- [ ] Operator inspects fills weekly with calibrated test cylinder
- [ ] Closer personally calls every 1-3 star rating
- [ ] Day 13: expand to Kubwa
- [ ] Day 14: expand to Nyanya
- [ ] Day 14 retrospective written: brutally honest, top 3 friction points, priority for week 3

---

## Day 60 — go/no-go

Per whitepaper §18 success criteria. **Phase 0 succeeds if:**

- [ ] 400+ completed orders
- [ ] 50%+ repeat customer rate
- [ ] 25%+ T6 (refill nudge) conversion
- [ ] Average rating ≥4.5
- [ ] Zero safety incidents
- [ ] Vendor MoU intact, vendor profitable
- [ ] Unit economics positive (revenue covers Phase 0 burn)
- [ ] Can articulate, in one paragraph, why customers choose us over the alternatives

**Phase 0 fails (pivot or stop) if:**

- [ ] < 200 orders
- [ ] Repeat rate < 25%
- [ ] More than 1 safety incident
- [ ] Vendor wants out of MoU
- [ ] Cannot articulate the customer-choice paragraph

If we hit Phase 0, we raise ₦5-8M for **Phase 1** (the cylinder swap pool).
If we miss, we debug honestly. No mercy.

---

## Phase 1+ ventures (post-Day-60)

- [ ] WhatsApp Cloud API bot (auto-reply, intent parsing, payment links)
- [ ] Phase 0b → Phase 1 broker upgrade (Postgres + Rust/axum backend, replaces Apps Script)
- [ ] 80-150 NaijaGaz-branded cylinders (the swap pool)
- [ ] Phase 2 expansion: Lagos (Surulere/Yaba/Ikeja) + Port Harcourt (GRA/D-Line)
- [ ] Smart cylinders (IoT weight sensor → automated refill prediction)
- [ ] Micro-credit partnership for refills
- [ ] Push notifications for refill nudges (replacing SMS)
- [ ] Hausa + Yoruba localization
- [ ] localStorage → IndexedDB migration

---

🐉 **Now go forge the kitchen flame.**
