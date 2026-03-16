'use strict';

require('dotenv').config();

const REQUIRED = [
  'NODE_ENV',
  'PORT',
  'JWT_SECRET',
  'JWT_EXPIRY',
  'HR_USER_1_NAME', 'HR_USER_1_HASH',
  'HR_USER_2_NAME', 'HR_USER_2_HASH',
  'HR_USER_3_NAME', 'HR_USER_3_HASH',
  'HR_USER_4_NAME', 'HR_USER_4_HASH',
];

const missing = REQUIRED.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(`[STARTUP ERROR] Missing required environment variables:\n  ${missing.join('\n  ')}`);
  process.exit(1);
}

module.exports = {
  NODE_ENV:    process.env.NODE_ENV,
  PORT:        parseInt(process.env.PORT, 10) || 3000,
  JWT_SECRET:  process.env.JWT_SECRET,
  JWT_EXPIRY:  process.env.JWT_EXPIRY,

  ALLOWED_ORIGINS: [
    process.env.ALLOWED_ORIGIN_1 || 'https://www.letterride.com',
    process.env.ALLOWED_ORIGIN_2 || 'http://localhost:3000',
    process.env.ALLOWED_ORIGIN_3,
  ].filter(Boolean),

  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
  RATE_LIMIT_MAX:       parseInt(process.env.RATE_LIMIT_MAX, 10)        || 50,

  SESSION_TOKEN_TTL_MS: parseInt(process.env.SESSION_TOKEN_TTL_MS, 10) || 600000,

  HR_USERS: [
    { name: process.env.HR_USER_1_NAME, hash: process.env.HR_USER_1_HASH },
    { name: process.env.HR_USER_2_NAME, hash: process.env.HR_USER_2_HASH },
    { name: process.env.HR_USER_3_NAME, hash: process.env.HR_USER_3_HASH },
    { name: process.env.HR_USER_4_NAME, hash: process.env.HR_USER_4_HASH },
  ],
};
