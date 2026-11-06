// YT Enhancer: auto-PiP + Enhancer-style toolbar under the YouTube player controls.
const { DEFAULTS, clampSpeed } = YTE;
let cfg = { ...DEFAULTS };
const applyCfg = () => { document.documentElement.dataset.yteQuality = cfg.defaultQuality; };
browser.storage.local.get(DEFAULTS).then(c => { cfg = c; applyCfg(); });
browser.storage.onChanged.addListener(ch => { for (const k in ch) cfg[k] = ch[k].newValue; applyCfg(); });

const player = () => document.getElementById('movie_player');
const video = () => document.querySelector('#movie_player video');
const playing = v => v && !v.paused && !v.ended && v.currentTime > 0;

// ---------- Picture in Picture ----------
// Safari runs webkitSetPresentationMode without a user gesture; that is what makes auto-PiP possible.
const inPip = v => v?.webkitPresentationMode === 'picture-in-picture';
const setPip = (v, on) => v?.webkitSetPresentationMode?.(on ? 'picture-in-picture' : 'inline');
let autoPip = false;       // leave PiP automatically only if we entered it automatically
let playerVisible = true;  // from the IntersectionObserver below

function autoEnter() {
  const v = video();
  if (playing(v) && !inPip(v)) { setPip(v, true); autoPip = true; }
}
function autoExit() {
  if (cfg.autoPipScroll && !playerVisible) return; // still scrolled away, keep PiP
  const v = video();
  if (autoPip && inPip(v)) setPip(v, false);
  autoPip = false;
}
function togglePip() { const v = video(); autoPip = false; setPip(v, !inPip(v)); }

document.addEventListener('visibilitychange', () => {
  if (cfg.autoPipTab) document.hidden ? autoEnter() : autoExit();
});

// X on the PiP window pauses the video. With pipCloseKeepsPlaying, resume it if the tab is in the background,
// so PiP closes without Safari taking focus (the native "back to tab" button always activates Safari).
// Safari's pause and the mode change come in either order, so a pause within 500 ms of leaving PiP counts as the X.
// ponytail: 500 ms window is a guess; a manual pause right before X within that window would also be undone.
let pipExitAt = -Infinity, pauseAt = 0; // -Infinity: no PiP exit yet, so no pause matches
const resumeAfterX = v => { if (cfg.pipCloseKeepsPlaying && document.hidden && v.paused && Math.abs(pipExitAt - pauseAt) < 500) v.play().catch(() => {}); };
document.addEventListener('webkitpresentationmodechanged', e => {
  if (e.target !== video() || inPip(e.target)) return;
  pipExitAt = e.timeStamp;
  resumeAfterX(e.target);
}, true);
document.addEventListener('pause', e => {
  if (e.target !== video()) return;
  pauseAt = e.timeStamp;
  if (!inPip(e.target)) resumeAfterX(e.target);
}, true);

const io = new IntersectionObserver(([e]) => {
  playerVisible = e.intersectionRatio >= 0.1;
  if (cfg.autoPipScroll && !document.hidden) playerVisible ? autoExit() : autoEnter();
}, { threshold: [0, 0.1] });

// ---------- Speed / volume ----------
function setSpeed(r) { const v = video(); if (v) v.playbackRate = clampSpeed(r); }

let lastWheel = 0;
document.addEventListener('wheel', e => {
  const v = video();
  if (!v || !e.target.closest?.('#movie_player')) return;
  const speed = e.ctrlKey && cfg.wheelSpeed, vol = e.altKey && cfg.wheelVolume;
  if (!speed && !vol) return;
  e.preventDefault();
  // ponytail: fixed 80 ms throttle so a trackpad flick is a few steps, not dozens. Accumulate deltaY if it feels jumpy.
  if (e.timeStamp - lastWheel < 80) return;
  lastWheel = e.timeStamp;
  const dir = e.deltaY < 0 ? 1 : -1;
  if (speed) setSpeed(v.playbackRate + dir * cfg.speedStep);
  else v.volume = Math.min(1, Math.max(0, v.volume + dir * cfg.volumeStep / 100));
}, { passive: false, capture: true });

// Volume boost: route audio through a GainNode. Needs a click (AudioContext must start from a gesture).
let gain, gainVideo;
function cycleBoost() {
  const v = video();
  if (!v) return 1;
  if (gainVideo !== v) { // ponytail: YouTube reuses one <video>; a new element just gets a new graph, the old one is dropped.
    const ctx = new AudioContext();
    gain = ctx.createGain();
    ctx.createMediaElementSource(v).connect(gain).connect(ctx.destination);
    v.addEventListener('play', () => ctx.resume());
    gainVideo = v;
  }
  gain.gain.value = gain.gain.value >= 4 ? 1 : gain.gain.value + 1;
  gain.context.resume();
  return gain.gain.value;
}

function screenshot() {
  const v = video();
  if (!v?.videoWidth) return;
  const c = Object.assign(document.createElement('canvas'), { width: v.videoWidth, height: v.videoHeight });
  c.getContext('2d').drawImage(v, 0, 0);
  const name = document.title.replace(/ - YouTube$/, '').replace(/[\\/:*?"<>|]/g, '_');
  c.toBlob(b => {
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(b), download: `${name} ${Math.floor(v.currentTime)}s.png` });
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  });
}

// ---------- Toolbar (between the player and the title) ----------
// Material icon paths. Built with DOM APIs, not innerHTML: YouTube enforces Trusted Types.
const ICON = {
  loop: 'M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z',
  boost: 'M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z',
  cinema: 'M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z',
  theater: 'M19 6H5c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 10H5V8h14v8z',
  pip: 'M19 11h-8v6h8v-6zm4 8V4.98C23 3.88 22.1 3 21 3H3c-1.1 0-2 .88-2 1.98V19c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2zm-2 .02H3V4.97h18v14.05z',
  shot: 'M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zM9 2 7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z',
  options: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.48.48 0 0 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z',
};
const SVG = 'http://www.w3.org/2000/svg';
function icon(d) {
  const s = document.createElementNS(SVG, 'svg'), p = document.createElementNS(SVG, 'path');
  s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('aria-hidden', 'true');
  p.setAttribute('d', d);
  s.append(p);
  return s;
}
const el = (tag, props, ...kids) => { const e = Object.assign(document.createElement(tag), props); e.append(...kids); return e; };

const actions = {
  loop: () => { const v = video(); if (v) v.loop = !v.loop; },
  boost: cycleBoost,
  cinema: () => document.documentElement.classList.toggle('yte-cinema'),
  theater: () => document.querySelector('.ytp-size-button')?.click(),
  pip: togglePip,
  slower: () => setSpeed(video()?.playbackRate - cfg.speedStep),
  speedReset: () => setSpeed(1),
  faster: () => setSpeed(video()?.playbackRate + cfg.speedStep),
  shot: screenshot,
  options: () => browser.runtime.sendMessage('options'),
};
const run = (id, viaKey) => { actions[id](); sync(); if (viaKey) feedback(id); };

// Short on-video message for keyboard use (the bar may be out of view). role=status = read by screen readers too.
const toast = el('div', { className: 'yte-toast', role: 'status' });
let toastTimer;
function feedback(id) {
  const pressed = btn[id]?.getAttribute('aria-pressed');
  toast.textContent = ['slower', 'faster', 'speedReset'].includes(id) ? `Hız ${(video()?.playbackRate ?? 1).toFixed(2)}x`
    : id === 'boost' ? `Ses yükseltici ${gain?.gain.value ?? 1}x`
    : pressed ? `${SC[id].label}: ${pressed === 'true' ? 'açık' : 'kapalı'}`
    : SC[id].label;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1200);
}

// Page background brightness decides the bar style; YouTube's theme attributes/vars have changed before.
function isDark(node) {
  for (let n = node; n; n = n.parentElement) {
    const c = getComputedStyle(n).backgroundColor.match(/[\d.]+/g)?.map(Number);
    if (c && (c[3] ?? 1) > 0) return c[0] + c[1] + c[2] < 384;
  }
  return matchMedia('(prefers-color-scheme: dark)').matches;
}

const SC = Object.fromEntries(YTE.SHORTCUTS.map(s => [s.id, s]));
const tipFor = (id, label = SC[id].label) => `${label} (⌘⇧${SC[id].key})`;
const speedLabel = el('span', { textContent: '1.00x' });
const boostLabel = el('span', { textContent: '1x' });
const CONTENT = { slower: ['−'], faster: ['+'], speedReset: [speedLabel], boost: [icon(ICON.boost), boostLabel] };
const TOGGLES = ['loop', 'boost', 'cinema'];

const bar = el('div', { className: 'yte-bar', role: 'toolbar' });
bar.setAttribute('aria-label', 'YT Enhancer');
// Mouse clicks don't take focus, so Space/K keep controlling YouTube. Tab still reaches every button.
bar.addEventListener('mousedown', e => e.preventDefault());
const btn = {};
for (const id of ['loop', 'boost', 'cinema', 'theater', 'pip', 'slower', 'speedReset', 'faster', 'shot', 'options']) {
  const b = btn[id] = el('button', { type: 'button', className: 'yte-btn', onclick: () => run(id) }, ...(CONTENT[id] ?? [icon(ICON[id])]));
  b.setAttribute('aria-keyshortcuts', 'Meta+Shift+' + SC[id].code.replace(/^(Key|Digit)/, ''));
  if (TOGGLES.includes(id)) b.setAttribute('aria-pressed', 'false');
  setTip(b, tipFor(id));
  bar.append(b);
}
function setTip(b, text) { b.dataset.tip = text; b.setAttribute('aria-label', text); }

function sync() {
  const v = video();
  const rate = (v?.playbackRate ?? 1).toFixed(2), boost = gain?.gain.value ?? 1;
  speedLabel.textContent = rate + 'x';
  boostLabel.textContent = boost + 'x';
  setTip(btn.speedReset, tipFor('speedReset', `Hız ${rate}x · 1x yap`));
  setTip(btn.boost, tipFor('boost', `Ses yükseltici ${boost}x`));
  btn.loop.setAttribute('aria-pressed', !!v?.loop);
  btn.boost.setAttribute('aria-pressed', boost > 1);
  btn.cinema.setAttribute('aria-pressed', document.documentElement.classList.contains('yte-cinema'));
}

addEventListener('keydown', e => {
  if (!e.metaKey || !e.shiftKey || e.altKey || e.ctrlKey) return;
  const s = YTE.SHORTCUTS.find(s => s.code === e.code), t = e.target;
  if (!s || t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
  e.preventDefault();
  e.stopPropagation();
  run(s.id, true);
}, true);

function mount() {
  const below = document.querySelector('ytd-watch-flexy #below');
  if (below && bar.nextElementSibling !== below) below.before(bar); // YouTube may re-render; re-attach
  if (below) bar.classList.toggle('yte-dark', isDark(below));
  const p = player();
  if (p) {
    io.observe(p); // observing the same element twice is a no-op
    if (toast.parentNode !== p) p.append(toast);
  }
  sync();
}

// Media events don't bubble, so listen in the capture phase.
let speedAppliedTo;
document.addEventListener('playing', e => {
  const v = video();
  if (e.target !== v) return;
  mount();
  // Default speed once per source (ad and video have different srcs), after YouTube has set its own rate.
  if (v.src !== speedAppliedTo) { speedAppliedTo = v.src; if (cfg.defaultSpeed !== 1) setSpeed(cfg.defaultSpeed); }
}, true);
document.addEventListener('ratechange', e => { if (e.target === video()) sync(); }, true);
document.addEventListener('yt-navigate-finish', mount);
mount();
