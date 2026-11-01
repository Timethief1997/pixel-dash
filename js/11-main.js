/* PIXEL DASH · 主循环 —— 由 index.html 拆分，按顺序加载 */
'use strict';

/* ============================================================
   主循环
   ============================================================ */
let lastTs = 0;

function loop(ts) {
  if (!lastTs) lastTs = ts;
  let dt = (ts - lastTs) / 1000;
  lastTs = ts;
  if (!isFinite(dt) || dt < 0) dt = 0;
  dt = Math.min(dt, 0.05);

  shake = Math.max(0, shake - dt * 26);
  screenFlash = Math.max(0, screenFlash - dt * 2.6);

  if (state === 'playing' && !paused) {
    if (hitStop > 0) hitStop -= dt;
    else update(dt);
  }

  const showCtl = state === 'playing' && !paused;
  if (showCtl !== ctlShown) { ctlShown = showCtl; mobileCtl.classList.toggle('show', showCtl); }

  const showHud = state === 'playing';
  if (showHud !== hudShown) { hudShown = showHud; hudEl.classList.toggle('show', showHud); }
  if (showHud) hudSync();

  render();
  if (state === 'menu') drawTitleArt(ts);
  requestAnimationFrame(loop);
}

refreshBestLine();
resetWorld();
refreshLoadout();

/* 预览入口（只影响当前这次打开，不写任何存档）：
   ?level=N 直接开第 N 关（1 起）；?hero=frost 临时换用指定小小英雄 */
(function previewEntry() {
  let q = null;
  try { q = new URLSearchParams(location.search); } catch (e) { return; }
  if (!q) return;
  const hero = q.get('hero');
  const lv = Number(q.get('level'));
  if (hero && HEROES.some((h) => h.id === hero)) heroKey = hero;
  if (lv > 0) startMode('campaign', lv - 1);
})();

requestAnimationFrame(loop);
