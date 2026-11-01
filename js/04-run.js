/* PIXEL DASH · 开始 / 结束 / 新手教程 —— 由 index.html 拆分，按顺序加载 */
'use strict';

/* ============================================================
   开始 / 结束
   ============================================================ */
function resetWorld() {
  time = 0; kills = 0; killScore = 0; shake = 0; screenFlash = 0;
  hitStop = 0; hitSnd = 0; orbChain = 0; orbChainT = 0;
  spawnTimer = 2.0 * diff.spawn; pendingLevels = 0;
  bossGen = 0; lastTier = 0; splitQueue.length = 0;
  coins = 0; nextEvent = 20; frenzyT = 0;
  wave = 1; waveT = 0; bossKills = 0;
  /* BOSS 节奏：无尽每 3 波一只；闯关 BOSS 关按关卡配置；教程不出 BOSS */
  if (modeKey === 'endless') nextBoss = 90;
  else if (campaign && curLevel && curLevel.goal === 'boss') nextBoss = curLevel.bossAt;
  else nextBoss = Infinity;
  campaignDeadline = campaign && curLevel ? curLevel.time : Infinity;
  enemies = []; orbs = []; bullets = []; ebullets = []; drops = [];
  particles = []; trails = []; effects = []; texts = []; marks = []; hazards = [];
  meteors = [];
  meteorT = map.meteor > 0 ? 6 : 0;   // 熔岩图：开局 6 秒后第一颗陨石
  shockT = map.shock > 0 ? 3 : 0;     // 霓虹图：开局 3 秒后第一次通电
  sandT = 0; sandCd = map.sand > 0 ? 9 : 0;   // 荒漠图：开局 9 秒后第一阵沙暴
  eid = 0;
  generateTerrain();
  player = makePlayer();
  rerolls = 2 + (player.heroRerolls || 0);   // 每局两次换牌，幸运英雄额外加成
  resetAchRun();
  tutorial = makeTutorial(modeKey === 'tutorial');
  spawnTimer = modeKey === 'tutorial' ? 1.0 : 2.0 * diff.spawn;
}

/* 进入某个模式（闯关时可指定关卡索引） */
function startMode(k, idx) {
  if (!MODES[k]) return;
  saveMode(k);
  campaign = k === 'campaign';
  endless = k === 'endless';
  if (campaign) {
    const i = clamp(Math.floor(Number(idx) || 0), 0, LEVELS.length - 1);
    levelIndex = i;
    curLevel = LEVELS[i];
    /* 关卡地图只作用于本局，不改动玩家在商店选的无尽地图 */
    map = MAPS[curLevel.map];
  } else if (k === 'tutorial') {
    curLevel = null;
    map = MAPS.plain;   // 教程固定在苔原，不覆盖玩家的无尽地图
  } else {
    curLevel = null;
    map = MAPS[mapKey]; // 无尽：整局固定玩家在商店选的地图
  }
  startGame();
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
  const ms = $('#modeScreen');
  if (ms) ms.classList.add('hidden');
  $('#tutBox').classList.add('hidden');
}

/* ============================================================
   新手教程：只在新玩家第一次进入时出现，四步引导
   ============================================================ */
const TUT_KEY = 'pixelDash.tut.v1';
const TUT_STEPS = [
  '移动：按住 WASD / 方向键（手机拖左下摇杆），先走两步',
  '冲刺：按空格 / 右下冲刺键 —— 冲刺穿过敌人才有伤害',
  '命中：朝最近的红色敌人冲刺，把它撞碎',
  '升级：按 1 / 2 / 3 选一张卡，教程就完成了',
];
function makeTutorial(force) {
  let seen = false;
  try { seen = localStorage.getItem(TUT_KEY) === '1'; } catch (e) {}
  return { active: !!force || !seen, step: 0, dist: 0, lx: player ? player.x : W / 2, ly: player ? player.y : H / 2 };
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
  if (tutorial.step >= TUT_STEPS.length) {
    endTutorial();
    if (modeKey === 'tutorial' && state === 'playing') endGame(true);
    return;
  }
  // 最后一步需要升级：直接补满经验，保证玩家一定能看到选卡界面
  if (tutorial.step === 3 && player) gainXP(8);
  renderTut();
  blip(760, 0.06, 'triangle', 0.035, 120);
}
/* 教程里的「跳过」：直接结束这局，回主菜单 */
function skipTutorial() {
  endTutorial();
  if (modeKey === 'tutorial' && state === 'playing') goMenu();
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
  resetWorld();
  hideLayers();
  state = 'playing';
  renderTut();
  audio();
  lastTs = performance.now();
  blip(520, 0.08, 'triangle', 0.05, 320);
  if (muted) toast('音效已关闭 · 点右上角齿轮可在设置中开启');
  if (campaign && curLevel) toast('关卡 ' + curLevel.id + ' · ' + curLevel.name + ' —— ' + curLevel.desc, true);
}

function goMenu() {
  bankCoins();
  state = 'menu';
  endless = false;
  campaign = false;
  curLevel = null;
  map = MAPS[mapKey];   // 闯关/教程可能临时换过地图，回主界面要还原
  resetWorld();
  hideLayers();
  $('#modeScreen').classList.add('hidden');
  layers.title.classList.remove('hidden');
  refreshBestLine();
  refreshLoadout();
  blip(330, 0.09, 'triangle', 0.045, -120);
}

