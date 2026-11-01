/* PIXEL DASH · 二级界面：模式选择（新手教程 / 闯关 / 无尽） —— 按顺序加载 */
'use strict';

let modeTab = 'tutorial';

/* ---------- 文案 ---------- */
function levelGoalText(lv) {
  if (lv.goal === 'survive') return '撑满 ' + lv.time + ' 秒';
  if (lv.goal === 'kills') return lv.time + ' 秒内击杀 ' + lv.kills + ' 只';
  return lv.time + ' 秒内击败 ' + lv.bosses + ' 只 BOSS';
}
function mapMods(m) {
  return [
    '玩家速度 ×' + m.playerSpd.toFixed(2),
    '敌人速度 ×' + m.enemySpd.toFixed(2),
    m.rocks ? '岩石 ' + m.rocks : null,
    m.ice ? '冰面 ' + m.ice : null,
    m.meteor ? '陨石 ' + m.meteor + 's' : null,
  ].filter(Boolean).join(' · ');
}

function tutorialLeadHtml() {
  return '<div class="mcol">' +
    '<div class="mtitle" style="color:#ffd76a">新手教程</div>' +
    '<div class="mdesc">第一次玩？跟着这四步走一遍。每一步都会在屏幕底部给出操作提示，做到就自动进入下一步。教程里只刷最基础的追兵，不会出 BOSS。</div>' +
    '<div class="modeSteps">' +
      TUT_STEPS.map((s, i) =>
        '<div class="modeStep"><b>' + (i + 1) + '</b><span>' + s + '</span></div>').join('') +
    '</div>' +
  '</div>';
}

function campaignLeadHtml(done) {
  const path = LEVELS.map((lv) => {
    const st = lv.id < done ? 'done' : lv.id === done ? 'now' : '';
    return '<span class="node ' + st + '">' + lv.id + ' · ' + lv.name + '</span>';
  }).join('<span style="color:#7a5c3c">›</span>');
  const cleared = done > LEVELS.length;
  return '<div class="mcol">' +
    '<div class="mtitle" style="color:#a8f5c3">闯关模式</div>' +
    '<div class="mdesc">一关接一关，每关都有固定的地图和目标。目标完成即通关，超时或阵亡则失败；通关后自动解锁下一关，进度保存在本机。' +
      (cleared ? '　<b style="color:#a8f5c3">全部关卡已通关。</b>' : '') + '</div>' +
    '<div class="modePath">' + path + '</div>' +
  '</div>';
}

function endlessLeadHtml() {
  const m = map;
  return '<div class="mcol">' +
    '<div class="mtitle" style="color:#ffb88a">无尽模式</div>' +
    '<div class="mdesc">固定一张地图，一直打到倒下为止。每 30 秒进入新的一波：敌人更多、更快、更厚；每 90 秒来一只 BOSS。</div>' +
    '<div class="modeTagline">当前固定地图：<b style="color:' + m.col + '">' + m.name + '</b> · ' + mapMods(m) + '</div>' +
  '</div>';
}

/* ---------- 卡片 ---------- */
function tutorialCardHtml() {
  return '<div class="shopCard on" role="button" tabindex="0" data-start="tutorial">' +
    '<div class="scTop">' +
      '<span class="scIcon" style="background:#ffd76a">教</span>' +
      '<span class="scName">新手教程</span>' +
      '<span class="scTag" style="color:#ffd76a">4 步</span>' +
    '</div>' +
    '<div class="scDesc">移动 → 冲刺 → 撞碎敌人 → 选卡升级。走完这四步，这游戏的全部操作你就都掌握了。</div>' +
    '<div class="scStat" style="grid-template-columns:1fr">' +
      '<span>时长 <b>约 1 分钟</b></span>' +
      '<span>敌人 <b>只有基础追兵</b></span>' +
    '</div>' +
    '<div class="scBtn">开 始 教 程</div>' +
  '</div>';
}

function campaignCardsHtml() {
  return LEVELS.map((lv, i) => {
    const unlocked = levelUnlocked(lv.id);
    const m = MAPS[lv.map];
    const btn = !unlocked ? '通 过 第 ' + (lv.id - 1) + ' 关 解 锁'
      : lv.id < campaignProgress() ? '重 打 本 关' : '开 始 挑 战';
    return '<div class="shopCard' + (unlocked ? '' : ' dim') + '"' +
      ' role="button" tabindex="' + (unlocked ? '0' : '-1') + '" data-level="' + i + '">' +
      '<div class="scTop">' +
        '<span class="scIcon" style="background:' + lv.col + '">' + lv.id + '</span>' +
        '<span class="scName">' + lv.name + '</span>' +
        '<span class="scTag" style="color:' + lv.col + '">' + lv.tag + '</span>' +
      '</div>' +
      '<div class="scDesc">' + lv.desc + '</div>' +
      '<div class="scStat" style="grid-template-columns:1fr">' +
        '<span>地图 <b>' + m.name + '</b> · 限时 <b>' + lv.time + 's</b></span>' +
        '<span>目标 <b>' + levelGoalText(lv) + '</b></span>' +
      '</div>' +
      '<div class="scBtn">' + btn + '</div>' +
    '</div>';
  }).join('');
}

function endlessCardsHtml() {
  return Object.keys(MAPS).map((k) => {
    const m = MAPS[k];
    const on = mapKey === k;
    return '<div class="shopCard' + (on ? ' on' : '') + '"' +
      ' role="button" tabindex="0" data-map="' + k + '">' +
      '<div class="scTop">' +
        '<span class="scIcon" style="background:' + m.col + '">' + m.name.slice(0, 1) + '</span>' +
        '<span class="scName">' + m.name + '</span>' +
        '<span class="scTag" style="color:' + m.col + '">' + m.tag + '</span>' +
      '</div>' +
      '<div class="scDesc">' + m.desc + '</div>' +
      '<div class="scStat" style="grid-template-columns:1fr">' + mapMods(m) + '</div>' +
      '<div class="scBtn">' + (on ? '以 此 地 图 开 始' : '选 此 图 开 始') + '</div>' +
    '</div>';
  }).join('');
}

/* ---------- 渲染 / 打开 / 关闭 ---------- */
function renderModeScreen() {
  const lead = $('#modeLead'), grid = $('#modeGrid');
  const prog = $('#modeProg'), tip = $('#modeTip');
  if (!lead || !grid) return;

  for (const b of document.querySelectorAll('.mtab')) {
    b.classList.toggle('on', b.dataset.mode === modeTab);
  }
  lead.className = 'modeLead col';

  if (modeTab === 'campaign') {
    const done = campaignProgress();
    lead.innerHTML = campaignLeadHtml(done);
    grid.innerHTML = campaignCardsHtml();
    prog.innerHTML = '已解锁 <b>' + Math.min(done, LEVELS.length) + '</b> / ' + LEVELS.length;
    tip.textContent = '闯关进度自动保存 · 通关后自动解锁下一关';
  } else if (modeTab === 'endless') {
    lead.innerHTML = endlessLeadHtml();
    grid.innerHTML = endlessCardsHtml();
    prog.innerHTML = '固定地图 <b>' + map.name + '</b>';
    tip.textContent = '每 30 秒一波 · 每 90 秒一只 BOSS · 无尽模式没有胜利结算';
  } else {
    lead.innerHTML = tutorialLeadHtml();
    grid.innerHTML = tutorialCardHtml();
    prog.innerHTML = '教程 · <b>4</b> 步';
    tip.textContent = '教程可反复进入 · 中途可点「跳过教程」回主菜单';
  }
}

function tutorialSeen() {
  try { return localStorage.getItem('pixelDash.tut.v1') === '1'; } catch (e) { return true; }
}

function openModeScreen() {
  if (state !== 'menu') return;
  /* 新玩家默认落在教程页；老玩家落在上次玩的模式页 */
  modeTab = !tutorialSeen() ? 'tutorial'
    : modeKey === 'campaign' || modeKey === 'endless' ? modeKey : 'tutorial';
  layers.title.classList.add('hidden');
  $('#modeScreen').classList.remove('hidden');
  renderModeScreen();
  blip(520, 0.08, 'triangle', 0.04, 120);
}

function closeModeScreen() {
  $('#modeScreen').classList.add('hidden');
  if (state === 'menu') layers.title.classList.remove('hidden');
  refreshBestLine();
  refreshLoadout();
}

/* ---------- 交互 ---------- */
for (const b of document.querySelectorAll('.mtab')) {
  b.addEventListener('click', () => {
    if (!b.dataset || !b.dataset.mode || b.dataset.mode === modeTab) return;
    modeTab = b.dataset.mode;
    renderModeScreen();
    blip(620, 0.05, 'triangle', 0.03, 60);
  });
}

$('#modeBack').addEventListener('click', closeModeScreen);

$('#modeGrid').addEventListener('click', (e) => {
  const card = e.target && e.target.closest ? e.target.closest('.shopCard') : null;
  if (!card) return;

  if (card.dataset.start) { startMode(card.dataset.start); return; }

  if (card.dataset.map) {
    applyMap(card.dataset.map);
    startMode('endless');
    return;
  }

  if (card.dataset.level !== undefined) {
    const i = Number(card.dataset.level);
    const lv = LEVELS[i];
    if (!lv) return;
    if (!levelUnlocked(lv.id)) {
      toast('先通过第 ' + (lv.id - 1) + ' 关 · ' + LEVELS[lv.id - 2].name + ' 才能解锁');
      blip(160, 0.1, 'square', 0.05, -40);
      return;
    }
    startMode('campaign', i);
  }
});
