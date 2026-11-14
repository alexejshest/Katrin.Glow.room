/* ============================================================
   UI Sound Design (Web Audio API) — без звуковых файлов
   • click()   — мягкий «стеклянный» клик
   • brush()   — шуршание кисточки (фильтрованный шум)
   • success() — тихий двойной перезвон при успешной записи
   Кнопка #soundBtn в шапке включает и выключает звук (запоминается).
   Браузер разрешает звук только после первого действия пользователя —
   до этого вызовы тихо игнорируются.
   ============================================================ */
const Sound = (function () {
  'use strict';
  const KEY = 'beautySound';
  let ctx = null, master = null, noiseBuf = null;
  let enabled = true;
  let lastBrush = 0;
  // По умолчанию звук включён, но при «уменьшить движение» в системе — выключен
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  try {
    const stored = localStorage.getItem(KEY);
    enabled = stored === null ? !reduceMotion : stored !== 'off';
  } catch (e) { /* ignore */ }

  function ensure() {
    if (!enabled) return null;
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try {
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = 0.55;      // общая громкость — тихо и премиально
        master.connect(ctx.destination);
      } catch (e) { ctx = null; return null; }
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function envTone(freq, type, peak, attack, decay, when) {
    const t0 = ctx.currentTime + (when || 0);
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + attack + decay + 0.05);
  }

  function click() {
    if (!ensure()) return;
    envTone(540, 'sine', 0.07, 0.004, 0.11);
    envTone(1080, 'sine', 0.025, 0.003, 0.07);
  }

  function noise() {
    if (!noiseBuf) {
      const len = ctx.sampleRate * 0.6;
      noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    return noiseBuf;
  }

  // Шуршание кисточки: полосовой фильтр плавно «проводит» по шуму
  function brush() {
    if (!ensure()) return;
    const now = performance.now();
    if (now - lastBrush < 380) return;       // не заспамить при быстром движении мыши
    lastBrush = now;
    const t0 = ctx.currentTime, dur = 0.32;
    const src = ctx.createBufferSource(); src.buffer = noise();
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.9;
    bp.frequency.setValueAtTime(1800, t0);
    bp.frequency.exponentialRampToValueAtTime(5200, t0 + dur);
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.05, t0 + 0.07);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(bp); bp.connect(hp); hp.connect(g); g.connect(master);
    src.start(t0, Math.random() * 0.2); src.stop(t0 + dur + 0.02);
  }

  function success() {
    if (!ensure()) return;
    envTone(660, 'sine', 0.06, 0.01, 0.5, 0);
    envTone(990, 'sine', 0.05, 0.01, 0.7, 0.13);
    envTone(1320, 'sine', 0.025, 0.01, 0.8, 0.26);
  }

  function renderBtn() {
    const b = document.getElementById('soundBtn');
    if (!b) return;
    b.setAttribute('aria-pressed', String(enabled));
    b.classList.toggle('off', !enabled);
  }

  function setEnabled(v) {
    enabled = !!v;
    try { localStorage.setItem(KEY, enabled ? 'on' : 'off'); } catch (e) { /* ignore */ }
    renderBtn();
    if (enabled) click();
  }

  function init() {
    renderBtn();
    const b = document.getElementById('soundBtn');
    if (b) b.addEventListener('click', function () { setEnabled(!enabled); });

    const CLICKABLE = 'button, a.btn, .chip, .month, .qbtn, .slot, .nav-links a, [data-lang], .chip-float, .cal-arrow';
    // Клик по интерактивным элементам
    document.addEventListener('pointerdown', function (e) {
      if (e.target.closest('#soundBtn')) return;      // кнопка звука озвучивается сама
      // На касаниях нет hover — «шуршание кисти» играет при нажатии на карточку или фото
      if (e.target.closest('.day, .service-card, .tile, .course-card')) { brush(); return; }
      if (e.target.closest(CLICKABLE)) click();
    }, { passive: true });
    // Кисточка при наведении на карточки и фото (только мышь)
    document.addEventListener('pointerover', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      if (e.target.closest('.service-card, .tile, .course-card')) brush();
    }, { passive: true });
  }

  return { init: init, click: click, brush: brush, success: success, get enabled() { return enabled; } };
})();
