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
const HERO_PAL = {
  k: '#241a12', h: '#a9762a', H: '#f3d06a', s: '#f4c9a1', e: '#2a1c14',
  r: '#d14a37', b: '#3d63ac', B: '#7aa6e6', g: '#ffcf5c', o: '#5b3a22',
};
const HERO_BODY = [
  '....khhhhk....',
  '...kHHHHHHk...',
  '..kHHHHHHHHk..',
  '..khhhhhhhhk..',
  '...kssssssk...',
  '...ksessesk...',
  '...kssssssk...',
  '...krrrrrrk...',
  '..kbbbbbbbk...',
  '..kbBBBBBBk...',
  '...kgggggk....',
];
const HERO_LEGS = [
  ['....kk.kk.....', '....oo.oo.....', '...ooo.ooo....'],
  ['....kk.kk.....', '....oo.oo.....', '....oo.ooo....'],
];
const HERO_W = 14, HERO_H = 14;

function bakeHero(legs, white) {
  const c = document.createElement('canvas');
  c.width = HERO_W; c.height = HERO_H;
  const g = c.getContext('2d');
  for (let y = 0; y < HERO_H; y++) {
    const row = y < HERO_BODY.length ? HERO_BODY[y] : legs[y - HERO_BODY.length];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      g.fillStyle = white ? '#ffffff' : HERO_PAL[ch];
      g.fillRect(x, y, 1, 1);
    }
  }
  return c;
}
const HERO_SPR = HERO_LEGS.map((l) => bakeHero(l, false));
const HERO_SPR_WHITE = HERO_LEGS.map((l) => bakeHero(l, true));

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
  titleArtCtx.clearRect(0, 0, HERO_W, HERO_H);
  titleArtCtx.drawImage(HERO_SPR[frame], 0, 0);

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
  g.drawImage(HERO_SPR[frame], Math.round(hx - HERO_W * 1.5), Math.round(hy - HERO_H * 3), HERO_W * 3, HERO_H * 3);
}

function drawPlayer() {
  const p = player;
  const x = Math.round(p.x), y = Math.round(p.y);
  const frame = Math.floor(time * 7) % 2;
  const spr = (p.flash > 0 ? HERO_SPR_WHITE : HERO_SPR)[frame];
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

function render() {
  ctx.save();
  if (shake > 0.15) {
    ctx.translate(irand(-1, 1) * Math.min(3, shake * 0.6), irand(-1, 1) * Math.min(3, shake * 0.6));
  }

  // 背景（按难度主题）
  drawBackdrop();

  // 地图环境：雪原风雪与冰面 / 熔岩热浪
  if (mapKey === 'snow') {
    ctx.fillStyle = 'rgba(190,226,255,.10)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#eaf6ff';
    for (let i = 0; i < 34; i++) {
      const x = ((i * 97 + time * (14 + (i % 4) * 5)) % (W + 8)) - 4;
      const y = ((i * 61 + time * 24) % (H + 8)) - 4;
      ctx.globalAlpha = 0.25 + 0.25 * ((i % 5) / 5);
      ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
    }
    ctx.globalAlpha = 1;
  } else if (mapKey === 'lava') {
    ctx.fillStyle = 'rgba(255,94,32,.07)';
    ctx.fillRect(0, 0, W, H);
  }

  // 冰面：淡蓝椭圆，踩上去明显变慢
  for (const i of terrain.ice) {
    ctx.globalAlpha = 0.30;
    ctx.fillStyle = '#bfe9ff';
    ctx.beginPath();
    ctx.ellipse(i.x, i.y, i.r, i.r * 0.62, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(i.x - 2, i.y - 2, i.r * 0.66, i.r * 0.36, 0, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // 岩石：阴影 + 主体 + 顶部高光
  for (const r of terrain.rocks) {
    ctx.fillStyle = 'rgba(0,0,0,.30)';
    ctx.beginPath();
    ctx.ellipse(r.x + 1, r.y + 3, r.r, r.r * 0.55, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = mapKey === 'snow' ? '#8fa3b8' : '#4a3a3a';
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.r, 0, TAU);
    ctx.fill();
    ctx.fillStyle = mapKey === 'snow' ? '#c6d6e4' : '#6b4a3a';
    ctx.fillRect(Math.round(r.x - r.r / 2), Math.round(r.y - r.r / 2), Math.max(2, Math.round(r.r)), 2);
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

  // 地面区域：毒雾绿点云 / 熔岩橙红余烬，随剩余时间淡出
  for (const h of hazards) {
    const lava = h.kind === 'lava';
    const a = Math.min(1, h.life / (h.max || 5));
    const pulse = 0.5 + 0.5 * Math.sin(time * (lava ? 9 : 6) + h.x);
    ctx.globalAlpha = (lava ? 0.16 : 0.10) * a;
    ctx.fillStyle = lava ? '#ff6a3d' : '#7ddc7d';
    ctx.fillRect(Math.round(h.x - h.r), Math.round(h.y - h.r), h.r * 2, h.r * 2);
    ctx.globalAlpha = (0.30 + 0.18 * pulse) * a;
    ctx.fillStyle = lava ? '#ffd166' : '#7ddc7d';
    const n = Math.max(18, Math.round(h.r * 2.2));
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * TAU + time * 0.5;
      const rr = h.r * (0.35 + 0.65 * ((i * 7) % n) / n);
      ctx.fillRect(Math.round(h.x + Math.cos(ang) * rr), Math.round(h.y + Math.sin(ang) * rr), 1, 1);
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

  // 暗角（硬核压暗并带红色呼吸）
  ctx.globalAlpha = diffKey === 'casual' ? 0.24 : diffKey === 'normal' ? 0.18 : 1;
  ctx.fillStyle = VIGNETTE;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1;
  if (diffKey === 'hard') {
    ctx.globalAlpha = 0.28 + 0.09 * Math.sin(time * 2.4);
    ctx.fillStyle = VIGNETTE_HARD;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }

  // 受伤闪屏
  if (screenFlash > 0) {
    ctx.fillStyle = 'rgba(255,60,90,' + (screenFlash * 0.5) + ')';
    ctx.fillRect(0, 0, W, H);
  }
}

