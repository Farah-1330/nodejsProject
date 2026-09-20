// Entry point: creates the HTTP server using Node's built-in `http` module.
const http = require('http');
const logger = require('./src/logger');
const { handleRequest } = require('./src/router');

const PORT = process.env.PORT || 3000;

function createServer() {
  return http.createServer(async (req, res) => {
    const start = Date.now();
    logger.emit('request', { method: req.method, url: req.url });

    res.on('finish', () => {
      logger.emit('response', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        ms: Date.now() - start,
      });
    });

    try {
      await handleRequest(req, res);
    } catch (err) {
      logger.emit('error', err);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
      }
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  });
}

// Only start listening when run directly (so tests can import createServer)
if (require.main === module) {
  createServer().listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = { createServer };
