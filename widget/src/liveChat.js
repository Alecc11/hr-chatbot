'use strict';

/**
 * Open the visitor WebSocket and wire up callbacks.
 *
 * @param {string}   baseUrl       API server origin
 * @param {string}   sessionToken  Token from POST /api/intake/submit
 * @param {object}   callbacks     { queued, claimed, rep_message, rep_disconnected, error, close }
 * @returns {{ send(text), close() }}
 */
function connect(baseUrl, sessionToken, callbacks) {
  const proto = baseUrl.startsWith('https') ? 'wss' : 'ws';
  const host  = baseUrl.replace(/^https?/, '');
  const url   = `${proto}${host}?role=visitor&sessionToken=${encodeURIComponent(sessionToken)}`;

  const ws = new WebSocket(url);

  ws.addEventListener('message', (event) => {
    let msg;
    try { msg = JSON.parse(event.data); } catch { return; }
    const handler = callbacks[msg.type];
    if (typeof handler === 'function') handler(msg);
  });

  ws.addEventListener('close',  () => typeof callbacks.close === 'function' && callbacks.close());
  ws.addEventListener('error',  () => typeof callbacks.error === 'function' && callbacks.error());

  return {
    send(text) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'message', text }));
      }
    },
    close() {
      ws.close();
    },
  };
}

module.exports = { connect };
