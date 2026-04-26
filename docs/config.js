// ─────────────────────────────────────────────────
// CONFIG — paste your Apps Script Web App URL here.
// See apps-script/README.md for setup instructions.
// ─────────────────────────────────────────────────

export const BROKER_URL = 'PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE';

// Optional: a WhatsApp number for fallback / customer service
export const SUPPORT_WHATSAPP = '+2348011110000';

// Districts (Phase 0). Source of truth is Wasm core; this is for label rendering.
export const DISTRICTS = [
  { value: 'lugbe', label: 'Lugbe' },
  { value: 'kubwa', label: 'Kubwa' },
  { value: 'nyanya', label: 'Nyanya' },
];
