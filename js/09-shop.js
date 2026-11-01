/* PIXEL DASH · 升级界面 —— 由 index.html 拆分，按顺序加载 */
'use strict';

/* ============================================================
   升级界面
   ============================================================ */
/* 可选项：已满级排除；冲刺形态互斥，已拥有任一形态后其余形态不再出现 */
function upgAvailable(u) {
  if ((player.upg[u.id] || 0) >= u.max) return false;
  if (u.form && player.stats.dashForm) return false;
  return true;
}

function openUpgrade() {
  if (state !== 'playing') return;
  state = 'upgrade';
  if (stickId !== null) stickReset();   // 收起摇杆，避免选牌时方向键卡住

  const avail = UPGRADES.filter(upgAvailable);
  if (!avail.length) {
    player.hp = Math.min(player.maxHp, player.hp + 2);
    pendingLevels = 0;
    state = 'playing';
    player.invuln = Math.max(player.invuln || 0, 1.8);
    return;
  }
  shopOptions = rollOptions(avail, 3);
  renderUpgradeUI();
  layers.upgrade.classList.remove('hidden');
  blip(600, 0.1, 'triangle', 0.05, 260);
}

const RR_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" ' +
  'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<polyline points="23 4 23 10 17 10"></polyline>' +
  '<path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>';

function renderUpgradeUI(flipIndex) {
  const box = $('#cards');
  box.innerHTML = '';
  const hasAlt = UPGRADES.some((u) => upgAvailable(u) && !shopOptions.some((o) => o.id === u.id));
  const canFlip = rerolls > 0 && hasAlt;
  shopOptions.forEach((u, i) => {
    const lvl = player.upg[u.id] || 0;
    const wrap = document.createElement('div');
    wrap.className = 'cardwrap';
    const el = document.createElement('div');
    el.className = 'card r' + u.rar + (flipIndex === i ? ' flip' : '');
    el.innerHTML =
      '<div class="kbd">' + (i + 1) + '</div>' +
      '<div class="cname">' + u.name + '</div>' +
      '<div class="cmax">Lv.' + lvl + ' → ' + (lvl + 1) + ((lvl + 1 === u.max) ? ' · 满级' : '') + '</div>' +
      '<div class="cdesc">' + u.desc + '</div>' +
      '<div class="rartag">' + (u.rar === 3 ? 'EPIC · 史诗' : u.rar === 2 ? 'RARE · 稀有' : 'COMMON · 常见') + '</div>';
    el.addEventListener('click', () => chooseIndex(i));

    /* 换牌按钮独立放在卡牌下方，只在图标上落点，避免误触选牌 */
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'flipbtn';
    btn.disabled = !canFlip;
    btn.title = canFlip ? ('换掉这张牌 · 剩 ' + rerolls + ' 次')
      : (hasAlt ? '没有换牌机会了' : '没有可替换的强化');
    btn.setAttribute('aria-label', btn.title);
    btn.innerHTML = RR_ICON;
    btn.addEventListener('click', (ev) => { ev.stopPropagation(); flipCard(i); });

    wrap.appendChild(el);
    wrap.appendChild(btn);
    box.appendChild(wrap);
  });

  /* 换牌机会是全局共用的，只在下方显示一处标记 */
  $('#rerollCount').textContent = '×' + rerolls;
  $('#rrToken').classList.toggle('empty', !canFlip);

  const owned = UPGRADES.filter((u) => player.upg[u.id]);
  $('#buildLine').innerHTML = owned.length
    ? '当前构筑：' + owned.map((u) => '<span>' + u.name + ' ' + player.upg[u.id] + '</span>').join(' · ')
    : '当前构筑：空';
}

/* 单张翻转：消耗一次机会，只把这一张换成别的选项 */
function flipCard(i) {
  if (state !== 'upgrade' || rerolls <= 0) return;
  const avail = UPGRADES.filter((u) => upgAvailable(u) && !shopOptions.some((o) => o.id === u.id));
  if (!avail.length) return;
  rerolls -= 1;
  shopOptions[i] = rollOptions(avail, 1)[0];
  renderUpgradeUI(i);
  blip(780, 0.06, 'square', 0.05, 150);
}

function chooseIndex(i) {
  if (state !== 'upgrade') return;
  const u = shopOptions[i];
  if (!u) return;
  player.upg[u.id] = (player.upg[u.id] || 0) + 1;
  u.apply(player.stats, player);
  player.maxHp = player.heroHp + player.stats.maxHpBonus;
  player.hp = Math.min(player.hp, player.maxHp);

  layers.upgrade.classList.add('hidden');
  pendingLevels -= 1;
  blip(520, 0.08, 'triangle', 0.05, 300);
  if (pendingLevels > 0) {
    // 还有待选的升级：先回 playing，openUpgrade 只接受从 playing 进入，
    // 否则会直接 return，界面已隐藏但 state 停在 upgrade，表现为卡死
    state = 'playing';
    openUpgrade();
  } else {
    state = 'playing';
    // 回到战斗先给一段无敌，避免选牌时被贴脸
    player.invuln = Math.max(player.invuln || 0, 1.8);
    // 教程最后一步：选一张卡即完成（必须回到 playing 才能结算）
    if (tutorial && tutorial.active && tutorial.step === 3) tutAdvance();
  }
}

