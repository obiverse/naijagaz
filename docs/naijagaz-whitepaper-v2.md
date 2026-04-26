# 🐉 NAIJAGAZ — WHITEPAPER v2.1

**The Coordination Layer for LPG Refill in Abuja**

| | |
|---|---|
| **Version** | 2.4 |
| **Date** | April 2026 |
| **Region** | Abuja, Nigeria (Lugbe + Kubwa + Nyanya + Gwarinpa cluster) |
| **Model** | Asset-light aggregator |
| **Phase 0 Capital** | < ₦1,000,000 |
| **Team** | 3 cofounders (Operator, Builder, Closer) |
| **For** | Implementation agents — founders, engineers, ops |

---

## ⚗️ 0. PHILOSOPHY

> **Computer science is magic. Spells are spoken in code. We are alchemists building a coordination layer over physical energy.**

This document is the grimoire for that layer. Every section is a rune. Every spec is a spell. The goal is not to build software — the goal is to make a kitchen flame ignite faster, safer, and cheaper than it does today.

We do this by being invisible to the physical flow of gas and indispensable to the information flow.

---

## 🧭 1. EXECUTIVE SUMMARY

NaijaGaz is an **asset-light coordination platform** that connects households in mass-market Abuja districts with existing LPG vendors and freelance dispatch riders. We don't own gas. We don't own cylinders. We don't own bikes. We own:

1. **The customer relationship** (brand, communication, trust)
2. **The coordination layer** (an offline-first WASM PWA + automated SMS/WhatsApp ladder)
3. **The refill prediction engine** (a 21-day nudge that turns one-time orders into recurring revenue)

Phase 0 launches in 14 days for under ₦1M. Phase 1 introduces the cylinder swap pool once unit economics are proven. Phase 2 expands to Lagos and Port Harcourt.

This is how DoorDash, Uber, and Jumia started. It is not novel. It is correct.

---

## 🎯 2. THE PROBLEM

Households in Lugbe, Kubwa, Nyanya, and Gwarinpa share a daily pain:

- **Time:** A refill round-trip eats 2-4 hours
- **Price opacity:** ₦14,500 here, ₦18,000 there, no clear reason
- **Trust:** Short-fills, tampered seals, expired cylinders are common
- **Coordination:** No system tells you when you'll run out
- **Safety:** Every transport leg is a risk

The mass-market segment (₦100k-₦400k household income) is the largest LPG market in Abuja and the most underserved by existing tech (PricePally, Gaspro, etc., target premium districts).

---

## 💡 3. THE SOLUTION

A PWA where a customer in Kubwa taps three times to order a refill, gets SMS confirmation in 10 seconds, sees rider details in 20 minutes, and has a full cylinder back in their kitchen in 90 minutes. Behind the scenes:

1. Order flows into a Google Sheet (Phase 0 database)
2. Operator dispatches to partner vendor via WhatsApp
3. Vendor fills cylinder
4. Freelance rider collects and delivers
5. Customer pays on delivery (cash/transfer/POS)
6. SMS receipt sent
7. **21 days later, automated SMS: "Time to refill?"**

That last step is the spell. Gas is the most predictable consumable in a household. We turn it into a subscription that customers don't know they signed up for — they just keep saying yes.

---

## 🏗️ 4. SYSTEM ARCHITECTURE (PHASE 0)

```
┌─────────────────┐
│  Customer PWA   │  Static HTML + Rust→Wasm core on GitHub Pages
│  (naijagaz.ng)  │  Offline-first. No login. OTP only on payment.
└────────┬────────┘
         │ HTTPS (POST /order, GET /status)
         ▼
┌─────────────────┐       ┌──────────────────┐
│ Apps Script Web │◄─────►│  Google Sheet    │  The database.
│ App (the broker)│       │  (Order book)    │  Yes, really.
└────────┬────────┘       └──────────────────┘
         │
         ▼
┌─────────────────┐       ┌──────────────────┐
│  Termii / AT    │──────►│  Customer phone  │  SMS ladder
│  (SMS gateway)  │       │  (NG carriers)   │  WhatsApp Business
└─────────────────┘       └──────────────────┘
         │
         ▼
┌─────────────────┐       ┌──────────────────┐
│  Operator's     │──────►│  Partner Vendor  │  WhatsApp
│  WhatsApp       │       │  (Kubwa plant)   │  manual dispatch
└────────┬────────┘       └──────────────────┘
         │
         ▼
┌─────────────────┐
│  Rider WhatsApp │  Job assignment + tracking
└─────────────────┘
```

**Phase 0 has no automated dispatch. The Operator is the dispatch.** Software handles intake, communication, and data. Humans handle decisions. This is correct.

---

## 📱 5. USER FLOWS

### 5.1 Customer Flow (the only one that must be perfect)

1. **Land** → naijagaz.ng or PWA icon
2. **Tap "Order Gas"**
3. **Pick cylinder size:** 5kg / 6kg / 12.5kg / 25kg
4. **Enter address:** GPS auto-fill or manual (3 saved addresses max)
5. **Pick payment:** Cash / Transfer / POS on delivery
6. **Enter phone** → OTP
7. **Confirm** → order placed
8. **Receive SMS within 10 seconds**
9. **Track via SMS ladder** (no live map needed in Phase 0)
10. **Pay rider on delivery**
11. **Receive receipt SMS**
12. **+24h: "How was it?" rating SMS**
13. **+21d: Refill nudge**

**Total taps: 6.** Anything more is friction. Friction kills conversion on a staple.

### 5.2 Operator Flow (the human-in-the-loop)

1. New row appears in Sheet (with conditional formatting → red highlight)
2. Operator opens "Operator Console" tab
3. One-click WhatsApp message to vendor: pre-filled order details
4. Vendor confirms in WhatsApp → Operator updates Sheet status to "PREPARING"
5. SMS auto-fires to customer: "Your gas is being prepared 🔥"
6. Operator pings rider with vendor address + customer address
7. Rider confirms pickup → status = "OUT_FOR_DELIVERY"
8. SMS: "Rider [Name] is on the way. ETA 30 mins. Call: 0801..."
9. Rider confirms delivery + payment → status = "COMPLETED"
10. SMS receipt + rating prompt fires

### 5.3 Vendor Flow

The Operator handles vendors over WhatsApp. **No vendor app in Phase 0.** Vendors only need a phone. This is the single biggest decision in this whitepaper — vendor-facing software is what kills aggregators.

### 5.4 Rider Flow

Same. WhatsApp + cash + a branded vest. No rider app in Phase 0.

---

## 🤝 6. THE VENDOR DEAL

**Phase 0 = ONE vendor. Not three. One.**

### 6.1 Vendor Selection Criteria

- Located in or adjacent to Lugbe/Kubwa/Nyanya/Gwarinpa cluster
- Modern fill scale (NOT eyeball measurement) — this is non-negotiable
- DPR/NMDPRA licensed
- Owner-operator (decisions don't go through a chain)
- Spare capacity (60-100 cylinders/day excess)
- Owner has WhatsApp and answers it

### 6.2 The MoU (one page)

| Term | Value |
|---|---|
| Wholesale rate | ₦1,000–₦1,500 below current retail per 12.5kg fill |
| Volume commitment | We commit to minimum 30 orders/week by month 2 |
| Quality standards | Full fills (verified weekly by spot-check), intact seals, max 30-min prep time |
| Branding | Customer-facing receipts say NaijaGaz only. Vendor name not disclosed. |
| Exclusivity | Vendor is exclusive to NaijaGaz in our 4 districts. We are non-exclusive. |
| Term | 6 months, 30-day exit either side |
| Payment | Daily settlement at end of day. We collect from customers, pay vendor next morning. |

### 6.3 Why Vendors Sign

Their gas plant has idle capacity from 11am–4pm and after 7pm. We bring them paid orders during those windows. Their staff was sitting around anyway. Marginal cost to them is ~₦200 per fill (labor + small overhead). We pay them ₦1,000+ above that. It's free money for unused capacity.

---

## 🏍️ 7. THE RIDER MODEL

### 7.1 Don't Hire. Partner.

Hire freelance dispatch riders who already work the area. 3-5 riders. Pay per delivery (₦800–₦1,200 depending on distance). They use their bikes, their petrol, their initiative.

### 7.2 Rider Requirements

- Owns a working bike (not borrowed)
- Has a smartphone with WhatsApp
- Has a valid rider's permit
- Can read English and basic Hausa/Pidgin
- Will wear a NaijaGaz vest on duty
- Will not transport more than 2 cylinders at a time (safety constraint)

### 7.3 Rider Onboarding Cost

| Item | Cost |
|---|---|
| Branded vest | ₦8,000 |
| Cylinder strap kit (proper LPG transport) | ₦4,000 |
| Per-rider total | **₦12,000** |
| Phase 0 fleet of 3 | **₦36,000** |

---

## 🛡️ 8. SAFETY (THE EXISTENTIAL SECTION)

One LPG accident on a rider's bike = brand death. This section is not optional.

### 8.1 Hard Rules

1. **Maximum 2 cylinders per trip.** No exceptions.
2. **Cylinders must be strapped upright.** Never laid flat.
3. **No riding in heavy rain.** Orders pause; customers notified.
4. **All cylinders inspected at pickup:** seal intact, no visible damage, valve closed.
5. **Rider carries fire extinguisher.** ₦5,000 each, mandatory.
6. **No smoking near cylinders.** Termination offense for riders.
7. **Customer signs digital handover** (photo + signature) on delivery — proves cylinder was intact.

### 8.2 Insurance

- **Public liability insurance:** ~₦80,000/year for Phase 0 coverage. Non-negotiable.
- **Riders' personal accident cover:** ~₦15,000/rider/year. We pay.
- **Provider candidates:** Leadway, AIICO, Cornerstone. The Operator gets quotes in week 1.

### 8.3 Regulatory

- **NMDPRA registration:** required for any LPG retail/distribution operation. The Operator initiates this in week 1.
- **DPR (Department of Petroleum Resources) compliance:** check via partner vendor's existing licenses.
- **Local government permit:** Abuja Municipal Area Council has area-specific requirements.

**Until NMDPRA paperwork clears, we operate as a "technology coordinator for licensed vendors" — the vendor's license covers the gas; we're a marketing/logistics service.** Verify this framing with a Nigerian regulatory lawyer before launch. Budget ₦100,000 for a 1-hour consultation. This is the cheapest insurance you'll buy.

### 8.4 Incident Protocol

If anything goes wrong (leak, accident, injury, fire):

1. Rider calls Operator immediately
2. Operator calls emergency services if injury/fire
3. Operator notifies customer if their order is affected
4. Operator notifies insurance within 24h
5. Operator writes incident report same day
6. Founders meet to debrief within 48h
7. Public communication only via the Closer, only after legal review

---

## 📊 9. DATA MODEL (PHASE 0 = GOOGLE SHEET)

The Sheet has 4 tabs.

### 9.1 `orders` tab

| Column | Type | Notes |
|---|---|---|
| order_id | string | `NG-YYYYMMDD-NNNN` |
| created_at | timestamp | ISO 8601 |
| customer_phone | string | E.164 (+234...) |
| customer_name | string | Optional |
| address_line | string | Free text |
| district | enum | Lugbe / Kubwa / Nyanya / Gwarinpa |
| gps_lat | number | If captured |
| gps_lng | number | If captured |
| cylinder_size | enum | 5 / 6 / 12.5 / 25 (kg) |
| amount_due | number | ₦ |
| payment_method | enum | cash / transfer / pos |
| status | enum | NEW / CONFIRMED / PREPARING / OUT_FOR_DELIVERY / COMPLETED / CANCELLED |
| vendor_id | string | Phase 0 = always one |
| rider_id | string | Riders 1-5 |
| dispatched_at | timestamp | |
| delivered_at | timestamp | |
| paid | boolean | |
| rating | int | 1-5 from rating SMS |
| notes | string | Free text for ops |

### 9.2 `customers` tab (auto-built from orders)

| Column | Notes |
|---|---|
| phone | Primary key |
| name | |
| first_order_at | |
| last_order_at | |
| total_orders | |
| total_spent | |
| usual_cylinder_size | |
| usual_district | |
| **next_refill_due** | last_order_at + 21 days. **THE KEY COLUMN.** |
| refill_nudge_sent | boolean |

### 9.3 `vendors` tab

Phase 0: 1 row. Phase 1: more.

### 9.4 `riders` tab

3-5 rows in Phase 0.

**Why Sheets and not a real DB:** Because Phase 0 needs the Operator and Closer to be able to look at orders, fix data, run formulas, and answer customer questions without waiting for the Builder to ship a feature. A Sheet is the world's best admin panel until you outgrow it. You will outgrow it around order #500. That's the right time to migrate to Postgres.

---

## 📲 10. THE COMMUNICATION LADDER

This is the second-most-important section after Safety. The whole product *is* the ladder.

### 10.1 SMS Templates (NG-localized)

All SMS are bilingual-friendly: clear English, no jargon, naira symbol only, full numbers (no abbreviations).

**T1 — Order Confirmed** (fires when status = CONFIRMED, within 10s of order)
```
NaijaGaz: Order NG-20260425-0042 received! 12.5kg refill, ₦16,500.
Delivery in 60-90 mins. Track: naijagaz.ng/o/0042
Need help? WhatsApp 0801-NAIJA-GAZ
```

**T2 — Preparing** (fires when vendor confirms)
```
NaijaGaz: Your gas is being prepared at our partner plant 🔥
We'll send rider details shortly.
```

**T3 — Out for Delivery** (fires when rider picks up)
```
NaijaGaz: Musa is on the way to you with your 12.5kg cylinder.
ETA: 30 mins. His number: 0803-XXX-XXXX
Pay ₦16,500 cash/transfer on delivery.
```

**T4 — Arriving** (manual fire, 5 mins out)
```
NaijaGaz: Musa is 5 mins from you. Please be ready to receive.
```

**T5 — Delivered** (fires on COMPLETED + paid)
```
NaijaGaz: Receipt for NG-20260425-0042
12.5kg cylinder · ₦16,500 · Paid via cash
Delivered by Musa at 14:32

Rate this delivery 1-5: reply with a number.
Thank you for using NaijaGaz 🔥
```

**T6 — Refill Nudge** (fires at last_order_at + 21 days, 9am)
```
NaijaGaz: Hi 👋 It's been about 3 weeks since your last refill.
Time to top up? Reorder in 2 taps: naijagaz.ng/again

Reply STOP to skip nudges.
```

### 10.2 WhatsApp Layer — The Sticky Channel

WhatsApp is not just for service. It is the **default ordering channel** for repeat customers. The chat list itself becomes the brand surface — every refill cycle we are in their thread, not buried behind a home-screen icon.

The PWA is the front door (discovery, first order, brand). WhatsApp is the kitchen (every order after that). They share one Sheet.

**The dual-mode switch:** the PWA's `Place order` button is governed by `ORDER_MODE` in `docs/config.js`:

| Mode | Behavior | When to use |
|---|---|---|
| `'whatsapp'` (default) | Opens WhatsApp with a structured prefilled message. Operator pastes into the Sheet. Zero infrastructure. | Phase 0a, dev, demos, first 50 customers — until the broker is proven |
| `'broker'` | POSTs to the Apps Script Web App. SMS ladder fires automatically. | Once the broker is deployed (apps-script/README.md) and Termii is wired |

Flipping the switch is a one-line edit. The Wasm core, the Sheet schema, and the operator's workflow do not change.

**WhatsApp phasing:**

| Phase | What ships | Cost | Timing |
|---|---|---|---|
| **0a** | Click-to-chat + prefilled order template — operator handles in WhatsApp manually | ₦0 | Today |
| **0b** | Webhook bot via WhatsApp Cloud API — auto-replies with menu, "Reply 1 to confirm last order", routes novel intents to operator | ~₦0 (Meta free tier ≤1k convos/mo) + ~₦5k/mo Cloud Run | Week 2 of soft launch |
| **1** | Full bot — natural language ("send 12.5 to my Lugbe place"), payment links via Paystack, status pushed to WhatsApp instead of SMS | Termii cost drops; bot infra ~₦15k/mo | Month 2-3 |
| **2** | Claude-powered LLM bot — multilingual (English / Pidgin / Hausa / Yoruba), photo OCR for cylinder readings, predictive nudges | ~₦30-50k/mo + Claude API | Month 4+ |

**Phase 0 customer service is still a person, not a bot.** The dual-mode switch lets us scale the front-of-house (PWA → WhatsApp) without scaling the back-of-house (operator + Sheet) until product-market fit is proven.

### 10.3 The Refill Prediction Engine

This is the spell. Mechanism:

1. Every completed order writes `next_refill_due = delivered_at + N` where N = expected days based on cylinder size (12.5kg ≈ 21 days for an average household, 6kg ≈ 10 days, 25kg ≈ 40 days).
2. A scheduled Google Apps Script runs daily at 09:00 WAT, finds all customers where `next_refill_due` is today and `refill_nudge_sent` is false, fires T6, marks sent.
3. Customer taps the link → PWA pre-fills their last order → 1-tap reorder.
4. Conversion on T6 is the single most important number in the business. Target: >25% by month 3.

In Phase 1, we get fancier: per-customer refill cadence learned from history, weather-adjusted (rainy season = more cooking = faster usage), holiday-adjusted (festive cooking spikes).

---

## 💰 11. UNIT ECONOMICS

### 11.1 Per-Order Math (12.5kg in Kubwa)

| Line item | ₦ |
|---|---|
| Customer pays | 16,500 |
| Vendor wholesale cost | (15,000) |
| Rider payment | (1,000) |
| Payment processing (avg) | (50) |
| SMS costs (5 messages × ₦4) | (20) |
| **Gross margin per order** | **430** |
| **Gross margin %** | **2.6%** |

This is thin. **Intentionally.** Phase 0 is not about per-order margin; it's about proving the loop. Margin expands in Phase 1 via:

- **Better vendor terms** (volume discount kicks in around 200 orders/week)
- **Delivery fee** (₦500 added to mass-market is acceptable once trust is built)
- **Larger cylinder mix** (25kg has 4× the gross margin of 12.5kg)
- **Premium tier** (express delivery for +₦1,000)

### 11.2 Phase 0 Budget (60 days)

| Category | ₦ |
|---|---|
| Domain (.ng) + Termii SMS credits + GitHub Pages (free) | 80,000 |
| Branded vests + safety kits (3 riders) | 50,000 |
| Public liability insurance (1 year) | 80,000 |
| Rider personal accident cover | 45,000 |
| Marketing (flyers, WhatsApp ads, refer incentives) | 200,000 |
| Working capital float | 300,000 |
| Legal consultation (regulatory framing) | 100,000 |
| Buffer | 145,000 |
| **TOTAL** | **₦1,000,000** |

*v2.2 note: dropping Vercel/Node hosting in favor of GitHub Pages + WASM frees ~₦70k/year. Reallocated to buffer — Phase 0 always wants more buffer.*

Three cofounders × ₦334k each, or one investor wire, or revenue from week 3 onward.

### 11.3 Phase 0 Targets (60 days)

| Metric | Day 14 | Day 30 | Day 60 |
|---|---|---|---|
| Total orders | 20 | 100 | 400 |
| Unique customers | 18 | 70 | 200 |
| Repeat rate | — | 30% | 50% |
| Avg orders/day | 2 | 5 | 15 |
| T6 nudge conversion | — | — | 25% |
| Customer rating ≥4 | 90% | 90% | 92% |
| Gross revenue (₦) | 330,000 | 1,650,000 | 6,600,000 |
| Gross margin (₦) | 8,600 | 43,000 | 172,000 |

Day 60 is decision day. If we hit these, we raise ₦5-8M for Phase 1 (the cylinder swap pool). If we miss, we debug.

---

## 🛣️ 12. THE 14-DAY OPS PLAYBOOK

### Days 1-2 — The Vendor Hunt
**Owner: Operator**

- List 12 gas plants in/around Kubwa, Lugbe, Nyanya, Gwarinpa (Google Maps + driving)
- Visit each in person; never pitch over the phone
- Pitch script: *"I'll bring you 50 paid orders a month at no marketing cost. ₦1,500 below your retail. We split work — you fill, we deliver and handle customers. Sign a 6-month deal today, exit with 30 days notice."*
- End of Day 2: 1 vendor signed. Hard requirement.

### Days 3-4 — The Rider Hunt
**Owner: Operator**

- Identify 5 freelance dispatch riders in the cluster (markets are good hunting grounds)
- Vet bikes, permits, phones
- Sign 3 onboarding agreements
- Order vests + safety kits

### Days 5-7 — Build Sprint
**Owner: Builder**

- Day 5: Buy naijagaz.ng. Set up Vercel, Next.js, Sheets API integration, Termii account
- Day 6: Build PWA — order screen, confirm screen, track screen. PWA manifest. Service worker for offline order draft
- Day 7: Build Operator Console (a Sheet tab + Apps Script automation for SMS triggers). End-to-end test: place fake order → SMS fires → status updates → rating SMS fires

### Days 8-9 — Legal & Insurance
**Owner: Operator + Closer**

- 1-hour call with Nigerian regulatory lawyer (NMDPRA framing)
- Get insurance quotes from 3 providers
- Bind policy
- Register operating name (CAC business name registration if not already)

### Days 10-12 — Soft Launch in Lugbe Only
**Owner: Closer (lead), all hands**

- Print 1,000 flyers ("Cooking gas in 90 minutes. ₦16,500/12.5kg. WhatsApp 0801-NAIJA-GAZ. Or order at naijagaz.ng")
- Distribute in 5 Lugbe estates (apartment compounds, not standalone houses — density matters)
- Friends and family round: each cofounder personally onboards 5 customers from their network
- Post on local Facebook groups, Nairaland Abuja section
- WhatsApp Status posts daily
- Target: 20 orders by end of Day 12

### Days 13-14 — Iterate & Expand
**Owner: All**

- Daily standups become daily war rooms: every order reviewed, every complaint logged
- Fix top 3 friction points from week 1
- Expand to Kubwa on Day 13
- Expand to Nyanya on Day 14
- Day 14 retrospective: written, brutal, honest. What worked? What broke? What's the priority for week 3?

---

## 👥 13. TEAM ROLES (THREE COFOUNDERS)

### 13.1 The Operator
- Owns: vendor relationships, rider management, order dispatch, supply quality, regulatory
- KPI: zero supply failures, vendor SLA compliance, regulatory paperwork on file
- Lives at the gas plant in week 1
- Works the WhatsApp dispatch line during peak hours (8am-9pm)

### 13.2 The Builder
- Owns: PWA, Sheet schema, SMS automation, Apps Scripts, all software
- KPI: zero downtime, all SMS firing within 60s of trigger, weekly feature shipped
- Phase 0 stack: Rust→Wasm core, static HTML on GitHub Pages, Apps Script Web App as Sheets broker, Termii for SMS
- Phase 1 stack: same Wasm core + Postgres + a Rust/axum backend (the Wasm logic ports forward unchanged — we replace the storage layer, not the brain)

### 13.3 The Closer
- Owns: customer acquisition, brand, customer service, retention, complaints
- KPI: customer rating ≥4.5, repeat rate ≥40% by month 2, T6 conversion ≥25% by month 3
- Lives in customers' compounds in week 1
- Personally calls every customer who rates 1-3 stars

**If any cofounder is doing two of these jobs, Phase 0 dies.** Hire help before that happens.

---

## 🐉 14. THE THREE DRAGONS (RISKS)

### 14.1 🐉 Vendor Disintermediation
**Risk:** Customer learns vendor, calls vendor directly, cuts us out.

**Defense:**
- Never disclose vendor name on receipts, in SMS, in PWA
- Never let rider mention vendor when delivering
- Brand the cylinder transport (sticker) as NaijaGaz
- Make customer service so good that calling vendor direct feels like downgrading
- T6 refill nudge keeps the relationship anchored to us

### 14.2 🐉 Vendor Quality Variance
**Risk:** Short-fills, tampered seals, slow prep — brand eats every failure.

**Defense:**
- Phase 0: ONE vendor, Operator inspects fills weekly with calibrated test cylinder
- Daily quality check: random pick of one cylinder pre-delivery, weighed by Operator
- Vendor MoU has cure clauses: 2 quality failures = formal warning, 3 = termination
- Phase 1: add vendor #2 in different district as redundancy

### 14.3 🐉 Margin Squeeze
**Risk:** Vendor renegotiates once dependent. Or competitor bids them away.

**Defense:**
- 6-month rate lock in MoU
- Build customer relationship moat strong enough that we can switch vendors without losing customers (this is the real test)
- By month 4, have 2 vendors live to prevent single-point-of-failure
- Phase 1 cylinder pool is the ultimate hedge — we own the asset, vendors compete for our fills

### 14.4 Other Risks (manage but don't lose sleep over)

- **Currency volatility** — naira swings affect cylinder/gas import prices. Re-price quarterly.
- **Fuel price spikes** — affects rider economics. Build a per-km adjustment formula.
- **Holiday demand spikes** — December gas demand is 3× normal. Pre-order vendor capacity.
- **Power outages** — affects PWA usage. Make PWA work offline (draft order, send when online).

---

## 🚀 15. PHASES BEYOND MVP

### Phase 1 — The Swap Pool (Month 3-6)

Conditions to enter:
- Phase 0 hit Day 60 targets
- ₦5-8M raised
- 200+ repeat customers

What we add:
- Buy 80-150 NaijaGaz-branded cylinders
- Offer "swap" tier: customer joins pool by exchanging their cylinder, gets faster delivery (45 min) at slightly lower price
- Customer-owned tier remains as on-ramp
- Vendor relationship deepens: bulk fills of our cylinders, even better wholesale rate

### Phase 2 — Geographic Expansion (Month 6-12)

- Lagos (Surulere + Yaba + Ikeja cluster)
- Port Harcourt (GRA + D-Line cluster)
- Same playbook, new cofounder team in each city

### Phase 3 — Adjacent Energy (Year 2+)

- Smart cylinders (IoT — weigh sensor reports level to PWA, full automation of refill prediction)
- Micro-credit for refills (partner with a fintech)
- Cooking appliance financing (gas cookers, ovens)
- Eventually: an energy marketplace that includes solar, charcoal alternatives, biogas

---

## 🛠️ 16. PWA SPEC (FOR THE BUILDER)

### 16.1 Stack — Static + WASM (the OBIVERSE substrate)

The PWA is not a Node app. It is a **static site** with a **Rust → WebAssembly core** doing the business logic, served by GitHub Pages. The pattern is borrowed from the Letterverse (`obiverse.github.io/wasmverse`) and matches the OBIVERSE 9S agent ethos: programs are small, portable, sovereign, and offline-first.

- **Hosting**: GitHub Pages on `naijagaz.github.io` with `naijagaz.ng` as the custom domain. Free, fast CDN, no Vercel/Node.
- **Logic core**: `crates/naijagaz-core/` — Rust compiled to Wasm via `wasm-pack`. Owns: order-id generation (`NG-YYYYMMDD-NNNN`), naira formatting, E.164 phone validation, cylinder-size pricing, refill-cadence prediction (the §10.3 spell), IDB-backed offline order draft.
- **Shell**: ~5 hand-written HTML pages + ~150 lines of JS to bridge Wasm to DOM. No framework. No build step beyond `wasm-pack`.
- **Storage (client)**: IndexedDB for offline drafts and last-order memory. localStorage as fallback for Safari-private edge cases.
- **Storage (server)**: Google Sheet (the database, per §9). All writes go through an **Apps Script Web App** (`doPost`) — this is the broker the PWA POSTs to. No service-account key in the browser; Apps Script runs as the deploying Google account.
- **SMS**: Termii (NG-native, supports DLT, ~₦4/SMS) — fired from Apps Script `onEdit` triggers.
- **Payments**: Paystack on the `/o/[id]` page when status is OUT_FOR_DELIVERY (Phase 0 = optional, Phase 1 = required). Public key only — safe in browser.
- **Service worker**: network-first for everything, cache-as-backup. No precache list, no version tokens, no self-healing scripts. Borrowed from wasmverse `sw.js` — proven pattern.

**Why this stack:**
- **Zero hosting cost.** Phase-0 budget redirects to marketing.
- **Portable brain.** The Wasm core is a pure-logic artifact. When Phase 1 swaps Sheets for Postgres, the Wasm logic ports forward unchanged — only the broker changes.
- **No server to operate, monitor, or pay for** in Phase 0.
- **Offline-by-default.** Critical when NEPA is out and Etisalat is wobbling. The order draft persists locally; it syncs the moment a bar of signal returns.
- **Tecno-grade performance.** Static + Wasm hits <100KB initial JS and <2s LCP on 3G without effort.

### 16.2 Routes

| Route | Purpose |
|---|---|
| `/` | Landing — "Order gas in 60 seconds" |
| `/order` | Order flow (multi-step, single page) |
| `/o/[order_id]` | Tracking page |
| `/again` | Reorder shortcut (uses last order from cookie) |
| `/admin` | Operator console (auth-gated) |

### 16.3 PWA Requirements

- Installable (manifest, icons)
- Service worker caches landing page + order form
- Offline draft mode (save order locally, sync when online)
- < 100KB initial JS
- < 2s LCP on 3G (data is expensive in NG)
- Works on a ₦25k Tecno phone

### 16.4 Order Form Spec

```
STEP 1: Cylinder size
  [5kg ₦7,200] [6kg ₦8,500] [12.5kg ₦16,500] [25kg ₦32,000]

STEP 2: Delivery address
  [GPS button] or [type address]
  [district dropdown: Lugbe / Kubwa / Nyanya]
  [optional landmark field]

STEP 3: Phone + payment
  [phone field with NG flag]
  [payment: ●Cash ○Transfer ○POS]
  [name field, optional]

STEP 4: Confirm
  Big summary card. Big "Place Order" button.
  → On submit: write to Sheet, fire OTP SMS, redirect to /o/[id]
```

### 16.5 Tracking Page (`/o/[order_id]`)

Status timeline (visual):
```
✓ Order Received      14:02
✓ Preparing            14:08
✓ Out for Delivery     14:35  ← Musa, 0803-XXX-XXXX
○ Delivered           ETA 15:05
```

Big "Call Rider" button when status = OUT_FOR_DELIVERY.

### 16.6 Apps Script — The Sheet's Hands

The PWA never touches the Sheets API directly (no service-account key in a browser). Instead, all reads and writes flow through an **Apps Script Web App** deployed from the Sheet itself. The PWA POSTs JSON; Apps Script validates and appends. Status edits fire SMS via Termii.

**`doPost` — the write broker (called by the PWA on order placement)**

```javascript
function doPost(e) {
  const order = JSON.parse(e.postData.contents);
  // Server-side validation: phone format, district allow-list, cylinder size, amount sanity
  if (!validateOrder(order)) {
    return jsonResponse({ ok: false, error: 'INVALID' });
  }
  const orderId = generateOrderId(); // NG-YYYYMMDD-NNNN
  appendRow(SHEET_ORDERS, {
    ...order,
    order_id: orderId,
    status: 'NEW',
    created_at: new Date().toISOString(),
  });
  return jsonResponse({ ok: true, order_id: orderId });
}
```

**`doGet` — the tracking read (called by `/o/[id]`)**

```javascript
function doGet(e) {
  const orderId = e.parameter.id;
  const row = findRow(SHEET_ORDERS, 'order_id', orderId);
  if (!row) return jsonResponse({ ok: false }, 404);
  return jsonResponse({
    ok: true,
    status: row.status,
    rider_name: row.rider_id ? riderName(row.rider_id) : null,
    rider_phone: row.rider_id ? riderPhone(row.rider_id) : null,
    dispatched_at: row.dispatched_at,
  });
}
```

**`onEdit` — the SMS ladder (status changes fire Termii)**

```javascript
// Trigger: onEdit of orders sheet, status column
function onStatusChange(e) {
  const row = e.range.getRow();
  const sheet = e.source.getActiveSheet();
  if (sheet.getName() !== 'orders') return;
  if (e.range.getColumn() !== STATUS_COL) return;

  const status = e.value;
  const order = readRow(sheet, row);

  switch(status) {
    case 'CONFIRMED':     fireSMS(order, 'T1'); break;
    case 'PREPARING':     fireSMS(order, 'T2'); break;
    case 'OUT_FOR_DELIVERY': fireSMS(order, 'T3'); break;
    case 'COMPLETED':     fireSMS(order, 'T5'); 
                          updateCustomerNextRefill(order); break;
  }
}

// Daily cron: refill nudges
function dailyRefillNudge() {
  const customers = readCustomersTab();
  const today = new Date().toISOString().slice(0,10);
  customers
    .filter(c => c.next_refill_due === today && !c.refill_nudge_sent)
    .forEach(c => {
      fireSMS({phone: c.phone}, 'T6');
      markNudgeSent(c.phone);
    });
}
```

---

## 📝 17. OPEN QUESTIONS (THINGS WE CAN'T ANSWER FROM A DESK)

These get answered by Day 14 or Phase 0 fails:

1. What % of Lugbe/Kubwa/Nyanya/Gwarinpa households have a smartphone capable of running the PWA? (We assume >70% but must verify.)
2. What's the actual current retail price of 12.5kg in each of the 3 districts on a normal Tuesday? (We assume ₦16,500-₦18,000 but must verify in person.)
3. Will customers pay on delivery via transfer reliably, or will we have a "transfer pending" fraud problem?
4. What's the actual peak demand window? (Early morning vs evening?)
5. How many active competitors operate in these districts? (Direct, WhatsApp-based, informal?)
6. What's the typical household refill cadence in the mass market? (Our 21-day assumption is from premium-segment data.)

The Closer's primary job in Days 1-7 is answering these.

---

## 🧭 18. SUCCESS CRITERIA

### Phase 0 succeeds if, by Day 60:
- 400+ completed orders
- 50%+ repeat customer rate
- 25%+ T6 refill nudge conversion
- Average customer rating ≥4.5
- Zero safety incidents
- Vendor relationship intact and profitable for vendor
- Unit economics positive (revenue covers Phase 0 burn)
- We can articulate, in one paragraph, why customers choose us over the alternatives

### Phase 0 fails (and we should pivot or stop) if, by Day 60:
- < 200 orders
- Repeat rate < 25%
- More than 1 safety incident
- Vendor wants out of MoU
- Cannot articulate the customer-choice paragraph

A dead-honest Day 60 retrospective is the most important meeting on the calendar.

---

## 🐉 19. CORE PRINCIPLE (THE INVOCATION)

> **NaijaGaz is not a gas company. NaijaGaz is the operating system for gas distribution.**
>
> We do not own gas. We do not own cylinders. We do not own bikes.
>
> We own the customer's first thought when their flame goes blue.
>
> Every line of code, every SMS, every conversation is in service of that single ownership.

---

## 📦 20. IMPLEMENTATION INSTRUCTIONS

For Claude / engineers / operators picking this up cold, in priority order:

1. **Read the whole thing twice.** Especially Section 8 (Safety) and Section 14 (Dragons).
2. **Validate Section 17's open questions** in person, in the actual districts, before any code.
3. **Sign the vendor MoU before the Builder writes the first line of code.** No vendor = no business.
4. **Build the PWA per Section 16.** Ship in 7 days. Reject feature creep.
5. **Wire the SMS ladder per Section 10.** This is more important than the PWA.
6. **Run the 14-day playbook in Section 12.** Every day has a deliverable.
7. **Hold the Day 14 retrospective.** Write it down. Share with stakeholders.
8. **Hit Day 60 targets in Section 18 or pivot.** No mercy.

---

## 🔚 END OF GRIMOIRE v2.0

*The spell is documented. The runes are clear. The path to the kitchen flame is short.*

*Now go forge the PWA.*

---

**Changelog**
- v1.0: Original whitepaper (full marketplace, Flutter, multi-vendor matching)
- v2.0: Asset-light coordination layer, PWA + Sheet, single-vendor Phase 0, Lugbe/Kubwa/Nyanya/Gwarinpa cluster, ₦1M Phase 0 budget, 21-day refill nudge as core mechanic
- v2.1: Renamed venture from GasGo to NaijaGaz — more rooted, more local, signals identity in one word
- v2.2: Fused the OBIVERSE WASM substrate. Stack moved from Next.js/Vercel to static HTML + Rust→Wasm on GitHub Pages, with Apps Script Web App as the Sheets broker. Logic core compiles to a portable artifact that survives the Phase 1 Postgres migration. ₦70k/yr hosting savings reallocated to buffer.
- v2.3: Added Gwarinpa as the 4th Phase-0 district — denser estate cluster in NW Abuja, complements the Lugbe/Kubwa/Nyanya triangle. Wasm validator, Apps Script broker, and PWA pill grid all updated.
- v2.4: WhatsApp elevated from service-only channel to **default ordering channel**. The PWA's `Place order` now opens WhatsApp with a structured prefilled message; operator pastes into the Sheet. Switchable via `ORDER_MODE` config. Phase 0a → 0b → 1 → 2 phasing documented in §10.2. Customer-facing tagline softened from "in 90 minutes" to "almost instantly" — the 60-90 min SLA stays in the operator/vendor MoU. Sacred Lattice pattern (Adinkrahene rings + cosmic axis + ember spark) added as a subtle universal background — every Naija home is a hearth.
