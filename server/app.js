'use strict';

const express = require('express');
const helmet  = require('helmet');
const cookieParser = require('cookie-parser');
const path    = require('path');

const corsMiddleware  = require('./middleware/cors');
const rateLimiter     = require('./middleware/rateLimiter');
const authMiddleware  = require('./middleware/auth');

const app = express();

// ─────────────────────────────────────────────
// 1. Security headers — first, before any response
// ─────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'", 'https://www.letterride.com'],
      connectSrc:  ["'self'", 'https://www.letterride.com', 'wss:'],
    },
  },
  frameguard: { action: 'deny' },
  hsts: { maxAge: 31536000, includeSubDomains: true },
}));

// ─────────────────────────────────────────────
// 2. Health check — before CORS so Render pings are never blocked
// ─────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ─────────────────────────────────────────────
// 3. CORS — before rate limiting (handles preflight OPTIONS)
// ─────────────────────────────────────────────
app.use(corsMiddleware);

// ─────────────────────────────────────────────
// 4. Rate limiting — applied to all /api/* routes
// ─────────────────────────────────────────────
app.use('/api', rateLimiter);

// ─────────────────────────────────────────────
// 5. Body parsing — after rate limiting (don't parse rejected requests)
// ─────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));
app.use(cookieParser());

// ─────────────────────────────────────────────
// 6. Static files (widget bundle)
// ─────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '..', 'public')));

// ─────────────────────────────────────────────
// 7. Application routes
// ─────────────────────────────────────────────
app.use('/api/auth',   require('./routes/auth'));
app.use('/api/bot',    require('./routes/bot'));
app.use('/api/intake', require('./routes/intake'));

// ─────────────────────────────────────────────
// 8. Dashboard — serve HTML, protected by JWT auth on API calls
// ─────────────────────────────────────────────
app.use('/dashboard', express.static(path.join(__dirname, '..', 'dashboard')));

// ─────────────────────────────────────────────
// 9. 404 handler — JSON only, never HTML
// ─────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

// ─────────────────────────────────────────────
// 10. Global error handler
// ─────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  // CORS errors come through here
  if (err.message && err.message.startsWith('CORS:')) {
    return res.status(403).json({ error: err.message });
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }

  res.status(err.status || 500).json({ error: 'An internal error occurred.' });
});

module.exports = app;
