/**
 * Pacific Star — Pure SVG Route Map  (v10 — rebuilt realistic route geometry)
 * ======================================================================================
 * Self-contained inline SVG map — no external libraries, no tile requests.
 * Uses Mercator projection + bundled GeoJSON land polygons (map-geodata.js).
 * Three design themes: Navy (морская), Sapphire (сапфир), Amber (янтарь).
 * Animated directional flow routes: international, cabotage, NSR, rail, road.
 *
 * Both sea and land routes use Catmull-Rom → cubic bezier splines that pass
 * through every waypoint. Sea routes use tension ~0.5 (divisor 12) for smooth
 * flowing curves; land routes use tension ~0.75 (divisor 24) for subtle bends
 * that suggest real road/rail geometry without significant deviation.
 *
 * Sea route waypoints are placed in open water to avoid land-crossing.
 * Land route waypoints follow actual highway/rail corridors (A360, R504, M58,
 * Trans-Siberian, M4, M7 etc.) with key geographic bends preserved.
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
  /* Fields:
     name     — display label
     lat/lon  — geographic coordinates (WGS-84)
     hub      — true = main hub (larger dot + pulse)
     type     — 'sea' | 'land'  (dot colour)
     nodeType — 'hub' | 'port' | 'city' | 'region'  (semantic type)
     country  — country name for data consumers
     desc     — tooltip description (service info)
     mobile   — false = hide on small screens (default: true)
     lx/ly    — label offset from dot centre (px in SVG space).
                 Positive lx → right (text-anchor: start);
                 Negative lx → left  (text-anchor: end).
                 Negative ly → above dot; Positive ly → below.
     To add a new city: push an entry here.
     To adjust position: edit lat/lon. */
  var POINTS = [
    /* ──── Hub ──── */
    { name: 'Владивосток',      lat: 43.1155, lon: 131.8855, hub: true,  type: 'sea',
      nodeType: 'hub',   country: 'Russia',
      desc: 'Главный хаб Дальнего Востока. Морские линии в Азию, Северный завоз, Транссибирские перевозки.',
      lx:  14, ly: -13 },

    /* ──── Russian Far East — sea / arctic ──── */
    { name: 'Сахалин',          lat: 50.9,    lon: 142.7,    hub: false, type: 'sea',
      nodeType: 'port',  country: 'Russia', mobile: false,
      desc: 'Морские грузоперевозки и нефтегазовая логистика Сахалинского шельфа.',
      lx:  11, ly:  -8 },
    { name: 'Магадан',          lat: 59.5635, lon: 150.8135, hub: false, type: 'sea',
      nodeType: 'port',  country: 'Russia',
      desc: 'Ключевой порт Охотского моря. Северный завоз в Магаданскую область и Чукотку.',
      lx:  11, ly:  -8 },
    { name: 'Петропавловск-Камчатский', lat: 53.0121, lon: 158.6561, hub: false, type: 'sea',
      nodeType: 'port',  country: 'Russia',
      desc: 'Морские перевозки на Камчатку. Северный завоз, рыбная и промышленная логистика.',
      lx:  11, ly:  -8 },
    { name: 'Анадырь',          lat: 64.7338, lon: 177.5215, hub: false, type: 'sea',
      nodeType: 'port',  country: 'Russia',
      desc: 'Столица Чукотского АО. Арктические морские поставки, Северный завоз.',
      lx: -11, ly:  -8 },
    { name: 'Певек',            lat: 69.7027, lon: 170.2738, hub: false, type: 'sea',
      nodeType: 'port',  country: 'Russia',
      desc: 'Самый северный порт России. Ключевой узел Северного морского пути (СМП), арктический завоз.',
      lx: -11, ly:  -8 },
    { name: 'Эгвекинот',        lat: 66.3213, lon: -179.176, hub: false, type: 'sea',
      nodeType: 'port',  country: 'Russia', mobile: false,
      desc: 'Морской порт Чукотки. Северный завоз, поставки в труднодоступные районы.',
      lx: -11, ly:   9 },
    { name: 'Чукотка',          lat: 66.8,    lon: 172.5,   hub: false, type: 'sea',
      /* nodeType 'region': regional area label — renders as a standard non-hub marker.
         To display without a dot, add a special branch in the marker rendering loop. */
      nodeType: 'region', country: 'Russia',
      desc: 'Чукотский автономный округ. Арктические маршруты, Северный завоз, СМП.',
      lx:  11, ly: -10 },
    { name: 'Якутск',           lat: 62.0355, lon: 129.7320, hub: false, type: 'land',
      nodeType: 'city',  country: 'Russia',
      desc: 'Центр Северного завоза в Якутию. Автодоставка вглубь арктических районов.',
      lx:  11, ly:  -8 },

    /* ──── Russian Far East — land / rail ──── */
    { name: 'Хабаровск',        lat: 48.4827, lon: 135.0838, hub: false, type: 'land',
      nodeType: 'city',  country: 'Russia',
      desc: 'Крупный транспортный узел Дальнего Востока. Транссибирская магистраль, автокоридоры.',
      lx: -11, ly: -10 },
    { name: 'Благовещенск',     lat: 50.2824, lon: 127.5355, hub: false, type: 'land',
      nodeType: 'city',  country: 'Russia', mobile: false,
      desc: 'Приграничный переход с Китаем (Хэйхэ). Трансграничная логистика и автодоставка.',
      lx: -11, ly: -10 },
    { name: 'Забайкальск',      lat: 49.6527, lon: 117.3273, hub: false, type: 'land',
      nodeType: 'city',  country: 'Russia', mobile: false,
      desc: 'Главный пограничный переход в Китай. Контейнерные ж/д перевозки (Маньчжурия).',
      lx:  11, ly:  13 },
    { name: 'Чита',             lat: 52.0316, lon: 113.4994, hub: false, type: 'land',
      nodeType: 'city',  country: 'Russia', mobile: false,
      desc: 'Транзитный узел Восток–Запад. Ж/д перевозки, автокоридор.',
      lx: -11, ly: -10 },
    { name: 'Иркутск',          lat: 52.2978, lon: 104.2965, hub: false, type: 'land',
      nodeType: 'city',  country: 'Russia',
      desc: 'Транзитный узел Сибири. Ж/д и автодоставка, перевалка грузов.',
      lx: -11, ly:  -8 },

    /* ──── Russia — million-plus cities (land / rail) ──── */
    { name: 'Красноярск',       lat: 56.0153, lon:  92.8932, hub: false, type: 'land',
      nodeType: 'city',  country: 'Russia', mobile: false,
      desc: 'Крупный сибирский центр. Авиа- и ж/д перевалка, региональная логистика.',
      lx:  11, ly:  -8 },
    { name: 'Новосибирск',      lat: 54.9885, lon:  82.9357, hub: false, type: 'land',
      nodeType: 'city',  country: 'Russia',
      desc: 'Крупнейший транзитный узел Сибири. Ж/д, авто и авиаперевозки.',
      lx:  11, ly:   9 },
    { name: 'Омск',             lat: 54.9885, lon:  73.3686, hub: false, type: 'land',
      nodeType: 'city',  country: 'Russia', mobile: false,
      desc: 'Западносибирский логистический узел. Ж/д перевозки.',
      lx: -11, ly:  -8 },
    { name: 'Екатеринбург',     lat: 56.8389, lon:  60.6057, hub: false, type: 'land',
      nodeType: 'city',  country: 'Russia',
      desc: 'Уральский хаб. Перевалка грузов Восток–Запад, промышленная логистика.',
      lx:  11, ly:  -8 },
    { name: 'Челябинск',        lat: 55.1644, lon:  61.4368, hub: false, type: 'land',
      nodeType: 'city',  country: 'Russia', mobile: false,
      desc: 'Промышленный Урал. Ж/д и автодоставка.',
      lx:  11, ly:  13 },
    { name: 'Пермь',            lat: 58.0105, lon:  56.2502, hub: false, type: 'land',
      nodeType: 'city',  country: 'Russia', mobile: false,
      desc: 'Уральский центр. Ж/д и речная логистика.',
      lx: -11, ly:  -8 },
    { name: 'Уфа',              lat: 54.7388, lon:  55.9721, hub: false, type: 'land',
      nodeType: 'city',  country: 'Russia', mobile: false,
      desc: 'Поволжье–Урал. Транзитный коридор Восток–Запад.',
      lx: -11, ly:  13 },
    { name: 'Казань',           lat: 55.7879, lon:  49.1221, hub: false, type: 'land',
      nodeType: 'city',  country: 'Russia', mobile: false,
      desc: 'Поволжье. Логистика в Центральную Россию, ж/д и автоперевозки.',
      lx: -11, ly:  -8 },
    { name: 'Самара',           lat: 53.1959, lon:  50.1002, hub: false, type: 'land',
      nodeType: 'city',  country: 'Russia', mobile: false,
      desc: 'Поволжский центр. Транзит на юг и запад России.',
      lx:  11, ly:  13 },
    { name: 'Нижний Новгород',  lat: 56.3269, lon:  44.0059, hub: false, type: 'land',
      nodeType: 'city',  country: 'Russia', mobile: false,
      desc: 'Приволжский центр. Автомобильная и ж/д логистика.',
      lx: -11, ly: -10 },
    { name: 'Волгоград',        lat: 48.7080, lon:  44.5133, hub: false, type: 'land',
      nodeType: 'city',  country: 'Russia', mobile: false,
      desc: 'Нижнее Поволжье. Транзит на юг к черноморским портам.',
      lx:  11, ly:  13 },
    { name: 'Воронеж',          lat: 51.6755, lon:  39.2088, hub: false, type: 'land',
      nodeType: 'city',  country: 'Russia', mobile: false,
      desc: 'Центральное Черноземье. Транзит в южном направлении.',
      lx:  11, ly:  13 },
    { name: 'Ростов-на-Дону',   lat: 47.2357, lon:  39.7015, hub: false, type: 'land',
      nodeType: 'city',  country: 'Russia',
      desc: 'Южный хаб России. Автодоставка, ж/д, выход к черноморским портам.',
      lx: -11, ly:  13 },
    { name: 'Москва',           lat: 55.7558, lon:  37.6173, hub: false, type: 'land',
      nodeType: 'city',  country: 'Russia',
      desc: 'Федеральный логистический центр. Распределение грузов по всей России.',
      lx:  11, ly:  -8 },
    { name: 'Санкт-Петербург',  lat: 59.9343, lon:  30.3351, hub: false, type: 'sea',
      nodeType: 'port',  country: 'Russia',
      desc: 'Балтийский портовый хаб. Паромное и морское сообщение, экспорт-импорт.',
      lx:  11, ly: -10 },
    { name: 'Находка',          lat: 42.8206, lon: 132.8731, hub: false, type: 'sea',
      nodeType: 'port',  country: 'Russia',
      desc: 'Крупный контейнерный и угольный порт Приморского края.',
      lx:  11, ly:  13 },
    { name: 'Мурманск',         lat: 68.9585, lon:  33.0827, hub: false, type: 'sea',
      nodeType: 'port',  country: 'Russia',
      desc: 'Незамерзающий арктический порт. Западная точка входа на СМП, арктический завоз.',
      lx:  11, ly:  -8 },
    { name: 'Архангельск',     lat: 64.5401, lon:  40.5433, hub: false, type: 'sea',
      nodeType: 'port',  country: 'Russia',
      desc: 'Порт Белого моря. Арктический завоз, лесная и промышленная логистика.',
      lx:  11, ly:  -8 },
    { name: 'Сабетта',         lat: 71.2700, lon:  72.0700, hub: false, type: 'sea',
      nodeType: 'port',  country: 'Russia',
      desc: 'СПГ-терминал на Ямале. Карское море, Северный морской путь.',
      lx:  11, ly:  -8 },
    { name: 'Дудинка',         lat: 69.4044, lon:  86.1725, hub: false, type: 'sea',
      nodeType: 'port',  country: 'Russia',
      desc: 'Речной порт на Енисее. Обслуживает Норильск, ключевой пункт Северного завоза.',
      lx:  11, ly:  -8 },
    { name: 'Тикси',           lat: 71.6439, lon: 128.8672, hub: false, type: 'sea',
      nodeType: 'port',  country: 'Russia',
      desc: 'Арктический порт на море Лаптевых. Северный завоз в Якутию, СМП.',
      lx:  11, ly:  -8 },
    { name: 'Провидения',      lat: 64.4200, lon: 173.2300, hub: false, type: 'sea',
      nodeType: 'port',  country: 'Russia',
      desc: 'Порт на Беринговом море, бухта Провидения. Арктический завоз, снабжение Чукотки.',
      lx: -11, ly:  -8 },
    { name: 'Новороссийск',     lat: 44.7233, lon:  37.7685, hub: false, type: 'sea',
      nodeType: 'port',  country: 'Russia',
      desc: 'Черноморский торговый порт. Нефтеналивные и контейнерные перевозки, выход в Средиземноморье.',
      lx: -12, ly: -10 },
    { name: 'Калининград',      lat: 54.7065, lon:  20.5109, hub: false, type: 'sea',
      nodeType: 'port',  country: 'Russia',
      desc: 'Балтийский порт в Калининградском эксклаве. Паромное и морское сообщение с материковой Россией.',
      lx: 11, ly: -8 },
    { name: 'Севастополь',      lat: 44.6166, lon:  33.5254, hub: false, type: 'sea',
      nodeType: 'port',  country: 'Russia', mobile: false,
      desc: 'Черноморский порт (Крым, Россия). Военно-морская и гражданская логистика.',
      lx:  11, ly:  13 },

    /* ──── China — Beijing + major sea ports ──── */
    { name: 'Пекин',            lat: 39.9042, lon: 116.4074, hub: false, type: 'land',
      nodeType: 'city',  country: 'China',
      desc: 'Логистический центр Китая. Ж/д коридоры в Россию, транзитные перевозки.',
      lx: -12, ly: -10 },
    { name: 'Тяньцзинь',        lat: 39.3434, lon: 117.3616, hub: false, type: 'sea',
      nodeType: 'port',  country: 'China', mobile: false,
      desc: 'Морской порт Пекинского региона (Китай). Контейнерные перевозки.',
      lx:  11, ly:  13 },
    { name: 'Далянь',           lat: 38.9140, lon: 121.6147, hub: false, type: 'sea',
      nodeType: 'port',  country: 'China', mobile: false,
      desc: 'Портовый хаб Северного Китая. Контейнерные и навалочные грузы.',
      lx:  11, ly:  -8 },
    { name: 'Циндао',           lat: 36.0671, lon: 120.3826, hub: false, type: 'sea',
      nodeType: 'port',  country: 'China', mobile: false,
      desc: 'Крупный контейнерный порт (Китай). Экспортные перевозки.',
      lx: -12, ly:  -8 },
    { name: 'Шанхай',           lat: 31.2304, lon: 121.4737, hub: false, type: 'sea',
      nodeType: 'port',  country: 'China',
      desc: 'Крупнейший морской порт Китая. Контейнерные линии во Владивосток и Россию.',
      lx: -12, ly:  -8 },
    { name: 'Нинбо',            lat: 29.8683, lon: 121.5440, hub: false, type: 'sea',
      nodeType: 'port',  country: 'China', mobile: false,
      desc: 'Один из ведущих контейнерных портов Китая.',
      lx:  11, ly:  13 },
    { name: 'Сямэнь',           lat: 24.4798, lon: 118.0894, hub: false, type: 'sea',
      nodeType: 'port',  country: 'China', mobile: false,
      desc: 'Морской порт Юго-Восточного Китая. Контейнерные перевозки.',
      lx: -12, ly:  -8 },
    { name: 'Гуанчжоу',         lat: 23.1291, lon: 113.2644, hub: false, type: 'sea',
      nodeType: 'port',  country: 'China',
      desc: 'Портовый мегахаб Юга Китая. Контейнерные линии в Россию и СНГ.',
      lx: -12, ly:  -8 },
    { name: 'Шэньчжэнь',        lat: 22.5431, lon: 114.0579, hub: false, type: 'sea',
      nodeType: 'port',  country: 'China', mobile: false,
      desc: 'Крупнейший контейнерный порт Юга Китая (порт Яньтянь).',
      lx:  11, ly:  13 },

    /* ──── India — major sea ports ──── */
    { name: 'Калькутта',        lat: 22.5726, lon:  88.3639, hub: false, type: 'sea',
      nodeType: 'port',  country: 'India',
      desc: 'Крупнейший порт Восточной Индии. Бенгальский залив, морские линии в Россию.',
      lx:  11, ly:  -8 },
    { name: 'Мумбаи',           lat: 19.0760, lon:  72.8777, hub: false, type: 'sea',
      nodeType: 'port',  country: 'India',
      desc: 'Главный торговый порт Индии. Транзит через Аравийское море в Россию.',
      lx: -12, ly:  -8 },
    { name: 'Кочи',             lat:  9.9312, lon:  76.2673, hub: false, type: 'sea',
      nodeType: 'port',  country: 'India', mobile: false,
      desc: 'Южный порт Индии (Малабарское побережье). Контейнерные перевозки.',
      lx: -12, ly:  -8 },
    { name: 'Ченнаи',           lat: 13.0827, lon:  80.2707, hub: false, type: 'sea',
      nodeType: 'port',  country: 'India',
      desc: 'Крупнейший порт Восточного побережья Индии. Морские линии в Азию.',
      lx:  11, ly:  -8 },

    /* ──── International — Sea of Japan / Pacific ──── */
    { name: 'Сеул',             lat: 37.5665, lon: 126.9780, hub: false, type: 'sea',
      nodeType: 'city',  country: 'Korea', mobile: false,
      desc: 'Морские перевозки (Корея). Транзит через Японское море.',
      lx: -12, ly:  17 },
    { name: 'Токио',            lat: 35.6762, lon: 139.6503, hub: false, type: 'sea',
      nodeType: 'city',  country: 'Japan', mobile: false,
      desc: 'Морские перевозки (Япония). Транзит через Тихий океан.',
      lx:  11, ly:  17 }
  ];

  /* ---- Directional flow routes ----
     Chains of waypoints showing cargo flow direction.
     Waypoints are either a city name (matched against POINTS) or
     an anonymous {lat, lon} object used as a path guide point only.
     Fields:
       id       — unique route identifier
       type     — 'sea' | 'land'
       label    — short route title shown in hover tooltip
       desc     — service description shown in tooltip (one line)
       mobile   — false = hide route on small screens (default: true)
       waypoints — ordered list of city names and/or {lat, lon} guide points
     To add a new route: push an entry here and in FLOW_DELAYS.
     To adjust a sea route's path: edit or insert {lat, lon} guide points.
     To adjust a land route corridor: reorder or add city-name stops. */
  var FLOW_ROUTES = [
    /* ── Route A: International sea corridor
       Новороссийск → Босфор → Суэцкий канал → Индия → Малаккский пролив
       → Южно-Китайское море → Китай → Корейский пролив → Япония
       → пролив Цугару → Японское море → Владивосток

       Waypoints placed in open water; Catmull-Rom spline passes through each.
       To adjust a segment: edit or insert a {lat, lon} guide point. */
    {
      id: 'intl-sea',
      type: 'sea',
      label: 'Международный морской коридор',
      desc:  'Новороссийск → Индия → Китай → Владивосток. Контейнерные перевозки, морской экспорт/импорт.',
      waypoints: [
        'Новороссийск',
        { lat: 43.5, lon: 35.5 },   /* Чёрное море — на запад                 */
        { lat: 42.5, lon: 33.0 },   /* Центральное Чёрное море                */
        { lat: 41.8, lon: 30.5 },   /* Западное Чёрное море — подход к Босфору*/
        { lat: 41.1, lon: 29.0 },   /* Вход в Босфор                          */
        { lat: 40.6, lon: 27.0 },   /* Мраморное море / выход из Дарданелл    */
        { lat: 38.5, lon: 25.0 },   /* Эгейское море                          */
        { lat: 35.5, lon: 26.0 },   /* ЮВ Эгейское / Крит                     */
        { lat: 34.0, lon: 30.5 },   /* В. Средиземноморье (ю. Кипра)          */
        { lat: 31.0, lon: 32.3 },   /* Суэцкий канал (Порт-Саид)              */
        { lat: 28.0, lon: 33.5 },   /* Красное море (северная часть)           */
        { lat: 21.0, lon: 38.5 },   /* Красное море (центр)                   */
        { lat: 12.5, lon: 43.5 },   /* Баб-эль-Мандеб / Аденский залив        */
        { lat: 12.0, lon: 50.0 },   /* Аденский залив (восточный выход)       */
        { lat: 14.0, lon: 58.0 },   /* Аравийское море (юг Омана)             */
        { lat: 17.0, lon: 66.0 },   /* Аравийское море (открытая вода)        */
        'Мумбаи',
        { lat: 15.0, lon: 73.5 },   /* Аравийское море у Гоа                  */
        'Кочи',
        { lat: 7.0,  lon: 78.0 },   /* Ю. Индия / С. Шри-Ланки               */
        'Ченнаи',
        { lat: 14.0, lon: 82.5 },   /* Бенгальский залив (зап.)               */
        { lat: 18.0, lon: 87.0 },   /* Бенгальский залив (Одиша)              */
        'Калькутта',
        { lat: 14.5, lon: 91.0 },   /* ЮВ Бенгальского залива                 */
        { lat: 8.0,  lon: 97.5 },   /* Андаманское море                       */
        { lat: 3.5,  lon: 100.5 },  /* Малаккский пролив (юж. вход)           */
        { lat: 5.0,  lon: 104.0 },  /* ЮКМ — юго-запад                        */
        { lat: 9.0,  lon: 108.0 },  /* Южно-Китайское море (запад)            */
        { lat: 14.0, lon: 111.0 },  /* ЮКМ (центр)                            */
        { lat: 19.0, lon: 113.5 },  /* ЮКМ (северная часть)                   */
        'Гуанчжоу',
        'Шэньчжэнь',
        { lat: 22.0, lon: 117.0 },  /* Вост. от Жемчужной реки                */
        'Сямэнь',
        { lat: 27.0, lon: 121.5 },  /* Восточно-Китайское море (Чжэцзян)     */
        'Нинбо',
        'Шанхай',
        { lat: 33.0, lon: 123.0 },  /* Жёлтое море (юг)                       */
        { lat: 35.5, lon: 122.0 },  /* Жёлтое море (центр)                    */
        'Циндао',
        { lat: 37.5, lon: 122.5 },  /* Жёлтое море (север)                    */
        'Далянь',
        { lat: 38.5, lon: 120.5 },  /* Бохайский залив                        */
        'Тяньцзинь',
        { lat: 37.0, lon: 124.0 },  /* Жёлтое — подход к Корее                */
        'Сеул',
        { lat: 34.5, lon: 128.5 },  /* Корейский пролив (Цусима)              */
        { lat: 33.5, lon: 132.0 },  /* Тихий океан — юг Сикоку                */
        { lat: 34.5, lon: 137.0 },  /* Тихий океан — Эншу-нада               */
        'Токио',
        { lat: 37.5, lon: 141.5 },  /* Тихий океан — восточнее С. Хонсю      */
        { lat: 40.5, lon: 141.0 },  /* Тихий океан — подход к пр. Цугару     */
        { lat: 41.5, lon: 140.0 },  /* Пролив Цугару (Хонсю–Хоккайдо)        */
        { lat: 42.5, lon: 137.5 },  /* Японское море — запад Хоккайдо         */
        { lat: 43.0, lon: 134.5 },  /* Японское море — подход к Приморью      */
        'Владивосток'
      ]
    },

    /* ── Route B: Trans-Siberian Railway
       Владивосток → Хабаровск → BAM/Trans-Sib → Чита → Иркутск
       → Красноярск → Москва → СПб → Мурманск.
       Guide points follow the actual railway corridor with key bends. */
    {
      id: 'trans-sib',
      type: 'land',
      label: 'Транссибирская магистраль',
      desc:  'Владивосток → Хабаровск → Иркутск → Москва → Мурманск. Ж/д перевозки, сборные и контейнерные грузы.',
      waypoints: [
        'Владивосток',
        { lat: 43.8, lon: 132.0 },    /* Уссурийск                            */
        { lat: 45.5, lon: 133.5 },    /* Уссурийская ж/д — к северу            */
        { lat: 47.0, lon: 134.5 },    /* Вяземская                             */
        'Хабаровск',
        { lat: 48.8, lon: 132.9 },    /* Биробиджан                            */
        { lat: 49.0, lon: 131.0 },    /* Облучье                               */
        { lat: 49.4, lon: 130.0 },    /* Архара                                */
        { lat: 50.9, lon: 128.5 },    /* Белогорск                             */
        { lat: 52.5, lon: 126.0 },    /* Свободный / Шимановская               */
        { lat: 54.0, lon: 124.0 },    /* Сковородино (северная дуга ж/д)       */
        { lat: 53.7, lon: 120.0 },    /* Могоча                                */
        { lat: 52.5, lon: 116.5 },    /* Чернышевск                            */
        'Чита',
        { lat: 51.8, lon: 107.6 },    /* Улан-Удэ (южная дуга вокруг Байкала)  */
        'Иркутск',
        { lat: 53.5, lon: 100.0 },    /* Тайшет (узел БАМ)                     */
        { lat: 55.0, lon: 96.0 },     /* Ачинск                                */
        'Красноярск',
        { lat: 55.5, lon: 89.0 },     /* Мариинск                              */
        'Новосибирск',
        { lat: 55.5, lon: 78.0 },     /* Ишим                                  */
        'Омск',
        { lat: 56.5, lon: 65.5 },     /* Тюмень                                */
        'Екатеринбург',
        'Пермь',
        { lat: 58.6, lon: 49.7 },     /* Киров                                 */
        { lat: 57.5, lon: 43.0 },     /* Нижегородская обл.                    */
        'Москва',
        { lat: 57.0, lon: 34.0 },     /* Тверь                                 */
        'Санкт-Петербург',
        { lat: 61.8, lon: 34.0 },     /* Петрозаводск (Карелия)                */
        { lat: 65.5, lon: 33.0 },     /* Кандалакша                             */
        'Мурманск'
      ]
    },

    /* ── Route C: Southern Russia corridor
       Владивосток → Хабаровск → Благовещенск → Чита → Иркутск
       → Новосибирск → Уфа → Москва → Ростов → Новороссийск.
       Follows M58, M55, M7, M4 federal highways with key road bends. */
    {
      id: 'south-ru',
      type: 'land',
      label: 'Южный транспортный коридор',
      desc:  'Владивосток → Сибирь → Москва → Ростов-на-Дону → Новороссийск. Автомобильная и ж/д доставка.',
      mobile: false,
      waypoints: [
        'Владивосток',
        { lat: 43.8, lon: 132.0 },    /* Уссурийск                            */
        { lat: 45.5, lon: 133.5 },    /* на север вдоль Уссури                 */
        { lat: 47.0, lon: 134.5 },    /* Вяземская                             */
        'Хабаровск',
        { lat: 48.8, lon: 133.0 },    /* на запад по Амурской ж/д             */
        { lat: 49.2, lon: 131.0 },    /* Облучье / М58                        */
        'Благовещенск',
        { lat: 50.5, lon: 125.5 },    /* М58 — через Амурскую обл.            */
        { lat: 51.5, lon: 121.0 },    /* перегон к Чите                        */
        'Чита',
        { lat: 51.8, lon: 107.6 },    /* Улан-Удэ                              */
        'Иркутск',
        { lat: 54.0, lon: 96.0 },     /* через Красноярский край               */
        'Новосибирск',
        { lat: 55.5, lon: 78.0 },     /* через Омскую обл.                     */
        { lat: 54.8, lon: 69.0 },     /* южная Тюменская обл.                  */
        { lat: 54.5, lon: 63.5 },     /* Курган                                */
        'Уфа',
        'Казань',
        'Нижний Новгород',
        'Москва',
        { lat: 54.5, lon: 38.5 },     /* Тула                                  */
        'Воронеж',
        { lat: 50.0, lon: 42.0 },     /* М4 на юг                              */
        'Волгоград',
        { lat: 47.5, lon: 41.5 },     /* М21 к Ростову                         */
        'Ростов-на-Дону',
        { lat: 45.5, lon: 38.5 },     /* М4 к Новороссийску                    */
        'Новороссийск'
      ]
    },

    /* ── Route D: Northern land branch — Хабаровск → Якутск → Магадан
       A360 "Lena" (Хабаровск → Тында → Нерюнгри → Якутск),
       then R504 "Kolyma" (Якутск → Хандыга → Сусуман → Магадан).
       Intermediate guide points follow actual highway corridors. */
    {
      id: 'north-yakutsk',
      type: 'land',
      label: 'Северный завоз — Якутия',
      desc:  'Хабаровск → Якутск → Магадан. Автодоставка вглубь арктических районов, сезонные поставки.',
      waypoints: [
        'Хабаровск',
        { lat: 49.5, lon: 133.0 },    /* М58 на запад от Хабаровска            */
        { lat: 50.0, lon: 131.0 },    /* Биробиджан / Облучье                  */
        { lat: 51.0, lon: 129.0 },    /* на запад по М58                       */
        { lat: 52.0, lon: 127.0 },    /* Белогорск                             */
        { lat: 53.0, lon: 125.5 },    /* Невер — съезд на А360                 */
        { lat: 54.5, lon: 124.5 },    /* Тында — поворот на север              */
        { lat: 56.5, lon: 124.8 },    /* Нерюнгри                              */
        { lat: 58.5, lon: 125.5 },    /* Алдан                                 */
        { lat: 60.0, lon: 127.5 },    /* подъезд к Якутску                     */
        'Якутск',
        { lat: 62.5, lon: 132.5 },    /* Р504 — на восток от Якутска           */
        { lat: 63.0, lon: 136.0 },    /* Хандыга                               */
        { lat: 63.2, lon: 139.5 },    /* перевал — Верхоянский хребет          */
        { lat: 63.0, lon: 143.0 },    /* далее на восток                       */
        { lat: 62.5, lon: 147.5 },    /* Сусуман                               */
        { lat: 61.5, lon: 149.0 },    /* Атка / поворот к побережью            */
        { lat: 60.5, lon: 150.5 },    /* спуск к побережью                     */
        'Магадан'
      ]
    },

    /* ── Route E: Северный морской путь (NSR / Arctic Sea Route)
       Full chain: Мурманск → Архангельск → Сабетта → Дудинка → Тикси
       → Певек → Провидения → Анадырь → Магадан → Владивосток.
       All waypoints stay in Arctic/Pacific open water.
       Key navigation:
         - White Sea via Gorlo Strait (~67°N)
         - Сабетта approached via Kara Sea, north of Yamal tip (~74°N)
         - Дудинка via Yenisei Gulf estuary
         - Таймыр rounded north of Cape Chelyuskin (~77°N)
         - Провидения via Bering Sea / Anadyr Gulf
         - Return via Okhotsk Sea and La Perouse Strait */
    {
      id: 'nsm-route',
      type: 'sea',
      label: 'Северный морской путь',
      desc:  'Мурманск → Архангельск → Сабетта → Дудинка → Тикси → Певек → Анадырь → Магадан → Владивосток. Арктический завоз, СМП.',
      waypoints: [
        'Мурманск',
        { lat: 71.0, lon: 36.0 },    /* Баренцево море — к северу              */
        { lat: 70.0, lon: 39.5 },    /* подход к Горлу Белого моря             */
        { lat: 67.0, lon: 39.0 },    /* пролив Горло (вход в Белое море)       */
        'Архангельск',
        { lat: 67.0, lon: 40.0 },    /* выход из Белого моря через Горло       */
        { lat: 70.0, lon: 41.0 },    /* Баренцево море                         */
        { lat: 73.0, lon: 48.0 },    /* Баренцево — севернее Колгуева          */
        { lat: 76.0, lon: 57.0 },    /* севернее Новой Земли (открытая вода)   */
        { lat: 74.5, lon: 65.0 },    /* Карское море — вход                    */
        { lat: 74.0, lon: 68.5 },    /* Карское — западнее мыса Ямал           */
        { lat: 73.8, lon: 71.0 },    /* к северу от оконечности Ямала          */
        { lat: 73.0, lon: 73.5 },    /* Обская губа — северный вход            */
        { lat: 72.0, lon: 73.0 },    /* Обская губа — подход к Сабетте         */
        'Сабетта',
        { lat: 72.5, lon: 74.0 },    /* отход от Сабетты на север              */
        { lat: 73.5, lon: 76.0 },    /* возврат в Карское                      */
        { lat: 74.0, lon: 80.0 },    /* Карское — на северо-восток             */
        { lat: 73.5, lon: 84.0 },    /* Енисейский залив (вход)                */
        { lat: 72.0, lon: 83.5 },    /* Енисейский залив — к югу               */
        { lat: 71.0, lon: 83.0 },    /* устье Енисея                           */
        'Дудинка',
        { lat: 72.0, lon: 87.0 },    /* Карское — восточнее Енисея             */
        { lat: 74.5, lon: 96.0 },    /* север Таймыра                          */
        { lat: 77.0, lon: 105.0 },   /* мыс Челюскин (самая северная точка)    */
        { lat: 76.5, lon: 115.0 },   /* море Лаптевых (запад)                  */
        { lat: 74.0, lon: 126.0 },   /* море Лаптевых — подход к Тикси         */
        'Тикси',
        { lat: 73.0, lon: 136.0 },   /* Восточно-Сибирское море (запад)        */
        { lat: 74.0, lon: 148.0 },   /* Восточно-Сибирское (центр)             */
        { lat: 72.0, lon: 160.0 },   /* Восточно-Сибирское (восток)            */
        { lat: 70.5, lon: 168.0 },   /* подход к Певеку                        */
        'Певек',
        { lat: 70.0, lon: 172.0 },   /* Чукотское море                         */
        { lat: 68.5, lon: 175.0 },   /* Чукотское — на юго-восток              */
        { lat: 66.0, lon: 176.0 },   /* Анадырский залив (северный вход)       */
        'Провидения',
        { lat: 64.5, lon: 175.0 },   /* Анадырский залив                       */
        'Анадырь',
        { lat: 62.0, lon: 175.0 },   /* Берингово море                         */
        { lat: 58.5, lon: 168.0 },   /* Берингово — юго-запад                  */
        { lat: 56.0, lon: 158.0 },   /* Тихий океан — восточнее Камчатки       */
        { lat: 57.5, lon: 152.0 },   /* Охотское — подход к Магадану           */
        'Магадан',
        { lat: 56.0, lon: 148.0 },   /* Охотское море (юг)                     */
        { lat: 52.0, lon: 146.0 },   /* Охотское — юго-запад                   */
        { lat: 48.0, lon: 144.5 },   /* Южное Охотское — вост. Сахалина        */
        { lat: 46.0, lon: 142.5 },   /* пролив Лаперуза (Сахалин–Хоккайдо)    */
        { lat: 44.5, lon: 139.0 },   /* Японское море (север)                  */
        { lat: 43.5, lon: 135.0 },   /* Японское море — подход к Приморью      */
        'Владивосток'
      ]
    },

    /* ── Route F: Baltic Sea — Санкт-Петербург → Калининград
       Gulf of Finland → open Baltic Sea → Kaliningrad. */
    {
      id: 'baltic-sea',
      type: 'sea',
      label: 'Балтийский морской маршрут',
      desc:  'Санкт-Петербург → Балтийское море → Калининград. Паромное и морское сообщение с Калининградским эксклавом.',
      waypoints: [
        'Санкт-Петербург',
        { lat: 59.8, lon: 27.5 },    /* Финский залив (район Таллина)          */
        { lat: 59.5, lon: 24.0 },    /* выход из Финского залива               */
        { lat: 58.0, lon: 22.0 },    /* открытое Балтийское море               */
        { lat: 56.5, lon: 20.5 },    /* Балтика — к югу                        */
        'Калининград'
      ]
    },

    /* ── Route G: Cabotage — Владивосток → Сахалин
       Sea of Japan → Tatar Strait (centre of channel) → Sakhalin.
       Tatar Strait is ~100-200 km wide at 48-49°N; waypoints stay mid-channel. */
    {
      id: 'cab-sakhalin',
      type: 'sea',
      label: 'Каботаж — Сахалин',
      desc:  'Владивосток → Сахалин. Морские грузоперевозки, нефтегазовая логистика Сахалинского шельфа.',
      waypoints: [
        'Владивосток',
        { lat: 43.0, lon: 133.0 },    /* Японское море — выход из бухты        */
        { lat: 44.5, lon: 135.5 },    /* Японское море — северо-восток         */
        { lat: 46.5, lon: 137.5 },    /* Японское море — подход к проливу      */
        { lat: 48.0, lon: 139.5 },    /* Татарский пролив — юг (мидфарватер)   */
        { lat: 49.5, lon: 140.5 },    /* Татарский пролив — центр              */
        { lat: 50.5, lon: 141.5 },    /* Татарский пролив — к Сахалину         */
        'Сахалин'
      ]
    },

    /* ── Route H: Cabotage — Владивосток → Петропавловск-Камчатский
       Sea of Japan → La Perouse Strait (Sakhalin–Hokkaido gap, ~46°N)
       → Okhotsk Sea → around Cape Lopatka → Pacific coast of Kamchatka.
       Waypoints stay in water at safe distance from coastlines. */
    {
      id: 'cab-kamchatka',
      type: 'sea',
      label: 'Каботаж — Камчатка',
      desc:  'Владивосток → Петропавловск-Камчатский. Морские перевозки на Камчатку, сезонный завоз.',
      waypoints: [
        'Владивосток',
        { lat: 43.0, lon: 133.5 },    /* Японское море — выход                 */
        { lat: 44.0, lon: 136.0 },    /* Японское — на восток                  */
        { lat: 45.5, lon: 139.5 },    /* подход к пр. Лаперуза                 */
        { lat: 46.0, lon: 142.0 },    /* Пролив Лаперуза (Сахалин–Хоккайдо)   */
        { lat: 47.5, lon: 145.0 },    /* Охотское море — вход                  */
        { lat: 49.5, lon: 148.0 },    /* Охотское — на северо-восток           */
        { lat: 51.0, lon: 153.0 },    /* Охотское — юго-запад Камчатки         */
        { lat: 51.5, lon: 156.5 },    /* мыс Лопатка (юг Камчатки)             */
        { lat: 52.0, lon: 158.0 },    /* Тихий океан — рядом с Камчаткой       */
        'Петропавловск-Камчатский'
      ]
    },

    /* ── Route I: Cabotage — Владивосток → Магадан
       Sea of Japan → La Perouse Strait → Okhotsk Sea → Magadan.
       Route stays in Okhotsk Sea interior, west of Kuril chain. */
    {
      id: 'cab-magadan',
      type: 'sea',
      label: 'Каботаж — Магадан',
      desc:  'Владивосток → Магадан. Морской каботаж через Охотское море, сезонный завоз.',
      waypoints: [
        'Владивосток',
        { lat: 43.0, lon: 133.5 },    /* Японское море — выход                 */
        { lat: 44.0, lon: 136.0 },    /* Японское — на восток                  */
        { lat: 45.5, lon: 139.5 },    /* подход к пр. Лаперуза                 */
        { lat: 46.0, lon: 142.0 },    /* Пролив Лаперуза                       */
        { lat: 47.5, lon: 145.0 },    /* Охотское море — вход                  */
        { lat: 50.0, lon: 147.5 },    /* Охотское — на север                   */
        { lat: 53.0, lon: 149.0 },    /* Охотское — центральная часть          */
        { lat: 56.0, lon: 150.0 },    /* Охотское — северная часть             */
        { lat: 58.0, lon: 150.5 },    /* подход к Магадану                     */
        'Магадан'
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
    'baltic-sea':     '-1.2s',
    'cab-sakhalin':   '-0.6s',
    'cab-kamchatka':  '-2.1s',
    'cab-magadan':    '-3.0s'
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
    var i, p0, p1, p2, p3, cp1x, cp1y, cp2x, cp2y;

    /* Sea routes:  Catmull-Rom divisor 12 (tension ~0.5, smooth curves).
       Land routes: Catmull-Rom divisor 24 (very tight, subtle curves that
                    suggest road bends without deviating from waypoints). */
    var divisor = (route.type === 'land') ? 24 : 12;

    for (i = 1; i < pts.length; i++) {
      p0 = pts[Math.max(0, i - 2)];
      p1 = pts[i - 1];
      p2 = pts[i];
      p3 = pts[Math.min(pts.length - 1, i + 1)];

      cp1x = p1.x + (p2.x - p0.x) / divisor;
      cp1y = p1.y + (p2.y - p0.y) / divisor;
      cp2x = p2.x - (p3.x - p1.x) / divisor;
      cp2y = p2.y - (p3.y - p1.y) / divisor;

      d += ' C' + cp1x.toFixed(1) + ' ' + cp1y.toFixed(1) +
           ' ' + cp2x.toFixed(1) + ' ' + cp2y.toFixed(1) +
           ' ' + p2.x.toFixed(1) + ' ' + p2.y.toFixed(1);
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
        /* mobile: false → hide on small screens via CSS media query */
        var isMobileHide = (route.mobile === false);

        /* Animated visible route line. */
        var pathEl = el('path', {
          d: d,
          style: 'fill:none;stroke:' + routeColor +
                 ';stroke-width:' + strokeW +
                 ';stroke-opacity:' + opacity +
                 ';stroke-linecap:round;stroke-linejoin:round',
          'class': 'svg-map-route svg-map-route--' + route.type +
                   (isMobileHide ? ' svg-map-minor' : ''),
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
          'class': 'svg-map-route-hit' + (isMobileHide ? ' svg-map-minor' : ''),
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
        /* mobile: false → hide on small screens via CSS media query */
        var isMobileHide = (pt.mobile === false);
        var g  = el('g', {
          'class':      'svg-map-marker' + (pt.hub ? ' svg-map-marker--hub' : '') +
                        (isMobileHide ? ' svg-map-minor' : ''),
          tabindex:     '0',
          role:         'button',
          'aria-label': pt.name + ' — ' + pt.desc
        });
        g.dataset.name     = pt.name;
        g.dataset.desc     = pt.desc;
        g.dataset.nodeType = pt.nodeType || '';
        g.dataset.country  = pt.country  || '';

        /* Store base dot colour for route-highlight restore. */
        var baseDotColor = pt.hub ? theme.dotHub : theme.dotCity;
        g.dataset.baseDotColor = baseDotColor;

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
          style: 'fill:' + baseDotColor,
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
      /* TOOLTIP_WIDTH must match max-width of .svg-map-tooltip in premium-features.css */
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
          /* Highlight all named city nodes on the hovered route.
             We preserve the original dot fill colour and only add a stronger glow
             so hub nodes remain visually distinct from regular city nodes. */
          var routeDef = null;
          for (var ri = 0; ri < FLOW_ROUTES.length; ri++) {
            if (FLOW_ROUTES[ri].id === routeId) { routeDef = FLOW_ROUTES[ri]; break; }
          }
          if (routeDef) {
            routeDef.waypoints.forEach(function (wp) {
              if (typeof wp !== 'string') { return; }
              var markerEl = markersG.querySelector('[data-name="' + wp + '"]');
              if (!markerEl) { return; }
              markerEl.classList.add('svg-map-marker--route-active');
              /* Add a glow halo using the node's own pulse colour so
                 hub nodes stay white and city nodes keep their theme colour. */
              var dotEl = markerEl.querySelector('.svg-map-dot');
              if (dotEl) {
                var glowColor = markerEl.classList.contains('svg-map-marker--hub')
                  ? theme.pulseHub : theme.pulseCity;
                dotEl.style.filter = 'drop-shadow(0 0 8px ' + glowColor + ')';
              }
            });
          }
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
          /* Restore node dot colours. */
          markersG.querySelectorAll('.svg-map-marker--route-active').forEach(function (g) {
            g.classList.remove('svg-map-marker--route-active');
            var dotEl = g.querySelector('.svg-map-dot');
            if (dotEl) { dotEl.style.filter = ''; }
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
