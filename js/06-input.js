/* PIXEL DASH · 输入 / 全屏 / 触控 —— 由 index.html 拆分，按顺序加载 */
'use strict';

/* ============================================================
   输入
   ============================================================ */
window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if ([' ', 'arrowleft', 'arrowright', 'arrowup', 'arrowdown'].includes(k)) e.preventDefault();
  if (e.repeat) return;
  keys[k] = true;

  if (k === 'escape' && !$('#codexScreen').classList.contains('hidden')) { closeCodex(); return; }
  if (k === 'escape' && !$('#achScreen').classList.contains('hidden')) { closeAch(); return; }
  if (k === 'escape' && !$('#historyScreen').classList.contains('hidden')) { closeHistory(); return; }
  if (k === 'p') { setPaused(!paused); return; }
  if (k === 'escape' && paused) { setPaused(false); return; }

  if (k === 'm') { setMuted(!muted); return; }
  if (state === 'menu' && (k === ' ' || k === 'enter')) { startGame(); return; }
  if ((state === 'dead' || state === 'won') && (k === ' ' || k === 'enter')) { startGame(); return; }
  if ((state === 'dead' || state === 'won') && k === 'escape') { goMenu(); return; }
  if (state === 'playing' && k === ' ') { tryDash(); return; }
  if (state === 'upgrade' && (k === '1' || k === '2' || k === '3')) { chooseIndex(Number(k) - 1); return; }
});
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

/* ============================================================
   全屏 / 暂停 / 移动端触控
   ============================================================ */
const mobileCtl = $('#mobileControls');
let paused = false;
let ctlShown = false;

/* ---- 全屏 ---- */
const fsBtn = $('#fsBtn');
const fsSupported = !!(document.documentElement.requestFullscreen ||
                       document.documentElement.webkitRequestFullscreen);
/* iPhone / iPad 的 Safari 不支持网页元素全屏：不隐藏按钮，改为引导「添加到主屏幕」 */
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
              (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = navigator.standalone === true ||
                     (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
if (!fsSupported && !isIOS) fsBtn.classList.add('off');

function openIosTip() {
  const tip = $('#iosTip');
  const note = $('#iosTipNote');
  if (isStandalone) {
    note.textContent = '你已从主屏幕启动，当前就是全屏运行。';
  } else {
    note.textContent = '网页版 Safari 不支持强制隐藏工具栏。';
  }
  tip.classList.remove('hidden');
}
$('#iosTipClose').addEventListener('click', () => $('#iosTip').classList.add('hidden'));
$('#iosTip').addEventListener('click', (e) => {
  if (e.target === $('#iosTip')) $('#iosTip').classList.add('hidden');
});
$('#tutSkip').addEventListener('click', endTutorial);

/* ---- 设置：音效 / BGM ---- */
const setBtn = $('#setBtn');
const setPanel = $('#setPanel');
const sfxSw = $('#sfxSw');
const bgmSw = $('#bgmSw');
const bgmEl = $('#bgm');
const SFX_KEY = 'pixelDash.sfx.v1';
const BGM_KEY = 'pixelDash.bgm.v1';
let bgmOn = true;

if (bgmEl) bgmEl.volume = 0.42;

function syncSfx() {
  sfxSw.classList.toggle('on', !muted);
  sfxSw.setAttribute('aria-checked', String(!muted));
}
function syncBgm() {
  bgmSw.classList.toggle('on', bgmOn);
  bgmSw.setAttribute('aria-checked', String(bgmOn));
}
function setMuted(v) {
  muted = !!v;
  try {
    localStorage.setItem(SFX_KEY, muted ? '0' : '1');
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch (e) {}
  syncSfx();
}
function playBgm() {
  if (!bgmEl || !bgmOn) return;
  const p = bgmEl.play();
  if (p && p.catch) p.catch(() => {});
}
function setBgm(v) {
  bgmOn = !!v;
  try { localStorage.setItem(BGM_KEY, bgmOn ? '1' : '0'); } catch (e) {}
  syncBgm();
  if (bgmOn) playBgm();
  else if (bgmEl) bgmEl.pause();
}
function toggleSetPanel(force) {
  const open = force === undefined ? setPanel.classList.contains('hidden') : !!force;
  setPanel.classList.toggle('hidden', !open);
  setBtn.classList.toggle('on', open);
}

try { muted = localStorage.getItem(SFX_KEY) === '0' || localStorage.getItem(MUTE_KEY) === '1'; } catch (e) {}
try { bgmOn = localStorage.getItem(BGM_KEY) !== '0'; } catch (e) {}
syncSfx(); syncBgm();

setBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleSetPanel(); });
setPanel.addEventListener('click', (e) => e.stopPropagation());
$('#setClose').addEventListener('click', () => toggleSetPanel(false));
sfxSw.addEventListener('click', () => { setMuted(!muted); if (!muted) blip(880, 0.07, 'square', 0.07); });
bgmSw.addEventListener('click', () => setBgm(!bgmOn));
document.addEventListener('pointerdown', (e) => {
  if (!setPanel.classList.contains('hidden') &&
      !setPanel.contains(e.target) && !setBtn.contains(e.target)) toggleSetPanel(false);
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !setPanel.classList.contains('hidden')) toggleSetPanel(false);
});
/* 浏览器要求用户手势后才能出声：任何一次交互都尝试起播 BGM */
['pointerdown', 'touchstart', 'keydown'].forEach((t) =>
  document.addEventListener(t, playBgm, { passive: true }));
document.addEventListener('visibilitychange', () => {
  if (!bgmEl) return;
  if (document.hidden) bgmEl.pause();
  else playBgm();
});

fsBtn.addEventListener('click', () => {
  if (isIOS) { openIosTip(); return; }
  if (!fsSupported) return;
  const d = document;
  if (d.fullscreenElement || d.webkitFullscreenElement) {
    (d.exitFullscreen || d.webkitExitFullscreen).call(d);
  } else {
    const req = d.documentElement.requestFullscreen || d.documentElement.webkitRequestFullscreen;
    req.call(d.documentElement);
  }
});
document.addEventListener('fullscreenchange', () => {
  fsBtn.title = document.fullscreenElement ? '退出全屏' : '全屏';
});

/* ---- 游戏内 HUD：DOM 叠层，每帧同步数据 ---- */
const HEART_SVG = '<svg viewBox="0 0 12 11" aria-hidden="true"><path class="hp" d="M6 10.4 L1.5 5.9 C0.3 4.6 0.4 2.3 2.1 1.3 C3.5 0.5 5 1.2 6 2.6 C7 1.2 8.5 0.5 9.9 1.3 C11.6 2.3 11.7 4.6 10.5 5.9 Z"/><path class="hl" d="M3.05 3.15 C3.5 2.3 4.55 2.1 5.2 2.62"/></svg>';
const hudEl = $('#hudOverlay'), heartsEl = $('#hearts'), shieldEl = $('#shieldPips'), statusEl = $('#statusPips');
const hudTimeEl = $('#hudTime'), scoreValEl = $('#scoreVal'), hudKillsEl = $('#hudKills');
const diffTagEl = $('#diffTag'), xpFillEl = $('#xpFill'), lvBadgeEl = $('#lvBadge');
const hudHintEl = $('#hudHint'), toastsEl = $('#toasts');
const bossBarEl = $('#bossBar'), bossFillEl = $('#bossFill'), bossHpEl = $('#bossHp'), bossNameEl = $('#bossName');
let hudShown = false, hudHp = -1, hudShieldN = -1;
let hudTimeTxt = '', hudScoreVal = -1, hudKillsVal = -1, hudLvVal = -1, hudStatusSig = '';
let bossBarOn = false, bossHpW = -1, bossHpTxt = '', bossNameTxt = '';

function toast(msg, hot) {
  const el = document.createElement('div');
  el.className = hot ? 'toast hot' : 'toast';
  el.textContent = msg;
  toastsEl.appendChild(el);
  while (toastsEl.children.length > 3) toastsEl.firstChild.remove();
  setTimeout(() => el.remove(), 2400);
}

function hudSync() {
  const p = player;
  if (!p) return;
  if (p.maxHp !== hudHp) {
    hudHp = p.maxHp;
    heartsEl.innerHTML = HEART_SVG.repeat(Math.max(0, p.maxHp));
    heartsEl.classList.toggle('many', p.maxHp > 8);
  }
  for (let i = 0; i < heartsEl.children.length; i++) {
    heartsEl.children[i].classList.toggle('off', i >= p.hp);
  }
  if (p.shield !== hudShieldN) {
    hudShieldN = p.shield;
    shieldEl.innerHTML = '<svg viewBox="0 0 12 13" aria-hidden="true"><path d="M6 1 L11 3 V6.4 C11 9.4 8.6 11.6 6 12 C3.4 11.6 1 9.4 1 6.4 V3 Z"/></svg><b>' + p.shield + '</b>';
    shieldEl.classList.toggle('on', p.shield > 0);
  }
  // 状态条：毒素优先展示，其余按存在与否拼接
  const sig = (p.poisonT > 0 ? 'p' : '') + (p.healBlock > 0 ? 'h' : '') +
              (p.freezeT > 0 ? 'f' : (p.slowT > 0 ? 's' : ''));
  if (sig !== hudStatusSig) {
    hudStatusSig = sig;
    statusEl.classList.toggle('on', sig.length > 0);
    statusEl.innerHTML =
      (p.poisonT > 0 ? '<span class="p">中毒</span>' : '') +
      (p.healBlock > 0 ? '<span class="h">禁吸</span>' : '') +
      (p.freezeT > 0 ? '<span class="f">冰冻</span>' : (p.slowT > 0 ? '<span class="s">减速</span>' : ''));
  }
  const t = fmt(time);
  if (t !== hudTimeTxt) { hudTimeTxt = t; hudTimeEl.textContent = t; }
  const s = calcScore();
  if (s !== hudScoreVal) { hudScoreVal = s; scoreValEl.textContent = s; }
  if (kills !== hudKillsVal) { hudKillsVal = kills; hudKillsEl.textContent = kills; }
  if (p.level !== hudLvVal) { hudLvVal = p.level; lvBadgeEl.textContent = 'Lv.' + p.level; }
  if (diffTagEl.dataset.diff !== diffKey) {
    diffTagEl.dataset.diff = diffKey;
    diffTagEl.textContent = diff.name;
    diffTagEl.style.color = '#fff6e2';
    diffTagEl.style.background = diff.col + '3d';
    diffTagEl.style.borderColor = diff.col + '99';
  }
  xpFillEl.style.width = (clamp(p.xp / p.xpNext, 0, 1) * 100) + '%';
  const hintA = kills === 0 && time < 8 ? (time < 6 ? 1 : Math.max(0, 1 - (time - 6) / 2)) : 0;
  hudHintEl.style.opacity = String(hintA);

  // BOSS 血条：场上有 BOSS 时显示（多只同时存活时取血量上限最高的那只）
  let boss = null;
  for (const e of enemies) {
    if (e.type !== 'boss' || e.dead) continue;
    if (!boss || e.maxHp > boss.maxHp) boss = e;
  }
  if (boss) {
    if (!bossBarOn) { bossBarOn = true; bossBarEl.classList.add('on'); }
    const w = Math.round(clamp(boss.hp / boss.maxHp, 0, 1) * 1000) / 10;
    if (w !== bossHpW) { bossHpW = w; bossFillEl.style.width = w + '%'; }
    const txt = Math.max(0, Math.ceil(boss.hp)) + ' / ' + boss.maxHp;
    if (txt !== bossHpTxt) { bossHpTxt = txt; bossHpEl.textContent = txt; }
    const gen = boss.gen || 1;
    const name = bossName(gen) + (boss.hp <= boss.maxHp * 0.5 ? ' · 狂暴' : '');
    if (name !== bossNameTxt) { bossNameTxt = name; bossNameEl.textContent = name; }
  } else if (bossBarOn) {
    bossBarOn = false; bossBarEl.classList.remove('on');
    bossHpW = -1; bossHpTxt = ''; bossNameTxt = '';
  }
}

/* ---- 暂停 ---- */
function setPaused(v) {
  if (state !== 'playing' && !paused) return;
  paused = v;
  $('#pauseScreen').classList.toggle('hidden', !v);
  for (const k in keys) keys[k] = false;
  stickReset();
}
$('#pauseBtn').addEventListener('click', () => setPaused(!paused));
$('#resumeBtn').addEventListener('click', () => setPaused(false));
document.addEventListener('visibilitychange', () => {
  if (document.hidden) setPaused(true);
});

/* ---- 虚拟摇杆（浮动底座 + 8 向滞回 + 幅度调速） ---- */
const stickEl = $('#stick'), knobEl = $('#knob'), stickZone = $('#stickZone');
const stickDirEl = $('#stickDir');
let stickId = null, stickAnchor = null, stickLock = -1, stickMag = 0;
const STICK_DEAD = 0.18;   // 死区：占最大偏移的比例（半径内不响应）
const STICK_HYST = 10;     // 方向切换滞回（度），防止边界抖动导致 45° 跳变

/* 角度 -> 8 扇区；只有偏离当前扇区中心超过 22.5°+滞回才换向 */
function stickDir(deg) {
  const step = 45;
  if (stickLock < 0) stickLock = ((Math.round(deg / step) % 8) + 8) % 8;
  else {
    let d = deg - stickLock * step;
    d = ((d + 540) % 360) - 180;
    if (Math.abs(d) > step / 2 + STICK_HYST) stickLock = ((Math.round(deg / step) % 8) + 8) % 8;
  }
  const a = stickLock * Math.PI / 4;
  return [Math.cos(a), Math.sin(a)];
}

function stickMove(cx, cy) {
  if (!stickAnchor) return;
  const size = stickEl.offsetWidth || 100;
  const max = size * 0.32 - 2;   // 留出旋钮半径，推到极限时旋钮仍留在底座内
  const dx = cx - stickAnchor.x, dy = cy - stickAnchor.y;
  const len = Math.hypot(dx, dy);
  const cl = Math.min(len, max);
  const ux = len ? dx / len : 0, uy = len ? dy / len : 0;
  knobEl.style.transform = `translate(${(ux * cl).toFixed(1)}px,${(uy * cl).toFixed(1)}px)`;
  if (len < max * STICK_DEAD) {          // 半径死区：轻触不动
    stickMag = 0;
    stickEl.classList.remove('active');
    keys['a'] = keys['d'] = keys['w'] = keys['s'] = false;
    return;
  }
  stickMag = Math.min(1, (len / max - STICK_DEAD) / (1 - STICK_DEAD));
  const deg = Math.atan2(dy, dx) * 180 / Math.PI;
  const [sx, sy] = stickDir(deg);
  keys['a'] = sx < -0.01; keys['d'] = sx > 0.01;
  keys['w'] = sy < -0.01; keys['s'] = sy > 0.01;
  stickShowDir(stickLock * 45);
}

/* 方位提示：底座内圈的 45° 弧带跟随当前 8 向 */
function stickShowDir(deg) {
  stickDirEl.style.transform = 'rotate(' + deg + 'deg)';
  stickEl.classList.add('active');
}

/* 按下处即零点：底座跟着手指生成，方向看相对位移 */
function stickShow(cx, cy) {
  const zr = stickZone.getBoundingClientRect();
  const size = stickEl.offsetWidth || 100;
  const half = size / 2 + 14;   // 外沿方位弧带也需要留出空间
  const px = Math.min(Math.max(cx, zr.left + half), zr.left + zr.width - half);
  const py = Math.min(Math.max(cy, zr.top + half), zr.top + zr.height - half);
  stickEl.style.left = (px - zr.left) + 'px';
  stickEl.style.top = (py - zr.top) + 'px';
  stickEl.classList.add('on');
  stickEl.classList.remove('active');
  stickAnchor = { x: px, y: py };
  knobEl.style.transform = 'translate(0px,0px)';
}

function stickReset() {
  stickId = null; stickAnchor = null; stickLock = -1; stickMag = 0;
  stickEl.classList.remove('on', 'active');
  stickEl.style.left = ''; stickEl.style.top = '';
  knobEl.style.transform = '';
  keys['a'] = keys['d'] = keys['w'] = keys['s'] = false;
}
stickZone.addEventListener('pointerdown', (e) => {
  if (stickId !== null) return;
  e.preventDefault();
  stickId = e.pointerId;
  stickZone.setPointerCapture(e.pointerId);
  stickShow(e.clientX, e.clientY);
  stickMove(e.clientX, e.clientY);
});
stickZone.addEventListener('pointermove', (e) => {
  if (e.pointerId !== stickId) return;
  e.preventDefault();
  stickMove(e.clientX, e.clientY);
});
['pointerup', 'pointercancel'].forEach((t) =>
  stickZone.addEventListener(t, (e) => { if (e.pointerId === stickId) stickReset(); }));

$('#dashBtn').addEventListener('pointerdown', (e) => { e.preventDefault(); tryDash(); });

const touchMode = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
if (touchMode) document.body.classList.add('touch');

$('#startBtn').addEventListener('click', startGame);
$('#retryBtn').addEventListener('click', startGame);
$('#endMenuBtn').addEventListener('click', goMenu);
$('#histBtn').addEventListener('click', openHistory);
$('#codexBtn').addEventListener('click', openCodex);
$('#achBtn').addEventListener('click', openAch);
$('#codexBackBtn').addEventListener('click', closeCodex);
$('#achBackBtn').addEventListener('click', closeAch);
$('#histBackBtn').addEventListener('click', closeHistory);

/* 难度选择 */
for (const b of document.querySelectorAll('.diffbtn')) {
  b.addEventListener('click', () => applyDiff(b.dataset.d));
}
let savedDiff = 'normal';
try { savedDiff = localStorage.getItem(DKEY) || 'normal'; } catch (e) {}
applyDiff(savedDiff);
$('#histClearBtn').addEventListener('click', () => {
  storeRecords([]);
  renderHistory();
  refreshBestLine();
});
$('#endlessBtn').addEventListener('click', () => {
  endless = true;
  nextEvent = time + 20;   // 进无尽先给 20 秒缓冲，别一进去就撞事件
  state = 'playing';
  layers.end.classList.add('hidden');
  lastTs = performance.now();
});
/* 暂停菜单：结束本局（直接结算）/ 返回主菜单 */
$('#giveUpBtn').addEventListener('click', () => {
  setPaused(false);
  endGame(false, true);
});
$('#quitBtn').addEventListener('click', () => {
  setPaused(false);
  goMenu();
});

