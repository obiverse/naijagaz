// ═══════════════════════════════════════════════════════════════════
// NAIJAGAZ config
// ═══════════════════════════════════════════════════════════════════

// ── ORDER_MODE — how "Place order" delivers the order ──
//
//   'whatsapp'  default: opens WhatsApp with a prefilled order summary.
//               Operator pastes into the Sheet manually. Zero infra.
//               Works end-to-end without any broker setup. Use this
//               for Phase 0a, dev, demos, and the first 50 customers.
//
//   'broker'    POSTs to the Apps Script Web App. Requires the broker
//               to be deployed (apps-script/README.md). Auto SMS via
//               Termii fires on status edits. Use once you've validated
//               product–market fit and want to scale.
//
export const ORDER_MODE = 'whatsapp';

// ── Broker URL (used when ORDER_MODE === 'broker' OR by /admin.html) ──
// See apps-script/README.md for setup.
export const BROKER_URL = 'PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE';

// ── Admin secret — paste here AFTER setting Script Property ADMIN_SECRET ──
// When set, /admin.html switches from local-only mode to broker mode:
// reads all orders from the sheet, mutates statuses via the broker.
// Treat this like a low-grade password — anyone with this string +
// the broker URL can read and mutate orders. Don't commit a real value
// to a public repo; rotate by changing the Script Property.
export const ADMIN_SECRET = '';

// WhatsApp operator lines — every order is sent to ALL non-primary
// operators as well, so both NG and US lines see every order. The
// primary line opens automatically; the others appear as equally
// prominent CTAs on the success step.
//
// Format: E.164 without the leading '+' for wa.me links.
export const WHATSAPP_OPERATORS = [
  { number: '2348149653044', label: 'NG line', display: '+234 814 965 3044', primary: true  },
  { number: '12409759431',   label: 'US line', display: '+1 240 975 9431',   primary: false },
];

// Optional: when set to a chat.whatsapp.com/<code> URL (after you create a
// shared group with all operators in it), "Place order" routes there
// instead of opening individual operator chats. Customer joins the group
// once and posts orders; both operators see them in real time.
export const WHATSAPP_GROUP_INVITE = '';

// Backward-compat alias — the primary line.
export const WHATSAPP_NUMBER = WHATSAPP_OPERATORS.find(o => o.primary)?.number || WHATSAPP_OPERATORS[0].number;
export const SUPPORT_WHATSAPP = '+' + WHATSAPP_NUMBER;

// Prefilled blank template for the landing-page "Order on WhatsApp" link.
// (Used when there's no order context — e.g. tap from /index.html.)
export const WHATSAPP_ORDER_TEMPLATE = `Hello NaijaGaz, I'd like to order gas:

Cylinder size:
District (Lugbe / Kubwa / Nyanya / Gwarinpa):
Address:
Payment (cash / transfer / pos):
My name:`;

// Districts (Phase 0). Source of truth is Wasm core; this is for label rendering.
export const DISTRICTS = [
  { value: 'lugbe',    label: 'Lugbe' },
  { value: 'kubwa',    label: 'Kubwa' },
  { value: 'nyanya',   label: 'Nyanya' },
  { value: 'gwarinpa', label: 'Gwarinpa' },
];
