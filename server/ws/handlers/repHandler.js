'use strict';

const { v4: uuidv4 } = require('uuid');
const sessionManager = require('../sessionManager');
const roomManager    = require('../roomManager');

function send(ws, data) {
  if (ws.readyState === 1 /* OPEN */) {
    ws.send(JSON.stringify(data));
  }
}

function broadcastToReps(data) {
  const payload = JSON.stringify(data);
  for (const repWs of sessionManager.repConnections) {
    if (repWs.readyState === 1) repWs.send(payload);
  }
}

function repHandler(ws, user) {
  const { username } = user;

  // Register this rep connection
  sessionManager.repConnections.add(ws);
  console.log(JSON.stringify({ event: 'rep_connected', username }));

  // Send the current pending queue immediately on connect
  send(ws, { type: 'queue_update', queue: sessionManager.getQueueSnapshot() });

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.type) {
      case 'claim':
        handleClaim(ws, username, msg.sessionToken);
        break;
      case 'message':
        handleMessage(ws, username, msg.roomId, msg.text);
        break;
      case 'close_chat':
        handleCloseChat(ws, msg.roomId);
        break;
    }
  });

  ws.on('close', () => {
    console.log(JSON.stringify({ event: 'rep_disconnected', username }));
    sessionManager.repConnections.delete(ws);

    // Notify any visitor whose active session this rep owned
    for (const [roomId, room] of sessionManager.activeSessions) {
      if (room.repSocket === ws) {
        send(room.visitorSocket, { type: 'rep_disconnected' });
        sessionManager.activeSessions.delete(roomId);
        console.log(JSON.stringify({ event: 'room_dropped_on_rep_disconnect', roomId }));
      }
    }
  });

  ws.on('error', (err) => {
    console.error(JSON.stringify({ event: 'rep_ws_error', username, error: err.message }));
  });
}

function handleClaim(ws, username, sessionToken) {
  if (!sessionToken) return;

  const result = sessionManager.claimSession(sessionToken, username, username);

  if (!result.success) {
    send(ws, { type: 'claim_denied', sessionToken, reason: result.reason });
    console.log(JSON.stringify({ event: 'claim_denied', sessionToken, by: username, reason: result.reason }));
    return;
  }

  const { session } = result;
  const roomId = `room_${uuidv4()}`;
  session.roomId = roomId;

  // Move session out of the pending queue into active sessions
  sessionManager.pendingQueue.delete(sessionToken);
  roomManager.createRoom(roomId, session.visitorSocket, ws, username, username);

  console.log(JSON.stringify({ event: 'session_claimed', sessionToken, roomId, claimedBy: username }));

  // Broadcast to ALL reps — removes card from other dashboards and transitions
  // the claiming rep's UI from queue view to chat view
  broadcastToReps({ type: 'claimed', sessionToken, claimedBy: username });

  // Refresh queue for all reps
  broadcastToReps({ type: 'queue_update', queue: sessionManager.getQueueSnapshot() });

  // Private acknowledgement to the claiming rep only
  send(ws, {
    type:        'claim_ack',
    sessionToken,
    roomId,
    visitorName: `${session.firstName} ${session.lastName}`,
    employeeId:  session.employeeId,
  });

  // Notify visitor that a rep has joined
  send(session.visitorSocket, { type: 'claimed', repName: username });

  // Flush any messages the visitor sent before the rep claimed
  for (const buffered of session.messageBuffer) {
    send(ws, {
      type:      'visitor_message',
      roomId,
      text:      buffered.text,
      timestamp: buffered.timestamp,
    });
  }
  session.messageBuffer = [];
}

function handleMessage(ws, username, roomId, text) {
  if (!roomId || typeof text !== 'string') return;
  const trimmed = text.trim().slice(0, 2000);
  if (!trimmed) return;

  const room = roomManager.getRoom(roomId);
  // Verify the sender actually owns this room
  if (!room || room.repSocket !== ws) return;

  send(room.visitorSocket, {
    type:      'rep_message',
    text:      trimmed,
    timestamp: Date.now(),
  });
}

function handleCloseChat(ws, roomId) {
  if (!roomId) return;
  const room = roomManager.getRoom(roomId);
  if (!room || room.repSocket !== ws) return;

  send(room.visitorSocket, { type: 'rep_disconnected' });
  roomManager.destroyRoom(roomId);
  console.log(JSON.stringify({ event: 'chat_closed_by_rep', roomId }));
}

module.exports = repHandler;
