'use strict';

const { verifyToken } = require('../utils/jwtHelper');

function authMiddleware(req, res, next) {
  const token = req.cookies && req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired session.' });
  }

  req.user = payload;
  next();
}

module.exports = authMiddleware;
