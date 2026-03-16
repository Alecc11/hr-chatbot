'use strict';

const express = require('express');
const path    = require('path');
const fs      = require('fs');
const router  = express.Router();

const { isOpen, nextOpenTime } = require('../utils/timeGate');

// Load bot-logic.json once at startup, cache in memory.
// Falls back to empty object during Phase 4 before the file exists.
const BOT_LOGIC_PATH = path.join(__dirname, '..', 'data', 'bot-logic.json');
let botLogic = {};

try {
  botLogic = JSON.parse(fs.readFileSync(BOT_LOGIC_PATH, 'utf8'));
  console.log(JSON.stringify({ event: 'bot_logic_loaded', version: botLogic.version || 'unknown' }));
} catch {
  console.warn(JSON.stringify({ event: 'bot_logic_missing', path: BOT_LOGIC_PATH }));
}

// GET /api/bot/logic — serves the full state machine to the widget on init
router.get('/logic', (_req, res) => {
  res.json(botLogic);
});

// GET /api/bot/time-gate — called by the widget's 'gate' node type
// Returns whether live agent support is currently available
router.get('/time-gate', (_req, res) => {
  const open = isOpen();
  res.json({
    open,
    nextOpen: open ? null : nextOpenTime(),
  });
});

module.exports = router;
