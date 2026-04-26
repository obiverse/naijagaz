# NaijaGaz — Apps Script broker setup

The PWA never holds a Google credential. It POSTs orders to an Apps Script
**Web App** that's bound to the order Sheet. This is a 15-minute setup.

## 1. Create the Sheet

Create a new Google Sheet named `NaijaGaz Order Book`. Add four tabs with
exactly these header rows.

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
(seed 3-5 rows for Phase 0)

### `vendors`
```
vendor_id | name | phone | district | active
```
(seed 1 row for Phase 0)

## 2. Paste the broker code

In the Sheet: **Extensions → Apps Script**. Delete the placeholder
`Code.gs` and paste the contents of `apps-script/Code.gs` from this repo.

Save (**Ctrl/Cmd-S**) and name the project `naijagaz-broker`.

## 3. Set Script Properties

**Project Settings (gear icon) → Script Properties → Add property**:

| Key | Value |
|---|---|
| `TERMII_API_KEY` | from termii.com dashboard |
| `TERMII_SENDER_ID` | your registered sender, e.g. `NaijaGaz` |
| `PUBLIC_TRACKING_URL` | `https://naijagaz.ng/track.html?id=` |
| `PUBLIC_REORDER_URL` | `https://naijagaz.ng/again.html` |

## 4. Deploy as Web App

**Deploy → New deployment → Type: Web app**

- **Description:** `naijagaz-broker v1`
- **Execute as:** *Me* (your Google account)
- **Who has access:** *Anyone* (yes — the broker validates server-side)

Click **Deploy**. Copy the **Web App URL** that ends in `/exec`.

Paste it into [docs/config.js](../docs/config.js):
```js
export const BROKER_URL = 'https://script.google.com/macros/s/.../exec';
```

## 5. Set up triggers

In the Apps Script editor: **Triggers (clock icon) → Add Trigger**.

**Trigger 1 — order status SMS ladder**
- Function: `onStatusChange`
- Event source: `From spreadsheet`
- Event type: `On edit`

**Trigger 2 — daily refill nudges (the §10.3 spell)**
- Function: `dailyRefillNudge`
- Event source: `Time-driven`
- Type: `Day timer`
- Time of day: `9am to 10am` (Africa/Lagos)

## 6. Verify

In the Apps Script editor, **Run → `doPost`** once with no event to grant
all OAuth scopes (Sheets, External requests). It will fail with "no
postData" — that's fine; you only needed the consent dialog.

Then place a test order through the PWA. The new row should appear in
`orders`. Edit the `status` column to `CONFIRMED` and confirm a Termii
SMS fires (check the Termii dashboard's logs).

## Updating the broker

Edit `Code.gs` in the Apps Script editor. **Deploy → Manage deployments →
edit (pencil) → Version: New version → Deploy**.

The Web App URL stays the same.
