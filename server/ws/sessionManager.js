'use strict';

const { SESSION_TOKEN_TTL_MS } = require('../config/env');

/**
 * pendingQueue: sessions created by POST /api/intake/submit, awaiting WS connection.
 * Key: sessionToken (UUID string)
 * Value: {
 *   sessionToken, firstName, lastName, employeeId,
 *   timestamp, locked, claimedBy, claimedByName,
 *   visitorSocket, roomId, messageBuffer
 * }
 */
const pendingQueue = new Map();

/**
 * activeSessions: live 1-on-1 chats.
 * Key: roomId
 * Value: { visitorSocket, repSocket, repId, repName }
 */
const activeSessions = new Map();

/**
 * repConnections: all currently authenticated rep WebSocket connections.
 */
const repConnections = new Set();

/**
 * Atomically claim a pending session for a rep.
 *
 * Safe under Node.js single-threaded event loop. Steps 2 and 3 are
 * synchronous with no awaits between them, so no two claim handlers
 * can interleave: the first to reach step 2 sees locked===false and
 * sets it to true; every subsequent caller sees locked===true and exits.
 *
 * @returns {{ success: true, session } | { success: false, reason: string }}
 */
function claimSession(sessionToken, repId, repName) {
  const session = pendingQueue.get(sessionToken);

  // Step 1: Does the session exist?
  if (!session) return { success: false, reason: 'not_found' };

  // Step 2: Check the mutex flag (synchronous — no await before step 3)
  if (session.locked) return { success: false, reason: 'already_claimed' };

  // Step 3: Set the mutex flag (atomically, from the event loop's perspective)
  session.locked       = true;
  session.claimedBy    = repId;
  session.claimedByName = repName;

  return { success: true, session };
}

/**
 * Returns a clean snapshot of the pending queue for broadcasting to rep dashboards.
 * Only includes unlocked sessions that have an active visitor socket.
 */
function getQueueSnapshot() {
  return [...pendingQueue.values()]
    .filter((s) => !s.locked && s.visitorSocket !== null)
    .map((s) => ({
      sessionToken: s.sessionToken,
      name:         `${s.firstName} ${s.lastName}`,
      employeeId:   s.employeeId,
      timestamp:    s.timestamp,
    }));
}

// Periodic cleanup: remove intake sessions that timed out before a WS ever connected
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of pendingQueue) {
    if (!session.locked && !session.visitorSocket && (now - session.timestamp) > SESSION_TOKEN_TTL_MS) {
      pendingQueue.delete(token);
      console.log(JSON.stringify({ event: 'session_ttl_expired', sessionToken: token }));
    }
  }
}, 60_000);

module.exports = {
  pendingQueue,
  activeSessions,
  repConnections,
  claimSession,
  getQueueSnapshot,
};
