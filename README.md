# Node.js HTTP Server (no Express)

A basic HTTP server built using **only Node.js core modules** — `http`, `fs`, `path`, `events`, and streams. It includes a small notes API that persists data to disk and a static front-end served through file streams.

Built as part of the *Node.js fundamentals (videos 1–31)* roadmap task.

## Features

| Topic | Where it's used |
|---|---|
| `http` module | `server.js` – creates the server; `src/router.js` – hand-written routing |
| `fs` module (read/write) | `src/notes-store.js` – reads/writes `data/notes.json` with `fs.promises` |
| Streams | `src/static.js` – `fs.createReadStream().pipe(res)`; `src/router.js` – reading the request body as a stream |
| Events | `src/logger.js` – custom `EventEmitter` that logs requests/responses |
| CommonJS modules | `require` / `module.exports` across all files in `src/` |
| npm & `package.json` scripts | `start`, `dev`, `test`, `demo:eventloop` |
| Event loop | `examples/event-loop-demo.js` + explanation below |

## Getting started

Requires Node.js 18 or newer.

```bash
git clone <your-repo-url>
cd nodejs-http-server
npm start          # runs on http://localhost:3000
```

Other scripts:

```bash
npm run dev            # restarts automatically on file changes (node --watch)
npm test               # runs the test suite using node's built-in test runner
npm run demo:eventloop # prints the event loop ordering demo
PORT=8080 npm start    # use a different port
```

There are no dependencies to install — `npm install` is not required.

## API

| Method | Route | Description |
|---|---|---|
| GET | `/` | Serves the HTML front-end (streamed from `public/`) |
| GET | `/api/health` | Health check + uptime |
| GET | `/api/notes` | List all notes |
| POST | `/api/notes` | Create a note. Body: `{ "text": "..." }` |
| DELETE | `/api/notes/:id` | Delete a note |

Examples:

```bash
curl http://localhost:3000/api/notes
curl -X POST http://localhost:3000/api/notes -H "Content-Type: application/json" -d '{"text":"Learn streams"}'
curl -X DELETE http://localhost:3000/api/notes/1
```

## Project structure

```
nodejs-http-server/
├── server.js               # entry point, creates the http server
├── src/
│   ├── router.js           # manual routing + JSON helpers
│   ├── notes-store.js      # fs read/write persistence
│   ├── static.js           # static file serving with streams
│   └── logger.js           # EventEmitter-based request logger
├── public/index.html       # simple front-end
├── data/notes.json         # persisted data
├── examples/event-loop-demo.js
├── test/server.test.js
└── package.json
```

## How the Node.js event loop works

Node.js runs your JavaScript on a **single thread**, yet it can handle thousands of concurrent connections. It does this by never *waiting* on slow operations (disk, network, timers). Instead it hands them off — to the operating system or to libuv's thread pool — and registers a **callback** to run when the work is done. The **event loop** is the mechanism that keeps checking "is anything finished? if so, run its callback."

Each iteration of the loop passes through these phases:

1. **Timers** – runs callbacks from `setTimeout` / `setInterval` whose delay has elapsed.
2. **Pending callbacks** – runs certain deferred system-level callbacks (e.g. some TCP errors).
3. **Idle / prepare** – internal use only.
4. **Poll** – retrieves new I/O events (finished file reads, incoming HTTP requests) and runs their callbacks. If nothing else is scheduled, the loop may wait here for I/O.
5. **Check** – runs `setImmediate` callbacks.
6. **Close callbacks** – runs cleanup callbacks such as `socket.on('close')`.

Between every callback (and between phases), Node drains two special queues:

- **`process.nextTick` queue** – runs first.
- **Promise microtask queue** (`.then`, `await` continuations) – runs right after.

So the priority is: **synchronous code → `nextTick` → promises → event loop phases.**

**Why it matters for this project:** in `src/notes-store.js` I use `fs.promises` (asynchronous) instead of `fs.readFileSync`. While the disk read is in progress, the event loop is free to accept and serve other requests. A synchronous call or a heavy CPU loop inside a request handler would block the single thread and freeze *every* client until it finished.

Run `npm run demo:eventloop` to see the ordering in action.

## npm and package.json

- `package.json` describes the project: name, version, entry point (`main`), `engines`, and dependencies.
- `scripts` are shortcuts run with `npm run <name>` (`npm start` and `npm test` are special and don't need `run`).
- This project has **zero dependencies**, so there's no `node_modules` folder and no lockfile needed. Adding one later would be `npm install <package>`, which updates `dependencies` in `package.json`.

## License

MIT
