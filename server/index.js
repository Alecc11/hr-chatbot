'use strict';

// Load and validate all env vars before anything else
require('./config/env');

const http = require('http');
const app  = require('./app');
const { PORT } = require('./config/env');

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(JSON.stringify({
    event:   'server_start',
    port:    PORT,
    env:     process.env.NODE_ENV,
    time:    new Date().toISOString(),
  }));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log(JSON.stringify({ event: 'shutdown', signal: 'SIGTERM' }));
  server.close(() => process.exit(0));
});

module.exports = server;  // exported for WS attachment in Phase 5
