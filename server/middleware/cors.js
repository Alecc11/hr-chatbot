'use strict';

const cors = require('cors');
const { ALLOWED_ORIGINS } = require('../config/env');

const corsOptions = {
  origin(origin, callback) {
    // Allow requests with no origin (e.g. curl, Postman, server-to-server)
    // only in development. In production, require a whitelisted origin.
    if (!origin) {
      if (process.env.NODE_ENV === 'production') {
        return callback(new Error('CORS: no origin header'), false);
      }
      return callback(null, true);
    }

    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS: origin '${origin}' not allowed`), false);
  },
  credentials: true,           // required for HttpOnly cookie transport
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,   // some legacy browsers choke on 204
};

module.exports = cors(corsOptions);
