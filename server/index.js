'use strict';

// Load and validate all env vars before anything else
require('./config/env');

const http = require('http');
const app  = require('./app');
const { handleUpgrade } = require('./ws/wsServer');
const { PORT } = require('./config/env');

const server = http.createServer(app);

// Attach WebSocket upgrade handler to the HTTP server
handleUpgrade(server);

server.listen(PORT, () => {
  console.log(JSON.stringify({
    event: 'server_start',
    port:  PORT,
    env:   process.env.NODE_ENV,
    time:  new Date().toISOString(),
  }));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log(JSON.stringify({ event: 'shutdown', signal: 'SIGTERM' }));
  server.close(() => process.exit(0));
});

module.exports = server;
