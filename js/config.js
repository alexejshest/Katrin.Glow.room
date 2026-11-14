/* ============================================================
   КОНФИГУРАЦИЯ САЙТА
   Все данные заказчика редактируются в этом файле.
   Тексты услуг двуязычные: { ru: '...', en: '...' }.
   ============================================================ */

const TELEGRAM_CONFIG = {
  // Токен бота. Получить: написать @BotFather в Telegram → /newbot.
  // Пока стоит заглушка 'YOUR_BOT_TOKEN_HERE' — сайт работает в ДЕМО-РЕЖИМЕ
  // (заявки не отправляются, а имитируются).
  BOT_TOKEN: 'YOUR_BOT_TOKEN_HERE',

  // ID чата, куда придут заявки. Узнать: написать боту любое сообщение,
  // затем открыть https://api.telegram.org/bot<ТОКЕН>/getUpdates
  // и найти "chat":{"id": ...}. Для групп ID начинается с минуса.
  CHAT_ID: 'YOUR_CHAT_ID_HERE',

  // Адрес салона (контакты на сайте и сообщение в Telegram).
  // Адрес определён по координатам из ссылки (OpenStreetMap) — проверьте с заказчиком.
  SALON_ADDRESS: { ru: 'Батуми, ул. 26 Мая, 52 (ЖК Geverse Batumi, блок B)', en: 'Batumi, 26 May St. 52 (Geverse Batumi, Block B)' },

  // Точные координаты салона (используются в тексте заявки).
  SALON_LAT: 41.6450333,
  SALON_LNG: 41.6337767,

  // Ссылка на Google Maps.
  MAPS_LINK: 'https://www.google.com/maps/search/?api=1&query=41.6450333,41.6337767'
};

// Instagram (ссылки без служебных параметров отслеживания)
const SOCIAL_CONFIG = {
  INSTAGRAM_MASTER: 'https://www.instagram.com/ketrin_toftul_makeup/',   // мастер по макияжу
  INSTAGRAM_SALON:  'https://www.instagram.com/ketrin.glow.room/'        // студия
};

// Название студии и валюта (цены в лари, пишем «GEL»)
const SITE_CONFIG = {
  BRAND: 'Katrin Glow Room',
  CURRENCY: 'GEL',
  // Онлайн-запись включена? Пока false — на сайте плашка «запись скоро откроется»
  // с ссылками на Instagram, кнопка подтверждения отключена, заявки не принимаются.
  // Поставьте true, когда будет подключён Telegram-бот (или серверный посредник).
  BOOKING_ENABLED: false
};

// Часы работы таймлайна (шаг 1 час: 04:00, 05:00, … 20:00) и глубина календаря
const SLOT_CONFIG = {
  START_HOUR: 4,
  END_HOUR: 20,          // последний слот НАЧАЛА записи — 20:00
  DAYS_AHEAD: 365,
  // Студия работает по времени Батуми (GMT+4, без перехода на летнее время).
  // «Сегодня» и прошедшие часы считаются по этому поясу, а не по часам клиента.
  TIMEZONE: 'Asia/Tbilisi',
  CLOSE_HOUR: 21         // услуга должна закончиться не позже 21:00
};

// Услуги. minutes — длительность: столько часов подряд блокируется в календаре
// (округляется вверх до целого часа). featured: true — крупная карточка с фото.
// img — имя фото из папки img/ (без .jpg), см. data-img в css.
const SERVICES = [
  {
    id: 'bridal', type: 'service', featured: true, img: 'w1', price: 250, minutes: 180,
    name: { ru: 'Свадебный макияж', en: 'Bridal Makeup' },
    desc: { ru: 'Образ невесты с репетицией. Стойкий и фотогеничный на весь день.', en: 'Bridal look with a trial session. Long-lasting and photogenic all day.' },
    duration: { ru: '3 ч', en: '3 h' }
  },
  {
    id: 'evening', type: 'service', featured: true, img: 'p5', price: 200, minutes: 90,
    name: { ru: 'Вечерний макияж', en: 'Evening Makeup' },
    desc: { ru: 'Выразительные глаза, стойкий тон, сияние под вечерний свет.', en: 'Expressive eyes, a long-wear base and a glow made for evening light.' },
    duration: { ru: '1,5 ч', en: '1.5 h' }
  },
  {
    id: 'fourhands', type: 'service', featured: true, img: 'w2', price: 500, minutes: 180,
    name: { ru: 'Образ в 4 руки', en: '4-Hands Full Look' },
    desc: { ru: 'Макияж и причёска одновременно: визажист и стилист работают вместе.', en: 'Makeup and hair together: a makeup artist and a stylist work side by side.' },
    duration: { ru: '3 ч', en: '3 h' }
  }
];

// Обучение «Макияж для себя» — один курс, одна цена
const COURSES = [
  {
    id: 'course', type: 'course', price: 250, minutes: 120,
    name: { ru: 'Макияж для себя', en: 'Makeup for Yourself' },
    desc: { ru: 'Подбор косметики под ваш тип внешности, дневной макияж за 15 минут и превращение его в вечерний.', en: 'Choosing products for your features, a 15-minute daytime look and turning it into an evening one.' },
    duration: { ru: '2 ч', en: '2 h' }
  }
];
