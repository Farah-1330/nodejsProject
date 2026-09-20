// Run with: npm run demo:eventloop
// Demonstrates the ORDER in which Node's event loop runs different kinds of callbacks.
const fs = require('fs');

console.log('A. script start (synchronous code runs first)');

setTimeout(() => console.log('   setTimeout 0    -> timers phase'), 0);
setImmediate(() => console.log('   setImmediate    -> check phase'));
// NOTE: from the main module, the order of setTimeout(0) vs setImmediate
// is NOT guaranteed (it depends on how fast the process starts).

fs.readFile(__filename, () => {
  console.log('D. fs.readFile callback -> poll phase (I/O finished)');

  // Inside an I/O callback the order IS guaranteed:
  // the check phase (setImmediate) comes right after the poll phase,
  // and the timers phase only comes on the NEXT loop iteration.
  setTimeout(() => console.log('F. setTimeout 0 inside I/O callback'), 0);
  setImmediate(() => console.log('E. setImmediate inside I/O callback (always first here)'));
});

Promise.resolve().then(() => console.log('C. Promise.then -> microtask queue'));

process.nextTick(() => console.log('B. process.nextTick -> runs before promise microtasks'));

console.log('A. script end (synchronous)');

// Order: A (sync) -> B (nextTick) -> C (promises) -> timers/check/poll -> D -> E -> F
