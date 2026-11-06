// Runs in YouTube's page world so it can reach the player API (content scripts can't).
// content.js passes the wanted quality through <html data-yte-quality>.
document.addEventListener('loadeddata', e => {
  const p = document.getElementById('movie_player');
  const want = document.documentElement.dataset.yteQuality;
  if (!p?.getAvailableQualityLevels || !p.contains(e.target)) return;
  const q = YTE.pickQuality(p.getAvailableQualityLevels(), want);
  if (q) p.setPlaybackQualityRange(q, q);
}, true);
