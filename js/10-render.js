/* PIXEL DASH · 渲染 / 精灵烘焙 —— 由 index.html 拆分，按顺序加载 */
'use strict';

/* ============================================================
   渲染
   ============================================================ */
function px(x, y, w, h, c) {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x - w / 2), Math.round(y - h / 2), w, h);
}

function txt(s, x, y, color, align) {
  ctx.font = '8px ui-monospace, "PingFang SC", "Microsoft YaHei", monospace';
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = color;
  ctx.fillText(s, Math.round(x), Math.round(y));
}

/* 圆角矩形：按行内缩，做出星露谷式的软边 */
function fillRound(g, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, Math.floor(w / 2), Math.floor(h / 2)));
  for (let i = 0; i < h; i++) {
    let inset = 0;
    const d = Math.min(i, h - 1 - i);
    if (d < r) {
      const k = r - d - 0.5;
      inset = Math.round(r - Math.sqrt(Math.max(0, r * r - k * k)));
    }
    if (w - inset * 2 > 0) g.fillRect(x + inset, y + i, w - inset * 2, 1);
  }
}

/* 画一只怪物（in-game 与图鉴共用）：星露谷式圆润软泥身体 + 高光 + 黑豆眼 + 类型特征 */
function paintMonster(g, left, top, s, o) {
  const skin = o.gen ? BOSS_SKIN[Math.min(o.gen, BOSS_SKIN.length) - 1] : null;
  const edge = o.edge || (skin ? skin.edge : '#1b1b2b');
  const type = o.type;
  const r = s >= 18 ? Math.round(s * 0.30) : s >= 10 ? 3 : 2;
  const mid = left + Math.round(s / 2);

  // BOSS 分代：肩甲与尖角（画在身体下层）
  if (skin && skin.pauldron) {
    g.fillStyle = edge;
    fillRound(g, left - 2, top + Math.round(s * 0.30), 3, Math.round(s * 0.46), 1);
    fillRound(g, left + s - 1, top + Math.round(s * 0.30), 3, Math.round(s * 0.46), 1);
    g.fillStyle = 'rgba(255,255,255,.22)';
    g.fillRect(left - 2, top + Math.round(s * 0.30), 2, 1);
    g.fillRect(left + s, top + Math.round(s * 0.30), 2, 1);
  }
  if (skin && skin.horn) {
    g.fillStyle = edge;
    g.fillRect(left - 1, top + 1, 1, 3);
    g.fillRect(left + s, top + 1, 1, 3);
  }

  // 深色软边 + 圆润身体
  g.fillStyle = o.flash ? '#ffffff' : edge;
  fillRound(g, left, top, s, s, r);
  g.fillStyle = o.flash ? '#ffffff' : o.color;
  fillRound(g, left + 1, top + 1, s - 2, s - 2, Math.max(0, r - 1));

  if (!o.flash) {
    // 底部暗面，让软泥有体积
    g.fillStyle = 'rgba(0,0,0,.16)';
    fillRound(g, left + 1, top + Math.round(s * 0.66), s - 2, Math.max(1, Math.round(s * 0.34) - 1), Math.max(0, r - 1));
    // 左上高光
    g.fillStyle = 'rgba(255,255,255,.34)';
    fillRound(g, left + Math.max(2, Math.round(s * 0.20)), top + Math.max(1, Math.round(s * 0.15)),
      Math.max(2, Math.round(s * 0.26)), Math.max(1, Math.round(s * 0.16)), 1);
  }

  // 类型特征
  if (type === 'fast') {
    // 两侧速度鳍
    g.fillStyle = edge;
    g.fillRect(left - 1, top + Math.round(s * 0.45), 1, 2);
    g.fillRect(left + s, top + Math.round(s * 0.45), 1, 2);
  } else if (type === 'shooter' && s >= 8) {
    // 头顶炮口 + 冷光芯
    g.fillStyle = edge;
    g.fillRect(mid - 1, top - 2, 3, 3);
    g.fillStyle = '#bff4ff';
    g.fillRect(mid, top - 2, 1, 1);
  } else if (type === 'tank' && s >= 10) {
    // 甲壳腰带 + 铆钉（放在眼睛下方，不遮挡眼睛）
    const by = top + Math.round(s * 0.72);
    g.fillStyle = edge;
    g.fillRect(left + 1, by, s - 2, 2);
    g.fillStyle = 'rgba(255,255,255,.30)';
    g.fillRect(left + 2, by, 1, 1);
    g.fillRect(left + s - 3, by, 1, 1);
  } else if (type === 'poisoner') {
    // 头顶毒囊：一小包冒泡的绿液
    g.fillStyle = edge;
    g.fillRect(mid - 2, top - 2, 4, 3);
    g.fillStyle = 'rgba(180,255,170,.85)';
    g.fillRect(mid - 1, top - 1, 2, 1);
    g.fillStyle = 'rgba(125,220,125,.75)';
    g.fillRect(left + 1, top + s - 2, 1, 1);
    g.fillRect(left + s - 2, top + s - 2, 1, 1);
  } else if (type === 'frost') {
    // 冰棱甲：头顶碎冰尖
    g.fillStyle = '#dff4ff';
    g.fillRect(mid - 1, top - 3, 1, 2);
    g.fillRect(left + 1, top - 2, 1, 2);
    g.fillRect(left + s - 2, top - 2, 1, 2);
    g.fillStyle = 'rgba(143,216,255,.7)';
    g.fillRect(left + 1, top + s - 2, s - 2, 1);
  } else if (type === 'bomber') {
    // 自爆兵：头顶引信 + 腰间红带
    g.fillStyle = edge;
    g.fillRect(mid, top - 3, 1, 3);
    g.fillStyle = '#ffd166';
    g.fillRect(mid, top - 4, 1, 1);
    g.fillStyle = '#a83a1c';
    g.fillRect(left + 1, top + Math.round(s * 0.70), s - 2, 1);
  }

  // 眼睛：黑豆眼（大体型带一点白色高光）
  const ec = o.eye || '#15101e';
  const ey = top + Math.round(s * 0.40);
  if (s >= 18) {
    g.fillStyle = ec;
    g.fillRect(left + 3, ey, 3, 3);
    g.fillRect(left + s - 6, ey, 3, 3);
    g.fillStyle = 'rgba(255,255,255,.9)';
    g.fillRect(left + 4, ey + 1, 1, 1);
    g.fillRect(left + s - 5, ey + 1, 1, 1);
  } else if (s >= 10) {
    g.fillStyle = ec;
    g.fillRect(left + 2, ey, 2, 2);
    g.fillRect(left + s - 4, ey, 2, 2);
  } else if (s >= 8) {
    g.fillStyle = ec;
    g.fillRect(left + 2, ey, 1, 2);
    g.fillRect(left + s - 3, ey, 1, 2);
  } else {
    g.fillStyle = ec;
    g.fillRect(left + 1, ey + 1, 1, 1);
    g.fillRect(left + s - 2, ey + 1, 1, 1);
  }

  if (!skin) return;

  // BOSS：冠冕尖刺（沿头顶弧线，数量随世代增加）
  g.fillStyle = '#0b0b13';
  const n = skin.spikes;
  const insetX = Math.max(2, Math.round(s * 0.18));
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const dx = insetX + Math.round(t * (s - insetX * 2));
    const isMid = i === Math.floor(n / 2);
    const hgt = isMid ? 4 : 3;
    g.fillRect(left + dx, top - hgt + 2, 1, hgt);
    g.fillRect(left + dx - 1, top, 1, 1);
    g.fillRect(left + dx + 1, top, 1, 1);
  }

  // 终焉核心
  if (skin.core) {
    const cs = 4;
    const cx = left + Math.round((s - cs) / 2), cy = top + Math.round(s * 0.64);
    g.fillStyle = '#2a0f08';
    g.fillRect(cx, cy, cs, cs);
    g.fillStyle = '#ffe066';
    g.fillRect(cx + 1, cy + 1, 2, 2);
  }

  // 第五代：橙金外环，远看就能认出熔核形态
  if (skin.nova) {
    const cx = left + Math.round(s / 2), cy = top + Math.round(s / 2);
    const rr = Math.round(s / 2) + 3;
    g.fillStyle = 'rgba(255,196,90,.6)';
    for (let i = 0; i < 12; i += 2) {
      const a = (i / 12) * TAU;
      g.fillRect(Math.round(cx + Math.cos(a) * rr), Math.round(cy + Math.sin(a) * rr), 1, 1);
    }
  }
}

function drawEnemy(e) {
  const t = ETYPES[e.type];
  const s = Math.round(e.r * 2);
  const x = Math.round(e.x), y = Math.round(e.y);
  const left = x - Math.round(s / 2), top = y - Math.round(s / 2);
  const isBoss = e.type === 'boss';
  const gen = isBoss ? Math.max(1, e.gen || 1) : 0;
  const bodyCol = isBoss ? BOSS_SKIN[Math.min(gen, BOSS_SKIN.length) - 1].col : t.color;
  const edgeCol = isBoss ? BOSS_SKIN[Math.min(gen, BOSS_SKIN.length) - 1].edge : (t.edge || '#1b1b2b');

  // 突进预警：冲锋精英冲刺前 0.28s / BOSS 冲锋阶段 / 自爆兵点燃引信，白色描边 + 头顶感叹号
  const fuse = e.fuseT > 0;
  const warn = fuse || (e.affix === 'charge' && (e.boost > 0 || e.chargeT < 0.28)) || (isBoss && e.boost > 0);

  if (e.affix) {
    const ac = AFFIX[e.affix].col;
    ctx.globalAlpha = warn ? 0.9 : 0.55 + 0.2 * Math.sin(time * 5 + e.id);
    ctx.fillStyle = warn ? '#ffffff' : ac;
    ctx.fillRect(left - 3, top - 3, s + 6, 1);
    ctx.fillRect(left - 3, top + s + 2, s + 6, 1);
    ctx.fillRect(left - 3, top - 3, 1, s + 6);
    ctx.fillRect(left + s + 2, top - 3, 1, s + 6);
    ctx.globalAlpha = 1;
  } else if (warn) {
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(left - 2, top - 2, s + 4, 1);
    ctx.fillRect(left - 2, top + s + 1, s + 4, 1);
    ctx.fillRect(left - 2, top - 2, 1, s + 4);
    ctx.fillRect(left + s + 1, top - 2, 1, s + 4);
    ctx.globalAlpha = 1;
  }

  ctx.globalAlpha = 0.22;
  ctx.fillStyle = bodyCol;
  ctx.fillRect(left - 1, top - 1, s + 2, s + 2);
  ctx.globalAlpha = 1;

  paintMonster(ctx, left, top, s, { color: bodyCol, edge: edgeCol, type: e.type, gen, flash: e.flash > 0 });

  // 第五代熔核过载：血量低于 35% 时外圈亮起旋转的橙金火星
  if (isBoss && gen >= 5 && e.hp <= e.maxHp * 0.35) {
    const rr = e.r + 5;
    ctx.fillStyle = '#ffb14a';
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU + time * 0.6;
      ctx.globalAlpha = 0.35 + 0.35 * Math.sin(time * 6 + i);
      ctx.fillRect(Math.round(x + Math.cos(a) * rr), Math.round(y + Math.sin(a) * rr), 2, 2);
    }
    ctx.globalAlpha = 1;
  }

  // 头顶感叹号
  if (warn) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, top - 8, 1, 3);
    ctx.fillRect(x, top - 4, 1, 1);
  }
}

/* ============================================================
   小勇士像素精灵：字符画 → 离屏画布 1:1 烘焙，再原样绘制
   ============================================================ */
/* 每个小英雄一套 16×16 字符画：剪影各不相同，商店立绘与场上小人共用同一份数据 */
const HERO_W = 16, HERO_H = 16;
const HERO_ART = {
  scout: {
    /* 黄帽冒险者：帽檐双色、红围巾、蓝上衣浅色胸甲、金腰带、皮靴 */
    pal: { k: '#1b1418', H: '#ffe066', h: '#e0a93a', o: '#8a5c22', s: '#f7cfa6', m: '#b8624a', e: '#1a202c', r: '#e05a4e', b: '#35548c', B: '#8fc0f0', g: '#ffcf5c' },
    art: [
      '.....kkkkkk.....',
      '....kHHHHHHk....',
      '...kHhhhhhhHk...',
      '...kkhhhhhhkk...',
      '..kooooooooook..',
      '...kssssssssk...',
      '...ksseesseek...',
      '...ksssmssssk...',
      '...krrrrrrrrk...',
      '..kbbrrrrrrbbk..',
      '..kbBBBBBBBBbk..',
      '..kbBBggggBBbk..',
      '...kbbbbbbbbk...',
      '....kk..kk......',
      '....oo..oo......',
      '...ooo..ooo.....',
    ],
  },
  guanyu: {
    /* 关羽：绿盔金甲、红脸长须、手持青龙偃月刀 */
    pal: { k: '#161210', G: '#2f7d4f', g: '#5fc97f', s: '#e08a6a', S: '#b9634a', e: '#241512', n: '#1d1c26', N: '#3a3950', y: '#cfe6ff', m: '#7a5230', gd: '#ffcf5c' },
    art: [
      '.....kkkkkk..yyy',
      '....kGGGGGGk.yyy',
      '...kGggggggGk.yy',
      '..kGGggggggGGkm.',
      '...ksSssssSsk.m.',
      '...ksseesseek.m.',
      '...kssssSsssk.m.',
      '...knnnnnnnnk.m.',
      '..knnnnnnnnnnk.m',
      '..kGnnNNnnnnGk.m',
      '..kGGyyyyyyGGk.m',
      '..kGggggggggGk.m',
      '...kGGGGGGGGk.m.',
      '....kk..kk......',
      '...GG..GG.......',
      '..kkk..kkk......',
    ],
  },
  truck: {
    /* 泥头车：侧视重卡 —— 梯形高顶驾驶室、大侧窗、前脸格栅与大灯、长货箱装泥、银色保险杠、双大轮 */
    pal: { k: '#0e0e14', Y: '#f2a13c', y: '#b96e20', d: '#6b3d14', M: '#a08050', B: '#1e2c44', l: '#7fc0ff', L: '#ffe066', W: '#3a3a46', w: '#9aa2b4' },
    art: [
      'MMdMMMdMM.YYYYY.',
      'kyyyyyyyykYYYYYk',
      'kYYYYYYYYklBBBYk',
      'kYYYYYYYYkBBBBYk',
      'kYYYYYYYYkBBBlWk',
      'kYYYYYYYYkYYYYkk',
      'kYYYYYYYYkYYYYWk',
      'kYYYYYYYYkYYYYWk',
      'kddddddddkYYYYLL',
      'WWWWWWWWWwwwwwww',
      '.kkkk......kkkk.',
      'kWWWWk....kWWWWk',
      'kWwwWk....kWwwWk',
      'kWwwWk....kWwwWk',
      'kWWWWk....kWWWWk',
      '.kkkk......kkkk.',
    ],
  },
  moto: {
    /* 摩托：侧视街车（无骑手）—— 风挡、车把后视镜、蓝色油箱与车头、大灯、银色排气管、发动机、双大轮 */
    pal: { k: '#0e0e14', B: '#2f6fd0', b: '#1d2b44', l: '#7fbcff', W: '#3a3a46', w: '#a8b2c2', L: '#ffe066', R: '#ff4d5e', u: '#c8d2dc', g: '#bfe9ff' },
    art: [
      'kk...kkkkkkggk.k',
      'BBk.kBllllBggkku',
      'BBkkkBBBBBBkuuuu',
      'BbbbbBBBBBWBBllk',
      'RbbbbBBBBBWBBBLL',
      'kkkkWWWWWWWBBBLL',
      'uukkWWwwwWWBBuBk',
      'uuuuWWWWWWWWkuk.',
      'kkkkWWWWWWkkkukk',
      'kBWWWWWWWWWBBBBB',
      '.kkkkkkkkkkkkkkk',
      'kWWWWk....kWWWWk',
      'kWwwWk....kWwwWk',
      'kWwwWk....kWwwWk',
      'kWWWWk....kWWWWk',
      '.kkkk......kkkk.',
    ],
  },
  diaper: {
    /* 尿不湿：不戴帽 —— 卷毛、耳朵、黑豆眼带高光、腮红、奶嘴、白尿布与手臂小腿 */
    pal: { k: '#2a2020', h: '#8a5c3a', s: '#f7cfa6', e: '#2a1c14', R: '#ff8fa3', r: '#ffb3c1', w: '#f5f5ee', W: '#d8d8c8' },
    art: [
      '....khhhhk......',
      '...kssssssk.....',
      '..kssssssssk....',
      '..ksswsswssk....',
      '.ksssessesssk...',
      '..krssssssrk....',
      '..ksssRwRssk....',
      '..kssssssssk....',
      'kkwwwwwwwwwwkk..',
      'sswwwwwwwwwwssk.',
      'sswwwwwwwwwwssk.',
      'kwwwWWwwWWwwwk..',
      'kwwwwwwwwwwwwk..',
      '.kwwwwwwwwwwk...',
      '..kksskksskk....',
      '....kk..kk......',
    ],
  },
  ninja: {
    /* 忍者：尖顶黑蓝斗篷、深色面罩里一双冷光眼、红围巾与绑腿，不带武器 */
    pal: { k: '#101018', N: '#232a4a', n: '#39406b', M: '#171c30', e: '#7ef0ff', R: '#e0504a', b: '#2c3350', o: '#0e0e16' },
    art: [
      '......kkkk......',
      '.....kNNNNk.....',
      '....kNNNNNNk....',
      '...kNNNNNNNNk...',
      '..kNNNNNNNNNNk..',
      '...kMMMMMMMMk...',
      '...kMeeMMeeMk...',
      '...kMMMMMMMMk...',
      '...kRRRRRRRRk...',
      '..kbRRRRRRRbbk..',
      '..kbNbbbbbbNbk..',
      '..kbbbbbbbbbbk..',
      '...kbbbbbbbbk...',
      '....kk..kk......',
      '....o....o......',
      '...oo....oo.....',
    ],
  },
  smith: {
    /* 铁匠：棕头巾、连鬓胡、皮围裙，双手是发着橙光的炉火，不带武器 */
    pal: { k: '#171310', B: '#8a5230', b: '#b06b3c', s: '#e7a877', S: '#c07d52', d: '#3a2a1e', A: '#553a28', a: '#6f4c33', E: '#ff9a3c', e: '#ff9a3c', f: '#241f1f' },
    art: [
      '....kkkkkk......',
      '...kBBBBBBk.....',
      '..kBbbbbbbBk....',
      '..kBbbbbbbBk....',
      '..kssssssssk....',
      '..ksseessssk....',
      '..ksssSsssSk....',
      '..kddddddddk....',
      '..kAAaaaaAAk....',
      '.ksAAaaaaAAsk...',
      '.kEAAaaaaAAEk...',
      '..kAaaaaaaAk....',
      '..kAaaaaaaAk....',
      '...kk..kk.......',
      '...ff..ff.......',
      '..fff..fff......',
    ],
  },
  firefly: {
    /* 萤火：一对触角、会发光的萤绿身体、半透明翅膀与金色腹灯，像一只会走的小灯 */
    pal: { k: '#14201a', G: '#7fe08a', Y: '#ffe066', e: '#1a2418', w: '#dff8ff', a: '#9ad86a' },
    art: [
      '...k......k.....',
      '...a.k..k.a.....',
      '..kkkkkkkkkk....',
      '..kGGGGGGGGk....',
      '..kGYGGGGYGk....',
      '..kGeeGGeeGk....',
      '..kGGGGGGGGk....',
      '..kwGGGGGGwk....',
      '.kwwkGGGGkwwk...',
      '.kwwkGGGGkwwk...',
      '..kwkGGGGkwk....',
      '...kGGGGGGk.....',
      '...kGYYYGGk.....',
      '....kk..kk......',
      '...k......k.....',
      '..kk......kk....',
    ],
  },
};

/* 缓存：id|帧|描边白 → 离屏画布 */
const HERO_SPR = {};
function shiftRow(r, dx) {
  return dx > 0 ? (' ' + r).slice(0, HERO_W) : (r + ' ').slice(-HERO_W);
}
function heroSprite(id, frame, white) {
  const key = (id || 'scout') + '|' + (frame ? 1 : 0) + (white ? '|w' : '');
  if (HERO_SPR[key]) return HERO_SPR[key];
  const art = HERO_ART[id] || HERO_ART.scout;
  const legs = art.art.slice(13);
  const walk = frame ? legs.map((r) => shiftRow(r, 1)) : legs;
  const c = document.createElement('canvas');
  c.width = HERO_W; c.height = HERO_H;
  const g = c.getContext('2d');
  for (let y = 0; y < HERO_H; y++) {
    const row = y < 13 ? art.art[y] : walk[y - 13];
    if (!row) continue;
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.' || ch === ' ') continue;
      const col = white ? '#ffffff' : art.pal[ch];
      if (!col) continue;
      g.fillStyle = col;
      g.fillRect(x, y, 1, 1);
    }
  }
  HERO_SPR[key] = c;
  return c;
}

/* ---- 标题封面：黄昏草甸（烘焙一张 320×180 场景） ---- */
function bakeCover(g) {
  const r = lcg(1937465);

  // 黄昏天空
  const sky = g.createLinearGradient(0, 0, 0, 64);
  sky.addColorStop(0, '#232a55');
  sky.addColorStop(0.3, '#4b3d6e');
  sky.addColorStop(0.55, '#8a5270');
  sky.addColorStop(0.76, '#cf6f60');
  sky.addColorStop(0.9, '#ee9a5e');
  sky.addColorStop(1, '#ffc47c');
  g.fillStyle = sky;
  g.fillRect(0, 0, W, 64);

  // 星
  for (let i = 0; i < 44; i++) {
    const x = Math.floor(r() * W), y = Math.floor(r() * 32);
    g.fillStyle = 'rgba(255,246,220,' + (0.22 + r() * 0.5).toFixed(2) + ')';
    g.fillRect(x, y, 1, 1);
    if (r() < 0.14) { g.fillRect(x + 1, y, 1, 1); g.fillRect(x, y + 1, 1, 1); }
  }

  // 落日
  const sx = 240, sy = 34;
  const halo = g.createRadialGradient(sx, sy, 2, sx, sy, 30);
  halo.addColorStop(0, 'rgba(255,240,190,.60)');
  halo.addColorStop(0.4, 'rgba(255,198,120,.22)');
  halo.addColorStop(1, 'rgba(255,180,100,0)');
  g.fillStyle = halo;
  g.fillRect(sx - 32, sy - 32, 64, 64);
  g.fillStyle = '#ffe9b4';
  for (let y = -8; y <= 8; y++) {
    const hw = Math.round(Math.sqrt(64 - y * y));
    g.fillRect(sx - hw, sy + y, hw * 2, 1);
  }
  g.fillStyle = 'rgba(255,255,228,.5)';
  for (let y = -5; y <= 1; y += 3) {
    const hw = Math.round(Math.sqrt(25 - y * y) * 0.8);
    if (hw > 0) g.fillRect(sx - hw, sy + y, hw * 2, 1);
  }

  // 云带
  const bands = [[16, 48, 86], [206, 52, 76], [118, 44, 58]];
  for (const [bx, by, bw] of bands) {
    for (let i = 0; i < bw; i++) {
      const t = i / bw;
      const th = 2 + Math.round(1.5 * Math.sin(t * Math.PI * 3));
      g.fillStyle = 'rgba(255,214,170,' + (0.09 + 0.08 * Math.sin(t * Math.PI)).toFixed(2) + ')';
      g.fillRect(bx + i, by - th, 1, th * 2);
    }
  }

  // 山脊（远山两层 + 草丘两层）
  const ridge = (base, amp, ph, freq, col, rim) => {
    for (let x = 0; x < W; x++) {
      const h = Math.round(amp * Math.sin(x * freq + ph) + amp * 0.45 * Math.sin(x * freq * 2.6 + ph * 1.8));
      const top = base - h;
      g.fillStyle = col;
      g.fillRect(x, top, 1, H - top);
      if (rim) { g.fillStyle = 'rgba(255,196,138,.14)'; g.fillRect(x, top, 1, 1); }
    }
  };
  ridge(56, 10, 1.1, 0.018, '#4a4470', true);
  ridge(60, 7, 4.3, 0.031, '#373356', false);
  ridge(66, 6, 0.6, 0.014, '#33603a', true);
  ridge(70, 5, 2.4, 0.026, '#294d31', false);

  // 松树与灌木
  const pine = (x, y, h) => {
    g.fillStyle = '#17301f';
    for (let i = 0; i < h; i++) {
      const w = Math.round((i + 1) * 0.42);
      g.fillRect(x - w, y - i, w * 2 + 1, 1);
    }
    g.fillStyle = '#0f2418';
    g.fillRect(x - 1, y + 1, 2, 5);
    g.fillStyle = 'rgba(255,190,120,.14)';
    g.fillRect(x - Math.round(h * 0.42), y - h + 1, 1, Math.floor(h / 2));
  };
  pine(22, 68, 14); pine(40, 70, 10); pine(302, 66, 15); pine(314, 70, 10);

  const bush = (x, y, rad, col) => {
    g.fillStyle = col;
    for (let yy = -rad; yy <= rad; yy += 2) {
      const hw = Math.round(Math.sqrt(Math.max(0, 1 - (yy / rad) * (yy / rad))) * rad);
      g.fillRect(x - hw, y + yy, hw * 2, 2);
    }
    g.fillStyle = 'rgba(255,200,130,.12)';
    g.fillRect(x - rad + 1, y - 2, 2, 1);
  };
  bush(64, 72, 6, '#234a2b');
  bush(276, 76, 7, '#204428');

  // 前景草甸：顶部起伏边缘
  const mg = g.createLinearGradient(0, 64, 0, H);
  mg.addColorStop(0, '#7bb553');
  mg.addColorStop(0.45, '#5f9c46');
  mg.addColorStop(1, '#38653a');
  g.fillStyle = mg;
  for (let x = 0; x < W; x++) {
    const top = 64 + Math.round(2.5 * Math.sin(x * 0.045 + 0.6) + 2 * Math.sin(x * 0.11 + 2.1));
    g.fillRect(x, top, 1, H - top);
  }

  // 草甸纹理与小花
  for (let i = 0; i < 420; i++) {
    const x = Math.floor(r() * W), y = 70 + Math.floor(r() * (H - 70)), len = 1 + Math.floor(r() * 2);
    g.fillStyle = r() < 0.5 ? 'rgba(146,208,104,.28)' : 'rgba(34,74,34,.34)';
    g.fillRect(x, y, 1, len);
  }
  for (let i = 0; i < 22; i++) {
    const x = 2 + Math.floor(r() * (W - 4)), y = 76 + Math.floor(r() * (H - 82));
    const petal = ['#ffe9b0', '#ffbcae', '#cfe6ff'][Math.floor(r() * 3)];
    g.fillStyle = 'rgba(60,108,50,.9)';
    g.fillRect(x, y + 1, 1, 2);
    g.fillStyle = petal;
    g.fillRect(x - 1, y, 1, 1); g.fillRect(x + 1, y, 1, 1); g.fillRect(x, y - 1, 1, 1); g.fillRect(x, y + 1, 1, 1);
    g.fillStyle = '#ffb648';
    g.fillRect(x, y, 1, 1);
  }

  // 近景高草剪影
  for (let x = 0; x < W; x++) {
    const h = 4 + Math.round(3 * Math.sin(x * 0.07 + 1.4) + 2 * Math.sin(x * 0.23));
    g.fillStyle = '#152c1c';
    g.fillRect(x, H - h, 1, h);
  }
}

const COVER_BG = (() => {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  bakeCover(g);
  return c;
})();

// 封面萤火
const COVER_FLY = [];
{
  const r = lcg(515253);
  for (let i = 0; i < 20; i++) {
    COVER_FLY.push({ x: r() * W, y: 36 + r() * 126, sp: 2 + r() * 5, ph: r() * TAU, amp: 1 + r() * 2.5 });
  }
}

/* 标题页立绘：直接放大已烘焙的精灵，保持像素锐利 */
const titleArtCtx = $('#titleArt').getContext('2d');
const coverCtx = $('#coverArt').getContext('2d');
coverCtx.imageSmoothingEnabled = false;
const COVER_HERO_GLOW = coverCtx.createRadialGradient(252, 150, 2, 252, 150, 34);
COVER_HERO_GLOW.addColorStop(0, 'rgba(255,222,152,.75)');
COVER_HERO_GLOW.addColorStop(0.55, 'rgba(255,196,110,.26)');
COVER_HERO_GLOW.addColorStop(1, 'rgba(255,180,90,0)');

function drawTitleArt(ts) {
  const frame = Math.floor(ts / 260) % 2;
  const hero = currentHero();
  titleArtCtx.clearRect(0, 0, HERO_W, HERO_H);
  titleArtCtx.drawImage(heroSprite(hero.id, frame), 0, 0);
  const artName = $('#artName');
  if (artName && artName.dataset.hero !== hero.id) {
    artName.dataset.hero = hero.id;
    artName.textContent = hero.name;
  }

  const g = coverCtx, t = ts / 1000;
  g.clearRect(0, 0, W, H);
  g.drawImage(COVER_BG, 0, 0);

  // 萤火
  for (const f of COVER_FLY) {
    const y = ((f.y - t * f.sp) % 170 + 170) % 170;
    const x = f.x + Math.sin(t * 0.7 + f.ph) * f.amp;
    g.globalAlpha = 0.30 + 0.30 * Math.sin(t * 1.8 + f.ph);
    g.fillStyle = '#ffe9a8';
    g.fillRect(Math.round(x), Math.round(y), 1, 1);
    g.globalAlpha = 0.10;
    g.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3);
  }
  g.globalAlpha = 1;

  // 站在草甸上的主角（3×）
  const hx = 252, hy = 168 + Math.round(Math.sin(t * 1.2));
  g.fillStyle = 'rgba(8,20,10,.38)';
  g.fillRect(hx - 12, hy - 1, 24, 1);
  g.fillRect(hx - 7, hy, 15, 1);
  g.globalAlpha = 0.55 + 0.12 * Math.sin(t * 2.2);
  g.fillStyle = COVER_HERO_GLOW;
  g.fillRect(0, 0, W, H);
  g.globalAlpha = 1;
  g.drawImage(heroSprite(currentHero().id, frame), Math.round(hx - HERO_W * 1.5), Math.round(hy - HERO_H * 3), HERO_W * 3, HERO_H * 3);
}

function drawPlayer() {
  const p = player;
  const x = Math.round(p.x), y = Math.round(p.y);
  const frame = Math.floor(time * 7) % 2;
  const spr = heroSprite(p.hero, frame, p.flash > 0);
  const ox = -Math.floor(HERO_W / 2), oy = -Math.floor(HERO_H / 2);

  // 脚下柔光，让角色从深色背景里浮起来
  ctx.fillStyle = PGLOW;
  ctx.beginPath();
  ctx.arc(x, y, 24, 0, TAU);
  ctx.fill();

  // 出战英雄的专属色环，让不同角色一眼可辨
  ctx.globalAlpha = 0.38;
  ctx.strokeStyle = p.heroCol || '#63d9ff';
  ctx.beginPath();
  ctx.arc(x, y, 9, 0, TAU);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // 冲刺残影
  if (p.dashT > 0) {
    ctx.globalAlpha = 0.28;
    for (let i = 1; i <= 3; i++) {
      ctx.drawImage(spr,
        Math.round(x - p.dashDx * i * 6) + ox,
        Math.round(y - p.dashDy * i * 6) + oy);
    }
    ctx.globalAlpha = 1;
  }

  // 无敌闪烁
  if (p.invuln > 0 && p.dashT <= 0 && Math.floor(time * 14) % 2 === 0) {
    ctx.globalAlpha = 0.35;
  }

  // 朝向：向左移动时水平镜像，披风自然甩在身后
  const flip = p.dirx < 0 ? -1 : 1;
  const bob = (p.dirx || p.diry) && p.dashT <= 0 ? Math.floor(time * 9) % 2 : 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(p.dashT > 0 ? flip * 1.12 : flip, 1);
  ctx.drawImage(spr, ox, oy + bob);
  ctx.restore();

  ctx.globalAlpha = 1;

  // 充能指示
  const total = Math.min(p.stats.dashCharges, 5);
  for (let i = 0; i < total; i++) {
    const filled = i < p.dashCharges;
    ctx.fillStyle = filled ? '#5ce1ff' : '#1e3a4a';
    ctx.fillRect(x - total * 3 + i * 6, y + 9, 4, 2);
  }

  // 光环
  if (p.stats.auraR > 0) {
    ctx.globalAlpha = 0.10;
    ctx.fillStyle = '#b57bff';
    ctx.beginPath();
    ctx.arc(x, y, p.stats.auraR, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = '#b57bff';
    ctx.beginPath();
    ctx.arc(x, y, p.stats.auraR, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // 缓速力场（虚线边界，提示减速生效范围）
  if (p.stats.slowR > 0) {
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = '#63d9ff';
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.arc(x, y, p.stats.slowR, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }
}

// 沙暴整屏层：先画满沙尘，再以玩家为中心抠出视野圈，避免把游戏画面一起擦掉
let sandFx = null;
function sandFxCanvas() {
  if (!sandFx) {
    sandFx = document.createElement('canvas');
    sandFx.width = W;
    sandFx.height = H;
  }
  return sandFx;
}

function render() {
  ctx.save();
  if (shake > 0.15) {
    ctx.translate(irand(-1, 1) * Math.min(3, shake * 0.6), irand(-1, 1) * Math.min(3, shake * 0.6));
  }

  // 背景（按地图主题：草原 / 雪原 / 熔岩，见 01-core.js 的 bakeSnow / bakeLava）
  drawBackdrop();

  // 冰面 / 流沙：踩上去会明显变慢（同一套地形数据，按地图换材质）
  const onSnow = map.id === 'snow';
  const onSand = map.id === 'desert';
  const onRain = map.id === 'rain';
  for (const i of terrain.ice) {
    if (onRain) {
      // 雨夜水洼：暗蓝积水 + 冷光边缘 + 一条路灯倒影
      ctx.globalAlpha = 0.62;
      ctx.fillStyle = '#122238';
      ctx.beginPath();
      ctx.ellipse(i.x, i.y, i.r, i.r * 0.56, 0, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 0.40;
      ctx.strokeStyle = '#7fb2e8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(i.x, i.y, i.r, i.r * 0.56, 0, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = '#bfe0ff';
      ctx.fillRect(Math.round(i.x - i.r * 0.5), Math.round(i.y - 1), Math.round(i.r), 1);
      continue;
    }
    ctx.globalAlpha = onSnow ? 0.5 : onSand ? 0.42 : 0.30;
    ctx.fillStyle = onSnow ? '#9fd4f2' : onSand ? '#d8a860' : '#bfe9ff';
    ctx.beginPath();
    ctx.ellipse(i.x, i.y, i.r, i.r * 0.62, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = onSnow ? 0.34 : onSand ? 0.30 : 0.16;
    ctx.strokeStyle = onSnow ? '#f0fbff' : onSand ? '#f6d99a' : '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(i.x, i.y, i.r, i.r * 0.62, 0, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = onSnow ? 0.26 : onSand ? 0.22 : 0.16;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(i.x - 2, i.y - 2, i.r * 0.66, i.r * 0.36, 0, 0, TAU);
    ctx.fill();
    if (onSand) {
      // 流沙漩涡：两道同心弧，和雪地/冰面的可读性区分开
      ctx.globalAlpha = 0.34;
      ctx.strokeStyle = '#a97a3f';
      ctx.beginPath();
      ctx.ellipse(i.x, i.y, i.r * 0.62, i.r * 0.34, 0.4, 0, TAU * 0.7);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;

  // 岩石：阴影 + 主体 + 顶部高光（雪原雪盖 / 荒漠砂石 / 霓虹金属块）
  const rockBody = map.id === 'snow' ? '#8fa3b8' : map.id === 'desert' ? '#8a6a44'
    : map.id === 'neon' ? '#232438' : map.id === 'rain' ? '#28344a' : '#3d2b28';
  const rockTop = map.id === 'snow' ? '#c6d6e4' : map.id === 'desert' ? '#c99a5e'
    : map.id === 'neon' ? '#3a3f63' : map.id === 'rain' ? '#4c6180' : '#7d4630';
  for (const r of terrain.rocks) {
    ctx.fillStyle = 'rgba(0,0,0,.30)';
    ctx.beginPath();
    ctx.ellipse(r.x + 1, r.y + 3, r.r, r.r * 0.55, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rockBody;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.r, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rockTop;
    ctx.fillRect(Math.round(r.x - r.r / 2), Math.round(r.y - r.r / 2), Math.max(2, Math.round(r.r)), 2);
    if (map.id === 'neon') {
      ctx.globalAlpha = 0.7;
      ctx.strokeStyle = '#ff6bd6';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  // 陨石预警：闪烁落点圈
  for (const m of meteors) {
    if (m.explode) continue;
    const k = 1 - Math.max(0, m.warn) / 1.1;
    const pulse = 0.5 + 0.5 * Math.sin(time * 18);
    ctx.globalAlpha = 0.25 + 0.35 * pulse;
    ctx.strokeStyle = '#ff8a4a';
    ctx.beginPath();
    ctx.arc(m.x, m.y, 15, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#ff8a4a';
    ctx.beginPath();
    ctx.arc(m.x, m.y, 15 * k, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  if (!player) { ctx.restore(); return; }

  // 边框
  ctx.strokeStyle = '#26264a';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

  // 火焰尾迹
  for (const t of trails) {
    const a = Math.max(0, t.life / t.max);
    ctx.globalAlpha = 0.5 * a;
    ctx.fillStyle = '#ff8a3d';
    ctx.fillRect(Math.round(t.x) - 2, Math.round(t.y) - 2, 4, 4);
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(Math.round(t.x) - 1, Math.round(t.y) - 1, 2, 2);
  }
  ctx.globalAlpha = 1;

  // 经验球
  for (const o of orbs) {
    const pulse = 1 + Math.sin(time * 12 + o.x) * 0.4;
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = '#7ef0ff';
    ctx.fillRect(Math.round(o.x) - 3, Math.round(o.y) - 3, 6, 6);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#bff8ff';
    const s = Math.round(2 * pulse);
    ctx.fillRect(Math.round(o.x) - Math.round(s / 2), Math.round(o.y) - Math.round(s / 2), s, s);
  }

  // 掉落物：换牌卡 / 金币 / 血包
  for (const d of drops) {
    const bob = Math.sin(time * 4 + d.t) * 1.5;
    const x = Math.round(d.x), y = Math.round(d.y + bob);
    const kind = d.kind || 'reroll';
    if (kind === 'coin') {
      const pulse = 0.18 + 0.14 * Math.abs(Math.sin(time * 6 + d.t));
      ctx.fillStyle = 'rgba(255,215,74,' + pulse.toFixed(2) + ')';
      ctx.fillRect(x - 4, y - 5, 9, 11);
      ctx.fillStyle = '#c99516';
      ctx.fillRect(x - 3, y - 4, 7, 9);
      ctx.fillStyle = '#ffd54a';
      ctx.fillRect(x - 2, y - 3, 5, 7);
      ctx.fillStyle = '#fff0a8';
      ctx.fillRect(x - 1, y - 1, 2, 3);
    } else if (kind === 'hp') {
      const pulse = 0.18 + 0.14 * Math.abs(Math.sin(time * 6 + d.t));
      ctx.fillStyle = 'rgba(255,107,122,' + pulse.toFixed(2) + ')';
      ctx.fillRect(x - 4, y - 5, 9, 11);
      ctx.fillStyle = '#8c1f2c';
      ctx.fillRect(x - 3, y - 4, 7, 9);
      ctx.fillStyle = '#ff6b7a';
      ctx.fillRect(x - 1, y - 3, 3, 7);
      ctx.fillRect(x - 2, y - 1, 5, 3);
      ctx.fillStyle = '#ffd0d6';
      ctx.fillRect(x - 1, y - 1, 1, 3);
    } else {
      const pulse = 0.16 + 0.12 * Math.abs(Math.sin(time * 5 + d.t));
      ctx.fillStyle = 'rgba(255,224,102,' + pulse.toFixed(2) + ')';
      ctx.fillRect(x - 5, y - 6, 11, 13);
      ctx.fillStyle = 'rgba(0,0,0,.45)';
      ctx.fillRect(x - 4, y - 5, 9, 11);
      ctx.fillStyle = '#ffd54a';
      ctx.fillRect(x - 3, y - 4, 7, 9);
      ctx.fillStyle = '#c9a227';
      ctx.fillRect(x - 2, y - 3, 5, 1);
      ctx.fillRect(x - 2, y - 1, 5, 1);
      ctx.fillStyle = '#8a6a00';
      ctx.fillRect(x - 2, y + 1, 5, 1);
      ctx.fillRect(x - 2, y + 3, 3, 1);
    }
  }

  // 地面区域：毒雾绿点云 / 熔岩橙红余烬 / 霓虹电栅青色电弧，随剩余时间淡出
  for (const h of hazards) {
    const lava = h.kind === 'lava';
    const shock = h.kind === 'shock';
    const a = Math.min(1, h.life / (h.max || 5));
    const pulse = 0.5 + 0.5 * Math.sin(time * (lava ? 9 : shock ? 16 : 6) + h.x);
    ctx.globalAlpha = (lava ? 0.16 : shock ? 0.10 : 0.10) * a;
    ctx.fillStyle = lava ? '#ff6a3d' : shock ? '#5ce1ff' : '#7ddc7d';
    ctx.fillRect(Math.round(h.x - h.r), Math.round(h.y - h.r), h.r * 2, h.r * 2);
    ctx.globalAlpha = (0.30 + 0.18 * pulse) * a;
    ctx.fillStyle = lava ? '#ffd166' : shock ? '#bff8ff' : '#7ddc7d';
    const n = Math.max(18, Math.round(h.r * 2.2));
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * TAU + time * (shock ? 2.2 : 0.5);
      const rr = h.r * (0.35 + 0.65 * ((i * 7) % n) / n);
      ctx.fillRect(Math.round(h.x + Math.cos(ang) * rr), Math.round(h.y + Math.sin(ang) * rr), 1, 1);
    }
    if (shock) {
      // 电弧十字：让电栅在一堆彩色特效里仍然一眼能认
      ctx.globalAlpha = (0.45 + 0.4 * pulse) * a;
      ctx.fillStyle = '#eaffff';
      ctx.fillRect(Math.round(h.x - h.r * 0.6), Math.round(h.y), Math.round(h.r * 1.2), 1);
      ctx.fillRect(Math.round(h.x), Math.round(h.y - h.r * 0.6), 1, Math.round(h.r * 1.2));
    }
  }
  ctx.globalAlpha = 1;

  // 弹药
  for (const b of bullets) {
    px(b.x, b.y, 3, 3, '#ffe066');
  }
  for (const b of ebullets) {
    const col = b.poison ? '#7ddc7d' : (b.frost ? '#8fd8ff' : '#ff6b9d');
    px(b.x, b.y, 3, 3, col);
    ctx.globalAlpha = 0.25;
    px(b.x, b.y, 5, 5, col);
    ctx.globalAlpha = 1;
  }

  // BOSS 召唤预警圈：固定外环 + 随倒计时收缩的内环
  for (const m of marks) {
    const k = Math.max(0, Math.min(1, m.t / m.max));
    const pulse = 0.5 + 0.5 * Math.sin(time * 14 + m.x);
    const ro = m.r, ri = m.r * k;
    ctx.fillStyle = '#ff9a6b';
    ctx.globalAlpha = 0.40 + 0.35 * pulse;
    let n = Math.max(14, Math.round(ro * 3));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      ctx.fillRect(Math.round(m.x + Math.cos(a) * ro), Math.round(m.y + Math.sin(a) * ro), 1, 1);
    }
    ctx.fillStyle = '#ffd8a8';
    ctx.globalAlpha = 0.55 + 0.45 * pulse;
    n = Math.max(10, Math.round(ri * 3));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      ctx.fillRect(Math.round(m.x + Math.cos(a) * ri), Math.round(m.y + Math.sin(a) * ri), 1, 1);
    }
    ctx.fillStyle = '#ff9a6b';
    ctx.globalAlpha = 0.75;
    ctx.fillRect(Math.round(m.x) - 2, Math.round(m.y), 5, 1);
    ctx.fillRect(Math.round(m.x), Math.round(m.y) - 2, 1, 5);
  }
  ctx.globalAlpha = 1;

  // 敌人
  for (const e of enemies) {
    if (!e.dead) drawEnemy(e);
  }

  // 玩家
  drawPlayer();

  // 粒子
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.max);
    ctx.fillStyle = p.color;
    ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
  }
  ctx.globalAlpha = 1;

  // 爆炸环
  for (const f of effects) {
    const k = 1 - f.life / f.max;
    const r = f.r * (0.35 + 0.65 * k);
    ctx.globalAlpha = 1 - k;
    ctx.fillStyle = f.color;
    const n = Math.max(10, Math.round(r * 2));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      ctx.fillRect(Math.round(f.x + Math.cos(a) * r), Math.round(f.y + Math.sin(a) * r), 2, 2);
    }
  }
  ctx.globalAlpha = 1;

  // 浮动文字
  for (const t of texts) {
    ctx.globalAlpha = Math.min(1, t.life * 2);
    txt(t.text, t.x, t.y, t.color, 'center');
    ctx.globalAlpha = 1;
  }

  ctx.restore();

  // 暗角：雪原冷蓝、荒漠暖褐、霓虹紫边，熔岩带红色呼吸，其余按难度
  if (map.id === 'snow') {
    ctx.fillStyle = VIGNETTE_SNOW;
    ctx.fillRect(0, 0, W, H);
  } else if (map.id === 'desert') {
    ctx.fillStyle = VIGNETTE_DESERT;
    ctx.fillRect(0, 0, W, H);
  } else if (map.id === 'neon') {
    ctx.fillStyle = VIGNETTE_NEON;
    ctx.fillRect(0, 0, W, H);
  } else if (map.id === 'rain') {
    // 雨夜：冷蓝压边更重，雨里看不清远处
    ctx.globalAlpha = 0.30;
    ctx.fillStyle = VIGNETTE;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  } else {
    ctx.globalAlpha = diffKey === 'casual' ? 0.24 : diffKey === 'normal' ? 0.18 : 1;
    ctx.fillStyle = VIGNETTE;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }
  if (diffKey === 'hard' || map.id === 'lava') {
    ctx.globalAlpha = map.id === 'lava' && diffKey !== 'hard'
      ? 0.14 + 0.05 * Math.sin(time * 2.4)
      : 0.28 + 0.09 * Math.sin(time * 2.4);
    ctx.fillStyle = VIGNETTE_HARD;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }

  // 沙暴：整屏黄沙，只留玩家周围一小圈模糊视野
  if (sandT > 0) {
    const k = clamp(Math.min(sandT, SAND_STORM - sandT) / 0.8, 0, 1);
    const sc = sandFxCanvas();
    const sg = sc.getContext('2d');
    sg.clearRect(0, 0, W, H);
    // 底色：整屏土黄压暗，远处基本看不清
    sg.fillStyle = 'rgba(190,132,58,0.56)';
    sg.fillRect(0, 0, W, H);
    // 细小沙粒：按时间向右掠过，密度固定但每粒速度不同
    sg.fillStyle = 'rgba(244,214,150,0.55)';
    for (let i = 0; i < 240; i++) {
      const spd = 150 + (i % 4) * 35;
      const x = ((i * 71 + time * spd) % (W + 48)) - 24;
      const y = (((i * 37 + time * 18 + Math.sin(i * 1.7) * 5) % H) + H) % H;
      sg.fillRect(Math.round(x), Math.round(y), 2 + (i % 4), 1);
    }
    // 缓慢纵向飘移的沙尘带：把画面糊成一片土黄
    sg.fillStyle = 'rgba(196,138,68,0.30)';
    for (let i = 0; i < 6; i++) {
      const y = (((i * 34 + time * 26) % (H + 24)) + H + 24) % (H + 24) - 12;
      sg.fillRect(0, Math.round(y), W, 16 + i * 6);
    }
    // 近处沙幕：更粗的横向流线，进一步糊住视线
    sg.fillStyle = 'rgba(232,190,120,0.40)';
    for (let i = 0; i < 36; i++) {
      const x = ((i * 53 + time * (230 + i * 12)) % (W + 80)) - 40;
      const y = (i * 5 + 3) % H;
      sg.fillRect(Math.round(x), y, 24 + (i % 5) * 8, 2);
    }
    // 贴脸沙墙：大块半透明横条
    sg.fillStyle = 'rgba(214,164,88,0.16)';
    for (let i = 0; i < 3; i++) {
      const y = (((i * 62 + time * 9) % (H + 40)) + H + 40) % (H + 40) - 20;
      sg.fillRect(0, Math.round(y), W, 26);
    }
    // 四周压暗，制造「看不远」的压迫感
    sg.globalAlpha = 0.44;
    sg.fillStyle = VIGNETTE_DESERT;
    sg.fillRect(0, 0, W, H);
    sg.globalAlpha = 0.22;
    sg.fillStyle = 'rgba(28,16,6,1)';
    sg.fillRect(0, 0, W, H);
    sg.globalAlpha = 1;

    // 以玩家为中心抠出一圈视野：圈外几乎全糊，圈内只留轮廓
    const px = player.x;
    const py = player.y;
    const R = 30;
    sg.globalCompositeOperation = 'destination-out';
    const hole = sg.createRadialGradient(px, py, 2, px, py, R);
    hole.addColorStop(0, 'rgba(0,0,0,1)');
    hole.addColorStop(0.42, 'rgba(0,0,0,0.92)');
    hole.addColorStop(0.68, 'rgba(0,0,0,0.66)');
    hole.addColorStop(0.86, 'rgba(0,0,0,0.30)');
    hole.addColorStop(1, 'rgba(0,0,0,0)');
    sg.fillStyle = hole;
    sg.fillRect(0, 0, W, H);
    sg.globalCompositeOperation = 'source-over';
    // 圈内再补一层薄沙：看到的是「模糊的一小片」，而不是开个干净洞
    const haze = sg.createRadialGradient(px, py, 0, px, py, R);
    haze.addColorStop(0, 'rgba(216,170,96,0.10)');
    haze.addColorStop(0.6, 'rgba(206,158,84,0.20)');
    haze.addColorStop(1, 'rgba(206,158,84,0)');
    sg.fillStyle = haze;
    sg.fillRect(0, 0, W, H);
    // 视野边缘的逆风沙线，让那圈边缘也在流动
    sg.fillStyle = 'rgba(240,202,136,0.22)';
    for (let i = 0; i < 10; i++) {
      const a = i * 0.63 + time * 1.6;
      const r = R * (0.82 + 0.16 * Math.sin(i * 2.3));
      const x = px + Math.cos(a) * r;
      const y = py + Math.sin(a) * r * 0.72;
      sg.fillRect(Math.round(x), Math.round(y), 10 + (i % 3) * 4, 1);
    }

    ctx.globalAlpha = k;
    ctx.drawImage(sc, 0, 0);
    ctx.globalAlpha = 1;
  }

  // 受伤闪屏
  if (screenFlash > 0) {
    ctx.fillStyle = 'rgba(255,60,90,' + (screenFlash * 0.5) + ')';
    ctx.fillRect(0, 0, W, H);
  }
}

