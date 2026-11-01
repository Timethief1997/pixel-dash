/* PIXEL DASH · 首页「场景原声」—— 由 index.html 拆分，按顺序加载 */
'use strict';

/* ============================================================
   场景原声：在首页单独试听每张地图的完整 BGM
   ============================================================ */
const MUSIC_LIB = [
  { id: 'plain',  name: '苔原 · 草甸', track: 'grassland.mp3', desc: '草原晨风' },
  { id: 'snow',   name: '雪原 · 冰封', track: 'ice.mp3',       desc: '风雪长夜' },
  { id: 'lava',   name: '熔岩 · 陨落', track: 'volcano.mp3',   desc: '熔岩轰鸣' },
  { id: 'desert', name: '荒漠 · 沙暴', track: 'desert.mp3',    desc: '热浪与流沙' },
  { id: 'neon',   name: '霓虹 · 夜巡', track: 'bgm.mp3',       desc: '都市夜色' },
  { id: 'rain',   name: '雨夜 · 湿滑', track: 'rain.mp3',      desc: '雨幕与霓虹' },
  { id: 'reef',   name: '环礁 · 涨潮', track: 'ocean.mp3',     desc: '浅滩潮声' },
];

const musicBoard = $('#musicScreen');
const musicListEl = $('#musicList');
const musicNowEl = $('#musicNow');
const musicEl = $('#musicPlayer');
let musicIdx = -1;   // 正在试听的曲目索引（-1 = 没在放）

if (musicEl) musicEl.volume = 0.5;

function musicClock(sec) {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return m + ':' + (s < 10 ? '0' : '') + s;
}

function musicCardEl(i) {
  return musicListEl ? musicListEl.querySelector('[data-i="' + i + '"]') : null;
}

/* 卡片状态与进度条：只有正在播放的那首走高 */
function syncMusicUi() {
  if (!musicListEl) return;
  for (let i = 0; i < MUSIC_LIB.length; i++) {
    const card = musicCardEl(i);
    if (!card) continue;
    const active = i === musicIdx;
    card.classList.toggle('on', active);
    const st = card.querySelector('.mcState');
    if (st) st.textContent = active && !musicEl.paused ? '暂停' : '试听';
    const bar = card.querySelector('.mcBar i');
    if (bar) {
      const d = musicEl && isFinite(musicEl.duration) ? musicEl.duration : 0;
      const p = active && d > 0 ? Math.min(100, musicEl.currentTime / d * 100) : 0;
      bar.style.width = p + '%';
    }
  }
  if (musicNowEl) {
    if (musicIdx >= 0 && musicEl && isFinite(musicEl.duration) && musicEl.duration > 0) {
      musicNowEl.textContent = MUSIC_LIB[musicIdx].name + ' · ' +
        musicClock(musicEl.currentTime) + ' / ' + musicClock(musicEl.duration);
    } else {
      musicNowEl.textContent = '点一个场景，听它的完整曲目';
    }
  }
}

function renderMusicScreen() {
  if (!musicListEl) return;
  musicListEl.innerHTML = MUSIC_LIB.map((m, i) => {
    const col = (MAPS[m.id] && MAPS[m.id].col) || '#ffd76a';
    return '<button class="musicCard" type="button" data-i="' + i + '" style="--mc:' + col + '">' +
      '<span class="mcDisc">♪</span>' +
      '<span class="mcBody">' +
        '<span class="mcName">' + m.name + '</span>' +
        '<span class="mcSub">' + m.desc + ' · ' + m.track + '</span>' +
        '<span class="mcBar"><i></i></span>' +
      '</span>' +
      '<span class="mcState">试听</span>' +
    '</button>';
  }).join('');
  syncMusicUi();
}

/* 点第一下开播，再点同一张暂停 / 继续 */
function playMusicAt(i) {
  const m = MUSIC_LIB[i];
  if (!musicEl || !m) return;
  if (musicIdx === i && !musicEl.paused) {
    musicEl.pause();
    syncMusicUi();
    return;
  }
  if (musicIdx !== i) {
    musicIdx = i;
    musicEl.setAttribute('src', m.track);
    musicEl.load();
  } else if (musicEl.ended) {
    musicEl.currentTime = 0;
  }
  const p = musicEl.play();
  if (p && p.catch) p.catch(() => {});
  syncMusicUi();
}

function stopMusicPreview() {
  if (!musicEl) return;
  musicEl.pause();
  musicIdx = -1;
  try {
    musicEl.removeAttribute('src');
    musicEl.load();
  } catch (e) {}
  syncMusicUi();
}

function openMusicScreen() {
  if (state !== 'menu') return;
  renderMusicScreen();
  layers.title.classList.add('hidden');
  musicBoard.classList.remove('hidden');
  blip(520, 0.08, 'triangle', 0.04, 120);
}

function closeMusicScreen() {
  stopMusicPreview();
  musicBoard.classList.add('hidden');
  if (state === 'menu') layers.title.classList.remove('hidden');
  refreshBestLine();
  refreshLoadout();
}

/* ---------- 交互 ---------- */
$('#musicBtn').addEventListener('click', openMusicScreen);
$('#musicBack').addEventListener('click', closeMusicScreen);
musicListEl.addEventListener('click', (e) => {
  const card = e.target && e.target.closest ? e.target.closest('.musicCard') : null;
  if (!card) return;
  playMusicAt(Number(card.dataset.i));
});
if (musicEl) {
  musicEl.addEventListener('timeupdate', syncMusicUi);
  musicEl.addEventListener('loadedmetadata', syncMusicUi);
  musicEl.addEventListener('ended', syncMusicUi);
}
