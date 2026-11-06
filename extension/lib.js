// Shared by content.js (isolated world), main.js (page world) and options.js. Tested by ../check.js.
globalThis.YTE = {
  DEFAULTS: {
    autoPipTab: true,     // sekme değişince / pencere küçülünce PiP
    autoPipCovered: true, // Safari arkadayken videonun yarısından fazlası başka pencerelerin altında kalınca PiP
    autoPipScroll: false, // player ekrandan çıkınca PiP
    defaultSpeed: 1,
    speedStep: 0.05,
    wheelSpeed: true,     // Ctrl + tekerlek (trackpad pinch) = hız
    wheelVolume: true,    // ⌥ + tekerlek = ses
    volumeStep: 5,
    defaultQuality: 'auto',
  },

  // All shortcuts are ⌘⇧ + key. Keys picked from ones Safari 27's menus don't use (Turkish Q layout, so no I or punctuation).
  // ⌘⇧↑/↓ never reach the page in Safari; ⌘⇧3–6 belong to macOS screenshots.
  // `code` is the physical key (KeyboardEvent.code), `key` is what we show.
  SHORTCUTS: [
    { id: 'pip', code: 'KeyE', key: 'E', label: 'Resim içinde resim aç/kapat' },
    { id: 'slower', code: 'Digit8', key: '8', label: 'Yavaşlat' },
    { id: 'faster', code: 'Digit9', key: '9', label: 'Hızlandır' },
    { id: 'speedReset', code: 'Digit0', key: '0', label: 'Hızı 1x yap' },
    { id: 'loop', code: 'KeyK', key: 'K', label: 'Tekrarla' },
    { id: 'boost', code: 'KeyU', key: 'U', label: 'Ses yükseltici (1x–4x)' },
    { id: 'cinema', code: 'KeyM', key: 'M', label: 'Sinema modu' },
    { id: 'theater', code: 'KeyJ', key: 'J', label: 'Geniş mod' },
    { id: 'shot', code: 'KeyX', key: 'X', label: 'Ekran görüntüsü' },
    { id: 'options', code: 'KeyO', key: 'O', label: 'Ayarlar' },
  ],

  // YouTube quality ids, best first.
  QUALITIES: ['highres', 'hd2880', 'hd2160', 'hd1440', 'hd1080', 'hd720', 'large', 'medium', 'small', 'tiny'],

  clampSpeed: r => Math.min(16, Math.max(0.1, Math.round(r * 100) / 100)),

  // Best available level that is not above `wanted`; lowest available if all are above. null = leave YouTube alone.
  pickQuality(available, wanted) {
    const Q = globalThis.YTE.QUALITIES, w = Q.indexOf(wanted);
    if (w < 0) return null;
    const real = available.filter(q => Q.includes(q));
    return real.find(q => Q.indexOf(q) >= w) ?? real.at(-1) ?? null;
  },
};
