/* PIXEL DASH · 常量与工具 / 静态背景烘焙 —— 由 index.html 拆分，按顺序加载 */
'use strict';

/* ============================================================
   常量与工具
   ============================================================ */
const W = 320, H = 180;
const TAU = Math.PI * 2;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const $ = (s) => document.querySelector(s);
const layers = {
  title: $('#titleScreen'),
  upgrade: $('#upgradeScreen'),
  end: $('#endScreen'),
};

const rand = (a, b) => a + Math.random() * (b - a);
const irand = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/* 预生成的画布渐变（每帧复用，别在循环里 new） */
const VIGNETTE = ctx.createRadialGradient(W / 2, H / 2, 54, W / 2, H / 2, 196);
VIGNETTE.addColorStop(0, 'rgba(0,0,0,0)');
VIGNETTE.addColorStop(1, 'rgba(0,0,0,.5)');
const VIGNETTE_HARD = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, 190);
VIGNETTE_HARD.addColorStop(0, 'rgba(0,0,0,0)');
VIGNETTE_HARD.addColorStop(1, 'rgba(120,10,32,.62)');
const PGLOW = ctx.createRadialGradient(0, 0, 1, 0, 0, 24);
PGLOW.addColorStop(0, 'rgba(120,215,255,.16)');
PGLOW.addColorStop(1, 'rgba(120,215,255,0)');
const GLOW_N = ctx.createRadialGradient(58, 12, 6, 72, 42, 165);
GLOW_N.addColorStop(0, 'rgba(255,224,150,.20)');
GLOW_N.addColorStop(0.5, 'rgba(255,198,112,.06)');
GLOW_N.addColorStop(1, 'rgba(255,172,82,0)');
const GLOW_H = ctx.createRadialGradient(W / 2, H * 0.74, 6, W / 2, H * 0.74, 120);
GLOW_H.addColorStop(0, 'rgba(255,86,40,.20)');
GLOW_H.addColorStop(0.5, 'rgba(255,70,30,.08)');
GLOW_H.addColorStop(1, 'rgba(255,70,30,0)');
const GLOW_P1 = ctx.createRadialGradient(46, 156, 2, 46, 156, 34);
GLOW_P1.addColorStop(0, 'rgba(255,132,52,.30)');
GLOW_P1.addColorStop(0.5, 'rgba(240,80,24,.11)');
GLOW_P1.addColorStop(1, 'rgba(240,80,24,0)');

/* ---- 场景随机（一次性生成，避免每帧随机闪烁） ---- */
let dSeed = 20261030;
const drnd = () => { dSeed = (dSeed * 1103515245 + 12345) & 0x7fffffff; return dSeed / 0x7fffffff; };
const lcg = (seed) => { let s = seed; return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; };

/* ---- 休闲草甸：动态草叶 / 花粉 / 暖光（静态纹理在 bakeCasual 里烘焙） ---- */
const GLOW_CASUAL = ctx.createRadialGradient(48, 0, 4, 48, 26, 190);
GLOW_CASUAL.addColorStop(0, 'rgba(255,240,178,.09)');
GLOW_CASUAL.addColorStop(0.5, 'rgba(255,224,146,.035)');
GLOW_CASUAL.addColorStop(1, 'rgba(255,210,120,0)');

const CASUAL_SWAY = [];
{
  const r = lcg(314159);
  for (let i = 0; i < 46; i++) {
    CASUAL_SWAY.push({
      x: 4 + r() * (W - 8),
      y: 122 + r() * (H - 126),
      h: 3 + Math.floor(r() * 5),
      ph: r() * TAU,
      tone: r() < 0.55 ? 'rgba(154,216,112,.72)' : 'rgba(100,172,76,.68)',
    });
  }
}
const CASUAL_POLLEN = [];
{
  const r = lcg(271828);
  for (let i = 0; i < 22; i++) {
    CASUAL_POLLEN.push({ x: r() * W, y: r() * H, sp: 3 + r() * 7, ph: r() * TAU, amp: 1 + r() * 2, sz: r() < 0.3 ? 2 : 1 });
  }
}

/* ---- 标准：飘尘（运行时动态层） ---- */
const DUST = [];
for (let i = 0; i < 26; i++) {
  DUST.push([drnd() * W, 8 + drnd() * (H - 16), 2 + drnd() * 7, drnd() * TAU, drnd() < 0.35 ? 2 : 1]);
}

/* ---- 硬核：上升余烬（运行时动态层） ---- */
const EMBERS = [];
for (let i = 0; i < 26; i++) {
  EMBERS.push({ x: drnd() * W, y: drnd() * H, sp: 5 + drnd() * 15, ph: drnd() * TAU, sz: drnd() < 0.5 ? 1 : 2 });
}

/* ---- 熔岩裂隙：预先规划的脉络（暗槽烘焙，亮芯运行时呼吸） ---- */
const FISSURE_PATHS = [
  [[-2, 172], [28, 158], [56, 148], [84, 142], [112, 134]],
  [[84, 142], [82, 120], [76, 102], [66, 88], [52, 76], [38, 66], [22, 56], [8, 48]],
  [[112, 134], [140, 130], [170, 124], [198, 116], [226, 108], [252, 98], [278, 88], [304, 80]],
  [[226, 108], [232, 90], [236, 74], [242, 58], [250, 44]],
  [[252, 98], [270, 112], [288, 126], [306, 140]],
];
function tracePix(path) {
  const out = [];
  for (let i = 0; i < path.length - 1; i++) {
    const x0 = path[i][0], y0 = path[i][1], x1 = path[i + 1][0], y1 = path[i + 1][1];
    const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0)));
    for (let t = 0; t < n; t++) out.push([Math.round(x0 + (x1 - x0) * t / n), Math.round(y0 + (y1 - y0) * t / n)]);
  }
  return out;
}
const FISS_PIX = [];
{
  const fr = lcg(5150);
  for (const path of FISSURE_PATHS) {
    const pix = tracePix(path);
    let off = 0;
    for (let i = 0; i < pix.length; i++) {
      off = off * 0.8 + (fr() - 0.5) * 1.5;
      const heat = 0.42 + 0.34 * Math.sin(i * 0.23) + fr() * 0.34;
      FISS_PIX.push([
        pix[i][0] + Math.round(off * 0.6),
        pix[i][1],
        Math.min(1, Math.max(0.22, heat)),
      ]);
    }
  }
}
const FISS_LO = [], FISS_MID = [], FISS_HI = [];
for (const q of FISS_PIX) (q[2] < 0.5 ? FISS_LO : q[2] < 0.8 ? FISS_MID : FISS_HI).push(q);

/* ============================================================
   静态背景烘焙：标准 / 硬核各画一张离屏底图（只画一次），
   运行时仅叠加呼吸光、余烬、飘尘等动态层
   ============================================================ */
const SCENE = {};

function getScene(key) {
  if (SCENE[key]) return SCENE[key];
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  if (key === 'casual') bakeCasual(g);
  else if (key === 'hard') bakeHard(g);
  else bakeNormal(g);
  SCENE[key] = c;
  return c;
}

/* ---------- 标准：星露谷式黄昏草甸 ---------- */
function bakeNormal(g) {
  const r = lcg(20202);

  // 底色：明亮饱和的草绿，上受光、下背光
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#9ccb6c');
  bg.addColorStop(0.34, '#88c15d');
  bg.addColorStop(0.68, '#72af4c');
  bg.addColorStop(1, '#5c963f');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);

  // 左上夕阳暖光：给草面镀一层金
  const sun = g.createRadialGradient(40, -12, 6, 66, 24, 190);
  sun.addColorStop(0, 'rgba(255,226,150,.22)');
  sun.addColorStop(0.38, 'rgba(255,206,120,.10)');
  sun.addColorStop(1, 'rgba(255,188,94,0)');
  g.fillStyle = sun;
  g.fillRect(0, 0, W, H);

  // 右下冷紫阴影：很轻，只做纵深，不让画面发灰
  const cool = g.createRadialGradient(W - 26, H + 4, 12, W - 26, H + 4, 150);
  cool.addColorStop(0, 'rgba(56,38,92,.13)');
  cool.addColorStop(0.55, 'rgba(56,38,92,.05)');
  cool.addColorStop(1, 'rgba(56,38,92,0)');
  g.fillStyle = cool;
  g.fillRect(0, 0, W, H);

  // 斜向柔光带：夕阳扫过草地
  for (let i = 0; i < 2; i++) {
    g.save();
    const bx = 30 + i * 150;
    g.translate(bx, -40);
    g.rotate(-0.36);
    const lg = g.createLinearGradient(-55, 0, 55, 0);
    lg.addColorStop(0, 'rgba(255,238,178,0)');
    lg.addColorStop(0.5, 'rgba(255,238,178,.055)');
    lg.addColorStop(1, 'rgba(255,238,178,0)');
    g.fillStyle = lg;
    g.fillRect(-55, 0, 110, 320);
    g.restore();
  }

  // 柔和明暗块：大而淡，只做起伏感，不画成“污渍”
  for (let i = 0; i < 26; i++) {
    const cx = r() * W, cy = r() * H, rx = 14 + r() * 22, ry = 9 + r() * 13;
    g.save();
    g.translate(cx, cy);
    g.scale(1, ry / rx);
    const rg = g.createRadialGradient(0, 0, 2, 0, 0, rx);
    rg.addColorStop(0, 'rgba(48,104,38,.19)');
    rg.addColorStop(0.6, 'rgba(48,104,38,.08)');
    rg.addColorStop(1, 'rgba(48,104,38,0)');
    g.fillStyle = rg;
    g.fillRect(-rx, -rx, rx * 2, rx * 2);
    g.restore();
  }
  for (let i = 0; i < 20; i++) {
    const cx = r() * W, cy = r() * H, rx = 12 + r() * 20, ry = 8 + r() * 12;
    g.save();
    g.translate(cx, cy);
    g.scale(1, ry / rx);
    const rg = g.createRadialGradient(0, 0, 2, 0, 0, rx);
    rg.addColorStop(0, 'rgba(224,246,160,.16)');
    rg.addColorStop(0.6, 'rgba(224,246,160,.06)');
    rg.addColorStop(1, 'rgba(224,246,160,0)');
    g.fillStyle = rg;
    g.fillRect(-rx, -rx, rx * 2, rx * 2);
    g.restore();
  }

  // 均匀草叶：整片铺满，2~4px 短叶 + 微倾斜，读起来是草地而不是斑点
  const BLADE = [
    'rgba(206,236,138,.34)', 'rgba(166,212,106,.32)',
    'rgba(124,184,84,.30)', 'rgba(240,248,180,.18)',
  ];
  for (let i = 0; i < 2100; i++) {
    const x = Math.floor(r() * W), y = 3 + Math.floor(r() * (H - 5));
    const h = 2 + Math.floor(r() * 3);
    const lean = r() < 0.5 ? -1 : 1;
    g.fillStyle = BLADE[Math.floor(r() * BLADE.length)];
    g.fillRect(x, y, 1, h);
    if (r() < 0.45) g.fillRect(x + lean, y - 1, 1, 1);
    if (r() < 0.28) { g.fillStyle = 'rgba(74,132,50,.20)'; g.fillRect(x, y + 1, 1, 1); }
  }

  // 少量草丛簇：给均匀纹理一点起伏
  for (let i = 0; i < 55; i++) {
    const cx = 2 + r() * (W - 4), cy = 8 + r() * (H - 14);
    const n = 6 + Math.floor(r() * 5);
    for (let k = 0; k < n; k++) {
      const x = Math.round(cx + (r() - 0.5) * 7);
      const y = Math.round(cy + (r() - 0.5) * 2);
      const h = 3 + Math.floor(r() * 3);
      const lean = x < cx ? -1 : 1;
      g.fillStyle = 'rgba(40,96,34,.22)';
      g.fillRect(x, y, 1, 1);
      for (let b = 1; b <= h; b++) {
        g.fillStyle = b === h ? 'rgba(255,248,204,.48)' : 'rgba(196,232,132,.44)';
        g.fillRect(x + (b >= 2 ? lean : 0), y - b, 1, 1);
      }
    }
  }

  // 极轻微尘雾：只提亮，不撒脏
  for (let i = 0; i < 110; i++) {
    const x = Math.floor(r() * W), y = Math.floor(r() * H);
    g.fillStyle = 'rgba(246,255,205,.07)';
    g.fillRect(x, y, 1, 1);
  }

  // 三叶草
  for (let i = 0; i < 24; i++) {
    const x = 3 + Math.floor(r() * (W - 6)), y = 10 + Math.floor(r() * (H - 16));
    g.fillStyle = 'rgba(132,190,84,.65)';
    g.fillRect(x, y, 1, 1); g.fillRect(x - 1, y, 1, 1); g.fillRect(x + 1, y, 1, 1); g.fillRect(x, y - 1, 1, 1);
    g.fillStyle = 'rgba(206,236,150,.55)';
    g.fillRect(x, y, 1, 1);
  }

  // 暖色小花：成丛生长，比均匀散点更自然
  const FL = [['#fff4cf', '#ffc94a'], ['#ffd9c2', '#ff9550'], ['#ffe6f2', '#ff86ae'], ['#f4ffe2', '#a6da6a']];
  for (let i = 0; i < 9; i++) {
    const gx = 8 + Math.floor(r() * (W - 16)), gy = 14 + Math.floor(r() * (H - 26));
    const cnt = 2 + Math.floor(r() * 2);
    const [petal, core] = FL[Math.floor(r() * FL.length)];
    for (let k = 0; k < cnt; k++) {
      const x = gx + Math.round((r() - 0.5) * 9), y = gy + Math.round((r() - 0.5) * 5);
      g.fillStyle = 'rgba(58,92,42,.95)';
      g.fillRect(x, y + 1, 1, 2);
      g.fillStyle = petal;
      g.fillRect(x - 1, y, 1, 1); g.fillRect(x + 1, y, 1, 1); g.fillRect(x, y - 1, 1, 1); g.fillRect(x, y + 1, 1, 1);
      g.fillStyle = core;
      g.fillRect(x, y, 1, 1);
    }
  }

  // 小石子
  for (let i = 0; i < 12; i++) {
    const x = 3 + Math.floor(r() * (W - 6)), y = 12 + Math.floor(r() * (H - 18));
    g.fillStyle = 'rgba(32,58,26,.35)';
    g.fillRect(x, y + 1, 3, 1);
    g.fillStyle = '#8f9a76';
    g.fillRect(x, y, 2, 1);
    g.fillStyle = '#c9cfae';
    g.fillRect(x, y, 1, 1);
  }

  // ---------- 场景装饰：灌木 / 石头 / 倒木 / 土块 / 高草 ----------
  function ell(cx, cy, rx, ry) {
    const ry2 = Math.max(1, Math.round(ry));
    for (let y = -ry2; y <= ry2; y++) {
      const k = y / ry2;
      const hw = Math.sqrt(Math.max(0, 1 - k * k)) * rx;
      const w2 = Math.max(1, Math.round(hw * 2));
      g.fillRect(Math.round(cx - w2 / 2), Math.round(cy + y), w2, 1);
    }
  }
  function bush(cx, cy, w, h) {
    const R = w * 0.5;
    const lobe = (dx, dy, r, col) => {
      g.fillStyle = col;
      ell(cx + dx * R, cy + dy * h, r * R, r * R * 0.82);
    };
    // 影子
    g.fillStyle = 'rgba(24,50,20,.24)';
    ell(cx, cy + h * 0.50, R * 0.90, h * 0.16);
    // 深色轮廓：几团圆叶拼出不规则轮廓
    lobe(-0.52, 0.10, 0.50, '#1b3f1c');
    lobe(0.00, -0.14, 0.56, '#1b3f1c');
    lobe(0.52, 0.12, 0.46, '#1b3f1c');
    lobe(-0.22, 0.26, 0.46, '#1b3f1c');
    lobe(0.26, 0.28, 0.42, '#1b3f1c');
    // 主体
    lobe(-0.48, 0.08, 0.44, '#35702c');
    lobe(0.02, -0.16, 0.50, '#3d7d31');
    lobe(0.48, 0.10, 0.40, '#2f6528');
    lobe(-0.20, 0.24, 0.40, '#2c6026');
    lobe(0.24, 0.26, 0.36, '#2c6026');
    // 受光叶团
    lobe(-0.34, -0.10, 0.26, '#4f9439');
    lobe(0.14, -0.26, 0.22, '#5aa33f');
    lobe(-0.02, 0.02, 0.18, '#468a34');
    // 高光与叶脉
    g.fillStyle = 'rgba(150,204,96,.60)';
    ell(cx - 0.40 * R, cy - 0.20 * h, 0.18 * R, 0.14 * h);
    ell(cx + 0.18 * R, cy - 0.34 * h, 0.14 * R, 0.10 * h);
    g.fillStyle = '#79bd4e';
    g.fillRect(Math.round(cx - 0.10 * R), Math.round(cy - 0.34 * h), 2, 1);
    g.fillRect(Math.round(cx + 0.34 * R), Math.round(cy - 0.06 * h), 2, 1);
    // 小浆果
    g.fillStyle = '#ff8f7a';
    g.fillRect(Math.round(cx + 0.10 * R), Math.round(cy + 0.16 * h), 2, 2);
    g.fillStyle = '#d9545f';
    g.fillRect(Math.round(cx - 0.34 * R), Math.round(cy + 0.14 * h), 2, 2);
  }
  function rock(cx, cy, w, h) {
    g.fillStyle = 'rgba(26,52,22,.26)';
    ell(cx, cy + h * 0.5, w * 0.5, h * 0.2);
    g.fillStyle = '#4c5548';
    ell(cx, cy, w * 0.5, h * 0.56);
    g.fillStyle = '#7d8874';
    ell(cx - w * 0.06, cy - h * 0.06, w * 0.42, h * 0.44);
    g.fillStyle = '#a3ad97';
    ell(cx - w * 0.14, cy - h * 0.20, w * 0.26, h * 0.24);
    g.fillStyle = '#c6cfb6';
    g.fillRect(Math.round(cx - w * 0.16), Math.round(cy - h * 0.30), 3, 1);
    g.fillStyle = 'rgba(96,152,64,.55)';
    g.fillRect(Math.round(cx + w * 0.10), Math.round(cy + h * 0.26), 4, 2);
  }
  function log(cx, cy, w, h) {
    g.fillStyle = 'rgba(26,52,22,.28)';
    ell(cx, cy + h * 0.5, w * 0.5, h * 0.2);
    g.fillStyle = '#5f3b21';
    ell(cx, cy, w * 0.5, h * 0.44);
    g.fillStyle = '#7c4f2b';
    ell(cx - w * 0.04, cy - h * 0.06, w * 0.46, h * 0.34);
    g.fillStyle = '#c1935c';
    ell(cx + w * 0.30, cy, w * 0.19, h * 0.40);
    g.fillStyle = '#a3743f';
    ell(cx + w * 0.30, cy, w * 0.10, h * 0.22);
    g.fillStyle = 'rgba(244,220,170,.65)';
    g.fillRect(Math.round(cx + w * 0.26), Math.round(cy - h * 0.12), 2, 1);
  }
  function patch(cx, cy, rx, ry) {
    g.save();
    g.translate(cx, cy);
    g.scale(1, ry / rx);
    const rg = g.createRadialGradient(0, 0, 3, 0, 0, rx);
    rg.addColorStop(0, 'rgba(126,92,56,.42)');
    rg.addColorStop(0.55, 'rgba(126,92,56,.26)');
    rg.addColorStop(1, 'rgba(126,92,56,0)');
    g.fillStyle = rg;
    g.fillRect(-rx, -rx, rx * 2, rx * 2);
    g.restore();
    for (let i = 0; i < 14; i++) {
      const x = Math.round(cx + (r() - 0.5) * rx * 1.6);
      const y = Math.round(cy + (r() - 0.5) * ry * 1.4);
      g.fillStyle = r() < 0.5 ? 'rgba(88,62,36,.42)' : 'rgba(198,170,126,.38)';
      g.fillRect(x, y, 1, 1);
    }
  }
  function tallGrass(cx, cy) {
    const n = 6 + Math.floor(r() * 5);
    g.fillStyle = 'rgba(30,64,24,.30)';
    ell(cx, cy, 8, 2);
    for (let k = 0; k < n; k++) {
      const dx = Math.round((r() - 0.5) * 13);
      const h = 5 + Math.floor(r() * 7);
      const lean = dx < 0 ? -1 : 1;
      for (let b = 0; b < h; b++) {
        g.fillStyle = b === 0 ? 'rgba(216,244,150,.62)' : 'rgba(92,152,58,.55)';
        g.fillRect(cx + dx + (b > 2 ? lean : 0), cy - b, 1, 1);
      }
    }
  }

  bush(26, 40, 34, 21);
  bush(296, 66, 28, 18);
  bush(70, 158, 26, 17);
  rock(244, 32, 21, 14);
  rock(108, 98, 15, 10);
  log(206, 152, 36, 18);
  patch(272, 168, 48, 21);
  patch(30, 110, 30, 14);
  tallGrass(152, 66);
  tallGrass(186, 116);
  tallGrass(126, 30);
  tallGrass(64, 86);
  tallGrass(258, 126);

  // 顶边轻压暗 + 底边深草：上下各留一层纵深
  const top = g.createLinearGradient(0, 0, 0, 16);
  top.addColorStop(0, 'rgba(34,66,26,.12)');
  top.addColorStop(1, 'rgba(34,66,26,0)');
  g.fillStyle = top;
  g.fillRect(0, 0, W, 16);
  // 底边前景草：高矮交错的草簇剪影，压出自然的草地边界
  for (let x = -3; x < W + 3; x += 3) {
    const n = 2 + Math.floor(r() * 3);
    for (let k = 0; k < n; k++) {
      const bx = x + Math.round((r() - 0.5) * 3);
      const h = 4 + Math.floor(r() * 7);
      g.fillStyle = '#33632a';
      g.fillRect(bx, H - h, 1, h);
      g.fillStyle = '#478539';
      g.fillRect(bx, H - h, 1, 2);
    }
  }
  // 底部草影：前景压进暗部
  const bot = g.createLinearGradient(0, H - 18, 0, H);
  bot.addColorStop(0, 'rgba(24,50,20,0)');
  bot.addColorStop(1, 'rgba(24,50,20,.20)');
  g.fillStyle = bot;
  g.fillRect(0, H - 18, W, 18);
}

/* ---------- 硬核：熔岩裂隙 ---------- */
function lavaPool(g, cx, cy, rx, ry) {
  g.save();
  g.translate(cx, cy);
  g.scale(1, ry / rx);
  const pg = g.createRadialGradient(0, 0, 1, 0, 0, rx);
  pg.addColorStop(0, 'rgba(255,214,140,.55)');
  pg.addColorStop(0.26, 'rgba(255,132,44,.42)');
  pg.addColorStop(0.6, 'rgba(196,52,16,.20)');
  pg.addColorStop(1, 'rgba(90,12,4,0)');
  g.fillStyle = pg;
  g.fillRect(-rx, -rx, rx * 2, rx * 2);
  g.restore();
  // 熔岩亮缝（避免变成发光圆球）
  g.fillStyle = 'rgba(255,196,96,.45)';
  g.fillRect(cx - 5, cy, 10, 1);
  g.fillStyle = 'rgba(255,240,190,.35)';
  g.fillRect(cx - 2, cy - 1, 5, 1);
  // 边缘碎岩
  g.fillStyle = 'rgba(8,2,4,.85)';
  g.fillRect(cx - rx + 2, cy - 4, 6, 3);
  g.fillRect(cx + rx - 9, cy + 2, 7, 3);
  g.fillRect(cx - 6, cy + ry - 2, 9, 2);
}

function bakeHard(g) {
  const r = lcg(918273);

  // 焦土底色
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#2a141a');
  bg.addColorStop(0.42, '#1e0d12');
  bg.addColorStop(0.78, '#15080c');
  bg.addColorStop(1, '#0b0406');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);

  // 有机焦斑：暖褐受热斑 + 冷黑阴影，低对比
  const WARM = ['rgba(150,62,38,.10)', 'rgba(196,88,42,.07)', 'rgba(110,44,30,.10)'];
  const COOL = ['rgba(6,2,4,.20)', 'rgba(20,6,10,.16)', 'rgba(10,3,6,.18)'];
  for (let i = 0; i < 70; i++) {
    const cx = r() * W, cy = r() * H, rad = 3 + r() * 11, warm = r() < 0.45;
    g.fillStyle = (warm ? WARM : COOL)[Math.floor(r() * 3)];
    for (let y = -rad; y <= rad; y += 2) {
      const k = y / rad, hw = Math.sqrt(1 - k * k) * rad;
      g.fillRect(Math.round(cx - hw), Math.round(cy + y), Math.round(hw * 2), 2);
    }
  }

  // 焦土颗粒 + 灰烬
  for (let i = 0; i < 2600; i++) {
    const x = Math.floor(r() * W), y = Math.floor(r() * H);
    g.fillStyle = r() < 0.55 ? 'rgba(4,1,3,.10)' : 'rgba(210,150,120,.030)';
    g.fillRect(x, y, 1, 1);
  }

  // 炭化草茎：残根 + 余烬尖
  for (let i = 0; i < 70; i++) {
    const cx = Math.floor(r() * W), cy = 8 + Math.floor(r() * (H - 16));
    const n = 2 + Math.floor(r() * 3);
    for (let k = 0; k < n; k++) {
      const hh = 2 + Math.floor(r() * 3);
      const dx = Math.round(k - (n - 1) / 2);
      g.fillStyle = 'rgba(6,2,4,.65)';
      g.fillRect(cx + dx, cy - hh, 1, hh);
      if (r() < 0.5) { g.fillStyle = 'rgba(196,72,32,.30)'; g.fillRect(cx + dx, cy - hh, 1, 1); }
    }
  }

  // 火山碎石：暗岩 + 受热上沿
  for (let i = 0; i < 60; i++) {
    const x = 2 + Math.floor(r() * (W - 4)), y = 10 + Math.floor(r() * (H - 16));
    g.fillStyle = 'rgba(4,1,3,.5)';
    g.fillRect(x, y + 1, 2, 1);
    g.fillStyle = r() < 0.5 ? '#2a1016' : '#361318';
    g.fillRect(x, y, 2, 1);
    g.fillStyle = 'rgba(196,92,50,.20)';
    g.fillRect(x, y, 1, 1);
  }

  // 地心热光（压在焦土之上，做出深度）
  const hg = g.createRadialGradient(W * 0.52, H * 0.8, 6, W * 0.52, H * 0.8, 175);
  hg.addColorStop(0, 'rgba(255,102,42,.24)');
  hg.addColorStop(0.4, 'rgba(214,58,18,.09)');
  hg.addColorStop(1, 'rgba(110,16,8,0)');
  g.fillStyle = hg;
  g.fillRect(0, 0, W, H);

  // 上部压暗
  const tg = g.createLinearGradient(0, 0, 0, 62);
  tg.addColorStop(0, 'rgba(6,1,4,.55)');
  tg.addColorStop(1, 'rgba(6,1,4,0)');
  g.fillStyle = tg;
  g.fillRect(0, 0, W, 62);

  // 熔岩池
  lavaPool(g, 46, 156, 20, 9);

  // 裂隙：炭化边缘 + 黑槽 + 分级熔光（亮芯由动态层呼吸）
  g.fillStyle = 'rgba(46,16,22,.45)';
  for (const p of FISS_PIX) g.fillRect(p[0] - 1, p[1] - 1, 3, 3);
  g.fillStyle = '#050102';
  for (const p of FISS_PIX) g.fillRect(p[0], p[1], 1, 1);
  g.fillStyle = 'rgba(255,84,36,.05)';
  for (const p of FISS_HI) g.fillRect(p[0] - 2, p[1] - 2, 5, 5);
  g.fillStyle = 'rgba(255,96,40,.22)';
  for (const p of FISS_PIX) g.fillRect(p[0], p[1], 1, 1);
  g.fillStyle = 'rgba(255,128,54,.40)';
  for (const p of FISS_HI) g.fillRect(p[0], p[1], 1, 1);

  // 顶部 / 底部岩脊（块状岩层，断崖式剪影 + 熔光描边）
  const b1 = [], b2 = [], t1 = [];
  let v = 0, x = 0;
  while (x < W) {
    const w = 4 + Math.floor(r() * 6);
    v = v * 0.65 + (r() - 0.5) * 14;
    const h = Math.max(5, Math.min(30, Math.round(9 + v + 6 * Math.sin(x * 0.03))));
    for (let k = 0; k < w && x < W; k++, x++) b1.push(h);
  }
  v = 0; x = 0;
  while (x < W) {
    const w = 3 + Math.floor(r() * 5);
    v = v * 0.6 + (r() - 0.5) * 12;
    const h = Math.max(4, Math.min(26, Math.round(6 + v + 5 * Math.sin(x * 0.05 + 1))));
    for (let k = 0; k < w && x < W; k++, x++) b2.push(h);
  }
  v = 0; x = 0;
  while (x < W) {
    const w = 4 + Math.floor(r() * 6);
    v = v * 0.62 + (r() - 0.5) * 10;
    const h = Math.max(2, Math.min(15, Math.round(4 + v + 3 * Math.sin(x * 0.07 + 2))));
    for (let k = 0; k < w && x < W; k++, x++) t1.push(h);
  }
  for (let x = 0; x < W; x++) {
    g.fillStyle = '#1c0a10';
    g.fillRect(x, H - b1[x], 1, b1[x]);
    g.fillStyle = 'rgba(212,84,44,.22)';
    g.fillRect(x, H - b1[x], 1, 1);
  }
  for (let x = 0; x < W; x++) {
    g.fillStyle = '#040103';
    g.fillRect(x, H - b2[x], 1, b2[x]);
    g.fillStyle = 'rgba(255,126,62,.50)';
    g.fillRect(x, H - b2[x], 1, 1);
    g.fillStyle = 'rgba(255,96,44,.12)';
    g.fillRect(x, H - b2[x] + 2, 1, 1);
  }
  for (let x = 0; x < W; x++) {
    g.fillStyle = '#060204';
    g.fillRect(x, 0, 1, t1[x]);
    g.fillStyle = 'rgba(255,110,60,.32)';
    g.fillRect(x, t1[x] - 1, 1, 1);
  }

  // 四周压边
  g.fillStyle = '#040103';
  g.fillRect(0, 0, W, 3); g.fillRect(0, H - 3, W, 3);
  g.fillRect(0, 0, 3, H); g.fillRect(W - 3, 0, 3, H);
  g.fillStyle = 'rgba(255,120,60,.15)';
  g.fillRect(0, 3, W, 1); g.fillRect(0, H - 4, W, 1);
  g.fillRect(3, 0, 1, H); g.fillRect(W - 4, 0, 1, H);
}

/* ---------- 休闲：星露谷式阳光草甸（烘焙底图） ---------- */
function bakeCasual(g) {
  const r = lcg(778899);

  // 远处受光、近处偏深的草甸渐变
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#8cc95f');
  bg.addColorStop(0.3, '#7ab850');
  bg.addColorStop(0.62, '#68a444');
  bg.addColorStop(1, '#578f3b');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);

  // 左上暖阳
  const sun = g.createRadialGradient(54, 10, 4, 62, 26, 200);
  sun.addColorStop(0, 'rgba(255,248,196,.24)');
  sun.addColorStop(0.42, 'rgba(255,236,158,.09)');
  sun.addColorStop(1, 'rgba(255,224,130,0)');
  g.fillStyle = sun;
  g.fillRect(0, 0, W, H);

  // 有机色斑：小面积、低对比，避免变成“污渍”
  const LIGHT = ['rgba(178,232,126,.11)', 'rgba(206,246,158,.08)', 'rgba(142,206,100,.10)'];
  const DARK = ['rgba(32,72,28,.10)', 'rgba(52,100,38,.09)', 'rgba(26,60,24,.08)'];
  for (let i = 0; i < 64; i++) {
    const cx = r() * W, cy = r() * H, rad = 3 + r() * 10, isLight = r() < 0.5;
    g.fillStyle = (isLight ? LIGHT : DARK)[Math.floor(r() * 3)];
    for (let y = -rad; y <= rad; y += 2) {
      const k = y / rad, hw = Math.sqrt(1 - k * k) * rad;
      g.fillRect(Math.round(cx - hw), Math.round(cy + y), Math.round(hw * 2), 2);
    }
  }

  // 细密草叶纹理
  const BLADE = ['rgba(176,228,132,.5)', 'rgba(138,202,96,.46)', 'rgba(96,168,64,.46)', 'rgba(78,146,56,.44)'];
  for (let i = 0; i < 900; i++) {
    const x = Math.floor(r() * W), y = Math.floor(r() * H), len = 1 + Math.floor(r() * 3);
    g.fillStyle = BLADE[Math.floor(r() * 4)];
    g.fillRect(x, y, 1, len);
    if (len > 2 && r() < 0.4) g.fillRect(x + 1, y + 1, 1, len - 1);
  }

  // 草簇：深色叶片 + 亮色叶尖，像素剪影更清晰
  for (let i = 0; i < 120; i++) {
    const cx = Math.floor(r() * W), cy = 6 + Math.floor(r() * (H - 10));
    const n = 3 + Math.floor(r() * 3);
    for (let k = 0; k < n; k++) {
      const h = 2 + Math.floor(r() * 3);
      const dx = Math.round(k - (n - 1) / 2);
      g.fillStyle = 'rgba(46,96,38,.52)';
      g.fillRect(cx + dx, cy - h, 1, h);
      g.fillStyle = 'rgba(178,232,128,.5)';
      g.fillRect(cx + dx, cy - h, 1, 1);
    }
  }

  // 细颗粒噪点：打散大面积纯色
  for (let i = 0; i < 2400; i++) {
    const x = Math.floor(r() * W), y = Math.floor(r() * H);
    g.fillStyle = r() < 0.5 ? 'rgba(255,255,214,.05)' : 'rgba(12,34,12,.07)';
    g.fillRect(x, y, 1, 1);
  }

  // 三叶草
  for (let i = 0; i < 44; i++) {
    const x = 2 + Math.floor(r() * (W - 4)), y = 8 + Math.floor(r() * (H - 14));
    g.fillStyle = 'rgba(126,196,90,.58)';
    g.fillRect(x, y, 1, 1); g.fillRect(x - 1, y, 1, 1); g.fillRect(x + 1, y, 1, 1); g.fillRect(x, y - 1, 1, 1);
  }

  // 小花
  const FL = [['#fff4c8', '#ffd447'], ['#ffd0e0', '#ff8fb4'], ['#d6ecff', '#7fc4ff'], ['#ffe9c8', '#ff9f5a']];
  for (let i = 0; i < 32; i++) {
    const x = 2 + Math.floor(r() * (W - 4)), y = 10 + Math.floor(r() * (H - 20));
    const [petal, core] = FL[Math.floor(r() * FL.length)];
    g.fillStyle = 'rgba(66,120,52,.9)';
    g.fillRect(x, y + 1, 1, 2);
    g.fillStyle = petal;
    g.fillRect(x - 1, y, 1, 1); g.fillRect(x + 1, y, 1, 1); g.fillRect(x, y - 1, 1, 1); g.fillRect(x, y + 1, 1, 1);
    g.fillStyle = core;
    g.fillRect(x, y, 1, 1);
  }

  // 小石子
  for (let i = 0; i < 18; i++) {
    const x = 2 + Math.floor(r() * (W - 4)), y = 10 + Math.floor(r() * (H - 16));
    g.fillStyle = 'rgba(20,38,26,.28)';
    g.fillRect(x, y + 1, 2, 1);
    g.fillStyle = '#9aa290';
    g.fillRect(x, y, 2, 1);
    if (r() < 0.5) { g.fillStyle = '#c6cdbb'; g.fillRect(x, y, 1, 1); }
  }

  // 小蘑菇
  for (let i = 0; i < 5; i++) {
    const x = 12 + Math.floor(r() * (W - 24)), y = 14 + Math.floor(r() * (H - 30));
    g.fillStyle = 'rgba(12,24,14,.25)';
    g.fillRect(x - 1, y + 3, 4, 1);
    g.fillStyle = '#e8dcc2';
    g.fillRect(x, y + 1, 2, 3);
    g.fillStyle = '#d9433f';
    g.fillRect(x - 1, y, 4, 1); g.fillRect(x, y - 1, 2, 1);
    g.fillStyle = '#ffe8d8';
    g.fillRect(x, y, 1, 1);
  }

  // 近景草边：底边压深，制造纵深
  for (let x = 0; x < W; x++) {
    const h = 3 + Math.round(2.5 * Math.sin(x * 0.21 + 1.2) + 2 * Math.sin(x * 0.53));
    if (h > 0) { g.fillStyle = '#2f5f28'; g.fillRect(x, H - h, 1, h); }
  }
}

function drawBackdrop() {
  if (diffKey === 'casual') {
    ctx.drawImage(getScene('casual'), 0, 0);
    // 暖阳呼吸
    ctx.globalAlpha = 0.28 + 0.10 * Math.sin(time * 0.9);
    ctx.fillStyle = GLOW_CASUAL;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
    // 草叶摆动
    for (const s of CASUAL_SWAY) {
      const lean = Math.round(Math.sin(time * 1.5 + s.ph) * 1.4);
      const x = Math.round(s.x), top = Math.round(s.y - s.h);
      ctx.fillStyle = s.tone;
      ctx.fillRect(x, top, 1, s.h);
      ctx.fillRect(x + (lean < 0 ? -1 : lean > 0 ? 1 : 0), top - Math.abs(lean), 1, 2);
    }
    // 花粉 / 光尘
    for (const p of CASUAL_POLLEN) {
      const y = ((p.y - time * p.sp) % (H + 12) + H + 12) % (H + 12) - 6;
      const x = p.x + Math.sin(time * 0.8 + p.ph) * p.amp;
      ctx.globalAlpha = 0.25 + 0.22 * Math.sin(time * 2 + p.ph);
      ctx.fillStyle = p.sz > 1 ? '#fff0b8' : '#ffe1a0';
      ctx.fillRect(Math.round(x), Math.round(y), p.sz, p.sz);
    }
    ctx.globalAlpha = 1;
  } else if (diffKey === 'hard') {
    ctx.drawImage(getScene('hard'), 0, 0);
    // 裂隙亮芯：分级明暗 + 呼吸，避免变成一条霓虹直线
    const pulse = 0.5 + 0.5 * Math.sin(time * 2.2);
    ctx.fillStyle = 'rgba(255,88,36,' + (0.22 + 0.14 * pulse).toFixed(3) + ')';
    for (const p of FISS_LO) ctx.fillRect(p[0], p[1], 1, 1);
    ctx.fillStyle = 'rgba(255,110,44,' + (0.30 + 0.18 * pulse).toFixed(3) + ')';
    for (const p of FISS_MID) ctx.fillRect(p[0], p[1], 1, 1);
    ctx.fillStyle = 'rgba(255,140,56,' + (0.42 + 0.22 * pulse).toFixed(3) + ')';
    for (const p of FISS_HI) ctx.fillRect(p[0], p[1], 1, 1);
    // 熔光晕（跟着亮芯呼吸）
    ctx.fillStyle = 'rgba(255,92,32,' + (0.03 + 0.04 * pulse).toFixed(3) + ')';
    for (const p of FISS_HI) ctx.fillRect(p[0] - 2, p[1] - 2, 5, 5);
    // 稀疏白热晶点
    ctx.fillStyle = 'rgba(255,238,190,' + (0.10 + 0.20 * pulse).toFixed(3) + ')';
    for (let i = 0; i < FISS_HI.length; i += 5) {
      const p = FISS_HI[i];
      ctx.fillRect(p[0], p[1], 1, 1);
    }
    // 热雾（地心 + 熔池）
    ctx.globalAlpha = 0.10 + 0.06 * pulse;
    ctx.fillStyle = GLOW_H; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = GLOW_P1; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
    // 上升余烬
    for (const em of EMBERS) {
      const y = ((em.y - time * em.sp) % H + H) % H;
      ctx.globalAlpha = 0.42 + 0.3 * Math.sin(time * 2.6 + em.ph);
      ctx.fillStyle = em.sz > 1 ? '#ffd166' : '#ff6a48';
      ctx.fillRect(Math.round(em.x + Math.sin(time * 1.4 + em.ph) * 1.6), Math.round(y), em.sz, em.sz);
    }
    ctx.globalAlpha = 1;
  } else {
    ctx.drawImage(getScene('normal'), 0, 0);
    // 夕阳暖光呼吸
    ctx.globalAlpha = 0.28 + 0.10 * Math.sin(time * 1.2);
    ctx.fillStyle = GLOW_N;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
    // 飘尘
    ctx.fillStyle = '#fff6d8';
    for (const d of DUST) {
      const x = ((d[0] + time * d[2]) % W + W) % W;
      const y = d[1] + Math.sin(time * 1.1 + d[3]) * 2;
      ctx.globalAlpha = 0.26 + 0.14 * Math.sin(time * 1.8 + d[3]);
      ctx.fillRect(Math.round(x), Math.round(y), d[4], d[4]);
    }
    ctx.globalAlpha = 1;
  }
}
const fmt = (t) => {
  const s = Math.floor(t), m = Math.floor(s / 60);
  return String(m).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
};

