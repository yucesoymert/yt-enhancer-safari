// node check.js
require('./extension/lib.js');
const assert = require('assert');
const { clampSpeed, pickQuality } = globalThis.YTE;

assert.equal(clampSpeed(1.05 + 0.05), 1.1); // float drift rounded away
assert.equal(clampSpeed(99), 16);
assert.equal(clampSpeed(-1), 0.1);

const av = ['hd1080', 'hd720', 'large', 'medium', 'small', 'tiny', 'auto'];
assert.equal(pickQuality(av, 'hd1440'), 'hd1080'); // wanted not available -> next lower
assert.equal(pickQuality(av, 'hd720'), 'hd720');
assert.equal(pickQuality(av, 'auto'), null);
assert.equal(pickQuality(['hd1080', 'auto'], 'small'), 'hd1080'); // all above -> lowest real
assert.equal(pickQuality(['auto'], 'hd720'), null);

// every shortcut has a unique physical key, and only keys free in Safari's menus (see lib.js)
const codes = globalThis.YTE.SHORTCUTS.map(s => s.code);
assert.equal(new Set(codes).size, codes.length);
const safariTaken = ['KeyQ', 'KeyN', 'KeyA', 'KeyB', 'KeyL', 'KeyR', 'KeyH', 'KeyT', 'KeyD', 'KeyC', 'KeyZ', 'KeyS', 'KeyW', 'KeyG', 'KeyP', 'KeyI', 'KeyY',
  'Digit3', 'Digit4', 'Digit5', 'Digit6', 'ArrowUp', 'ArrowDown']; // macOS screenshots; arrows don't reach the page
assert.deepEqual(codes.filter(c => safariTaken.includes(c)), []);

console.log('ok');
