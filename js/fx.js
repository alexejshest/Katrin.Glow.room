/* ============================================================
   Визуальные эффекты: прелоадер, полоса прогресса, умная шапка,
   подсветка раздела, лёгкий параллакс, видео по видимости,
   курсор-кольцо, «магнитные» кнопки, мягкий наклон карточек.
   Логику записи не затрагивает (см. booking.js).
   ============================================================ */
(function () {
  'use strict';

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Прелоадер ---------- */
  function initLoader() {
    const loader = $('#loader'), num = $('#loaderNum');
    const done = function () {
      document.body.classList.add('ready');
      if (loader) { loader.classList.add('out'); setTimeout(function () { loader.remove(); }, 1300); }
    };
    if (!loader || reduce) return done();
    let n = 0;
    const timer = setInterval(function () {
      n += Math.ceil(Math.random() * 9);
      if (n >= 100) { n = 100; clearInterval(timer); setTimeout(done, 250); }
      num.textContent = n;
    }, 55);
  }

  /* ---------- Каскадные задержки появления ---------- */
  function stagger() {
    $$('.services-grid, .photo-grid').forEach(function (box) {
      Array.from(box.children).forEach(function (c, i) { c.style.setProperty('--d', i % 3); });
    });
  }

  /* ---------- Прогресс, шапка, подсветка текущего раздела ---------- */
  const nav = $('#nav'), bar = $('#progress');
  let lastY = window.scrollY;
  function updateNav() {
    const y = window.scrollY, max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    const open = $('#navLinks').classList.contains('open');
    nav.classList.toggle('hide', y > lastY && y > 400 && !open);
    lastY = y;
  }
  function initActiveLinks() {
    if (!('IntersectionObserver' in window)) return;
    const links = $$('.nav-links a');
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) links.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['services', 'portfolio', 'course', 'booking', 'contacts'].forEach(function (id) { const s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ---------- Параллакс (data-speed) ---------- */
  const para = $$('[data-speed]');
  function updateParallax() {
    if (reduce) return;
    para.forEach(function (el) {
      const r = el.getBoundingClientRect();
      const off = (r.top + r.height / 2 - window.innerHeight / 2) * parseFloat(el.dataset.speed);
      el.style.translate = '0 ' + off.toFixed(1) + 'px';
    });
  }

  /* ---------- Видео: играет только когда видно ---------- */
  const reelBox = $('#reel'), reelVid = $('#reelVideo');
  function initReel() {
    if (!reelVid || reduce || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { const p = reelVid.play(); if (p && p.catch) p.catch(function () {}); }
        else reelVid.pause();
      });
    }, { threshold: 0.25 }).observe(reelVid);
  }
  function updateReel() {
    if (!reelBox || reduce) return;
    const r = reelBox.getBoundingClientRect();
    const p = clamp((window.innerHeight - r.top) / (window.innerHeight + r.height), 0, 1) - 0.5;
    reelVid.style.transform = 'translate3d(0,' + (p * -50).toFixed(1) + 'px,0) scale(' + (1.02 + Math.abs(p) * 0.05).toFixed(3) + ')';
  }

  /* ---------- Курсор, магнит, наклон ---------- */
  function initPointer() {
    if (!fine || reduce) return;
    const cur = $('#cursor');
    let tx = 0, ty = 0, cx = 0, cy = 0, running = false;
    function loop() {
      cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;
      cur.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
      if (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) requestAnimationFrame(loop); else running = false;
    }
    window.addEventListener('pointermove', function (e) {
      tx = e.clientX; ty = e.clientY; cur.classList.add('on');
      if (!running) { running = true; requestAnimationFrame(loop); }
    }, { passive: true });
    document.addEventListener('pointerleave', function () { cur.classList.remove('on'); });
    document.addEventListener('pointerover', function (e) {
      cur.classList.toggle('big', !!e.target.closest('a, button, .tile, .day, .slot, .chip, input, textarea'));
    });

    $$('[data-magnet]').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        const r = b.getBoundingClientRect();
        b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.2) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.3) + 'px)';
      });
      b.addEventListener('pointerleave', function () { b.style.transform = ''; });
    });

    function tilt(el, k) {
      el.addEventListener('pointermove', function (e) {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'perspective(1000px) rotateX(' + (-y * k) + 'deg) rotateY(' + (x * k) + 'deg) translateY(-6px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    }
    $$('.service-card').forEach(function (c) { tilt(c, 2.5); });
  }

  /* ---------- Общий цикл прокрутки ---------- */
  let ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () { updateNav(); updateParallax(); updateReel(); ticking = false; });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  stagger();
  initReel();
  initActiveLinks();
  initPointer();
  onScroll();
  initLoader();
})();
