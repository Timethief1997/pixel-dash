/* PIXEL DASH · 冲刺 / 状态 / 玩家 / 伤害 / 敌人 / 经验 —— 由 index.html 拆分，按顺序加载 */
'use strict';

/* ============================================================
   冲刺（核心机制）
   ============================================================ */
let dashBuffer = 0;   // 冲刺输入缓冲：冲刺中按下的一次，落地后自动接上
/* 供键盘 / 冲刺键调用：冲刺进行中则缓存输入，避免「按早了没反应」 */
function queueDash() {
  const p = player;
  if (state !== 'playing' || !p || paused) return;
  if (p.dashT > 0) { dashBuffer = 0.22; return; }
  tryDash();
}

function tryDash() {
  const p = player;
  if (state !== 'playing' || !p || paused) return;
  if (p.dashT > 0) return;

  /* 回旋形态：冲刺结束后 0.45 秒内再按，沿原路折返且不耗充能 */
  if (p.stats.dashReturn && p.returnT > 0) {
    p.returnT = 0;
    p.returnBack = true;
    p.freezeT = 0;
    p.dashT = p.stats.dashTime;
    p.invuln = Math.max(p.invuln, p.stats.dashTime + 0.2 + p.stats.invulnBonus);
    p.dashDx = -p.returnDx;
    p.dashDy = -p.returnDy;
    p.hitIds.clear();
    burst(p.x, p.y, '#c08cff', 7, 50);
    blip(540, 0.11, 'sawtooth', 0.045, -300);
    if (tutorial && tutorial.active && tutorial.step === 1) tutAdvance();
    return;
  }

  if (p.dashCharges <= 0) return;

  let dx = 0, dy = 0;
  if (keys['a'] || keys['arrowleft']) dx -= 1;
  if (keys['d'] || keys['arrowright']) dx += 1;
  if (keys['w'] || keys['arrowup']) dy -= 1;
  if (keys['s'] || keys['arrowdown']) dy += 1;

  if (dx || dy) {
    const m = Math.hypot(dx, dy);
    p.dirx = dx / m; p.diry = dy / m;
  } else {
    dx = p.dirx; dy = p.diry;
  }

  p.dashCharges -= 1;
  if (achRun) achRun.dashes += 1;
  if (p.freezeT > 0) {   // 冲刺可以震碎冰冻
    burst(p.x, p.y, '#bfe8ff', 14, 60);
    blip(980, 0.09, 'triangle', 0.05, -260);
  }
  p.freezeT = 0;
  p.returnBack = false;
  p.returnT = 0;
  p.dashT = p.stats.dashTime;
  p.slipVx = 0; p.slipVy = 0;   // 冲刺会清掉打滑惯性，落地不飘
  p.invuln = Math.max(p.invuln, p.stats.dashTime + 0.2 + p.stats.invulnBonus);
  /* 忍者 · 潜行：落地后额外 0.25 秒无敌，冲刺期间还能穿过岩石 */
  if (p.heroSkill === 'blink') p.invuln += 0.25;
  p.dashDx = dx; p.dashDy = dy;
  p.emberTick = 0;
  p.hitIds.clear();

  burst(p.x, p.y, '#63d9ff', 7, 50);
  blip(420, 0.11, 'sawtooth', 0.045, -300);
  blip(180, 0.06, 'square', 0.03, 90);
  if (tutorial && tutorial.active && tutorial.step === 1) tutAdvance();
}

/* ============================================================
   状态效果：毒 / 封锁吸血 / 减速 / 冰冻
   ============================================================ */
function applyPoison(dur) {
  const p = player;
  if (!p) return;
  if (p.poisonT <= 0.2 && achRun) achRun.poisons += 1;
  p.poisonT = Math.max(p.poisonT, dur);
  applyHealBlock(dur);
}
function applyHealBlock(dur) {
  if (!player) return;
  player.healBlock = Math.max(player.healBlock, dur);
}
function applySlow(dur, mul) {
  const p = player;
  if (!p) return;
  p.slowT = Math.max(p.slowT, dur);
  p.slowMul = Math.min(p.slowMul, mul || 0.5);
}
function applyFreeze(dur) {
  const p = player;
  if (!p) return;
  if (p.freezeT <= 0 && achRun) achRun.freezes += 1;
  p.freezeT = Math.max(p.freezeT, dur);
}
/* 冰冻表现：碎冰、音效、飘字，让「被冻住」一眼就能看见 */
function freezePlayer(dur) {
  applyFreeze(dur);
  burst(player.x, player.y, '#bfe8ff', 12, 58);
  burst(player.x, player.y, '#eaf9ff', 6, 30);
  effects.push({ x: player.x, y: player.y, r: 16, life: 0.35, max: 0.35, color: '#bfe8ff' });
  texts.push({ x: player.x, y: player.y - 16, vy: -14, life: 0.9, text: '冰冻!', color: '#eaf9ff' });
  blip(1180, 0.14, 'triangle', 0.055, -520);
  shake = Math.max(shake, 3);
}

/* ============================================================
   新机制：涨潮 / 传送台 / 守护水晶
   ============================================================ */
/* 涨潮：安全圈从中场向外收，圈外每 tideBurn 秒流失 1 点体力（敌人不受影响） */
function updateTide(dt) {
  const p = player;
  if (!p || !tideR) return;
  if (tideR > TIDE_R1) tideR = Math.max(TIDE_R1, tideR - (TIDE_R0 - TIDE_R1) * dt / TIDE_SHRINK);
  if (p.tideTick > 0) p.tideTick -= dt;
  if (Math.hypot(p.x - W / 2, p.y - H / 2) <= tideR || p.tideTick > 0) return;

  p.tideTick = (campaign && curLevel && curLevel.tideBurn) || 1.2;
  p.hp -= 1;
  p.invuln = Math.max(p.invuln, 0.4);
  texts.push({ x: p.x, y: p.y - 10, vy: -18, life: 0.7, text: '-1 潮水', color: '#4fe3d0' });
  burst(p.x, p.y, '#4fe3d0', 8, 62);
  blip(210, 0.1, 'triangle', 0.05, -40);
  shake = Math.max(shake, 3);
  if (p.hp <= 0) { p.hp = 0; endGame(false); }
}

/* 传送台：踩上任意一端立刻送到另一端，0.8 秒冷却防止两段来回抖 */
function updatePortals(dt) {
  if (portalCd > 0) portalCd -= dt;
  const p = player;
  if (!p || !portals.length || portalCd > 0) return;
  for (let i = 0; i < portals.length; i++) {
    const q = portals[i];
    if (Math.hypot(p.x - q.x, p.y - q.y) > q.r) continue;
    const to = portals[1 - i];
    effects.push({ x: q.x, y: q.y, r: q.r + 4, life: 0.3, max: 0.3, color: '#ff6bd6' });
    burst(q.x, q.y, '#ff6bd6', 10, 70);
    p.x = to.x; p.y = to.y;
    p.invuln = Math.max(p.invuln, 0.35);
    effects.push({ x: to.x, y: to.y, r: to.r + 4, life: 0.3, max: 0.3, color: '#7ef0ff' });
    burst(to.x, to.y, '#7ef0ff', 12, 70);
    texts.push({ x: to.x, y: to.y - 14, vy: -16, life: 0.7, text: '传送!', color: '#ff6bd6' });
    blip(1080, 0.12, 'triangle', 0.05, -200);
    blip(420, 0.1, 'sine', 0.04, 200);
    shake = Math.max(shake, 2.5);
    portalCd = 0.8;
    return;
  }
}

/* 守护水晶：受伤后每 2.5 秒自愈 1 点，凿穿即判负 */
function updateCore(dt) {
  if (!core) return;
  if (core.flash > 0) core.flash -= dt;
  if (core.hp <= 0) return;
  if (core.hp >= core.maxHp) { core.healT = 0; return; }
  core.healT += dt;
  if (core.healT >= 2.5) {
    core.healT = 0;
    core.hp += 1;
    effects.push({ x: core.x, y: core.y, r: core.r + 5, life: 0.28, max: 0.28, color: '#7ef0ff' });
    texts.push({ x: core.x, y: core.y - 14, vy: -16, life: 0.6, text: '水晶 +1', color: '#7ef0ff' });
    blip(880, 0.06, 'triangle', 0.03, 160);
  }
}

/* ============================================================
   更新：玩家
   ============================================================ */
function updatePlayer(dt) {
  const p = player;
  if (p.flash > 0) p.flash -= dt;
  if (p.invuln > 0) p.invuln -= dt;
  if (p.healCd > 0) p.healCd -= dt;
  if (p.healBlock > 0) p.healBlock -= dt;
  if (p.slowT > 0) {
    p.slowT -= dt;
    if (p.slowT <= 0) p.slowMul = 1;
  }
  if (p.freezeT > 0) p.freezeT -= dt;
  if (p.lavaTick > 0) p.lavaTick -= dt;
  if (p.returnT > 0) p.returnT -= dt;

  /* 新机制：涨潮 / 传送台 / 守护水晶 */
  updateTide(dt);
  if (state !== 'playing') return;
  updatePortals(dt);
  updateCore(dt);

  // 中毒：只封锁吸血，不再持续掉血（第五关毒池压力过大，改为纯克制吸血）
  if (p.poisonT > 0) p.poisonT -= dt;

  // 守护结界：护盾按冷却恢复
  if (p.stats.shieldMax > 0 && p.shield < p.stats.shieldMax) {
    p.shieldT += dt;
    if (p.shieldT >= p.stats.shieldCd) {
      p.shieldT = 0;
      p.shield += 1;
      blip(700, 0.07, 'triangle', 0.03, 140);
    }
  }

  /* 盾卫 · 守护：每 7 秒自动补 1 层护盾，最多 2 层 */
  if (p.heroSkill === 'guard') {
    if (p.shield < 2) {
      p.guardT += dt;
      if (p.guardT >= 7) {
        p.guardT = 0;
        p.shield += 1;
        p.shieldT = 0;
        burst(p.x, p.y, '#8fd6b0', 8, 44);
        effects.push({ x: p.x, y: p.y, r: 11, life: 0.26, max: 0.26, color: '#8fd6b0' });
        texts.push({ x: p.x, y: p.y - 14, vy: -16, life: 0.7, text: '护盾 +1', color: '#8fd6b0' });
        blip(760, 0.08, 'triangle', 0.04, 180);
      }
    } else {
      p.guardT = 0;
    }
  }

  // 充能恢复
  if (p.dashCharges < p.stats.dashCharges) {
    p.dashRefill += dt;
    if (p.dashRefill >= p.stats.dashCd) {
      p.dashRefill = 0;
      p.dashCharges += 1;
      blip(660, 0.04, 'triangle', 0.03, 160);
    }
  } else {
    p.dashRefill = 0;
  }

  let ix = 0, iy = 0;
  if (keys['a'] || keys['arrowleft']) ix -= 1;
  if (keys['d'] || keys['arrowright']) ix += 1;
  if (keys['w'] || keys['arrowup']) iy -= 1;
  if (keys['s'] || keys['arrowdown']) iy += 1;

  const wasDashing = p.dashT > 0;

  if (wasDashing) {
    p.dashT -= dt;
    // 弧光形态：冲刺方向随时间持续偏转，形成弧线
    if (p.stats.dashTurn > 0) {
      const rot = p.stats.dashTurn * dt;
      const c = Math.cos(rot), s = Math.sin(rot);
      const nx = p.dashDx * c - p.dashDy * s;
      const ny = p.dashDx * s + p.dashDy * c;
      p.dashDx = nx; p.dashDy = ny;
    }
    p.x += p.dashDx * p.stats.dashSpeed * dt;
    p.y += p.dashDy * p.stats.dashSpeed * dt;

    // 火焰尾迹
    if (p.stats.trailTime > 0) {
      p.trailTick -= dt;
      if (p.trailTick <= 0) {
        p.trailTick = 0.035;
        trails.push({ x: p.x, y: p.y, r: 6, life: p.stats.trailTime, max: p.stats.trailTime });
      }
    }
    // 铁匠 · 熔锻：冲刺路径自带灼烧余烬
    if (p.heroSkill === 'ember') {
      p.emberTick -= dt;
      if (p.emberTick <= 0) {
        p.emberTick = 0.06;
        trails.push({ x: p.x, y: p.y, r: 5, life: 0.55, max: 0.55 });
      }
    }

    // 霜语 · 冰霜：冲刺一路落下冰晶，把「冰系」的定位直接画出来
    if (p.heroSkill === 'chill') {
      p.frostTick -= dt;
      if (p.frostTick <= 0) {
        p.frostTick = 0.045;
        for (let i = 0; i < 2; i++) {
          particles.push({
            x: p.x + rand(-6, 6), y: p.y + rand(-5, 5),
            vx: rand(-10, 10), vy: rand(-26, -6),
            life: rand(0.35, 0.6), max: 0.6,
            color: i ? '#eaf9ff' : '#bfe8ff', size: 1,
          });
        }
      }
    }

    // 冲刺穿透伤害
    for (const e of enemies) {
      if (e.dead || p.hitIds.has(e.id)) continue;
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (d < e.r + p.stats.dashRadius) {
        p.hitIds.add(e.id);
        let dmg = p.stats.dashDamage * (p.returnBack ? 0.6 : 1);
        if (p.stats.rage > 0 && p.hp <= p.maxHp * 0.5) dmg *= (1 + p.stats.rage);
        let crit = false;
        if (p.stats.crit > 0 && Math.random() < p.stats.crit) { dmg *= 2; crit = true; }
        const killed = damageEnemy(e, dmg, p.x, p.y);
        if (crit) texts.push({ x: e.x, y: e.y - 9, vy: -22, life: 0.6, text: '暴击!', color: '#ffe066' });
        /* 霜语 · 冰霜：第一次命中冻慢，再命中同一只直接冰封 2 秒 */
        if (p.heroSkill === 'chill' && !killed && e.type !== 'boss') {
          if (e.freezeT > 0) {
            e.freezeT = Math.max(e.freezeT, 1.4);
          } else if (e.chillT > 0) {
            e.chillT = 0;
            e.freezeT = 2.0;
            burst(e.x, e.y, '#bfe8ff', 16, 62);
            burst(e.x, e.y, '#ffffff', 5, 26);
            effects.push({ x: e.x, y: e.y, r: 15, life: 0.34, max: 0.34, color: '#eaf9ff' });
            texts.push({ x: e.x, y: e.y - 10, vy: -16, life: 0.8, text: '冻结!', color: '#eaf9ff' });
            blip(1180, 0.12, 'triangle', 0.05, -420);
          } else {
            e.chillT = 3.5;
            burst(e.x, e.y, '#9fd8ff', 9, 46);
            effects.push({ x: e.x, y: e.y, r: 9, life: 0.24, max: 0.24, color: '#9fd8ff' });
            texts.push({ x: e.x, y: e.y - 9, vy: -14, life: 0.6, text: '冻慢', color: '#bfe8ff' });
            blip(760, 0.06, 'triangle', 0.03, 140);
          }
        }
        e.x += p.dashDx * 3;
        e.y += p.dashDy * 3;
        burst(e.x, e.y, '#ffffff', 4, 45);
        shake = Math.max(shake, 2.2);
        if (killed && p.stats.healKills > 0) {
          p.dashKillCount += 1;
          if (p.dashKillCount >= p.stats.healKills) {
            p.dashKillCount = 0;
            if (p.healBlock > 0) {
              texts.push({ x: p.x, y: p.y - 10, vy: -16, life: 0.7, text: '被腐蚀 · 无法吸血', color: '#9ef58a' });
            } else if (p.healCd <= 0) {
              p.healCd = 1.5;   // 嗜血内部冷却：连续穿杀不会每秒回满
              p.hp = Math.min(p.maxHp, p.hp + 1);
              texts.push({ x: p.x, y: p.y - 10, vy: -18, life: 0.7, text: '+1', color: '#7dffb0' });
            }
          }
        }
        /* 萤火 · 连冲：冲刺击杀返还充能进度，越打越能连着冲 */
        if (killed && p.heroSkill === 'chain') {
          p.dashRefill = Math.min(p.dashRefill + 0.45, Math.max(0, p.stats.dashCd - 0.05));
        }
        if (killed && tutorial && tutorial.active && tutorial.step === 2) tutAdvance();
      }
    }
  } else if (p.freezeT <= 0) {
    const m = Math.hypot(ix, iy) || 1;
    const ice = onIceAt(p.x, p.y);
    // 摇杆推动幅度决定速度：轻推慢走、推满全速（键盘始终全速）
    const spd = p.stats.speed * (stickMag > 0 ? 0.45 + 0.55 * stickMag : 1) *
                (p.slowT > 0 ? p.slowMul : 1) * map.playerSpd *
                (ice ? (map.slip > 0 ? 0.94 : 0.72) : 1);   // 雨夜水洼几乎不减速，只让你更滑
    if (map.slip > 0) {
      /* 雨夜打滑：实际速度向输入方向缓变，起步 / 转向 / 松手都会滑出一段，
         产生路线偏差；水洼处响应更慢（几乎像冰面） */
      const k = 1 - Math.exp(-map.slip * (ice ? 0.5 : 1) * dt);
      const tx = ix ? (ix / m) * spd : 0;
      const ty = iy ? (iy / m) * spd : 0;
      p.slipVx += (tx - p.slipVx) * k;
      p.slipVy += (ty - p.slipVy) * k;
      p.x += p.slipVx * dt;
      p.y += p.slipVy * dt;
      /* 打滑反馈：脚下溅起水花，让“滑”看得见 */
      p.slipFxT -= dt;
      const vs = Math.hypot(p.slipVx, p.slipVy);
      const dv = Math.hypot(p.slipVx - tx, p.slipVy - ty);
      if (p.slipFxT <= 0 && vs > 14 && dv > (ix || iy ? 18 : 10)) {
        p.slipFxT = 0.12;
        waterSpray(p, vs);
      }
    } else {
      p.x += (ix / m) * spd * dt * (ix || iy ? 1 : 0);
      p.y += (iy / m) * spd * dt * (ix || iy ? 1 : 0);
    }
    if (ix || iy) {
      p.dirx = ix / m;
      p.diry = iy / m;
    }
  }

  // 冲刺结束：回旋窗口记录 / 震地冲击波
  if (wasDashing && p.dashT <= 0) {
    if (p.stats.dashReturn && !p.returnBack) {
      p.returnT = 0.45;
      p.returnDx = p.dashDx;
      p.returnDy = p.dashDy;
    }
    if (p.stats.dashQuake) {
      const R = 30 + p.stats.dashRadius;
      effects.push({ x: p.x, y: p.y, r: R, life: 0.34, max: 0.34, color: '#ffb14a' });
      shake = Math.max(shake, 6);
      for (const e of enemies) {
        if (e.dead) continue;
        if (Math.hypot(e.x - p.x, e.y - p.y) < R + e.r) damageEnemy(e, p.stats.dashDamage, p.x, p.y);
      }
      blip(90, 0.2, 'square', 0.07, -50);
    }
    p.returnBack = false;
  }

  // 冲刺结束 -> 爆炸
  if (wasDashing && p.dashT <= 0 && p.stats.dashExplode > 0) {
    const R = p.stats.dashExplode;
    effects.push({ x: p.x, y: p.y, r: R, life: 0.3, max: 0.3, color: '#ffd166' });
    shake = Math.max(shake, 5);
    for (const e of enemies) {
      if (e.dead) continue;
      if (Math.hypot(e.x - p.x, e.y - p.y) < R + e.r) damageEnemy(e, p.stats.dashDamage * 1.5, p.x, p.y);
    }
    blip(80, 0.18, 'square', 0.07, -40);
  }

  // 关羽：冲刺结束挥出一圈刀光（额外范围伤害，不算嗜血击杀）
  if (wasDashing && p.dashT <= 0 && p.heroSkill === 'slash') {
    const R = 24 + p.stats.dashRadius;
    effects.push({ x: p.x, y: p.y, r: R, life: 0.28, max: 0.28, color: p.heroCol });
    for (const e of enemies) {
      if (e.dead) continue;
      if (Math.hypot(e.x - p.x, e.y - p.y) < R + e.r) {
        damageEnemy(e, Math.max(2, Math.round(p.stats.dashDamage * 0.9)), p.x, p.y);
      }
    }
    blip(760, 0.12, 'triangle', 0.06, 80);
  }

  /* 冲刺输入缓冲：冲刺还没结束时按下的一次，落地后自动接上 */
  if (dashBuffer > 0) {
    if (p.dashT > 0) {
      dashBuffer -= dt;
    } else {
      const pending = dashBuffer;
      dashBuffer = 0;
      if (pending > 0 && p.dashCharges > 0) tryDash();
    }
  }

  p.x = clamp(p.x, 6, W - 6);
  p.y = clamp(p.y, 6, H - 6);
  /* 忍者冲刺时可穿过岩石，其余角色照常被挡住 */
  if (!(p.heroSkill === 'blink' && p.dashT > 0)) resolveRocks(p);
  p.x = clamp(p.x, 6, W - 6);
  p.y = clamp(p.y, 6, H - 6);

  // 自动炮台
  updateAuto(dt);
}

function updateAuto(dt) {
  const p = player;
  if (p.stats.autoRate <= 0) return;
  p.autoT += dt;
  const interval = 1 / p.stats.autoRate;
  let guard = 0;
  while (p.autoT >= interval && guard++ < 5) {
    p.autoT -= interval;
    let best = null, bd = 1e9;
    for (const e of enemies) {
      if (e.dead) continue;
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (d < bd) { bd = d; best = e; }
    }
    if (best) {
      const ang = Math.atan2(best.y - p.y, best.x - p.x);
      bullets.push({ x: p.x, y: p.y, vx: Math.cos(ang) * 160, vy: Math.sin(ang) * 160, r: 2, dmg: 1, life: 1.3 });
      blip(900, 0.03, 'square', 0.02, -300);
    }
  }
}

/* ============================================================
   伤害 / 击杀
   ============================================================ */
function damageEnemy(e, dmg, sx, sy) {
  if (e.dead) return false;
  if (e.affix === 'shield') dmg *= 0.5;
  e.hp -= dmg;
  e.flash = 0.07;
  if (e.hp <= 0) {
    killEnemy(e);
    return true;
  }
  // 未击杀的命中：白色火花 + 轻击音（限频，避免一片怪时糊成噪音）
  burst(e.x, e.y, '#ffffff', 2, 30);
  if (hitSnd <= 0) { hitSnd = 0.06; blip(620, 0.03, 'square', 0.03, -90); }
  return false;
}

function killEnemy(e) {
  if (e.dead) return;
  e.dead = true;
  kills += 1;
  /* 狂徒 · 嗜血：每次击杀累计 0.1 回血，攒满 1 点兑现，每 3 秒最多回 1 点 */
  const bl = player;
  if (bl && bl.heroSkill === 'bloodlust' && bl.hp > 0) {
    bl.bloodPool = Math.min(1, bl.bloodPool + 0.1);
    if (bl.bloodPool >= 0.999 && bl.healCd <= 0 && bl.healBlock <= 0 && bl.hp < bl.maxHp) {
      bl.bloodPool = 0;
      bl.healCd = 3;
      bl.hp = Math.min(bl.maxHp, bl.hp + 1);
      texts.push({ x: bl.x, y: bl.y - 10, vy: -18, life: 0.7, text: '+1 嗜血', color: '#ff8a8a' });
      burst(bl.x, bl.y, '#ff6b6b', 6, 42);
      blip(520, 0.07, 'triangle', 0.04, 120);
    }
  }
  /* 成就追踪：击杀数 / 精英 / BOSS / 3 秒连杀窗口 */
  if (achRun) {
    achRun.kills += 1;
    achRun.lastKill = time;
    achRun.killTimes.push(time);
    while (achRun.killTimes.length && time - achRun.killTimes[0] > 3) achRun.killTimes.shift();
    if (e.affix) achRun.elites += 1;
    if (e.type === 'boss') { achRun.bosses += 1; achStats.boss += 1; saveAchStats(); }
  }
  if (e.type === 'boss') {
    bossKills += 1;
    /* 闯关多 BOSS 关卡：第二只在前一只被击败后 bossGap 秒出场 */
    if (state === 'playing' && campaign && curLevel && curLevel.goal === 'boss' &&
        bossKills < curLevel.bosses) {
      nextBoss = time + (curLevel.bossGap || 60);
      /* 晚杀兜底：第二只至少保留 25 秒战斗时间，倒计时不会被关卡时限先耗死 */
      campaignDeadline = Math.max(campaignDeadline, nextBoss + 25);
    }
  }
  checkAch();
  const t = ETYPES[e.type];
  const pts = Math.round((e.pts || t.pts) * player.stats.scoreMul * (e.affix ? 2.5 : 1));
  killScore += pts;
  if (t.xp > 0) orbs.push({ x: e.x, y: e.y, v: e.affix ? Math.max(2, t.xp * 2) : t.xp, r: 2.2, dead: false });
  // 换牌机会掉落：普通怪小概率、精英较高、BOSS 必掉
  const rrChance = e.type === 'boss' ? 1 : e.affix ? 0.2 : 0.03;
  if (rerolls + drops.length < 6 && Math.random() < rrChance) {
    drops.push({ x: e.x, y: e.y, t: rand(0, 3), dead: false, kind: 'reroll' });
  }
  // 金币掉落：普通 8%，精英 25%
  const coinChance = e.affix ? 0.25 : 0.08;
  if (e.type !== 'boss' && Math.random() < coinChance) {
    drops.push({ x: e.x, y: e.y, t: rand(0, 3), dead: false, kind: 'coin', val: e.affix ? 6 : 3 });
  }
  // 血包掉落：低血量时概率翻倍
  const lowHp = player.hp <= player.maxHp * 0.4;
  const hpChance = (e.affix ? 0.08 : 0.02) * (lowHp ? 2 : 1);
  if (e.type !== 'boss' && Math.random() < hpChance) {
    drops.push({ x: e.x, y: e.y, t: rand(0, 3), dead: false, kind: 'hp' });
  }
  const kcol = e.affix ? AFFIX[e.affix].col : t.color;

  // 打击感：顿帧 + 震屏 + 冲击环 + 分数飘字
  hitStop = Math.max(hitStop, e.type === 'boss' ? 0.08 : 0.04);
  shake = Math.max(shake, e.type === 'boss' ? 9 : 2.8);
  effects.push({ x: e.x, y: e.y, r: e.type === 'boss' ? 26 : 13, life: 0.26, max: 0.26, color: kcol });
  texts.push({ x: e.x, y: e.y - 9, vy: -27, life: 0.72, text: '+' + pts, color: '#ffe066' });
  burst(e.x, e.y, kcol, e.type === 'boss' ? 26 : 10, e.type === 'boss' ? 110 : 74);

  // 词缀结算
  if (e.affix === 'split') {
    splitQueue.push({ x: e.x - 7, y: e.y + 3 }, { x: e.x + 7, y: e.y - 3 });
  } else if (e.affix === 'boom') {
    effects.push({ x: e.x, y: e.y, r: 22, life: 0.3, max: 0.3, color: '#ffa53d' });
    burst(e.x, e.y, '#ffa53d', 16, 96);
    shake = Math.max(shake, 4);
    if (Math.hypot(player.x - e.x, player.y - e.y) < 22) hitPlayer({ x: e.x, y: e.y, dmg: 1 });
  }

  // 毒囊死亡后原地扩散毒雾
  if (e.type === 'poisoner') {
    hazards.push({ x: e.x, y: e.y, r: 22, life: 5, max: 5, poison: true });
    effects.push({ x: e.x, y: e.y, r: 22, life: 0.4, max: 0.4, color: '#9ef58a' });
  }

  // 音效：不同怪不同音高，越硬越低
  const pitch = { chaser: 168, fast: 205, shooter: 230, tank: 132, poisoner: 196, frost: 250, bomber: 320, boss: 88 }[e.type] || 168;
  if (e.type === 'boss') {
    screenFlash = 0.25;
    blip(88, 0.3, 'square', 0.1, -60);
    blip(56, 0.22, 'sawtooth', 0.07, -20);
    // 击破奖励：回 1 血 + 一圈大号经验球，明确「打死有回报」
    const gen = e.gen || 1;
    player.hp = Math.min(player.maxHp, player.hp + 1);
    coins += 15;
    if (achRun) achRun.coinsEarned += 15;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + rand(0, 0.4), rr = rand(10, 24);
      orbs.push({ x: clamp(e.x + Math.cos(a) * rr, 4, W - 4), y: clamp(e.y + Math.sin(a) * rr, 4, H - 4), v: 3, r: 2.2, dead: false });
    }
    // BOSS 必掉 2 个血包 + 1 个金币堆
    for (let i = 0; i < 2; i++) {
      drops.push({ x: clamp(e.x + rand(-10, 10), 8, W - 8), y: clamp(e.y + rand(-10, 10), 8, H - 8), t: rand(0, 3), dead: false, kind: 'hp' });
    }
    drops.push({ x: e.x, y: e.y, t: rand(0, 3), dead: false, kind: 'coin', val: 10 });
    clearBossScreen(e);
    toast(bossName(gen) + ' 击破 · 清屏', true);
  } else {
    blip(pitch, 0.07, 'square', 0.06, -48);
    blip(pitch * 2.1, 0.05, 'triangle', 0.035, 120);
  }
}

/* BOSS 击破清屏：只清小兵与弹幕，场上其余 BOSS 保留 */
function clearBossScreen(boss) {
  let n = 0;
  for (const e of enemies) {
    if (e.dead || e === boss || e.type === 'boss') continue;
    e.dead = true;
    n += 1;
    killScore += 5;
    effects.push({ x: e.x, y: e.y, r: 9, life: 0.22, max: 0.22, color: '#ffe066' });
    burst(e.x, e.y, '#ffe066', 5, 40);
  }
  ebullets = [];
  marks = [];
  hazards = [];
  screenFlash = Math.max(screenFlash, 0.35);
  shake = Math.max(shake, 10);
  if (achRun) achRun.clears += 1;
  if (n > 0) toast('清屏 · ' + n + ' 个小兵', true);
  blip(140, 0.28, 'square', 0.07, -60);
}

/* 殉爆虫自爆：不给分、不给经验，只造成伤害 */
function explodeBomber(e) {
  e.dead = true;
  effects.push({ x: e.x, y: e.y, r: 26, life: 0.32, max: 0.32, color: '#ffb15c' });
  effects.push({ x: e.x, y: e.y, r: 14, life: 0.24, max: 0.24, color: '#fff1c8' });
  burst(e.x, e.y, '#ffb15c', 18, 100);
  shake = Math.max(shake, 5);
  screenFlash = Math.max(screenFlash, 0.12);
  blip(66, 0.2, 'square', 0.08, -30);
  if (Math.hypot(player.x - e.x, player.y - e.y) < 26 + player.r) {
    hitPlayer({ x: e.x, y: e.y, dmg: e.dmg || 2 });
  }
}

function hitPlayer(src) {
  const p = player;
  if (p.invuln > 0 || p.dashT > 0 || state !== 'playing') return;

  const dx = p.x - src.x, dy = p.y - src.y, d = Math.hypot(dx, dy) || 1;

  // 护盾优先吸收
  if (p.shield > 0) {
    p.shield -= 1;
    p.shieldT = 0;
    p.invuln = 0.7;
    p.flash = 0.1;
    shake = Math.max(shake, 5);
    screenFlash = 0.16;
    blip(420, 0.12, 'triangle', 0.075, 120);
    burst(p.x, p.y, '#b8f5d0', 12, 62);
    effects.push({ x: p.x, y: p.y, r: 15, life: 0.3, max: 0.3, color: '#b8f5d0' });
    texts.push({ x: p.x, y: p.y - 12, vy: -20, life: 0.6, text: '护盾抵挡', color: '#b8f5d0' });
    if (src.type) {
      src.x = clamp(src.x - dx / d * 11, src.r, W - src.r);
      src.y = clamp(src.y - dy / d * 11, src.r, H - src.r);
    }
    return;
  }

  p.hp -= (src.dmg || 1);
  if (achRun) { achRun.hits += 1; achRun.noHitT = 0; }
  checkAch();
  p.invuln = diff.invuln;
  p.flash = 0.12;
  shake = Math.max(shake, 7);
  screenFlash = 0.28;
  blip(95, 0.2, 'sawtooth', 0.09, -35);
  burst(p.x, p.y, '#ff4d6d', 10, 70);

  /* 盾卫重甲：被撞开得更少，站得住 */
  const kb = p.heroSkill === 'guard' ? 3 : 9;
  p.x = clamp(p.x + dx / d * kb, 6, W - 6);
  p.y = clamp(p.y + dy / d * kb, 6, H - 6);

  // 撞到玩家的敌人被弹开，避免贴脸连续扣血
  if (src.type) {
    src.x = clamp(src.x - dx / d * 11, src.r, W - src.r);
    src.y = clamp(src.y - dy / d * 11, src.r, H - src.r);
  }

  if (p.hp <= 0) {
    p.hp = 0;
    endGame(false);
  }
}

/* ============================================================
   更新：敌人
   ============================================================ */
function spawnEnemy(type, x, y, plain) {
  const t = ETYPES[type];
  const tier = threatTier();
  const hpMul = (1 + time / diff.hpGrow) * diff.hp * (1 + 0.08 * tier);
  const spMul = (1 + time / 280) * diff.spd;
  // 同屏精英上限，避免后期整屏都是词缀怪、画面读不清
  let eliteOnField = 0;
  for (const q of enemies) if (!q.dead && q.affix) eliteOnField++;
  const elite = !plain && type !== 'boss' && eliteOnField < 14 && Math.random() < eliteChance();
  const affix = elite ? pick(AFFIX_IDS) : null;
  let hp = Math.round(t.hp * hpMul);
  if (affix === 'shield') hp = Math.round(hp * 1.6);
  if (type === 'boss') hp = Math.round(hp * (1 + 0.3 * Math.max(0, bossGen - 1)));
  // 击杀分值随强度递增：威胁等级、场上时间、BOSS 代际、护盾血量都算钱
  // （难度系数不在这里重复计，统一由 calcScore 的难度倍率处理）
  let pts = t.pts * (1 + 0.08 * tier);
  pts *= 1 + 0.18 * Math.min(6, Math.floor(time / 90));
  if (type === 'boss') pts *= 1 + 0.35 * Math.max(0, bossGen - 1);
  if (affix === 'shield') pts *= 1.25;
  pts = Math.max(1, Math.round(pts));
  /* 守护关：近战杂兵六成直扑水晶，远程 / 自爆仍盯着玩家 */
  const ranged = type === 'shooter' || type === 'poisoner' || type === 'frost' || type === 'bomber';
  const tc = core && type !== 'boss' && !ranged && Math.random() < 0.6 ? 'core' : 'player';
  enemies.push({
    id: ++eid, type, x, y, hp, maxHp: hp, pts,
    r: t.r, speed: t.speed * spMul * map.enemySpd,
    dmg: t.dmg + (tier >= 4 ? 1 : 0),
    flash: 0, auraT: 0, fireT: 0, bossT: 0,
    lungeT: 0, boost: 0, chargeT: 1.2, bossStep: 0, fuseT: 0,
    affix, gen: type === 'boss' ? bossGen : 0, dead: false,
    tc, chillT: 0, freezeT: 0, coreTick: 0,
  });

  // 图鉴解锁：基础怪、精英词缀、BOSS 世代各自登记（分裂产物不算图鉴遭遇）
  if (!plain) {
    const names = [];
    const uBase = unlockCodex(type);
    if (uBase) names.push(uBase);
    if (affix) { const uEl = unlockCodex('el_' + affix); if (uEl) names.push(uEl); }
    if (type === 'boss') {
      const uBoss = unlockCodex('boss' + Math.min(Math.max(bossGen, 1), 5));
      if (uBoss) names.push(uBoss);
    }
    if (names.length) toast('图鉴解锁 · ' + names.join(' · '));
  }
}

function spawnAtEdge(type) {
  const m = 7;
  const side = irand(0, 3);
  let x, y;
  if (side === 0) { x = rand(m, W - m); y = m; }
  else if (side === 1) { x = rand(m, W - m); y = H - m; }
  else if (side === 2) { x = m; y = rand(m, H - m); }
  else { x = W - m; y = rand(m, H - m); }
  spawnEnemy(type, x, y);
}

function updateEnemies(dt) {
  for (const e of enemies) {
    if (e.dead) continue;
    if (e.flash > 0) e.flash -= dt;

    if (e.chillT > 0) e.chillT -= dt;
    if (e.freezeT > 0) e.freezeT -= dt;
    if (e.coreTick > 0) e.coreTick -= dt;
    const frozen = e.freezeT > 0;

    /* 守护关：部分杂兵以水晶为目标；其余仍追玩家 */
    const tgtCore = e.tc === 'core' && core && core.hp > 0;
    const tx = tgtCore ? core.x : player.x;
    const ty = tgtCore ? core.y : player.y;
    const dx = tx - e.x, dy = ty - e.y;
    const d = Math.hypot(dx, dy) || 1;
    const ux = dx / d, uy = dy / d;
    const pd = Math.hypot(player.x - e.x, player.y - e.y);
    const slow = (player.stats.slowR > 0 && pd < player.stats.slowR ? player.stats.slowFactor : 1) *
                 (e.chillT > 0 ? 0.30 : 1);   // 霜语冻慢：只剩三成速度
    const fz = frenzyT > 0 ? 1.25 : 1;

    // 腐蚀词缀：光环范围内封锁吸血并持续中毒
    if (e.affix === 'corrupt' && pd < 30) {
      applyHealBlock(0.35);
      if (player.poisonT <= 0.2) applyPoison(2.2);
    }

    if (frozen) {
      // 被霜语冻住：原地不动、不出手，接触伤害仍照常结算
    } else if (e.type === 'shooter') {
      if (d > 78) { e.x += ux * e.speed * dt * slow * fz; e.y += uy * e.speed * dt * slow * fz; }
      else if (d < 48) { e.x -= ux * e.speed * dt * 0.9 * slow * fz; e.y -= uy * e.speed * dt * 0.9 * slow * fz; }
      else { e.x += -uy * e.speed * dt * 0.7 * slow * fz; e.y += ux * e.speed * dt * 0.7 * slow * fz; }
      e.fireT -= dt;
      if (e.fireT <= 0 && d < 160) {
        e.fireT = 2.1;
        ebullets.push({ x: e.x, y: e.y, vx: ux * 82, vy: uy * 82, r: 2.5, life: 4, dmg: 1, dead: false });
      }
    } else if (e.type === 'poisoner') {
      // 保持 40~70 距离放毒球
      if (d > 70) { e.x += ux * e.speed * dt * slow * fz; e.y += uy * e.speed * dt * slow * fz; }
      else if (d < 40) { e.x -= ux * e.speed * dt * 0.8 * slow * fz; e.y -= uy * e.speed * dt * 0.8 * slow * fz; }
      else { e.x += -uy * e.speed * dt * 0.6 * slow * fz; e.y += ux * e.speed * dt * 0.6 * slow * fz; }
      e.fireT -= dt;
      if (e.fireT <= 0 && d < 170) {
        e.fireT = 2.6;
        ebullets.push({ x: e.x, y: e.y, vx: ux * 64, vy: uy * 64, r: 3, life: 4.5, dmg: 1, dead: false, poison: true });
        blip(300, 0.05, 'triangle', 0.025, -80);
      }
    } else if (e.type === 'frost') {
      // 保持 55~90 距离放冰锥
      if (d > 90) { e.x += ux * e.speed * dt * slow * fz; e.y += uy * e.speed * dt * slow * fz; }
      else if (d < 55) { e.x -= ux * e.speed * dt * 0.8 * slow * fz; e.y -= uy * e.speed * dt * 0.8 * slow * fz; }
      else { e.x += -uy * e.speed * dt * 0.5 * slow * fz; e.y += ux * e.speed * dt * 0.5 * slow * fz; }
      e.fireT -= dt;
      if (e.fireT <= 0 && d < 175) {
        /* 极寒关的霜核出手更快，冰锥更密 */
        e.fireT = campaign && curLevel && curLevel.chill ? 1.75 : 2.4;
        ebullets.push({ x: e.x, y: e.y, vx: ux * 74, vy: uy * 74, r: 3, life: 4.5, dmg: 1, dead: false, frost: true });
        blip(760, 0.05, 'triangle', 0.025, 120);
      }
    } else if (e.type === 'bomber') {
      // 追到身边后点燃引信，0.6 秒自爆（不给分）
      if (e.fuseT > 0) {
        e.fuseT -= dt;
        if (e.fuseT <= 0) { explodeBomber(e); continue; }
      } else {
        e.x += ux * e.speed * dt * slow * fz;
        e.y += uy * e.speed * dt * slow * fz;
        if (d < 16) {
          e.fuseT = 0.6;
          blip(880, 0.06, 'square', 0.03, 140);
        }
      }
    } else if (e.type === 'fast') {
      e.lungeT -= dt;
      let sp = e.speed;
      if (e.lungeT <= 0) { e.lungeT = 1.7; e.boost = 0.28; }
      if (e.boost > 0) { e.boost -= dt; sp = e.speed * 2.3; }
      e.x += ux * sp * dt * slow * fz; e.y += uy * sp * dt * slow * fz;
    } else if (e.type === 'boss') {
      const gen = e.gen || 1;
      if (e.boost > 0) e.boost -= dt;
      /* 第五代熔核过载：血量低于 35% 后移速与出手全面加快 */
      const core = gen >= 5 && e.hp <= e.maxHp * 0.35;
      const sp = e.speed * (1 + 0.06 * (gen - 1)) * (e.boost > 0 ? 2.4 : 1) * (core ? 1.28 : 1);
      e.x += ux * sp * dt * slow * fz;
      e.y += uy * sp * dt * slow * fz;
      e.bossT -= dt;
      if (e.bossT <= 0) {
        const rage = e.hp <= e.maxHp * 0.5;
        e.bossT = core ? 1.9 : rage ? 2.5 : 3.4;
        e.bossStep = (e.bossStep || 0) + 1;
        // 招式随世代解锁：1 环形 → 2 召唤/毒池 → 3 冰锥/冲锋 → 4 全部 → 5 熔核爆裂/地心裂隙
        const moves = ['ring'];
        if (gen >= 2) moves.push('summon', 'poison');
        if (gen >= 3) moves.push('frost', 'charge');
        if (gen >= 4) moves.push('fan');
        if (gen >= 5) moves.push('nova', 'vein');
        const kind = moves[e.bossStep % moves.length];
        const bdmg = gen >= 4 ? 2 : 1;

        if (kind === 'ring') {
          // 环形弹幕：弹量随世代增加
          const n = 8 + (gen - 1) * 2;
          for (let i = 0; i < n; i++) {
            const a = (i / n) * TAU + time * (0.6 + 0.15 * gen);
            ebullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * 70, vy: Math.sin(a) * 70, r: 3, life: 5, dmg: bdmg, dead: false });
          }
          blip(120, 0.2, 'square', 0.05, -50);
        } else if (kind === 'summon') {
          // 召唤小怪：先在地面亮起预警圈，0.75 秒后才真正冒出来
          if (enemies.length + marks.length < 150) {
            const n2 = 2 + gen;
            for (let i = 0; i < n2; i++) {
              const a = rand(0, TAU), rr = rand(14, 30);
              marks.push({
                x: clamp(e.x + Math.cos(a) * rr, 8, W - 8),
                y: clamp(e.y + Math.sin(a) * rr, 8, H - 8),
                r: 7, t: 0.75, max: 0.75,
              });
            }
          }
          // 三连散射
          const base = Math.atan2(dy, dx);
          for (let i = -1; i <= 1; i++) {
            const a = base + i * 0.3;
            ebullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * 86, vy: Math.sin(a) * 86, r: 3, life: 5, dmg: bdmg, dead: false });
          }
          blip(90, 0.22, 'sawtooth', 0.06, -30);
        } else if (kind === 'poison') {
          // 毒池：在玩家附近与自身周围留下 3 片毒雾
          for (let i = 0; i < 3; i++) {
            const a = rand(0, TAU), rr = rand(16, 36);
            const px2 = i === 0 ? clamp(player.x + rand(-12, 12), 10, W - 10) : clamp(e.x + Math.cos(a) * rr, 10, W - 10);
            const py2 = i === 0 ? clamp(player.y + rand(-12, 12), 10, H - 10) : clamp(e.y + Math.sin(a) * rr, 10, H - 10);
            hazards.push({ x: px2, y: py2, r: 22, life: 5, max: 5, poison: true });
          }
          blip(180, 0.2, 'triangle', 0.05, -40);
        } else if (kind === 'frost') {
          // 冰锥扇面：命中减速，连续命中会冰冻
          const base = Math.atan2(dy, dx);
          for (let i = -2; i <= 2; i++) {
            const a = base + i * 0.2;
            ebullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * 78, vy: Math.sin(a) * 78, r: 3, life: 5, dmg: bdmg, dead: false, frost: true });
          }
          blip(560, 0.16, 'triangle', 0.05, 90);
        } else if (kind === 'charge') {
          // 冲锋 + 扇形弹幕
          e.boost = 0.45;
          const base = Math.atan2(dy, dx);
          for (let i = -3; i <= 3; i++) {
            const a = base + i * 0.16;
            ebullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * 96, vy: Math.sin(a) * 96, r: 3, life: 5, dmg: bdmg, dead: false });
          }
          blip(70, 0.26, 'square', 0.07, -50);
        } else if (kind === 'nova') {
          // 熔核爆裂：以自身为圆心炸出一圈熔岩，只留一小段缺口
          const n3 = 16;
          const gapAt = Math.floor(rand(0, n3));
          for (let i = 0; i < n3; i++) {
            const d0 = Math.abs(i - gapAt);
            if (Math.min(d0, n3 - d0) <= 1) continue;
            const a = (i / n3) * TAU;
            hazards.push({
              x: clamp(e.x + Math.cos(a) * 30, 10, W - 10),
              y: clamp(e.y + Math.sin(a) * 30, 10, H - 10),
              r: 9, life: 3.2, max: 3.2, kind: 'lava',
            });
          }
          for (let i = 0; i < 12; i++) {
            const a = (i / 12) * TAU;
            ebullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * 62, vy: Math.sin(a) * 62, r: 3, life: 5, dmg: bdmg, dead: false });
          }
          effects.push({ x: e.x, y: e.y, r: 42, life: 0.4, max: 0.4, color: '#ff8a4a' });
          shake = Math.max(shake, 8);
          blip(70, 0.28, 'sawtooth', 0.08, -60);
        } else if (kind === 'vein') {
          // 地心裂隙：朝玩家方向烧出一条熔岩带
          const base = Math.atan2(dy, dx);
          for (let i = 1; i <= 8; i++) {
            hazards.push({
              x: clamp(e.x + Math.cos(base) * i * 13, 10, W - 10),
              y: clamp(e.y + Math.sin(base) * i * 13, 10, H - 10),
              r: 8, life: 2.6, max: 2.6, kind: 'lava',
            });
          }
          burst(e.x + Math.cos(base) * 20, e.y + Math.sin(base) * 20, '#ff8a4a', 10, 80);
          blip(240, 0.24, 'sawtooth', 0.06, -50);
        } else {
          // 四周扩散弹幕
          const base = Math.atan2(dy, dx);
          for (let i = -5; i <= 5; i++) {
            const a = base + i * 0.22;
            ebullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * 88, vy: Math.sin(a) * 88, r: 3, life: 5, dmg: bdmg, dead: false });
          }
          blip(90, 0.2, 'sawtooth', 0.055, -40);
        }
      }
    } else {
      let sp = e.speed;
      if (e.affix === 'charge') {
        e.chargeT -= dt;
        if (e.chargeT <= 0) { e.chargeT = 2.2; e.boost = 0.3; }
        if (e.boost > 0) { e.boost -= dt; sp = e.speed * 2.6; }
      }
      e.x += ux * sp * dt * slow * fz;
      e.y += uy * sp * dt * slow * fz;
    }

    e.x = clamp(e.x, e.r, W - e.r);
    e.y = clamp(e.y, e.r, H - e.r);

    /* 贴住水晶的敌人每秒凿掉 1 点；凿穿即判负 */
    if (tgtCore && !frozen && Math.hypot(e.x - core.x, e.y - core.y) < core.r + e.r + 2 && e.coreTick <= 0) {
      e.coreTick = 1;
      core.hp -= 1;
      core.flash = 0.14;
      effects.push({ x: core.x, y: core.y, r: core.r + 3, life: 0.24, max: 0.24, color: '#ff5d6c' });
      burst(core.x + rand(-3, 3), core.y + rand(-3, 3), '#7ef0ff', 6, 40);
      texts.push({ x: core.x, y: core.y - 12, vy: -14, life: 0.6, text: '-1 水晶', color: '#ff8a8a' });
      blip(240, 0.08, 'sawtooth', 0.04, -50);
      shake = Math.max(shake, 2.5);
      if (core.hp <= 0) {
        core.hp = 0;
        effects.push({ x: core.x, y: core.y, r: 30, life: 0.4, max: 0.4, color: '#7ef0ff' });
        burst(core.x, core.y, '#7ef0ff', 24, 100);
        screenFlash = 0.4;
        shake = Math.max(shake, 9);
        endGame(false);
        return;
      }
    }

    // 接触伤害
    if (player.invuln <= 0 && player.dashT <= 0) {
      if (Math.hypot(player.x - e.x, player.y - e.y) < e.r + player.r + 1) {
        hitPlayer(e);
        if (state !== 'playing') return;
      }
    }
  }
}

function updateEBullets(dt) {
  for (const b of ebullets) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (b.x < 0 || b.x > W || b.y < 0 || b.y > H) b.life = 0;
    if (b.life <= 0) continue;
    if (player.invuln <= 0 && player.dashT <= 0 &&
        Math.hypot(player.x - b.x, player.y - b.y) < player.r + b.r) {
      b.life = 0;
      if (b.poison) applyPoison(2.6);
      if (b.frost) {
        /* 极寒关：冰锥一沾身就直接冻住；其他关卡先减速，第二发才冻。
           冻结时长必须超过受击无敌（1.2 秒），否则玩家根本感觉不到「被冻住」 */
        const chill = !!(campaign && curLevel && curLevel.chill);
        if (chill) freezePlayer(2.0);
        else if (player.slowT > 0) freezePlayer(1.8);
        else applySlow(2.2, 0.5);
      }
      hitPlayer(b);
      if (state !== 'playing') return;
    }
  }
  ebullets = ebullets.filter((b) => b.life > 0);
}

function updateBullets(dt) {
  for (const b of bullets) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (b.x < 0 || b.x > W || b.y < 0 || b.y > H) b.life = 0;
    if (b.life <= 0) continue;
    for (const e of enemies) {
      if (e.dead) continue;
      if (Math.hypot(e.x - b.x, e.y - b.y) < e.r + b.r) {
        damageEnemy(e, b.dmg, b.x, b.y);
        b.life = 0;
        burst(b.x, b.y, '#ffe066', 4, 40);
        break;
      }
    }
  }
  bullets = bullets.filter((b) => b.life > 0);
}

/* ============================================================
   更新：经验球 / 区域伤害 / 粒子
   ============================================================ */
function gainXP(n) {
  const p = player;
  p.xp += n * p.stats.xpMul * diff.xp;
  while (p.xp >= p.xpNext) {
    p.xp -= p.xpNext;
    p.level += 1;
    p.xpNext = Math.round(p.xpNext * 1.22 + 2);
    pendingLevels += 1;
    p.hp = Math.min(p.maxHp, p.hp + 1);   // 升级回 1 点血，缓解中期压力
  }
  if (pendingLevels > 0 && state === 'playing') openUpgrade();
}

/* 掉落物：换牌 / 金币 / 血包，靠近吸附，碰到即收集 */
function updateDrops(dt) {
  const p = player;
  for (const d of drops) {
    d.t += dt;
    const dx = p.x - d.x, dy = p.y - d.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (dist < 34) {
      const sp = 60 + 120 * (1 - dist / 34);
      d.x += (dx / dist) * sp * dt;
      d.y += (dy / dist) * sp * dt;
    }
    if (dist < 8) {
      d.dead = true;
      const kind = d.kind || 'reroll';
      if (kind === 'coin') {
        const v = d.val || 3;
        coins += v;
        if (achRun) { achRun.coinsEarned += v; checkAch(); }
        toast('金币 +' + v);
        blip(1040, 0.06, 'triangle', 0.04, 180);
        effects.push({ x: d.x, y: d.y, r: 8, life: 0.2, max: 0.2, color: '#ffd54a' });
        burst(d.x, d.y, '#ffd54a', 6, 40);
      } else if (kind === 'hp') {
        p.hp = Math.min(p.maxHp, p.hp + 2);
        texts.push({ x: p.x, y: p.y - 10, vy: -18, life: 0.7, text: '+2', color: '#7dffb0' });
        toast('血包 +2');
        blip(700, 0.09, 'triangle', 0.05, 160);
        effects.push({ x: d.x, y: d.y, r: 9, life: 0.22, max: 0.22, color: '#ff6b7a' });
        burst(d.x, d.y, '#ff6b7a', 7, 42);
      } else {
        rerolls = Math.min(6, rerolls + 1);
        toast('换牌机会 +1');
        blip(980, 0.06, 'triangle', 0.05, 220);
        effects.push({ x: d.x, y: d.y, r: 8, life: 0.2, max: 0.2, color: '#ffe066' });
        burst(d.x, d.y, '#ffe066', 6, 40);
      }
    }
  }
  drops = drops.filter((d) => !d.dead);
}

function updateOrbs(dt) {
  const p = player;
  orbChainT -= dt;
  for (const o of orbs) {
    if (o.dead) continue;   // 已吃掉但没来得及清理的球不能再给经验
    const dx = p.x - o.x, dy = p.y - o.y;
    const d = Math.hypot(dx, dy) || 1;
    // 全图缓慢吸附，靠近后加速：冲刺会把玩家带离击杀点，经验球不该被落下
    const speed = d < p.stats.magnet
      ? 60 + 170 * (1 - d / p.stats.magnet)
      : 46;
    o.x += (dx / d) * speed * dt;
    o.y += (dy / d) * speed * dt;
    if (d < 7) {
      o.dead = true;
      if (achRun) { achRun.orbs += 1; checkAch(); }
      gainXP(o.v);
      if (state !== 'playing') {
        // 升级界面会中断本帧更新：先把已吃掉的球清掉，避免下次回到战斗时重复给经验
        orbs = orbs.filter((x) => !x.dead);
        return;
      }
      // 连吃多颗时音高递进，反馈更“顺”
      orbChain = orbChainT > 0 ? orbChain + 1 : 1;
      orbChainT = 0.85;
      blip(660 + Math.min(orbChain, 9) * 46, 0.045, 'triangle', 0.04, 160);
      effects.push({ x: o.x, y: o.y, r: 5, life: 0.16, max: 0.16, color: '#7ef0ff' });
      burst(o.x, o.y, '#7ef0ff', 4, 34);
    }
  }
  orbs = orbs.filter((o) => !o.dead);
}

function updateZones(dt) {
  const p = player;

  // 光环
  if (p.stats.auraR > 0) {
    for (const e of enemies) {
      if (e.dead) continue;
      if (Math.hypot(e.x - p.x, e.y - p.y) < p.stats.auraR + e.r) {
        if (time - e.auraT > 0.36) {
          e.auraT = time;
          damageEnemy(e, p.stats.auraDps * 0.36, p.x, p.y);
        }
      }
    }
  }

  // 火焰尾迹
  if (trails.length) {
    for (const e of enemies) {
      if (e.dead) continue;
      for (const t of trails) {
        if (t.life <= 0) continue;
        if (Math.hypot(e.x - t.x, e.y - t.y) < t.r + e.r) {
          if (time - e.fireT > 0.45) {
            e.fireT = time;
            damageEnemy(e, 1.3, t.x, t.y);
          }
          break;
        }
      }
    }
  }

  for (const t of trails) t.life -= dt;
  trails = trails.filter((t) => t.life > 0);
}

/* 地面区域：毒雾封锁吸血；熔岩持续烫伤 */
function updateHazards(dt) {
  if (!hazards.length) return;
  for (const h of hazards) {
    h.life -= dt;
    const d = Math.hypot(player.x - h.x, player.y - h.y);
    if (d < h.r) {
      if (h.kind === 'lava' || h.kind === 'shock') {
        if (player.lavaTick <= 0) {
          player.lavaTick = 1.2;
          player.hp -= 1;
          const shock = h.kind === 'shock';
          texts.push({ x: player.x, y: player.y - 10, vy: -18, life: 0.7,
            text: shock ? '-1 电击' : '-1 烫伤', color: shock ? '#7ef0ff' : '#ff9a5c' });
          burst(player.x, player.y, shock ? '#bff8ff' : '#ff8a4a', 8, 70);
          blip(shock ? 880 : 150, 0.1, 'square', 0.05, shock ? 200 : -30);
          if (player.hp <= 0) { endGame(false); return; }
        }
      } else {
        applyHealBlock(0.4);
        if (player.poisonT <= 0.2) applyPoison(2.4);
      }
    }
  }
  hazards = hazards.filter((h) => h.life > 0);
}

/* 熔岩图：预警 1.1 秒后陨石砸落，留下短暂熔岩；霓虹图：地砖周期性通电 */
function updateMapTerrain(dt) {
  const p = player;

  if (map.meteor) {
    /* 关卡可用 meteorMul 拉长陨石间隔（第三关降低随机致死压力，不影响无尽） */
    const meteorInt = map.meteor * (campaign && curLevel && curLevel.meteorMul ? curLevel.meteorMul : 1);
    meteorT -= dt;
    if (meteorT <= 0) {
      meteorT = meteorInt + rand(-1.5, 1.5);
      meteors.push({ x: rand(16, W - 16), y: rand(16, H - 16), warn: 1.1, life: 2.6, max: 2.6, explode: false });
    }
    for (const m of meteors) {
      m.life -= dt;
      if (m.explode) continue;
      m.warn -= dt;
      if (m.warn <= 0) {
        m.explode = true;
        hazards.push({ x: m.x, y: m.y, r: 15, life: 2.2, max: 2.2, kind: 'lava' });
        effects.push({ x: m.x, y: m.y, r: 16, life: 0.32, max: 0.32, color: '#ff8a4a' });
        burst(m.x, m.y, '#ffb15c', 12, 95);
        shake = Math.max(shake, 6);
        blip(110, 0.16, 'square', 0.06, -50);
        if (p && state === 'playing' && Math.hypot(p.x - m.x, p.y - m.y) < 15 + p.r) hitPlayer({ x: m.x, y: m.y });
      }
    }
    meteors = meteors.filter((m) => m.life > 0);
  }

  if (map.shock) {
    shockT -= dt;
    if (shockT <= 0) {
      shockT = map.shock + rand(-1, 1);
      for (let i = 0; i < 2; i++) {
        hazards.push({
          x: rand(18, W - 18), y: rand(18, H - 18),
          r: 16, life: 2.2, max: 2.2, kind: 'shock',
        });
      }
      blip(980, 0.1, 'square', 0.04, -120);
    }
  }

  /* 荒漠图：周期性沙暴，黄沙糊住视线但不造成伤害 */
  if (map.sand) {
    if (sandT > 0) {
      sandT = Math.max(0, sandT - dt);
    } else {
      sandCd -= dt;
      if (sandCd <= 0) {
        sandCd = map.sand + rand(-3, 3);
        sandT = SAND_STORM;
        toast('沙暴来袭 · 能见度降低', true);
        shake = Math.max(shake, 3);
        blip(90, 0.3, 'sawtooth', 0.05, -20);
      }
    }
  }
}

function updateParticles(dt) {
  for (const p of particles) {
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.vx *= 0.94; p.vy *= 0.94;
    p.life -= dt;
  }
  particles = particles.filter((p) => p.life > 0);

  for (const f of effects) f.life -= dt;
  effects = effects.filter((f) => f.life > 0);

  for (const t of texts) { t.y += t.vy * dt; t.life -= dt; }
  texts = texts.filter((t) => t.life > 0);
}

function burst(x, y, color, n, speed) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, TAU), s = rand(0.25, 1) * (speed || 60);
    particles.push({
      x, y,
      vx: Math.cos(a) * s, vy: Math.sin(a) * s,
      life: rand(0.15, 0.5), max: 0.5,
      color, size: irand(1, 2),
    });
  }
}

/* 打滑时脚下溅起的水花：往速度反方向甩，给“滑出去”一个可读的反馈 */
function waterSpray(p, vs) {
  const a = Math.atan2(p.slipVy, p.slipVx);
  const back = Math.min(1, vs / 62);
  for (let i = 0; i < 3; i++) {
    const dir = a + Math.PI + rand(-0.55, 0.55);
    const s = rand(14, 34) * back;
    particles.push({
      x: p.x - Math.cos(a) * 4 + rand(-2, 2),
      y: p.y - Math.sin(a) * 4 + rand(-2, 2) + 2,
      vx: Math.cos(dir) * s,
      vy: Math.sin(dir) * s - rand(2, 8),
      life: rand(0.22, 0.42), max: 0.42,
      color: i % 2 ? '#cfe6ff' : '#9fc4ff',
      size: 1,
    });
  }
}

