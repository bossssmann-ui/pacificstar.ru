/**
 * Pacific Star — Pure SVG Route Map  (v7 — realistic sea-route waypoints)
 * ======================================================================================
 * Self-contained inline SVG map — no external libraries, no tile requests.
 * Uses Mercator projection + bundled GeoJSON land polygons (map-geodata.js).
 * Three design themes: Navy (морская), Sapphire (сапфир), Amber (янтарь).
 * Animated directional flow routes: Новороссийск → India → China → Russia → cities.
 *
 * Sea route waypoints are chosen so that every bezier arc segment stays in open water.
 * Intermediate {lat, lon} guide points are placed to steer arcs around coastlines and
 * through the correct straits (Bosphorus, Malacca, Korea Strait, etc.).
 *
 * Requires: window.WORLD_GEOJSON (set by js/map-geodata.js)
 */
(function () {
  'use strict';

  /* ---- Projection constants ---- */
  var SVG_W   = 1200;
  var SVG_H   = 680;
  var LON_MIN = 18;
  var LON_MAX = 200;
  var LAT_MIN = 0;
  var LAT_MAX = 78;

  var I18N = {
    ru: {
      ariaLabel:    'Карта логистических маршрутов Pacific Star',
      loadingNotice:'Карта маршрутов временно загружается. Если она не появилась, обновите страницу через несколько секунд.',
      legendSea:    'Морские маршруты',
      legendLand:   'Сухопутные маршруты'
    },
    en: {
      ariaLabel:    'Pacific Star logistics routes map',
      loadingNotice:'The route map is loading. If it does not appear, refresh the page in a few seconds.',
      legendSea:    'Sea routes',
      legendLand:   'Land routes'
    },
    zh: {
      ariaLabel:    'Pacific Star 物流路线地图',
      loadingNotice:'路线地图正在加载中。如果暂时未显示，请几秒后刷新页面。',
      legendSea:    '海运航线',
      legendLand:   '陆路航线'
    },
    ja: {
      ariaLabel:    'Pacific Star 物流ルートマップ',
      loadingNotice:'ルートマップを読み込み中です。表示されない場合は数秒後にページを更新してください。',
      legendSea:    '海上ルート',
      legendLand:   '陸上ルート'
    },
    ko: {
      ariaLabel:    'Pacific Star 물류 노선 지도',
      loadingNotice:'노선 지도를 불러오는 중입니다. 바로 보이지 않으면 몇 초 후 페이지를 새로고침해 주세요.',
      legendSea:    '해상 노선',
      legendLand:   '육상 노선'
    }
  };

  function getText(key) {
    var lang = 'ru';
    try {
      lang = window.localStorage && window.localStorage.getItem('ps-lang') || document.documentElement.lang || 'ru';
    } catch (err) {
      lang = document.documentElement.lang || 'ru';
    }
    var dict = I18N[lang] || I18N.ru;
    return dict[key] || I18N.ru[key];
  }

  /* ---- Mercator projection ---- */
  function mercY(lat) {
    var r = lat * Math.PI / 180;
    return Math.log(Math.tan(Math.PI / 4 + r / 2));
  }

  var MERC_TOP = mercY(LAT_MAX);
  var MERC_BOT = mercY(LAT_MIN);

  function lonToX(lon) {
    if (lon < 0) { lon += 360; }
    return (lon - LON_MIN) / (LON_MAX - LON_MIN) * SVG_W;
  }

  function latToY(lat) {
    return (MERC_TOP - mercY(lat)) / (MERC_TOP - MERC_BOT) * SVG_H;
  }

  /* ---- Design themes ---- */
  var THEMES = {
    navy: {
      id: 'navy',
      ocean: '#0d1b3e',
      land:  '#17345f', landOpacity: '0.82',
      russia: '#5d96c3', russiaOpacity: '0.92',
      border: 'rgba(255,255,255,0.22)', borderRussia: '#9fd5ff',
      routeSea:  '#d4af37', routeLand: 'rgba(220,235,255,0.60)',
      dotHub: '#ffffff', dotCity: '#d4af37',
      pulseHub: '#ffffff', pulseCity: '#d4af37',
      label: '#d4eeff', labelHub: '#ffffff'
    },
    sapphire: {
      id: 'sapphire',
      ocean: '#050e1f',
      land:  '#0c1e38', landOpacity: '0.85',
      russia: '#1a4478', russiaOpacity: '0.92',
      border: 'rgba(0,180,255,0.18)', borderRussia: '#4dc8ff',
      routeSea:  '#00d4ff', routeLand: 'rgba(120,240,192,0.70)',
      dotHub: '#ffffff', dotCity: '#00d4ff',
      pulseHub: '#ffffff', pulseCity: '#00d4ff',
      label: '#b8f0ff', labelHub: '#ffffff'
    },
    amber: {
      id: 'amber',
      ocean: '#090e1c',
      land:  '#121f33', landOpacity: '0.88',
      russia: '#1e3e6a', russiaOpacity: '0.92',
      border: 'rgba(255,200,50,0.15)', borderRussia: '#ffd060',
      routeSea:  '#ff9500', routeLand: 'rgba(255,215,0,0.65)',
      dotHub: '#ff4500', dotCity: '#ff9500',
      pulseHub: '#ff4500', pulseCity: '#ff9500',
      label: '#fff0c0', labelHub: '#ffffff'
    }
  };

  /* Active theme — default navy; can be changed by theme picker. */
  var currentThemeId = 'navy';
  try {
    var saved = window.localStorage && window.localStorage.getItem('ps-map-theme');
    if (saved && THEMES[saved]) { currentThemeId = saved; }
  } catch (e) { /* ignore */ }

  /* ---- City / point data ---- */
  /* lx/ly: label offset from dot centre (px in SVG space).
     Positive lx → label to the right (text-anchor: start);
     Negative lx → label to the left  (text-anchor: end).
     Negative ly → label above the dot; Positive ly → below. */
  var POINTS = [
    /* ──── Hub ──── */
    { name: 'Владивосток',      lat: 43.1155, lon: 131.8855, hub: true,  type: 'sea',
      desc: 'Главный транспортный хаб',              lx:  14, ly: -13 },

    /* ──── Russian Far East — sea / arctic ──── */
    { name: 'Сахалин',          lat: 50.9,    lon: 142.7,    hub: false, type: 'sea',
      desc: 'Морские грузоперевозки',                lx:  11, ly:  -8 },
    { name: 'Магадан',          lat: 59.5635, lon: 150.8135, hub: false, type: 'sea',
      desc: 'Северный завоз',                        lx:  11, ly:  -8 },
    { name: 'Петропавловск-Камчатский', lat: 53.0121, lon: 158.6561, hub: false, type: 'sea',
      desc: 'Морские перевозки (Камчатка)',          lx:  11, ly:  -8 },
    { name: 'Анадырь',          lat: 64.7338, lon: 177.5215, hub: false, type: 'sea',
      desc: 'Арктические поставки (Чукотка)',        lx: -11, ly:  -8 },
    { name: 'Певек',            lat: 69.7027, lon: 170.2738, hub: false, type: 'sea',
      desc: 'Ключевой порт Северного морского пути', lx: -11, ly:  -8 },
    { name: 'Эгвекинот',        lat: 66.3213, lon: -179.176, hub: false, type: 'sea',
      desc: 'Северный завоз (Чукотка)',              lx: -11, ly:   9 },
    { name: 'Якутск',           lat: 62.0355, lon: 129.7320, hub: false, type: 'land',
      desc: 'Северный завоз в Якутию',               lx:  11, ly:  -8 },

    /* ──── Russian Far East — land / rail ──── */
    { name: 'Хабаровск',        lat: 48.4827, lon: 135.0838, hub: false, type: 'land',
      desc: 'Транссибирская магистраль',             lx: -11, ly: -10 },
    { name: 'Благовещенск',     lat: 50.2824, lon: 127.5355, hub: false, type: 'land',
      desc: 'Трансграничная логистика (Китай)',      lx: -11, ly: -10 },
    { name: 'Забайкальск',      lat: 49.6527, lon: 117.3273, hub: false, type: 'land',
      desc: 'Пограничный переход (Китай)',           lx:  11, ly:  13 },
    { name: 'Чита',             lat: 52.0316, lon: 113.4994, hub: false, type: 'land',
      desc: 'Транзит Восток–Запад',                  lx: -11, ly: -10 },
    { name: 'Иркутск',          lat: 52.2978, lon: 104.2965, hub: false, type: 'land',
      desc: 'Транзитный узел Сибири',                lx: -11, ly:  -8 },

    /* ──── Russia — million-plus cities (land / rail) ──── */
    { name: 'Красноярск',       lat: 56.0153, lon:  92.8932, hub: false, type: 'land',
      desc: 'Крупный сибирский центр',               lx:  11, ly:  -8 },
    { name: 'Новосибирск',      lat: 54.9885, lon:  82.9357, hub: false, type: 'land',
      desc: 'Транзитный узел',                       lx:  11, ly:   9 },
    { name: 'Омск',             lat: 54.9885, lon:  73.3686, hub: false, type: 'land',
      desc: 'Западносибирский узел',                 lx: -11, ly:  -8 },
    { name: 'Екатеринбург',     lat: 56.8389, lon:  60.6057, hub: false, type: 'land',
      desc: 'Уральский хаб',                         lx:  11, ly:  -8 },
    { name: 'Челябинск',        lat: 55.1644, lon:  61.4368, hub: false, type: 'land',
      desc: 'Промышленный Урал',                     lx:  11, ly:  13 },
    { name: 'Пермь',            lat: 58.0105, lon:  56.2502, hub: false, type: 'land',
      desc: 'Уральский центр',                       lx: -11, ly:  -8 },
    { name: 'Уфа',              lat: 54.7388, lon:  55.9721, hub: false, type: 'land',
      desc: 'Поволжье–Урал',                         lx: -11, ly:  13 },
    { name: 'Казань',           lat: 55.7879, lon:  49.1221, hub: false, type: 'land',
      desc: 'Поволжье',                              lx: -11, ly:  -8 },
    { name: 'Самара',           lat: 53.1959, lon:  50.1002, hub: false, type: 'land',
      desc: 'Поволжский центр',                      lx:  11, ly:  13 },
    { name: 'Нижний Новгород',  lat: 56.3269, lon:  44.0059, hub: false, type: 'land',
      desc: 'Приволжский центр',                     lx: -11, ly: -10 },
    { name: 'Волгоград',        lat: 48.7080, lon:  44.5133, hub: false, type: 'land',
      desc: 'Нижнее Поволжье',                       lx:  11, ly:  13 },
    { name: 'Воронеж',          lat: 51.6755, lon:  39.2088, hub: false, type: 'land',
      desc: 'Центральное Черноземье',                lx:  11, ly:  13 },
    { name: 'Ростов-на-Дону',   lat: 47.2357, lon:  39.7015, hub: false, type: 'land',
      desc: 'Южный хаб России',                      lx: -11, ly:  13 },
    { name: 'Москва',           lat: 55.7558, lon:  37.6173, hub: false, type: 'land',
      desc: 'Федеральная логистика',                 lx:  11, ly:  -8 },
    { name: 'Санкт-Петербург',  lat: 59.9343, lon:  30.3351, hub: false, type: 'land',
      desc: 'Балтийский порт',                       lx:  11, ly: -10 },
    { name: 'Находка',          lat: 42.8206, lon: 132.8731, hub: false, type: 'sea',
      desc: 'Порт в Приморском крае',                lx:  11, ly:  13 },
    { name: 'Мурманск',         lat: 68.9585, lon:  33.0827, hub: false, type: 'sea',
      desc: 'Арктический порт России',               lx:  11, ly:  -8 },
    { name: 'Новороссийск',     lat: 44.7233, lon:  37.7685, hub: false, type: 'sea',
      desc: 'Черноморский порт России',              lx: -12, ly: -10 },
    { name: 'Калининград',      lat: 54.7065, lon:  20.5109, hub: false, type: 'sea',
      desc: 'Балтийский порт (Калининградский эксклав)', lx: 11, ly: -8 },
    { name: 'Севастополь',      lat: 44.6166, lon:  33.5254, hub: false, type: 'sea',
      desc: 'Черноморский порт (Крым, Россия)',      lx:  11, ly:  13 },

    /* ──── China — Beijing + major sea ports ──── */
    { name: 'Пекин',            lat: 39.9042, lon: 116.4074, hub: false, type: 'land',
      desc: 'Логистический центр (Китай)',           lx: -12, ly: -10 },
    { name: 'Тяньцзинь',        lat: 39.3434, lon: 117.3616, hub: false, type: 'sea',
      desc: 'Морской порт (Китай)',                  lx:  11, ly:  13 },
    { name: 'Далянь',           lat: 38.9140, lon: 121.6147, hub: false, type: 'sea',
      desc: 'Портовый хаб (Китай)',                  lx:  11, ly:  -8 },
    { name: 'Циндао',           lat: 36.0671, lon: 120.3826, hub: false, type: 'sea',
      desc: 'Морской порт (Китай)',                  lx: -12, ly:  -8 },
    { name: 'Шанхай',           lat: 31.2304, lon: 121.4737, hub: false, type: 'sea',
      desc: 'Морские перевозки (Китай)',             lx: -12, ly:  -8 },
    { name: 'Нинбо',            lat: 29.8683, lon: 121.5440, hub: false, type: 'sea',
      desc: 'Морской порт (Китай)',                  lx:  11, ly:  13 },
    { name: 'Сямэнь',           lat: 24.4798, lon: 118.0894, hub: false, type: 'sea',
      desc: 'Морской порт (Китай)',                  lx: -12, ly:  -8 },
    { name: 'Гуанчжоу',         lat: 23.1291, lon: 113.2644, hub: false, type: 'sea',
      desc: 'Морской порт (Китай)',                  lx: -12, ly:  -8 },
    { name: 'Шэньчжэнь',        lat: 22.5431, lon: 114.0579, hub: false, type: 'sea',
      desc: 'Морской порт (Китай)',                  lx:  11, ly:  13 },

    /* ──── India — major sea ports ──── */
    { name: 'Калькутта',        lat: 22.5726, lon:  88.3639, hub: false, type: 'sea',
      desc: 'Морской порт (Индия)',                  lx:  11, ly:  -8 },
    { name: 'Мумбаи',           lat: 19.0760, lon:  72.8777, hub: false, type: 'sea',
      desc: 'Крупнейший порт (Индия)',               lx: -12, ly:  -8 },
    { name: 'Кочи',             lat:  9.9312, lon:  76.2673, hub: false, type: 'sea',
      desc: 'Морской порт (Индия)',                  lx: -12, ly:  -8 },
    { name: 'Ченнаи',           lat: 13.0827, lon:  80.2707, hub: false, type: 'sea',
      desc: 'Морской порт (Индия)',                  lx:  11, ly:  -8 },

    /* ──── International — Sea of Japan / Pacific ──── */
    { name: 'Сеул',             lat: 37.5665, lon: 126.9780, hub: false, type: 'sea',
      desc: 'Морские перевозки (Корея)',             lx: -12, ly:  17 },
    { name: 'Токио',            lat: 35.6762, lon: 139.6503, hub: false, type: 'sea',
      desc: 'Морские перевозки (Япония)',            lx:  11, ly:  17 }
  ];

  /* ---- Directional flow routes ----
     Chains of waypoints showing cargo flow direction.
     Waypoints are either a city name (matched against POINTS) or
     an anonymous {lat, lon} object used as a path guide point only.
     • label: short route title shown in hover tooltip
     • desc:  one-line description shown below the title
     To add a new route: push an entry here and in FLOW_DELAYS.
     To adjust a sea route's path, edit or insert {lat, lon} guide points. */
  var FLOW_ROUTES = [
    /* ── Route A: International sea corridor
       Waypoints are placed so every quadratic-bezier segment stays in open water.
       The arc formula lifts each segment slightly northward, so guide points are
       chosen to steer arcs through straits and around coastlines.

       Черное море → Босфор → Мраморное море → Дарданеллы → Эгейское → Средиземное
       → Суэцкий канал → Красное море → Аденский залив → Аравийское море
       → Индийские порты → Малаккский пролив → Южно-Китайское море → Китай
       → Японское море → Владивосток

       To adjust a segment: edit or insert a {lat, lon} guide point.
       Keep sea waypoints in open water; use the comments as reference. */
    {
      id: 'intl-sea',
      type: 'sea',
      label: 'Международный морской коридор',
      desc:  'Новороссийск → Индия → Китай → Владивосток',
      waypoints: [
        'Новороссийск',
        { lat: 43.0, lon: 34.0 },   /* Чёрное море — идём на запад          */
        { lat: 41.8, lon: 31.5 },   /* Зап. Чёрное море (подход к Босфору)  */
        { lat: 41.2, lon: 29.0 },   /* Вход в Босфор (со стороны Ч. моря)   */
        { lat: 40.7, lon: 26.5 },   /* Мраморное море / выход из Дарданелл  */
        { lat: 38.5, lon: 25.0 },   /* Эгейское море                        */
        { lat: 35.0, lon: 26.5 },   /* ЮВ Эгейское / В. Средиземноморье     */
        { lat: 34.2, lon: 30.5 },   /* Средиземноморье, к югу от Кипра      */
        { lat: 30.5, lon: 32.5 },   /* Суэцкий канал (порт Саид)            */
        { lat: 27.5, lon: 34.0 },   /* Красное море (середина)              */
        { lat: 12.5, lon: 43.5 },   /* Баб-эль-Мандеб / Аденский залив      */
        { lat: 12.0, lon: 52.0 },   /* Аравийское море (зап., ю. Йемена)    */
        { lat: 15.0, lon: 61.0 },   /* Аравийское море (ю. Омана)           */
        'Мумбаи',
        { lat: 13.5, lon: 74.0 },   /* Аравийское море вост. (Гоа/Керала)   */
        'Кочи',
        { lat: 7.0,  lon: 78.5 },   /* Ю. Индия / С. Шри-Ланки             */
        'Ченнаи',
        { lat: 14.5, lon: 83.0 },   /* Бенг. залив зап. (у берегов Андхры) */
        { lat: 18.0, lon: 86.5 },   /* Бенг. залив (у берегов Одиши)        */
        'Калькутта',
        { lat: 15.0, lon: 91.5 },   /* ЮВ Бенг. залива / Андаманское море   */
        { lat: 8.0,  lon: 97.5 },   /* Андаманское море (Андаманские о-ва)  */
        { lat: 4.0,  lon: 100.5 },  /* Малаккский пролив (юж. вход)         */
        { lat: 9.0,  lon: 108.0 },  /* Южно-Китайское море (запад)          */
        { lat: 16.5, lon: 112.0 },  /* Южно-Китайское море (центр)          */
        { lat: 20.5, lon: 114.5 },  /* Южно-Китайское море (сев., у Гонконга)*/
        'Гуанчжоу',
        'Шэньчжэнь',
        { lat: 21.0, lon: 118.5 },  /* Вост. от устья Жемчужной реки        */
        'Сямэнь',
        { lat: 27.5, lon: 122.5 },  /* Восточно-Китайское море (Чжэцзян)    */
        'Нинбо',
        'Шанхай',
        { lat: 33.0, lon: 122.5 },  /* Жёлтое море (юг)                     */
        { lat: 36.0, lon: 122.5 },  /* Жёлтое море (центр)                  */
        'Циндао',
        { lat: 37.5, lon: 122.0 },  /* Жёлтое море (север)                  */
        'Далянь',
        { lat: 38.5, lon: 120.5 },  /* Бохайский залив (подход)             */
        'Тяньцзинь',
        { lat: 36.5, lon: 124.0 },  /* Подход к Корейскому проливу          */
        'Сеул',
        { lat: 34.0, lon: 129.5 },  /* Корейский пролив                     */
        { lat: 33.5, lon: 135.0 },  /* Тихий океан / Внутреннее море Японии */
        'Токио',
        { lat: 39.5, lon: 142.5 },  /* Тихий океан восточнее Хонсю          */
        { lat: 42.5, lon: 139.0 },  /* Японское море / Хоккайдо             */
        'Владивосток'
      ]
    },

    /* ── Route B: Trans-Siberian Railway
       Владивосток → Хабаровск → Сибирь → Москва → Санкт-Петербург → Мурманск */
    {
      id: 'trans-sib',
      type: 'land',
      label: 'Транссибирская магистраль',
      desc:  'Владивосток → Хабаровск → Сибирь → Москва → Мурманск',
      waypoints: [
        'Владивосток', 'Хабаровск', 'Чита', 'Иркутск',
        'Красноярск', 'Новосибирск', 'Омск',
        'Екатеринбург', 'Пермь', 'Москва',
        'Санкт-Петербург', 'Мурманск'
      ]
    },

    /* ── Route C: Southern Russia corridor → closes loop back to Новороссийск */
    {
      id: 'south-ru',
      type: 'land',
      label: 'Южный транспортный коридор',
      desc:  'Владивосток → Сибирь → Москва → Новороссийск',
      waypoints: [
        'Владивосток', 'Хабаровск', 'Благовещенск', 'Чита',
        'Иркутск', 'Новосибирск', 'Уфа', 'Казань',
        'Нижний Новгород', 'Москва', 'Воронеж',
        'Волгоград', 'Ростов-на-Дону', 'Новороссийск'
      ]
    },

    /* ── Route D: Northern land branch — Хабаровск → Якутск → Магадан */
    {
      id: 'north-yakutsk',
      type: 'land',
      label: 'Северный завоз — Якутия',
      desc:  'Хабаровск → Якутск → Магадан',
      waypoints: [ 'Хабаровск', 'Якутск', 'Магадан' ]
    },

    /* ── Route E: Северный морской путь (NSR / Arctic Sea Route)
       Sea waypoints carefully placed in Arctic Ocean north of Russian coast.
       Adjust {lat, lon} guide points to fine-tune the Arctic arc.
       Key latitudes: Siberian north coast ≈ 70-73°N — stay above that. */
    {
      id: 'nsm-route',
      type: 'sea',
      label: 'Северный морской путь',
      desc:  'Мурманск → Певек → Чукотка → Владивосток',
      waypoints: [
        'Мурманск',
        { lat: 72.0, lon: 38.0 },   /* Barents Sea, open water            */
        { lat: 74.5, lon: 57.0 },   /* East of Novaya Zemlya              */
        { lat: 73.5, lon: 80.0 },   /* Kara Sea                           */
        { lat: 75.0, lon: 102.0 },  /* North of Siberian coast            */
        { lat: 74.0, lon: 126.0 },  /* Laptev Sea                         */
        { lat: 72.0, lon: 145.0 },  /* East Siberian Sea                  */
        { lat: 68.5, lon: 163.0 },  /* Approaching Chukotka               */
        'Певек',
        { lat: 66.0, lon: 177.0 },  /* Bering Sea approach                */
        'Анадырь',
        'Петропавловск-Камчатский',
        { lat: 46.0, lon: 152.0 },  /* North Pacific, south of Kuril Is.  */
        'Владивосток'
      ]
    },

    /* ── Route F: Baltic Sea — Санкт-Петербург → Калининград
       Waypoints stay in the Gulf of Finland and Baltic Sea (no land crossing).
       Adjust guide points if the arc needs fine-tuning. */
    {
      id: 'baltic-sea',
      type: 'sea',
      label: 'Балтийский морской маршрут',
      desc:  'Санкт-Петербург → Балтийское море → Калининград',
      waypoints: [
        'Санкт-Петербург',
        { lat: 60.0, lon: 27.0 },   /* Gulf of Finland, near Tallinn      */
        { lat: 59.5, lon: 24.0 },   /* Gulf of Finland exit               */
        { lat: 57.5, lon: 21.0 },   /* Open Baltic Sea                    */
        'Калининград'
      ]
    }
  ];

  /* Animation delay per route (negative = start already mid-cycle).
     To add a new route: add its id here. */
  var FLOW_DELAYS = {
    'intl-sea':       '0s',
    'trans-sib':      '-1.8s',
    'south-ru':       '-3.6s',
    'north-yakutsk':  '-0.9s',
    'nsm-route':      '-2.7s',
    'baltic-sea':     '-1.2s'
  };

  /* ---- GeoJSON → SVG path helpers ---- */
  var LON_PAD = 8;
  var LAT_PAD = 5;

  function ringToD(ring) {
    var parts = [];
    var first = true;
    for (var i = 0; i < ring.length; i++) {
      var lon = ring[i][0];
      var lat = ring[i][1];
      var normLon = lon < 0 ? lon + 360 : lon;
      if (
        lat < LAT_MIN - LAT_PAD || lat > LAT_MAX + LAT_PAD ||
        normLon < LON_MIN - LON_PAD || normLon > LON_MAX + LON_PAD
      ) {
        first = true;
        continue;
      }
      var x = lonToX(lon).toFixed(1);
      var y = latToY(lat).toFixed(1);
      parts.push(first ? ('M' + x + ' ' + y) : ('L' + x + ' ' + y));
      first = false;
    }
    return parts.length ? parts.join('') + 'Z' : '';
  }

  function featureToD(feature) {
    var g   = feature.geometry;
    var out = '';
    if (g.type === 'Polygon') {
      g.coordinates.forEach(function (ring) { out += ringToD(ring); });
    } else if (g.type === 'MultiPolygon') {
      g.coordinates.forEach(function (poly) {
        poly.forEach(function (ring) { out += ringToD(ring); });
      });
    }
    return out;
  }

  /* ---- Pan / zoom viewport state ----
     vpScale and vpTranslate are reset each time buildSVGMap() is called.
     vpGroup always points to the current <g class="svg-map-viewport"> element.
     To programmatically reset: call resetViewport(). */
  var vpScale     = 1;
  var vpTranslate = { x: 0, y: 0 };
  var vpGroup     = null;   /* current viewport <g> — set in buildSVGMap */
  var currentSVG  = null;   /* current <svg> element                     */

  /* Zoom tuning constants — adjust to change sensitivity and limits. */
  var ZOOM_FACTOR  = 1.12;  /* scale multiplier per wheel tick           */
  var ZOOM_MIN     = 0.5;   /* minimum allowed scale                     */
  var ZOOM_MAX     = 10;    /* maximum allowed scale                     */

  /* WeakSet tracks which containers already have pan/zoom listeners wired. */
  var pannedContainers = typeof WeakSet !== 'undefined' ? new WeakSet() : null;

  function applyViewportTransform() {
    if (!vpGroup) { return; }
    vpGroup.setAttribute(
      'transform',
      'translate(' + vpTranslate.x.toFixed(2) + ',' + vpTranslate.y.toFixed(2) + ')' +
      ' scale(' + vpScale.toFixed(4) + ')'
    );
  }

  function resetViewport() {
    vpScale     = 1;
    vpTranslate = { x: 0, y: 0 };
    applyViewportTransform();
  }

  /* Convert screen clientX/clientY to SVG internal coordinate space.
     Works with xMidYMid meet preserveAspectRatio (fills width). */
  function clientToSVG(clientX, clientY) {
    if (!currentSVG) { return { x: clientX, y: clientY }; }
    var rect = currentSVG.getBoundingClientRect();
    var sx   = SVG_W / rect.width;
    return {
      x: (clientX - rect.left) * sx,
      y: (clientY - rect.top)  * sx
    };
  }

  /* ---- SVG namespace helper ---- */
  var NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs) {
    var node = document.createElementNS(NS, tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        node.setAttribute(k, attrs[k]);
      });
    }
    return node;
  }

  function getMapContainer() {
    return document.getElementById('svg-map-container') || document.getElementById('leaflet-map');
  }

  function prepareContainer(container) {
    if (!container) { return; }
    container.style.position = 'relative';
    container.style.minHeight = '420px';
    container.style.overflow = 'hidden';
    if (!container.style.backgroundColor) {
      container.style.backgroundColor = '#0d1b3e';
    }
  }

  function renderFallbackNotice(container, message) {
    if (!container) { return; }
    prepareContainer(container);
    container.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:center;min-height:420px;padding:24px;' +
      'text-align:center;color:#eaf4ff;font:500 1rem/1.6 Inter,system-ui,sans-serif;background:#0d1b3e;">' +
      message +
      '</div>';
  }

  /* ---- Flow route path helpers ---- */
  function findPointByName(name) {
    for (var i = 0; i < POINTS.length; i++) {
      if (POINTS[i].name === name) { return POINTS[i]; }
    }
    return null;
  }

  function getWaypointXY(wp) {
    if (typeof wp === 'string') {
      var pt = findPointByName(wp);
      return pt ? { x: lonToX(pt.lon), y: latToY(pt.lat) } : null;
    }
    /* Anonymous {lat, lon} guide point — just coordinates, no marker */
    return { x: lonToX(wp.lon), y: latToY(wp.lat) };
  }

  function buildFlowPath(route) {
    var pts = [];
    route.waypoints.forEach(function (wp) {
      var xy = getWaypointXY(wp);
      if (xy) { pts.push(xy); }
    });
    if (pts.length < 2) { return ''; }

    var d = 'M' + pts[0].x.toFixed(1) + ' ' + pts[0].y.toFixed(1);
    for (var i = 1; i < pts.length; i++) {
      var x0 = pts[i - 1].x, y0 = pts[i - 1].y;
      var x1 = pts[i].x,     y1 = pts[i].y;
      if (route.type === 'land') {
        /* Straight segments for land / rail routes */
        d += ' L' + x1.toFixed(1) + ' ' + y1.toFixed(1);
      } else {
        /* Quadratic bezier: control point arcs slightly above the chord midpoint */
        var cpx = (x0 + x1) / 2;
        var cpy = Math.min(y0, y1) - Math.abs(x1 - x0) * 0.10;
        d += ' Q' + cpx.toFixed(1) + ' ' + cpy.toFixed(1) +
             ' ' + x1.toFixed(1)   + ' ' + y1.toFixed(1);
      }
    }
    return d;
  }

  /* ---- Build the legend (bottom-left corner of SVG) ---- */
  function buildLegend(svg, theme) {
    var items = [
      { color: theme.routeSea,  dash: '16 10', label: getText('legendSea') },
      { color: theme.routeLand, dash: '8 6',   label: getText('legendLand') }
    ];
    var lx = 20;
    var ly = SVG_H - 60;
    var LW = 186;
    var LH = items.length * 22 + 14;

    var legendG = el('g', { 'class': 'svg-map-legend', transform: 'translate(' + lx + ',' + ly + ')' });

    /* Background. */
    legendG.appendChild(el('rect', {
      x: -4, y: -14, width: LW, height: LH,
      rx: '6', ry: '6',
      fill: 'rgba(0,0,0,0.42)',
      stroke: 'rgba(255,255,255,0.10)',
      'stroke-width': '0.5'
    }));

    items.forEach(function (item, i) {
      var iy = i * 22;
      /* Sample dash line. */
      legendG.appendChild(el('line', {
        x1: '0', y1: iy.toString(), x2: '26', y2: iy.toString(),
        stroke: item.color,
        'stroke-width': '1.8',
        'stroke-dasharray': item.dash,
        'stroke-opacity': '0.9'
      }));
      /* Label text. */
      var txt = el('text', {
        x: '32', y: (iy + 4).toString(),
        fill: 'rgba(255,255,255,0.78)',
        'font-size': '9.5',
        'font-family': 'Inter, system-ui, sans-serif',
        'font-weight': '400'
      });
      txt.textContent = item.label;
      legendG.appendChild(txt);
    });

    svg.appendChild(legendG);
  }

  /* ---- Build and insert SVG map ---- */
  function buildSVGMap(container, geoJson, themeId) {
    if (!container || !geoJson) { return; }
    prepareContainer(container);
    var theme = THEMES[themeId] || THEMES.navy;
    /* Update background colour immediately so there is no flash. */
    container.style.backgroundColor = theme.ocean;

    try {
      var svg = el('svg', {
        viewBox: '0 0 ' + SVG_W + ' ' + SVG_H,
        preserveAspectRatio: 'xMidYMid meet',
        'class': 'svg-route-map',
        role:    'img',
        'aria-label': getText('ariaLabel')
      });

      /* Store reference for coordinate conversion in pan/zoom handlers. */
      currentSVG = svg;

      /* Ocean background — drawn directly on SVG so it always fills the frame. */
      svg.appendChild(el('rect', {
        width: SVG_W, height: SVG_H,
        fill: theme.ocean
      }));

      /* ---- Viewport group — receives pan/zoom transform ---- */
      vpGroup = el('g', { 'class': 'svg-map-viewport' });
      /* Reset transform for new build (theme change keeps previous pan/zoom). */
      resetViewport();

      /* ---- Land layer ---- */
      var landG = el('g', { 'class': 'svg-map-land' });
      geoJson.features.forEach(function (feature) {
        var name     = feature.properties ? feature.properties.name : '';
        /* Russia GeoJSON polygon already includes Crimea — no extra handling needed.
           To adjust country colouring, change the isRussia condition here. */
        var isRussia = (name === 'Russia');
        var d        = featureToD(feature);
        if (!d) { return; }
        landG.appendChild(el('path', {
          d: d,
          style: 'fill:' + (isRussia ? theme.russia : theme.land) +
                 ';fill-opacity:' + (isRussia ? theme.russiaOpacity : theme.landOpacity) +
                 ';stroke:' + (isRussia ? theme.borderRussia : theme.border) +
                 ';stroke-width:' + (isRussia ? '0.9' : '0.6') +
                 ';stroke-linejoin:round',
          'class': 'svg-map-country' + (isRussia ? ' svg-map-country--russia' : '')
        }));
      });
      vpGroup.appendChild(landG);

      /* ---- Flow routes ---- */
      var routesG = el('g', { 'class': 'svg-map-routes' });

      FLOW_ROUTES.forEach(function (route) {
        var d = buildFlowPath(route);
        if (!d) { return; }
        var routeColor = (route.type === 'land') ? theme.routeLand : theme.routeSea;
        var strokeW    = (route.type === 'land') ? '1.5' : '2.2';
        var opacity    = (route.type === 'land') ? '0.75' : '0.90';

        /* Animated visible route line. */
        var pathEl = el('path', {
          d: d,
          style: 'fill:none;stroke:' + routeColor +
                 ';stroke-width:' + strokeW +
                 ';stroke-opacity:' + opacity +
                 ';stroke-linecap:round;stroke-linejoin:round',
          'class': 'svg-map-route svg-map-route--' + route.type,
          'data-route-id': route.id
        });
        if (FLOW_DELAYS[route.id]) {
          pathEl.style.animationDelay = FLOW_DELAYS[route.id];
        }
        routesG.appendChild(pathEl);

        /* Invisible wide hit area for easy mouse/touch hover.
           Increase stroke-width to widen the interactive zone.
           pointer-events:stroke means only the stroke area triggers events. */
        var hitEl = el('path', {
          d: d,
          style: 'fill:none;stroke:transparent;stroke-width:14;stroke-linecap:round;stroke-linejoin:round',
          'class': 'svg-map-route-hit',
          'data-route-id':    route.id,
          'data-route-label': route.label || '',
          'data-route-desc':  route.desc  || '',
          'data-route-type':  route.type
        });
        routesG.appendChild(hitEl);
      });

      vpGroup.appendChild(routesG);

      /* ---- City markers + labels ---- */
      var markersG = el('g', { 'class': 'svg-map-markers' });
      POINTS.forEach(function (pt) {
        var cx = lonToX(pt.lon).toFixed(1);
        var cy = latToY(pt.lat).toFixed(1);
        var g  = el('g', {
          'class':      'svg-map-marker' + (pt.hub ? ' svg-map-marker--hub' : ''),
          tabindex:     '0',
          role:         'button',
          'aria-label': pt.name + ' — ' + pt.desc
        });
        g.dataset.name = pt.name;
        g.dataset.desc = pt.desc;

        /* Pulse ring. */
        g.appendChild(el('circle', {
          cx: cx, cy: cy,
          r:  pt.hub ? '10' : '7',
          style: 'fill:none;stroke:' + (pt.hub ? theme.pulseHub : theme.pulseCity) + ';stroke-width:1.5',
          'class': 'svg-map-pulse'
        }));
        /* Solid dot. */
        g.appendChild(el('circle', {
          cx: cx, cy: cy,
          r:  pt.hub ? '5' : '3.5',
          style: 'fill:' + (pt.hub ? theme.dotHub : theme.dotCity),
          'class': 'svg-map-dot'
        }));

        /* City name label. */
        var lx = typeof pt.lx === 'number' ? pt.lx : 11;
        var ly = typeof pt.ly === 'number' ? pt.ly : -8;
        var labelEl = el('text', {
          x:             cx,
          y:             cy,
          dx:            lx.toString(),
          dy:            ly.toString(),
          style:         'fill:' + (pt.hub ? theme.labelHub : theme.label) +
                         ';font-size:' + (pt.hub ? '11' : '9.5') + 'px' +
                         ';font-weight:' + (pt.hub ? '700' : '500') +
                         ';font-family:Inter,system-ui,sans-serif',
          'text-anchor': lx < 0 ? 'end' : 'start',
          'class':       'svg-map-label' + (pt.hub ? ' svg-map-label--hub' : ''),
          'pointer-events': 'none'
        });
        labelEl.textContent = pt.name;
        g.appendChild(labelEl);

        markersG.appendChild(g);
      });
      vpGroup.appendChild(markersG);

      svg.appendChild(vpGroup);

      /* ---- Legend (outside vpGroup so it stays fixed on screen) ---- */
      buildLegend(svg, theme);

      /* ---- Insert into DOM ---- */
      container.innerHTML = '';
      container.appendChild(svg);

      /* ---- Tooltip ---- */
      var TOOLTIP_WIDTH = 220;
      var tooltip = document.createElement('div');
      tooltip.className = 'svg-map-tooltip';
      container.appendChild(tooltip);

      function getEventCoords(e) {
        var touch = e.touches && e.touches[0];
        return { x: touch ? touch.clientX : (e.clientX || 0),
                 y: touch ? touch.clientY : (e.clientY || 0) };
      }

      function positionTooltip(clientX, clientY) {
        var rect = container.getBoundingClientRect();
        var tx   = clientX - rect.left + 14;
        if (tx + TOOLTIP_WIDTH > rect.width) { tx = clientX - rect.left - TOOLTIP_WIDTH - 4; }
        tooltip.style.left = tx + 'px';
        tooltip.style.top  = (clientY - rect.top - 10) + 'px';
      }

      function showTooltip(markerEl, clientX, clientY) {
        tooltip.innerHTML =
          '<strong class="svg-map-tt-title">' + markerEl.dataset.name + '</strong>' +
          '<span class="svg-map-tt-desc">'    + markerEl.dataset.desc  + '</span>';
        tooltip.style.display = 'flex';
        positionTooltip(clientX, clientY);
      }

      function showRouteTooltip(hitEl, clientX, clientY) {
        tooltip.innerHTML =
          '<strong class="svg-map-tt-title">' + (hitEl.dataset.routeLabel || '') + '</strong>' +
          '<span class="svg-map-tt-desc">'    + (hitEl.dataset.routeDesc  || '') + '</span>';
        tooltip.style.display = 'flex';
        positionTooltip(clientX, clientY);
      }

      function hideTooltip() {
        tooltip.style.display = 'none';
      }

      var tooltipTicking = false;
      var pendingEl = null, pendingX = 0, pendingY = 0, pendingIsRoute = false;

      function scheduleTooltip(domEl, clientX, clientY, isRoute) {
        pendingEl      = domEl;
        pendingX       = clientX;
        pendingY       = clientY;
        pendingIsRoute = isRoute;
        if (!tooltipTicking) {
          tooltipTicking = true;
          requestAnimationFrame(function () {
            if (pendingIsRoute) { showRouteTooltip(pendingEl, pendingX, pendingY); }
            else                { showTooltip(pendingEl, pendingX, pendingY); }
            tooltipTicking = false;
          });
        }
      }

      /* City marker hover / focus / click. */
      markersG.querySelectorAll('.svg-map-marker').forEach(function (g) {
        g.addEventListener('mouseenter', function (e) { showTooltip(g, e.clientX, e.clientY); });
        g.addEventListener('mousemove',  function (e) { scheduleTooltip(g, e.clientX, e.clientY, false); });
        g.addEventListener('mouseleave', hideTooltip);
        g.addEventListener('focus', function () {
          var dot     = g.querySelector('.svg-map-dot');
          var svgRect = svg.getBoundingClientRect();
          var scale   = svgRect.width / SVG_W;
          /* Convert SVG dot coords → screen viewport coords, accounting for pan/zoom. */
          var dotCX = parseFloat(dot.getAttribute('cx')) * vpScale + vpTranslate.x;
          var dotCY = parseFloat(dot.getAttribute('cy')) * vpScale + vpTranslate.y;
          var cxPx  = dotCX * scale + svgRect.left;
          var cyPx  = dotCY * scale + svgRect.top;
          showTooltip(g, cxPx, cyPx);
        });
        g.addEventListener('blur', hideTooltip);
        g.addEventListener('click', function (e) {
          if (tooltip.style.display === 'flex') {
            hideTooltip();
          } else {
            var coords = getEventCoords(e);
            showTooltip(g, coords.x, coords.y);
          }
        });
      });

      /* Route hit-area hover. */
      routesG.querySelectorAll('.svg-map-route-hit').forEach(function (hitEl) {
        hitEl.addEventListener('mouseenter', function (e) {
          /* Highlight the matching visible route line by data-route-id. */
          var routeId = hitEl.dataset.routeId;
          routesG.querySelectorAll('.svg-map-route[data-route-id="' + routeId + '"]').forEach(function (p) {
            p.style.strokeOpacity = '1';
            p.style.strokeWidth   = (hitEl.dataset.routeType === 'land') ? '2.5' : '3.2';
          });
          showRouteTooltip(hitEl, e.clientX, e.clientY);
        });
        hitEl.addEventListener('mousemove', function (e) {
          scheduleTooltip(hitEl, e.clientX, e.clientY, true);
        });
        hitEl.addEventListener('mouseleave', function () {
          /* Restore original stroke. */
          routesG.querySelectorAll('.svg-map-route').forEach(function (p) {
            p.style.strokeOpacity = '';
            p.style.strokeWidth   = '';
          });
          hideTooltip();
        });
      });

      /* ---- Pan / Zoom / Touch ---- */

      /* Mouse drag. */
      var isDragging  = false;
      var dragStart   = { x: 0, y: 0 };
      var vpStartSnap = { x: 0, y: 0 };
      var hasDragged  = false;

      svg.addEventListener('mousedown', function (e) {
        if (e.button !== 0) { return; }
        isDragging  = true;
        hasDragged  = false;
        dragStart   = clientToSVG(e.clientX, e.clientY);
        vpStartSnap = { x: vpTranslate.x, y: vpTranslate.y };
        svg.style.cursor = 'grabbing';
        e.preventDefault();
      });

      /* Attach mousemove/mouseup to window so drag continues outside SVG. */
      var isAlreadyWired = pannedContainers ? pannedContainers.has(container) : container._psMapPanZoomWired;
      if (!isAlreadyWired) {
        if (pannedContainers) { pannedContainers.add(container); }
        else { container._psMapPanZoomWired = true; }

        window.addEventListener('mousemove', function (e) {
          if (!isDragging) { return; }
          var cur  = clientToSVG(e.clientX, e.clientY);
          var dist = Math.abs(cur.x - dragStart.x) + Math.abs(cur.y - dragStart.y);
          if (dist > 2) { hasDragged = true; }
          vpTranslate.x = vpStartSnap.x + (cur.x - dragStart.x);
          vpTranslate.y = vpStartSnap.y + (cur.y - dragStart.y);
          applyViewportTransform();
        });

        window.addEventListener('mouseup', function () {
          if (!isDragging) { return; }
          isDragging = false;
          if (currentSVG) { currentSVG.style.cursor = 'grab'; }
        });

        /* Wheel zoom — zooms toward cursor position. */
        container.addEventListener('wheel', function (e) {
          e.preventDefault();
          if (!currentSVG) { return; }
          var factor   = e.deltaY < 0 ? ZOOM_FACTOR : (1 / ZOOM_FACTOR);
          var newScale = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, vpScale * factor));
          var svgCoord = clientToSVG(e.clientX, e.clientY);
          vpTranslate.x = svgCoord.x - (svgCoord.x - vpTranslate.x) * (newScale / vpScale);
          vpTranslate.y = svgCoord.y - (svgCoord.y - vpTranslate.y) * (newScale / vpScale);
          vpScale       = newScale;
          applyViewportTransform();
        }, { passive: false });

        /* Touch: drag (1 finger) and pinch-zoom (2 fingers). */
        var lastTouches = [];

        container.addEventListener('touchstart', function (e) {
          lastTouches = Array.prototype.slice.call(e.touches).map(function (t) {
            return { id: t.identifier, x: t.clientX, y: t.clientY };
          });
        }, { passive: true });

        container.addEventListener('touchmove', function (e) {
          e.preventDefault();
          var touches = Array.prototype.slice.call(e.touches);

          if (touches.length === 1 && lastTouches.length >= 1) {
            /* Single-finger drag. */
            var cur  = clientToSVG(touches[0].clientX, touches[0].clientY);
            var prev = clientToSVG(lastTouches[0].x, lastTouches[0].y);
            vpTranslate.x += cur.x - prev.x;
            vpTranslate.y += cur.y - prev.y;
            applyViewportTransform();

          } else if (touches.length === 2 && lastTouches.length >= 2) {
            /* Pinch-to-zoom. */
            var t0 = touches[0], t1 = touches[1];
            var p0 = lastTouches[0], p1 = lastTouches[1];
            var curDist  = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
            var prevDist = Math.hypot(p0.x - p1.x, p0.y - p1.y);
            if (prevDist > 0) {
              var factor   = curDist / prevDist;
              var newScale = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, vpScale * factor));
              var cx       = clientToSVG((t0.clientX + t1.clientX) / 2, (t0.clientY + t1.clientY) / 2);
              vpTranslate.x = cx.x - (cx.x - vpTranslate.x) * (newScale / vpScale);
              vpTranslate.y = cx.y - (cx.y - vpTranslate.y) * (newScale / vpScale);
              vpScale       = newScale;
              applyViewportTransform();
            }
          }

          lastTouches = touches.map(function (t) {
            return { id: t.identifier, x: t.clientX, y: t.clientY };
          });
        }, { passive: false });

        /* Double-click / double-tap to reset pan+zoom. */
        svg.addEventListener('dblclick', function () {
          resetViewport();
        });
      }

    } catch (err) {
      console.warn('[map-svg.js] Map build failed: ' + (err && err.message ? err.message : err));
    }
  }

  /* ---- GeoJSON loader ---- */
  function loadGeoJson(onSuccess, onError) {
    if (window.WORLD_GEOJSON && window.WORLD_GEOJSON.features) {
      onSuccess(window.WORLD_GEOJSON);
      return;
    }
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'data/world-countries.geo.json', true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) { return; }
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          var parsed = JSON.parse(xhr.responseText);
          window.WORLD_GEOJSON = parsed;
          onSuccess(parsed);
        } catch (err) {
          onError(err);
        }
        return;
      }
      onError(new Error('GeoJSON request failed with status ' + xhr.status));
    };
    xhr.onerror = function () { onError(new Error('GeoJSON request failed')); };
    xhr.send();
  }

  /* ---- Theme picker wiring ---- */
  function initThemePicker() {
    var picker = document.getElementById('map-theme-picker');
    if (!picker) { return; }

    /* Set initial active state on the saved/default theme button. */
    var btns = picker.querySelectorAll('[data-theme]');
    btns.forEach(function (btn) {
      if (btn.getAttribute('data-theme') === currentThemeId) {
        btn.classList.add('map-theme-btn--active');
      } else {
        btn.classList.remove('map-theme-btn--active');
      }
    });

    picker.addEventListener('click', function (e) {
      var btn = e.target;
      /* Traverse up in case the click lands on an inner element. */
      while (btn && btn !== picker && !btn.hasAttribute('data-theme')) {
        btn = btn.parentNode;
      }
      if (!btn || !btn.hasAttribute('data-theme')) { return; }
      var themeId = btn.getAttribute('data-theme');
      if (!THEMES[themeId]) { return; }

      currentThemeId = themeId;
      try { window.localStorage && window.localStorage.setItem('ps-map-theme', themeId); } catch (e) { /* ignore */ }

      /* Update button states. */
      btns.forEach(function (b) { b.classList.remove('map-theme-btn--active'); });
      btn.classList.add('map-theme-btn--active');

      /* Re-render map with new theme. */
      var container = getMapContainer();
      if (container && window.WORLD_GEOJSON) {
        buildSVGMap(container, window.WORLD_GEOJSON, currentThemeId);
      }
    });
  }

  /* ---- Entry point ---- */
  function initSVGMap() {
    var container = getMapContainer();
    if (!container) {
      console.warn('[map-svg.js] #svg-map-container not found — map skipped.');
      return;
    }

    prepareContainer(container);
    initThemePicker();

    loadGeoJson(
      function (geoJson) {
        buildSVGMap(container, geoJson, currentThemeId);
      },
      function (err) {
        console.warn('[map-svg.js] GeoJSON load failed: ' + (err && err.message ? err.message : err));
        renderFallbackNotice(container, getText('loadingNotice'));
      }
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSVGMap);
  } else {
    initSVGMap();
  }
})();
