/* ============================================================
   Фон: медленно падающие кисти для макияжа и капли туши.
   • Кисти (пудровая, скошенная, щёточка туши, карандаш) рисуются
     векторно в спрайты один раз, затем плывут вниз с покачиванием.
   • Капли туши ускоряются и оставляют тонкий потёк.
   Без логотипов и брендов. Цвета — матовое шампанское и бронза.
   При prefers-reduced-motion рисуется один статичный кадр.
   ============================================================ */
(function () {
  'use strict';

  const cv = document.getElementById('fall');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  let W = 0, H = 0;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------- Спрайты кистей (вертикально, кончик вверху) ---------- */
  function lin(c, x0, y0, x1, y1, stops) {
    const g = c.createLinearGradient(x0, y0, x1, y1);
    stops.forEach(function (s) { g.addColorStop(s[0], s[1]); });
    return g;
  }
  function metal(c, x, w) {
    return lin(c, x, 0, x + w, 0, [[0, '#7d6439'], [0.3, '#f0dfb8'], [0.55, '#c9aa72'], [1, '#6e5530']]);
  }
  function handle(c, y0, y1, w0, w1) {
    // сужающаяся ручка со скруглённым концом и бликом
    c.beginPath();
    c.moveTo(60 - w0 / 2, y0);
    c.lineTo(60 - w1 / 2, y1);
    c.arc(60, y1, w1 / 2, Math.PI, 0, true);
    c.lineTo(60 + w0 / 2, y0);
    c.closePath();
    c.fillStyle = lin(c, 60 - w0 / 2, 0, 60 + w0 / 2, 0, [[0, '#241c13'], [0.35, '#6b5538'], [0.5, '#8a7048'], [1, '#2a2016']]);
    c.fill();
    c.strokeStyle = 'rgba(240,223,184,.35)';
    c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(60 - w0 * 0.18, y0 + 6); c.lineTo(60 - w1 * 0.18, y1 - 4); c.stroke();
  }
  function ferrule(c, y0, y1, w) {
    c.fillStyle = metal(c, 60 - w / 2, w);
    c.beginPath();
    c.roundRect ? c.roundRect(60 - w / 2, y0, w, y1 - y0, 3) : c.rect(60 - w / 2, y0, w, y1 - y0);
    c.fill();
    c.strokeStyle = 'rgba(40,28,10,.35)'; c.lineWidth = 1;
    [0.3, 0.55].forEach(function (k) { c.beginPath(); c.moveTo(60 - w / 2, y0 + (y1 - y0) * k); c.lineTo(60 + w / 2, y0 + (y1 - y0) * k); c.stroke(); });
  }
  function strands(c, fromY, toY, spread, color) {
    c.strokeStyle = color; c.lineWidth = 0.8;
    for (let i = 0; i < 16; i++) {
      const x = 60 + (i / 15 - 0.5) * spread;
      c.beginPath(); c.moveTo(x * 0.5 + 30, toY); c.quadraticCurveTo(x, (fromY + toY) / 2, x * 0.9 + 6, fromY); c.stroke();
    }
  }

  function makeSprite(type) {
    const w = 120, h = 440, s = document.createElement('canvas');
    s.width = w; s.height = h;
    const c = s.getContext('2d');

    if (type === 'powder') {
      // пышная круглая пудровая кисть
      c.beginPath();
      c.moveTo(34, 150);
      c.bezierCurveTo(14, 110, 20, 22, 60, 12);
      c.bezierCurveTo(100, 22, 106, 110, 86, 150);
      c.closePath();
      c.fillStyle = lin(c, 0, 20, 0, 150, [[0, '#e8dcc4'], [0.5, '#b9a584'], [1, '#6f5f46']]);
      c.fill();
      strands(c, 28, 150, 70, 'rgba(60,46,28,.28)');
      ferrule(c, 150, 205, 38);
      handle(c, 205, 420, 24, 13);
    } else if (type === 'angled') {
      // скошенная кисть для контуринга
      c.beginPath();
      c.moveTo(42, 160); c.lineTo(38, 84); c.lineTo(82, 40); c.lineTo(80, 160); c.closePath();
      c.fillStyle = lin(c, 40, 40, 82, 160, [[0, '#d9c8a6'], [0.6, '#a38c68'], [1, '#6a5a42']]);
      c.fill();
      strands(c, 50, 160, 40, 'rgba(60,46,28,.3)');
      ferrule(c, 160, 212, 36);
      handle(c, 212, 424, 22, 12);
    } else if (type === 'mascara') {
      // щёточка туши: тонкий стержень и частые ворсинки
      c.strokeStyle = '#2a2016'; c.lineWidth = 5; c.lineCap = 'round';
      c.beginPath(); c.moveTo(60, 120); c.lineTo(60, 260); c.stroke();
      for (let y = 18; y < 120; y += 3.2) {
        const t = (y - 18) / 102, len = 15 + Math.sin(t * Math.PI) * 6 + 2;
        c.strokeStyle = 'rgba(14,11,8,.95)'; c.lineWidth = 1.4;
        c.beginPath(); c.moveTo(60, y); c.lineTo(60 - len, y - 3); c.moveTo(60, y); c.lineTo(60 + len, y - 3); c.stroke();
        c.strokeStyle = 'rgba(216,195,160,.55)'; c.lineWidth = 0.8;
        c.beginPath(); c.moveTo(60 - len, y - 3); c.lineTo(60 - len - 1.5, y - 3.6); c.moveTo(60 + len, y - 3); c.lineTo(60 + len + 1.5, y - 3.6); c.stroke();
      }
      c.fillStyle = '#16110c'; c.beginPath(); c.arc(60, 15, 4, 0, 7); c.fill();
      ferrule(c, 258, 282, 26);
      handle(c, 282, 430, 30, 24);
    } else {
      // карандаш для глаз
      c.beginPath(); c.moveTo(60, 20); c.lineTo(50, 78); c.lineTo(70, 78); c.closePath();
      c.fillStyle = '#c9ad82'; c.fill();                       // дерево
      c.beginPath(); c.moveTo(60, 20); c.lineTo(56, 44); c.lineTo(64, 44); c.closePath();
      c.fillStyle = '#14100b'; c.fill();                       // грифель
      c.fillStyle = lin(c, 48, 0, 72, 0, [[0, '#2b2218'], [0.4, '#7a6240'], [1, '#2b2218']]);
      c.beginPath(); c.rect(48, 78, 24, 300); c.fill();
      c.fillStyle = metal(c, 48, 24); c.fillRect(48, 78, 24, 14);
      c.strokeStyle = 'rgba(240,223,184,.3)'; c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(54, 100); c.lineTo(54, 372); c.stroke();
      c.fillStyle = '#1b140d'; c.beginPath(); c.rect(48, 370, 24, 8); c.fill();
    }
    return s;
  }

  const TYPES = ['powder', 'angled', 'mascara', 'liner'];
  const sprites = {};

  /* ---------- Объекты ---------- */
  let brushes = [], drops = [];

  function newBrush(initial) {
    const depth = rnd(0.35, 1);                       // 1 = ближе, крупнее и ярче
    const h = rnd(190, 340) * depth * clamp(W / 1200, 0.6, 1);
    const type = TYPES[Math.floor(Math.random() * TYPES.length)];
    return {
      type: type, h: h, w: h * (120 / 440), depth: depth,
      x: rnd(0.02, 0.98) * W, y: initial ? rnd(-0.1, 1.1) * H : -h - rnd(0, H * 0.5),
      vy: rnd(14, 34) * depth,
      rot: rnd(-0.7, 0.7), vrot: rnd(-0.12, 0.12),
      sway: rnd(14, 42), phase: rnd(0, 6.28), swayV: rnd(0.15, 0.4),
      alpha: 0.14 + 0.34 * depth * depth
    };
  }
  function newDrop(initial) {
    const r = rnd(4.5, 10);
    return { x: rnd(0.03, 0.97) * W, y: initial ? rnd(-0.2, 1) * H : rnd(-300, -20), y0: 0, vy: rnd(40, 110), r: r, alpha: rnd(0.35, 0.7), wait: initial ? 0 : rnd(0, 6) };
  }
  function build() {
    brushes = []; drops = [];
    const lowPower = (navigator.hardwareConcurrency || 8) <= 4;          // слабые устройства — меньше объектов
    const k = lowPower ? 0.6 : 1;
    const nb = Math.max(3, Math.round(clamp(Math.round(W / 170), 4, 9) * k)), nd = Math.max(5, Math.round(clamp(Math.round(W / 70), 7, 18) * k));
    for (let i = 0; i < nb; i++) brushes.push(newBrush(true));
    for (let i = 0; i < nd; i++) { const d = newDrop(true); d.y0 = d.y; drops.push(d); }
  }

  /* ---------- Отрисовка ---------- */
  function drawBrush(b, scrollOff) {
    const span = H + b.h * 2;
    let y = (((b.y + scrollOff * b.depth) % span) + span) % span - b.h;
    const x = b.x + Math.sin(b.phase) * b.sway;
    if (y < -b.h || y > H + b.h) return;
    ctx.save();
    ctx.globalAlpha = b.alpha;
    ctx.translate(x, y);
    ctx.rotate(b.rot);
    ctx.drawImage(sprites[b.type], -b.w / 2, -b.h / 2, b.w, b.h);
    ctx.restore();
  }

  function drawDrop(d) {
    // потёк за каплей
    const top = Math.max(d.y0, d.y - d.r * 11);
    if (d.y - top > 6) {
      const g = ctx.createLinearGradient(0, top, 0, d.y);
      g.addColorStop(0, 'rgba(216,195,160,0)');
      g.addColorStop(1, 'rgba(216,195,160,' + (d.alpha * 0.55).toFixed(3) + ')');
      ctx.strokeStyle = g; ctx.lineWidth = Math.max(1.5, d.r * 0.45); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(d.x, top); ctx.lineTo(d.x, d.y - d.r); ctx.stroke();
    }
    // сама капля: острый кончик вверху, круглое дно
    ctx.save();
    ctx.globalAlpha = d.alpha;
    ctx.beginPath();
    ctx.moveTo(d.x, d.y - d.r * 2.4);
    ctx.bezierCurveTo(d.x - d.r * 0.2, d.y - d.r * 1.3, d.x - d.r, d.y - d.r * 0.7, d.x - d.r, d.y);
    ctx.arc(d.x, d.y, d.r, Math.PI, 0, true);
    ctx.bezierCurveTo(d.x + d.r, d.y - d.r * 0.7, d.x + d.r * 0.2, d.y - d.r * 1.3, d.x, d.y - d.r * 2.4);
    ctx.closePath();
    const g = ctx.createRadialGradient(d.x - d.r * 0.35, d.y - d.r * 0.3, d.r * 0.05, d.x, d.y, d.r * 1.1);
    g.addColorStop(0, 'rgba(240,223,184,.95)');
    g.addColorStop(0.35, 'rgba(140,108,62,.9)');
    g.addColorStop(1, 'rgba(18,14,10,.95)');
    ctx.fillStyle = g; ctx.fill();
    ctx.restore();
  }

  function render(scrollOff) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    brushes.forEach(function (b) { drawBrush(b, scrollOff); });
    drops.forEach(drawDrop);
  }

  /* ---------- Анимация ---------- */
  let last = performance.now();
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    brushes.forEach(function (b) {
      b.y += b.vy * dt; b.rot += b.vrot * dt; b.phase += b.swayV * dt;
      if (b.y > H + b.h * 2) Object.assign(b, newBrush(false));   // ушла вниз — новая сверху
    });
    drops.forEach(function (d) {
      if (d.wait > 0) { d.wait -= dt; return; }
      d.vy = Math.min(d.vy + 160 * dt, 460); d.y += d.vy * dt;
      if (d.y - d.r * 2.4 > H) { const n = newDrop(false); n.y0 = n.y; Object.assign(d, n); }
    });
    render(-window.scrollY * 0.12);
    requestAnimationFrame(frame);
  }

  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    build();
    if (reduce) render(0);
  }

  TYPES.forEach(function (t) { sprites[t] = makeSprite(t); });
  let rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(resize, 150); });
  resize();
  if (!reduce) requestAnimationFrame(frame);
})();
