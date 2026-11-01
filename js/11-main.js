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
requestAnimationFrame(loop);
