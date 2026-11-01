/* PIXEL DASH · 商店 / 英雄 / 地图选择 —— 由 index.html 拆分，按顺序加载 */
'use strict';

/* ============================================================
   商店：解锁小英雄（花累计金币）、切换出战、选择地图
   ============================================================ */
let shopTab = 'hero';

/* 主界面出战信息：当前英雄 / 地图 / 金币 */
function refreshLoadout() {
  const el = $('#loadoutLine');
  if (!el) return;
  const h = currentHero();
  el.innerHTML =
    '出战 <b style="color:' + h.col + '">' + h.name + '</b>' +
    ' · 地图 <b>' + map.name + '</b>' +
    ' · 金币 <b>' + loadCoins() + '</b>';
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
    '<div class="scStat" style="grid-template-columns:1fr;color:#8fb2cf">相对小勇：' +
      '速度 ' + d(h.speed) + ' · 伤害 ' + d(h.dashDamage) + ' · 范围 ' + d(h.dashRadius) +
    '</div>'
  );
}

function heroCardsHtml() {
  const total = loadCoins();
  return HEROES.map((h) => {
    const owned = heroOwned(h.id);
    const on = heroKey === h.id;
    const btn = on ? '出 战 中' : owned ? '装 备' : (total >= h.price ? '购买 · ' + h.price : '还需 ' + (h.price - total) + ' 金币');
    return (
      '<div class="shopCard' + (on ? ' on' : '') + (owned ? '' : ' lock') + '" role="button" tabindex="0" data-hero="' + h.id + '">' +
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
      m.ice ? '冰面 ' + m.ice : null,
      m.meteor ? '陨石 ' + m.meteor + 's' : null,
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
  for (const b of document.querySelectorAll('.stab')) {
    b.classList.toggle('on', (b.dataset && b.dataset.tab) === shopTab);
  }
  grid.className = shopTab === 'hero' ? 'shopGrid' : 'mapGrid';
  grid.innerHTML = shopTab === 'hero' ? heroCardsHtml() : mapCardsHtml();
}

function openShop() {
  if (state !== 'menu') return;
  layers.title.classList.add('hidden');
  $('#shopScreen').classList.remove('hidden');
  renderShop();
  blip(520, 0.08, 'triangle', 0.04, 120);
}

function closeShop() {
  $('#shopScreen').classList.add('hidden');
  layers.title.classList.remove('hidden');
  refreshBestLine();
  refreshLoadout();
}

/* ---- 入口与交互 ---- */
$('#shopBtn').addEventListener('click', openShop);
$('#shopClose').addEventListener('click', closeShop);

for (const b of document.querySelectorAll('.stab')) {
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
  } else if (card.dataset.map) {
    applyMap(card.dataset.map);
    toast('地图 · ' + map.name, true);
    blip(700, 0.09, 'triangle', 0.05, 80);
    renderShop();
  }
});
