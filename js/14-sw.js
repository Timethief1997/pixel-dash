/* PIXEL DASH · Service Worker 注册与新版本提示 —— 由 index.html 拆分，按顺序加载 */
'use strict';

/* ============================================================
   Service Worker：解决「线上更新了，浏览器还用旧文件」
   - 首次访问静默注册并缓存
   - 发现新版本时弹出底部提示条，用户点「立即更新」才切换并刷新
   ============================================================ */
(function () {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol !== 'http:' && location.protocol !== 'https:') return;

  const bar = document.getElementById('updateBar');
  const applyBtn = document.getElementById('updateApply');
  const laterBtn = document.getElementById('updateLater');
  let waiting = null;
  let reloading = false;

  function showUpdate(worker) {
    waiting = worker;
    if (bar) bar.classList.remove('hidden');
  }
  function hideUpdate() {
    if (bar) bar.classList.add('hidden');
  }
  function applyUpdate() {
    if (!waiting) { reloading = true; location.reload(); return; }
    reloading = true;
    waiting.postMessage({ type: 'SKIP_WAITING' });
  }

  if (applyBtn) applyBtn.addEventListener('click', applyUpdate);
  if (laterBtn) laterBtn.addEventListener('click', hideUpdate);
  /* 设置里也能手动检查一次更新 */
  const checkBtn = document.getElementById('updateCheck');
  if (checkBtn) checkBtn.addEventListener('click', checkUpdate);

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) location.reload();
  });

  function bind(reg) {
    if (reg.waiting && navigator.serviceWorker.controller) showUpdate(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const sw = reg.installing;
      if (!sw) return;
      sw.addEventListener('statechange', () => {
        if (sw.state === 'installed' && navigator.serviceWorker.controller) showUpdate(sw);
      });
    });
    return reg;
  }

  let reg = null;
  function checkUpdate() {
    if (!reg) return Promise.resolve();
    return reg.update().then(() => {
      if (reg.waiting) showUpdate(reg.waiting);
    }).catch(() => {});
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').then((r) => {
      reg = bind(r);
    }).catch(() => {});
  });

  /* 回到前台时顺便检查一次（不阻塞游戏） */
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) checkUpdate();
  });
})();
