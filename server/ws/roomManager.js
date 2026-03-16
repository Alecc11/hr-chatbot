'use strict';

const { activeSessions } = require('./sessionManager');

function createRoom(roomId, visitorSocket, repSocket, repId, repName) {
  activeSessions.set(roomId, { visitorSocket, repSocket, repId, repName });
}

function getRoom(roomId) {
  return activeSessions.get(roomId) || null;
}

function destroyRoom(roomId) {
  activeSessions.delete(roomId);
}

module.exports = { createRoom, getRoom, destroyRoom };
