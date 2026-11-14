/* ============================================================
   Мультиязычность RU / EN
   - статические тексты: атрибуты data-i18n, data-i18n-html,
     data-i18n-ph (placeholder), data-i18n-aria, data-i18n-title
   - динамические части (карточки, календарь, слоты) перерисовывает
     booking.js по событию document → 'langchange'
   Выбранный язык запоминается в localStorage.
   ============================================================ */
const I18N = {
  ru: {
    'meta.title': 'Beauty Studio — визажист в Батуми',
    'meta.desc': 'Безупречный образ для вашего особенного дня. Свадебный и вечерний макияж в Батуми, онлайн-запись.',

    'nav.services': 'Услуги', 'nav.portfolio': 'Работы', 'nav.course': 'Обучение', 'nav.booking': 'Запись', 'nav.contacts': 'Контакты',
    'nav.cta': 'Записаться', 'nav.menu': 'Меню', 'nav.lang': 'Язык', 'nav.sound': 'Звук',

    'hero.eyebrow': 'Визажист · Батуми',
    'hero.title': 'Безупречный образ для вашего <em>особенного</em> дня',
    'hero.alt': 'Flawless look for your special day',
    'hero.cta': 'Записаться онлайн', 'hero.cta2': 'Услуги и цены',

    'srv.eyebrow': 'Услуги',
    'srv.title': 'Услуги и <em>стоимость</em>',
    'srv.pick': 'Выбрать',
    'travel.text': 'Выезд за пределы Батуми — по индивидуальной договорённости',

    'port.eyebrow': 'Portfolio',
    'port.title': 'Избранные <em>работы</em>',
    'port.t1': 'Образ невесты', 'port.t2': 'Нюд · свет', 'port.t3': 'Свадебное утро', 'port.t4': 'Вечернее золото', 'port.t5': 'Тёплый нюд',

    'reel.eyebrow': 'Процесс',
    'reel.title': 'Смотрите, как рождается образ',
    'reel.note': 'видео-заглушка · замените на свой ролик',

    'course.eyebrow': 'Обучение',
    'course.title': 'Макияж <em>для себя</em>',
    'course.lead': 'Научитесь подбирать косметику под свой тип внешности, делать дневной макияж за 15 минут и превращать его в вечерний.',
    'course.note': 'индивидуальное занятие',
    'course.cta': 'Записаться на обучение',

    'book.eyebrow': 'Онлайн-запись',
    'book.title': 'Выберите <em>время</em>',
    'book.s1': 'Услуга', 'book.s2': 'Дата', 'book.s3': 'Время', 'book.s4': 'Ваши данные',
    'book.group.services': 'Услуги', 'book.group.course': 'Обучение',
    'book.choose': 'Выберите услугу',
    'book.today': 'Сегодня', 'book.tomorrow': 'Завтра',
    'book.prev': 'Назад', 'book.next': 'Вперёд',
    'book.legend.free': 'много мест', 'book.legend.mid': 'мало', 'book.legend.none': 'почти занято',
    'book.free': 'Свободно: ', 'book.full': 'Мест нет', 'book.busy': 'Занято',
    'form.name': 'Имя', 'form.name.ph': 'Как к вам обращаться',
    'form.contact': 'Телефон или ник в Telegram', 'form.contact.ph': '+995 … или @username',
    'form.comment': 'Комментарий', 'form.comment.ph': 'Пожелания, дата мероприятия, референсы (необязательно)',
    'form.submit': 'Подтвердить запись', 'form.sending': 'Отправляем…',
    'err.service': 'Выберите услугу или курс.', 'err.date': 'Выберите дату.', 'err.time': 'Выберите время.',
    'err.name': 'Укажите имя.', 'err.contact': 'Укажите телефон или ник в Telegram.',
    'err.busy': 'Это время уже занято, выберите другое.', 'err.send': 'Не удалось отправить заявку: ',
    'err.retry': '. Попробуйте ещё раз.',
    'tk.title': 'Ваша запись', 'tk.service': 'Услуга', 'tk.date': 'Дата', 'tk.time': 'Время', 'tk.dur': 'Длительность', 'tk.total': 'Итого',
    'tk.note': 'Заявка уйдёт мастеру в Telegram. Время сразу блокируется для других клиентов.',

    'contacts.eyebrow': 'Контакты',
    'contacts.title': 'Ждём вас <em>в Батуми</em>',
    'contacts.hours': 'Ежедневно, по записи · 04:00–21:00',
    'contacts.map': 'Открыть в Google Maps ↗',

    'modal.title': 'Вы записаны!', 'modal.greet': ', ждём вас!', 'modal.at': ' в ', 'modal.ok': 'Отлично',
    'modal.demo': 'Демо-режим: заявка не отправлена в Telegram. Укажите токен в js/config.js.',
    'footer.top': 'Наверх ↑',
    'social.master': 'Instagram мастера', 'social.salon': 'Instagram студии', 'social.title': 'Мы в Instagram',
    'nav.skip': 'К содержанию',
    'book.nearest': 'Ближайшее время', 'book.tz': 'Время по Батуми (GMT+4)',
    'book.morning': 'Утро', 'book.day': 'День', 'book.evening': 'Вечер', 'book.nofit': 'Не хватает времени до закрытия',
    'book.hours': 'ч', 'book.nonefound': 'Свободного времени в ближайший год не найдено.',
    'sum.cta': 'К записи', 'sum.empty': 'Выберите услугу',
    'modal.ics': 'Добавить в календарь', 'modal.range': 'Время: ',
    'err.net': 'Нет связи с Telegram. Проверьте интернет и попробуйте ещё раз.',
    'alt.hero': 'Профиль девушки под лёгкой вуалью',
    'alt.w1': 'Невеста в кружевном халате, визажист наносит блеск для губ',
    'alt.p2': 'Визажист наносит тени кистью, нюдовый макияж',
    'alt.w2': 'Невеста с причёской, визажист наносит румяна',
    'alt.p5': 'Золотистые тени и ресницы крупным планом',
    'alt.w3': 'Нюдовый макияж и причёска в тёплом свете',
    months: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
    monthsShort: ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
    days: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
  },

  en: {
    'meta.title': 'Beauty Studio — makeup artist in Batumi',
    'meta.desc': 'A flawless look for your special day. Bridal and evening makeup in Batumi, online booking.',

    'nav.services': 'Services', 'nav.portfolio': 'Portfolio', 'nav.course': 'Course', 'nav.booking': 'Booking', 'nav.contacts': 'Contact',
    'nav.cta': 'Book now', 'nav.menu': 'Menu', 'nav.lang': 'Language', 'nav.sound': 'Sound',

    'hero.eyebrow': 'Makeup artist · Batumi',
    'hero.title': 'Flawless look for your <em>special</em> day',
    'hero.alt': 'Безупречный образ для вашего особенного дня',
    'hero.cta': 'Book online', 'hero.cta2': 'Services & prices',

    'srv.eyebrow': 'Services',
    'srv.title': 'Services & <em>pricing</em>',
    'srv.pick': 'Select',
    'travel.text': 'Out-of-Batumi travel is available upon individual agreement',

    'port.eyebrow': 'Избранные работы',
    'port.title': 'Selected <em>works</em>',
    'port.t1': 'Bridal look', 'port.t2': 'Nude · light', 'port.t3': 'Wedding morning', 'port.t4': 'Evening gold', 'port.t5': 'Warm nude',

    'reel.eyebrow': 'Process',
    'reel.title': 'Watch a look come to life',
    'reel.note': 'placeholder video · replace with your own reel',

    'course.eyebrow': 'Course',
    'course.title': 'Makeup <em>for Yourself</em>',
    'course.lead': 'Learn to choose products for your features, create a daytime look in 15 minutes and turn it into an evening one.',
    'course.note': 'one-to-one session',
    'course.cta': 'Book the course',

    'book.eyebrow': 'Online booking',
    'book.title': 'Choose your <em>time</em>',
    'book.s1': 'Service', 'book.s2': 'Date', 'book.s3': 'Time', 'book.s4': 'Your details',
    'book.group.services': 'Services', 'book.group.course': 'Course',
    'book.choose': 'Select a service',
    'book.today': 'Today', 'book.tomorrow': 'Tomorrow',
    'book.prev': 'Previous', 'book.next': 'Next',
    'book.legend.free': 'plenty of slots', 'book.legend.mid': 'few left', 'book.legend.none': 'almost full',
    'book.free': 'Available: ', 'book.full': 'Fully booked', 'book.busy': 'Booked',
    'form.name': 'Name', 'form.name.ph': 'How should we call you',
    'form.contact': 'Phone or Telegram username', 'form.contact.ph': '+995 … or @username',
    'form.comment': 'Comment', 'form.comment.ph': 'Wishes, event date, references (optional)',
    'form.submit': 'Confirm booking', 'form.sending': 'Sending…',
    'err.service': 'Please choose a service or course.', 'err.date': 'Please choose a date.', 'err.time': 'Please choose a time.',
    'err.name': 'Please enter your name.', 'err.contact': 'Please enter a phone number or Telegram username.',
    'err.busy': 'This time is already booked, please choose another.', 'err.send': 'Could not send the request: ',
    'err.retry': '. Please try again.',
    'tk.title': 'Your booking', 'tk.service': 'Service', 'tk.date': 'Date', 'tk.time': 'Time', 'tk.dur': 'Duration', 'tk.total': 'Total',
    'tk.note': 'Your request goes to the artist in Telegram. The time is blocked for other clients right away.',

    'contacts.eyebrow': 'Contact',
    'contacts.title': 'See you <em>in Batumi</em>',
    'contacts.hours': 'Daily, by appointment · 04:00–21:00',
    'contacts.map': 'Open in Google Maps ↗',

    'modal.title': 'You are booked!', 'modal.greet': ', see you soon!', 'modal.at': ' at ', 'modal.ok': 'Great',
    'modal.demo': 'Demo mode: the request was not sent to Telegram. Add your token in js/config.js.',
    'footer.top': 'Back to top ↑',
    'social.master': 'Artist on Instagram', 'social.salon': 'Studio on Instagram', 'social.title': 'Follow us on Instagram',
    'nav.skip': 'Skip to content',
    'book.nearest': 'Next available', 'book.tz': 'Batumi time (GMT+4)',
    'book.morning': 'Morning', 'book.day': 'Daytime', 'book.evening': 'Evening', 'book.nofit': 'Not enough time before closing',
    'book.hours': 'h', 'book.nonefound': 'No free time found within the next year.',
    'sum.cta': 'Continue', 'sum.empty': 'Select a service',
    'modal.ics': 'Add to calendar', 'modal.range': 'Time: ',
    'err.net': 'Could not reach Telegram. Check your connection and try again.',
    'alt.hero': 'Profile of a woman under a light veil',
    'alt.w1': 'Bride in a lace robe while the artist applies lip gloss',
    'alt.p2': 'Makeup artist applying eyeshadow with a brush, nude makeup',
    'alt.w2': 'Bride with an updo while the artist applies blush',
    'alt.p5': 'Close-up of golden eyeshadow and lashes',
    'alt.w3': 'Nude makeup and hairstyle in warm light',
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  }
};

const I18n = (function () {
  const KEY = 'beautyLang';
  let lang = 'ru';
  try { const s = localStorage.getItem(KEY); if (s === 'ru' || s === 'en') lang = s; } catch (e) { /* ignore */ }

  // Перевод по ключу (строка или массив)
  function t(key) {
    const d = I18N[lang] || I18N.ru;
    return d[key] !== undefined ? d[key] : (I18N.ru[key] !== undefined ? I18N.ru[key] : key);
  }
  // Выбор нужного языка из объекта { ru, en }
  function pick(obj) {
    if (obj == null) return '';
    if (typeof obj === 'string') return obj;
    return obj[lang] || obj.ru || '';
  }

  function applyStatic() {
    document.documentElement.lang = lang;
    document.title = t('meta.title');
    const md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute('content', t('meta.desc'));
    document.querySelectorAll('[data-i18n]').forEach(function (e) { e.textContent = t(e.getAttribute('data-i18n')); });
    document.querySelectorAll('[data-i18n-html]').forEach(function (e) { e.innerHTML = t(e.getAttribute('data-i18n-html')); });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (e) { e.setAttribute('placeholder', t(e.getAttribute('data-i18n-ph'))); });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (e) { e.setAttribute('aria-label', t(e.getAttribute('data-i18n-aria'))); });
    document.querySelectorAll('[data-i18n-title]').forEach(function (e) { e.setAttribute('title', t(e.getAttribute('data-i18n-title'))); });
    document.querySelectorAll('[data-i18n-alt]').forEach(function (e) { e.setAttribute('alt', t(e.getAttribute('data-i18n-alt'))); });
    // Фраза-дубль на другом языке получает правильный lang (для скринридеров)
    document.querySelectorAll('[data-lang-alt]').forEach(function (e) { e.setAttribute('lang', lang === 'ru' ? 'en' : 'ru'); });
    document.querySelectorAll('[data-lang]').forEach(function (b) {
      const on = b.getAttribute('data-lang') === lang;
      b.setAttribute('aria-pressed', String(on));
      b.classList.toggle('on', on);
    });
  }

  function setLang(l) {
    if (l !== 'ru' && l !== 'en') return;
    lang = l;
    try { localStorage.setItem(KEY, l); } catch (e) { /* ignore */ }
    const run = function () {
      applyStatic();
      document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: l } }));
    };
    // Мягкий кросс-фейд текста (View Transitions API), без него — мгновенно
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (document.startViewTransition && !reduce) document.startViewTransition(run); else run();
  }

  function init() {
    applyStatic();
    document.querySelectorAll('[data-lang]').forEach(function (b) {
      b.addEventListener('click', function () { setLang(b.getAttribute('data-lang')); });
    });
  }

  return { t: t, pick: pick, setLang: setLang, init: init, get lang() { return lang; } };
})();
