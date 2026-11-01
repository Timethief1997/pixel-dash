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

/* 敲木头：一是低频木腔共鸣，二是短噪声的干涩撞击声，合成一次后复用 */
let knockBuf = null;
function woodKnock() {
  if (muted) return;
  const a = audio(); if (!a) return;
  if (a.state === 'suspended') resumeAudio(a);
  try {
    const t = a.currentTime;
    const v = clamp(0.032 * SFX_GAIN, 0, 1);
    const o = a.createOscillator(), g = a.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(210, t);
    o.frequency.exponentialRampToValueAtTime(96, t + 0.075);
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.10);
    o.connect(g); g.connect(a.destination);
    o.start(t); o.stop(t + 0.11);

    if (!knockBuf) {
      knockBuf = a.createBuffer(1, Math.max(64, Math.ceil(a.sampleRate * 0.06)), a.sampleRate);
      const d = knockBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) {
        const k = 1 - i / d.length;
        d[i] = (Math.random() * 2 - 1) * k * k;
      }
    }
    const src = a.createBufferSource(), lp = a.createBiquadFilter(), ng = a.createGain();
    src.buffer = knockBuf;
    lp.type = 'lowpass';
    lp.frequency.value = 1200;
    lp.Q.value = 0.8;
    ng.gain.setValueAtTime(v * 0.9, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    src.connect(lp); lp.connect(ng); ng.connect(a.destination);
    src.start(t); src.stop(t + 0.08);
  } catch (e) {}
}

