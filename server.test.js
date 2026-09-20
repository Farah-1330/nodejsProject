const { test, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { createServer } = require('../server');

const DATA_FILE = path.join(__dirname, '..', 'data', 'notes.json');
let server, base, originalData;

before(async () => {
  originalData = fs.readFileSync(DATA_FILE, 'utf8');
  fs.writeFileSync(DATA_FILE, '[]');
  server = createServer();
  await new Promise((resolve) => server.listen(0, resolve));
  base = `http://localhost:${server.address().port}`;
});

after(() => {
  server.close();
  fs.writeFileSync(DATA_FILE, originalData); // restore data
});

test('GET /api/health returns ok', async () => {
  const res = await fetch(`${base}/api/health`);
  assert.strictEqual(res.status, 200);
  assert.strictEqual((await res.json()).status, 'ok');
});

test('POST /api/notes creates a note, GET lists it', async () => {
  const res = await fetch(`${base}/api/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'hello' }),
  });
  assert.strictEqual(res.status, 201);
  const created = await res.json();
  assert.strictEqual(created.text, 'hello');

  const list = await (await fetch(`${base}/api/notes`)).json();
  assert.strictEqual(list.length, 1);
});

test('POST /api/notes rejects invalid body', async () => {
  const res = await fetch(`${base}/api/notes`, { method: 'POST', body: '{}' });
  assert.strictEqual(res.status, 400);
});

test('DELETE /api/notes/:id removes a note', async () => {
  const list = await (await fetch(`${base}/api/notes`)).json();
  const res = await fetch(`${base}/api/notes/${list[0].id}`, { method: 'DELETE' });
  assert.strictEqual(res.status, 200);
  const after = await (await fetch(`${base}/api/notes`)).json();
  assert.strictEqual(after.length, 0);
});

test('GET / serves the HTML page via stream', async () => {
  const res = await fetch(`${base}/`);
  assert.strictEqual(res.status, 200);
  assert.match(res.headers.get('content-type'), /text\/html/);
});

test('unknown static file returns 404', async () => {
  const res = await fetch(`${base}/nope.html`);
  assert.strictEqual(res.status, 404);
});

test('unknown API route returns 404', async () => {
  const res = await fetch(`${base}/api/unknown`);
  assert.strictEqual(res.status, 404);
});
