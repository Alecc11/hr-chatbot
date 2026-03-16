'use strict';

const express = require('express');
const router  = express.Router();

// GET /api/bot/logic — stub until bot-logic.json is built in Phase 4
router.get('/logic', (_req, res) => {
  res.json({});
});

module.exports = router;
