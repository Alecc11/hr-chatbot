'use strict';

const express = require('express');
const router  = express.Router();

const { loginRules, handleValidationErrors } = require('../middleware/sanitize');
const { comparePassword } = require('../utils/bcryptHelper');
const { signToken }       = require('../utils/jwtHelper');
const { HR_USERS }        = require('../config/env');

// POST /api/auth/login
router.post('/login', loginRules, handleValidationErrors, async (req, res) => {
  const { username, password } = req.body;

  const user = HR_USERS.find((u) => u.name === username);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const valid = await comparePassword(password, user.hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const token = signToken({ username: user.name, role: 'hr' });

  res.cookie('token', token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   8 * 60 * 60 * 1000,  // 8 hours in ms
  });

  res.json({ ok: true, username: user.name });
});

// POST /api/auth/logout
router.post('/logout', (_req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'strict' });
  res.json({ ok: true });
});

module.exports = router;
