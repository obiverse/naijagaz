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

// ── Broker URL (used only when ORDER_MODE === 'broker') ──
// See apps-script/README.md for setup.
export const BROKER_URL = 'PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE';

// WhatsApp number for ordering & customer service.
// Format: E.164 without the leading '+' for wa.me links.
// Nigerian line: 0814 965 3044 → E.164: +234 814 965 3044
export const WHATSAPP_NUMBER = '2348149653044';
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
