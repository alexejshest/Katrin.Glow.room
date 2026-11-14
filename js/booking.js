/* ============================================================
   Логика сайта: карточки услуг, календарь на год, слоты,
   localStorage-занятость, Telegram, .ics.
   Зависит от config.js (данные) и i18n.js (двуязычные тексты).

   Правила записи:
   • время — по Батуми (SLOT_CONFIG.TIMEZONE), а не по часам клиента;
   • слоты начала 04:00 … 20:00 с шагом 1 час;
   • услуга блокирует столько часов подряд, сколько длится (minutes);
   • услуга должна закончиться до CLOSE_HOUR.
   ============================================================ */
(function () {
  'use strict';

  const STORE_KEY = 'beautyBooked';
  const SEED_KEY = 'beautyBookedSeeded';
  const SENT_KEY = 'beautyLastSend';
  const CUR = SITE_CONFIG.CURRENCY;
  const ALL_ITEMS = SERVICES.concat(COURSES);
  const TOTAL_SLOTS = SLOT_CONFIG.END_HOUR - SLOT_CONFIG.START_HOUR + 1;

  const CLOSED = SITE_CONFIG.BOOKING_ENABLED === false;     // запись временно закрыта (см. config.js)
  const submitLabel = () => I18n.t(CLOSED ? 'notice.btn' : 'form.submit');
  const state = { itemId: null, date: null, time: null, busy: false };
  const refs = { cards: [], chips: [], days: [], months: [] };
  const $ = (id) => document.getElementById(id);
  const t = (k) => I18n.t(k);
  let lastFocus = null, lastBooking = null;

  /* ---------- Время Батуми ---------- */
  const tzFmt = new Intl.DateTimeFormat('en-CA', { timeZone: SLOT_CONFIG.TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false });
  function batumiNow() {
    const p = {};
    tzFmt.formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
    return { key: p.year + '-' + p.month + '-' + p.day, hour: parseInt(p.hour, 10) % 24 };
  }

  /* ---------- Утилиты ---------- */
  function pad(n) { return String(n).padStart(2, '0'); }
  function dateKey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseKey(k) { const p = k.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
  function longDate(k, lang) {
    const d = parseKey(k), l = lang || I18n.lang, m = I18N[l].months[d.getMonth()];
    return l === 'ru' ? d.getDate() + ' ' + m + ' ' + d.getFullYear() : m + ' ' + d.getDate() + ', ' + d.getFullYear();
  }
  function escapeHtml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function itemById(id) { return ALL_ITEMS.find(function (i) { return i.id === id; }); }
  function iname(it, lang) { return lang ? it.name[lang] : I18n.pick(it.name); }
  function money(it) { return it.price + ' ' + CUR; }
  function needHours(it) { return it ? Math.max(1, Math.ceil(it.minutes / 60)) : 1; }
  function hhmm(h) { return pad(h) + ':00'; }
  function endLabel(startH, it) {
    const total = startH * 60 + (it ? it.minutes : 60);
    return pad(Math.floor(total / 60)) + ':' + pad(total % 60);
  }
  function isDemo() {
    const c = TELEGRAM_CONFIG;
    return !c.BOT_TOKEN || !c.CHAT_ID || c.BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE' || c.CHAT_ID === 'YOUR_CHAT_ID_HERE';
  }
  function chime() { if (typeof Sound !== 'undefined') Sound.success(); }
  function photoAttrs(img, name) {
    img.src = 'img/' + name + '-800.jpg';
    img.srcset = 'img/' + name + '-800.jpg 800w, img/' + name + '-1400.jpg 1400w, img/' + name + '.jpg 2000w';
    img.sizes = '(max-width: 960px) 100vw, 33vw';
    img.width = 800; img.height = 1200;
  }

  /* ---------- Хранилище занятых часов (с кэшем) ---------- */
  let cache = null;
  function booked() {
    if (cache) return cache;
    try {
      const data = JSON.parse(localStorage.getItem(STORE_KEY));
      cache = data && typeof data === 'object' ? data : {};
    } catch (e) { cache = {}; }
    return cache;
  }
  function saveBooked() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(cache)); } catch (e) { /* хранилище недоступно */ }
  }
  function seedDemo() {
    try { if (localStorage.getItem(SEED_KEY)) return; } catch (e) { return; }
    const data = booked(), now = parseKey(batumiNow().key);
    const plan = [[0, [12, 15]], [1, [9, 10, 11, 16]], [2, [8, 13, 18]], [4, [10, 14]], [7, [12, 13]]];
    plan.forEach(function (p) {
      const d = new Date(now); d.setDate(d.getDate() + p[0]);
      const k = dateKey(d);
      data[k] = Array.from(new Set((data[k] || []).concat(p[1].map(hhmm))));
    });
    saveBooked();
    try { localStorage.setItem(SEED_KEY, '1'); } catch (e) { /* ignore */ }
  }
  function isBooked(k, h) { return (booked()[k] || []).indexOf(hhmm(h)) !== -1; }
  function bookHours(k, h, n) {
    const data = booked();
    data[k] = data[k] || [];
    for (let i = 0; i < n; i++) if (data[k].indexOf(hhmm(h + i)) === -1) data[k].push(hhmm(h + i));
    saveBooked();
  }

  // Можно ли начать запись в час h дня k на n часов? → 'ok' | 'past' | 'busy' | 'close'
  function slotState(k, h, n) {
    const now = batumiNow();
    if (k === now.key && h <= now.hour) return 'past';
    if (h + n > SLOT_CONFIG.CLOSE_HOUR) return 'close';
    for (let i = 0; i < n; i++) if (isBooked(k, h + i)) return 'busy';
    return 'ok';
  }
  function currentNeed() { return needHours(state.itemId ? itemById(state.itemId) : null); }

  /* ---------- Карточки услуг ---------- */
  function renderCards() {
    const sg = $('servicesGrid');
    SERVICES.forEach(function (s) {
      const c = el('article', 'service-card reveal');
      if (s.img) {
        const img = el('img', 'card-img');
        img.alt = ''; img.loading = 'lazy'; img.decoding = 'async';
        photoAttrs(img, s.img);
        c.appendChild(img);
      }
      const h = el('h3'), p = el('p'), price = el('span', 'price', money(s)), dur = el('span', 'dur');
      const meta = el('div', 'card-meta'); meta.appendChild(price); meta.appendChild(dur);
      const b = el('button', 'btn-pick'); b.type = 'button';
      b.addEventListener('click', function () { pickItem(s.id, true); });
      c.appendChild(h); c.appendChild(p); c.appendChild(meta); c.appendChild(b);
      c.addEventListener('pointermove', function (e) {
        const r = c.getBoundingClientRect();
        c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        c.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
      sg.appendChild(c);
      refs.cards.push({ s: s, h: h, p: p, dur: dur, b: b });
    });

    document.querySelectorAll('[data-pick]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        pickItem(btn.getAttribute('data-pick'), true);
      });
    });
    document.querySelectorAll('[data-price]').forEach(function (n) {
      const it = itemById(n.getAttribute('data-price'));
      if (it) n.textContent = money(it);
    });
  }

  /* ---------- Выбор услуги ---------- */
  function renderChips() {
    const box = $('serviceChips');
    function group(labelKey, items) {
      const lab = el('span', 'chip-group-label'); lab.dataset.i18n = labelKey;
      box.appendChild(lab);
      items.forEach(function (it) {
        const b = el('button', 'chip'); b.type = 'button';
        b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', 'false');
        b.dataset.id = it.id;
        b.addEventListener('click', function () { pickItem(it.id, false); });
        box.appendChild(b);
        refs.chips.push({ it: it, b: b });
      });
    }
    group('book.group.services', SERVICES);
    group('book.group.course', COURSES);
  }

  function pickItem(id, scroll) {
    const it = itemById(id);
    if (!it) return;
    state.itemId = id;
    refs.chips.forEach(function (c) { c.b.setAttribute('aria-checked', String(c.it.id === id)); });
    // Выбранное время сохраняем, только если услуга всё ещё помещается
    if (state.time && slotState(state.date, parseInt(state.time, 10), needHours(it)) !== 'ok') state.time = null;
    repaintMeters();
    renderSlots();
    if (scroll) $('booking').scrollIntoView({ behavior: 'smooth' });
  }

  /* ---------- Календарь на 365 дней ---------- */
  function freeCount(k) {
    const n = currentNeed();
    let free = 0;
    for (let h = SLOT_CONFIG.START_HOUR; h <= SLOT_CONFIG.END_HOUR; h++) if (slotState(k, h, n) === 'ok') free++;
    return free;
  }
  function paintMeter(dayEl) {
    const f = freeCount(dayEl.dataset.key), ratio = f / TOTAL_SLOTS;
    dayEl.dataset.level = f === 0 ? 'none' : ratio > 0.5 ? 'free' : ratio > 0.2 ? 'mid' : 'low';
    dayEl.querySelector('.meter span').style.width = Math.round(ratio * 100) + '%';
    dayEl.title = f ? t('book.free') + f : t('book.full');
  }
  function repaintMeters() { document.querySelectorAll('#calendar .day').forEach(paintMeter); }

  function renderCalendar() {
    const cal = $('calendar'), monthBar = $('monthBar');
    const today = parseKey(batumiNow().key);
    const monthSeen = {};
    for (let i = 0; i < SLOT_CONFIG.DAYS_AHEAD; i++) {
      const d = new Date(today); d.setDate(today.getDate() + i);
      const k = dateKey(d);
      const b = el('button', 'day' + (d.getDate() === 1 ? ' month-start' : '') + (d.getDay() === 0 || d.getDay() === 6 ? ' weekend' : ''));
      b.type = 'button'; b.setAttribute('role', 'option'); b.setAttribute('aria-selected', 'false'); b.tabIndex = -1;
      b.dataset.key = k;
      const wd = el('small'), num = el('b', null, String(d.getDate())), mo = el('small');
      b.appendChild(wd); b.appendChild(num); b.appendChild(mo);
      const m = el('i', 'meter'); m.appendChild(document.createElement('span')); b.appendChild(m);
      b.addEventListener('click', function () { pickDate(k); });
      cal.appendChild(b);
      refs.days.push({ d: d, wd: wd, mo: mo });
      paintMeter(b);

      const mk = d.getFullYear() + '-' + d.getMonth();
      if (!monthSeen[mk]) {
        monthSeen[mk] = 1;
        const mb = el('button', 'month'); mb.type = 'button';
        mb.dataset.key = k; mb.dataset.month = mk;
        mb.addEventListener('click', function () { pickDate(k); });
        monthBar.appendChild(mb);
        refs.months.push({ d: d, b: mb });
      }
    }
    const step = function () { return Math.max(200, cal.clientWidth * 0.8); };
    $('calPrev').addEventListener('click', function () { cal.scrollBy({ left: -step(), behavior: 'smooth' }); });
    $('calNext').addEventListener('click', function () { cal.scrollBy({ left: step(), behavior: 'smooth' }); });
    $('qToday').addEventListener('click', function () { pickDate(dateKey(today)); });
    $('qTomorrow').addEventListener('click', function () { const n = new Date(today); n.setDate(n.getDate() + 1); pickDate(dateKey(n)); });
    $('qNearest').addEventListener('click', pickNearest);

    // Клавиатура: ← → день, ↑ ↓ неделя, Home/End — начало/конец, Enter/Space — выбор
    cal.addEventListener('keydown', function (e) {
      const move = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
      if (move === undefined && e.key !== 'Home' && e.key !== 'End') return;
      e.preventDefault();
      const days = refs.days;
      let idx = days.findIndex(function (r) { return dateKey(r.d) === state.date; });
      if (idx < 0) idx = 0;
      if (e.key === 'Home') idx = 0; else if (e.key === 'End') idx = days.length - 1; else idx = clamp(idx + move, 0, days.length - 1);
      pickDate(dateKey(days[idx].d), false, true);
    });
    pickDate(dateKey(today), true);
  }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  function pickDate(k, initial, keepFocus) {
    state.date = k;
    state.time = null;
    const cal = $('calendar');
    let sel = null;
    document.querySelectorAll('#calendar .day').forEach(function (d) {
      const on = d.dataset.key === k;
      d.setAttribute('aria-selected', String(on));
      d.tabIndex = on ? 0 : -1;
      if (on) sel = d;
    });
    const d0 = parseKey(k), mk = d0.getFullYear() + '-' + d0.getMonth();
    document.querySelectorAll('#monthBar .month').forEach(function (m) {
      m.classList.toggle('on', m.dataset.month === mk);
      if (m.dataset.month === mk && !initial) m.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    });
    if (sel && !initial) cal.scrollTo({ left: sel.offsetLeft - cal.clientWidth / 2 + sel.offsetWidth / 2, behavior: 'smooth' });
    if (sel && keepFocus) sel.focus({ preventScroll: true });
    renderSlots();
  }

  // Ближайшее свободное время для выбранной услуги (по Батуми)
  function pickNearest() {
    const n = currentNeed(), start = parseKey(batumiNow().key);
    for (let i = 0; i < SLOT_CONFIG.DAYS_AHEAD; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const k = dateKey(d);
      for (let h = SLOT_CONFIG.START_HOUR; h <= SLOT_CONFIG.END_HOUR; h++) {
        if (slotState(k, h, n) === 'ok') {
          pickDate(k);
          state.time = hhmm(h);
          renderSlots();
          const btn = document.querySelector('#slots .slot[aria-pressed="true"]');
          if (btn) btn.focus({ preventScroll: true });
          return;
        }
      }
    }
    showError(t('book.nonefound'));
  }

  /* ---------- Итог (билет и мобильная полоска) ---------- */
  function updateSummary() {
    const it = state.itemId ? itemById(state.itemId) : null;
    const h = state.time ? parseInt(state.time, 10) : null;
    $('sumService').textContent = it ? iname(it) : '—';
    $('sumDur').textContent = it ? I18n.pick(it.duration) : '—';
    $('sumPrice').textContent = it ? money(it) : '—';
    $('sumDate').textContent = state.date ? longDate(state.date) : '—';
    $('sumTime').textContent = h !== null ? state.time + ' – ' + endLabel(h, it) : '—';
    $('selectedInfo').textContent = it ? iname(it) + ' — ' + money(it) + ' · ' + I18n.pick(it.duration) : t('book.choose');
    $('dateLabel').textContent = state.date ? longDate(state.date) : '';
    // мобильная полоска
    $('sbName').textContent = it ? iname(it) : t('sum.empty');
    $('sbPrice').textContent = it ? money(it) : '';
    $('sbWhen').textContent = state.date ? longDate(state.date) + (h !== null ? ' · ' + state.time : '') : '';
  }

  // Все подписи, зависящие от языка (старт и смена языка)
  function relabel() {
    refs.cards.forEach(function (c) {
      c.h.textContent = iname(c.s);
      c.p.textContent = I18n.pick(c.s.desc);
      c.dur.textContent = I18n.pick(c.s.duration);
      c.b.textContent = t('srv.pick');
    });
    refs.chips.forEach(function (c) { c.b.textContent = iname(c.it) + ' · ' + money(c.it); });
    const ms = I18N[I18n.lang].monthsShort, ds = I18N[I18n.lang].days;
    refs.days.forEach(function (r) { r.wd.textContent = ds[r.d.getDay()]; r.mo.textContent = ms[r.d.getMonth()]; });
    refs.months.forEach(function (r) {
      r.b.textContent = ms[r.d.getMonth()];
      r.b.title = I18N[I18n.lang].months[r.d.getMonth()] + ' ' + r.d.getFullYear();
    });
    repaintMeters();
    $('salonAddress').textContent = I18n.pick(TELEGRAM_CONFIG.SALON_ADDRESS);
    document.querySelectorAll('[data-dur]').forEach(function (n) {
      const it = itemById(n.getAttribute('data-dur'));
      if (it) n.textContent = I18n.pick(it.duration);
    });
    showError('');
    renderSlots();
    if (!state.busy) $('submitBtn').textContent = submitLabel();
    $('sbBtn').textContent = t('sum.cta');
  }

  /* ---------- Слоты 04:00–20:00, сгруппированы по времени суток ---------- */
  const GROUPS = [['book.morning', 4, 11], ['book.day', 12, 16], ['book.evening', 17, 20]];

  function renderSlots() {
    const box = $('slots');
    box.replaceChildren();
    const n = currentNeed(), startH = state.time ? parseInt(state.time, 10) : null;
    GROUPS.forEach(function (g) {
      const wrap = el('div', 'slot-group');
      const lab = el('p', 'slot-label', t(g[0]));
      const row = el('div', 'slot-row');
      for (let h = g[1]; h <= g[2]; h++) {
        if (h < SLOT_CONFIG.START_HOUR || h > SLOT_CONFIG.END_HOUR) continue;
        const tm = hhmm(h), st = slotState(state.date, h, n);
        const b = el('button', 'slot'); b.type = 'button';
        b.appendChild(document.createTextNode(tm));
        if (startH !== null && h > startH && h < startH + n) b.classList.add('in-range');   // «хвост» выбранной услуги
        if (st !== 'ok') {
          b.disabled = true;
          if (st === 'busy') b.appendChild(el('span', null, t('book.busy')));
          if (st === 'close') b.title = t('book.nofit');
        } else {
          b.setAttribute('aria-pressed', String(startH === h));
          b.addEventListener('click', function () { state.time = tm; renderSlots(); });
        }
        row.appendChild(b);
      }
      wrap.appendChild(lab); wrap.appendChild(row);
      box.appendChild(wrap);
    });
    const dayEl = document.querySelector('#calendar .day[data-key="' + state.date + '"]');
    if (dayEl) paintMeter(dayEl);
    updateSummary();
  }

  /* ---------- Telegram ---------- */
  // Заявка мастеру всегда на русском; язык клиента — отдельной строкой
  function buildMessage(item, f) {
    const c = TELEGRAM_CONFIG, h = parseInt(state.time, 10);
    const lines = [
      '💄 <b>Новая заявка</b>',
      '',
      '<b>' + (item.type === 'course' ? 'Курс' : 'Услуга') + ':</b> ' + escapeHtml(item.name.ru) + ' / ' + escapeHtml(item.name.en),
      '<b>Стоимость:</b> ' + money(item),
      '<b>Дата:</b> ' + longDate(state.date, 'ru'),
      '<b>Время (Батуми):</b> ' + state.time + ' – ' + endLabel(h, item) + ' (' + item.minutes + ' мин)',
      '<b>Имя:</b> ' + escapeHtml(f.name),
      '<b>Контакт:</b> ' + escapeHtml(f.contact),
      '<b>Язык клиента:</b> ' + I18n.lang.toUpperCase(),
      '<b>Комментарий:</b> ' + (f.comment ? escapeHtml(f.comment) : '—'),
      '',
      '📍 ' + escapeHtml(c.SALON_ADDRESS.ru),
      'Координаты: ' + c.SALON_LAT + ', ' + c.SALON_LNG,
      c.MAPS_LINK
    ];
    return lines.join('\n');
  }

  // Отправка с таймаутом и повтором при сбое сети (до 3 попыток)
  async function sendToTelegram(text) {
    if (isDemo()) {
      await new Promise(function (r) { setTimeout(r, 700); });
      return { demo: true };
    }
    const url = 'https://api.telegram.org/bot' + TELEGRAM_CONFIG.BOT_TOKEN + '/sendMessage';
    const body = JSON.stringify({ chat_id: TELEGRAM_CONFIG.CHAT_ID, text: text, parse_mode: 'HTML', disable_web_page_preview: true });
    let lastErr;
    for (let attempt = 0; attempt < 3; attempt++) {
      const ctl = new AbortController();
      const timer = setTimeout(function () { ctl.abort(); }, 12000);
      try {
        const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, signal: ctl.signal });
        clearTimeout(timer);
        const json = await res.json().catch(function () { return {}; });
        if (res.ok && json.ok !== false) return { demo: false };
        if (res.status < 500 && res.status !== 429) throw Object.assign(new Error(json.description || 'Telegram API error'), { fatal: true });
        lastErr = new Error(json.description || ('HTTP ' + res.status));
      } catch (err) {
        clearTimeout(timer);
        if (err.fatal) throw err;
        lastErr = err;
      }
      await new Promise(function (r) { setTimeout(r, 600 * (attempt + 1)); });
    }
    throw Object.assign(new Error(t('err.net')), { complete: true });   // готовая фраза, без приставок
  }

  /* ---------- Отправка формы ---------- */
  function showError(msg) { $('formError').textContent = msg || ''; }

  async function onSubmit(e) {
    e.preventDefault();
    if (CLOSED || state.busy) return;
    if ($('fWebsite').value) return;                                   // honeypot: бот заполнил скрытое поле
    const f = { name: $('fName').value.trim(), contact: $('fContact').value.trim(), comment: $('fComment').value.trim() };
    if (!state.itemId) return showError(t('err.service'));
    if (!state.date) return showError(t('err.date'));
    if (!state.time) return showError(t('err.time'));
    if (!f.name) return showError(t('err.name'));
    if (f.contact.length < 3) return showError(t('err.contact'));
    const item = itemById(state.itemId), h = parseInt(state.time, 10);
    if (slotState(state.date, h, needHours(item)) !== 'ok') { state.time = null; renderSlots(); return showError(t('err.busy')); }
    // не чаще одной отправки в 8 секунд
    try { if (Date.now() - Number(localStorage.getItem(SENT_KEY) || 0) < 8000) return; } catch (x) { /* ignore */ }
    showError('');

    const btn = $('submitBtn');
    state.busy = true; btn.disabled = true; btn.textContent = t('form.sending');
    try {
      const result = await sendToTelegram(buildMessage(item, f));
      try { localStorage.setItem(SENT_KEY, String(Date.now())); } catch (x) { /* ignore */ }
      bookHours(state.date, h, needHours(item));
      lastBooking = { item: item, key: state.date, h: h };
      showModal(item, f, result.demo);
      chime();
      state.time = null;
      $('bookingForm').reset();
      repaintMeters();
      renderSlots();
    } catch (err) {
      showError(err.complete ? err.message : t('err.send') + err.message + t('err.retry'));
    } finally {
      state.busy = false; btn.disabled = false; btn.textContent = submitLabel();
    }
  }

  /* ---------- Модальное окно (с ловушкой фокуса) и .ics ---------- */
  function showModal(item, f, demo) {
    const h = lastBooking.h;
    $('modalText').textContent = f.name + t('modal.greet') + '\n' + iname(item) + '\n' + longDate(lastBooking.key) + t('modal.at') + hhmm(h) + ' – ' + endLabel(h, item);
    $('demoNote').hidden = !demo;
    lastFocus = document.activeElement;
    $('modal').hidden = false;
    $('modalClose').focus();
  }
  function closeModal() {
    $('modal').hidden = true;
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  function trapFocus(e) {
    if ($('modal').hidden || e.key !== 'Tab') return;
    const f = Array.from($('modal').querySelectorAll('button:not([hidden]), a[href]'));
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  // Файл календаря: время Батуми = UTC+4 без перехода, поэтому пишем в UTC
  function downloadIcs() {
    if (!lastBooking) return;
    const b = lastBooking, p = b.key.split('-').map(Number);
    const start = Date.UTC(p[0], p[1] - 1, p[2], b.h - 4, 0), end = start + b.item.minutes * 60000;
    const fmt = function (ms) { return new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); };
    const esc = function (s) { return String(s).replace(/[\\;,]/g, '\\$&').replace(/\n/g, '\\n'); };
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Katrin Glow Room//Booking//EN', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
      'UID:' + start + '-' + b.item.id + '@katrin-glow-room',
      'DTSTAMP:' + fmt(Date.now()), 'DTSTART:' + fmt(start), 'DTEND:' + fmt(end),
      'SUMMARY:' + esc(SITE_CONFIG.BRAND + ' — ' + iname(b.item)),
      'LOCATION:' + esc(I18n.pick(TELEGRAM_CONFIG.SALON_ADDRESS)),
      'GEO:' + TELEGRAM_CONFIG.SALON_LAT + ';' + TELEGRAM_CONFIG.SALON_LNG,
      'DESCRIPTION:' + esc(money(b.item) + '\n' + TELEGRAM_CONFIG.MAPS_LINK),
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    a.download = 'katrin-glow-room-booking.ics';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  /* ---------- UI: меню, reveal, мобильная полоска ---------- */
  function initUi() {
    const burger = $('burger'), links = $('navLinks');
    burger.addEventListener('click', function () {
      const open = links.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(open));
    });
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { links.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }
    });
    $('modalClose').addEventListener('click', closeModal);
    $('icsBtn').addEventListener('click', downloadIcs);
    $('modal').addEventListener('click', function (e) { if (e.target.id === 'modal') closeModal(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('modal').hidden) closeModal(); trapFocus(e); });

    // Запись временно закрыта: показываем плашку и блокируем отправку формы
    if (CLOSED) {
      $('booking').classList.add('is-closed');
      $('bookingNotice').hidden = false;
      $('submitBtn').disabled = true;
      document.querySelector('.t-note').setAttribute('data-i18n', 'tk.note.closed');
      $('bookingForm').querySelectorAll('input, textarea').forEach(function (i) { i.disabled = true; });
    }

    $('mapsBtn').href = TELEGRAM_CONFIG.MAPS_LINK;
    // Instagram: мастер и студия
    [['igNoticeMaster', SOCIAL_CONFIG.INSTAGRAM_MASTER], ['igNoticeSalon', SOCIAL_CONFIG.INSTAGRAM_SALON],
     ['igMaster', SOCIAL_CONFIG.INSTAGRAM_MASTER], ['igMasterFoot', SOCIAL_CONFIG.INSTAGRAM_MASTER],
     ['igSalon', SOCIAL_CONFIG.INSTAGRAM_SALON], ['igSalonFoot', SOCIAL_CONFIG.INSTAGRAM_SALON]].forEach(function (p) { $(p[0]).href = p[1]; });
    $('year').textContent = new Date().getFullYear();
    $('sbBtn').addEventListener('click', function () { $('bookingForm').scrollIntoView({ behavior: 'smooth', block: 'start' }); });

    const items = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
      }, { threshold: 0.12 });
      items.forEach(function (i) { io.observe(i); });
      // Полоска итога на телефоне видна, пока на экране блок записи
      const bk = $('booking'), sb = $('sumbar');
      new IntersectionObserver(function (en) { sb.classList.toggle('show', en[0].isIntersecting); }, { threshold: 0.05 }).observe(bk);
    } else {
      items.forEach(function (i) { i.classList.add('in'); });
    }
  }

  /* ---------- Старт ---------- */
  seedDemo();
  renderCards();
  renderChips();
  renderCalendar();
  initUi();
  I18n.init();
  relabel();
  document.addEventListener('langchange', relabel);
  $('bookingForm').addEventListener('submit', onSubmit);
  if (typeof Sound !== 'undefined') Sound.init();
})();
