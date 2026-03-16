'use strict';

const i18n      = require('./i18n');
const bot       = require('./bot');
const liveChat  = require('./liveChat');

let _msgArea  = null;
let _inputRow = null;
let _fabDot   = null;
let _baseUrl  = '';
let _wsConn   = null;

// Tracks the visitor's bot-flow path so the agent gets context on claim
let _context = { category: '', topic: '' };

function init(msgArea, inputRow, fabDot, baseUrl) {
  _msgArea  = msgArea;
  _inputRow = inputRow;
  _fabDot   = fabDot;
  _baseUrl  = baseUrl;
}

// ── DOM helpers ────────────────────────────────────────────────────────────

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function scrollBottom() {
  _msgArea.scrollTop = _msgArea.scrollHeight;
}

/** Append a bot bubble (left-aligned white card). */
function appendBotBubble(text) {
  const msg = document.createElement('div');
  msg.className = 'hw-msg';
  const bubble = document.createElement('div');
  bubble.className = 'hw-msg-bubble';
  bubble.textContent = text;
  msg.appendChild(bubble);
  _msgArea.appendChild(msg);
  scrollBottom();
  return msg;
}

/** Append a row with option buttons. Returns the options container. */
function appendOptions(options, onSelect) {
  const container = document.createElement('div');
  container.className = 'hw-options';

  for (const opt of options) {
    const btn = document.createElement('button');
    btn.className = 'hw-opt-btn';
    btn.textContent = i18n.t(opt.label);
    btn.addEventListener('click', () => {
      // Disable all buttons in this set so the user cannot click twice
      container.querySelectorAll('.hw-opt-btn').forEach((b) => {
        b.disabled = true;
        if (b === btn) b.classList.add('selected');
      });
      // Echo the choice on the right side
      appendChoiceEcho(i18n.t(opt.label));
      onSelect(opt);
    });
    container.appendChild(btn);
  }

  _msgArea.appendChild(container);
  scrollBottom();
  return container;
}

/** Visitor's selected choice shown right-aligned. */
function appendChoiceEcho(text) {
  const el = document.createElement('div');
  el.className = 'hw-choice-echo';
  el.textContent = text;
  _msgArea.appendChild(el);
  scrollBottom();
}

/** System / status message (centered, muted). */
function appendSystemMsg(text) {
  const el = document.createElement('div');
  el.className = 'hw-msg-bubble system';
  el.textContent = text;
  _msgArea.appendChild(el);
  scrollBottom();
}

/** Show a brief typing indicator, then remove it and call callback. */
function showTyping(delay, callback) {
  const indicator = document.createElement('div');
  indicator.className = 'hw-typing';
  indicator.innerHTML = '<span></span><span></span><span></span>';
  _msgArea.appendChild(indicator);
  scrollBottom();
  setTimeout(() => {
    indicator.remove();
    callback();
  }, delay);
}

// ── Node renderers ─────────────────────────────────────────────────────────

function renderNode(nodeId) {
  const node = bot.getNode(nodeId);
  if (!node) {
    appendSystemMsg('An error occurred. Please refresh and try again.');
    return;
  }

  // Brief simulated "typing" delay for natural feel (except gate — it does its own async)
  const delay = node.type === 'gate' ? 0 : 420;

  showTyping(delay, () => {
    switch (node.type) {
      case 'select':     renderSelect(node);     break;
      case 'answer':     renderAnswer(node);     break;
      case 'resolution': renderResolution(node); break;
      case 'gate':       renderGate(node);       break;
      case 'form':       renderForm(node);       break;
      case 'end':        renderEnd(node);        break;
      default:
        appendSystemMsg('Unknown step. Please contact HR directly.');
    }
  });
}

function renderSelect(node) {
  appendBotBubble(i18n.t(node.content));
  appendOptions(node.options, (opt) => {
    if (opt.setLang) i18n.setLang(opt.setLang);
    // Track category: options at cat_select lead to topic_* nodes
    if (opt.next && opt.next.startsWith('topic_')) {
      _context.category = opt.label.en || i18n.t(opt.label);
      _context.topic    = ''; // reset if visitor navigates back and picks a different category
    }
    // Track topic: options at topic_* nodes lead to q_* answer nodes
    if (opt.next && opt.next.startsWith('q_')) {
      _context.topic = opt.label.en || i18n.t(opt.label);
    }
    showTyping(300, () => renderNode(opt.next));
  });
}

function renderAnswer(node) {
  appendBotBubble(i18n.t(node.content));
  // Single "Continue" button leading to resolution_check
  const continueLabel = { en: 'Continue', es: 'Continuar' };
  appendOptions([{ label: continueLabel, next: node.next }], (opt) => {
    showTyping(300, () => renderNode(opt.next));
  });
}

function renderResolution(node) {
  appendBotBubble(i18n.t(node.content));
  appendOptions(node.options, (opt) => {
    showTyping(300, () => renderNode(opt.next));
  });
}

async function renderGate(node) {
  // Show spinner bubble while we check
  const spinnerEl = document.createElement('div');
  spinnerEl.className = 'hw-msg-bubble';
  spinnerEl.innerHTML = `<span class="hw-spinner"></span>Checking availability...`;
  const wrap = document.createElement('div');
  wrap.className = 'hw-msg';
  wrap.appendChild(spinnerEl);
  _msgArea.appendChild(wrap);
  scrollBottom();

  try {
    const { open } = await bot.checkTimeGate();
    wrap.remove();
    renderNode(open ? node.onOpen : node.onClosed);
  } catch {
    wrap.remove();
    renderNode(node.onClosed); // fail safe — treat as offline
  }
}

function renderForm(node) {
  appendBotBubble(i18n.t(node.content));

  const formWrap = document.createElement('div');
  formWrap.className = 'hw-msg';

  const formEl = document.createElement('form');
  formEl.className = 'hw-form';
  formEl.noValidate = true;

  const errorEl = document.createElement('div');
  errorEl.className = 'hw-form-error';
  errorEl.hidden = true;

  // Render each field
  for (const field of node.fields) {
    const fieldWrap = document.createElement('div');
    fieldWrap.className = 'hw-field';

    const label = document.createElement('label');
    label.textContent = i18n.t(field.label);
    label.htmlFor = `hw-field-${field.name}`;

    const input = document.createElement('input');
    input.type = 'text';
    input.id   = `hw-field-${field.name}`;
    input.name = field.name;
    input.autocomplete = field.name === 'employeeId' ? 'off' : field.name;
    input.required = field.required;

    fieldWrap.appendChild(label);
    fieldWrap.appendChild(input);
    formEl.appendChild(fieldWrap);
  }

  formEl.appendChild(errorEl);

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'hw-submit-btn';
  submitBtn.textContent = i18n.getLang() === 'es'
    ? 'Conectarme con un representante'
    : 'Connect Me with an Agent';
  formEl.appendChild(submitBtn);

  formEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.hidden = true;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="hw-spinner"></span>${i18n.getLang() === 'es' ? 'Enviando...' : 'Submitting...'}`;

    const data = {};
    for (const field of node.fields) {
      data[field.name] = formEl.elements[field.name].value.trim();
    }
    data.category = _context.category;
    data.topic    = _context.topic;
    data.lang     = i18n.getLang();

    try {
      const res = await fetch(`${_baseUrl}/api/intake/submit`, {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'omit',
        body:        JSON.stringify(data),
      });

      const body = await res.json();

      if (!res.ok) {
        const msg = body.errors
          ? body.errors.map((e) => e.msg).join(' ')
          : (body.error || 'Submission failed.');
        errorEl.textContent = msg;
        errorEl.hidden = false;
        submitBtn.disabled = false;
        submitBtn.textContent = i18n.getLang() === 'es'
          ? 'Conectarme con un representante'
          : 'Connect Me with an Agent';
        return;
      }

      // Disable the form permanently — session created
      submitBtn.textContent = i18n.getLang() === 'es' ? 'Enviado' : 'Submitted';
      formEl.querySelectorAll('input, button').forEach((el) => el.disabled = true);
      formWrap.style.opacity = '0.6';

      // Transition to queued state
      renderNode(node.next);
      openLiveChat(body.sessionToken, data.firstName);

    } catch {
      errorEl.textContent = i18n.getLang() === 'es'
        ? 'Error de red. Por favor intente de nuevo.'
        : 'Network error. Please try again.';
      errorEl.hidden = false;
      submitBtn.disabled = false;
      submitBtn.textContent = i18n.getLang() === 'es'
        ? 'Conectarme con un representante'
        : 'Connect Me with an Agent';
    }
  });

  formWrap.appendChild(formEl);
  _msgArea.appendChild(formWrap);
  scrollBottom();

  // Focus first input
  setTimeout(() => {
    const first = formEl.querySelector('input');
    if (first) first.focus();
  }, 100);
}

function renderEnd(node) {
  appendBotBubble(i18n.t(node.content));
}

// ── Live chat ──────────────────────────────────────────────────────────────

function openLiveChat(sessionToken, firstName) {
  // Update FAB dot to show connecting
  if (_fabDot) _fabDot.className = 'hw-fab-dot connecting';

  _wsConn = liveChat.connect(_baseUrl, sessionToken, {
    queued(msg) {
      if (_fabDot) _fabDot.className = 'hw-fab-dot';
    },
    claimed(msg) {
      if (_fabDot) _fabDot.className = 'hw-fab-dot';
      const connected = i18n.getLang() === 'es'
        ? `Un representante se ha unido a la conversacion.`
        : `An HR representative has joined the conversation.`;
      appendSystemMsg(connected);
      showLiveInput(firstName);
    },
    rep_message(msg) {
      appendLiveBubble('rep', msg.text);
    },
    rep_disconnected() {
      hideLiveInput();
      const disc = i18n.getLang() === 'es'
        ? 'El representante se ha desconectado. La sesion ha finalizado.'
        : 'The representative has disconnected. Your session has ended.';
      appendSystemMsg(disc);
      if (_fabDot) _fabDot.className = 'hw-fab-dot offline';
    },
    close() {
      hideLiveInput();
    },
    error() {
      const err = i18n.getLang() === 'es'
        ? 'Se perdio la conexion. Por favor recargue la pagina e intente de nuevo.'
        : 'Connection lost. Please reload the page and try again.';
      appendSystemMsg(err);
      if (_fabDot) _fabDot.className = 'hw-fab-dot offline';
    },
  });
}

function appendLiveBubble(from, text) {
  const row = document.createElement('div');
  row.className = `hw-live-msg-row from-${from}`;

  const label = document.createElement('div');
  label.className = 'hw-live-label';
  label.textContent = from === 'rep' ? 'HR Representative' : 'You';

  const bubble = document.createElement('div');
  bubble.className = 'hw-live-bubble';
  bubble.textContent = text;

  row.appendChild(label);
  row.appendChild(bubble);
  _msgArea.appendChild(row);
  scrollBottom();
}

function showLiveInput(visitorFirstName) {
  if (!_inputRow) return;
  _inputRow.hidden = false;

  const textarea = _inputRow.querySelector('.hw-live-input');
  const sendBtn  = _inputRow.querySelector('.hw-send-btn');

  function doSend() {
    const text = textarea.value.trim();
    if (!text || !_wsConn) return;
    _wsConn.send(text);
    appendLiveBubble('visitor', text);
    textarea.value = '';
    textarea.style.height = 'auto';
    textarea.focus();
  }

  sendBtn.addEventListener('click', doSend);

  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      doSend();
    }
  });

  textarea.addEventListener('input', () => {
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 96)}px`;
  });

  setTimeout(() => textarea && textarea.focus(), 100);
}

function hideLiveInput() {
  if (_inputRow) _inputRow.hidden = true;
}

module.exports = { init, renderNode };
