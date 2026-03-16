'use strict';

const express = require('express');
const router  = express.Router();
const { v4: uuidv4 } = require('uuid');

const { intakeRules, handleValidationErrors } = require('../middleware/sanitize');
const { isOpen }       = require('../utils/timeGate');
const { pendingQueue } = require('../ws/sessionManager');
const { SESSION_TOKEN_TTL_MS } = require('../config/env');

// POST /api/intake/submit
// Validates the intake form, creates a pending session, and returns a sessionToken.
// The client uses this token to authenticate the subsequent WebSocket connection.
router.post('/submit', intakeRules, handleValidationErrors, (req, res) => {
  // Defense-in-depth: check time gate even though the widget already does so
  if (!isOpen()) {
    return res.status(503).json({ error: 'Live agent support is not currently available.' });
  }

  const { firstName, lastName, employeeId } = req.body;
  const sessionToken = uuidv4();

  pendingQueue.set(sessionToken, {
    sessionToken,
    firstName,
    lastName,
    employeeId,
    timestamp:     Date.now(),
    locked:        false,
    claimedBy:     null,
    claimedByName: null,
    visitorSocket: null,
    roomId:        null,
    messageBuffer: [],
  });

  // Auto-expire token if the visitor never opens a WS connection
  setTimeout(() => {
    const session = pendingQueue.get(sessionToken);
    if (session && !session.visitorSocket && !session.locked) {
      pendingQueue.delete(sessionToken);
      console.log(JSON.stringify({ event: 'intake_token_expired', sessionToken }));
    }
  }, SESSION_TOKEN_TTL_MS);

  console.log(JSON.stringify({
    event:        'intake_submitted',
    sessionToken,
    name:         `${firstName} ${lastName}`,
    employeeId,
  }));

  res.json({ sessionToken });
});

module.exports = router;
