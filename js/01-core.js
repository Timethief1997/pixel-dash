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

/* 金币 / 勋章小图标：8×8 像素 SVG，界面里和数字一起显示 */
const PIX_ICON = {
  coin:
    '<svg class="pixIco" viewBox="0 0 8 8" aria-hidden="true" focusable="false">' +
      '<rect x="2" y="0" width="4" height="1" fill="#fff3b0"/>' +
      '<rect x="1" y="1" width="6" height="1" fill="#ffd23d"/>' +
      '<rect x="0" y="2" width="1" height="1" fill="#c98a1b"/>' +
      '<rect x="1" y="2" width="6" height="1" fill="#ffcf4a"/>' +
      '<rect x="7" y="2" width="1" height="1" fill="#c98a1b"/>' +
      '<rect x="0" y="3" width="1" height="2" fill="#c98a1b"/>' +
      '<rect x="1" y="3" width="2" height="2" fill="#ffe066"/>' +
      '<rect x="3" y="3" width="3" height="2" fill="#ffcf4a"/>' +
      '<rect x="6" y="3" width="1" height="2" fill="#e0a72c"/>' +
      '<rect x="7" y="3" width="1" height="2" fill="#c98a1b"/>' +
      '<rect x="0" y="5" width="1" height="1" fill="#c98a1b"/>' +
      '<rect x="1" y="5" width="6" height="1" fill="#e0a72c"/>' +
      '<rect x="7" y="5" width="1" height="1" fill="#c98a1b"/>' +
      '<rect x="1" y="6" width="6" height="1" fill="#c98a1b"/>' +
      '<rect x="2" y="7" width="4" height="1" fill="#a06c12"/>' +
    '</svg>',
  medal:
    '<svg class="pixIco" viewBox="0 0 8 8" aria-hidden="true" focusable="false">' +
      '<rect x="2" y="0" width="2" height="2" fill="#e5484d"/>' +
      '<rect x="4" y="0" width="2" height="2" fill="#b8323b"/>' +
      '<rect x="1" y="2" width="6" height="1" fill="#b07a12"/>' +
      '<rect x="0" y="3" width="1" height="3" fill="#b07a12"/>' +
      '<rect x="1" y="3" width="6" height="3" fill="#ffd75e"/>' +
      '<rect x="3" y="3" width="2" height="1" fill="#fff6c9"/>' +
      '<rect x="3" y="4" width="2" height="2" fill="#e0a72c"/>' +
      '<rect x="7" y="3" width="1" height="3" fill="#b07a12"/>' +
      '<rect x="1" y="6" width="6" height="1" fill="#b07a12"/>' +
      '<rect x="2" y="7" width="4" height="1" fill="#8a5f12"/>' +
    '</svg>',
};
function ico(name) { return PIX_ICON[name] || ''; }
/* index.html 里的静态占位：<span data-ico="coin"></span> */
function paintStaticIcons() {
  for (const el of document.querySelectorAll('[data-ico]')) {
    if (el.dataset.ico) el.innerHTML = ico(el.dataset.ico);
  }
}
paintStaticIcons();

/* 预生成的画布渐变（每帧复用，别在循环里 new） */
const VIGNETTE = ctx.createRadialGradient(W / 2, H / 2, 54, W / 2, H / 2, 196);
VIGNETTE.addColorStop(0, 'rgba(0,0,0,0)');
VIGNETTE.addColorStop(1, 'rgba(0,0,0,.5)');
const VIGNETTE_HARD = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, 190);
VIGNETTE_HARD.addColorStop(0, 'rgba(0,0,0,0)');
VIGNETTE_HARD.addColorStop(1, 'rgba(120,10,32,.62)');
const VIGNETTE_SNOW = ctx.createRadialGradient(W / 2, H / 2, 58, W / 2, H / 2, 198);
VIGNETTE_SNOW.addColorStop(0, 'rgba(28,54,88,0)');
VIGNETTE_SNOW.addColorStop(1, 'rgba(28,54,88,.34)');
const VIGNETTE_DESERT = ctx.createRadialGradient(W / 2, H / 2, 60, W / 2, H / 2, 198);
VIGNETTE_DESERT.addColorStop(0, 'rgba(104,62,18,0)');
VIGNETTE_DESERT.addColorStop(1, 'rgba(104,62,18,.34)');
const VIGNETTE_NEON = ctx.createRadialGradient(W / 2, H / 2, 56, W / 2, H / 2, 198);
VIGNETTE_NEON.addColorStop(0, 'rgba(52,4,74,0)');
VIGNETTE_NEON.addColorStop(1, 'rgba(52,4,74,.42)');
const VIGNETTE_REEF = ctx.createRadialGradient(W / 2, H / 2, 54, W / 2, H / 2, 198);
VIGNETTE_REEF.addColorStop(0, 'rgba(4,54,62,0)');
VIGNETTE_REEF.addColorStop(1, 'rgba(4,54,62,.40)');
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

/* ---- 熔岩：上升余烬（运行时动态层） ---- */
const EMBERS = [];
for (let i = 0; i < 26; i++) {
  EMBERS.push({ x: drnd() * W, y: drnd() * H, sp: 5 + drnd() * 15, ph: drnd() * TAU, sz: drnd() < 0.5 ? 1 : 2 });
}

/* ---- 荒漠：横向掠过的沙粒（运行时动态层） ---- */
const SAND_STREAK = [];
{
  const r = lcg(445566);
  for (let i = 0; i < 40; i++) {
    SAND_STREAK.push({
      x: r() * W, y: r() * H, sp: 14 + r() * 46,
      len: 2 + Math.floor(r() * 4), ph: r() * TAU,
      al: 0.18 + r() * 0.34,
    });
  }
}

/* ---- 霓虹：街面灯带 + 运行时扫光 ---- */
const NEON_LINES = [
  { x: 0,   y: 86,  len: W, axis: 0, col: '#ff6bd6' },
  { x: 0,   y: 126, len: W, axis: 0, col: '#5ce1ff' },
  { x: 0,   y: 162, len: W, axis: 0, col: '#a86bff' },
  { x: 58,  y: 70,  len: H - 70, axis: 1, col: '#5ce1ff' },
  { x: 196, y: 70,  len: H - 70, axis: 1, col: '#ff6bd6' },
  { x: 286, y: 70,  len: H - 70, axis: 1, col: '#a86bff' },
];
const NEON_GLINT = [];
{
  const r = lcg(9182734);
  for (let i = 0; i < 26; i++) {
    NEON_GLINT.push({ x: r() * W, y: 68 + r() * (H - 68), ph: r() * TAU, sp: 0.6 + r() * 1.4, sz: r() < 0.35 ? 2 : 1 });
  }
}

/* ---- 霓虹：城市天际线数据（烘焙与窗灯闪烁共用同一份，保证对得上） ---- */
const NEON_WIN_COLS = ['#5ce1ff', '#ff6bd6', '#ffd166', '#a86bff', '#d8f3ff'];
const NEON_CITY = (function () {
  const r = lcg(612345);
  const cfg = [
    { shade: '#121020', edge: '#1a1732', top: 18, base: 64, winRate: 0.13 },  // 远景：暗、窗少
    { shade: '#181329', edge: '#241c42', top: 25, base: 66, winRate: 0.22 },  // 中景
    { shade: '#211a3a', edge: '#382b5c', top: 32, base: 68, winRate: 0.30 },  // 近景：亮
  ];
  const layers = [];
  for (let li = 0; li < cfg.length; li++) {
    const c = cfg[li];
    const list = [];
    let x = -6 + Math.floor(r() * 8);
    while (x < W + 6) {
      const w = 9 + Math.floor(r() * (10 + li * 6));
      const hMax = c.base - c.top;
      let top = Math.floor(c.base - hMax * (0.30 + r() * 0.70));
      /* 零星几栋拔高的地标塔楼，让天际线有高低起伏，而不是一排平房 */
      if (r() < 0.16) top = Math.max(6, top - (6 + Math.floor(r() * 14)));
      const wins = [];
      for (let wy = top + 3; wy <= c.base - 4; wy += 4) {
        for (let wx = x + 2; wx <= x + w - 3; wx += 3) {
          if (r() > c.winRate) continue;
          wins.push({
            x: wx, y: wy,
            col: NEON_WIN_COLS[Math.floor(r() * NEON_WIN_COLS.length)],
            ph: r() * TAU, sp: 0.35 + r() * 1.2,
          });
        }
      }
      list.push({
        x, w, top, base: c.base, shade: c.shade, edge: c.edge, wins,
        antenna: r() < 0.3 ? 5 + Math.floor(r() * 7) : 0,
        sign: li === 2 && w >= 15 && r() < 0.6 ? NEON_WIN_COLS[Math.floor(r() * 4)] : '',
      });
      x += w + 1 + Math.floor(r() * 3);
    }
    layers.push(list);
  }
  return layers;
})();

/* ---- 雨夜：三盏路灯的位置（烘焙光池和运行时反光共用） ---- */
const RAIN_LAMPS = [
  { x: 44,  y: 18, rgb: '168,206,255' },
  { x: 170, y: 12, rgb: '255,212,150' },
  { x: 286, y: 22, rgb: '168,206,255' },
];

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
   静态背景烘焙：每个场景各画一张离屏底图（只画一次），
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
  else if (key === 'snow') bakeSnow(g);
  else if (key === 'lava') bakeLava(g);
  else if (key === 'desert') bakeDesert(g);
  else if (key === 'neon') bakeNeon(g);
  else if (key === 'rain') bakeRain(g);
  else if (key === 'reef') bakeReef(g);
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

/* ---------- 雪原：冰封白蓝雪地（烘焙底图） ---------- */
function bakeSnow(g) {
  const r = lcg(20201124);

  // 底色：冷白偏蓝，上亮下暗，像被天光照着的雪面
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#f2f9ff');
  bg.addColorStop(0.35, '#e4f2ff');
  bg.addColorStop(0.7, '#d3e6f9');
  bg.addColorStop(1, '#bcd5ee');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);

  // 天光：左上冷白高光，给雪面一个明确亮源
  const sky = g.createRadialGradient(52, -18, 6, 78, 26, 210);
  sky.addColorStop(0, 'rgba(255,255,255,.42)');
  sky.addColorStop(0.42, 'rgba(226,244,255,.18)');
  sky.addColorStop(1, 'rgba(190,222,255,0)');
  g.fillStyle = sky;
  g.fillRect(0, 0, W, H);

  // 右下冷蓝阴影：做纵深
  const cool = g.createRadialGradient(W - 20, H + 6, 14, W - 20, H + 6, 165);
  cool.addColorStop(0, 'rgba(86,120,168,.16)');
  cool.addColorStop(0.55, 'rgba(86,120,168,.06)');
  cool.addColorStop(1, 'rgba(86,120,168,0)');
  g.fillStyle = cool;
  g.fillRect(0, 0, W, H);

  // 雪丘：扁椭圆，背光压蓝、受光提白
  for (let i = 0; i < 46; i++) {
    const cx = r() * W, cy = 6 + r() * (H - 12);
    const rx = 10 + r() * 22, ry = 3 + r() * 6;
    g.save();
    g.translate(cx, cy);
    g.scale(1, ry / rx);
    const sg = g.createRadialGradient(rx * 0.25, ry * 0.2, 1, 0, 0, rx);
    sg.addColorStop(0, 'rgba(150,182,216,.16)');
    sg.addColorStop(1, 'rgba(150,182,216,0)');
    g.fillStyle = sg;
    g.fillRect(-rx, -rx, rx * 2, rx * 2);
    g.fillStyle = 'rgba(255,255,255,.32)';
    g.fillRect(-rx * 0.55, -ry * 0.42, rx * 1.1, 1);
    g.restore();
  }

  // 风吹雪纹：同向细长斜线，读作 sastrugi（雪垄）
  for (let i = 0; i < 92; i++) {
    const x = r() * W, y = r() * H, len = 4 + r() * 12;
    const lean = r() < 0.5 ? 1 : -1;
    g.fillStyle = r() < 0.6 ? 'rgba(255,255,255,.34)' : 'rgba(158,192,226,.20)';
    for (let k = 0; k < len; k++) {
      g.fillRect(Math.round(x + k), Math.round(y + lean * Math.floor(k / 3)), 1, 1);
    }
  }

  // 雪面浅凹：短弧阴影，避免纯白平板
  for (let i = 0; i < 26; i++) {
    const x = 3 + r() * (W - 6), y = 6 + r() * (H - 12);
    g.fillStyle = 'rgba(140,176,214,.13)';
    g.fillRect(Math.round(x), Math.round(y), 3 + Math.floor(r() * 4), 1);
  }

  // 冰晶反光：阳光打在雪粒上的小白点 / 冰蓝点
  for (let i = 0; i < 320; i++) {
    const x = Math.floor(r() * W), y = Math.floor(r() * H);
    g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.78)' : 'rgba(214,244,255,.55)';
    g.fillRect(x, y, 1, 1);
  }

  // 稀疏裸露砾石：冷灰小块，让纯白有层次
  for (let i = 0; i < 18; i++) {
    const x = 3 + Math.floor(r() * (W - 6)), y = 6 + Math.floor(r() * (H - 12));
    g.fillStyle = 'rgba(120,140,166,.18)';
    g.fillRect(x, y, 2, 1);
    g.fillStyle = 'rgba(255,255,255,.5)';
    g.fillRect(x, y - 1, 1, 1);
  }

  // 底部积雪压暗
  const bot = g.createLinearGradient(0, H - 26, 0, H);
  bot.addColorStop(0, 'rgba(120,156,196,0)');
  bot.addColorStop(1, 'rgba(96,132,176,.16)');
  g.fillStyle = bot;
  g.fillRect(0, H - 26, W, 26);

  // 四周冷边
  g.fillStyle = 'rgba(72,104,142,.18)';
  g.fillRect(0, 0, W, 2); g.fillRect(0, H - 2, W, 2);
  g.fillRect(0, 0, 2, H); g.fillRect(W - 2, 0, 2, H);
}

/* ---------- 熔岩：黑曜玄武岩 + 熔光裂隙（烘焙底图） ---------- */
function bakeLava(g) {
  const r = lcg(90210);

  // 玄武岩底色：黑褐，顶部受热偏红
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#2a1715');
  bg.addColorStop(0.4, '#1c0f0e');
  bg.addColorStop(0.75, '#140a09');
  bg.addColorStop(1, '#0c0606');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);

  // 冷却岩壳：大块暗斑 + 受热边
  for (let i = 0; i < 34; i++) {
    const cx = r() * W, cy = r() * H, rx = 8 + r() * 18, ry = 5 + r() * 10;
    g.save();
    g.translate(cx, cy);
    g.scale(1, ry / rx);
    g.fillStyle = r() < 0.55 ? 'rgba(48,26,22,.35)' : 'rgba(6,2,2,.45)';
    g.fillRect(-rx, -rx, rx * 2, rx * 2);
    g.fillStyle = 'rgba(120,58,36,.10)';
    g.fillRect(-rx * 0.6, -rx * 0.6, rx * 1.2, 1);
    g.restore();
  }

  // 灰烬颗粒
  for (let i = 0; i < 2400; i++) {
    const x = Math.floor(r() * W), y = Math.floor(r() * H);
    g.fillStyle = r() < 0.6 ? 'rgba(0,0,0,.16)' : 'rgba(200,150,120,.035)';
    g.fillRect(x, y, 1, 1);
  }

  // 火山砾石：暗岩 + 受热上沿
  for (let i = 0; i < 90; i++) {
    const x = 3 + Math.floor(r() * (W - 6)), y = 6 + Math.floor(r() * (H - 12));
    g.fillStyle = 'rgba(4,2,2,.6)';
    g.fillRect(x, y + 1, 2, 1);
    g.fillStyle = r() < 0.5 ? '#331d18' : '#40241d';
    g.fillRect(x, y, 2, 1);
    g.fillStyle = 'rgba(255,120,60,.16)';
    g.fillRect(x, y, 1, 1);
  }

  // 熔岩裂隙：固定脉络，炭化边 + 黑槽 + 分级熔光（亮芯由动态层呼吸）
  g.fillStyle = 'rgba(40,14,10,.5)';
  for (const p of FISS_PIX) g.fillRect(p[0] - 1, p[1] - 1, 3, 3);
  g.fillStyle = '#050202';
  for (const p of FISS_PIX) g.fillRect(p[0], p[1], 1, 1);
  g.fillStyle = 'rgba(255,84,36,.06)';
  for (const p of FISS_HI) g.fillRect(p[0] - 2, p[1] - 2, 5, 5);
  g.fillStyle = 'rgba(255,98,40,.26)';
  for (const p of FISS_PIX) g.fillRect(p[0], p[1], 1, 1);
  g.fillStyle = 'rgba(255,132,56,.44)';
  for (const p of FISS_HI) g.fillRect(p[0], p[1], 1, 1);

  // 地心热光：底部中央橙红
  const hg = g.createRadialGradient(W * 0.5, H * 0.86, 8, W * 0.5, H * 0.86, 185);
  hg.addColorStop(0, 'rgba(255,108,44,.26)');
  hg.addColorStop(0.42, 'rgba(214,58,18,.10)');
  hg.addColorStop(1, 'rgba(110,16,8,0)');
  g.fillStyle = hg;
  g.fillRect(0, 0, W, H);

  // 顶部压暗
  const tg = g.createLinearGradient(0, 0, 0, 66);
  tg.addColorStop(0, 'rgba(6,2,3,.6)');
  tg.addColorStop(1, 'rgba(6,2,3,0)');
  g.fillStyle = tg;
  g.fillRect(0, 0, W, 66);

  // 四周压边 + 热光描边
  g.fillStyle = '#050202';
  g.fillRect(0, 0, W, 2); g.fillRect(0, H - 2, W, 2);
  g.fillRect(0, 0, 2, H); g.fillRect(W - 2, 0, 2, H);
  g.fillStyle = 'rgba(255,120,60,.18)';
  g.fillRect(0, 2, W, 1); g.fillRect(0, H - 3, W, 1);
  g.fillRect(2, 0, 1, H); g.fillRect(W - 3, 0, 1, H);
}

/* ---------- 荒漠：暖砂 + 沙丘 + 风蚀碎石（烘焙底图） ---------- */
function bakeDesert(g) {
  const r = lcg(661199);

  // 砂面底色：上亮下暗，像被午后太阳晒热的地面
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#efcb88');
  bg.addColorStop(0.34, '#e2b26c');
  bg.addColorStop(0.68, '#c9904e');
  bg.addColorStop(1, '#a8743f');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);

  // 左上烈日
  const sun = g.createRadialGradient(58, -16, 6, 92, 28, 210);
  sun.addColorStop(0, 'rgba(255,248,208,.36)');
  sun.addColorStop(0.42, 'rgba(255,230,164,.13)');
  sun.addColorStop(1, 'rgba(255,216,140,0)');
  g.fillStyle = sun;
  g.fillRect(0, 0, W, H);

  // 沙丘：受光面亮、背光面冷，靠扁椭圆叠出起伏
  for (let i = 0; i < 30; i++) {
    const cx = r() * W, cy = r() * H, rx = 16 + r() * 30, ry = 4 + r() * 9;
    g.save();
    g.translate(cx, cy);
    g.scale(1, ry / rx);
    const dg = g.createRadialGradient(rx * 0.25, -ry * 0.2, 2, 0, 0, rx);
    dg.addColorStop(0, 'rgba(255,244,196,.20)');
    dg.addColorStop(0.55, 'rgba(228,178,104,.10)');
    dg.addColorStop(1, 'rgba(150,96,44,0)');
    g.fillStyle = dg;
    g.fillRect(-rx, -rx, rx * 2, rx * 2);
    g.fillStyle = 'rgba(255,248,208,.28)';
    g.fillRect(-rx * 0.55, -1, rx * 1.1, 1);
    g.restore();
  }

  // 风纹：同向细长波线，读作沙脊
  for (let i = 0; i < 1300; i++) {
    const x = Math.floor(r() * W), y = Math.floor(r() * H);
    const len = 3 + Math.floor(r() * 9);
    g.fillStyle = r() < 0.55 ? 'rgba(255,236,182,.34)' : 'rgba(150,96,44,.26)';
    for (let k = 0; k < len; k++) {
      g.fillRect(x + k, y + Math.floor(Math.sin(k * 0.9 + i) * 1.2), 1, 1);
    }
  }

  // 干裂与碎砂
  for (let i = 0; i < 340; i++) {
    const x = Math.floor(r() * W), y = Math.floor(r() * H);
    g.fillStyle = r() < 0.5 ? 'rgba(255,244,204,.24)' : 'rgba(110,66,28,.22)';
    g.fillRect(x, y, 1, 1);
  }

  // 风蚀碎石：投影 + 亮顶
  for (let i = 0; i < 70; i++) {
    const x = 3 + Math.floor(r() * (W - 7)), y = 8 + Math.floor(r() * (H - 14));
    const w = 2 + Math.floor(r() * 3);
    g.fillStyle = 'rgba(92,52,20,.30)';
    g.fillRect(x, y + 2, w, 1);
    g.fillStyle = r() < 0.5 ? '#8a6038' : '#9c7144';
    g.fillRect(x, y, w, 2);
    g.fillStyle = 'rgba(255,242,198,.45)';
    g.fillRect(x, y, 1, 1);
  }

  // 枯灌木：几根暗枝 + 一两片存活的绿叶
  for (let i = 0; i < 16; i++) {
    const cx = 8 + Math.floor(r() * (W - 16)), cy = 12 + Math.floor(r() * (H - 26));
    g.fillStyle = 'rgba(92,54,24,.55)';
    for (let k = 0; k < 4; k++) {
      const dx = Math.round((r() - 0.5) * 9), h = 3 + Math.floor(r() * 5);
      g.fillRect(cx + dx, cy - h, 1, h);
      g.fillRect(cx + dx + (dx < 0 ? -1 : 1), cy - h + 1, 1, 2);
    }
    if (r() < 0.4) {
      g.fillStyle = 'rgba(140,168,86,.7)';
      g.fillRect(cx + 1, cy - 2, 1, 1);
      g.fillRect(cx - 1, cy - 1, 1, 1);
    }
  }

  // 底边热砂压暗
  const bot = g.createLinearGradient(0, H - 24, 0, H);
  bot.addColorStop(0, 'rgba(96,52,18,0)');
  bot.addColorStop(1, 'rgba(96,52,18,.20)');
  g.fillStyle = bot;
  g.fillRect(0, H - 24, W, 24);

  // 四周暖边
  g.fillStyle = 'rgba(96,56,18,.20)';
  g.fillRect(0, 0, W, 2); g.fillRect(0, H - 2, W, 2);
  g.fillRect(0, 0, 2, H); g.fillRect(W - 2, 0, 2, H);
}

/* ---------- 霓虹：夜色都市天际线 + 湿街反光（烘焙底图） ---------- */
function bakeNeon(g) {
  const r = lcg(332211);
  const HZ = 68;   // 地平线

  // 夜空：越靠近地平线越被霓虹染成紫色
  const sky = g.createLinearGradient(0, 0, 0, HZ);
  sky.addColorStop(0, '#05050c');
  sky.addColorStop(0.52, '#0d0a1c');
  sky.addColorStop(1, '#241242');
  g.fillStyle = sky;
  g.fillRect(0, 0, W, HZ);

  // 稀疏星点
  for (let i = 0; i < 40; i++) {
    const x = Math.floor(r() * W), y = Math.floor(r() * 42);
    g.fillStyle = 'rgba(205,222,255,' + (0.05 + r() * 0.13).toFixed(3) + ')';
    g.fillRect(x, y, 1, 1);
  }

  // 月亮：给天际线一个视觉锚点，不只靠光污染撑夜感
  const mx = 266, my = 28;
  const mg = g.createRadialGradient(mx, my, 2, mx, my, 30);
  mg.addColorStop(0, 'rgba(255,240,210,.20)');
  mg.addColorStop(0.5, 'rgba(255,214,158,.07)');
  mg.addColorStop(1, 'rgba(255,214,150,0)');
  g.fillStyle = mg;
  g.fillRect(mx - 30, my - 30, 60, 60);
  g.fillStyle = 'rgba(255,246,224,.82)';
  g.beginPath();
  g.arc(mx, my, 7, 0, TAU);
  g.fill();
  g.fillStyle = 'rgba(255,236,204,.34)';
  g.fillRect(mx - 4, my - 2, 3, 1);
  g.fillRect(mx + 1, my + 2, 3, 1);
  g.fillStyle = 'rgba(255,252,240,.55)';
  g.fillRect(mx - 2, my - 5, 3, 1);

  // 城市光污染：左青右粉，压在地平线上
  const glowA = g.createRadialGradient(W * 0.26, HZ - 4, 4, W * 0.26, HZ - 4, 92);
  glowA.addColorStop(0, 'rgba(92,225,255,.20)');
  glowA.addColorStop(1, 'rgba(92,225,255,0)');
  g.fillStyle = glowA; g.fillRect(0, 0, W, HZ + 24);
  const glowB = g.createRadialGradient(W * 0.73, HZ, 4, W * 0.73, HZ, 108);
  glowB.addColorStop(0, 'rgba(255,107,214,.24)');
  glowB.addColorStop(1, 'rgba(255,107,214,0)');
  g.fillStyle = glowB; g.fillRect(0, 0, W, HZ + 36);

  // 街面：湿沥青 + 错缝大石板
  const street = g.createLinearGradient(0, HZ - 2, 0, H);
  street.addColorStop(0, '#141026');
  street.addColorStop(0.34, '#0c0a1a');
  street.addColorStop(1, '#05040b');
  g.fillStyle = street;
  g.fillRect(0, HZ - 2, W, H - HZ + 2);
  g.fillStyle = 'rgba(130,110,200,.05)';
  for (let y = HZ + 4; y < H; y += 20) {
    g.fillRect(0, y, W, 1);
    const off = (Math.floor((y - HZ) / 20) % 2) ? 16 : 0;
    for (let x = off; x < W; x += 32) g.fillRect(x, y, 1, 20);
  }

  // 三层天际线（远 → 近）
  for (let li = 0; li < NEON_CITY.length; li++) {
    for (const b of NEON_CITY[li]) {
      g.fillStyle = b.shade;
      g.fillRect(b.x, b.top, b.w, b.base - b.top);
      // 楼顶轮廓与天线
      g.fillStyle = b.edge;
      g.fillRect(b.x, b.top, b.w, 1);
      // 高楼楼顶被城市霓虹勾亮的一条边
      if (b.top < 40) {
        g.globalAlpha = 0.5;
        g.fillStyle = li === 2 ? '#ff9ee6' : '#9fd8ff';
        g.fillRect(b.x + 1, b.top, Math.max(2, b.w - 2), 1);
        g.globalAlpha = 1;
      }
      if (b.antenna) {
        const ax = b.x + Math.floor(b.w / 2);
        g.fillRect(ax, b.top - b.antenna, 1, b.antenna);
        g.fillStyle = '#ff5d6c';
        g.fillRect(ax, b.top - b.antenna, 1, 1);
      }
      // 近景楼顶的杂物：水箱 / 空调外机，让轮廓不再是一块块方砖
      if (li === 2 && b.w >= 12) {
        const px2 = b.x + 2 + Math.floor(r() * Math.max(1, b.w - 9));
        if (r() < 0.55) {
          g.fillStyle = '#0a0818';
          g.fillRect(px2, b.top - 5, 5, 4);
          g.fillStyle = '#2a2344';
          g.fillRect(px2 + 1, b.top - 4, 3, 2);
          g.fillStyle = 'rgba(130,118,200,.32)';
          g.fillRect(px2 + 1, b.top - 4, 3, 1);
          g.fillRect(px2, b.top - 1, 1, 1);
          g.fillRect(px2 + 4, b.top - 1, 1, 1);
        } else {
          g.fillStyle = '#171331';
          g.fillRect(px2, b.top - 3, 6, 3);
          g.fillStyle = 'rgba(160,150,220,.26)';
          g.fillRect(px2 + 1, b.top - 2, 4, 1);
        }
      }
      // 窗灯：远层稀疏偏暗，近层亮
      for (const w of b.wins) {
        g.globalAlpha = 0.10 + 0.12 * li + r() * 0.08;
        g.fillStyle = w.col;
        g.fillRect(w.x, w.y, 1, 1);
      }
      g.globalAlpha = 1;
      // 楼体上的横向灯箱广告（只挂在够宽的楼上）
      if (li >= 1 && b.w >= 18 && b.top < 50 && r() < 0.55) {
        const bc = b.sign || (li === 2 ? '#ff6bd6' : '#5ce1ff');
        const bx = b.x + 3, by = b.top + 6, bw = b.w - 8, bh = 6;
        g.globalAlpha = 0.12;
        g.fillStyle = bc;
        g.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
        g.globalAlpha = 0.55;
        g.fillStyle = '#0a0818';
        g.fillRect(bx, by, bw, bh);
        g.globalAlpha = 1;
        g.fillStyle = bc;
        for (let k = 0; k < bw - 1; k += 3) g.fillRect(bx + 1 + k, by + 2, 2, 2);
        g.fillStyle = 'rgba(255,255,255,.5)';
        g.fillRect(bx + bw - 3, by + 2, 1, 1);
      }
      // 近景楼：竖向霓虹招牌
      if (b.sign) {
        const sx = b.x + b.w - 5, sy = b.top + 5;
        const sh = Math.min(b.base - b.top - 8, 16);
        if (sh >= 6) {
          g.globalAlpha = 0.14;
          g.fillStyle = b.sign;
          g.fillRect(sx - 2, sy - 2, 7, sh + 4);
          g.globalAlpha = 0.92;
          g.fillRect(sx, sy, 3, sh);
          g.globalAlpha = 1;
          g.fillStyle = '#fff7ff';
          for (let k = sy + 2; k < sy + sh - 1; k += 4) g.fillRect(sx + 1, k, 1, 1);
        }
      }
    }
  }

  // 楼间电线 + 吊灯：把「一排列楼」连成「一条街」
  for (let i = 0; i < 4; i++) {
    const cx = 34 + i * 82, y0 = 54 + Math.floor(r() * 7);
    g.fillStyle = 'rgba(132,124,196,.20)';
    for (let x = -42; x <= 42; x++) {
      const yy = Math.round(y0 + Math.sin((x / 42) * Math.PI) * 3);
      g.fillRect(cx + x, yy, 1, 1);
    }
    for (let k = -2; k <= 2; k++) {
      const lx = cx + k * 17;
      const ly = Math.round(y0 + Math.sin(((k * 17) / 42) * Math.PI) * 3 + 4);
      g.fillStyle = 'rgba(255,206,132,.20)';
      g.fillRect(lx - 1, ly - 1, 3, 3);
      g.fillStyle = 'rgba(255,240,196,.78)';
      g.fillRect(lx, ly, 1, 1);
    }
  }

  // 街尾斑马线：给湿街一个尺度参照
  g.fillStyle = 'rgba(170,222,255,.10)';
  for (let x = 16; x < W - 16; x += 16) g.fillRect(x, H - 18, 9, 7);

  // 地平线雾霭：把楼脚和街面接起来
  const haze = g.createLinearGradient(0, HZ - 12, 0, HZ + 10);
  haze.addColorStop(0, 'rgba(255,107,214,0)');
  haze.addColorStop(0.45, 'rgba(205,120,255,.16)');
  haze.addColorStop(0.8, 'rgba(92,225,255,.10)');
  haze.addColorStop(1, 'rgba(92,225,255,0)');
  g.fillStyle = haze;
  g.fillRect(0, HZ - 12, W, 22);

  // 霓虹在湿街上的竖向倒影
  const rfCols = ['255,107,214', '92,225,255', '168,107,255', '255,209,102'];
  for (let i = 0; i < 8; i++) {
    const x = 8 + i * 40 + Math.floor(r() * 14);
    const col = rfCols[i % rfCols.length];
    const len = 30 + Math.floor(r() * 64);
    const grad = g.createLinearGradient(0, HZ, 0, HZ + len);
    grad.addColorStop(0, 'rgba(' + col + ',.16)');
    grad.addColorStop(0.32, 'rgba(' + col + ',.06)');
    grad.addColorStop(1, 'rgba(' + col + ',0)');
    g.fillStyle = grad;
    g.fillRect(x, HZ + 2, 3 + (i % 2), len);
    g.fillStyle = 'rgba(' + col + ',.22)';
    g.fillRect(x + 1, HZ + 2, 1, Math.min(len, 26));
  }

  // 反光水滩
  for (let i = 0; i < 10; i++) {
    const cx = 10 + r() * (W - 20), cy = HZ + 12 + r() * (H - HZ - 24);
    const rx = 6 + r() * 13, ry = 2 + r() * 4;
    g.save();
    g.translate(cx, cy);
    g.scale(1, ry / rx);
    g.fillStyle = 'rgba(8,6,18,.60)';
    g.fillRect(-rx, -rx, rx * 2, rx * 2);
    g.fillStyle = r() < 0.5 ? 'rgba(255,107,214,.20)' : 'rgba(92,225,255,.20)';
    g.fillRect(-rx * 0.78, -rx * 0.12, rx * 1.56, 1);
    g.restore();
  }

  // 街面细碎灯点
  for (let i = 0; i < 110; i++) {
    const x = Math.floor(r() * W), y = HZ + Math.floor(r() * (H - HZ));
    const warm = r() < 0.4;
    g.fillStyle = warm ? 'rgba(255,196,120,.18)' : 'rgba(140,210,255,.16)';
    g.fillRect(x, y, 1, 1);
  }

  // 灯带：暖光晕 + 1px 灯芯
  for (const l of NEON_LINES) {
    g.globalAlpha = 0.07;
    g.fillStyle = l.col;
    if (l.axis === 0) g.fillRect(l.x, l.y - 2, l.len, 5);
    else g.fillRect(l.x - 2, l.y, 5, l.len);
    g.globalAlpha = 0.32;
    if (l.axis === 0) g.fillRect(l.x, l.y, l.len, 1);
    else g.fillRect(l.x, l.y, 1, l.len);
    g.globalAlpha = 1;
  }

  // HUD 区压暗 + 四周暗边
  const tg = g.createLinearGradient(0, 0, 0, 22);
  tg.addColorStop(0, 'rgba(3,2,9,.5)');
  tg.addColorStop(1, 'rgba(3,2,9,0)');
  g.fillStyle = tg;
  g.fillRect(0, 0, W, 22);
  g.fillStyle = 'rgba(3,2,9,.55)';
  g.fillRect(0, 0, W, 2); g.fillRect(0, H - 2, W, 2);
  g.fillRect(0, 0, 2, H); g.fillRect(W - 2, 0, 2, H);
}

/* ---------- 雨夜：湿砖广场 + 路灯光池 ---------- */
function bakeRain(g) {
  const r = lcg(771003);

  // 湿冷底色：上亮下暗
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#1a2634');
  bg.addColorStop(0.38, '#0f1826');
  bg.addColorStop(1, '#04070d');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);

  // 大块湿痕：不规则明暗斑，先打散地面，不让它显得平
  for (let i = 0; i < 30; i++) {
    const cx = r() * W, cy = r() * H;
    const rx = 16 + r() * 46, ry = 8 + r() * 20;
    g.save();
    g.translate(cx, cy);
    g.scale(1, ry / rx);
    g.fillStyle = r() < 0.55 ? 'rgba(120,160,205,.05)' : 'rgba(2,6,12,.28)';
    g.fillRect(-rx, -rx, rx * 2, rx * 2);
    g.restore();
  }

  // 广场石板：错缝铺装，每块亮度略有差异
  for (let y = 0, row = 0; y < H; y += 16, row++) {
    const off = (row % 2) * 16;
    for (let x = -16 + off; x < W; x += 32) {
      g.fillStyle = 'rgba(150,185,225,' + (0.040 + r() * 0.065).toFixed(3) + ')';
      g.fillRect(x + 1, y + 1, 30, 14);
      g.fillStyle = 'rgba(205,228,255,.030)';
      g.fillRect(x + 1, y + 1, 30, 1);
      g.fillStyle = 'rgba(0,0,0,.15)';
      g.fillRect(x + 1, y + 14, 30, 1);
      g.fillStyle = 'rgba(4,8,14,.30)';
      g.fillRect(x, y, 1, 16);
      g.fillRect(x + 31, y, 1, 16);
      g.fillStyle = 'rgba(4,8,14,.22)';
      g.fillRect(x, y + 15, 32, 1);
    }
  }

  // 三盏路灯：整片光池 + 湿地面拉长的竖向倒影
  for (const L of RAIN_LAMPS) {
    const cy = L.y + 28;
    const pool = g.createRadialGradient(L.x, cy, 4, L.x, cy, 66);
    pool.addColorStop(0, 'rgba(' + L.rgb + ',.22)');
    pool.addColorStop(0.5, 'rgba(' + L.rgb + ',.075)');
    pool.addColorStop(1, 'rgba(' + L.rgb + ',0)');
    g.fillStyle = pool;
    g.fillRect(L.x - 70, L.y - 30, 140, 140);
    const len = 62 + (L.x % 29);
    const streak = g.createLinearGradient(0, cy - 2, 0, cy + len);
    streak.addColorStop(0, 'rgba(' + L.rgb + ',.26)');
    streak.addColorStop(0.28, 'rgba(' + L.rgb + ',.10)');
    streak.addColorStop(1, 'rgba(' + L.rgb + ',0)');
    g.fillStyle = streak;
    g.fillRect(L.x - 2, cy - 2, 4, len);
    g.fillStyle = 'rgba(255,255,255,.10)';
    g.fillRect(L.x - 1, cy - 2, 1, Math.min(len, 30));
  }

  // 水洼：暗蓝积水 + 冷光边缘 + 碎反光
  for (let i = 0; i < 14; i++) {
    const cx = 10 + r() * (W - 20), cy = 8 + r() * (H - 16);
    const rx = 6 + r() * 14, ry = 2.5 + r() * 4.5;
    g.save();
    g.translate(cx, cy);
    g.scale(1, ry / rx);
    g.fillStyle = 'rgba(10,20,34,.72)';
    g.fillRect(-rx, -rx, rx * 2, rx * 2);
    g.strokeStyle = 'rgba(150,195,240,.22)';
    g.lineWidth = 1;
    g.strokeRect(-rx + 1, -rx + 1, rx * 2 - 2, rx * 2 - 2);
    g.fillStyle = 'rgba(196,224,255,.24)';
    g.fillRect(-rx * 0.52, -rx * 0.12, rx * 1.04, 1);
    g.fillStyle = 'rgba(255,255,255,.10)';
    g.fillRect(-rx * 0.2, -rx * 0.3, rx * 0.5, 1);
    g.restore();
  }

  // 大片浅积水：把铺装“淹”掉一部分，湿意更足
  for (let i = 0; i < 4; i++) {
    const cx = 20 + r() * (W - 40), cy = 30 + r() * (H - 60);
    const rx = 26 + r() * 34, ry = 5 + r() * 7;
    g.save();
    g.translate(cx, cy);
    g.scale(1, ry / rx);
    g.fillStyle = 'rgba(9,18,32,.55)';
    g.fillRect(-rx, -rx, rx * 2, rx * 2);
    g.strokeStyle = 'rgba(150,195,240,.16)';
    g.lineWidth = 1;
    g.strokeRect(-rx + 1, -rx + 1, rx * 2 - 2, rx * 2 - 2);
    g.fillStyle = 'rgba(190,224,255,.16)';
    g.fillRect(-rx * 0.7, -rx * 0.06, rx * 1.4, 1);
    g.restore();
  }

  // 湿地面把远处灯光拉成的竖向冷反光
  for (let i = 0; i < 6; i++) {
    const x = 12 + i * 52 + Math.floor(r() * 18);
    const y0 = 6 + Math.floor(r() * 30);
    const len = 26 + Math.floor(r() * 46);
    const col = i % 2 ? '150,190,240' : '120,150,210';
    const grad = g.createLinearGradient(0, y0, 0, y0 + len);
    grad.addColorStop(0, 'rgba(' + col + ',.10)');
    grad.addColorStop(1, 'rgba(' + col + ',0)');
    g.fillStyle = grad;
    g.fillRect(x, y0, 2 + (i % 2), len);
  }

  // 井盖
  const mx = 236, my = 112;
  g.fillStyle = 'rgba(6,10,18,.55)';
  g.fillRect(mx - 9, my - 9, 18, 18);
  g.fillStyle = 'rgba(108,138,174,.18)';
  g.fillRect(mx - 8, my - 8, 16, 16);
  g.fillStyle = 'rgba(6,10,16,.55)';
  for (let i = -6; i <= 6; i += 4) g.fillRect(mx - 7, my + i, 14, 1);
  g.fillStyle = 'rgba(170,200,238,.12)';
  g.fillRect(mx - 8, my - 8, 16, 1);

  // 褪色的地标线：一条断续的旧车道线
  g.fillStyle = 'rgba(226,236,255,.07)';
  for (let x = 4; x < W; x += 46) g.fillRect(x, 152, 24, 2);

  // 裂纹与积水冲刷痕
  for (let i = 0; i < 10; i++) {
    const cx = r() * W, cy = r() * H;
    g.strokeStyle = 'rgba(5,9,15,.55)';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(cx, cy);
    g.lineTo(cx + 3 + r() * 9, cy + (r() < 0.5 ? -2 : 2));
    g.stroke();
  }
  // 几片落叶 / 碎屑
  for (let i = 0; i < 14; i++) {
    const x = Math.floor(r() * W), y = Math.floor(r() * H);
    g.fillStyle = r() < 0.5 ? 'rgba(96,118,84,.28)' : 'rgba(140,120,78,.22)';
    g.fillRect(x, y, 1 + (r() < 0.3 ? 1 : 0), 1);
  }

  // 四周压暗，突出雨夜
  const vign = g.createRadialGradient(W / 2, H / 2, H * 0.34, W / 2, H / 2, W * 0.72);
  vign.addColorStop(0, 'rgba(2,4,8,0)');
  vign.addColorStop(1, 'rgba(2,4,8,.55)');
  g.fillStyle = vign;
  g.fillRect(0, 0, W, H);
}

/* ---------- 环礁：澄澈泻湖 + 珊瑚礁盘（烘焙底图） ---------- */
function bakeReef(g) {
  const r = lcg(304911);

  // 泻湖水：整体偏青，越靠边越深，右上角压一层深水
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#59dcd4');
  bg.addColorStop(0.34, '#34b8bc');
  bg.addColorStop(1, '#0e6478');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);

  const deep = g.createLinearGradient(0, 0, W, H);
  deep.addColorStop(0, 'rgba(10,96,108,0)');
  deep.addColorStop(0.55, 'rgba(8,84,104,.10)');
  deep.addColorStop(1, 'rgba(4,52,76,.30)');
  g.fillStyle = deep;
  g.fillRect(0, 0, W, H);

  // 阳光从左上斜插进浅滩：一团偏白的透光区
  const sun = g.createRadialGradient(W * 0.30, H * 0.24, 6, W * 0.30, H * 0.24, 150);
  sun.addColorStop(0, 'rgba(206,255,246,.30)');
  sun.addColorStop(0.42, 'rgba(150,242,232,.14)');
  sun.addColorStop(1, 'rgba(20,120,140,0)');
  g.fillStyle = sun;
  g.fillRect(0, 0, W, H);

  // 水下光网：波动的亮线，模拟水面把阳光打散
  for (let i = 0; i < 22; i++) {
    const y0 = 4 + i * 8 + r() * 5;
    const ph = r() * TAU;
    const amp = 1.4 + r() * 2.4;
    const seg = 7 + Math.floor(r() * 15);
    const gap = 5 + Math.floor(r() * 13);
    g.fillStyle = 'rgba(228,255,250,' + (0.05 + r() * 0.07).toFixed(3) + ')';
    for (let x = 0; x < W; x += 2) {
      const yy = Math.round(y0 + Math.sin(x / 19 + ph) * amp);
      if ((x + Math.floor(r() * 3)) % (seg + gap) < seg) g.fillRect(x, yy, 2, 1);
    }
  }

  // 沙洲：用半径抖动的多边形做出有机轮廓，湿边 + 内圈亮沙 + 泡沫线
  function sandbar(cx, cy, rx, ry, tone, hi) {
    const pts = [];
    for (let a = 0; a < TAU; a += 0.19) {
      const k = 0.90 + r() * 0.22;
      pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
    }
    function blob(mul, col) {
      g.fillStyle = col;
      g.beginPath();
      g.moveTo(pts[0][0] * mul + cx * (1 - mul), pts[0][1] * mul + cy * (1 - mul));
      for (let i = 1; i < pts.length; i++) {
        g.lineTo(pts[i][0] * mul + cx * (1 - mul), pts[i][1] * mul + cy * (1 - mul));
      }
      g.closePath();
      g.fill();
    }
    blob(1.05, 'rgba(20,98,102,.30)');
    blob(1.0, tone);
    blob(0.66, hi);
    // 边缘浪花：沿轮廓撒断断续续的白点
    g.fillStyle = 'rgba(238,255,252,.44)';
    for (const p of pts) {
      if (r() < 0.55) continue;
      g.fillRect(Math.round(p[0]), Math.round(p[1]), 1, 1);
    }
    // 沙面细纹：微小的明暗颗粒，避免大块死白
    for (let k = 0; k < 46; k++) {
      const a = r() * TAU, d = r() * 0.58;
      const x = Math.round(cx + Math.cos(a) * rx * d);
      const y = Math.round(cy + Math.sin(a) * ry * d);
      g.fillStyle = r() < 0.5 ? 'rgba(255,255,240,.18)' : 'rgba(150,132,88,.14)';
      g.fillRect(x, y, 1 + (r() < 0.3 ? 1 : 0), 1);
    }
  }
  sandbar(92, 122, 58, 24, 'rgba(232,222,180,.50)', 'rgba(247,241,208,.38)');
  sandbar(230, 58, 46, 18, 'rgba(228,217,174,.44)', 'rgba(244,237,202,.32)');
  sandbar(32, 36, 28, 11, 'rgba(226,216,176,.38)', 'rgba(242,236,204,.28)');
  sandbar(274, 152, 36, 13, 'rgba(230,219,178,.42)', 'rgba(245,239,206,.30)');
  sandbar(156, 20, 26, 9, 'rgba(228,218,178,.34)', 'rgba(244,238,206,.26)');

  // 砾石、贝壳与砂粒：有投影才不像贴纸
  for (let i = 0; i < 300; i++) {
    const x = Math.floor(r() * W), y = Math.floor(r() * H);
    if (r() < 0.5) {
      g.fillStyle = 'rgba(18,92,98,.20)';
      g.fillRect(x, y + 1, 2, 1);
    }
    g.fillStyle = r() < 0.5 ? 'rgba(255,252,232,.26)' : 'rgba(20,100,106,.18)';
    g.fillRect(x, y, 1 + (r() < 0.18 ? 1 : 0), 1);
  }

  // 海草床：成片的细叶，深绿带亮尖
  for (let i = 0; i < 7; i++) {
    const cx = 20 + r() * (W - 40), cy = 16 + r() * (H - 34);
    const n = 8 + Math.floor(r() * 9);
    g.fillStyle = 'rgba(16,92,80,.34)';
    for (let k = 0; k < n; k++) {
      const x = Math.round(cx + (r() - 0.5) * 22);
      const y = Math.round(cy + (r() - 0.5) * 10);
      const h = 3 + Math.floor(r() * 4);
      g.fillRect(x, y - h, 1, h);
    }
    g.fillStyle = 'rgba(120,214,164,.28)';
    for (let k = 0; k < 4; k++) {
      const x = Math.round(cx + (r() - 0.5) * 18);
      const y = Math.round(cy + (r() - 0.5) * 8);
      g.fillRect(x, y - 4, 1, 2);
    }
  }

  // 珊瑚盘：先落影，再画头体和高光，像真的有体积
  const coralCols = [
    ['rgba(120,44,70,.60)', 'rgba(255,138,170,.62)', 'rgba(255,196,214,.55)'],
    ['rgba(120,66,32,.55)', 'rgba(255,176,110,.58)', 'rgba(255,214,164,.50)'],
    ['rgba(72,48,110,.55)', 'rgba(186,140,255,.54)', 'rgba(220,196,255,.46)'],
  ];
  for (let i = 0; i < 14; i++) {
    const cx = 18 + r() * (W - 36), cy = 14 + r() * (H - 30);
    const rad = 4.6 + r() * 6.0;
    const c = coralCols[i % coralCols.length];
    // 投影
    g.fillStyle = 'rgba(6,58,70,.26)';
    g.beginPath();
    g.ellipse(cx + 1, cy + 2, rad + 1.4, rad * 0.56, 0, 0, TAU);
    g.fill();
    // 珊瑚头
    g.fillStyle = c[0];
    g.beginPath();
    g.ellipse(cx, cy + 1, rad + 0.8, rad * 0.5, 0, 0, TAU);
    g.fill();
    g.fillStyle = c[1];
    g.beginPath();
    g.ellipse(cx, cy, rad, rad * 0.46, 0, 0, TAU);
    g.fill();
    // 顶部受光
    g.fillStyle = c[2];
    g.beginPath();
    g.ellipse(cx - rad * 0.22, cy - rad * 0.12, rad * 0.52, rad * 0.22, 0, 0, TAU);
    g.fill();
    // 分枝尖
    for (let k = 0; k < 4; k++) {
      const a = -0.9 + k * 0.6;
      const bx = Math.round(cx + Math.cos(a) * (rad + 1));
      const by = Math.round(cy + Math.sin(a) * (rad * 0.5) - 1);
      g.fillStyle = c[1];
      g.fillRect(bx, by, 1, 2);
    }
  }

  // 零星礁石：灰青色石块，硬边 + 顶部亮面
  for (let i = 0; i < 4; i++) {
    const cx = 24 + r() * (W - 48), cy = 20 + r() * (H - 40);
    const w = 5 + Math.floor(r() * 7), h = 3 + Math.floor(r() * 4);
    g.fillStyle = 'rgba(5,52,64,.28)';
    g.fillRect(cx + 1, cy + h / 2 + 1, w, 2);
    g.fillStyle = 'rgba(52,96,106,.50)';
    g.fillRect(cx, cy, w, h);
    g.fillStyle = 'rgba(148,206,206,.42)';
    g.fillRect(cx, cy, w - 2, 1);
    g.fillStyle = 'rgba(20,70,82,.42)';
    g.fillRect(cx, cy + h - 1, w, 1);
  }

  // 水面波纹：横向细线，越靠上越密（远景）
  for (let y = 4; y < H; y += 7 + (y % 3)) {
    g.fillStyle = 'rgba(236,255,252,.10)';
    for (let x = 0; x < W; x += 3 + (y % 4)) {
      if (r() < 0.45) g.fillRect(x, y, 2 + (x % 3), 1);
    }
  }

  // 四周压暗，把注意力收进安全圈
  const vign = g.createRadialGradient(W / 2, H / 2, H * 0.30, W / 2, H / 2, W * 0.74);
  vign.addColorStop(0, 'rgba(6,48,58,0)');
  vign.addColorStop(1, 'rgba(4,34,52,.48)');
  g.fillStyle = vign;
  g.fillRect(0, 0, W, H);
}

function drawBackdrop() {
  if (map.id === 'snow') {
    ctx.drawImage(getScene('snow'), 0, 0);
    // 风雪：整体冷白薄雾，随时间轻微明暗
    ctx.globalAlpha = 0.10 + 0.04 * Math.sin(time * 0.7);
    ctx.fillStyle = 'rgba(210,236,255,.55)';
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
    // 飘雪点：斜向吹过
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 42; i++) {
      const x = ((i * 97 + time * (16 + (i % 4) * 6)) % (W + 8)) - 4;
      const y = ((i * 61 + time * 26) % (H + 8)) - 4;
      ctx.globalAlpha = 0.3 + 0.3 * ((i % 5) / 5);
      ctx.fillRect(Math.round(x), Math.round(y), i % 9 === 0 ? 2 : 1, 1);
    }
    ctx.globalAlpha = 1;
    return;
  }
  if (map.id === 'lava') {
    ctx.drawImage(getScene('lava'), 0, 0);
    const pulse = 0.5 + 0.5 * Math.sin(time * 2.4);
    // 裂隙亮芯：分级呼吸
    ctx.fillStyle = 'rgba(255,88,36,' + (0.18 + 0.12 * pulse).toFixed(3) + ')';
    for (const p of FISS_LO) ctx.fillRect(p[0], p[1], 1, 1);
    ctx.fillStyle = 'rgba(255,110,44,' + (0.26 + 0.16 * pulse).toFixed(3) + ')';
    for (const p of FISS_MID) ctx.fillRect(p[0], p[1], 1, 1);
    ctx.fillStyle = 'rgba(255,146,60,' + (0.38 + 0.20 * pulse).toFixed(3) + ')';
    for (const p of FISS_HI) ctx.fillRect(p[0], p[1], 1, 1);
    ctx.fillStyle = 'rgba(255,92,32,' + (0.02 + 0.03 * pulse).toFixed(3) + ')';
    for (const p of FISS_HI) ctx.fillRect(p[0] - 2, p[1] - 2, 5, 5);
    // 热雾
    ctx.globalAlpha = 0.07 + 0.05 * pulse;
    ctx.fillStyle = GLOW_H;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
    // 上升余烬
    for (const em of EMBERS) {
      const y = ((em.y - time * em.sp) % H + H) % H;
      ctx.globalAlpha = 0.42 + 0.3 * Math.sin(time * 2.6 + em.ph);
      ctx.fillStyle = em.sz > 1 ? '#ffd166' : '#ff6a48';
      ctx.fillRect(Math.round(em.x + Math.sin(time * 1.4 + em.ph) * 1.6), Math.round(y), em.sz, em.sz);
    }
    ctx.globalAlpha = 1;
    return;
  }
  if (map.id === 'desert') {
    ctx.drawImage(getScene('desert'), 0, 0);
    // 热浪：轻微暖色呼吸
    const pulse = 0.5 + 0.5 * Math.sin(time * 1.3);
    ctx.globalAlpha = 0.05 + 0.04 * pulse;
    ctx.fillStyle = '#ffdca0';
    ctx.fillRect(0, 0, W, H);
    // 横向沙粒：沙暴的方向感
    for (const s of SAND_STREAK) {
      const x = ((s.x + time * s.sp) % (W + 40)) - 20;
      const y = s.y + Math.sin(time * 1.6 + s.ph) * 2;
      ctx.globalAlpha = s.al * (0.6 + 0.4 * Math.sin(time * 2 + s.ph));
      ctx.fillStyle = '#ffe8bc';
      ctx.fillRect(Math.round(x), Math.round(y), s.len, 1);
    }
    ctx.globalAlpha = 1;
    return;
  }
  if (map.id === 'neon') {
    ctx.drawImage(getScene('neon'), 0, 0);
    // 窗灯闪烁：只取一部分窗，省开销也更有节奏
    for (let li = 0; li < NEON_CITY.length; li++) {
      const step = li === 2 ? 2 : 4;
      for (const b of NEON_CITY[li]) {
        for (let i = 0; i < b.wins.length; i += step) {
          const w = b.wins[i];
          ctx.globalAlpha = 0.16 + 0.34 * Math.abs(Math.sin(time * w.sp + w.ph));
          ctx.fillStyle = w.col;
          ctx.fillRect(w.x, w.y, 1, 1);
        }
      }
    }
    // 灯带呼吸
    for (let i = 0; i < NEON_LINES.length; i++) {
      const l = NEON_LINES[i];
      ctx.globalAlpha = 0.09 + 0.07 * Math.sin(time * 1.5 + i * 1.3);
      ctx.fillStyle = l.col;
      if (l.axis === 0) ctx.fillRect(l.x, l.y, l.len, 1);
      else ctx.fillRect(l.x, l.y, 1, l.len);
    }
    // 街道上的扫光带
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#9ef4ff';
    ctx.fillRect(0, 70 + Math.round((time * 9) % (H - 70)), W, 1);
    // 一辆车驶过：车灯拖出一条短光尾
    const carX = ((time * 58) % (W + 90)) - 45;
    ctx.globalAlpha = 0.40;
    ctx.fillStyle = '#ffe6f7';
    ctx.fillRect(Math.round(carX), 73, 3, 1);
    ctx.globalAlpha = 0.10;
    ctx.fillRect(Math.round(carX) - 16, 73, 16, 1);
    // 地面反光点
    for (const gl of NEON_GLINT) {
      ctx.globalAlpha = 0.22 + 0.42 * Math.abs(Math.sin(time * gl.sp + gl.ph));
      ctx.fillStyle = (gl.ph % 2 < 1) ? '#ffd0f5' : '#c8f8ff';
      ctx.fillRect(Math.round(gl.x), Math.round(gl.y), gl.sz, gl.sz);
    }
    ctx.globalAlpha = 1;
    return;
  }
  if (map.id === 'rain') {
    ctx.drawImage(getScene('rain'), 0, 0);
    // 路灯在湿砖上的反光：随雨轻微摇晃
    for (let i = 0; i < RAIN_LAMPS.length; i++) {
      const L = RAIN_LAMPS[i];
      const sway = Math.sin(time * 1.1 + i * 2) * 1.2;
      ctx.globalAlpha = 0.10 + 0.05 * Math.sin(time * 1.7 + i);
      ctx.fillStyle = 'rgba(' + L.rgb + ',1)';
      ctx.fillRect(Math.round(L.x - 2 + sway), L.y + 26, 4, 62);
      ctx.globalAlpha = 0.20;
      ctx.fillRect(Math.round(L.x + sway), L.y + 26, 1, 22);
    }
    // 水洼里的雨点涟漪
    for (let i = 0; i < terrain.ice.length; i++) {
      const q = terrain.ice[i];
      for (let k = 0; k < 2; k++) {
        const t = (time * 0.9 + i * 0.37 + k * 0.5) % 1;
        ctx.globalAlpha = 0.30 * (1 - t) * (1 - t);
        ctx.strokeStyle = '#a9ccff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(q.x, q.y, q.r * (0.18 + t * 0.95), q.r * (0.08 + t * 0.42), 0, 0, TAU);
        ctx.stroke();
      }
    }
    // 斜雨：随风向左下，速度快、层层叠加
    ctx.fillStyle = '#cfe4ff';
    for (let i = 0; i < 110; i++) {
      const spd = 240 + (i % 5) * 45;
      const x = ((i * 67 - time * spd * 0.5) % (W + 30) + W + 30) % (W + 30) - 15;
      const y = ((i * 53 + time * spd) % (H + 16)) - 8;
      ctx.globalAlpha = 0.14 + 0.16 * ((i % 4) / 4);
      ctx.fillRect(Math.round(x), Math.round(y), 1, 3 + (i % 3));
    }
    // 落地水花：短促亮点，越接近地面越淡
    ctx.fillStyle = '#a8ccff';
    for (let i = 0; i < 30; i++) {
      const t = (time * 1.6 + i * 0.41) % 1;
      const x = (i * 83 + time * 40) % W;
      const y = (i * 59 + time * 13) % H;
      ctx.globalAlpha = 0.34 * (1 - t);
      ctx.fillRect(Math.round(x), Math.round(y), 2, 1);
    }
    // 雷暴：每 9 秒一次短促泛白 + 一道曲折电光（纯视觉，不扣血）
    const lt = time % 9;
    if (lt < 0.36) {
      ctx.globalAlpha = lt < 0.1 ? 0.46 : 0.20;
      ctx.fillStyle = '#dff0ff';
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 0.8;
      ctx.strokeStyle = '#f2fbff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      let bx = 40 + ((Math.floor(time / 9) * 53) % (W - 100)), by = 4;
      ctx.moveTo(bx, by);
      for (let i = 0; i < 7; i++) {
        bx += 9 + (i % 3) * 6;
        by += 5 + (i % 2) * 4;
        ctx.lineTo(bx, by);
      }
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.round(bx - 2), Math.round(by - 6), 4, 2);
    }
    ctx.globalAlpha = 1;
    return;
  }
  if (map.id === 'reef') {
    ctx.drawImage(getScene('reef'), 0, 0);
    // 水面折射：横向光带缓慢游走，像阳光透过浅水
    for (let i = 0; i < 9; i++) {
      const y = ((i * 22 + time * 2.4) % (H + 20)) - 10;
      const x = Math.round(Math.sin(time * 0.5 + i * 1.7) * 18);
      ctx.globalAlpha = 0.10 + 0.05 * Math.sin(time * 1.1 + i);
      ctx.fillStyle = '#e6fffb';
      ctx.fillRect(x, Math.round(y), W, 2 + (i % 2));
    }
    // 上浮的气泡
    for (let i = 0; i < 26; i++) {
      const sp = 12 + (i % 4) * 7;
      const y = ((i * 41 - time * sp) % (H + 16) + H + 16) % (H + 16) - 8;
      const x = (i * 73 + Math.sin(time * 0.9 + i) * 4) % W;
      ctx.globalAlpha = 0.22 + 0.16 * Math.sin(time * 2.2 + i);
      ctx.fillStyle = '#d8fff8';
      ctx.fillRect(Math.round(x), Math.round(y), i % 7 === 0 ? 2 : 1, 1);
    }
    ctx.globalAlpha = 1;
    return;
  }
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

