const f = document.forms[0];
browser.storage.local.get(YTE.DEFAULTS).then(c => {
  for (const [k, v] of Object.entries(c)) f.elements[k][f.elements[k].type === 'checkbox' ? 'checked' : 'value'] = v;
});
f.addEventListener('change', ({ target: t }) => {
  if (!t.checkValidity()) return; // don't save out-of-range numbers
  const v = t.type === 'checkbox' ? t.checked : typeof YTE.DEFAULTS[t.name] === 'number' ? +t.value : t.value;
  browser.storage.local.set({ [t.name]: v });
});

// Shortcut list comes from the same table content.js uses, so it can't drift.
const kbd = text => Object.assign(document.createElement('kbd'), { textContent: text });
for (const s of YTE.SHORTCUTS) {
  const keys = document.createElement('td');
  keys.append(kbd('⌘'), ' ', kbd('⇧'), ' ', kbd(s.key));
  const row = document.createElement('tr');
  row.append(keys, Object.assign(document.createElement('td'), { textContent: s.label }));
  document.getElementById('keys').append(row);
}

// Tabs (WAI-ARIA tabs pattern: click or ←/→).
const tabs = [...document.querySelectorAll('[role=tab]')];
function select(tab) {
  for (const t of tabs) {
    const on = t === tab;
    t.setAttribute('aria-selected', on);
    t.tabIndex = on ? 0 : -1;
    document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
  }
  tab.focus();
}
tabs.forEach((t, i) => {
  t.onclick = () => select(t);
  t.onkeydown = e => {
    const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (d) select(tabs[(i + d + tabs.length) % tabs.length]);
  };
});
