/**
 * Pacific Star — Regional Map
 * ========================
 * Точный квадратный фрагмент карты от Калининграда до Чукотки
 * и от Арктики до южной точки Индии.
 */
(function () {
  'use strict';

  var W = 1080;
  var H = 1080;
  /* Границы окна заданы в нормализованной системе 0..360 для работы через 180-й меридиан. */
  var LON_MIN = 19;
  var LON_MAX = 191;
  var LAT_MAX = 82;
  var LAT_MIN = 6.75;
  var LON_SPAN = LON_MAX - LON_MIN;
  var LAT_SPAN = LAT_MAX - LAT_MIN;
  var PIXELS_PER_DEGREE = Math.min(W / LON_SPAN, H / LAT_SPAN);
  var MAP_W = LON_SPAN * PIXELS_PER_DEGREE;
  var MAP_H = LAT_SPAN * PIXELS_PER_DEGREE;
  var OFFSET_X = (W - MAP_W) / 2;
  /* Anchor the cropped region to the top of the square viewport so the Arctic starts near the upper edge. */
  var OFFSET_Y = 0;

  var C_OCEAN = '#2b4d8a';
  var C_LAND = '#6a9fc8';
  var C_BORDER = '#9cc4e0';
  var C_GRID = 'rgba(255,255,255,0.12)';
  var C_LABEL = 'rgba(255,255,255,0.8)';
  var C_POINT = '#ffffff';
  var C_CAPITAL = '#ffd166';
  var C_POINT_STROKE = 'rgba(17,34,64,0.95)';
  var C_LABEL_STROKE = 'rgba(17,34,64,0.72)';
  var C_ROAD_LINE = 'rgba(255,255,255,0.80)';
  var C_ROAD_BRANCH_LINE = 'rgba(255,255,255,0.55)';
  var C_ROAD_CHINA = 'rgba(255,195,80,0.72)';
  var C_ROAD_JAPAN = 'rgba(255,130,120,0.72)';
  var C_ROAD_KOREA = 'rgba(100,230,190,0.72)';
  var C_SEA_ROUTE_LINE = 'rgba(255,255,255,0.92)';
  var C_SEA_ROUTE_GLOW = 'rgba(255,255,255,0.42)';
  var BASE_POINT_STROKE_WIDTH = 2;
  var BASE_LABEL_STROKE_WIDTH = 3;
  var pointLabelScalingBindings = new WeakMap();

  var NS = 'http://www.w3.org/2000/svg';
  var DATA_URL = 'data/world-countries.geo.json?v=20260311b';

  var cachedFeatures = null;

  /* Нормализуем долготы в 0..360, чтобы корректно отрисовать регион через 180-й меридиан. */
  function normalizeLon(lon) {
    return ((lon % 360) + 360) % 360;
  }

  function px(lon, lat) {
    var normalizedLon = normalizeLon(lon);
    var x = OFFSET_X + (normalizedLon - LON_MIN) * PIXELS_PER_DEGREE;
    var y = OFFSET_Y + (LAT_MAX - lat) * PIXELS_PER_DEGREE;
    return [x, y];
  }

  function fmt(num) {
    return Number(num).toFixed(1);
  }

  function el(tag, attrs) {
    var node = document.createElementNS(NS, tag);
    Object.keys(attrs).forEach(function (key) {
      node.setAttribute(key, attrs[key]);
    });
    return node;
  }

  function txt(str, x, y, attrs) {
    var node = el('text', Object.assign({
      x: x,
      y: y,
      fill: C_LABEL,
      'font-family': 'Arial,Helvetica,sans-serif',
      'text-anchor': 'middle'
    }, attrs || {}));
    node.textContent = str;
    return node;
  }

  var LABELS = [
    { text: 'Калининград', lon: 20.4, lat: 54.7, size: 17, anchor: 'start' },
    { text: 'Россия', lon: 103, lat: 60, size: 34 },
    { text: 'Чукотка', lon: 177, lat: 66, size: 18 },
    { text: 'Северный Ледовитый океан', lon: 105, lat: 77, size: 18, opacity: 0.7 },
    { text: 'Индия', lon: 79, lat: 20, size: 18, opacity: 0.7 },
    { text: 'Япония', lon: 138, lat: 37, size: 16 },
    { text: 'Китай', lon: 106, lat: 35, size: 18 },
    { text: 'Южная Корея', lon: 127.6, lat: 36.4, size: 14 }
  ];

  var CITY_POINTS = [
    { text: 'Москва', lon: 37.6, lat: 55.8, size: 18, dx: 8, dy: -8, kind: 'capital' },
    { text: 'Санкт-Петербург', lon: 30.3, lat: 59.9, dx: 8, dy: -8, size: 15 },
    { text: 'Мурманск', lon: 33.1, lat: 69.0, dx: 8, dy: -8 },
    { text: 'Новороссийск', lon: 37.8, lat: 44.7, dx: 8, dy: 18 },
    { text: 'Владивосток', lon: 131.9, lat: 43.1, dx: 8, dy: -8 },
    { text: 'Уссурийск', lon: 131.9, lat: 43.8, size: 14, dx: -12, dy: -12, anchor: 'end' },
    { text: 'Находка', lon: 132.9, lat: 42.8, size: 14, dx: 8, dy: 22 },
    { text: 'Пограничный', lon: 131.4, lat: 44.4, size: 13, dx: -14, dy: -12, anchor: 'end' },
    { text: 'Суйфэньхэ', lon: 131.2, lat: 44.4, size: 13, dx: 10, dy: 14 },
    { text: 'Благовещенск', lon: 127.5, lat: 50.3, size: 13, dx: -14, dy: -10, anchor: 'end' },
    { text: 'Хэйхэ', lon: 127.5, lat: 50.2, size: 13, dx: 10, dy: -12 },
    { text: 'Забайкальск', lon: 117.3, lat: 49.7, size: 13, dx: -14, dy: 18, anchor: 'end' },
    { text: 'Маньчжурия', lon: 117.4, lat: 49.6, size: 13, dx: 10, dy: -10 },
    { text: 'Якутск', lon: 129.7, lat: 62.0, size: 15, dx: 8, dy: -8 },
    { text: 'Магадан', lon: 150.8, lat: 59.6, size: 15, dx: 8, dy: -8 },
    { text: 'Иркутск', lon: 104.3, lat: 52.3, size: 14, dx: 8, dy: -8 },
    { text: 'Красноярск', lon: 92.9, lat: 56.0, size: 14, dx: -12, dy: -10, anchor: 'end' },
    { text: 'Новосибирск', lon: 82.9, lat: 55.0, size: 14, dx: 8, dy: 18 },
    { text: 'Омск', lon: 73.4, lat: 55.0, size: 14, dx: -12, dy: -8, anchor: 'end' },
    { text: 'Екатеринбург', lon: 60.6, lat: 56.8, size: 14, dx: 8, dy: -8 },
    { text: 'Челябинск', lon: 61.4, lat: 55.2, size: 14, dx: -10, dy: 18, anchor: 'end' },
    { text: 'Уфа', lon: 56.0, lat: 54.7, size: 14, dx: -12, dy: -10, anchor: 'end' },
    { text: 'Казань', lon: 49.1, lat: 55.8, size: 14, dx: 8, dy: -8 },
    { text: 'Пекин', lon: 116.4, lat: 39.9, dx: -10, dy: -10, anchor: 'end', kind: 'capital' },
    { text: 'Шанхай', lon: 121.5, lat: 31.2, dx: 8, dy: 18 },
    { text: 'Циндао', lon: 120.4, lat: 36.1, dx: 8, dy: -8 },
    { text: 'Шенжень', lon: 114.1, lat: 22.5, dx: 8, dy: 18 },
    { text: 'Токио', lon: 139.7, lat: 35.7, dx: 8, dy: -8, kind: 'capital' },
    { text: 'Йокогама', lon: 139.6, lat: 35.4, dx: 8, dy: 18 },
    { text: 'Кобе', lon: 135.2, lat: 34.7, dx: -10, dy: 18, anchor: 'end' },
    { text: 'Сеул', lon: 127.0, lat: 37.6, dx: -10, dy: -10, anchor: 'end', kind: 'capital' },
    { text: 'Пусан', lon: 129.1, lat: 35.2, dx: 8, dy: 18 },
    { text: 'Инчхон', lon: 126.7, lat: 37.5, dx: -10, dy: 18, anchor: 'end' },
    { text: 'Нью-Дели', lon: 77.2, lat: 28.6, dx: 8, dy: -8, kind: 'capital' },
    { text: 'Мумбаи', lon: 72.9, lat: 19.1, dx: 8, dy: 18 },
    { text: 'Ченнаи', lon: 80.3, lat: 13.1, dx: 8, dy: 18 },
    { text: 'Калькутта', lon: 88.4, lat: 22.6, dx: 8, dy: -8 },
    /* Россия — дополнительные города */
    { text: 'Хабаровск', lon: 135.1, lat: 48.5, size: 14, dx: 8, dy: -8 },
    { text: 'Чита', lon: 113.5, lat: 52.0, size: 14, dx: 8, dy: -8 },
    { text: 'Воронеж', lon: 39.2, lat: 51.7, size: 13, dx: -12, dy: -8, anchor: 'end' },
    { text: 'Ростов-на-Дону', lon: 39.7, lat: 47.2, size: 13, dx: 8, dy: -8 },
    /* Китай — СВ-коридор и ключевые порты */
    { text: 'Харбин', lon: 126.6, lat: 45.8, size: 13, dx: 8, dy: -8 },
    { text: 'Чанчунь', lon: 125.3, lat: 43.9, size: 13, dx: 8, dy: -8 },
    { text: 'Шэньян', lon: 123.4, lat: 41.8, size: 13, dx: 8, dy: -8 },
    { text: 'Далянь', lon: 121.6, lat: 38.9, size: 13, dx: 8, dy: 18 },
    { text: 'Тяньцзинь', lon: 117.2, lat: 39.1, size: 12, dx: 8, dy: 18 },
    { text: 'Ухань', lon: 114.3, lat: 30.6, size: 12, dx: 8, dy: -8 },
    { text: 'Гуанчжоу', lon: 113.2, lat: 23.1, size: 13, dx: 8, dy: -8 },
    /* Япония */
    { text: 'Осака', lon: 135.5, lat: 34.7, size: 13, dx: 8, dy: 18 },
    { text: 'Нагоя', lon: 136.9, lat: 35.2, size: 12, dx: 8, dy: -8 },
    { text: 'Фукуока', lon: 130.4, lat: 33.6, size: 13, dx: 8, dy: -8 },
    { text: 'Саппоро', lon: 141.4, lat: 43.1, size: 13, dx: 8, dy: -8 },
    /* Корея */
    { text: 'Тэджон', lon: 127.4, lat: 36.3, size: 12, dx: 8, dy: -8 },
    { text: 'Тэгу', lon: 128.6, lat: 35.9, size: 12, dx: 8, dy: -8 }
  ];

  var ROAD_ROUTES = [
    {
      /* М-ось: Владивосток — Мурманск */
      kind: 'main',
      points: [
        { lon: 131.9, lat: 43.1 },
        { lon: 131.9, lat: 43.8 },
        { lon: 132.8, lat: 44.6 },
        { lon: 134.7, lat: 46.8 },
        { lon: 135.1, lat: 48.5 },
        { lon: 132.9, lat: 48.8 },
        { lon: 131.0, lat: 49.0 },
        { lon: 128.5, lat: 50.9 },
        { lon: 128.1, lat: 51.4 },
        { lon: 123.9, lat: 54.0 },
        { lon: 119.8, lat: 53.7 },
        { lon: 113.5, lat: 52.0 },
        { lon: 107.6, lat: 51.8 },
        { lon: 104.3, lat: 52.3 },
        { lon: 92.9, lat: 56.0 },
        { lon: 86.1, lat: 55.4 },
        { lon: 82.9, lat: 55.0 },
        { lon: 73.4, lat: 55.0 },
        { lon: 69.5, lat: 56.1 },
        { lon: 65.5, lat: 57.2 },
        { lon: 60.6, lat: 56.8 },
        { lon: 61.4, lat: 55.2 },
        { lon: 56.0, lat: 54.7 },
        { lon: 50.1, lat: 53.2 },
        { lon: 45.0, lat: 53.2 },
        { lon: 39.7, lat: 54.6 },
        { lon: 37.6, lat: 55.8 },
        { lon: 35.9, lat: 56.9 },
        { lon: 30.3, lat: 59.9 },
        { lon: 34.3, lat: 61.8 },
        { lon: 34.5, lat: 62.9 },
        { lon: 32.4, lat: 67.2 },
        { lon: 33.1, lat: 69.0 }
      ]
    },
    {
      /* Ответвление: Пограничный (граница КНР) */
      kind: 'branch',
      points: [
        { lon: 131.9, lat: 43.8 },
        { lon: 131.4, lat: 44.4 }
      ]
    },
    {
      /* Ответвление: Благовещенск от Белогорска */
      kind: 'branch',
      points: [
        { lon: 128.5, lat: 50.9 },
        { lon: 127.5, lat: 50.3 }
      ]
    },
    {
      /* Ответвление: Забайкальск (А-350, юго-восток от Читы) */
      kind: 'branch',
      points: [
        { lon: 113.5, lat: 52.0 },
        { lon: 116.5, lat: 50.4 },
        { lon: 117.3, lat: 49.7 }
      ]
    },
    {
      /* А-360 «Лена» + Р-504 «Колыма»: Сковородино — Нерюнгри — Якутск — Магадан */
      kind: 'branch',
      points: [
        { lon: 123.9, lat: 54.0 },
        { lon: 124.7, lat: 55.2 },
        { lon: 124.7, lat: 56.7 },
        { lon: 125.4, lat: 58.6 },
        { lon: 126.3, lat: 59.0 },
        { lon: 129.9, lat: 62.0 },
        { lon: 129.7, lat: 62.0 },
        { lon: 135.6, lat: 62.7 },
        { lon: 143.2, lat: 64.6 },
        { lon: 148.2, lat: 62.8 },
        { lon: 150.8, lat: 59.6 }
      ]
    },
    {
      /* Ответвление: Москва — Новороссийск (М-4 «Дон») */
      kind: 'branch',
      points: [
        { lon: 37.6, lat: 55.8 },
        { lon: 38.5, lat: 51.7 },
        { lon: 39.7, lat: 47.2 },
        { lon: 37.8, lat: 44.7 }
      ]
    },
    {
      kind: 'crossing',
      points: [
        { lon: 131.4, lat: 44.4 },
        { lon: 131.2, lat: 44.4 }
      ]
    },
    {
      kind: 'crossing',
      points: [
        { lon: 127.5, lat: 50.3 },
        { lon: 127.5, lat: 50.2 }
      ]
    },
    {
      kind: 'crossing',
      points: [
        { lon: 117.3, lat: 49.7 },
        { lon: 117.4, lat: 49.6 }
      ]
    },
    /* -------- Россия: дополнительные ветки -------- */
    {
      /* М-4 «Дон»: Москва — Воронеж — Ростов-на-Дону — Краснодар — Новороссийск */
      kind: 'branch',
      points: [
        { lon: 37.6, lat: 55.8 },
        { lon: 39.2, lat: 51.7 },
        { lon: 39.7, lat: 47.2 },
        { lon: 39.0, lat: 45.0 },
        { lon: 37.8, lat: 44.7 }
      ]
    },
    {
      /* М-1 «Беларусь» / Е30: Москва — Смоленск — (Беларусь — Литва) — Калининград */
      kind: 'branch',
      points: [
        { lon: 37.6, lat: 55.8 },
        { lon: 32.0, lat: 54.8 },
        { lon: 28.5, lat: 54.6 },
        { lon: 24.0, lat: 54.7 },
        { lon: 20.4, lat: 54.7 }
      ]
    },
    /* -------- Китай: основные автострады -------- */
    {
      /* G1/G12 «Цзинхэ»: Пекин — Шэньян — Чанчунь — Харбин — Муданьцзян — Суйфэньхэ (граница РФ) */
      kind: 'china',
      points: [
        { lon: 116.4, lat: 39.9 },
        { lon: 117.2, lat: 39.1 },
        { lon: 120.7, lat: 40.8 },
        { lon: 123.4, lat: 41.8 },
        { lon: 125.3, lat: 43.9 },
        { lon: 126.6, lat: 45.8 },
        { lon: 129.6, lat: 44.6 },
        { lon: 131.2, lat: 44.4 }
      ]
    },
    {
      /* G111/G10: Харбин — Хэйхэ (граница РФ с Благовещенском) */
      kind: 'china',
      points: [
        { lon: 126.6, lat: 45.8 },
        { lon: 126.6, lat: 47.4 },
        { lon: 127.5, lat: 50.2 }
      ]
    },
    {
      /* G301 / G10: Харбин — Цицикар — Хайлар — Маньчжурия (граница РФ — Забайкальск) */
      kind: 'china',
      points: [
        { lon: 126.6, lat: 45.8 },
        { lon: 123.9, lat: 47.4 },
        { lon: 120.0, lat: 48.6 },
        { lon: 119.7, lat: 49.2 },
        { lon: 117.4, lat: 49.6 }
      ]
    },
    {
      /* G3: Шэньян — Далянь */
      kind: 'china',
      points: [
        { lon: 123.4, lat: 41.8 },
        { lon: 122.0, lat: 40.1 },
        { lon: 121.6, lat: 38.9 }
      ]
    },
    {
      /* G2 «Цзинху»: Пекин — Цзинань — Нанкин — Шанхай */
      kind: 'china',
      points: [
        { lon: 116.4, lat: 39.9 },
        { lon: 116.5, lat: 38.0 },
        { lon: 117.0, lat: 36.7 },
        { lon: 117.1, lat: 34.3 },
        { lon: 118.8, lat: 32.1 },
        { lon: 120.2, lat: 30.3 },
        { lon: 121.5, lat: 31.2 }
      ]
    },
    {
      /* Китай: Суйфэньхэ — Харбин — Чанчунь — Шэньян — Пекин */
      kind: 'branch',
      points: [
        { lon: 131.2, lat: 44.4 },
        { lon: 126.6, lat: 45.8 },
        { lon: 125.3, lat: 43.9 },
        { lon: 123.4, lat: 41.8 },
        { lon: 116.4, lat: 39.9 }
      ]
    },
    {
      /* Китай: Хэйхэ — Харбин */
      kind: 'branch',
      points: [
        { lon: 127.5, lat: 50.2 },
        { lon: 126.6, lat: 45.8 }
      ]
    },
    {
      /* Китай: Маньчжурия — Пекин */
      kind: 'branch',
      points: [
        { lon: 117.4, lat: 49.6 },
        { lon: 115.9, lat: 43.6 },
        { lon: 116.4, lat: 39.9 }
      ]
    },
    {
      /* Китай: Пекин — Циндао */
      kind: 'branch',
      points: [
        { lon: 116.4, lat: 39.9 },
        { lon: 120.4, lat: 36.1 }
      ]
    },
    {
      /* Китай: Пекин — Шанхай */
      kind: 'branch',
      points: [
        { lon: 116.4, lat: 39.9 },
        { lon: 118.8, lat: 32.1 },
        { lon: 121.5, lat: 31.2 }
      ]
    },
    {
      /* G4 «Цзинган'ao»: Пекин — Ухань — Чанша — Гуанчжоу — Шэньчжэнь */
      kind: 'china',
      points: [
        { lon: 116.4, lat: 39.9 },
        { lon: 114.5, lat: 38.0 },
        { lon: 113.7, lat: 34.8 },
        { lon: 114.3, lat: 30.6 },
        { lon: 113.0, lat: 28.2 },
        { lon: 113.2, lat: 23.1 },
        { lon: 114.1, lat: 22.5 }
      ]
    },
    /* -------- Корея: основные шоссе -------- */
    {
      /* Сеул — Тэджон — Тэгу — Пусан (Gyeongbu Expressway) */
      kind: 'korea',
      points: [
        { lon: 127.0, lat: 37.6 },
        { lon: 127.4, lat: 36.3 },
        { lon: 128.6, lat: 35.9 },
        { lon: 129.1, lat: 35.2 }
      ]
    },
    {
      /* Сеул — Инчхон (Gyeongin Expressway) */
      kind: 'korea',
      points: [
        { lon: 127.0, lat: 37.6 },
        { lon: 126.7, lat: 37.5 }
      ]
    },
    /* -------- Япония: основные автострады -------- */
    {
      /* Томэй / Мэйсин (Токай): Токио — Нагоя — Осака — Кобе */
      kind: 'japan',
      points: [
        { lon: 139.7, lat: 35.7 },
        { lon: 138.4, lat: 35.1 },
        { lon: 136.9, lat: 35.2 },
        { lon: 135.5, lat: 34.7 },
        { lon: 135.2, lat: 34.7 }
      ]
    },
    {
      /* Сан'ё: Кобе — Хиросима — Симоносеки — Фукуока */
      kind: 'japan',
      points: [
        { lon: 135.2, lat: 34.7 },
        { lon: 133.1, lat: 34.2 },
        { lon: 132.5, lat: 34.4 },
        { lon: 130.9, lat: 33.9 },
        { lon: 130.4, lat: 33.6 }
      ]
    },
    {
      /* Тохоку: Токио — Сэндай — Аомори */
      kind: 'japan',
      points: [
        { lon: 139.7, lat: 35.7 },
        { lon: 140.9, lat: 38.3 },
        { lon: 140.7, lat: 40.8 }
      ]
    },
    {
      /* Хоккайдо: Аомори — Хакодате — Саппоро */
      kind: 'japan',
      points: [
        { lon: 140.7, lat: 40.8 },
        { lon: 140.7, lat: 41.8 },
        { lon: 141.4, lat: 43.1 }
      ]
    },
    {
      /* G15 «Шэньхай»: Шанхай — Фучжоу — Шэньчжэнь */
      kind: 'china',
      points: [
        { lon: 121.5, lat: 31.2 },
        { lon: 119.3, lat: 26.1 },
        { lon: 114.1, lat: 22.5 }
      ]
    }
  ];

  var SEA_ROUTES = [
    {
      name: 'Владивосток — Пусан',
      points: [
        [131.9, 43.1],
        [131.0, 40.7],
        [130.0, 37.8],
        [129.1, 35.2]
      ]
    },
    {
      name: 'Владивосток — Йокогама',
      points: [
        [131.9, 43.1],
        [133.2, 41.0],
        [136.4, 38.5],
        [138.4, 36.6],
        [139.6, 35.4]
      ]
    },
    {
      name: 'Шанхай — Пусан',
      points: [
        [121.5, 31.2],
        [123.2, 32.6],
        [125.7, 34.0],
        [127.6, 34.7],
        [129.1, 35.2]
      ]
    },
    {
      name: 'Шанхай — Йокогама',
      points: [
        [121.5, 31.2],
        [127.0, 29.5],
        [133.0, 29.5],
        [137.0, 33.0],
        [139.6, 35.4]
      ]
    },
    {
      /* Через Корейский пролив, Тайваньский пролив, ЮКМ, Малаккский пролив */
      name: 'Владивосток — Ченнаи',
      points: [
        [131.9, 43.1],
        [131.2, 40.5],
        [129.8, 37.0],
        [128.4, 34.6],
        [126.1, 31.8],
        [123.0, 28.4],
        [121.0, 24.5],
        [118.2, 20.0],
        [114.5, 15.0],
        [111.5, 10.0],
        [108.0, 6.0],
        [103.8, 1.5],
        [100.6, 2.2],
        [96.4, 5.5],
        [92.0, 8.8],
        [87.5, 10.8],
        [83.0, 11.8],
        [80.3, 13.1]
      ]
    },
    {
      /* Через Тайваньский пролив, ЮКМ, Малаккский пролив, вокруг юга Индии */
      name: 'Шанхай — Мумбаи',
      points: [
        [121.5, 31.2],
        [123.5, 28.0],
        [122.2, 24.0],
        [118.5, 18.5],
        [114.5, 12.0],
        [110.5, 7.0],
        [106.8, 3.2],
        [103.8, 1.2],
        [100.5, 2.0],
        [95.0, 5.2],
        [90.0, 7.0],
        [83.5, 6.5],
        [78.0, 6.2],
        [74.0, 8.8],
        [72.8, 13.0],
        [72.9, 19.1]
      ]
    },
    {
      /* Через Аравийское море, Аденский залив, Красное море, Суэц, Средиземное море, проливы, Чёрное море */
      name: 'Мумбаи — Новороссийск',
      points: [
        [72.9, 19.1],
        [66.0, 17.5],
        [60.0, 15.5],
        [54.0, 13.0],
        [48.5, 11.8],
        [44.5, 12.0],
        [43.0, 13.2],
        [42.7, 15.0],
        [43.0, 18.0],
        [41.8, 22.5],
        [38.5, 28.0],
        [32.3, 31.3],
        [30.0, 32.2],
        [30.6, 33.2],
        [28.5, 35.5],
        [25.0, 36.0],
        [24.0, 38.5],
        [26.0, 40.0],
        [28.8, 40.9],
        [29.0, 41.0],
        [31.0, 42.0],
        [34.5, 43.5],
        [37.8, 44.7]
      ]
    }
  ];

  function addGrid(svg) {
    function appendMeridian(lon) {
      var top = px(lon, LAT_MAX);
      var bottom = px(lon, LAT_MIN);
      svg.appendChild(el('line', {
        x1: fmt(top[0]),
        y1: fmt(top[1]),
        x2: fmt(bottom[0]),
        y2: fmt(bottom[1]),
        stroke: C_GRID,
        'stroke-width': '1'
      }));
    }

    for (var lon = 30; lon <= 180; lon += 30) {
      appendMeridian(lon);
    }

    appendMeridian(LON_MAX);

    for (var lat = 0; lat <= 80; lat += 20) {
      var left = px(LON_MIN, lat);
      var right = px(LON_MAX, lat);
      svg.appendChild(el('line', {
        x1: fmt(left[0]),
        y1: fmt(left[1]),
        x2: fmt(right[0]),
        y2: fmt(right[1]),
        stroke: C_GRID,
        'stroke-width': '1'
      }));
    }
  }

  function ringToPath(ring) {
    if (!ring || !ring.length) {
      return '';
    }

    var first = px(ring[0][0], ring[0][1]);
    var parts = ['M ' + fmt(first[0]) + ' ' + fmt(first[1])];
    var prevLon = normalizeLon(ring[0][0]);
    var prevPoint = first;

    for (var i = 1; i < ring.length; i += 1) {
      var lon = normalizeLon(ring[i][0]);
      var lat = ring[i][1];
      var point = px(lon, lat);

      if (Math.abs(lon - prevLon) > 180) {
        if (prevLon > lon) {
          parts.push('L ' + fmt(W) + ' ' + fmt(prevPoint[1]));
          parts.push('M 0.0 ' + fmt(point[1]));
        } else {
          parts.push('L 0.0 ' + fmt(prevPoint[1]));
          parts.push('M ' + fmt(W) + ' ' + fmt(point[1]));
        }
      }

      parts.push('L ' + fmt(point[0]) + ' ' + fmt(point[1]));
      prevLon = lon;
      prevPoint = point;
    }

    return parts.join(' ') + ' Z';
  }

  function polygonToPath(rings) {
    return rings.map(ringToPath).join(' ');
  }

  function polygonInView(rings) {
    var minLon = Infinity;
    var maxLon = -Infinity;
    var minLat = Infinity;
    var maxLat = -Infinity;

    for (var i = 0; i < rings.length; i += 1) {
      for (var j = 0; j < rings[i].length; j += 1) {
        var lon = normalizeLon(rings[i][j][0]);
        var lat = rings[i][j][1];
        minLon = Math.min(minLon, lon);
        maxLon = Math.max(maxLon, lon);
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
      }
    }

    return maxLon >= LON_MIN && minLon <= LON_MAX && maxLat >= LAT_MIN && minLat <= LAT_MAX;
  }

  function renderLabels(svg) {
    LABELS.forEach(function (label) {
      var point = px(label.lon, label.lat);
      svg.appendChild(txt(label.text, fmt(point[0]), fmt(point[1]), {
        'font-size': String(label.size),
        'font-weight': '600',
        opacity: label.opacity || '1',
        'text-anchor': label.anchor || 'middle'
      }));
    });
  }

  function renderPointLabels(svg) {
    var markers = [];
    var labels = [];

    CITY_POINTS.forEach(function (pointData) {
      var point = px(pointData.lon, pointData.lat);
      var isCapital = pointData.kind === 'capital';
      var baseRadius = isCapital ? 6 : 4.5;
      var marker = el('circle', {
        cx: fmt(point[0]),
        cy: fmt(point[1]),
        r: String(baseRadius),
        fill: isCapital ? C_CAPITAL : C_POINT,
        stroke: C_POINT_STROKE,
        'stroke-width': String(BASE_POINT_STROKE_WIDTH),
        'data-base-r': String(baseRadius),
        'data-base-stroke-width': String(BASE_POINT_STROKE_WIDTH)
      });
      marker._baseR = baseRadius;
      marker._baseStroke = BASE_POINT_STROKE_WIDTH;

      var baseFontSize = pointData.size || 16;
      var label = txt(pointData.text, fmt(point[0] + (pointData.dx || 0)), fmt(point[1] + (pointData.dy || 0)), {
        'font-size': String(baseFontSize),
        'font-weight': isCapital ? '700' : '600',
        'text-anchor': pointData.anchor || 'start',
        fill: isCapital ? C_CAPITAL : '#ffffff',
        stroke: C_LABEL_STROKE,
        'stroke-width': String(BASE_LABEL_STROKE_WIDTH),
        'stroke-linejoin': 'round',
        'paint-order': 'stroke fill',
        'data-base-font-size': String(baseFontSize),
        'data-base-stroke-width': String(BASE_LABEL_STROKE_WIDTH)
      });
      label._baseFontSize = baseFontSize;
      label._baseStroke = BASE_LABEL_STROKE_WIDTH;

      svg.appendChild(marker);
      svg.appendChild(label);
      markers.push(marker);
      labels.push(label);
    });

    return { markers: markers, labels: labels };
  }

  function getPointScale(container, baseDevicePixelRatio) {
    var size = Math.max(1, Math.min(container.offsetWidth || W, container.offsetHeight || W));
    var containerScale = Math.min(1, W / size);
    var currentDevicePixelRatio = window.devicePixelRatio || 1;
    var viewportScale = window.visualViewport && window.visualViewport.scale
      ? window.visualViewport.scale
      : 1;
    var zoomScale = Math.max(1, viewportScale * (currentDevicePixelRatio / (baseDevicePixelRatio || currentDevicePixelRatio)));
    return containerScale / zoomScale;
  }

  function getCachedNumeric(element, propName, attrName) {
    return element[propName] !== undefined
      ? element[propName]
      : parseFloat(element.getAttribute(attrName));
  }

  function resizePointLabels(container, markers, labels, baseDevicePixelRatio) {
    var scale = getPointScale(container, baseDevicePixelRatio);

    markers.forEach(function (marker) {
      var baseR      = getCachedNumeric(marker, '_baseR',      'data-base-r');
      var baseStroke = getCachedNumeric(marker, '_baseStroke', 'data-base-stroke-width');
      marker.setAttribute('r', fmt(baseR * scale));
      marker.setAttribute('stroke-width', fmt(baseStroke * scale));
    });

    labels.forEach(function (label) {
      var baseFontSize = getCachedNumeric(label, '_baseFontSize', 'data-base-font-size');
      var baseStroke   = getCachedNumeric(label, '_baseStroke',   'data-base-stroke-width');
      label.setAttribute('font-size', fmt(baseFontSize * scale));
      label.setAttribute('stroke-width', fmt(baseStroke * scale));
    });
  }

  function bindPointLabelScaling(container, renderedPoints) {
    var existingBinding = pointLabelScalingBindings.get(container);
    if (existingBinding) {
      if (existingBinding.resizeObserver) {
        existingBinding.resizeObserver.disconnect();
      }
      window.removeEventListener('resize', existingBinding.onResize);
      if (existingBinding.visualViewport) {
        existingBinding.visualViewport.removeEventListener('resize', existingBinding.onResize);
      }
    }

    var markers = renderedPoints.markers;
    var labels = renderedPoints.labels;
    var baseDevicePixelRatio = window.devicePixelRatio || 1;

    function onResize() {
      if (!container.isConnected) {
        return;
      }
      resizePointLabels(container, markers, labels, baseDevicePixelRatio);
    }

    var binding = {
      onResize: onResize,
      resizeObserver: null,
      visualViewport: window.visualViewport || null
    };

    if (typeof ResizeObserver !== 'undefined') {
      var ro = new ResizeObserver(onResize);
      ro.observe(container);
      binding.resizeObserver = ro;
    }

    window.addEventListener('resize', onResize);
    if (binding.visualViewport) {
      binding.visualViewport.addEventListener('resize', onResize);
    }
    pointLabelScalingBindings.set(container, binding);
    onResize();
  }

  function renderSeaRoutes(svg) {
    SEA_ROUTES.forEach(function (route) {
      var pixelPoints = route.points.map(function (p) {
        return px(p[0], p[1]);
      });
      var d = smoothPath(pixelPoints);
      if (!d) { return; }

      svg.appendChild(el('path', {
        d: d,
        fill: 'none',
        stroke: C_SEA_ROUTE_GLOW,
        'stroke-width': '3.4',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
      }));

      svg.appendChild(el('path', {
        d: d,
        fill: 'none',
        stroke: C_SEA_ROUTE_LINE,
        'stroke-width': '1.5',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
      }));
    });
  }

  function smoothPath(pixelPoints) {
    if (pixelPoints.length < 2) { return ''; }
    var d = 'M ' + fmt(pixelPoints[0][0]) + ' ' + fmt(pixelPoints[0][1]);
    for (var i = 1; i < pixelPoints.length - 1; i++) {
      var mx = (pixelPoints[i][0] + pixelPoints[i + 1][0]) / 2;
      var my = (pixelPoints[i][1] + pixelPoints[i + 1][1]) / 2;
      d += ' Q ' + fmt(pixelPoints[i][0]) + ' ' + fmt(pixelPoints[i][1]) + ' ' + fmt(mx) + ' ' + fmt(my);
    }
    var last = pixelPoints[pixelPoints.length - 1];
    d += ' L ' + fmt(last[0]) + ' ' + fmt(last[1]);
    return d;
  }

  function renderRoads(svg) {
    ROAD_ROUTES.forEach(function (route) {
      var pixelPoints = route.points.map(function (p) {
        return px(p.lon, p.lat);
      });
      var d = smoothPath(pixelPoints);
      if (!d) {
        return;
      }
      var isMain = route.kind === 'main';
      var isCrossing = route.kind === 'crossing';
      var isChina = route.kind === 'china';
      var isJapan = route.kind === 'japan';
      var isKorea = route.kind === 'korea';
      var dash = isCrossing ? '4 4' : '';
      var stroke = isCrossing ? 'rgba(255,255,255,0.90)'
        : isMain ? C_ROAD_LINE
          : isChina ? C_ROAD_CHINA
            : isJapan ? C_ROAD_JAPAN
              : isKorea ? C_ROAD_KOREA
                : C_ROAD_BRANCH_LINE;
      var attrs = {
        d: d,
        fill: 'none',
        stroke: stroke,
        'stroke-width': isCrossing ? '1.5' : (isMain ? '1.5' : '1.0'),
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
      };
      if (dash) {
        attrs['stroke-dasharray'] = dash;
      }
      svg.appendChild(el('path', attrs));
    });
  }

  function renderFeatures(svg, features) {
    features.forEach(function (feature) {
      if (!feature || !feature.geometry) {
        return;
      }

      var geometry = feature.geometry;
      var polygons = geometry.type === 'Polygon'
        ? [geometry.coordinates]
        : geometry.type === 'MultiPolygon'
          ? geometry.coordinates
          : [];

      polygons.forEach(function (polygon) {
        if (!polygonInView(polygon)) {
          return;
        }

        var path = polygonToPath(polygon);
        if (!path) {
          return;
        }

        svg.appendChild(el('path', {
          d: path,
          fill: C_LAND,
          stroke: C_BORDER,
          'stroke-width': '0.9',
          'stroke-linejoin': 'round',
          'fill-rule': 'evenodd'
        }));
      });
    });
  }

  function renderBaseSvg() {
    var svg = el('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      preserveAspectRatio: 'xMidYMid meet',
      role: 'img',
      'aria-label': 'Карта Pacific Star с автодорожными маршрутами России (белый), Китая (оранжевый), Японии (красный) и Южной Кореи (бирюзовый), приграничными переходами и ключевыми городами региона'
    });

    svg.classList.add('route-map-svg');
    svg.appendChild(el('rect', {
      width: W,
      height: H,
      fill: C_OCEAN
    }));

    addGrid(svg);
    return svg;
  }

  function renderFallback(svg) {
    renderSeaRoutes(svg);
    renderRoads(svg);
    renderLabels(svg);
    renderPointLabels(svg);
    svg.appendChild(txt('Не удалось загрузить геоданные карты', fmt(W / 2), fmt(H / 2), {
      'font-size': '26',
      'font-weight': '700'
    }));
  }

  function loadFeatures() {
    if (cachedFeatures) {
      return Promise.resolve(cachedFeatures);
    }

    return fetch(DATA_URL, { cache: 'no-cache' })
      .then(function (response) {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        return response.json();
      })
      .then(function (data) {
        cachedFeatures = data && Array.isArray(data.features) ? data.features : [];
        return cachedFeatures;
      });
  }

  function buildMap(container) {
    var svg = renderBaseSvg();
    container.innerHTML = '';
    container.appendChild(svg);
    container.setAttribute('aria-busy', 'true');

    loadFeatures()
      .then(function (features) {
        renderSeaRoutes(svg);
        renderFeatures(svg, features);
        renderRoads(svg);
        renderLabels(svg);
        var renderedPoints = renderPointLabels(svg);
        bindPointLabelScaling(container, renderedPoints);
      })
      .catch(function () {
        renderFallback(svg);
      })
      .finally(function () {
        container.removeAttribute('aria-busy');
      });
  }

  function init() {
    var container = document.getElementById('routeMapContainer');
    if (container) {
      buildMap(container);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
