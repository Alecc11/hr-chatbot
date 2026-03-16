'use strict';

const bcrypt = require('bcrypt');

async function comparePassword(plaintext, hash) {
  return bcrypt.compare(plaintext, hash);
}

module.exports = { comparePassword };
