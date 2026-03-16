'use strict';

const { WebSocketServer } = require('ws');
const { verifyToken }     = require('../utils/jwtHelper');
const { isOpen }          = require('../utils/timeGate');
const sessionManager      = require('./sessionManager');
const visitorHandler      = require('./handlers/visitorHandler');
const repHandler          = require('./handlers/repHandler');

const wss = new WebSocketServer({ noServer: true });

/**
 * Parse the HttpOnly 'token' cookie from a raw Cookie header string.
 */
function parseCookieToken(cookieHeader) {
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith('token='));
  return match ? match.slice(6) : null;
}

/**
 * Attach the WebSocket upgrade handler to the HTTP server.
 * Called once from server/index.js after the server is created.
 */
function handleUpgrade(server) {
  server.on('upgrade', (req, socket, head) => {
    // Parse role and sessionToken from the URL query string
    const url  = new URL(req.url, 'http://localhost');
    const role = url.searchParams.get('role');

    // ── Time gate: reject all WS connections outside business hours ──────────
    if (!isOpen()) {
      console.log(JSON.stringify({ event: 'ws_rejected_time_gate', role }));
      socket.write('HTTP/1.1 503 Service Unavailable\r\nContent-Type: text/plain\r\n\r\nOffline');
      socket.destroy();
      return;
    }

    // ── Visitor connection ────────────────────────────────────────────────────
    if (role === 'visitor') {
      const sessionToken = url.searchParams.get('sessionToken');
      const session      = sessionToken ? sessionManager.pendingQueue.get(sessionToken) : null;

      // Reject if: no token, unknown token, already claimed, or already has a socket
      if (!session || session.locked || session.visitorSocket) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      wss.handleUpgrade(req, socket, head, (ws) => {
        session.visitorSocket = ws;
        console.log(JSON.stringify({
          event:        'visitor_ws_connected',
          sessionToken,
          name:         `${session.firstName} ${session.lastName}`,
        }));
        visitorHandler(ws, session);
      });

    // ── Rep connection ────────────────────────────────────────────────────────
    } else if (role === 'rep') {
      const token   = parseCookieToken(req.headers.cookie);
      const payload = token ? verifyToken(token) : null;

      if (!payload || payload.role !== 'hr') {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      wss.handleUpgrade(req, socket, head, (ws) => {
        repHandler(ws, payload);
      });

    // ── Unknown role ──────────────────────────────────────────────────────────
    } else {
      socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
      socket.destroy();
    }
  });
}

module.exports = { handleUpgrade };
