/* PIXEL DASH · 音效 —— 由 index.html 拆分，按顺序加载 */
'use strict';

/* ============================================================
   音效（极小 WebAudio，失败自动静默）
   ============================================================ */
let AC = null, muted = false;
const MUTE_KEY = 'pixelDash.muted';
/* 音效总音量倍数：BGM 固定在 #bgm 的 0.42，音效单次增益都写得很小，
   统一在这里放大，避免逐个改 30 处调用点 */
const SFX_GAIN = 4.5;
function audio() {
  if (!AC) {
    try { AC = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (e) { AC = false; }
  }
  return AC;
}
/* 移动端/浏览器策略：AudioContext 初始为 suspended，必须在用户手势里 resume 才会有声 */
function resumeAudio(a) {
  try {
    const r = a.resume();
    if (r && r.catch) r.catch(() => {});
  } catch (e) {}
}
function unlockAudio() {
  const a = audio();
  if (a && a.state === 'suspended') resumeAudio(a);
}
['pointerdown', 'touchstart', 'touchend', 'keydown'].forEach((t) =>
  document.addEventListener(t, unlockAudio, { passive: true }));
document.addEventListener('visibilitychange', () => { if (!document.hidden) unlockAudio(); });

function blip(freq, dur, type, vol, slide) {
  if (muted) return;
  const a = audio(); if (!a) return;
  if (a.state === 'suspended') resumeAudio(a);
  try {
    const o = a.createOscillator(), g = a.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, a.currentTime);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), a.currentTime + dur);
    const v = clamp((vol || 0.05) * SFX_GAIN, 0, 1);
    g.gain.setValueAtTime(v, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
    o.connect(g); g.connect(a.destination);
    o.start(); o.stop(a.currentTime + dur);
  } catch (e) {}
}

