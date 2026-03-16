'use strict';

// ── State ─────────────────────────────────────────────────────────────────
const state = {
  username:      null,
  ws:            null,
  viewingRoomId: null,   // which chat is currently displayed in the main panel
  chats:         new Map(), // roomId → { roomId, visitorName, employeeId, category, topic, lang, messages[], unread, ended }
  queue:         new Map(), // sessionToken → { name, employeeId, timestamp }
};

// ── DOM references ────────────────────────────────────────────────────────
const loginScreen    = document.getElementById('login-screen');
const dashScreen     = document.getElementById('dashboard-screen');
const loginForm      = document.getElementById('login-form');
const loginError     = document.getElementById('login-error');
const loginBtn       = document.getElementById('login-btn');
const logoutBtn      = document.getElementById('logout-btn');
const headerRepName  = document.getElementById('header-rep-name');
const wsDot          = document.getElementById('ws-status-dot');
const wsLabel        = document.getElementById('ws-status-label');
const activeChatsList = document.getElementById('active-chats-list');
const activeEmpty    = document.getElementById('active-empty');
const activeCount    = document.getElementById('active-count');
const queueList      = document.getElementById('queue-list');
const queueEmpty     = document.getElementById('queue-empty');
const queueCount     = document.getElementById('queue-count');
const chatEmpty      = document.getElementById('chat-empty-state');
const chatActive     = document.getElementById('chat-active');
const chatMessages   = document.getElementById('chat-messages');
const chatVisName    = document.getElementById('chat-visitor-name');
const chatVisMeta    = document.getElementById('chat-visitor-meta');
const chatInput      = document.getElementById('chat-input');
const sendBtn        = document.getElementById('send-btn');
const endChatBtn     = document.getElementById('end-chat-btn');

// ── Toast container ───────────────────────────────────────────────────────
const toastContainer = document.createElement('div');
toastContainer.id = 'toast-container';
document.body.appendChild(toastContainer);

// ── Notification helpers ───────────────────────────────────────────────────
const ORIGINAL_TITLE = document.title;
let _tabFlashInterval = null;
let _pendingCount = 0;

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [[880, 0, 0.15], [660, 0.18, 0.22]].forEach(([freq, startAt, endAt]) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + startAt);
      gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + startAt + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + endAt);
      osc.start(ctx.currentTime + startAt);
      osc.stop(ctx.currentTime + endAt);
    });
  } catch { /* AudioContext blocked; skip */ }
}

function startTabFlash(count) {
  _pendingCount = count;
  if (_tabFlashInterval) return;
  let toggle = true;
  document.title = `(${count}) New Request — HR Dashboard`;
  _tabFlashInterval = setInterval(() => {
    document.title = toggle
      ? `(${_pendingCount}) New Request — HR Dashboard`
      : ORIGINAL_TITLE;
    toggle = !toggle;
  }, 1200);
}

function stopTabFlash() {
  if (_tabFlashInterval) {
    clearInterval(_tabFlashInterval);
    _tabFlashInterval = null;
  }
  document.title = ORIGINAL_TITLE;
  _pendingCount = 0;
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) stopTabFlash();
});
window.addEventListener('focus', stopTabFlash);

// ── Utility ───────────────────────────────────────────────────────────────
function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  toastContainer.appendChild(el);
  setTimeout(() => el.remove(), 4100);
}

function setWsStatus(status) {
  wsDot.className  = `status-dot ${status}`;
  wsLabel.textContent = {
    connected:    'Connected',
    disconnected: 'Disconnected',
    connecting:   'Connecting...',
  }[status] || status;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ── Login ─────────────────────────────────────────────────────────────────
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.hidden = true;
  loginBtn.disabled = true;
  loginBtn.textContent = 'Signing in...';

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  try {
    const res = await fetch('/api/auth/login', {
      method:      'POST',
      headers:     { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body:        JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      loginError.textContent = data.error || 'Login failed. Please check your credentials.';
      loginError.hidden = false;
      return;
    }

    state.username = data.username;
    showDashboard();

  } catch {
    loginError.textContent = 'Unable to reach the server. Please try again.';
    loginError.hidden = false;
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Sign In';
  }
});

// ── Show dashboard & connect WS ───────────────────────────────────────────
function showDashboard() {
  loginScreen.hidden = true;
  dashScreen.hidden  = false;
  headerRepName.textContent = state.username;
  connectWS();
}

// ── WebSocket ─────────────────────────────────────────────────────────────
function connectWS() {
  setWsStatus('connecting');

  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const ws = new WebSocket(`${proto}//${location.host}?role=rep`);
  state.ws = ws;

  ws.addEventListener('open', () => {
    setWsStatus('connected');
  });

  ws.addEventListener('message', (event) => {
    let msg;
    try { msg = JSON.parse(event.data); } catch { return; }
    handleServerMessage(msg);
  });

  ws.addEventListener('close', () => {
    setWsStatus('disconnected');
    toast('Connection lost. Attempting to reconnect...');
    setTimeout(connectWS, 3000);
  });

  ws.addEventListener('error', () => {
    ws.close();
  });
}

function wsSend(msg) {
  if (state.ws && state.ws.readyState === WebSocket.OPEN) {
    state.ws.send(JSON.stringify(msg));
  }
}

// ── Server message dispatch ───────────────────────────────────────────────
function handleServerMessage(msg) {
  switch (msg.type) {
    case 'queue_update':        handleQueueUpdate(msg.queue);                              break;
    case 'incoming_chat':       handleIncomingChat(msg);                                   break;
    case 'claimed':             handleClaimed(msg);                                        break;
    case 'claim_ack':           handleClaimAck(msg);                                       break;
    case 'claim_denied':        handleClaimDenied();                                       break;
    case 'visitor_message':     appendMessage(msg.roomId, 'visitor', msg.text, msg.timestamp); break;
    case 'visitor_disconnected': handleVisitorDisconnected(msg);                           break;
  }
}

// ── Queue management ──────────────────────────────────────────────────────
function handleQueueUpdate(queue) {
  state.queue.clear();
  for (const item of queue) {
    state.queue.set(item.sessionToken, item);
  }
  renderQueue();
}

function handleIncomingChat(msg) {
  if (!state.queue.has(msg.sessionToken)) {
    state.queue.set(msg.sessionToken, {
      sessionToken: msg.sessionToken,
      name:         msg.name,
      employeeId:   msg.employeeId,
      timestamp:    msg.timestamp,
    });
    renderQueue();
    highlightCard(msg.sessionToken);
    playNotificationSound();
    if (document.hidden || !document.hasFocus()) {
      startTabFlash(state.queue.size);
    }
  }
  toast(`New request: ${msg.name}`);
}

function handleClaimed(msg) {
  if (state.queue.has(msg.sessionToken)) {
    fadeOutCard(msg.sessionToken, () => {
      state.queue.delete(msg.sessionToken);
      renderQueue();
    });
  }
}

function renderQueue() {
  const items = [...state.queue.values()];
  const count = items.length;

  queueCount.textContent = count;
  queueCount.className   = `queue-badge${count === 0 ? ' zero' : ''}`;

  queueList.querySelectorAll('.queue-card').forEach(el => el.remove());

  if (count === 0) {
    queueEmpty.hidden = false;
    stopTabFlash();
    return;
  }

  queueEmpty.hidden = true;

  for (const item of items) {
    const card = document.createElement('div');
    card.className = 'queue-card';
    card.dataset.token = item.sessionToken;

    card.innerHTML = `
      <div class="queue-card-name">${escHtml(item.name)}</div>
      <div class="queue-card-meta">Employee ID: ${escHtml(item.employeeId)}</div>
      <div class="queue-card-footer">
        <span class="queue-card-time">${timeAgo(item.timestamp)}</span>
        <button class="btn btn-accept" data-token="${escHtml(item.sessionToken)}">Accept</button>
      </div>
    `;

    card.querySelector('.btn-accept').addEventListener('click', (e) => {
      claimSession(e.currentTarget.dataset.token);
    });

    queueList.appendChild(card);
  }

  clearTimeout(renderQueue._timer);
  renderQueue._timer = setTimeout(renderQueue, 30_000);
}

function highlightCard(token) {
  const card = queueList.querySelector(`[data-token="${token}"]`);
  if (card) {
    card.classList.add('new-arrival');
    setTimeout(() => card.classList.remove('new-arrival'), 3000);
  }
}

function fadeOutCard(token, callback) {
  const card = queueList.querySelector(`[data-token="${token}"]`);
  if (card) {
    card.classList.add('fading-out');
    card.addEventListener('transitionend', () => { card.remove(); callback(); }, { once: true });
    setTimeout(callback, 400);
  } else {
    callback();
  }
}

// ── Claim ─────────────────────────────────────────────────────────────────
function claimSession(sessionToken) {
  wsSend({ type: 'claim', sessionToken });
  // Briefly disable all accept buttons to prevent double-clicks
  queueList.querySelectorAll('.btn-accept').forEach(btn => btn.disabled = true);
  setTimeout(() => queueList.querySelectorAll('.btn-accept').forEach(btn => btn.disabled = false), 1500);
}

function handleClaimAck(msg) {
  const chat = {
    roomId:      msg.roomId,
    visitorName: msg.visitorName,
    employeeId:  msg.employeeId,
    category:    msg.category || '',
    topic:       msg.topic    || '',
    lang:        msg.lang     || 'en',
    messages:    [{ from: 'system', text: `Session started with ${msg.visitorName}.`, timestamp: Date.now() }],
    unread:      0,
    ended:       false,
  };
  state.chats.set(msg.roomId, chat);
  renderChats();
  switchToChat(msg.roomId);
  toast(`Connected with ${msg.visitorName}.`);
}

function handleClaimDenied() {
  toast('This request was already accepted by another agent.');
  renderQueue();
}

// ── Active chats sidebar ──────────────────────────────────────────────────
function renderChats() {
  activeChatsList.querySelectorAll('.active-chat-card').forEach(el => el.remove());

  const count = state.chats.size;
  activeCount.textContent = count;
  activeCount.className   = `queue-badge${count === 0 ? ' zero' : ''}`;

  if (count === 0) {
    activeEmpty.hidden = false;
    return;
  }

  activeEmpty.hidden = true;

  for (const chat of state.chats.values()) {
    const isViewing = chat.roomId === state.viewingRoomId;

    const card = document.createElement('div');
    card.className = [
      'active-chat-card',
      isViewing ? 'active' : '',
      chat.ended ? 'ended' : '',
    ].filter(Boolean).join(' ');
    card.dataset.roomId = chat.roomId;

    const unreadBadge = chat.unread > 0
      ? `<span class="unread-badge">${chat.unread}</span>`
      : '';

    const subLine = chat.category
      ? `<div class="active-chat-sub">${escHtml(chat.category)}${chat.topic ? ` › ${escHtml(chat.topic)}` : ''}</div>`
      : '';

    const endedLine = chat.ended
      ? `<div class="active-chat-ended">Session ended — click to close</div>`
      : '';

    card.innerHTML = `
      <div class="active-chat-name">${escHtml(chat.visitorName)}${unreadBadge}</div>
      ${subLine}
      ${endedLine}
    `;

    card.addEventListener('click', () => switchToChat(chat.roomId));
    activeChatsList.appendChild(card);
  }
}

// ── Switch active chat view ───────────────────────────────────────────────
function switchToChat(roomId) {
  const chat = state.chats.get(roomId);
  if (!chat) return;

  state.viewingRoomId = roomId;
  chat.unread = 0;

  chatEmpty.hidden  = true;
  chatActive.hidden = false;

  chatVisName.textContent = chat.visitorName;
  chatVisMeta.textContent = `Employee ID: ${chat.employeeId}`;

  // Re-render all messages from scratch
  chatMessages.innerHTML = '';

  // Context banner
  if (chat.category || chat.topic) {
    const langLabel = chat.lang === 'es' ? 'Spanish' : 'English';
    const banner = document.createElement('div');
    banner.className = 'context-banner';
    banner.innerHTML = `
      <div class="context-banner-title">Visitor Context</div>
      <div class="context-banner-rows">
        <div class="context-banner-row"><span class="context-label">Language</span>${escHtml(langLabel)}</div>
        ${chat.category ? `<div class="context-banner-row"><span class="context-label">Category</span>${escHtml(chat.category)}</div>` : ''}
        ${chat.topic    ? `<div class="context-banner-row"><span class="context-label">Topic</span>${escHtml(chat.topic)}</div>` : ''}
      </div>
      <div class="context-banner-note">Bot could not fully resolve this — visitor requested a live agent.</div>
    `;
    chatMessages.appendChild(banner);
  }

  // Replay stored messages
  for (const m of chat.messages) {
    if (m.from === 'system') {
      renderSystemMsgDOM(m.text);
    } else {
      renderMsgDOM(m.from, m.text, m.timestamp, chat.visitorName);
    }
  }

  // Input state
  const ended = chat.ended;
  chatInput.disabled = ended;
  sendBtn.disabled   = ended;
  endChatBtn.textContent = ended ? 'Close' : 'End Chat';

  // Highlight correct sidebar card
  renderChats();

  chatMessages.scrollTop = chatMessages.scrollHeight;
  if (!ended) chatInput.focus();
}

// ── Message rendering ─────────────────────────────────────────────────────
function appendMessage(roomId, from, text, timestamp) {
  const chat = state.chats.get(roomId);
  if (!chat) return;

  const msg = { from, text, timestamp: timestamp || Date.now() };
  chat.messages.push(msg);

  if (roomId === state.viewingRoomId) {
    renderMsgDOM(from, text, msg.timestamp, chat.visitorName);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  } else {
    chat.unread++;
    renderChats();
  }
}

function renderMsgDOM(from, text, timestamp, visitorName) {
  const label = from === 'visitor' ? (visitorName || 'Visitor') : 'You';
  const row = document.createElement('div');
  row.className = `message-row from-${from}`;
  row.innerHTML = `
    <div class="message-label">${escHtml(label)}</div>
    <div class="message-bubble">${escHtml(text)}</div>
    <div class="message-time">${formatTime(timestamp)}</div>
  `;
  chatMessages.appendChild(row);
}

function renderSystemMsgDOM(text) {
  const el = document.createElement('div');
  el.className = 'system-message';
  el.textContent = text;
  chatMessages.appendChild(el);
}

function appendSystemToChat(roomId, text) {
  const chat = state.chats.get(roomId);
  if (!chat) return;
  const msg = { from: 'system', text, timestamp: Date.now() };
  chat.messages.push(msg);
  if (roomId === state.viewingRoomId) {
    renderSystemMsgDOM(text);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

// ── Visitor disconnected ──────────────────────────────────────────────────
function handleVisitorDisconnected(msg) {
  const chat = state.chats.get(msg.roomId);
  if (!chat) return;

  chat.ended = true;
  appendSystemToChat(msg.roomId, 'The visitor has disconnected.');

  if (msg.roomId === state.viewingRoomId) {
    chatInput.disabled = true;
    sendBtn.disabled   = true;
    endChatBtn.textContent = 'Close';
  }

  renderChats();
}

// ── Send message ──────────────────────────────────────────────────────────
function sendMessage() {
  const text = chatInput.value.trim();
  if (!text || !state.viewingRoomId) return;

  const chat = state.chats.get(state.viewingRoomId);
  if (!chat || chat.ended) return;

  wsSend({ type: 'message', roomId: state.viewingRoomId, text });
  appendMessage(state.viewingRoomId, 'rep', text, Date.now());
  chatInput.value = '';
  chatInput.style.height = 'auto';
  chatInput.focus();
}

sendBtn.addEventListener('click', sendMessage);

chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

chatInput.addEventListener('input', () => {
  chatInput.style.height = 'auto';
  chatInput.style.height = `${Math.min(chatInput.scrollHeight, 120)}px`;
});

// ── End / close chat ──────────────────────────────────────────────────────
endChatBtn.addEventListener('click', () => {
  const roomId = state.viewingRoomId;
  if (!roomId) return;

  const chat = state.chats.get(roomId);
  if (!chat) return;

  if (!chat.ended) {
    wsSend({ type: 'close_chat', roomId });
  }

  state.chats.delete(roomId);
  state.viewingRoomId = null;

  // Switch to another open chat, or show empty state
  const remaining = [...state.chats.values()].filter(c => !c.ended);
  const any       = [...state.chats.keys()];

  if (remaining.length > 0) {
    switchToChat(remaining[0].roomId);
  } else if (any.length > 0) {
    switchToChat(any[0]);
  } else {
    chatEmpty.hidden  = false;
    chatActive.hidden = true;
    renderChats();
  }

  endChatBtn.textContent = 'End Chat';
});

// ── Logout ────────────────────────────────────────────────────────────────
logoutBtn.addEventListener('click', async () => {
  if (state.ws) state.ws.close();
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
  location.reload();
});
