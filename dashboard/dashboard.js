'use strict';

// ── State ─────────────────────────────────────────────────────────────────
const state = {
  username:     null,
  ws:           null,
  activeRoomId: null,
  queue:        new Map(),   // sessionToken → { name, employeeId, timestamp }
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

// ── Utility ───────────────────────────────────────────────────────────────
function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60)  return `${diff}s ago`;
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
    console.log('[WS] Rep connected');
  });

  ws.addEventListener('message', (event) => {
    let msg;
    try { msg = JSON.parse(event.data); } catch { return; }
    handleServerMessage(msg);
  });

  ws.addEventListener('close', () => {
    setWsStatus('disconnected');
    toast('Connection lost. Attempting to reconnect...');
    // Reconnect after 3 seconds
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
    case 'queue_update':   handleQueueUpdate(msg.queue);       break;
    case 'incoming_chat':  handleIncomingChat(msg);            break;
    case 'claimed':        handleClaimed(msg);                 break;
    case 'claim_ack':      handleClaimAck(msg);                break;
    case 'claim_denied':   handleClaimDenied(msg);             break;
    case 'visitor_message':   appendMessage('visitor', msg.text, msg.timestamp); break;
    case 'visitor_disconnected': handleVisitorDisconnected(msg); break;
  }
}

// ── Queue management ──────────────────────────────────────────────────────
function handleQueueUpdate(queue) {
  // Rebuild internal map
  state.queue.clear();
  for (const item of queue) {
    state.queue.set(item.sessionToken, item);
  }
  renderQueue();
}

function handleIncomingChat(msg) {
  // Add to map if not present (queue_update may follow, but this animates the new card)
  if (!state.queue.has(msg.sessionToken)) {
    state.queue.set(msg.sessionToken, {
      sessionToken: msg.sessionToken,
      name:         msg.name,
      employeeId:   msg.employeeId,
      timestamp:    msg.timestamp,
    });
    renderQueue();
    highlightCard(msg.sessionToken);
  }
  toast(`New request: ${msg.name}`);
}

function handleClaimed(msg) {
  // Remove card from queue (either claimed by us via claim_ack, or by another rep)
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

  // Remove existing cards (preserve empty placeholder)
  queueList.querySelectorAll('.queue-card').forEach(el => el.remove());

  if (count === 0) {
    queueEmpty.hidden = false;
    return;
  }

  queueEmpty.hidden = true;
  const inChat = !!state.activeRoomId;

  for (const item of items) {
    const card = document.createElement('div');
    card.className = 'queue-card';
    card.dataset.token = item.sessionToken;

    card.innerHTML = `
      <div class="queue-card-name">${escHtml(item.name)}</div>
      <div class="queue-card-meta">Employee ID: ${escHtml(item.employeeId)}</div>
      <div class="queue-card-footer">
        <span class="queue-card-time">${timeAgo(item.timestamp)}</span>
        <button class="btn btn-accept"
          data-token="${escHtml(item.sessionToken)}"
          ${inChat ? 'disabled title="Finish your current chat before accepting a new one."' : ''}>
          Accept
        </button>
      </div>
    `;

    card.querySelector('.btn-accept').addEventListener('click', (e) => {
      const token = e.currentTarget.dataset.token;
      claimSession(token);
    });

    queueList.appendChild(card);
  }

  // Refresh time-ago labels every 30 seconds
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
    // Fallback if transitionend doesn't fire
    setTimeout(callback, 400);
  } else {
    callback();
  }
}

// ── Claim ─────────────────────────────────────────────────────────────────
function claimSession(sessionToken) {
  if (state.activeRoomId) return; // already in a chat
  wsSend({ type: 'claim', sessionToken });

  // Disable all accept buttons while we wait for the server response
  queueList.querySelectorAll('.btn-accept').forEach(btn => btn.disabled = true);
}

function handleClaimAck(msg) {
  state.activeRoomId = msg.roomId;
  openChatPanel(msg.visitorName, msg.employeeId);
  toast(`You are now connected with ${msg.visitorName}.`);
}

function handleClaimDenied(msg) {
  toast('This request was already accepted by another agent.');
  // Re-enable accept buttons on remaining cards
  renderQueue();
}

// ── Chat panel ────────────────────────────────────────────────────────────
function openChatPanel(visitorName, employeeId) {
  chatEmpty.hidden  = true;
  chatActive.hidden = false;

  chatVisName.textContent = visitorName;
  chatVisMeta.textContent = `Employee ID: ${employeeId}`;

  chatMessages.innerHTML = '';
  appendSystemMessage(`Session started with ${visitorName}.`);
  chatInput.focus();

  // Disable accept buttons on queue while in chat
  renderQueue();
}

function closeChatPanel() {
  chatEmpty.hidden  = false;
  chatActive.hidden = true;
  state.activeRoomId = null;
  chatMessages.innerHTML = '';
  renderQueue();  // re-enable accept buttons
}

function appendMessage(from, text, timestamp) {
  const row = document.createElement('div');
  row.className = `message-row from-${from}`;

  const label = from === 'visitor'
    ? (chatVisName.textContent || 'Visitor')
    : 'You';

  row.innerHTML = `
    <div class="message-label">${escHtml(label)}</div>
    <div class="message-bubble">${escHtml(text)}</div>
    <div class="message-time">${formatTime(timestamp || Date.now())}</div>
  `;

  chatMessages.appendChild(row);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function appendSystemMessage(text) {
  const el = document.createElement('div');
  el.className = 'system-message';
  el.textContent = text;
  chatMessages.appendChild(el);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function handleVisitorDisconnected() {
  appendSystemMessage('The visitor has disconnected.');
  state.activeRoomId = null;
  endChatBtn.textContent = 'Close';
}

// ── Send message ──────────────────────────────────────────────────────────
function sendMessage() {
  const text = chatInput.value.trim();
  if (!text || !state.activeRoomId) return;

  wsSend({ type: 'message', roomId: state.activeRoomId, text });
  appendMessage('rep', text, Date.now());
  chatInput.value = '';
  chatInput.style.height = 'auto';
  chatInput.focus();
}

sendBtn.addEventListener('click', sendMessage);

chatInput.addEventListener('keydown', (e) => {
  // Send on Enter (not Shift+Enter which adds a newline)
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Auto-grow textarea
chatInput.addEventListener('input', () => {
  chatInput.style.height = 'auto';
  chatInput.style.height = `${Math.min(chatInput.scrollHeight, 120)}px`;
});

// ── End chat ──────────────────────────────────────────────────────────────
endChatBtn.addEventListener('click', () => {
  if (state.activeRoomId) {
    wsSend({ type: 'close_chat', roomId: state.activeRoomId });
  }
  closeChatPanel();
  endChatBtn.textContent = 'End Chat';
});

// ── Logout ────────────────────────────────────────────────────────────────
logoutBtn.addEventListener('click', async () => {
  if (state.ws) state.ws.close();
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
  location.reload();
});

// ── Security: HTML escaping ───────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
