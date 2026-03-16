'use strict';

const sessionManager = require('../sessionManager');

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

function visitorHandler(ws, session) {
  // Tell visitor they are queued
  send(ws, {
    type:     'queued',
    position: sessionManager.getQueueSnapshot().length,
  });

  // Alert all reps of the new visitor
  broadcastToReps({
    type:         'incoming_chat',
    sessionToken: session.sessionToken,
    name:         `${session.firstName} ${session.lastName}`,
    employeeId:   session.employeeId,
    timestamp:    session.timestamp,
  });

  broadcastToReps({ type: 'queue_update', queue: sessionManager.getQueueSnapshot() });

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    if (msg.type !== 'message' || typeof msg.text !== 'string') return;

    const text = msg.text.trim().slice(0, 2000);
    if (!text) return;

    if (session.roomId) {
      // Session is claimed — forward to rep
      const room = sessionManager.activeSessions.get(session.roomId);
      if (room) {
        send(room.repSocket, {
          type:      'visitor_message',
          roomId:    session.roomId,
          text,
          timestamp: Date.now(),
        });
      }
    } else {
      // Still in queue — buffer until a rep claims
      session.messageBuffer.push({ text, timestamp: Date.now() });
    }
  });

  ws.on('close', () => {
    console.log(JSON.stringify({
      event:        'visitor_disconnected',
      sessionToken: session.sessionToken,
    }));

    if (session.roomId) {
      // Notify the rep and clean up the room
      const room = sessionManager.activeSessions.get(session.roomId);
      if (room) {
        send(room.repSocket, { type: 'visitor_disconnected', roomId: session.roomId });
        sessionManager.activeSessions.delete(session.roomId);
      }
    } else {
      // Remove from pending queue and refresh reps
      sessionManager.pendingQueue.delete(session.sessionToken);
      broadcastToReps({ type: 'queue_update', queue: sessionManager.getQueueSnapshot() });
    }
  });

  ws.on('error', (err) => {
    console.error(JSON.stringify({
      event:        'visitor_ws_error',
      sessionToken: session.sessionToken,
      error:        err.message,
    }));
  });
}

module.exports = visitorHandler;
