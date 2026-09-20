// Events: a custom EventEmitter that logs every request.
// The server "emits" events, and listeners react to them.
const EventEmitter = require('events');

class RequestLogger extends EventEmitter {}

const logger = new RequestLogger();

logger.on('request', ({ method, url }) => {
  console.log(`[${new Date().toISOString()}] --> ${method} ${url}`);
});

logger.on('response', ({ method, url, statusCode, ms }) => {
  console.log(`[${new Date().toISOString()}] <-- ${method} ${url} ${statusCode} (${ms}ms)`);
});

logger.on('error', (err) => {
  console.error(`[${new Date().toISOString()}] !! ${err.message}`);
});

module.exports = logger;
