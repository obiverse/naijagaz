// ═══════════════════════════════════════════════
// NAIJAGAZ shell — Wasm boot + DOM bridge.
// The Wasm core is the brain. This is the nervous system.
// ═══════════════════════════════════════════════

import init, * as core from './pkg/naijagaz_core/naijagaz_core.js';
import { BROKER_URL, ORDER_MODE, WHATSAPP_NUMBER, WHATSAPP_OPERATORS, WHATSAPP_GROUP_INVITE } from './config.js';

export { ORDER_MODE, WHATSAPP_OPERATORS, WHATSAPP_GROUP_INVITE };

// ── Operator selection ────────────────────────────────────
// Every order goes to ALL operator lines — primary opens automatically,
// secondaries are presented as equally prominent CTAs on success.
//
// `primaryOperator()` is the auto-opened line; `secondaryOperators()`
// is the rest of the array.

export function primaryOperator() {
  return WHATSAPP_OPERATORS.find(o => o.primary) || WHATSAPP_OPERATORS[0];
}

export function secondaryOperators() {
  const primary = primaryOperator();
  return WHATSAPP_OPERATORS.filter(o => o.number !== primary.number);
}

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
// Pass an explicit `operatorNumber` to target a specific line, otherwise
// the call defaults to the primary. Returns { url, operator }.
//
const DISTRICT_LABEL = { lugbe: 'Lugbe', kubwa: 'Kubwa', nyanya: 'Nyanya', gwarinpa: 'Gwarinpa' };
const PAYMENT_LABEL  = { cash: 'Cash', transfer: 'Bank transfer', pos: 'POS' };

export function composeWhatsAppOrderText(p) {
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
  return lines.join('\n');
}

export function composeWhatsAppOrderUrl(p, operatorNumber = null) {
  const operator = operatorNumber
    ? (WHATSAPP_OPERATORS.find(o => o.number === operatorNumber) || primaryOperator())
    : primaryOperator();
  const text = composeWhatsAppOrderText(p);
  const url = `https://wa.me/${operator.number}?text=${encodeURIComponent(text)}`;
  return { url, operator };
}

// Build URLs for every operator in the configured list — used to render
// the "send to each line" CTAs on the success step.
export function composeAllOperatorUrls(p) {
  const text = composeWhatsAppOrderText(p);
  const enc = encodeURIComponent(text);
  return WHATSAPP_OPERATORS.map(op => ({
    operator: op,
    url: `https://wa.me/${op.number}?text=${enc}`,
  }));
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

// ── Service worker registration + update detection ──────────
//
// When a new SW is installed and waiting, surface a small toast with
// a "Refresh" button. Tap activates skipWaiting on the new SW and
// reloads. This is the flagship-PWA update flow — users always have
// the latest version with one tap, never silently stale, never forced.

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('./sw.js');
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateToast(sw);
          }
        });
      });
      // Reload once when the new SW takes control
      let refreshed = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshed) return;
        refreshed = true;
        location.reload();
      });
    } catch {}
  });
}

function showUpdateToast(waitingSw) {
  if (document.getElementById('update-toast')) return;
  const el = document.createElement('div');
  el.id = 'update-toast';
  el.className = 'update-toast';
  el.innerHTML = `<span>New version available</span><button type="button">Refresh</button>`;
  el.querySelector('button').addEventListener('click', () => {
    haptic(10);
    el.classList.add('dismissing');
    waitingSw.postMessage({ type: 'SKIP_WAITING' });
  });
  document.body.appendChild(el);
  // Auto-dismiss after 12s if the user ignores it
  setTimeout(() => {
    if (document.body.contains(el)) {
      el.classList.add('dismissing');
      setTimeout(() => el.remove(), 300);
    }
  }, 12_000);
}

// ═══════════════════════════════════════════════════════════════════
// INSTALL — multi-platform PWA install orchestration
//
//   - beforeinstallprompt → captured for Chrome/Edge/Android
//   - iOS Safari → no API, we render step-by-step instructions
//   - Desktop browsers without API → fallback to address-bar guidance
//   - Already installed → display-mode: standalone hides everything
//
// Engagement-gated: never auto-shown on first visit. Surfaces only after
// 2+ visits, an order placed, or 60s+ dwell. Dismissal persists for 14
// days in localStorage. Multiple entry points — auto + manual.
// ═══════════════════════════════════════════════════════════════════

const INSTALL_DISMISSED_KEY = 'naijagaz.install.dismissed_at';
const ENGAGEMENT_KEY = 'naijagaz.engagement.v1';
const FIRST_INSTALLED_KEY = 'naijagaz.first_installed_at';
const SESSION_SHOWN_KEY = 'naijagaz.install.shown_session';
const DISMISSAL_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;
const ENGAGEMENT_VISIT_GATE = 2;
const ENGAGEMENT_DWELL_MS = 60_000;

let _deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  _deferredPrompt = e;
  document.dispatchEvent(new CustomEvent('naijagaz:installable'));
});

window.addEventListener('appinstalled', () => {
  _deferredPrompt = null;
  toast('Installed ✓ — open from your home screen');
  haptic([20, 60, 20]);
});

// ── Detection ──

export function isInstalled() {
  return matchMedia('(display-mode: standalone)').matches ||
         matchMedia('(display-mode: minimal-ui)').matches ||
         matchMedia('(display-mode: fullscreen)').matches ||
         navigator.standalone === true; // iOS Safari
}

export function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);
}

export function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}

export function isInstallable() {
  return _deferredPrompt !== null;
}

// ── Engagement ──

function loadEngagement() {
  try { return JSON.parse(localStorage.getItem(ENGAGEMENT_KEY) || '{}'); } catch { return {}; }
}
function saveEngagement(e) {
  try { localStorage.setItem(ENGAGEMENT_KEY, JSON.stringify(e)); } catch {}
}

export function trackEngagement(event = 'visit') {
  const e = loadEngagement();
  e.firstVisit ??= Date.now();
  if (event === 'visit') e.visits = (e.visits || 0) + 1;
  if (event === 'order') e.orders = (e.orders || 0) + 1;
  e.lastSeen = Date.now();
  saveEngagement(e);
}

function engagementMet() {
  const e = loadEngagement();
  return (e.orders || 0) >= 1
      || (e.visits || 0) >= ENGAGEMENT_VISIT_GATE
      || (e.firstVisit && Date.now() - e.firstVisit > ENGAGEMENT_DWELL_MS);
}

// ── Dismissal ──

export function dismissInstallPrompt() {
  try { localStorage.setItem(INSTALL_DISMISSED_KEY, String(Date.now())); } catch {}
}
function isDismissalActive() {
  const at = Number(localStorage.getItem(INSTALL_DISMISSED_KEY) || '0');
  return at > 0 && Date.now() - at < DISMISSAL_COOLDOWN_MS;
}

export function shouldAutoShowInstall() {
  if (isInstalled()) return false;
  if (sessionStorage.getItem(SESSION_SHOWN_KEY)) return false;
  if (isDismissalActive()) return false;
  if (!engagementMet()) return false;
  // iOS users can't auto-install — only show if they explicitly tap the link.
  if (isIOS() && !isInstallable()) return false;
  return isInstallable() || isIOS();
}

// ── Install trigger ──

export async function promptInstall() {
  if (!_deferredPrompt) return { outcome: 'unsupported' };
  _deferredPrompt.prompt();
  const choice = await _deferredPrompt.userChoice;
  _deferredPrompt = null;
  return choice;
}

// ── Install sheet (auto-injected) ──

const SHARE_ICON_SVG = `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="currentColor"><path d="M16 5l-1.42 1.42-1.59-1.59V16h-1.98V4.83L9.42 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z"/></svg>`;
const ADD_ICON_SVG   = `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>`;

function injectInstallSheet() {
  if (document.getElementById('install-sheet')) return;
  const sheet = document.createElement('div');
  sheet.id = 'install-sheet';
  sheet.className = 'sheet-backdrop install-sheet-backdrop';
  sheet.hidden = true;
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-modal', 'true');
  sheet.setAttribute('aria-labelledby', 'install-name');
  sheet.innerHTML = `
    <div class="install-sheet">
      <button class="install-close" id="install-close" aria-label="Close" type="button">×</button>
      <div class="sheet-handle" aria-hidden="true"></div>

      <div class="install-header">
        <img src="icon-192.png" alt="" class="install-icon" width="64" height="64">
        <div>
          <h3 class="install-name" id="install-name">NaijaGaz</h3>
          <p class="install-host">obiverse.github.io · PWA</p>
        </div>
      </div>

      <!-- Chrome/Edge/Android (beforeinstallprompt) -->
      <div class="install-body" id="install-body-supported" hidden>
        <p class="install-pitch">Add NaijaGaz to your home screen — same as a native app, no Play Store needed.</p>
        <ul class="install-perks">
          <li><span>🔥</span> One-tap reorders</li>
          <li><span>📡</span> Works offline</li>
          <li><span>🔔</span> Refill reminders, every 21 days</li>
        </ul>
        <button class="btn btn-flame" id="install-trigger" type="button">Install NaijaGaz</button>
      </div>

      <!-- iOS Safari -->
      <div class="install-body" id="install-body-ios" hidden>
        <p class="install-pitch">Two taps to add NaijaGaz to your home screen:</p>
        <ol class="install-steps">
          <li><span class="step-n">1</span><span>Tap the <strong>Share</strong> button ${SHARE_ICON_SVG} at the bottom of Safari</span></li>
          <li><span class="step-n">2</span><span>Scroll down and tap <strong>Add to Home Screen</strong> ${ADD_ICON_SVG}</span></li>
          <li><span class="step-n">3</span><span>Tap <strong>Add</strong> in the top-right corner</span></li>
        </ol>
      </div>

      <!-- Desktop browsers without beforeinstallprompt API -->
      <div class="install-body" id="install-body-desktop" hidden>
        <p class="install-pitch">Look for an <strong>install icon</strong> in your address bar — usually a small monitor or ⊕ glyph next to the URL. Click it to install NaijaGaz like a native app.</p>
        <p class="muted" style="font-size: var(--fs-caption);">Chrome and Edge support this. Other browsers can bookmark the page for one-tap access.</p>
      </div>

      <!-- Already installed -->
      <div class="install-body" id="install-body-done" hidden>
        <p class="install-pitch" style="text-align: center; font-size: var(--fs-body-lg);">✓ NaijaGaz is installed on this device.</p>
        <p class="muted" style="text-align: center;">Open it from your home screen anytime. Works offline.</p>
      </div>
    </div>
  `;
  document.body.appendChild(sheet);

  document.getElementById('install-close').addEventListener('click', closeInstallSheet);
  sheet.addEventListener('click', (e) => { if (e.target === sheet) closeInstallSheet(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !sheet.hidden) closeInstallSheet();
  });

  document.getElementById('install-trigger').addEventListener('click', async () => {
    haptic(8);
    const r = await promptInstall();
    if (r.outcome === 'accepted') {
      closeInstallSheet();  // appinstalled fires the toast
    } else if (r.outcome === 'dismissed') {
      dismissInstallPrompt();
      closeInstallSheet();
      toast('We will not bug you for 14 days');
    }
  });
}

export function openInstallSheet() {
  injectInstallSheet();
  ['supported', 'ios', 'desktop', 'done'].forEach(k => {
    const el = document.getElementById('install-body-' + k);
    if (el) el.hidden = true;
  });

  let bodyKey;
  if (isInstalled()) bodyKey = 'done';
  else if (isInstallable()) bodyKey = 'supported';
  else if (isIOS()) bodyKey = 'ios';
  else bodyKey = 'desktop';

  const body = document.getElementById('install-body-' + bodyKey);
  if (body) body.hidden = false;

  document.getElementById('install-sheet').hidden = false;
  haptic(6);
}

function closeInstallSheet() {
  const sheet = document.getElementById('install-sheet');
  if (!sheet || sheet.hidden) return;
  sheet.classList.add('closing');
  setTimeout(() => {
    sheet.hidden = true;
    sheet.classList.remove('closing');
  }, 300);
}

// ── Auto-show after engagement (once per session, on idle) ──

function maybeAutoShow() {
  if (!shouldAutoShowInstall()) return;
  try { sessionStorage.setItem(SESSION_SHOWN_KEY, '1'); } catch {}
  // Wait until the page is settled — don't fight a hero animation
  setTimeout(openInstallSheet, 1500);
}

// Wire any [data-install] element to open the sheet
function wireInstallButtons() {
  document.querySelectorAll('[data-install]').forEach(el => {
    if (el._installWired) return;
    el._installWired = true;
    el.addEventListener('click', (e) => {
      e.preventDefault();
      openInstallSheet();
    });
  });
}

// Track this visit for engagement
trackEngagement('visit');

// First launch as installed — welcome moment
if (isInstalled() && !localStorage.getItem(FIRST_INSTALLED_KEY)) {
  try { localStorage.setItem(FIRST_INSTALLED_KEY, String(Date.now())); } catch {}
  setTimeout(() => toast('Welcome to NaijaGaz 🔥 — installed on this device'), 800);
}

// ── Online/offline awareness ──────────────────────

export const isOnline = () => navigator.onLine;
window.addEventListener('online', () => document.dispatchEvent(new CustomEvent('naijagaz:online')));
window.addEventListener('offline', () => document.dispatchEvent(new CustomEvent('naijagaz:offline')));

// ── Haptic feedback (Android only — iOS Safari ignores) ──

export function haptic(pattern = 12) {
  try { navigator.vibrate?.(pattern); } catch {}
}

// ═══════════════════════════════════════════════════════════════════
// THEME — light / dark / system (auto-detect + persistence)
// ═══════════════════════════════════════════════════════════════════

const THEME_KEY = 'naijagaz.theme.v1';
const THEMES = ['system', 'light', 'dark'];
const THEME_ICONS = { system: '⚙', light: '☀', dark: '🌙' };
const META_THEME_COLOR = { light: '#0B3FE0', dark: '#08101F' };

export function getTheme() { return localStorage.getItem(THEME_KEY) || 'system'; }
export function getEffectiveTheme() {
  const t = getTheme();
  return t === 'system'
    ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : t;
}
export function setTheme(t) {
  if (!THEMES.includes(t)) return;
  try { localStorage.setItem(THEME_KEY, t); } catch {}
  applyTheme();
}
export function cycleTheme() {
  const next = THEMES[(THEMES.indexOf(getTheme()) + 1) % THEMES.length];
  setTheme(next);
  return next;
}

function applyTheme() {
  const eff = getEffectiveTheme();
  document.documentElement.dataset.theme = eff;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = META_THEME_COLOR[eff];
}

// Apply ASAP — before first paint avoids a light→dark flash on dark systems
applyTheme();
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (getTheme() === 'system') applyTheme();
});

// ═══════════════════════════════════════════════════════════════════
// THEME TOGGLE BUTTON — auto-injected on every page
// ═══════════════════════════════════════════════════════════════════

function injectThemeToggle() {
  if (document.getElementById('theme-toggle')) return;
  const btn = document.createElement('button');
  btn.id = 'theme-toggle';
  btn.className = 'theme-toggle';
  btn.setAttribute('aria-label', 'Toggle theme');
  document.body.appendChild(btn);

  const refresh = () => {
    const t = getTheme();
    btn.title = `Theme: ${t} (tap to switch)`;
    btn.textContent = THEME_ICONS[t];
  };
  refresh();

  btn.addEventListener('click', () => {
    cycleTheme();
    refresh();
    haptic(8);
    toast(`Theme: ${getTheme()}`);
  });
}

// ═══════════════════════════════════════════════════════════════════
// CONNECTIVITY PIP — visible only when offline
// ═══════════════════════════════════════════════════════════════════

function injectConnectivityPip() {
  if (document.getElementById('connectivity-pip')) return;
  const pip = document.createElement('div');
  pip.id = 'connectivity-pip';
  pip.className = 'connectivity-pip';
  pip.textContent = 'OFFLINE';
  pip.hidden = true;
  document.body.appendChild(pip);

  const update = () => { pip.hidden = navigator.onLine; };
  window.addEventListener('online', () => { update(); toast('Back online ✓'); });
  window.addEventListener('offline', () => { update(); toast('You are offline'); });
  update();
}

// ═══════════════════════════════════════════════════════════════════
// TOAST — small notification at bottom of screen
// ═══════════════════════════════════════════════════════════════════

let _toastTimer = null;
export function toast(msg, ms = 2200) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.remove('dismissing');
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => {
    t.classList.add('dismissing');
    setTimeout(() => { if (t.parentNode) t.remove(); }, 300);
  }, ms);
}

// ── Boot the auto-injected widgets ────────────────────────

function bootWidgets() {
  injectThemeToggle();
  injectConnectivityPip();
  injectInstallSheet();
  wireInstallButtons();
  // Poll once for late-mounted [data-install] buttons
  setTimeout(wireInstallButtons, 1000);
  // Engagement-gated auto-show, deferred so it doesn't compete with hero
  if ('requestIdleCallback' in window) {
    requestIdleCallback(maybeAutoShow, { timeout: 3000 });
  } else {
    setTimeout(maybeAutoShow, 2200);
  }
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootWidgets);
} else {
  bootWidgets();
}
