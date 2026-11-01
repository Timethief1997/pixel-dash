/* PIXEL DASH · 开始 / 结束 / 新手教程 —— 由 index.html 拆分，按顺序加载 */
'use strict';

/* ============================================================
   开始 / 结束
   ============================================================ */
function resetWorld() {
  time = 0; kills = 0; killScore = 0; shake = 0; screenFlash = 0;
  hitStop = 0; hitSnd = 0; orbChain = 0; orbChainT = 0;
  spawnTimer = 2.0 * diff.spawn; nextBoss = 100; pendingLevels = 0;
  bossGen = 0; lastTier = 0; splitQueue.length = 0;
  coins = 0; nextEvent = 20; frenzyT = 0;
  enemies = []; orbs = []; bullets = []; ebullets = []; drops = [];
  particles = []; trails = []; effects = []; texts = []; marks = []; hazards = [];
  meteors = [];
  meteorT = map.meteor > 0 ? 6 : 0;   // 熔岩图：开局 6 秒后第一颗陨石
  eid = 0;
  generateTerrain();
  player = makePlayer();
  rerolls = 2 + (player.heroRerolls || 0);   // 每局两次换牌，幸运英雄额外加成
  resetAchRun();
  tutorial = makeTutorial();
}

function hideLayers() {
  layers.title.classList.add('hidden');
  layers.upgrade.classList.add('hidden');
  layers.end.classList.add('hidden');
  $('#endScreen').classList.remove('win');
  $('#winFx').innerHTML = '';
  $('#historyScreen').classList.add('hidden');
  $('#codexScreen').classList.add('hidden');
  $('#achScreen').classList.add('hidden');
  $('#shopScreen').classList.add('hidden');
  $('#tutBox').classList.add('hidden');
}

/* ============================================================
   新手教程：只在新玩家第一次进入时出现，四步引导
   ============================================================ */
const TUT_KEY = 'pixelDash.tut.v1';
const TUT_STEPS = [
  '拖动移动：WASD / 方向键，手机用左下摇杆',
  '按空格 / 冲刺键冲刺 —— 冲刺穿过敌人才有伤害',
  '用冲刺穿过第一个敌人，把它撞碎',
  '升级时选一张卡，构筑自己的能力',
];
function makeTutorial() {
  let seen = false;
  try { seen = localStorage.getItem(TUT_KEY) === '1'; } catch (e) {}
  return { active: !seen, step: 0, dist: 0, lx: player ? player.x : W / 2, ly: player ? player.y : H / 2 };
}
function endTutorial() {
  if (!tutorial) return;
  tutorial.active = false;
  try { localStorage.setItem(TUT_KEY, '1'); } catch (e) {}
  const box = $('#tutBox');
  if (box) box.classList.add('hidden');
}
function tutAdvance() {
  if (!tutorial || !tutorial.active) return;
  tutorial.step += 1;
  tutorial.dist = 0;
  if (tutorial.step >= TUT_STEPS.length) { endTutorial(); return; }
  renderTut();
  blip(760, 0.06, 'triangle', 0.035, 120);
}
function renderTut() {
  const box = $('#tutBox');
  if (!box || !tutorial) return;
  if (!tutorial.active) { box.classList.add('hidden'); return; }
  box.classList.remove('hidden');
  $('#tutText').textContent = '新手 ' + (tutorial.step + 1) + '/' + TUT_STEPS.length + '　' + TUT_STEPS[tutorial.step];
  const skip = $('#tutSkip');
  skip.classList.toggle('hidden', tutorial.step >= TUT_STEPS.length - 1);
}
function updateTutorial(dt) {
  if (!tutorial || !tutorial.active || state !== 'playing' || !player) return;
  if (tutorial.step === 0) {
    const dx = player.x - tutorial.lx, dy = player.y - tutorial.ly;
    tutorial.dist += Math.hypot(dx, dy);
    if (tutorial.dist >= 80) tutAdvance();
  }
  tutorial.lx = player.x; tutorial.ly = player.y;
}

function startGame() {
  endless = false;
  resetWorld();
  hideLayers();
  state = 'playing';
  renderTut();
  audio();
  lastTs = performance.now();
  blip(520, 0.08, 'triangle', 0.05, 320);
  if (muted) toast('音效已关闭 · 点右上角齿轮可在设置中开启');
}

function goMenu() {
  bankCoins();
  state = 'menu';
  endless = false;
  resetWorld();
  hideLayers();
  layers.title.classList.remove('hidden');
  refreshBestLine();
  refreshLoadout();
  blip(330, 0.09, 'triangle', 0.045, -120);
}

