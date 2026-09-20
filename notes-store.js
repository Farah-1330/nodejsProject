// File system: reads and writes notes to data/notes.json using the fs module.
// Uses fs.promises so the event loop is never blocked by disk I/O.
const fs = require('fs').promises;
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'notes.json');

async function readNotes() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return []; // file doesn't exist yet
    throw err;
  }
}

async function writeNotes(notes) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(notes, null, 2), 'utf8');
}

async function addNote(text) {
  const notes = await readNotes();
  const note = {
    id: notes.length ? Math.max(...notes.map((n) => n.id)) + 1 : 1,
    text,
    createdAt: new Date().toISOString(),
  };
  notes.push(note);
  await writeNotes(notes);
  return note;
}

async function deleteNote(id) {
  const notes = await readNotes();
  const remaining = notes.filter((n) => n.id !== id);
  if (remaining.length === notes.length) return false;
  await writeNotes(remaining);
  return true;
}

module.exports = { readNotes, addNote, deleteNote };
