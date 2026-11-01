/* PIXEL DASH · 记录 / 图鉴 / 成就 —— 由 index.html 拆分，按顺序加载 */
'use strict';

/* ============================================================
   分数与历史记录（localStorage，最多保留 10 局）
   ============================================================ */
const HKEY = 'pixelDash.records.v1';
const MAX_REC = 10;
const COIN_KEY = 'pixelDash.coins.v1';

function loadCoins() {
  try { return Math.max(0, Math.floor(Number(localStorage.getItem(COIN_KEY) || 0))); } catch (e) { return 0; }
}
function saveCoins(n) {
  try { localStorage.setItem(COIN_KEY, String(Math.max(0, Math.floor(n)))); } catch (e) {}
}
/* 单局金币入账：返回本局获得与累计总额，供结算面板显示 */
function bankCoins() {
  const run = coins;
  coins = 0;
  const total = loadCoins() + run;
  if (run > 0) saveCoins(total);
  return { run, total };
}

function calcScore() {
  if (!player) return 0;
  return Math.round((Math.floor(time * 12) + killScore + player.level * 60) * diff.score);
}
function loadRecords() {
  try {
    const a = JSON.parse(localStorage.getItem(HKEY) || '[]');
    return Array.isArray(a) ? a.filter((r) => r && typeof r.score === 'number') : [];
  } catch (e) { return []; }
}
function storeRecords(list) {
  try { localStorage.setItem(HKEY, JSON.stringify(list)); } catch (e) {}
}
function pushRecord(rec) {
  const list = loadRecords();
  list.push(rec);
  list.sort((a, b) => b.score - a.score || b.time - a.time);
  const top = list.slice(0, MAX_REC);
  storeRecords(top);
  return top;
}
function bestRecord() {
  const list = loadRecords();
  return list.length ? list[0] : null;
}

/* 旧版难度倍率是 0.8 / 1.0 / 1.25，重算后按比例迁移历史分数，只跑一次 */
const SVER = 'pixelDash.scoreVer';
const OLD_MUL = { casual: 0.80, normal: 1.00, hard: 1.25 };
function migrateScores() {
  try {
    if (localStorage.getItem(SVER) === '2') return;
    const list = loadRecords();
    for (const r of list) {
      const oldM = OLD_MUL[r.diff] || 1;
      const newM = (DIFFS[r.diff] || DIFFS.normal).score;
      r.score = Math.round(r.score * newM / oldM);
    }
    list.sort((a, b) => b.score - a.score);
    storeRecords(list);
    localStorage.setItem(SVER, '2');
  } catch (e) {}
}
migrateScores();
function fmtDate(ts) {
  const d = new Date(ts), p = (n) => String(n).padStart(2, '0');
  return p(d.getMonth() + 1) + '/' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
}
function recordModeName(r) {
  const m = r && r.mode && MODES[r.mode];
  if (!m) return '旧版记录';
  if (r.stage) return m.name + ' · 第' + r.stage + '关';
  if (r.mode === 'endless' && r.wave) return m.name + ' · 第' + r.wave + '波';
  return m.name;
}
function recordModeCol(r) {
  const m = r && r.mode && MODES[r.mode];
  return m ? m.col : '#a9bdd4';
}
function refreshBestLine() {
  const b = bestRecord();
  $('#bestLine').innerHTML = b
    ? '最佳 <b>' + b.score + '</b> 分（' + recordModeName(b) + '）　·　存活 ' + fmt(b.time) + '　·　击杀 ' + b.kills
    : '暂无记录 —— 第一局就是你的最高分';
}
function renderHistory() {
  const list = loadRecords();
  const box = $('#histList');
  if (!list.length) {
    box.innerHTML = '<div class="hempty">还没有记录。<br />玩一局，分数就会留在这里。</div>';
    return;
  }
  box.innerHTML =
    '<div class="hhead"><div>#</div><div>分数</div><div>存活</div><div>击杀</div><div>等级</div><div>模式</div><div>时间</div></div>' +
    list.map((r, i) =>
    '<div class="hrow' + (i < 3 ? ' top' + (i + 1) : '') + '">' +
      '<div class="rk">' + (i + 1) + '</div>' +
      '<div class="sc">' + r.score + '</div>' +
      '<div class="tm">' + fmt(r.time) + '</div>' +
      '<div>' + r.kills + ' 杀</div>' +
      '<div>LV.' + r.level + '</div>' +
      '<div class="dfg" style="color:' + recordModeCol(r) + '">' + recordModeName(r) + '</div>' +
      '<div class="dt">' + (r.won ? '✓ ' : '') + fmtDate(r.date) + '</div>' +
    '</div>').join('');
}
function openHistory() {
  renderHistory();
  layers.title.classList.add('hidden');
  $('#historyScreen').classList.remove('hidden');
}
function closeHistory() {
  $('#historyScreen').classList.add('hidden');
  refreshBestLine();
  if (state === 'menu') layers.title.classList.remove('hidden');
}

/* ============================================================
   怪物图鉴（见过一次即点亮，本地持久化）
   ============================================================ */
const CKEY = 'pixelDash.codex.v1';
function loadSeenSet() {
  try {
    const a = JSON.parse(localStorage.getItem(CKEY) || '[]');
    return new Set(Array.isArray(a) ? a : []);
  } catch (e) { return new Set(); }
}
function saveSeenSet() {
  try { localStorage.setItem(CKEY, JSON.stringify([...seenSet])); } catch (e) {}
}
let seenSet = loadSeenSet();

function unlockCodex(type) {
  if (seenSet.has(type)) return null;
  const entry = CODEX.find((m) => m.id === type);
  if (!entry) return null;
  seenSet.add(type);
  saveSeenSet();
  return entry.name;
}

function drawCodexIcon(cv, m, seen) {
  const ic = m.icon;
  const t = ETYPES[ic.type];
  const s = Math.round(t.r * 2);
  const k = Math.max(2, Math.floor(40 / s));
  const pad = 2;
  const size = (s + pad * 2) * k;
  cv.width = size; cv.height = size;
  const g = cv.getContext('2d');
  g.imageSmoothingEnabled = false;

  const skin = ic.gen ? BOSS_SKIN[Math.min(ic.gen, BOSS_SKIN.length) - 1] : null;
  const bodyCol = seen ? (skin ? skin.col : t.color) : '#242438';
  const edgeCol = seen ? (skin ? skin.edge : '#171728') : '#1b1b2b';
  const eyeCol = seen ? '#0b0b13' : '#121220';

  // 先在 1x 画布上画好，再整数放大，像素块才不会糊
  const tmp = document.createElement('canvas');
  tmp.width = s + pad * 2; tmp.height = s + pad * 2;
  const sg = tmp.getContext('2d');
  sg.imageSmoothingEnabled = false;

  if (ic.affix) {
    sg.globalAlpha = 0.9;
    sg.fillStyle = seen ? AFFIX[ic.affix].col : '#2e3450';
    sg.fillRect(pad - 1, pad - 1, s + 2, 1);
    sg.fillRect(pad - 1, pad + s, s + 2, 1);
    sg.fillRect(pad - 1, pad - 1, 1, s + 2);
    sg.fillRect(pad + s, pad - 1, 1, s + 2);
    sg.globalAlpha = 1;
  }

  paintMonster(sg, pad, pad, s, { color: bodyCol, edge: edgeCol, eye: eyeCol, type: ic.type, gen: ic.gen || 0 });

  g.drawImage(tmp, 0, 0, tmp.width, tmp.height, 0, 0, size, size);
}

function renderCodex() {
  const grid = $('#codexGrid');
  grid.innerHTML = CODEX.map((m) => {
    const seen = seenSet.has(m.id);
    return '<div class="mcard ' + (seen ? 'seen' : 'locked') + '">' +
      '<canvas data-entry="' + m.id + '" data-seen="' + (seen ? 1 : 0) + '"></canvas>' +
      '<div class="mid">' + (seen ? '已记录' : '未发现') + '</div>' +
      '<div class="mname">' + (seen ? m.name : '？？？') + '</div>' +
      '<div class="mskill">' + (seen ? m.skill : '？？？') + '</div>' +
      '<div class="mpts">' + (seen ? '击杀 +' + m.pts + ' 分' : '？？？') + '</div>' +
      '<div class="mdesc">' + (seen ? m.desc : '在游戏里遇到它之后，这里会亮起来。') + '</div>' +
    '</div>';
  }).join('');
  for (const cv of grid.querySelectorAll('canvas')) {
    const m = CODEX.find((x) => x.id === cv.dataset.entry);
    if (m) drawCodexIcon(cv, m, cv.dataset.seen === '1');
  }
  const n = CODEX.filter((m) => seenSet.has(m.id)).length;
  $('#codexNote').textContent = '已发现 ' + n + ' / ' + CODEX.length +
    (n === CODEX.length ? '　·　全部收录' : '');
}

function openCodex() {
  renderCodex();
  layers.title.classList.add('hidden');
  $('#codexScreen').classList.remove('hidden');
}
function closeCodex() {
  $('#codexScreen').classList.add('hidden');
  if (state === 'menu') layers.title.classList.remove('hidden');
}

/* ============================================================
   成就殿堂（永久解锁，单局追踪）
   ============================================================ */
const AKEY = 'pixelDash.ach.v1';
const ASKEY = 'pixelDash.astats.v1';

function loadAchStore() {
  try {
    const o = JSON.parse(localStorage.getItem(AKEY) || '{}');
    return o && typeof o === 'object' && !Array.isArray(o) ? o : {};
  } catch (e) { return {}; }
}
function saveAchStore() {
  try { localStorage.setItem(AKEY, JSON.stringify(achUnlocked)); } catch (e) {}
}
function loadAchStats() {
  try {
    const o = JSON.parse(localStorage.getItem(ASKEY) || '{}');
    return { boss: Math.max(0, Math.floor(Number(o.boss) || 0)) };
  } catch (e) { return { boss: 0 }; }
}
function saveAchStats() {
  try { localStorage.setItem(ASKEY, JSON.stringify(achStats)); } catch (e) {}
}

let achUnlocked = loadAchStore();
let achStats = loadAchStats();
let achRun = null;

/* 正面：荣耀；整活：黑历史。名字要够狠，条件要够损。 */
const ACHS = [
  { id: 'edge',    name: '开刃',       kind: 'pos', desc: '单局击杀 50 个敌人',                  cond: (r) => r.kills >= 50 },
  { id: 'blood',   name: '血洗',       kind: 'pos', desc: '单局击杀 200 个敌人',                 cond: (r) => r.kills >= 200 },
  { id: 'behead',  name: '枭首',       kind: 'pos', desc: '累计击杀 1 只 BOSS',                  cond: (r, s) => s.boss >= 1 },
  { id: 'dragon',  name: '屠龙',       kind: 'pos', desc: '累计击杀 5 只 BOSS',                  cond: (r, s) => s.boss >= 5 },
  { id: 'crush',   name: '碾碎精英',   kind: 'pos', desc: '单局击杀 8 只精英（词缀怪）',          cond: (r) => r.elites >= 8 },
  { id: 'storm',   name: '腥风血雨',   kind: 'pos', desc: '3 秒内连续击杀 12 个敌人',             cond: (r) => r.killTimes.length >= 12 },
  { id: 'legend',  name: '破关者',     kind: 'pos', desc: '通关任意一个闯关关卡',                cond: (r, s, c) => !!c.win && c.mode === 'campaign' },
  { id: 'slayer',  name: '三千暴徒',   kind: 'pos', desc: '单局得分达到 3000',                   cond: () => calcScore() >= 3000 },

  { id: 'coward',  name: '怯战蜥蜴',   kind: 'neg', desc: '连续 30 秒没有击杀任何敌人',           cond: (r) => time - r.lastKill >= 30 },
  { id: 'vanish',  name: '人间蒸发',   kind: 'neg', desc: '连续 60 秒没有受到任何伤害',           cond: (r) => r.noHitT >= 60 },
  { id: 'instant', name: '闪电暴毙',   kind: 'neg', desc: '开局 10 秒内死亡',                    cond: (r, s, c) => !!c.dead && (c.time || time) < 10 },
  { id: 'rooted',  name: '脚下生根',   kind: 'neg', desc: '存活 30 秒，移动距离不足 300 像素',    cond: (r) => time >= 30 && r.dist < 300 },
  { id: 'salted',  name: '咸鱼之王',   kind: 'neg', desc: '存活 90 秒，一次冲刺都没用',           cond: (r) => time >= 90 && r.dashes === 0 },
  { id: 'ironhead',name: '铁头功',     kind: 'neg', desc: '单局被敌人击中 12 次',                 cond: (r) => r.hits >= 12 },
  { id: 'spendthrift', name: '散财童子', kind: 'neg', desc: '死亡时还剩至少 3 次换牌机会',         cond: (r, s, c) => !!c.dead && rerolls >= 3 },
  { id: 'scavenger', name: '拾荒之王', kind: 'neg', desc: '单局拾取 100 颗经验球',                cond: (r) => r.orbs >= 100 },

  { id: 'toxin',   name: '毒入膏肓',   kind: 'neg', desc: '单局中毒 5 次',                        cond: (r) => r.poisons >= 5 },
  { id: 'icesculpt',name:'冰雕艺术',   kind: 'neg', desc: '单局被冰冻 3 次',                      cond: (r) => r.freezes >= 3 },
  { id: 'sweeper', name: '清场大扫除', kind: 'pos', desc: '单局击杀 BOSS 触发清屏',                cond: (r) => r.clears >= 1 },
  { id: 'alchemy', name: '炼金术士',   kind: 'pos', desc: '单局入账 200 金币',                    cond: (r) => r.coinsEarned >= 200 },
];

function resetAchRun() {
  achRun = {
    kills: 0, elites: 0, bosses: 0, dashes: 0, hits: 0, orbs: 0,
    poisons: 0, freezes: 0, clears: 0, coinsEarned: 0,
    noHitT: 0, lastKill: 0, dist: 0, killTimes: [],
    lastX: player ? player.x : 0, lastY: player ? player.y : 0,
  };
}

function achDate(ts) {
  const d = new Date(ts);
  const p2 = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
}

function unlockAch(id, silent) {
  if (achUnlocked[id]) return null;
  const a = ACHS.find((x) => x.id === id);
  if (!a) return null;
  achUnlocked[id] = Date.now();
  saveAchStore();
  if (!silent) {
    toast('成就解锁 · ' + a.name, a.kind === 'neg');
    blip(920, 0.12, 'triangle', 0.07, 90);
    setTimeout(() => blip(1240, 0.16, 'triangle', 0.06, 80), 120);
  }
  return a.name;
}

function checkAch(silent, ctx) {
  if (!achRun || !player) return [];
  const c = ctx || {};
  const out = [];
  for (const a of ACHS) {
    if (achUnlocked[a.id]) continue;
    if (a.cond(achRun, achStats, c)) {
      const n = unlockAch(a.id, silent);
      if (n) out.push(n);
    }
  }
  return out;
}

/* 每帧追踪：无伤时长 + 累计移动距离 */
function achTrack(dt) {
  if (!achRun || !player || state !== 'playing') return;
  achRun.noHitT += dt;
  const dx = player.x - achRun.lastX, dy = player.y - achRun.lastY;
  achRun.dist += Math.hypot(dx, dy);
  achRun.lastX = player.x; achRun.lastY = player.y;
  checkAch();
}

function renderAch() {
  const grid = $('#achGrid');
  grid.innerHTML = ACHS.map((a) => {
    const ts = achUnlocked[a.id];
    const un = !!ts;
    return '<div class="acard ' + a.kind + ' ' + (un ? 'unlocked' : 'locked') + '">' +
      '<div class="atop"><span class="aseal">' + (a.kind === 'pos' ? '正' : '整') + '</span>' +
        '<div><div class="aname">' + (un ? a.name : '？？？') + '</div>' +
        '<div class="akind">' + (a.kind === 'pos' ? '正面 · 荣耀' : '整活 · 黑历史') + '</div></div></div>' +
      '<div class="adesc">' + a.desc + '</div>' +
      '<div class="adate">' + (un ? '已解锁 · ' + achDate(ts) : '未解锁') + '</div>' +
    '</div>';
  }).join('');
  const total = ACHS.length;
  const n = ACHS.filter((a) => achUnlocked[a.id]).length;
  const pos = ACHS.filter((a) => a.kind === 'pos' && achUnlocked[a.id]).length;
  const neg = ACHS.filter((a) => a.kind === 'neg' && achUnlocked[a.id]).length;
  $('#achNote').textContent = '已解锁 ' + n + ' / ' + total +
    '　·　正面 ' + pos + ' / ' + ACHS.filter((a) => a.kind === 'pos').length +
    '　·　整活 ' + neg + ' / ' + ACHS.filter((a) => a.kind === 'neg').length;
}

function openAch() {
  renderAch();
  layers.title.classList.add('hidden');
  $('#achScreen').classList.remove('hidden');
}
function closeAch() {
  $('#achScreen').classList.add('hidden');
  if (state === 'menu') layers.title.classList.remove('hidden');
}

const CONF_COLORS = ['#ffd96a', '#f2a94e', '#fff1c8', '#ff8f5a', '#c9e8a0', '#8fd9b0', '#ffffff'];
function spawnConfetti() {
  const box = $('#winFx');
  box.innerHTML = '';
  for (let i = 0; i < 46; i++) {
    const s = document.createElement('span');
    s.className = 'conf';
    s.style.left = rand(0, 100).toFixed(1) + '%';
    s.style.background = pick(CONF_COLORS);
    s.style.animationDuration = rand(2.6, 5.2).toFixed(2) + 's';
    s.style.animationDelay = (-rand(0, 3.2)).toFixed(2) + 's';
    box.appendChild(s);
  }
}
function winJingle() {
  [523, 659, 784, 1047, 1319].forEach((f, i) => {
    setTimeout(() => blip(f, 0.22, 'triangle', 0.07, 40), i * 110);
  });
}

function endGame(win, quit) {
  if (state !== 'playing') return;
  state = win ? 'won' : 'dead';
  const bank = bankCoins();
  const score = calcScore();
  const prev = bestRecord();
  const newBest = !prev || score > prev.score;
  if (modeKey !== 'tutorial') {
    pushRecord({
      score, time: Math.round(time), kills,
      level: player.level, won: win, date: Date.now(),
      mode: modeKey, stage: campaign && curLevel ? curLevel.id : 0,
      stageName: campaign && curLevel ? curLevel.name : '',
      wave: endless ? wave : 0,
    });
  }
  const best = bestRecord();
  /* 结算时判定「死亡/通关」类成就，解锁结果直接写进结算面板 */
  const newAch = checkAch(true, {
    ending: true, dead: !win && !quit, win, time, quit,
    mode: modeKey, stage: campaign && curLevel ? curLevel.id : 0,
  });

  /* 闯关通关：解锁下一关 */
  if (campaign && win && curLevel) unlockLevel(curLevel.id);

  const mc = MODES[modeKey] || MODES.endless;
  let title, kicker;
  if (quit) { title = '本局结束'; kicker = 'R U N   E N D E D'; }
  else if (modeKey === 'tutorial') { title = win ? '教程完成' : '教程中断'; kicker = 'T U T O R I A L'; }
  else if (campaign) {
    title = win ? '关卡通过 · ' + curLevel.name : '闯关失败 · ' + curLevel.name;
    kicker = win ? 'S T A G E   C L E A R' : 'S T A G E   F A I L E D';
  } else { title = '你在第 ' + wave + ' 波倒下'; kicker = 'R U N   O V E R'; }

  $('#endTitle').textContent = title;
  $('#endTitle').style.color = quit ? '#e6d9c2' : win ? '#ffe066' : '#ff9b86';
  $('#endKicker').textContent = kicker;
  const cell = (label, val, cls) =>
    '<div class="rcell"><span class="rlabel">' + label + '</span>' +
    '<b class="rval' + (cls ? ' ' + cls : '') + '">' + val + '</b></div>';
  $('#endStats').innerHTML =
    '<div class="rcell"><span class="rlabel">得分</span><b class="rval gold big">' + score + '</b></div>' +
    cell('存活', fmt(time), '') +
    cell('击杀', kills, 'hot') +
    cell('等级', 'Lv.' + player.level, 'gold') +
    cell('金币', '+' + bank.run + (bank.total ? ' · 共 ' + bank.total : ''), 'coin');
  $('#endFlags').innerHTML =
    (newBest ? '<span class="rflag">★ 新纪录</span>' : '') +
    (newAch.length ? '<span class="rflag ach">✦ 新成就 · ' + newAch.join(' · ') + '</span>' : '') +
    '<span class="rmeta">模式 <span class="rdiff" style="color:' + mc.col + ';border-color:' + mc.col +
      '99;background:' + mc.col + '22">' + mc.name +
      (campaign && curLevel ? ' · 第' + curLevel.id + '关' : endless ? ' · 第' + wave + '波' : '') +
      '</span>　·　历史最佳 ' + best.score + ' 分</span>';
  // 结算与 HUD 显示同一个最终分数，避免玩家对照时看到尾数差
  hudScoreVal = score;
  scoreValEl.textContent = score;

  const nextBtn = $('#nextBtn');
  if (nextBtn) {
    const hasNext = campaign && win && levelIndex + 1 < LEVELS.length;
    nextBtn.classList.toggle('hidden', !hasNext);
    if (hasNext) nextBtn.textContent = '下一关 · ' + LEVELS[levelIndex + 1].name;
  }
  const retryBtn = $('#retryBtn');
  if (retryBtn) {
    const label = campaign ? '重试本关' : modeKey === 'tutorial' ? '再练一次' : '再来一局';
    retryBtn.innerHTML = label + '<span class="key">空格</span>';
  }

  const endEl = $('#endScreen');
  endEl.classList.toggle('win', win);
  if (win) { spawnConfetti(); winJingle(); }
  layers.end.classList.remove('hidden');
}

