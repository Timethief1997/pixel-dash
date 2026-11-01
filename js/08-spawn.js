/* PIXEL DASH · 刷怪导演 / 无尽事件 —— 由 index.html 拆分，按顺序加载 */
'use strict';

/* ============================================================
   刷怪导演
   ============================================================ */
function pickType() {
  const pool = [['chaser', 1]];
  if (time > 15) pool.push(['fast', 0.8]);
  if (time > 35) pool.push(['shooter', 0.5]);
  if (time > 50) pool.push(['poisoner', 0.36]);
  if (time > 55) pool.push(['tank', 0.35]);
  if (time > 70) pool.push(['frost', 0.3]);
  if (time > 95) pool.push(['bomber', 0.3]);
  let total = 0;
  for (const p of pool) total += p[1];
  let r = rand(0, total);
  for (const p of pool) {
    r -= p[1];
    if (r <= 0) return p[0];
  }
  return 'chaser';
}

/* BOSS 召唤预警：圈到时间才真正生成小怪 */
function updateMarks(dt) {
  if (!marks.length) return;
  for (let i = marks.length - 1; i >= 0; i--) {
    const m = marks[i];
    m.t -= dt;
    if (m.t > 0) continue;
    if (enemies.length < 155) {
      spawnEnemy('chaser', m.x, m.y);
      burst(m.x, m.y, '#ff9a6b', 8, 48);
      effects.push({ x: m.x, y: m.y, r: 9, life: 0.22, max: 0.22, color: '#ff9a6b' });
    }
    marks.splice(i, 1);
  }
}

function updateSpawn(dt) {
  if (!endless && time >= WIN_TIME) return;

  const tier = threatTier();
  if (tier > lastTier) {
    lastTier = tier;
    toast('威胁等级 ' + tier + ' · 敌人强化', true);
    blip(70, 0.24, 'sawtooth', 0.06, -25);
  }

  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawnTimer = Math.max(0.34, 1.9 - time * 0.011) * diff.spawn;
    let count = Math.min(6, 1 + Math.floor(time / 75));
    if (enemies.length > 150) count = 0;
    for (let i = 0; i < count; i++) spawnAtEdge(pickType());
  }

  if (time >= nextBoss) {
    nextBoss += 90;
    bossGen += 1;
    spawnAtEdge('boss');
    shake = Math.max(shake, 5);
    toast('BOSS · ' + bossName(bossGen), true);
    blip(110, 0.35, 'sawtooth', 0.07, -60);
  }
}

/* ============================================================
   无尽模式事件：每 75 秒触发一次，增加变数
   ============================================================ */
function spawnForcedElite(type, hpMul) {
  spawnAtEdge(type);
  const e = enemies[enemies.length - 1];
  if (!e) return;
  e.affix = pick(AFFIX_IDS);
  if (e.affix === 'shield') { e.hp = Math.round(e.hp * 1.6); e.maxHp = e.hp; }
  if (hpMul) { e.hp = Math.round(e.hp * hpMul); e.maxHp = e.hp; }
}

function runEndlessEvent() {
  const ev = pick(['elite', 'fog', 'coins', 'dual', 'frenzy']);
  if (ev === 'elite') {
    for (let i = 0; i < 6; i++) spawnForcedElite(pick(['chaser', 'fast', 'poisoner', 'frost']), 1.15);
    toast('事件 · 精英潮', true);
    blip(110, 0.24, 'sawtooth', 0.06, -40);
  } else if (ev === 'fog') {
    for (let i = 0; i < 5; i++) {
      hazards.push({
        x: rand(18, W - 18), y: rand(18, H - 18),
        r: rand(18, 30), life: rand(7, 11), max: 10, poison: true,
      });
    }
    toast('事件 · 毒雾弥漫', true);
    blip(200, 0.22, 'triangle', 0.045, -70);
  } else if (ev === 'coins') {
    for (let i = 0; i < 12; i++) {
      drops.push({
        x: rand(10, W - 10), y: rand(10, H - 10),
        t: rand(0, 3), dead: false, kind: 'coin', val: 4,
      });
    }
    toast('事件 · 金币雨', true);
    blip(1040, 0.1, 'triangle', 0.05, 90);
  } else if (ev === 'dual') {
    if (bossGen < 4) bossGen = 4;
    spawnAtEdge('boss');
    for (const e of enemies) {
      if (e.type !== 'boss' || e.dead) continue;
      e.maxHp = Math.round(e.maxHp * 0.8);
      e.hp = Math.min(e.hp, e.maxHp);
    }
    shake = Math.max(shake, 8);
    toast('事件 · 双 BOSS 降临', true);
    blip(90, 0.3, 'sawtooth', 0.08, -60);
  } else {
    frenzyT = 12;
    toast('事件 · 狂暴：敌人加速 12 秒', true);
    blip(520, 0.2, 'square', 0.06, 120);
  }
}

function updateEvents(dt) {
  if (!endless) return;
  if (time >= nextEvent) {
    nextEvent = time + 75;
    runEndlessEvent();
  }
}

/* 主更新 */
function update(dt) {
  if (hitSnd > 0) hitSnd -= dt;
  if (frenzyT > 0) frenzyT -= dt;
  time += dt;
  if (!endless && time >= WIN_TIME) { endGame(true); return; }
  updatePlayer(dt);
  if (state !== 'playing') return;
  achTrack(dt);
  updateTutorial(dt);

  updateEnemies(dt);
  if (state !== 'playing') return;

  updateBullets(dt);
  updateEBullets(dt);
  if (state !== 'playing') return;

  updateZones(dt);
  updateHazards(dt);
  updateOrbs(dt);
  if (state !== 'playing') return;
  updateDrops(dt);

  // 分裂词缀的产物：伤害结算结束后再入场，避免连锁在同一帧里结算
  if (splitQueue.length) {
    let kids = 0;
    for (const q of enemies) if (!q.dead && q.splitKid) kids++;
    for (const s of splitQueue) {
      // 分裂小兵有同屏上限，避免一堆分裂精英把画面撑爆
      if (kids >= SPLIT_MAX || enemies.length >= 150) break;
      spawnEnemy('chaser', clamp(s.x, 6, W - 6), clamp(s.y, 6, H - 6), true);
      const c = enemies[enemies.length - 1];
      c.hp = 1; c.maxHp = 1; c.r = 2.5; c.speed *= 1.3; c.affix = null; c.splitKid = true; c.pts = 2;
      kids++;
    }
    splitQueue.length = 0;
  }

  updateMarks(dt);
  updateParticles(dt);
  updateSpawn(dt);
  updateEvents(dt);

  enemies = enemies.filter((e) => !e.dead);

  if (!endless && time >= WIN_TIME) endGame(true);
}

