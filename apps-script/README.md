# NaijaGaz — Apps Script broker setup

The PWA never holds a Google credential. It POSTs orders to an Apps
Script **Web App** that's bound to the order Sheet, plus exposes
admin endpoints for the operator dashboard.

**Time:** ~15 minutes end-to-end. Done once. Free tier.

---

## 1. Create the Sheet

Create a new Google Sheet named `NaijaGaz Order Book`. Add these tabs
with **exactly these header rows**.

### `orders`

```
order_id | created_at | customer_phone | customer_name | address_line | district | gps_lat | gps_lng | cylinder_size | amount_due | payment_method | status | vendor_id | rider_id | dispatched_at | delivered_at | paid | rating | notes
```

### `customers`

```
phone | name | first_order_at | last_order_at | total_orders | total_spent | usual_cylinder_size | usual_district | next_refill_due | refill_nudge_sent
```

### `riders`

```
rider_id | name | phone | bike | active
```

(Seed 3-5 rows for Phase 0.)

### `vendors`

```
vendor_id | name | phone | district | active
```

(Seed 1 row for Phase 0.)

### `events`

(Created automatically on first analytics drain — no setup needed.)

## 2. Paste the broker code

In the Sheet: **Extensions → Apps Script**.

Delete the placeholder `Code.gs` and paste the full contents of
[apps-script/Code.gs](Code.gs) from this repo.

Save (Cmd/Ctrl-S) and rename the project: `naijagaz-broker`.

## 3. Generate an admin secret

The admin secret protects the dashboard endpoints (list all orders,
update status). Generate a long random string — paste this in your
terminal:

```bash
openssl rand -hex 24
# → e.g. 9f2c1a8e7b34d5e6...
```

Copy that string. You'll paste it twice in step 4 + 5.

## 4. Set Script Properties

In the Apps Script editor: **Project Settings (gear icon) → Script
Properties → Add property**.

Add these four:

| Key | Value |
|---|---|
| `TERMII_API_KEY` | from termii.com dashboard (skip if you're not wiring SMS yet) |
| `TERMII_SENDER_ID` | your registered sender ID (e.g. `NaijaGaz`) |
| `ADMIN_SECRET` | the random string from step 3 |
| `PUBLIC_TRACKING_URL` | `https://obiverse.github.io/naijagaz/track.html?id=` |
| `PUBLIC_REORDER_URL` | `https://obiverse.github.io/naijagaz/again.html` |

## 5. Deploy as Web App

**Deploy → New deployment → Type: Web app**

Settings:
- **Description:** `naijagaz-broker v1`
- **Execute as:** *Me* (your Google account)
- **Who has access:** *Anyone* (the broker validates server-side)

Click **Deploy**. **Authorize** the scopes when prompted (Sheets,
External requests).

Copy the **Web App URL** that ends in `/exec`.

## 6. Wire the URL into the PWA

Open [docs/config.js](../docs/config.js) and paste:

```js
export const ORDER_MODE = 'broker';   // switch from 'whatsapp' default
export const BROKER_URL = 'https://script.google.com/macros/s/.../exec';
export const ADMIN_SECRET = 'paste-the-same-string-from-step-3';
```

Commit + push:

```bash
git add docs/config.js
git commit -m "Wire broker"
git push
```

GitHub Pages rebuilds in ~30s. Both `/order.html` (POST) and
`/admin.html` (GET admin list, POST update_status) now hit the broker.

## 7. Set up triggers

In the Apps Script editor: **Triggers (clock icon) → Add Trigger**.

**Trigger 1 — order status SMS ladder**

- Function: `onStatusChange`
- Event source: `From spreadsheet`
- Event type: `On edit`

**Trigger 2 — daily refill nudges**

- Function: `dailyRefillNudge`
- Event source: `Time-driven`
- Type: `Day timer`
- Time of day: `9am to 10am` (Africa/Lagos)

## 8. Verify end-to-end

1. **Place a test order** through the live PWA (any cylinder, your
   own number). Check `orders` tab — new row should appear within
   seconds.
2. **Open the admin dashboard** at `/admin.html`, set/enter PIN.
   You should see the test order.
3. **Tap "Confirmed"** — `status` column updates in the Sheet.
4. **Check Termii dashboard** for the SMS that fired (if API key
   was set).
5. **Edit `status` in the Sheet** to `OUT_FOR_DELIVERY` — verify
   another SMS fires and `dispatched_at` gets stamped.

## Updating the broker

Edit `Code.gs` in the Apps Script editor. **Deploy → Manage
deployments → edit (pencil) → Version: New version → Deploy**.

The Web App URL stays the same.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| 401 Unauthorized on /admin.html | `ADMIN_SECRET` mismatch between Script Property and `config.js` |
| Order POST returns 200 but no row appears | The `orders` tab is named differently — check spelling, must be lowercase `orders` |
| SMS not firing | `TERMII_API_KEY` not set, OR onEdit trigger not installed (step 7) |
| Customer can't track | They got the order_id without the token suffix — make sure the SMS template uses the full ID |
| `Anyone` access scary? | The broker validates: only valid order shapes are written, only `ADMIN_SECRET` callers can list/mutate. The Sheet itself stays private. |

## Security notes

- `ADMIN_SECRET` is the only credential that gates list/mutate. Treat
  it like a password. Rotate by changing the Script Property + the
  `config.js` value.
- `order_id` includes a 6-char crypto-random token that prevents
  enumeration; `track.html?id=…` is safe to share.
- Don't commit a real `ADMIN_SECRET` to a public repo. For Phase 0,
  this is acceptable risk: the only attack surface is reading +
  mutating orders. Sheet data is non-sensitive (no payments stored).
- For Phase 1: rotate the secret regularly, consider auth-via-Google
  account on a private deployment, or a dedicated backend.
