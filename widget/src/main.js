'use strict';

const CSS    = require('./styles');
const bot    = require('./bot');
const ui     = require('./ui');
const i18n   = require('./i18n');

// ── Derive the API server origin from this script's src ───────────────────
// When injected on letterride.com the script src is:
//   https://hr-chatbot.onrender.com/widget.bundle.js
// We strip the path to get the API origin.
function detectBaseUrl() {
  try {
    // document.currentScript is set while the script is first executing
    if (document.currentScript && document.currentScript.src) {
      const url = new URL(document.currentScript.src);
      return url.origin;
    }
  } catch { /* ignore */ }

  // Fallback: scan all <script> tags for our bundle filename
  const scripts = Array.from(document.scripts);
  const tag = scripts.find((s) => s.src && s.src.includes('widget.bundle'));
  if (tag) {
    try { return new URL(tag.src).origin; } catch { /* ignore */ }
  }

  // Last resort: same origin (works in local dev)
  return window.location.origin;
}

const BASE_URL = detectBaseUrl();

// ── Build the widget DOM inside a shadow root ─────────────────────────────
function buildWidget() {
  const host = document.createElement('div');
  host.id = 'hr-chat-widget';
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });

  // Inject styles
  const style = document.createElement('style');
  style.textContent = CSS;
  shadow.appendChild(style);

  // Floating action button
  const fab = document.createElement('button');
  fab.className = 'hw-fab';
  fab.setAttribute('aria-label', 'Open HR Support Chat');
  fab.innerHTML = `
    <span class="hw-fab-dot" aria-hidden="true"></span>
    HR Support
  `;
  shadow.appendChild(fab);

  // Chat window (hidden by default)
  const win = document.createElement('div');
  win.className = 'hw-window';
  win.setAttribute('role', 'dialog');
  win.setAttribute('aria-label', 'HR Support Chat');
  win.hidden = true;

  win.innerHTML = `
    <div class="hw-header">
      <div class="hw-header-brand">
        <div class="hw-header-logo" aria-hidden="true">LR</div>
        <div class="hw-header-text">
          <div class="hw-header-title">LetterRide HR</div>
          <div class="hw-header-sub">Support Assistant</div>
        </div>
      </div>
      <button class="hw-close" aria-label="Close chat">&times;</button>
    </div>
    <div class="hw-messages" role="log" aria-live="polite"></div>
    <div class="hw-input-row" hidden>
      <textarea
        class="hw-live-input"
        placeholder="Type a message..."
        rows="1"
        maxlength="2000"
        aria-label="Message input"
      ></textarea>
      <button class="hw-send-btn">Send</button>
    </div>
    <div class="hw-footer">LetterRide HR &mdash; Confidential</div>
  `;

  shadow.appendChild(win);

  return {
    shadow,
    fab,
    win,
    fabDot:   fab.querySelector('.hw-fab-dot'),
    msgArea:  win.querySelector('.hw-messages'),
    inputRow: win.querySelector('.hw-input-row'),
    closeBtn: win.querySelector('.hw-close'),
  };
}

// ── Toggle open/close ──────────────────────────────────────────────────────
let _isOpen    = false;
let _initiated = false;

function openWidget(elements) {
  const { fab, win } = elements;
  win.hidden = false;
  fab.classList.add('open');
  fab.setAttribute('aria-expanded', 'true');
  _isOpen = true;

  // Start the bot flow on first open
  if (!_initiated) {
    _initiated = true;
    startBot(elements);
  }
}

function closeWidget(elements) {
  const { fab, win } = elements;
  win.hidden = true;
  fab.classList.remove('open');
  fab.setAttribute('aria-expanded', 'false');
  _isOpen = false;
}

// ── Bootstrap ──────────────────────────────────────────────────────────────
async function startBot(elements) {
  const { msgArea, inputRow, fabDot } = elements;

  // Initialize UI module
  ui.init(msgArea, inputRow, fabDot, BASE_URL);

  // Show loading indicator
  const loader = document.createElement('div');
  loader.className = 'hw-msg-bubble';
  loader.innerHTML = `<span class="hw-spinner"></span>Loading...`;
  const loaderWrap = document.createElement('div');
  loaderWrap.className = 'hw-msg';
  loaderWrap.appendChild(loader);
  msgArea.appendChild(loaderWrap);

  try {
    await bot.load(BASE_URL);
    loaderWrap.remove();

    const initialNode = bot.getInitialNode();
    if (!initialNode) throw new Error('Bot logic missing initial node');

    ui.renderNode(initialNode.id);

  } catch (err) {
    loaderWrap.remove();
    const errBubble = document.createElement('div');
    errBubble.className = 'hw-msg-bubble';
    errBubble.textContent =
      'We are experiencing a technical issue. Please contact HR directly at hr@letterride.com.';
    const errWrap = document.createElement('div');
    errWrap.className = 'hw-msg';
    errWrap.appendChild(errBubble);
    msgArea.appendChild(errWrap);
    console.error('[HRChat] Failed to load bot logic:', err);
  }
}

// ── Entry point ────────────────────────────────────────────────────────────
(function init() {
  if (typeof window === 'undefined') return;

  // Wait for DOM to be ready
  function mount() {
    const elements = buildWidget();
    const { fab, closeBtn } = elements;

    fab.addEventListener('click', () => {
      _isOpen ? closeWidget(elements) : openWidget(elements);
    });

    closeBtn.addEventListener('click', () => closeWidget(elements));

    // Expose a minimal global API (optional — for debugging)
    window.HRChat = {
      open:  () => openWidget(elements),
      close: () => closeWidget(elements),
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
