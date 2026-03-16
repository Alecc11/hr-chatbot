'use strict';

const express = require('express');
const router  = express.Router();

const { intakeRules, handleValidationErrors } = require('../middleware/sanitize');

// POST /api/intake/submit — stub until Phase 5 (WebSocket session manager)
router.post('/submit', intakeRules, handleValidationErrors, (_req, res) => {
  res.status(503).json({ error: 'Live agent support not yet available.' });
});

module.exports = router;
