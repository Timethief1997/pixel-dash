/* PIXEL DASH · 游戏状态 —— 由 index.html 拆分，按顺序加载 */
'use strict';

/* ============================================================
   游戏状态
   ============================================================ */
let state = 'menu';          // menu | playing | upgrade | dead | won
let endless = false;
let time = 0, kills = 0, killScore = 0;
let shake = 0, screenFlash = 0, hitStop = 0, hitSnd = 0;
let orbChain = 0, orbChainT = 0;
let spawnTimer = 0.7, nextBoss = 80, bossGen = 0, lastTier = 0;
const splitQueue = [];
const SPLIT_MAX = 20;   // 分裂小兵同屏上限
let pendingLevels = 0;
let shopOptions = [];
let rerolls = 0;      // 换牌（重抽）机会，靠击杀掉落获取
let coins = 0;        // 单局金币，结算或退出时存入本地
let nextEvent = 20;   // 无尽模式事件倒计时（秒）
let frenzyT = 0;      // 狂暴事件剩余时间
let eid = 0;

let player = null;
let enemies = [], orbs = [], bullets = [], ebullets = [], drops = [];
let particles = [], trails = [], effects = [], texts = [], marks = [];
let hazards = [];     // 地面毒雾 / 腐蚀区域 / 熔岩
let tutorial = null;  // 新手教程状态
let terrain = { rocks: [], ice: [] };   // 地图静态地形
let meteors = [];    // 熔岩图的陨石
let meteorT = 0;

const keys = {};

/* ---------- 难度 ---------- */
const DKEY = 'pixelDash.diff.v1';
const DIFFS = {
  casual: { name: '休闲', col: '#7dffb0', hp: 0.82, spd: 0.90, spawn: 1.30, xp: 1.25, hpGrow: 150, invuln: 1.7, score: 0.60 },
  normal: { name: '标准', col: '#63d9ff', hp: 1.00, spd: 1.00, spawn: 1.00, xp: 1.00, hpGrow: 110, invuln: 1.20, score: 1.00 },
  hard:   { name: '硬核', col: '#ff9a6b', hp: 1.22, spd: 1.07, spawn: 0.82, xp: 0.88, hpGrow: 85,  invuln: 1.00, score: 1.45 },
};
const DIFF_HINT = {
  casual: '敌人更弱 · 刷怪更慢 · 经验 +25% · 得分 ×0.6',
  normal: '标准数值 · 得分 ×1.0',
  hard: '敌人更强更密 · 经验 -12% · 得分 ×1.45',
};
let diffKey = 'normal', diff = DIFFS.normal;
function diffLabel(k) { return DIFFS[k] ? DIFFS[k].name : '—'; }
function applyDiff(k) {
  if (!DIFFS[k]) k = 'normal';
  diffKey = k; diff = DIFFS[k];
  for (const b of document.querySelectorAll('.diffbtn')) {
    b.classList.toggle('on', b.dataset && b.dataset.d === k);
  }
  const d = $('#diffDesc');
  if (d) d.textContent = DIFF_HINT[k];
  try { localStorage.setItem(DKEY, k); } catch (e) {}
}

/* ---------- 小英雄（商店解锁，出战角色） ---------- */
const HERO_KEY = 'pixelDash.hero.v1';
const HERO_OWN_KEY = 'pixelDash.heroes.v1';
const HEROES = [
  { id: 'scout',  name: '小勇',   price: 0,   col: '#63d9ff', tag: '均衡',
    hp: 8,  speed: 0,   dashDamage: 0,  dashRadius: 0, dashCharges: 0, rerolls: 0, skill: 'none',
    desc: '标准身板：冲刺伤害与充能都居中，第一次冒险就从这里开始。' },
  { id: 'guanyu', name: '关羽',   price: 600, col: '#ff6b7a', tag: '斩击',
    hp: 7,  speed: 2,   dashDamage: 2,  dashRadius: 2, dashCharges: 0, rerolls: 0, skill: 'slash',
    desc: '冲刺结束挥出一圈刀光，额外斩击周围敌人；血少一点，斩得狠一点。' },
  { id: 'truck',  name: '泥头车', price: 450, col: '#ffb15c', tag: '重装',
    hp: 11, speed: -14, dashDamage: 3,  dashRadius: 5, dashCharges: -1, rerolls: 0, skill: 'crush',
    desc: '血厚、撞得狠、冲刺范围大，但跑得慢，充能少一次。' },
  { id: 'moto',   name: '摩托',   price: 800, col: '#9ef58a', tag: '极速',
    hp: 6,  speed: 18,  dashDamage: -1, dashRadius: -2, dashCharges: 1, rerolls: 0, skill: 'rush',
    desc: '跑得最快，多一次冲刺充能；身板很脆，撞一下就得记路。' },
  { id: 'diaper', name: '尿不湿', price: 300, col: '#ffd76a', tag: '幸运',
    hp: 10, speed: -4,  dashDamage: 0,  dashRadius: 0, dashCharges: 0, rerolls: 2, skill: 'lucky',
    desc: '又厚又软：血多、每局多 2 次换牌机会，冲刺偏弱但很能苟。' },
];

let heroKey = 'scout';
try {
  const hk = localStorage.getItem(HERO_KEY);
  if (hk && HEROES.some((h) => h.id === hk)) heroKey = hk;
} catch (e) {}

function currentHero() {
  return HEROES.find((h) => h.id === heroKey) || HEROES[0];
}
function heroOwned(id) {
  if (id === 'scout') return true;
  try {
    const own = JSON.parse(localStorage.getItem(HERO_OWN_KEY) || '[]');
    return Array.isArray(own) && own.includes(id);
  } catch (e) { return false; }
}
function equipHero(id) {
  if (!heroOwned(id)) return false;
  heroKey = id;
  try { localStorage.setItem(HERO_KEY, id); } catch (e) {}
  refreshLoadout();
  if (typeof renderShop === 'function') renderShop();
  return true;
}
/* 购买：直接扣累计金币；已拥有则切换出战 */
function buyHero(id) {
  const h = HEROES.find((x) => x.id === id);
  if (!h) return false;
  if (heroOwned(id)) return equipHero(id);
  const total = loadCoins();
  if (total < h.price) {
    toast('金币不足 · 还差 ' + (h.price - total) + ' 金币');
    blip(160, 0.1, 'square', 0.05, -40);
    return false;
  }
  saveCoins(total - h.price);
  const own = [];
  try { const v = JSON.parse(localStorage.getItem(HERO_OWN_KEY) || '[]'); if (Array.isArray(v)) own.push(...v); } catch (e) {}
  if (!own.includes(id)) own.push(id);
  try { localStorage.setItem(HERO_OWN_KEY, JSON.stringify(own)); } catch (e) {}
  equipHero(id);
  toast('解锁英雄 · ' + h.name + '（-' + h.price + ' 金币）', true);
  blip(880, 0.12, 'triangle', 0.07, 90);
  setTimeout(() => blip(1180, 0.14, 'triangle', 0.06, 70), 120);
  return true;
}

/* ---------- 地图 / 地形 ---------- */
const MAP_KEY = 'pixelDash.map.v1';
const MAPS = {
  plain: { id: 'plain', name: '苔原', tag: '标准', col: '#7dffb0',
    desc: '没有额外地形，最稳的练习场，冲刺距离就是你的安全线。',
    playerSpd: 1, enemySpd: 1, rocks: 0, ice: 0, meteor: 0, snow: 0 },
  snow:  { id: 'snow',  name: '雪原', tag: '减速', col: '#8fd8ff',
    desc: '风雪压低移动速度；冰面打滑、岩石挡路，冲刺是唯一的快路。',
    playerSpd: 0.86, enemySpd: 0.92, rocks: 3, ice: 5, meteor: 0, snow: 1 },
  lava:  { id: 'lava',  name: '熔岩', tag: '陨石', col: '#ff8a4a',
    desc: '陨石持续坠落，踩进熔岩会烫伤；敌人更快，但你的速度不受影响。',
    playerSpd: 1, enemySpd: 1.05, rocks: 3, ice: 0, meteor: 8, snow: 0 },
};
let mapKey = 'plain';
try {
  const mk = localStorage.getItem(MAP_KEY);
  if (mk && MAPS[mk]) mapKey = mk;
} catch (e) {}
let map = MAPS[mapKey];

function applyMap(k) {
  if (!MAPS[k]) k = 'plain';
  mapKey = k; map = MAPS[k];
  try { localStorage.setItem(MAP_KEY, k); } catch (e) {}
  refreshLoadout();
  if (typeof renderShop === 'function') renderShop();
}

/* 生成静态地形：避开出生点和屏幕边缘，保证第一眼能看清 */
function generateTerrain() {
  terrain = { rocks: [], ice: [] };
  const rng = lcg((Math.floor(Math.random() * 1e9) + 1) % 2147483647);
  const clearOfSpawn = (x, y) => Math.hypot(x - W / 2, y - H / 2) > 48;
  for (let i = 0; i < map.rocks; i++) {
    for (let tries = 0; tries < 12; tries++) {
      const x = 16 + Math.floor(rng() * (W - 32)), y = 16 + Math.floor(rng() * (H - 32));
      if (!clearOfSpawn(x, y)) continue;
      terrain.rocks.push({ x, y, r: 5 + Math.floor(rng() * 4) });
      break;
    }
  }
  for (let i = 0; i < map.ice; i++) {
    for (let tries = 0; tries < 12; tries++) {
      const x = 20 + Math.floor(rng() * (W - 40)), y = 20 + Math.floor(rng() * (H - 40));
      if (!clearOfSpawn(x, y)) continue;
      terrain.ice.push({ x, y, r: 9 + Math.floor(rng() * 8) });
      break;
    }
  }
}
function onIceAt(x, y) {
  for (const i of terrain.ice) if (Math.hypot(x - i.x, y - i.y) < i.r) return true;
  return false;
}
/* 岩石阻挡：把玩家推出圆外，不做寻路，避免影响敌人围攻 */
function resolveRocks(p) {
  for (const r of terrain.rocks) {
    const dx = p.x - r.x, dy = p.y - r.y;
    const d = Math.hypot(dx, dy) || 1;
    const min = r.r + p.r;
    if (d < min) {
      p.x = r.x + (dx / d) * min;
      p.y = r.y + (dy / d) * min;
    }
  }
}

/* ---------- 敌人类型 ---------- */
const ETYPES = {
  chaser:  { hp: 3,  speed: 22, r: 4,  dmg: 1, xp: 1,  pts: 10,  color: '#e2565f', edge: '#7e2a35' },
  fast:    { hp: 2,  speed: 40, r: 3,  dmg: 1, xp: 1,  pts: 12,  color: '#f0933f', edge: '#94531c' },
  shooter: { hp: 5,  speed: 20, r: 4,  dmg: 1, xp: 2,  pts: 20,  color: '#5ccbe8', edge: '#24708f' },
  tank:    { hp: 14, speed: 15, r: 7,  dmg: 1, xp: 3,  pts: 35,  color: '#a97ed8', edge: '#5a3a80' },
  poisoner:{ hp: 6,  speed: 18, r: 4,  dmg: 1, xp: 2,  pts: 22,  color: '#7ddc7d', edge: '#2f6b34' },
  frost:   { hp: 7,  speed: 17, r: 4,  dmg: 1, xp: 2,  pts: 24,  color: '#8fd8ff', edge: '#2f5f86' },
  bomber:  { hp: 4,  speed: 30, r: 4,  dmg: 2, xp: 0,  pts: 18,  color: '#ffb15c', edge: '#8c4a14' },
  boss:    { hp: 70, speed: 13, r: 11, dmg: 2, xp: 20, pts: 200, color: '#ffe066', edge: '#c9a227' },
};

/* ---------- 精英词缀（无尽/后期杂兵变异） ---------- */
const AFFIX = {
  shield: { col: '#7ef0ff' },   // 护盾：生命 +60%，冲刺伤害减半
  split:  { col: '#c08cff' },   // 分裂：死亡时裂成 2 只小兵
  boom:   { col: '#ffa53d' },   // 爆裂：死亡时原地爆炸
  charge: { col: '#ff5d6c' },   // 冲锋：周期性突进
  corrupt:{ col: '#9ef58a' },   // 腐蚀：光环内封锁吸血
};
const AFFIX_IDS = ['shield', 'split', 'boom', 'charge', 'corrupt'];
/* BOSS 分代外观：颜色逐代加深，逐步长出肩甲、尖角、核心 */
const BOSS_SKIN = [
  { name: '熔金卫士', col: '#ffe066', edge: '#c9a227', spikes: 3, pauldron: false, horn: false, core: false },
  { name: '赤铜重甲', col: '#ffce4a', edge: '#d99b2c', spikes: 3, pauldron: true,  horn: false, core: false },
  { name: '焦土角斗', col: '#ffab3d', edge: '#d97c22', spikes: 5, pauldron: true,  horn: true,  core: false },
  { name: '终焉赤王', col: '#ff6a3d', edge: '#c73f1f', spikes: 5, pauldron: true,  horn: true,  core: true },
];
function bossName(gen) {
  const g = Math.min(Math.max(gen || 1, 1), BOSS_SKIN.length);
  return BOSS_SKIN[g - 1].name + (gen > BOSS_SKIN.length ? ' · 第 ' + gen + ' 代' : '');
}
const eliteChance = () => clamp((time - 45) / 900, 0, 0.24);
const threatTier = () => Math.floor(Math.max(0, time - 120) / 120);

/* 怪物图鉴：见过一次即点亮，描述对应实际行为 */
const CODEX = [
  { id: 'chaser',  name: '围攻者', skill: '蜂拥 · 直线追击', pts: 10, icon: { type: 'chaser' },
    desc: '数量最多的杂兵。没有任何花样，只是从四面八方匀速压过来，靠人多把你逼进死角。' },
  { id: 'fast',    name: '疾行者', skill: '间歇突进 ×2.3', pts: 12, icon: { type: 'fast' },
    desc: '每 1.7 秒突然加速到 2.3 倍，直冲你当时的位置。冲刺后容易贴脸，注意它起速的那一下。' },
  { id: 'shooter', name: '射手',   skill: '风筝 · 远程点射', pts: 20, icon: { type: 'shooter' },
    desc: '保持 48~78 的距离绕着你转，每 2.1 秒朝你射出一发子弹。只会躲，不会撞，先处理它。' },
  { id: 'tank',    name: '重装',   skill: '厚甲 · 慢速推进', pts: 35, icon: { type: 'tank' },
    desc: '14 点基础血量的紫色大块头，移动慢但硬。一次冲刺打不死，要连续下注或靠升级词条堆伤害。' },
  { id: 'el_shield', name: '装甲者', skill: '护盾 · 受伤减半', pts: 25, icon: { type: 'chaser', affix: 'shield' },
    desc: '生命 +60%，受到的冲刺伤害减半，青色描边。任何招式打它都只有一半效果，优先用高伤词条集中处理。' },
  { id: 'el_split',  name: '分裂体', skill: '裂生 · 死亡分裂', pts: 25, icon: { type: 'chaser', affix: 'split' },
    desc: '紫色描边。击杀后会裂成 2 只高速小兵，别指望一冲刺清场，注意余量。' },
  { id: 'el_boom',   name: '殉爆者', skill: '爆裂 · 死亡爆炸', pts: 25, icon: { type: 'chaser', affix: 'boom' },
    desc: '橙色描边。死亡时原地爆炸，贴身击杀会掉 1 点血；拉开距离再引爆更安全。' },
  { id: 'el_charge', name: '突进者', skill: '冲锋 · 周期突进 ×2.6', pts: 25, icon: { type: 'chaser', affix: 'charge' },
    desc: '红色描边。每 2.2 秒突进一次，速度 2.6 倍；冲锋前描边会变白并冒出「!」，那就是闪避信号。' },
  { id: 'poisoner', name: '毒囊', skill: '毒球 · 死亡毒雾', pts: 22, icon: { type: 'poisoner' },
    desc: '绿色毒囊怪。保持距离朝你吐毒球，命中后每秒掉 1 点血且无法吸血；死亡时原地留下一片毒雾，几秒内别踩进去。' },
  { id: 'frost', name: '霜核', skill: '冰锥 · 减速冰冻', pts: 24, icon: { type: 'frost' },
    desc: '冰蓝色远程怪。冰锥命中先减速 50%，再中一发会被冻住 0.6 秒；冰冻期间无法移动，但冲刺可以震碎冰冻。' },
  { id: 'bomber', name: '殉爆虫', skill: '自爆 · 贴身炸', pts: 18, icon: { type: 'bomber' },
    desc: '橙色小虫，会直接冲到你身边点燃引信，0.6 秒后自爆造成 2 点伤害。自爆不会给分，看到白边加「!」就赶紧冲刺离开。' },
  { id: 'el_corrupt', name: '腐蚀者', skill: '腐蚀光环 · 封锁吸血', pts: 25, icon: { type: 'chaser', affix: 'corrupt' },
    desc: '绿色描边。身边 30 范围会持续封锁吸血并附加中毒，专门克制嗜血流；优先拉开距离或用高伤冲刺斩杀。' },
  { id: 'boss1', name: '熔金卫士', skill: '环形弹幕', pts: 200, icon: { type: 'boss', gen: 1 },
    desc: '第 1 代守关者，通体明黄。只有环形弹幕，血量一半进入狂暴，出手更快。' },
  { id: 'boss2', name: '赤铜重甲', skill: '召唤 + 散射 + 毒池', pts: 200, icon: { type: 'boss', gen: 2 },
    desc: '第 2 代，金黄并长出两侧肩甲。在环形弹幕之外加入召唤、三连散射与毒池；召唤前地面会先亮起预警圈。' },
  { id: 'boss3', name: '焦土角斗', skill: '冲锋 + 扇形 + 冰锥', pts: 200, icon: { type: 'boss', gen: 3 },
    desc: '第 3 代，橙色并长出四支尖角。新增冲锋、七发扇形弹幕与冰锥，冰锥会减速并可能冻住你。' },
  { id: 'boss4', name: '终焉赤王', skill: '全招式 + 核心', pts: 200, icon: { type: 'boss', gen: 4 },
    desc: '第 4 代及以后，赤红并亮起胸口核心。全部招式轮转，弹幕伤害提高，每多一代血量 +30%；击杀后清空全场小兵。' },
];

/* ---------- 基础属性 ---------- */
function baseStats() {
  return {
    speed: 62,
    dashDamage: 3,
    dashRadius: 12,
    dashTime: 0.17,
    dashSpeed: 320,
    dashCd: 1.0,
    dashCharges: 2,
    dashExplode: 0,
    trailTime: 0,
    magnet: 45,
    autoRate: 0,
    auraR: 0,
    auraDps: 0,
    healKills: 0,
    maxHpBonus: 0,
    crit: 0,
    xpMul: 1,
    scoreMul: 1,
    invulnBonus: 0,
    slowR: 0,
    slowFactor: 1,
    rage: 0,
    shieldMax: 0,
    shieldCd: 0,
  };
}

function makePlayer() {
  const hero = currentHero();
  const st = baseStats();
  st.speed += hero.speed;
  st.dashDamage += hero.dashDamage;
  st.dashRadius += hero.dashRadius;
  st.dashCharges += hero.dashCharges;
  return {
    hero: hero.id,
    heroSkill: hero.skill,
    heroCol: hero.col,
    heroHp: hero.hp,
    heroRerolls: hero.rerolls,
    x: W / 2, y: H / 2,
    dirx: 1, diry: 0,
    hp: hero.hp, maxHp: hero.hp, r: 5,
    invuln: 0, flash: 0,
    level: 1, xp: 0, xpNext: 4,
    dashCharges: Math.max(1, st.dashCharges), dashRefill: 0,
    dashT: 0, dashDx: 1, dashDy: 0,
    hitIds: new Set(),
    dashKillCount: 0,
    shield: 0, shieldT: 0,
    autoT: 0, trailTick: 0,
    healCd: 0, healBlock: 0,
    poisonT: 0, poisonTick: 0,
    slowT: 0, slowMul: 1,
    freezeT: 0, lavaTick: 0,
    upg: {}, stats: st,
  };
}

/* ---------- 升级池 ---------- */
const UPGRADES = [
  /* ---- 白（常见）：基础数值 ---- */
  { id: 'fist',    name: '冲拳',      rar: 1, max: 5, desc: '冲刺伤害 +2',                  apply: (s) => { s.dashDamage += 2; } },
  { id: 'engine',  name: '冷却核心',  rar: 1, max: 4, desc: '冲刺冷却 -0.18 秒',            apply: (s) => { s.dashCd = Math.max(0.4, s.dashCd - 0.18); } },
  { id: 'boot',    name: '轻装',      rar: 1, max: 4, desc: '移动速度 +7',                  apply: (s) => { s.speed += 7; } },
  { id: 'magnet',  name: '磁力核心',  rar: 1, max: 3, desc: '经验吸附范围 +20',             apply: (s) => { s.magnet += 20; } },
  { id: 'vital',   name: '强心',      rar: 1, max: 4, desc: '生命上限 +1，并回复 2 点',      apply: (s, p) => { s.maxHpBonus += 1; p.hp += 2; } },
  { id: 'wide',    name: '巨力冲撞',  rar: 1, max: 3, desc: '冲刺判定范围 +3',              apply: (s) => { s.dashRadius += 3; } },
  { id: 'greed',   name: '经验汲取',  rar: 1, max: 3, desc: '获得经验 +15%',                apply: (s) => { s.xpMul += 0.15; } },

  /* ---- 紫（进阶）：改变输出方式 ---- */
  { id: 'sprint',  name: '疾影',      rar: 2, max: 4, desc: '冲刺距离与速度提升',            apply: (s) => { s.dashSpeed += 70; s.dashTime += 0.015; } },
  { id: 'blast',   name: '爆震',      rar: 2, max: 4, desc: '冲刺结束时引发爆炸',            apply: (s) => { s.dashExplode += 14; } },
  { id: 'fire',    name: '火焰尾迹',  rar: 2, max: 4, desc: '冲刺沿途留下灼烧火焰',          apply: (s) => { s.trailTime += 0.7; } },
  { id: 'turret',  name: '自动炮台',  rar: 2, max: 5, desc: '自动射速 +0.8 发/秒',           apply: (s) => { s.autoRate += 0.8; } },
  { id: 'aura',    name: '脉冲领域',  rar: 2, max: 5, desc: '持续伤害光环，范围+16、伤害+2.4', apply: (s) => { s.auraR += 16; s.auraDps += 2.4; } },
  { id: 'phase',   name: '残影护体',  rar: 2, max: 3, desc: '冲刺后的无敌延长 0.12 秒',      apply: (s) => { s.invulnBonus += 0.12; } },
  { id: 'bounty',  name: '赏金猎人',  rar: 2, max: 3, desc: '击杀得分 +25%',                apply: (s) => { s.scoreMul += 0.25; } },
  { id: 'crit',    name: '致命一击',  rar: 2, max: 3, desc: '冲刺 15% 概率造成双倍伤害',     apply: (s) => { s.crit += 0.15; } },
  { id: 'slow',    name: '缓速力场',  rar: 2, max: 3, desc: '身边 40 内敌人减速 30%，范围随级扩大', apply: (s) => { s.slowR = s.slowR ? s.slowR + 12 : 40; s.slowFactor = 0.7; } },

  /* ---- 金（稀有）：构筑支点 ---- */
  { id: 'battery', name: '备用储能',  rar: 3, max: 3, desc: '冲刺充能次数 +1',              apply: (s) => { s.dashCharges += 1; } },
  { id: 'leech',   name: '嗜血',      rar: 3, max: 3, desc: '冲刺击杀攒够数量回 1 血（内部 1.5 秒冷却）', apply: (s) => { s.healKills = s.healKills === 0 ? 6 : Math.max(2, s.healKills - 1); } },
  { id: 'rage',    name: '背水一战',  rar: 3, max: 2, desc: '生命低于 50% 时冲刺伤害 +50%',  apply: (s) => { s.rage += 0.5; } },
  { id: 'ward',    name: '守护结界',  rar: 3, max: 2, desc: '获得 1 层护盾，可挡一次伤害（冷却 12 秒）', apply: (s) => { s.shieldMax += 1; s.shieldCd = s.shieldCd === 0 ? 12 : Math.max(6, s.shieldCd - 3); } },
];

/* 稀有度权重：白 6 : 紫 3 : 金 1 */
const RAR_W = { 1: 6, 2: 3, 3: 1 };

/* 按权重不放回抽 n 张 */
function rollOptions(pool, n) {
  const items = pool.map((u) => ({ u, w: RAR_W[u.rar] || 1 }));
  const out = [];
  while (out.length < n && items.length) {
    let total = 0;
    for (const it of items) total += it.w;
    let r = Math.random() * total, idx = 0;
    for (; idx < items.length - 1; idx++) { r -= items[idx].w; if (r <= 0) break; }
    out.push(items[idx].u);
    items.splice(idx, 1);
  }
  return out;
}

