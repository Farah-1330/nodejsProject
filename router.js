// Routing by hand: matches method + URL and calls the right handler.
const notes = require('./notes-store');
const { serveStatic } = require('./static');

function sendJson(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

// Reads the request body (a readable stream) into a string.
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1e6) {
        reject(new Error('Body too large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

async function handleRequest(req, res) {
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);
  const { method } = req;

  // GET /api/health
  if (method === 'GET' && pathname === '/api/health') {
    return sendJson(res, 200, { status: 'ok', uptime: process.uptime() });
  }

  // GET /api/notes
  if (method === 'GET' && pathname === '/api/notes') {
    return sendJson(res, 200, await notes.readNotes());
  }

  // POST /api/notes  { "text": "..." }
  if (method === 'POST' && pathname === '/api/notes') {
    let body;
    try {
      body = JSON.parse(await readBody(req));
    } catch {
      return sendJson(res, 400, { error: 'Invalid JSON body' });
    }
    if (!body.text || typeof body.text !== 'string') {
      return sendJson(res, 400, { error: '"text" is required' });
    }
    return sendJson(res, 201, await notes.addNote(body.text.trim()));
  }

  // DELETE /api/notes/:id
  const match = pathname.match(/^\/api\/notes\/(\d+)$/);
  if (method === 'DELETE' && match) {
    const deleted = await notes.deleteNote(Number(match[1]));
    return deleted
      ? sendJson(res, 200, { deleted: true })
      : sendJson(res, 404, { error: 'Note not found' });
  }

  // Anything else under /api is a 404
  if (pathname.startsWith('/api/')) {
    return sendJson(res, 404, { error: 'Route not found' });
  }

  // Everything else: static files
  if (method === 'GET') return serveStatic(req, res, pathname);

  sendJson(res, 405, { error: 'Method not allowed' });
}

module.exports = { handleRequest };
