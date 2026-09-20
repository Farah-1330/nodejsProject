// Streams: serves files from /public by piping a read stream into the response.
// Large files are sent in chunks instead of being loaded fully into memory.
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function serveStatic(req, res, pathname) {
  const relative = pathname === '/' ? 'index.html' : pathname;
  const filePath = path.normalize(path.join(PUBLIC_DIR, relative));

  // Prevent path traversal (e.g. /../../etc/passwd)
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Forbidden');
  }

  const stream = fs.createReadStream(filePath);

  stream.on('open', () => {
    const type = MIME_TYPES[path.extname(filePath)] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    stream.pipe(res);
  });

  stream.on('error', () => {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  });
}

module.exports = { serveStatic };
