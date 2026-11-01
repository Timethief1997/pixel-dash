/* PIXEL DASH · 商店 / 英雄 / 地图选择 —— 由 index.html 拆分，按顺序加载 */
'use strict';

/* ============================================================
   商店：解锁小英雄（花累计金币）、切换出战、选择地图
   ============================================================ */
let shopTab = 'hero';
let shopAnim = 0, shopAnimTimer = null;

/* 商店立绘原地踏步：两帧交替，像元气骑士的角色展示 */
function stopShopAnim() {
  if (shopAnimTimer) { clearInterval(shopAnimTimer); shopAnimTimer = null; }
}
function startShopAnim() {
  stopShopAnim();
  if (shopTab === 'map' || typeof HERO_ART === 'undefined') return;
  shopAnimTimer = setInterval(() => {
    shopAnim ^= 1;
    for (const cv of document.querySelectorAll('#shopGrid .heroArt')) {
      if (!HERO_ART[cv.dataset.art]) continue;
      const g = cv.getContext('2d');
      g.clearRect(0, 0, HERO_W, HERO_H);
      g.drawImage(heroSprite(cv.dataset.art, shopAnim), 0, 0);
    }
  }, 340);
}

/* 主界面出战信息：当前英雄 / 地图 / 金币 */
function refreshLoadout() {
  const el = $('#loadoutLine');
  if (!el) return;
  const h = currentHero();
  el.innerHTML =
    '出战 <b style="color:' + h.col + '">' + h.name + '</b>' +
    ' · 无尽地图 <b>' + map.name + '</b>' +
    ' · ' + ico('coin') + '<b>' + loadCoins() + '</b>' +
    ' · ' + ico('medal') + '<b>' + medalBalance() + '</b>/' + MEDAL_CAP;
}

function heroStatLine(h) {
  const d = (v) => (v > 0 ? '+' + v : v < 0 ? String(v) : '·');
  return (
    '<div class="scStat">' +
      '<span>生命 <b>' + h.hp + '</b></span>' +
      '<span>速度 <b>' + (62 + h.speed) + '</b></span>' +
      '<span>冲刺伤害 <b>' + (3 + h.dashDamage) + '</b></span>' +
      '<span>冲刺范围 <b>' + (12 + h.dashRadius) + '</b></span>' +
      '<span>充能 <b>' + Math.max(1, 2 + h.dashCharges) + '</b></span>' +
      '<span>换牌 <b>' + (2 + h.rerolls) + '</b></span>' +
    '</div>' +
    '<div class="scStat" style="grid-template-columns:1fr;color:#b08d68">相对小勇：' +
      '速度 ' + d(h.speed) + ' · 伤害 ' + d(h.dashDamage) + ' · 范围 ' + d(h.dashRadius) +
    '</div>'
  );
}

/* 所有英雄同屏：金币英雄走 data-hero，勋章英雄走 data-exchange，只是购买方式不同 */
function heroCardsHtml() {
  const total = loadCoins();
  const bal = medalBalance();
  return HEROES.map((h) => {
    const owned = heroOwned(h.id);
    const on = heroKey === h.id;
    const byMedal = !!h.medalOnly;
    const cost = h.medal || 0;
    const btn = on ? '出 战 中'
      : owned ? '装 备'
      : byMedal
        ? (bal >= cost ? ico('medal') + ' 兑换 · ' + cost : '还需 ' + ico('medal') + ' ' + (cost - bal))
        : (total >= h.price ? ico('coin') + ' 购买 · ' + h.price : '还需 ' + ico('coin') + ' ' + (h.price - total));
    return (
      '<div class="shopCard' + (on ? ' on' : '') + (owned ? '' : ' lock') + '" role="button" tabindex="0" ' +
        (byMedal ? 'data-exchange="' + h.id + '"' : 'data-hero="' + h.id + '"') + '>' +
        '<div class="heroPortrait" style="--hc:' + h.col + '33">' +
          '<canvas class="heroArt" data-art="' + h.id + '" width="16" height="16"></canvas>' +
          '<span class="heroTag ' + (on ? '' : owned ? 'soft' : 'lock') + '">' +
            (on ? '出战中' : owned ? '已拥有' : byMedal ? '勋章兑换' : '未解锁') +
          '</span>' +
        '</div>' +
        '<div class="scTop">' +
          '<span class="scIcon" style="background:' + h.col + '">' + h.name.slice(0, 1) + '</span>' +
          '<span class="scName">' + h.name + '</span>' +
          '<span class="scTag">' + h.tag + '</span>' +
        '</div>' +
        '<div class="scDesc">' + h.desc + '</div>' +
        heroStatLine(h) +
        '<div class="scBtn">' + btn + '</div>' +
      '</div>'
    );
  }).join('');
}

function mapCardsHtml() {
  return Object.keys(MAPS).map((k) => {
    const m = MAPS[k];
    const on = mapKey === k;
    const mods = [
      '玩家速度 ×' + m.playerSpd.toFixed(2),
      '敌人速度 ×' + m.enemySpd.toFixed(2),
      m.rocks ? '岩石 ' + m.rocks : '无岩石',
      m.ice ? (m.id === 'desert' ? '流沙 ' : '冰面 ') + m.ice : null,
      m.meteor ? '陨石 ' + m.meteor + 's' : null,
      m.shock ? '电栅 ' + m.shock + 's' : null,
      m.tide ? '涨潮收缩' : null,
    ].filter(Boolean).join(' · ');
    return (
      '<div class="shopCard' + (on ? ' on' : '') + '" role="button" tabindex="0" data-map="' + k + '">' +
        '<div class="scTop">' +
          '<span class="scIcon" style="background:' + m.col + '">' + m.name.slice(0, 1) + '</span>' +
          '<span class="scName">' + m.name + '</span>' +
          '<span class="scTag" style="color:' + m.col + '">' + m.tag + '</span>' +
        '</div>' +
        '<div class="scDesc">' + m.desc + '</div>' +
        '<div class="scStat" style="grid-template-columns:1fr">' + mods + '</div>' +
        '<div class="scBtn">' + (on ? '当 前 地 图' : '选 择 地 图') + '</div>' +
      '</div>'
    );
  }).join('');
}

function renderShop() {
  const grid = $('#shopGrid');
  if (!grid) return;
  const cv = $('#shopCoinsVal');
  if (cv) cv.textContent = loadCoins();
  const mv = $('#shopMedalsVal');
  if (mv) mv.textContent = medalBalance();
  const mc = $('#shopMedalsCap');
  if (mc) mc.textContent = MEDAL_CAP;
  /* 只处理商店自己的页签：模式界面的页签也复用了 .stab 样式 */
  for (const b of document.querySelectorAll('#shopScreen .stab')) {
    b.classList.toggle('on', (b.dataset && b.dataset.tab) === shopTab);
  }
  grid.className = shopTab === 'map' ? 'mapGrid' : 'shopGrid';
  grid.innerHTML = shopTab === 'hero' ? heroCardsHtml() : mapCardsHtml();
  const tip = $('#shopTip');
  if (tip) {
    tip.textContent =
      shopTab === 'map'
        ? '地图只影响无尽模式；闯关地图由关卡决定'
        : '金币或勋章解锁 · 忍者需 20 勋章 · 勋章上限 ' + MEDAL_CAP + ' 枚';
  }

  /* 英雄立绘：和场上小人共用同一份 14×14 像素画 */
  for (const cv of grid.querySelectorAll('.heroArt')) {
    const id = cv.dataset.art;
    if (!HERO_ART[id]) continue;
    cv.width = HERO_W; cv.height = HERO_H;
    const g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, HERO_W, HERO_H);
    g.drawImage(heroSprite(id, 0), 0, 0);
  }
  startShopAnim();
}

function openShop() {
  if (state !== 'menu') return;
  layers.title.classList.add('hidden');
  $('#shopScreen').classList.remove('hidden');
  renderShop();
  blip(520, 0.08, 'triangle', 0.04, 120);
}

function closeShop() {
  stopShopAnim();
  $('#shopScreen').classList.add('hidden');
  layers.title.classList.remove('hidden');
  refreshBestLine();
  refreshLoadout();
}

/* ---- 入口与交互 ---- */
$('#shopBtn').addEventListener('click', openShop);
$('#shopClose').addEventListener('click', closeShop);

for (const b of document.querySelectorAll('#shopScreen .stab')) {
  b.addEventListener('click', () => {
    if (!b.dataset || !b.dataset.tab) return;
    shopTab = b.dataset.tab;
    renderShop();
    blip(620, 0.05, 'triangle', 0.03, 60);
  });
}

$('#shopGrid').addEventListener('click', (e) => {
  const card = e.target && e.target.closest ? e.target.closest('.shopCard') : null;
  if (!card) return;
  if (card.dataset.hero) {
    const ok = buyHero(card.dataset.hero);
    if (!ok && heroOwned(card.dataset.hero)) toast('已是当前出战英雄');
    renderShop();
  } else if (card.dataset.exchange) {
    const ok = exchangeHero(card.dataset.exchange);
    if (!ok && heroOwned(card.dataset.exchange)) toast('已是当前出战英雄');
    renderShop();
  } else if (card.dataset.map) {
    applyMap(card.dataset.map);
    toast('地图 · ' + map.name, true);
    blip(700, 0.09, 'triangle', 0.05, 80);
    renderShop();
  }
});
