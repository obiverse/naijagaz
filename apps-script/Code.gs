// ═══════════════════════════════════════════════════════════════════
// NAIJAGAZ — Apps Script broker
//
// Deploys as a Google Apps Script Web App bound to the order Sheet.
// The PWA POSTs orders here; we validate, append, and return order_id.
// On status edits, we fire Termii SMS templates from §10 of the whitepaper.
//
// SETUP — see apps-script/README.md
// ═══════════════════════════════════════════════════════════════════

const SHEET_ORDERS = 'orders';
const SHEET_CUSTOMERS = 'customers';
const SHEET_RIDERS = 'riders';

const STATUS_NEW = 'NEW';
const STATUS_CONFIRMED = 'CONFIRMED';
const STATUS_PREPARING = 'PREPARING';
const STATUS_OUT = 'OUT_FOR_DELIVERY';
const STATUS_COMPLETED = 'COMPLETED';

// Mirrors naijagaz-core. Keep in sync — server is authoritative for billing.
const CYLINDERS = {
  '5':    { price: 7200,  days: 8  },
  '6':    { price: 8500,  days: 10 },
  '12.5': { price: 16500, days: 21 },
  '25':   { price: 32000, days: 40 },
};

const ALLOWED_DISTRICTS = ['lugbe', 'kubwa', 'nyanya', 'gwarinpa'];
const ALLOWED_PAYMENTS  = ['cash', 'transfer', 'pos'];

// ─── HTTP entry points ─────────────────────────────────────────────

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);

    // Admin actions are routed by `action` field; require ADMIN_SECRET.
    if (body.action === 'update_status') return adminUpdateStatus(body);
    if (body.action === 'event')         return adminLogEvent(body);

    const v = validateOrder(body);
    if (!v.ok) return jsonResponse({ ok: false, error: v.error });

    const orderId = generateOrderId();
    const cyl = CYLINDERS[body.size];
    appendOrderRow({
      order_id:        orderId,
      created_at:      new Date().toISOString(),
      customer_phone:  body.phone,
      customer_name:   body.name || '',
      address_line:    body.address,
      district:        body.district,
      gps_lat:         body.lat || '',
      gps_lng:         body.lng || '',
      cylinder_size:   body.size,
      amount_due:      cyl.price,
      payment_method:  body.payment,
      status:          STATUS_NEW,
      vendor_id:       '',
      rider_id:        '',
      dispatched_at:   '',
      delivered_at:    '',
      paid:            false,
      rating:          '',
      notes:           body.landmark || '',
    });

    return jsonResponse({ ok: true, order_id: orderId });
  } catch (err) {
    Logger.log('doPost error: ' + err);
    return jsonResponse({ ok: false, error: 'SERVER_ERROR' });
  }
}

function doGet(e) {
  const action = (e.parameter || {}).action || 'get';
  if (action === 'list') return adminListOrders(e);
  return getOrderPublic(e);
}

function getOrderPublic(e) {
  const id = (e.parameter || {}).id;
  if (!id) return jsonResponse({ ok: false, error: 'NO_ID' });
  const row = findOrder(id);
  if (!row) return jsonResponse({ ok: false, error: 'NOT_FOUND' });
  return jsonResponse({
    ok:             true,
    order_id:       row.order_id,
    status:         row.status,
    rider_name:     row.rider_id ? riderField(row.rider_id, 'name')  : null,
    rider_phone:    row.rider_id ? riderField(row.rider_id, 'phone') : null,
    cylinder_size:  row.cylinder_size,
    amount_due:     row.amount_due,
    created_at:     row.created_at,
    dispatched_at:  row.dispatched_at,
    delivered_at:   row.delivered_at,
  });
}

// ─── Admin endpoints ───────────────────────────────────────────────
//
// Both gated by ADMIN_SECRET (Script Property). The /admin.html PIN
// hashes to a separate ADMIN_PIN_HASH; this server-side secret is the
// actual authorization for fetching the full sheet or mutating status.
//
// Set both via Project Settings → Script Properties:
//   ADMIN_SECRET     — long random string, ships in admin.html via prompt
//   ADMIN_PIN_HASH   — sha256 of the operator PIN (optional; client also hashes)

function adminListOrders(e) {
  const secret = props().getProperty('ADMIN_SECRET');
  if (!secret || (e.parameter || {}).secret !== secret) {
    return jsonResponse({ ok: false, error: 'UNAUTHORIZED' });
  }
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_ORDERS);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return jsonResponse({ ok: true, orders: [] });
  const header = data[0];
  let orders = data.slice(1).map(row => {
    const obj = {};
    header.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
  // Filter by date if provided (yyyy-MM-dd format)
  const date = e.parameter.date;
  if (date) {
    orders = orders.filter(o => String(o.created_at || '').slice(0, 10) === date);
  }
  return jsonResponse({ ok: true, orders: orders, count: orders.length });
}

function adminUpdateStatus(body) {
  const secret = props().getProperty('ADMIN_SECRET');
  if (!secret || body.secret !== secret) {
    return jsonResponse({ ok: false, error: 'UNAUTHORIZED' });
  }
  if (!body.order_id || !body.status) {
    return jsonResponse({ ok: false, error: 'BAD_BODY' });
  }
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_ORDERS);
  const data = sheet.getDataRange().getValues();
  const header = data[0];
  const idIdx = header.indexOf('order_id');
  const statusIdx = header.indexOf('status');
  for (let i = 1; i < data.length; i++) {
    if (data[i][idIdx] === body.order_id) {
      sheet.getRange(i + 1, statusIdx + 1).setValue(body.status);
      if (body.status === 'OUT_FOR_DELIVERY') {
        const dispatchedIdx = header.indexOf('dispatched_at');
        if (dispatchedIdx >= 0) sheet.getRange(i + 1, dispatchedIdx + 1).setValue(new Date().toISOString());
      }
      if (body.status === 'COMPLETED') {
        const deliveredIdx = header.indexOf('delivered_at');
        if (deliveredIdx >= 0) sheet.getRange(i + 1, deliveredIdx + 1).setValue(new Date().toISOString());
      }
      // onStatusChange trigger fires via spreadsheet edit → SMS ladder
      return jsonResponse({ ok: true, order_id: body.order_id, status: body.status });
    }
  }
  return jsonResponse({ ok: false, error: 'NOT_FOUND' });
}

// Optional: drain client analytics queue to a SHEET_EVENTS tab.
// Tab is created on first event; no auth required (events are non-sensitive).
function adminLogEvent(body) {
  if (!body || !body.events || !Array.isArray(body.events)) {
    return jsonResponse({ ok: false, error: 'BAD_BODY' });
  }
  const ss = SpreadsheetApp.getActive();
  let sheet = ss.getSheetByName('events');
  if (!sheet) {
    sheet = ss.insertSheet('events');
    sheet.appendRow(['ts', 'name', 'session', 'state', 'page', 'referrer', 'props']);
  }
  body.events.forEach(ev => {
    sheet.appendRow([
      new Date(ev.ts || Date.now()),
      ev.name || '',
      ev.session || '',
      ev.state || '',
      ev.page || '',
      ev.referrer || '',
      JSON.stringify(ev.props || {}),
    ]);
  });
  return jsonResponse({ ok: true, count: body.events.length });
}

// ─── Triggers (set up via Edit > Triggers in the Apps Script editor) ───

// Trigger: From spreadsheet > On edit
function onStatusChange(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  if (sheet.getName() !== SHEET_ORDERS) return;

  const header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const statusCol = header.indexOf('status') + 1;
  if (statusCol === 0 || e.range.getColumn() !== statusCol) return;

  const row = readOrderRow(e.range.getRow());
  switch (row.status) {
    case STATUS_CONFIRMED: fireSMS(row, 'T1'); break;
    case STATUS_PREPARING: fireSMS(row, 'T2'); break;
    case STATUS_OUT:       fireSMS(row, 'T3'); break;
    case STATUS_COMPLETED:
      fireSMS(row, 'T5');
      updateCustomerNextRefill(row);
      break;
  }
}

// Trigger: Time-driven > Day timer > 9am-10am, Africa/Lagos
function dailyRefillNudge() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_CUSTOMERS);
  if (!sheet) return;
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return;
  const header = data[0];
  const today = todayIso();
  const phoneIdx = header.indexOf('phone');
  const dueIdx   = header.indexOf('next_refill_due');
  const sentIdx  = header.indexOf('refill_nudge_sent');
  if (phoneIdx < 0 || dueIdx < 0 || sentIdx < 0) return;

  for (let i = 1; i < data.length; i++) {
    const r = data[i];
    if (formatDate(r[dueIdx]) === today && !r[sentIdx]) {
      fireSMS({ customer_phone: r[phoneIdx] }, 'T6');
      sheet.getRange(i + 1, sentIdx + 1).setValue(true);
    }
  }
}

// ─── Validation ────────────────────────────────────────────────────

function validateOrder(o) {
  if (!o || typeof o !== 'object')              return { ok: false, error: 'BAD_BODY' };
  if (!CYLINDERS[o.size])                       return { ok: false, error: 'INVALID_SIZE' };
  if (!ALLOWED_DISTRICTS.includes(o.district))  return { ok: false, error: 'INVALID_DISTRICT' };
  if (!ALLOWED_PAYMENTS.includes(o.payment))    return { ok: false, error: 'INVALID_PAYMENT' };
  if (!/^\+234[789]\d{9}$/.test(o.phone))       return { ok: false, error: 'INVALID_PHONE' };
  if (!o.address || String(o.address).trim().length < 5) return { ok: false, error: 'INVALID_ADDRESS' };
  return { ok: true };
}

// ─── Order ID — NG-YYYYMMDD-NNNN ───────────────────────────────────

// NG-YYYYMMDD-NNNN-XXXXXX  ← capability token suffix.
// The token is the auth: anyone with the URL can track that order;
// without it, doGet returns NOT_FOUND. Prevents enumeration.
function generateOrderId() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_ORDERS);
  const today = Utilities.formatDate(new Date(), 'Africa/Lagos', 'yyyyMMdd');
  const data = sheet.getDataRange().getValues();
  const idIdx = data[0].indexOf('order_id');
  let counter = 0;
  for (let i = 1; i < data.length; i++) {
    const id = data[i][idIdx];
    if (typeof id === 'string' && id.indexOf('NG-' + today) === 0) counter++;
  }
  return 'NG-' + today + '-' + String(counter + 1).padStart(4, '0') + '-' + randomToken(6);
}

const TOKEN_CHARS_GS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function randomToken(len) {
  let s = '';
  for (let i = 0; i < len; i++) {
    s += TOKEN_CHARS_GS.charAt(Math.floor(Math.random() * TOKEN_CHARS_GS.length));
  }
  return s;
}

// ─── Sheet helpers ─────────────────────────────────────────────────

function appendOrderRow(row) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_ORDERS);
  const header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  sheet.appendRow(header.map(h => row[h] !== undefined ? row[h] : ''));
}

function readOrderRow(rowNum) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_ORDERS);
  const header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const values = sheet.getRange(rowNum, 1, 1, header.length).getValues()[0];
  const obj = {};
  header.forEach((h, i) => { obj[h] = values[i]; });
  return obj;
}

function findOrder(orderId) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_ORDERS);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return null;
  const header = data[0];
  const idIdx = header.indexOf('order_id');
  for (let i = 1; i < data.length; i++) {
    if (data[i][idIdx] === orderId) {
      const obj = {};
      header.forEach((h, j) => { obj[h] = data[i][j]; });
      return obj;
    }
  }
  return null;
}

function riderField(riderId, field) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_RIDERS);
  if (!sheet) return null;
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return null;
  const header = data[0];
  const idIdx = header.indexOf('rider_id');
  const fIdx = header.indexOf(field);
  if (idIdx < 0 || fIdx < 0) return null;
  for (let i = 1; i < data.length; i++) {
    if (data[i][idIdx] === riderId) return data[i][fIdx];
  }
  return null;
}

// ─── Customer-tab maintenance ──────────────────────────────────────

function updateCustomerNextRefill(order) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_CUSTOMERS);
  if (!sheet) return;
  const data = sheet.getDataRange().getValues();
  const header = data[0];
  const phoneIdx = header.indexOf('phone');
  const nextIdx  = header.indexOf('next_refill_due');
  const sentIdx  = header.indexOf('refill_nudge_sent');
  const days = (CYLINDERS[order.cylinder_size] || { days: 21 }).days;
  const next = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  const nextIso = Utilities.formatDate(next, 'Africa/Lagos', 'yyyy-MM-dd');

  for (let i = 1; i < data.length; i++) {
    if (data[i][phoneIdx] === order.customer_phone) {
      sheet.getRange(i + 1, nextIdx + 1).setValue(nextIso);
      sheet.getRange(i + 1, sentIdx + 1).setValue(false);
      return;
    }
  }
  // New customer — append
  const row = header.map(() => '');
  row[phoneIdx] = order.customer_phone;
  row[nextIdx] = nextIso;
  row[sentIdx] = false;
  const nameIdx = header.indexOf('name');
  if (nameIdx >= 0) row[nameIdx] = order.customer_name || '';
  sheet.appendRow(row);
}

// ─── Termii SMS ────────────────────────────────────────────────────

const TEMPLATES = {
  T1: function (o) {
    return 'NaijaGaz: Order ' + o.order_id + ' received! ' + o.cylinder_size + 'kg refill, '
      + nairaFmt(o.amount_due) + '. Delivery in 60-90 mins. Track: ' + trackUrl(o.order_id);
  },
  T2: function (o) {
    return 'NaijaGaz: Your gas is being prepared at our partner plant. We will send rider details shortly.';
  },
  T3: function (o) {
    const name = riderField(o.rider_id, 'name') || 'Your rider';
    const phone = riderField(o.rider_id, 'phone') || '';
    return 'NaijaGaz: ' + name + ' is on the way with your ' + o.cylinder_size + 'kg cylinder. ETA 30 mins. '
      + (phone ? 'Call: ' + phone + '. ' : '')
      + 'Pay ' + nairaFmt(o.amount_due) + ' on delivery.';
  },
  T5: function (o) {
    return 'NaijaGaz: Receipt for ' + o.order_id + '. ' + o.cylinder_size + 'kg, '
      + nairaFmt(o.amount_due) + ', ' + o.payment_method + '. '
      + 'Rate 1-5 by reply. Thank you for using NaijaGaz.';
  },
  T6: function (o) {
    return 'NaijaGaz: Hi! It has been about 3 weeks since your last refill. '
      + 'Time to top up? Reorder in 2 taps: ' + reorderUrl()
      + ' (Reply STOP to skip nudges)';
  },
};

function fireSMS(order, template) {
  const apiKey = props().getProperty('TERMII_API_KEY');
  const senderId = props().getProperty('TERMII_SENDER_ID') || 'NaijaGaz';
  if (!apiKey) {
    Logger.log('TERMII_API_KEY not set — skipping SMS for ' + (order.order_id || order.customer_phone));
    return;
  }
  const body = TEMPLATES[template](order);
  const payload = {
    to: order.customer_phone,
    from: senderId,
    sms: body,
    type: 'plain',
    api_key: apiKey,
    channel: 'generic',
  };
  try {
    UrlFetchApp.fetch('https://api.ng.termii.com/api/sms/send', {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    });
  } catch (err) {
    Logger.log('SMS error: ' + err);
  }
}

// ─── Utilities ─────────────────────────────────────────────────────

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function props() { return PropertiesService.getScriptProperties(); }

function todayIso() {
  return Utilities.formatDate(new Date(), 'Africa/Lagos', 'yyyy-MM-dd');
}

function formatDate(d) {
  if (!d) return '';
  if (d instanceof Date) return Utilities.formatDate(d, 'Africa/Lagos', 'yyyy-MM-dd');
  return String(d).slice(0, 10);
}

function nairaFmt(n) {
  return 'N' + Number(n).toLocaleString('en-NG');
}

function trackUrl(id) {
  const base = props().getProperty('PUBLIC_TRACKING_URL') || 'https://naijagaz.ng/track.html?id=';
  return base + encodeURIComponent(id);
}

function reorderUrl() {
  return props().getProperty('PUBLIC_REORDER_URL') || 'https://naijagaz.ng/again.html';
}
