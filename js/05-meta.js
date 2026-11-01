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
/* 闯关按「最远关卡 → 是否通过 → 分数」排序；无尽按分数排序 */
function sortModeRecords(list, mode) {
  if (mode === 'campaign') {
    list.sort((a, b) => (b.stage || 0) - (a.stage || 0) ||
      (b.won ? 1 : 0) - (a.won ? 1 : 0) || b.score - a.score);
  } else {
    list.sort((a, b) => b.score - a.score || b.time - a.time);
  }
  return list;
}
function modeRecords(mode) {
  const all = loadRecords();
  if (!mode) return sortModeRecords(all, mode);
  /* 早期版本没有 mode 字段的旧记录归到「无尽」榜，避免直接消失 */
  const list = all.filter((r) => r.mode === mode || (!r.mode && mode === 'endless'));
  return sortModeRecords(list, mode);
}
function bestRecord(mode) {
  if (!mode) {
    const list = loadRecords();
    return list.length ? list[0] : null;
  }
  const list = modeRecords(mode);
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
function recordModeCol(r) {
  const m = r && r.mode && MODES[r.mode];
  return m ? m.col : '#a9bdd4';
}
function refreshBestLine() {
  const prog = Math.min(Math.max(campaignProgress() - 1, 0), LEVELS.length);
  const e = bestRecord('endless');
  $('#bestLine').innerHTML =
    '闯关进度 <b>' + prog + '</b> / ' + LEVELS.length + ' 关' +
    '　·　' + (e ? '无尽最佳 <b>' + e.score + '</b> 分' : '无尽暂无记录');
}

/* 历史记录：闯关看最远关卡，无尽看得分，两套榜各自排序 */
let histTab = 'campaign';
function renderHistory() {
  const box = $('#histList'), cap = $('#histCap');
  if (!box) return;
  for (const b of document.querySelectorAll('.htab')) {
    b.classList.toggle('on', b.dataset.htab === histTab);
  }
  box.className = 'hlist ' + (histTab === 'campaign' ? 'camp' : 'endless');
  const list = modeRecords(histTab).slice(0, MAX_REC);

  if (histTab === 'campaign') {
    const done = campaignProgress();
    const cleared = Math.min(Math.max(done - 1, 0), LEVELS.length);
    const next = done <= LEVELS.length ? '下一关：第 ' + done + ' 关 · ' + LEVELS[done - 1].name : '全部关卡已通过';
    if (cap) cap.innerHTML = '已通关 <b>' + cleared + '</b> / ' + LEVELS.length + ' 关　·　' + next;
    if (!list.length) {
      box.innerHTML = '<div class="hempty">还没有闯关记录。<br />从第 1 关开始，最远到过哪一关都会记在这里。</div>';
      return;
    }
    box.innerHTML =
      '<div class="hhead"><div>#</div><div>关卡</div><div>结果</div><div>得分</div><div>存活</div><div>击杀</div><div>时间</div></div>' +
      list.map((r, i) =>
      '<div class="hrow' + (i < 3 ? ' top' + (i + 1) : '') + '">' +
        '<div class="rk">' + (i + 1) + '</div>' +
        '<div class="dfg" style="color:' + recordModeCol(r) + '">' +
          (r.stage ? '第 ' + r.stage + ' 关 · ' + (r.stageName || '') : '闯关') + '</div>' +
        '<div style="color:' + (r.won ? '#a8f5c3' : '#ff9b86') + '">' + (r.won ? '✓ 通过' : '✗ 失败') + '</div>' +
        '<div class="sc">' + r.score + '</div>' +
        '<div class="tm">' + fmt(r.time) + '</div>' +
        '<div>' + r.kills + ' 杀</div>' +
        '<div class="dt">' + fmtDate(r.date) + '</div>' +
      '</div>').join('');
    return;
  }

  const best = bestRecord('endless');
  if (cap) cap.innerHTML = best
    ? '无尽最高分 <b>' + best.score + '</b>　·　共 ' + modeRecords('endless').length + ' 局'
    : '还没有无尽记录 —— 固定一张地图，一直打到倒下为止';
  if (!list.length) {
    box.innerHTML = '<div class="hempty">还没有无尽记录。<br />选一张地图开一局，分数就会留在这里。</div>';
    return;
  }
  box.innerHTML =
    '<div class="hhead"><div>#</div><div>分数</div><div>波次</div><div>存活</div><div>击杀</div><div>等级</div><div>时间</div></div>' +
    list.map((r, i) =>
    '<div class="hrow' + (i < 3 ? ' top' + (i + 1) : '') + '">' +
      '<div class="rk">' + (i + 1) + '</div>' +
      '<div class="sc">' + r.score + '</div>' +
      '<div>' + (r.wave ? '第 ' + r.wave + ' 波' : '—') + '</div>' +
      '<div class="tm">' + fmt(r.time) + '</div>' +
      '<div>' + r.kills + ' 杀</div>' +
      '<div>LV.' + r.level + '</div>' +
      '<div class="dt">' + fmtDate(r.date) + '</div>' +
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
if ($('#histTabs')) {
  $('#histTabs').addEventListener('click', (e) => {
    const b = e.target && e.target.closest ? e.target.closest('.htab') : null;
    if (!b || !b.dataset.htab || b.dataset.htab === histTab) return;
    histTab = b.dataset.htab;
    renderHistory();
  });
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
/* 最近一局的结算快照：供「战绩长图」导出使用 */
let lastRunInfo = null;

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
  { id: 'tenclear', name: '十殿老将',  kind: 'pos', desc: '通关前 10 个闯关关卡',                cond: () => campaignProgress() >= 11 },
  { id: 'night5k', name: '长夜不眠',   kind: 'pos', desc: '无尽模式单局得分达到 5000',            cond: () => endless && calcScore() >= 5000 },
  { id: 'night8k', name: '深夜领主',   kind: 'pos', desc: '无尽模式单局得分达到 8000',            cond: () => endless && calcScore() >= 8000 },

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
  { id: 'rainsoak', name: '落汤鸡',    kind: 'neg', desc: '在雨夜地图存活满 60 秒',              cond: () => map.id === 'rain' && time >= 60 },
];

/* ============================================================
   勋章：成就奖励货币（正面 2 枚 / 整活 1 枚），总量有上限
   ============================================================ */
const MEDAL_KEY = 'pixelDash.medals.v1';
const ACH_MEDAL = { pos: 2, neg: 1 };
function achMedalReward(a) { return ACH_MEDAL[a.kind] || 0; }
/* 上限 = 所有成就奖励之和；成就是一次性的，所以勋章不可能超过这个数 */
const MEDAL_CAP = ACHS.reduce((n, a) => n + achMedalReward(a), 0);

function loadMedalSpent() {
  try { return Math.max(0, Math.floor(Number(localStorage.getItem(MEDAL_KEY) || 0))); } catch (e) { return 0; }
}
function medalsEarned() {
  return ACHS.reduce((n, a) => n + (achUnlocked[a.id] ? achMedalReward(a) : 0), 0);
}
/* 已花掉的勋章；夹在 [0, 已获得] 之间，避免旧存档/改数据后越界 */
let medalSpent = Math.min(loadMedalSpent(), medalsEarned());
function medalBalance() {
  return Math.max(0, Math.min(MEDAL_CAP, medalsEarned()) - medalSpent);
}
function spendMedals(n) {
  n = Math.max(0, Math.floor(Number(n) || 0));
  if (n <= 0 || medalBalance() < n) return false;
  medalSpent = Math.min(MEDAL_CAP, medalSpent + n);
  try { localStorage.setItem(MEDAL_KEY, String(medalSpent)); } catch (e) {}
  return true;
}

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
    const gain = achMedalReward(a);
    toast('成就解锁 · ' + a.name + '（+' + gain + ' 勋章）', a.kind === 'neg');
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
    return '<div class="acard ' + a.kind + ' ' + (un ? 'unlocked' : 'locked') + '" data-ach="' + a.id + '">' +
      '<div class="atop"><span class="aseal">' + (a.kind === 'pos' ? '正' : '整') + '</span>' +
        '<div><div class="aname">' + (un ? a.name : '？？？') + '</div>' +
        '<div class="akind">' + (a.kind === 'pos' ? '正面 · 荣耀' : '整活 · 黑历史') + '</div></div></div>' +
      '<div class="adesc">' + a.desc + '</div>' +
      '<div class="areward">奖励 +' + achMedalReward(a) + ' ' + ico('medal') + '勋章</div>' +
      '<div class="adate">' + (un ? '已解锁 · ' + achDate(ts) : '未解锁') + '</div>' +
    '</div>';
  }).join('');
  const total = ACHS.length;
  const n = ACHS.filter((a) => achUnlocked[a.id]).length;
  const pos = ACHS.filter((a) => a.kind === 'pos' && achUnlocked[a.id]).length;
  const neg = ACHS.filter((a) => a.kind === 'neg' && achUnlocked[a.id]).length;
  $('#achNote').innerHTML = '已解锁 ' + n + ' / ' + total +
    '　·　正面 ' + pos + ' / ' + ACHS.filter((a) => a.kind === 'pos').length +
    '　·　整活 ' + neg + ' / ' + ACHS.filter((a) => a.kind === 'neg').length +
    '　·　' + ico('medal') + ' ' + medalBalance() + ' / ' + MEDAL_CAP + ' 可用（已得 ' + medalsEarned() + '）';
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
  /* 这里不停音乐：输赢之后曲子继续放，回主菜单（goMenu）才停 */
  const bank = bankCoins();
  const score = calcScore();
  const prev = bestRecord(modeKey);
  /* 闯关看「首次通过这一关」，无尽看同模式最高分 */
  const firstClear = !!(campaign && win && curLevel && campaignProgress() <= curLevel.id);
  const newBest = modeKey === 'tutorial' ? false
    : campaign ? firstClear
    : (!prev || score > prev.score);
  if (modeKey !== 'tutorial') {
    pushRecord({
      score, time: Math.round(time), kills,
      level: player.level, won: win, date: Date.now(),
      mode: modeKey, stage: campaign && curLevel ? curLevel.id : 0,
      stageName: campaign && curLevel ? curLevel.name : '',
      wave: endless ? wave : 0,
    });
  }
  const best = bestRecord(modeKey);
  /* 结算时判定「死亡/通关」类成就，解锁结果直接写进结算面板 */
  const newAch = checkAch(true, {
    ending: true, dead: !win && !quit, win, time, quit,
    mode: modeKey, stage: campaign && curLevel ? curLevel.id : 0,
  });

  /* 闯关通关：解锁下一关 */
  if (campaign && win && curLevel) unlockLevel(curLevel.id);

  const mc = MODES[modeKey] || MODES.endless;
  lastRunInfo = {
    win: !!win, quit: !!quit, score, time: Math.round(time), kills,
    level: player.level, coins: bank.run, coinsTotal: bank.total,
    newBest, best: best ? best.score : score, ach: newAch,
    mode: modeKey, modeName: mc.name, modeCol: mc.col,
    stage: campaign && curLevel ? curLevel.id : 0,
    stageName: campaign && curLevel ? curLevel.name : '',
    wave: endless ? wave : 0,
    hero: heroKey, date: Date.now(),
  };
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
    cell(ico('coin') + '金币', '+' + bank.run + (bank.total ? ' · 共 ' + bank.total : ''), 'coin');
  const bestTip = modeKey === 'tutorial' ? '操作就是全部武器'
    : campaign ? '最远 第 ' + Math.min(Math.max(campaignProgress() - 1, 0), LEVELS.length) + ' 关'
    : '无尽最佳 ' + (best ? best.score : score) + ' 分';
  $('#endFlags').innerHTML =
    (newBest ? '<span class="rflag">★ ' + (campaign ? '新关卡' : '新纪录') + '</span>' : '') +
    (newAch.length ? '<span class="rflag ach">✦ 新成就 · ' + newAch.join(' · ') + '</span>' : '') +
    '<span class="rmeta">模式 <span class="rdiff" style="color:' + mc.col + ';border-color:' + mc.col +
      '99;background:' + mc.col + '22">' + mc.name +
      (campaign && curLevel ? ' · 第' + curLevel.id + '关' : endless ? ' · 第' + wave + '波' : '') +
      '</span>　·　' + bestTip + '</span>';
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

/* ============================================================
   战绩长图 / 成就分享卡：离屏画布 → PNG 下载
   ============================================================ */
const SH_FONT = 'ui-monospace, "PingFang SC", "Microsoft YaHei", monospace';
const SH_URL = 'github.com/Timethief1997/pixel-dash';

/* 统一的木质底板：木纹 + 双层描边 + 四角铆钉 */
function shCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  const bg = g.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#3b2716');
  bg.addColorStop(0.5, '#2a1a10');
  bg.addColorStop(1, '#150c06');
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,222,168,.05)';
  for (let y = 6; y < h; y += 9) g.fillRect(0, y, w, 1);
  g.strokeStyle = '#6f4a29'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
  g.strokeStyle = 'rgba(255,215,106,.32)'; g.lineWidth = 2; g.strokeRect(15, 15, w - 30, h - 30);
  for (const p of [[26, 26], [w - 26, 26], [26, h - 26], [w - 26, h - 26]]) {
    const rg = g.createRadialGradient(p[0] - 2, p[1] - 2, 0, p[0], p[1], 9);
    rg.addColorStop(0, '#fff1c8'); rg.addColorStop(0.55, '#c8842e'); rg.addColorStop(1, '#5a3413');
    g.fillStyle = rg;
    g.beginPath(); g.arc(p[0], p[1], 7, 0, Math.PI * 2); g.fill();
  }
  return { c, g };
}

function shText(g, s, x, y, size, col, align, weight) {
  g.font = (weight || 700) + ' ' + size + 'px ' + SH_FONT;
  g.textAlign = align || 'left';
  g.textBaseline = 'top';
  g.fillStyle = col;
  g.fillText(s, x, y);
}

/* 中文逐字换行 */
function shWrap(g, text, x, y, maxW, size, col, lh) {
  g.font = '400 ' + size + 'px ' + SH_FONT;
  g.textAlign = 'left';
  g.textBaseline = 'top';
  g.fillStyle = col;
  let line = '', yy = y;
  for (const ch of text) {
    if (line && g.measureText(line + ch).width > maxW) {
      g.fillText(line, x, yy);
      line = ch; yy += lh;
    } else line += ch;
  }
  if (line) g.fillText(line, x, yy);
  return yy + lh;
}

function shPill(g, text, cx, y, size, col) {
  g.font = '700 ' + size + 'px ' + SH_FONT;
  const w = Math.max(96, g.measureText(text).width + 40);
  const h = size + 20;
  g.fillStyle = col + '22';
  g.strokeStyle = col + 'aa';
  g.lineWidth = 2;
  g.beginPath();
  if (g.roundRect) g.roundRect(cx - w / 2, y, w, h, h / 2);
  else g.rect(cx - w / 2, y, w, h);
  g.fill(); g.stroke();
  shText(g, text, cx, y + 10, size, col, 'center', 700);
  return y + h;
}

function shStat(g, label, val, x, y, w, col) {
  g.fillStyle = 'rgba(0,0,0,.26)';
  g.fillRect(x, y, w, 76);
  g.strokeStyle = 'rgba(255,215,106,.22)';
  g.lineWidth = 2;
  g.strokeRect(x, y, w, 76);
  shText(g, label, x + 16, y + 12, 18, '#c9a97f', 'left', 700);
  shText(g, String(val), x + 16, y + 36, 34, col || '#f4e3c6', 'left', 800);
}

function shHero(g, id, x, y, size) {
  const hero = HEROES.find((h) => h.id === id) || HEROES[0];
  const col = hero.col || '#ffd76a';
  const gs = g.createRadialGradient(x + size / 2, y + size / 2, size * 0.06, x + size / 2, y + size / 2, size * 0.9);
  gs.addColorStop(0, col + '44');
  gs.addColorStop(1, col + '00');
  g.fillStyle = gs;
  g.fillRect(x - size * 0.45, y - size * 0.45, size * 1.9, size * 1.9);
  g.fillStyle = 'rgba(0,0,0,.32)';
  g.beginPath();
  g.ellipse(x + size / 2, y + size + 6, size * 0.36, size * 0.10, 0, 0, Math.PI * 2);
  g.fill();
  g.drawImage(heroSprite(id, 0), x, y, size, size);
  return hero;
}

/* 结算长图：模式 / 分数 / 四项数据 / 出战英雄 / 本局成就 */
function makeRunPoster(r) {
  const PW = 720, PH = 1120;
  const { c, g } = shCanvas(PW, PH);
  const cx = PW / 2;
  shText(g, 'P I X E L   D A S H', cx, 62, 26, '#b08d68', 'center', 700);
  shText(g, r.win ? 'R U N   C L E A R' : r.quit ? 'R U N   E N D E D' : 'R U N   O V E R',
    cx, 104, 18, '#8a6a4c', 'center', 700);

  let title = '本局结束';
  if (!r.quit) {
    if (r.mode === 'tutorial') title = r.win ? '教程完成' : '教程中断';
    else if (r.stage) title = (r.win ? '关卡通过 · ' : '闯关失败 · ') + r.stageName;
    else title = '第 ' + r.wave + ' 波倒下';
  }
  shText(g, title, cx, 148, 50, r.win ? '#ffe066' : r.quit ? '#e6d9c2' : '#ff9b86', 'center', 800);

  const tag = r.modeName + (r.stage ? ' · 第 ' + r.stage + ' 关' : r.wave ? ' · 第 ' + r.wave + ' 波' : '');
  shPill(g, tag, cx, 222, 20, r.modeCol || '#ffd76a');

  // 分数块
  g.fillStyle = 'rgba(0,0,0,.30)';
  g.fillRect(60, 292, PW - 120, 196);
  g.strokeStyle = 'rgba(255,215,106,.4)';
  g.lineWidth = 2;
  g.strokeRect(60, 292, PW - 120, 196);
  shText(g, 'S C O R E', cx, 316, 18, '#8a6a4c', 'center', 700);
  shText(g, String(r.score), cx, 344, 92, '#ffd76a', 'center', 800);
  if (r.newBest) shText(g, '★  NEW  RECORD', cx, 450, 18, '#ffb86b', 'center', 800);
  else shText(g, '历史最佳 ' + r.best, cx, 450, 18, '#a8895f', 'center', 700);

  // 数据格
  const gw = (PW - 120 - 20) / 2;
  shStat(g, '存活', fmt(r.time), 60, 520, gw);
  shStat(g, '击杀', r.kills, 80 + gw, 520, gw, '#ff9b86');
  shStat(g, '等级', 'Lv.' + r.level, 60, 610, gw, '#ffd76a');
  shStat(g, '本局金币', '+' + r.coins, 80 + gw, 610, gw, '#ffcf5c');

  // 出战英雄
  g.fillStyle = 'rgba(0,0,0,.26)';
  g.fillRect(60, 706, PW - 120, 200);
  g.strokeStyle = '#6f4a29';
  g.lineWidth = 2;
  g.strokeRect(60, 706, PW - 120, 200);
  const hero = shHero(g, r.hero, 96, 734, 144);
  shText(g, hero.name, 280, 750, 40, '#f4e3c6', 'left', 800);
  shText(g, hero.tag || '冒险者', 280, 804, 20, '#c9a97f', 'left', 700);
  shText(g, '出战小英雄', 280, 838, 18, '#8a6a4c', 'left', 700);

  // 本局解锁的成就
  shText(g, '本局解锁成就', 60, 932, 18, '#8a6a4c', 'left', 700);
  if (r.ach && r.ach.length) {
    let ax = 60, ay = 964;
    for (const n of r.ach.slice(0, 8)) {
      g.font = '700 20px ' + SH_FONT;
      const w = g.measureText(n).width + 34;
      if (ax + w > PW - 60) { ax = 60; ay += 46; if (ay > 1004) break; }
      g.fillStyle = 'rgba(255,215,106,.14)';
      g.strokeStyle = 'rgba(255,215,106,.55)';
      g.lineWidth = 2;
      g.beginPath();
      if (g.roundRect) g.roundRect(ax, ay, w, 38, 19); else g.rect(ax, ay, w, 38);
      g.fill(); g.stroke();
      shText(g, n, ax + w / 2, ay + 9, 20, '#ffe0a0', 'center', 700);
      ax += w + 12;
    }
  } else {
    shText(g, '本局没有新成就', 60, 968, 20, '#7a5c3c', 'left', 700);
  }

  // 页脚
  shText(g, achDate(r.date) + '　·　' + SH_URL, cx, 1034, 16, '#7a5c3c', 'center', 600);
  shText(g, '冲刺，是唯一的技能', cx, 1064, 16, '#8a6a4c', 'center', 600);
  return c;
}

/* 成就分享卡：印章 / 名称 / 条件 / 解锁时间 / 收集进度 */
function makeAchCard(a, ts) {
  const PW = 720, PH = 840;
  const { c, g } = shCanvas(PW, PH);
  const cx = PW / 2;
  const pos = a.kind === 'pos';
  const col = pos ? '#ffd76a' : '#ff9b86';
  shText(g, 'A C H I E V E M E N T', cx, 58, 22, '#b08d68', 'center', 700);

  // 印章
  const cy = 152;
  const rg = g.createRadialGradient(cx - 10, cy - 10, 4, cx, cy, 64);
  rg.addColorStop(0, pos ? '#ffe9a8' : '#ffb28f');
  rg.addColorStop(1, pos ? '#a76a1c' : '#7d2a22');
  g.fillStyle = rg;
  g.beginPath(); g.arc(cx, cy, 58, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#2a1a10';
  g.lineWidth = 4;
  g.beginPath(); g.arc(cx, cy, 58, 0, Math.PI * 2); g.stroke();
  shText(g, pos ? '正' : '整', cx, cy - 32, 60, '#2a1408', 'center', 800);

  shText(g, a.name, cx, 238, 58, col, 'center', 800);
  shText(g, pos ? '正面 · 荣耀' : '整活 · 黑历史', cx, 310, 20, '#a8895f', 'center', 700);

  // 条件
  g.fillStyle = 'rgba(0,0,0,.28)';
  g.fillRect(60, 356, PW - 120, 148);
  g.strokeStyle = '#6f4a29';
  g.lineWidth = 2;
  g.strokeRect(60, 356, PW - 120, 148);
  shWrap(g, a.desc, 92, 386, PW - 184, 26, '#e8d4b0', 40);

  // 解锁时间 + 收集进度
  shText(g, '解锁于 ' + achDate(ts), 60, 538, 20, '#c9a97f', 'left', 700);
  const n = ACHS.filter((x) => achUnlocked[x.id]).length;
  shText(g, '已解锁 ' + n + ' / ' + ACHS.length, PW - 60, 538, 20, '#c9a97f', 'right', 700);

  // 进度条
  g.fillStyle = 'rgba(0,0,0,.4)';
  g.fillRect(60, 574, PW - 120, 14);
  const grad = g.createLinearGradient(60, 0, PW - 60, 0);
  grad.addColorStop(0, '#c8842e');
  grad.addColorStop(1, '#ffd76a');
  g.fillStyle = grad;
  g.fillRect(60, 574, (PW - 120) * (n / ACHS.length), 14);
  g.strokeStyle = 'rgba(255,215,106,.4)';
  g.lineWidth = 2;
  g.strokeRect(60, 574, PW - 120, 14);

  // 出战英雄
  const hero = shHero(g, heroKey, 86, 626, 120);
  shText(g, '出战 · ' + hero.name, 252, 654, 26, '#f4e3c6', 'left', 700);
  shText(g, pos ? '荣耀证书' : '黑历史记录', 252, 700, 18, '#8a6a4c', 'left', 700);

  // 页脚
  shText(g, SH_URL, cx, 786, 16, '#7a5c3c', 'center', 600);
  return c;
}

function shSave(c, name) {
  let url;
  try { url = c.toDataURL('image/png'); } catch (e) { return; }
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast('已生成图片，可保存或分享');
  } catch (e) {
    window.open(url, '_blank');
  }
}

function shareRunPoster() {
  if (!lastRunInfo) return;
  shSave(makeRunPoster(lastRunInfo), 'pixel-dash-run-' + lastRunInfo.score + '.png');
}

function shareAchCard(id) {
  const a = ACHS.find((x) => x.id === id);
  if (!a) return;
  const ts = achUnlocked[id];
  if (!ts) { toast('该成就尚未解锁', true); return; }
  shSave(makeAchCard(a, ts), 'pixel-dash-ach-' + a.id + '.png');
}

