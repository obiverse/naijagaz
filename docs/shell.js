// ═══════════════════════════════════════════════
// NAIJAGAZ shell — Wasm boot + DOM bridge.
// The Wasm core is the brain. This is the nervous system.
// ═══════════════════════════════════════════════

import init, * as core from './pkg/naijagaz_core/naijagaz_core.js';
import { BROKER_URL, ORDER_MODE, WHATSAPP_NUMBER } from './config.js';

export { ORDER_MODE };

// ── Wasm boot ─────────────────────────────────────

let _ready;
export const ready = (async () => {
  if (_ready) return _ready;
  _ready = await init();
  return _ready;
})();

export { core };

// ── Pure-function helpers ─────────────────────────

export const naira = (n) => core.format_naira(BigInt(n));
export const phone = (raw) => core.validate_phone(raw);
export const price = (size) => Number(core.cylinder_price(size));
export const refillDays = (size) => core.cylinder_refill_days(size);
export const districtOk = (d) => core.validate_district(d);
export const paymentOk = (p) => core.validate_payment(p);
export const catalog = () => JSON.parse(core.cylinder_catalog());

// ── Draft persistence (localStorage — simple, durable, offline) ──

const DRAFT_KEY = 'naijagaz.draft.v1';
const LAST_KEY = 'naijagaz.last.v1';

export function saveDraft(d) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(d)); } catch {}
}
export function loadDraft() {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}'); } catch { return {}; }
}
export function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch {}
}
export function rememberLast(o) {
  try { localStorage.setItem(LAST_KEY, JSON.stringify(o)); } catch {}
}
export function recallLast() {
  try { return JSON.parse(localStorage.getItem(LAST_KEY) || 'null'); } catch { return null; }
}

// ── Broker calls ──────────────────────────────────

export async function submitOrder(payload) {
  if (!BROKER_URL || BROKER_URL.startsWith('PASTE_')) {
    throw new Error('BROKER_NOT_CONFIGURED');
  }
  const res = await fetch(BROKER_URL, {
    method: 'POST',
    // Apps Script Web Apps reject preflight if Content-Type is application/json
    // when access is "Anyone". text/plain bypasses preflight; the body is still JSON.
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('HTTP_' + res.status);
  return res.json();
}

// ── WhatsApp mode: build a prefilled wa.me URL from an order payload ──
//
// Note: callers MUST invoke window.open(url, '_blank') synchronously inside
// the originating user gesture (otherwise iOS Safari blocks it). That's why
// this is a pure URL builder — no DOM side effects.
//
const DISTRICT_LABEL = { lugbe: 'Lugbe', kubwa: 'Kubwa', nyanya: 'Nyanya', gwarinpa: 'Gwarinpa' };
const PAYMENT_LABEL  = { cash: 'Cash', transfer: 'Bank transfer', pos: 'POS' };

export function composeWhatsAppOrderUrl(p) {
  const total = price(p.size);
  const lines = [
    '🔥 NaijaGaz Order',
    '',
    `Cylinder: ${p.size}kg refill — ${naira(total)}`,
    `District: ${DISTRICT_LABEL[p.district] || p.district}`,
    `Address: ${p.address}`,
  ];
  if (p.landmark) lines.push(`Landmark: ${p.landmark}`);
  lines.push(`Phone: ${p.phone}`);
  if (p.name) lines.push(`Name: ${p.name}`);
  lines.push(`Payment: ${PAYMENT_LABEL[p.payment] || p.payment} on delivery`);
  lines.push('');
  lines.push(`Total: ${naira(total)}`);

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
}

export async function fetchOrder(orderId) {
  if (!BROKER_URL || BROKER_URL.startsWith('PASTE_')) {
    throw new Error('BROKER_NOT_CONFIGURED');
  }
  const url = BROKER_URL + (BROKER_URL.includes('?') ? '&' : '?') + 'id=' + encodeURIComponent(orderId);
  const res = await fetch(url);
  if (!res.ok) throw new Error('HTTP_' + res.status);
  return res.json();
}

// ── Service worker registration ───────────────────

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

// ── Install prompt (PWA) ──────────────────────────

let _deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  _deferredPrompt = e;
  document.dispatchEvent(new CustomEvent('naijagaz:installable'));
});

export async function promptInstall() {
  if (!_deferredPrompt) return false;
  _deferredPrompt.prompt();
  const choice = await _deferredPrompt.userChoice;
  _deferredPrompt = null;
  return choice.outcome === 'accepted';
}

export function isInstallable() { return _deferredPrompt !== null; }

// ── Online/offline awareness ──────────────────────

export const isOnline = () => navigator.onLine;
window.addEventListener('online', () => document.dispatchEvent(new CustomEvent('naijagaz:online')));
window.addEventListener('offline', () => document.dispatchEvent(new CustomEvent('naijagaz:offline')));

// ── Haptic feedback (Android only — iOS Safari ignores) ──

export function haptic(pattern = 12) {
  try { navigator.vibrate?.(pattern); } catch {}
}
