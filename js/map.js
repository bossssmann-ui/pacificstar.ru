/**
 * Pacific Star — Interactive Route Map v6
 * =========================================
 * v6 changes:
 *  - 60+ cities: Russian main cities, Far East ports, Arctic ports, border crossings,
 *    China industrial/port cities, Japan ports, South Korea, Singapore
 *  - Full federal highway network: М-10/М-11, М-4, М-7, М-5, М-12, Р-254, Р-255,
 *    Р-258, Р-297, А-370, Тюмень connections
 *  - Complete railway network: Транссиб, БАМ, southern, China, Japan, Korea lines
 *  - 19 sea routes covering Russian cabotage, Arctic, and international shipping
 *  - Animated "running light" SVG dash animations on all route types
 *
 * Projection: equirectangular  LON 22°–198°  LAT 1°–78°
 * SVG canvas: 1200 × 526  (176° / 77° aspect ratio)
 */
(function () {
  'use strict';

  var W = 1200, H = 526;
  var LON_MIN = 22,  LON_MAX = 198;
  var LAT_MAX = 78,  LAT_MIN = 1;

  function px(lon, lat) {
    return [
      Math.round((lon - LON_MIN) / (LON_MAX - LON_MIN) * W),
      Math.round((LAT_MAX - lat) / (LAT_MAX - LAT_MIN) * H)
    ];
  }

  function polyStr(coords) {
    return coords.map(function (p) {
      var c = px(p[0], p[1]);
      return c[0] + ',' + c[1];
    }).join(' ');
  }

  /* ═══════════════════════════════════════════════════════════════════
     LAND POLYGONS  — all coords as [lon, lat]
     ═══════════════════════════════════════════════════════════════════ */

  /* ── Russia mainland ─────────────────────────────────────────────── */
  var RUSSIA = [
    [28.5,60.2],[27.5,61.5],[28,63],[28.5,64],[29,65],
    [28,66.5],[29.5,67.5],[30,69],[32,69],[33.5,69.5],
    [37,69.8],[40,70.2],[41.5,70.5],
    [44,68.5],[46,68],[50,68.5],[52,69],[55,68.5],
    [57,68.5],[59,68.5],[57,69.5],[59,70],[60.5,70.5],
    [62,70],[64,70],[67,72.5],[68,73.5],[70,73.5],[72,73.5],
    [73,72.5],[74,73.5],[76,73.5],[78,73.5],[80,73.8],
    [84,74],[87,73.5],[92,76.5],[96,76],[100,77.5],[104,77.5],
    [107,76],[111,74.5],[113,74],
    [117,73.5],[122,72.5],[126,72],[129,72.5],
    [132,72.5],[136,73.5],[140,73],[142,72],
    [148,71],[150,71.5],[155,68.5],
    [158,68],[160,66.5],[163,66],[165,66.5],[168,66.5],
    [170,67.5],[175,67],[178,66],[180,65.5],
    [177,64],[174,63.5],[172,62],[168,63.5],[165,63],
    [163,61.5],[162,61],
    [160,60.5],[158,60],[154,58.5],[152,58.5],[148,58],[144,54.5],
    [141.5,52.5],[141,51.5],
    [140,50.5],[138,48],[135.5,46.5],[133,45.5],[131.5,43.2],
    [131.5,43],[130.5,43.8],[130,45],[129,47],[128,48.5],[127.5,49.5],
    [122,52],[120,53],[118,52.5],[113,51.5],[108,50.5],
    [107,50.5],[104,50],[99,50.5],[97,51],[90,50.5],
    [87,49.5],[84,51],[82,51],[80,51.5],
    [75,53],[71,54],[67,56],[63,58],[62,59],
    [60.5,57.5],[60,56.5],
    [58,55],[56,53.5],[54,51.5],[52,51],[50,52],
    [49,48.5],[50,47],[51,47],[51.5,46.5],[52,45],
    [51.5,44],[50,42.5],
    [49,43],[48,43.5],[47,43.5],[46,44.5],[44,45],
    [43,45.5],[41.5,47.5],[41,47.5],[40,48],[38,47.5],
    [37,47.5],[36,48.5],[34,50],[32,51.5],[30,52.5],
    [28,54],[26,55.5],[24,56.5],[25,58],[26,59],[27,59.5],[28.5,60.2]
  ];

  /* ── Kamchatka ────────────────────────────────────────────────────── */
  var KAMCHATKA = [
    [162,61],[163,60.5],
    [163.5,58],[163,56],[162.5,54.5],
    [161.5,53],[160.5,51.5],[159.5,51.2],
    [158.5,52],[158,54],[157.5,56],
    [157,58],[157.5,60],[159,61],[162,61]
  ];

  /* ── Sakhalin ─────────────────────────────────────────────────────── */
  var SAKHALIN = [
    [141.5,47.5],[142.5,48.5],[143,50],[143.3,52],[143.5,54],
    [143.2,55.2],[143,55.5],[142.5,55.2],[142,54.5],
    [141.5,52],[141,49],[141.5,47.5]
  ];

  /* ── Kurils (strip) ───────────────────────────────────────────────── */
  var KURILS = [
    [145.8,43.8],[146.5,44.0],[147.5,44.5],[148.5,45.2],
    [149.5,46.0],[150.5,46.5],[151.5,47.5],[152.5,47.8],
    [152.8,47.5],[151.8,46.8],[150.5,46.0],[149.5,45.5],
    [148.5,44.8],[147.5,44.0],[146.2,43.5],[145.8,43.8]
  ];

  /* ── Kazakhstan ──────────────────────────────────────────────────── */
  var KAZAKHSTAN = [
    [50,52],[52,51],[54,51.5],[56,53.5],[58,55],
    [60,56.5],[60.5,57.5],
    [62,59],[63,58],[67,56],[71,54],[75,53],
    [80,51.5],[82,51],[84,51],[87,49.5],[90,50.5],
    [84,45],[80,43],[76,43],[72,41],[68,40],
    [62,40],[56,41],[52,44],[51,46.5],[51,47],
    [50,47],[49,48.5],[50,52]
  ];

  /* ── Mongolia ────────────────────────────────────────────────────── */
  var MONGOLIA = [
    [87,49.5],[90,50.5],[97,51],[99,50.5],[104,50],
    [107,50.5],[108,50.5],[113,51.5],[118,52.5],[120,53],
    [122,52],[119,48],[117,47],[114,44],[109,42],
    [105,41],[100,41],[97,42],[93,43],[91,43.5],
    [88,46],[87,47],[87,49.5]
  ];

  /* ── China — extended south to 20°N for Guangdong ─────────────────── */
  var CHINA = [
    [87,45],[91,43.5],[93,43],[97,42],[100,41],[105,41],[109,42],
    [114,44],[117,47],[119,48],[122,52],[127.5,49.5],
    [128,48.5],[130,45],[130.5,43.8],[131.5,43],[130,42],
    [129.5,39],[126.5,38.5],[124,37.5],[122.5,37.5],
    [121.8,35.5],[121,32.5],[121.5,30],[122,28],
    [121.2,26.5],[120.5,24.8],
    [119.5,24.5],[118,24],[117,23.5],[116,22.8],
    [114.5,22.5],[114.2,22.2],[113.8,22],
    [111,20.5],[108.5,21],[108,21.5],[107,22],
    [104.5,22.5],[103,22.5],[100,22],[99,22.5],[97,24],
    [90,27.5],[86,28],[82,30],[79,34],[76,38],
    [73,38],[73,40],[72,41],[76,43],[80,43],
    [84,45],[87,45]
  ];

  /* ── Korean Peninsula ─────────────────────────────────────────────── */
  var KOREA = [
    [124.5,40.0],[125.5,39.8],[126.5,40.0],[127.0,41.0],
    [128.5,41.0],[129.5,42.0],
    [129.7,40.5],[129.5,38.5],[129.2,37.5],
    [129.0,35.5],[128.8,35.0],[128.4,34.8],
    [127.7,34.6],[127.2,34.4],
    [126.5,34.8],[126.2,35.2],[126.0,36.0],
    [126.4,36.8],[126.5,37.5],[126.0,38.5],
    [125.2,39.0],[124.5,40.0]
  ];

  /* ── Japan – Honshu ──────────────────────────────────────────────── */
  var HONSHU = [
    [130.5,33.8],[131.5,34.2],
    [133.5,34.0],[135.5,33.6],[136.5,34.0],[137.5,34.7],
    [138.5,35.1],[139.7,34.9],[140.7,35.7],
    [141.0,36.5],[141.5,38.2],[141.6,39.5],[141.5,40.5],
    [141.2,41.2],
    [140.3,41.5],[139.8,40.6],[138.8,39.0],
    [137.8,37.5],[136.8,37.0],[136.0,36.5],
    [135.5,35.6],[135.0,35.2],[134.0,35.2],
    [132.5,35.5],[131.5,34.5],[130.8,34.0],[130.5,33.8]
  ];

  /* ── Japan – Hokkaido ─────────────────────────────────────────────── */
  var HOKKAIDO = [
    [141.2,41.2],[141.5,42.0],[143.5,43.5],
    [145.0,43.5],[145.5,43.8],[144.5,44.2],
    [143.5,44.3],[142.0,45.5],[141.0,45.5],
    [140.2,44.8],[140.0,43.8],[140.5,42.5],[141.2,41.2]
  ];

  /* ── Japan – Kyushu ──────────────────────────────────────────────── */
  var KYUSHU = [
    [130.5,33.8],[131.0,33.6],[131.7,33.9],
    [131.5,32.7],[131.0,31.5],[130.6,31.4],
    [130.2,31.8],[129.5,32.2],[129.7,33.2],
    [130.2,33.7],[130.5,33.8]
  ];

  /* ── Japan – Shikoku ─────────────────────────────────────────────── */
  var SHIKOKU = [
    [132.1,34.1],[133.0,34.0],[133.7,33.5],
    [134.8,33.6],[135.0,34.1],[134.2,34.4],
    [133.2,34.5],[132.1,34.1]
  ];

  /* ── Taiwan ───────────────────────────────────────────────────────── */
  var TAIWAN = [
    [121.5,25.2],[121.9,24.5],[121.6,22.8],
    [120.8,21.9],[120.1,22.3],[120.0,23.5],
    [120.5,25.0],[121.5,25.2]
  ];

  /* ── SE Asia: Indochina + Malay Peninsula ─────────────────────────── */
  var SE_ASIA = [
    [100,22],[104.5,22.5],[107,22],[108,21.5],[108.5,21],[111,20.5],
    [108.5,18],[108.7,16],[109,13],[109.5,11],[109,10],[107.5,9],
    [105,9.5],[103.5,10.5],
    [103.8,3.5],[103.8,1.4],
    [103.5,1.2],[103.0,2],[102.5,3],
    [101.5,5],[100.5,6],[100.3,7],[99.5,8],[99,9],
    [98.5,10],[97.5,12],[97,14],[97.5,16],[97,18],
    [96.5,20],[97,22],
    [100,22]
  ];

  /* ═══════════════════════════════════════════════════════════════════
     CITIES
     type: 'mega' = Russian main cities
           'port' = Russian ports / border crossings
           'special' = Northern hub
           'cn' = Chinese cities    'jp' = Japanese cities
           'kr' = Korean cities     'sg' = Singapore
     ═══════════════════════════════════════════════════════════════════ */
  var CITIES = [
    /* ── Russian main cities (along Vladivostok→Moscow + major capitals) ── */
    {id:'msc',  name:'Москва',             lat:55.75, lon:37.62,  type:'mega', lp:'r'},
    {id:'spb',  name:'Санкт-Петербург',    lat:59.95, lon:30.32,  type:'mega', lp:'r'},
    {id:'nnov', name:'Н. Новгород',        lat:56.33, lon:44.00,  type:'mega', lp:'t'},
    {id:'kzn',  name:'Казань',             lat:55.79, lon:49.12,  type:'mega', lp:'b'},
    {id:'ufa',  name:'Уфа',               lat:54.74, lon:55.97,  type:'mega', lp:'l'},
    {id:'chel', name:'Челябинск',          lat:55.15, lon:61.40,  type:'mega', lp:'b'},
    {id:'ekb',  name:'Екатеринбург',       lat:56.84, lon:60.63,  type:'mega', lp:'t'},
    {id:'omsk', name:'Омск',               lat:54.98, lon:73.37,  type:'mega', lp:'b'},
    {id:'nsk',  name:'Новосибирск',        lat:54.99, lon:82.92,  type:'mega', lp:'t'},
    {id:'krsk', name:'Красноярск',         lat:56.01, lon:92.87,  type:'mega', lp:'t'},
    {id:'irk',  name:'Иркутск',            lat:52.29, lon:104.30, type:'mega', lp:'b'},
    {id:'uud',  name:'Улан-Удэ',           lat:51.83, lon:107.59, type:'mega', lp:'t'},
    {id:'cht',  name:'Чита',               lat:52.03, lon:113.50, type:'mega', lp:'t'},
    {id:'khv',  name:'Хабаровск',          lat:48.48, lon:135.08, type:'mega', lp:'r'},
    {id:'vvo',  name:'Владивосток',        lat:43.12, lon:131.87, type:'mega', lp:'l'},
    {id:'prm',  name:'Пермь',              lat:58.00, lon:56.25,  type:'mega', lp:'t'},
    {id:'sam',  name:'Самара',             lat:53.20, lon:50.15,  type:'mega', lp:'b'},
    {id:'rnd',  name:'Ростов-на-Дону',     lat:47.23, lon:39.70,  type:'mega', lp:'r'},
    {id:'vrn',  name:'Воронеж',            lat:51.67, lon:39.21,  type:'mega', lp:'l'},
    {id:'vlg',  name:'Волгоград',          lat:48.71, lon:44.51,  type:'mega', lp:'r'},
    {id:'tmn',  name:'Тюмень',             lat:57.15, lon:65.53,  type:'mega', lp:'t'},
    {id:'brn',  name:'Барнаул',            lat:53.35, lon:83.77,  type:'mega', lp:'b'},

    /* ── Russian Far East ports ── */
    {id:'nkh',  name:'Находка',            lat:42.82, lon:132.87, type:'port', lp:'r'},
    {id:'van',  name:'Ванино',             lat:49.09, lon:140.25, type:'port', lp:'r'},
    {id:'krs',  name:'Корсаков',           lat:46.63, lon:142.78, type:'port', lp:'r'},
    {id:'pkc',  name:'Петропавловск-К.',   lat:53.01, lon:158.65, type:'port', lp:'b'},
    {id:'mgd',  name:'Магадан',            lat:59.57, lon:150.79, type:'port', lp:'t'},
    {id:'hlm',  name:'Холмск',             lat:47.05, lon:142.05, type:'port', lp:'l'},
    {id:'vst',  name:'Восточный',          lat:42.75, lon:133.07, type:'port', lox:8, loy:17},
    {id:'dkr',  name:'Де-Кастри',          lat:51.47, lon:140.78, type:'port', lp:'r'},

    /* ── Russian Arctic ports ── */
    {id:'dyr',  name:'Анадырь',            lat:64.73, lon:177.51, type:'port', lp:'l'},
    {id:'pvk',  name:'Певек',              lat:69.70, lon:170.27, type:'port', lp:'b'},

    /* ── Border crossing cities ── */
    {id:'zbk',  name:'Забайкальск',        lat:49.65, lon:117.35, type:'port', lox:-9, loy:-12, anc:'end'},
    {id:'blg',  name:'Благовещенск',       lat:50.28, lon:127.53, type:'port', lp:'l'},
    {id:'pgr',  name:'Пограничный',        lat:44.40, lon:131.38, type:'port', lox:8, loy:-10},
    {id:'kyh',  name:'Кяхта',              lat:50.36, lon:106.45, type:'port', lp:'b'},

    /* ── Northern hub ── */
    {id:'ykt',  name:'Якутск',             lat:62.04, lon:129.73, type:'special', lp:'l'},

    /* ── China major industrial cities and ports ── */
    {id:'pek',  name:'Пекин',              lat:39.90, lon:116.39, type:'cn', lp:'l'},
    {id:'sha',  name:'Шанхай',             lat:31.23, lon:121.47, type:'cn', lp:'r'},
    {id:'gzh',  name:'Гуанчжоу',           lat:23.13, lon:113.27, type:'cn', lp:'l'},
    {id:'szn',  name:'Шэньчжэнь',          lat:22.55, lon:114.05, type:'cn', lox:-9, loy:15, anc:'end'},
    {id:'dln',  name:'Далянь',             lat:38.92, lon:121.63, type:'cn', lp:'b'},
    {id:'qd',   name:'Циндао',             lat:36.07, lon:120.38, type:'cn', lp:'r'},
    {id:'tjn',  name:'Тяньцзинь',          lat:39.13, lon:117.20, type:'cn', lox:-9, loy:15, anc:'end'},
    {id:'nb',   name:'Нинбо',              lat:29.87, lon:121.55, type:'cn', lox:8, loy:15},
    {id:'hkg',  name:'Гонконг',            lat:22.32, lon:114.17, type:'cn', lox:8, loy:-10},
    {id:'hrb',  name:'Харбин',             lat:45.75, lon:126.65, type:'cn', lp:'r'},
    {id:'sfh',  name:'Суйфэньхэ',          lat:44.38, lon:131.15, type:'cn', lp:'l'},
    {id:'mzl',  name:'Маньчжурия',         lat:49.60, lon:117.43, type:'cn', lox:-9, loy:15, anc:'end'},

    /* ── Japan major ports ── */
    {id:'tky',  name:'Токио',              lat:35.69, lon:139.69, type:'jp', lp:'r'},
    {id:'yok',  name:'Йокогама',           lat:35.44, lon:139.64, type:'jp', lox:8, loy:18},
    {id:'osa',  name:'Осака',              lat:34.69, lon:135.50, type:'jp', lox:9, loy:15},
    {id:'kob',  name:'Кобе',               lat:34.69, lon:135.19, type:'jp', lox:-9, loy:-11, anc:'end'},
    {id:'nag',  name:'Нагоя',              lat:35.18, lon:136.91, type:'jp', lox:0, loy:-13, anc:'middle'},
    {id:'fuk',  name:'Фукуока',            lat:33.59, lon:130.40, type:'jp', lp:'l'},
    {id:'ngt',  name:'Ниигата',            lat:37.92, lon:139.04, type:'jp', lp:'r'},

    /* ── South Korea ── */
    {id:'pus',  name:'Пусан',              lat:35.18, lon:129.08, type:'kr', lp:'r'},
    {id:'icn',  name:'Инчхон',             lat:37.46, lon:126.71, type:'kr', lp:'l'},

    /* ── Singapore ── */
    {id:'sgp',  name:'Сингапур',           lat:1.35,  lon:103.82, type:'sg', lp:'r'}
  ];

  /* ═══════════════════════════════════════════════════════════════════
     FEDERAL HIGHWAYS
     ═══════════════════════════════════════════════════════════════════ */
  var HIGHWAYS = [
    /* М-10/М-11: Москва → Санкт-Петербург */
    {from:'msc', to:'spb'},
    /* М-4 «Дон»: Москва → Воронеж → Ростов-на-Дону */
    {from:'msc', to:'vrn'},
    {from:'vrn', to:'rnd'},
    /* М-7 «Волга»: Москва → Н.Новгород → Казань → Уфа */
    {from:'msc', to:'nnov'},
    {from:'nnov',to:'kzn'},
    {from:'kzn', to:'ufa'},
    /* М-5 «Урал»: Москва → Самара → Уфа → Челябинск */
    {from:'msc', to:'sam'},
    {from:'sam', to:'ufa'},
    {from:'ufa', to:'chel'},
    /* М-12 «Восток»: Казань → Екатеринбург */
    {from:'kzn', to:'ekb'},
    /* Р-254 «Иртыш»: Челябинск → Омск → Новосибирск */
    {from:'chel',to:'omsk'},
    {from:'omsk',to:'nsk'},
    /* Р-255 «Сибирь»: Новосибирск → Красноярск → Иркутск */
    {from:'nsk', to:'krsk'},
    {from:'krsk',to:'irk'},
    /* Р-258 «Байкал»: Иркутск → Улан-Удэ → Чита */
    {from:'irk', to:'uud'},
    {from:'uud', to:'cht'},
    /* Р-297 «Амур»: Чита → Благовещенск → Хабаровск */
    {from:'cht', to:'blg'},
    {from:'blg', to:'khv'},
    /* А-370 «Уссури»: Хабаровск → Владивосток */
    {from:'khv', to:'vvo'},
    /* Тюмень connections: Екатеринбург → Тюмень → Омск */
    {from:'ekb', to:'tmn'},
    {from:'tmn', to:'omsk'}
  ];

  /* ═══════════════════════════════════════════════════════════════════
     RAILWAYS
     ═══════════════════════════════════════════════════════════════════ */
  var RAIL = [
    /* Транссибирская магистраль */
    {from:'msc', to:'nnov'},
    {from:'nnov',to:'prm'},
    {from:'prm', to:'ekb'},
    {from:'ekb', to:'tmn'},
    {from:'tmn', to:'omsk'},
    {from:'omsk',to:'nsk'},
    {from:'nsk', to:'krsk'},
    {from:'krsk',to:'irk'},
    {from:'irk', to:'uud'},
    {from:'uud', to:'cht'},
    {from:'cht', to:'khv'},
    {from:'khv', to:'vvo'},
    /* БАМ: Тайшет (near Красноярск) → Ванино */
    {from:'krsk',to:'van'},
    /* Москва → Казань (ветка) */
    {from:'msc', to:'kzn'},
    /* Южная: Москва → Воронеж → Ростов-на-Дону */
    {from:'msc', to:'vrn'},
    {from:'vrn', to:'rnd'},
    /* Москва → Санкт-Петербург */
    {from:'msc', to:'spb'},
    /* Красноярск → Благовещенск (BAM connection) */
    {from:'krsk',to:'blg'},
    /* Благовещенск → Якутск (Amur-Yakutsk mainline) */
    {from:'blg', to:'ykt'},
    /* Хабаровск → Ванино (port access) */
    {from:'khv', to:'van'},
    /* Владивосток → Находка / Восточный (port branch) */
    {from:'vvo', to:'nkh'},
    {from:'nkh', to:'vst'},
    /* China railways */
    {from:'hrb', to:'mzl'},
    {from:'hrb', to:'sfh'},
    {from:'hrb', to:'dln'},
    {from:'pek', to:'sha'},
    {from:'sha', to:'gzh'},
    /* Korea */
    {from:'pus', to:'icn'},
    /* Japan: Shinkansen corridor + western extension */
    {from:'tky', to:'osa'},
    {from:'osa', to:'fuk'}
  ];

  /* ═══════════════════════════════════════════════════════════════════
     SEA ROUTES
     ═══════════════════════════════════════════════════════════════════ */
  var SEA = [
    /* Russian cabotage / Arctic */
    {from:'vvo', to:'krs'},
    {from:'vvo', to:'pkc'},
    {from:'vvo', to:'mgd'},
    {from:'mgd', to:'pvk'},
    {from:'pvk', to:'dyr'},
    {from:'vvo', to:'van'},
    {from:'van', to:'hlm'},
    /* International */
    {from:'vvo', to:'pus'},
    {from:'vvo', to:'ngt'},
    {from:'vvo', to:'dln'},
    {from:'nkh', to:'pus'},
    {from:'pus', to:'sha'},
    {from:'pus', to:'tky'},
    {from:'sha', to:'hkg'},
    {from:'hkg', to:'sgp'},
    {from:'sha', to:'sgp'},
    /* China coastal */
    {from:'dln', to:'qd'},
    {from:'qd',  to:'sha'},
    /* Japanese coastal */
    {from:'tky', to:'osa'}
  ];

  /* ═══════════════════════════════════════════════════════════════════
     GEOGRAPHIC LABELS
     ═══════════════════════════════════════════════════════════════════ */
  var SEAS = [
    {lines:['Северный','Ледовитый океан'],   lon:92,   lat:75.5},
    {lines:['Берингово','море'],             lon:185,  lat:63.5},
    {lines:['Охотское','море'],              lon:151,  lat:55.0},
    {lines:['Японское','море'],              lon:134,  lat:40.0},
    {lines:['Жёлтое','море'],               lon:122,  lat:35.5},
    {lines:['Вост.-Китайское','море'],       lon:126,  lat:28.5},
    {lines:['Южно-Китайское','море'],        lon:113,  lat:14.0},
    {lines:['Тихий','океан'],               lon:178,  lat:45.0}
  ];

  var COUNTRY_LABELS = [
    {text:'РОССИЯ',     lon:95,    lat:65.5},
    {text:'КИТАЙ',      lon:103,   lat:33.0},
    {text:'МОНГОЛИЯ',   lon:104,   lat:46.0},
    {text:'КАЗАХСТАН',  lon:70,    lat:44.5},
    {text:'ЯПОНИЯ',     lon:135.0, lat:36.5},
    {text:'КОРЕЯ',      lon:127.5, lat:38.0},
    {text:'ВЬЕТНАМ',    lon:106,   lat:16.0},
    {text:'МАЛАЙЗИЯ',   lon:104,   lat:5.5}
  ];

  var REGION_LABELS = [
    {lines:['ЗАП.','СИБИРЬ'],   lon:71,  lat:63},
    {lines:['ВОС.','СИБИРЬ'],   lon:112, lat:64.5},
    {lines:['ДАЛ.','ВОСТОК'],   lon:140, lat:60.5}
  ];

  /* ═══════════════════════════════════════════════════════════════════
     SVG BUILDER
     ═══════════════════════════════════════════════════════════════════ */
  var NS = 'http://www.w3.org/2000/svg';

  function el(tag, attrs) {
    var e = document.createElementNS(NS, tag);
    Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    return e;
  }

  function txt(str, x, y, opts) {
    var t = el('text', Object.assign({x:x, y:y}, opts || {}));
    t.textContent = str;
    return t;
  }

  var TYPE_COLOR = {
    mega:    '#70c4ff',
    port:    '#f5a623',
    special: '#50e8c4',
    cn:      '#ff7070',
    jp:      '#ffd060',
    sg:      '#00ffcc',
    kr:      '#ff90c8'
  };
  var TYPE_RADIUS = { mega:3.5, port:4.5, special:5, cn:4, jp:4, sg:5.5, kr:4.5 };

  /* ═══════════════════════════════════════════════════════════════════
     CSS ANIMATION INJECTION
     ═══════════════════════════════════════════════════════════════════ */
  var stylesInjected = false;
  function injectStyles() {
    if (stylesInjected) return;
    stylesInjected = true;
    var css =
      '@keyframes ps-dash-hw{to{stroke-dashoffset:-20}}' +
      '@keyframes ps-dash-rail{to{stroke-dashoffset:-20}}' +
      '@keyframes ps-dash-sea{to{stroke-dashoffset:-20}}' +
      '.ps-hw{stroke-dasharray:8 12;animation:ps-dash-hw 1.05s linear infinite}' +
      '.ps-rail{stroke-dasharray:8 12;animation:ps-dash-rail 1.05s linear infinite}' +
      '.ps-sea{stroke-dasharray:8 12;animation:ps-dash-sea 1.05s linear infinite}';
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* ═══════════════════════════════════════════════════════════════════
     BUILD MAP
     ═══════════════════════════════════════════════════════════════════ */
  function buildMap(container) {
    injectStyles();

    CITIES.forEach(function (c) {
      var p = px(c.lon, c.lat);
      c.x = p[0]; c.y = p[1];
    });
    var byId = {};
    CITIES.forEach(function (c) { byId[c.id] = c; });

    /* ── Root SVG ── */
    var svg = el('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      preserveAspectRatio: 'xMidYMid meet',
      role: 'img',
      'aria-label': 'Карта маршрутов Pacific Star: Россия, Дальний Восток, АТР, Китай, Япония, Корея, Сингапур'
    });
    svg.classList.add('route-map-svg');

    /* ── Defs ── */
    var defs = document.createElementNS(NS, 'defs');

    var og = el('linearGradient', {id:'og', x1:'0%', y1:'0%', x2:'100%', y2:'100%'});
    og.appendChild(el('stop', {'offset':'0%',   'stop-color':'#071522'}));
    og.appendChild(el('stop', {'offset':'100%', 'stop-color':'#0c2038'}));
    defs.appendChild(og);

    var rg = el('linearGradient', {id:'rg', x1:'0%', y1:'100%', x2:'0%', y2:'0%'});
    rg.appendChild(el('stop', {'offset':'0%',   'stop-color':'#1e55a0'}));
    rg.appendChild(el('stop', {'offset':'100%', 'stop-color':'#163d7a'}));
    defs.appendChild(rg);

    var cg = el('linearGradient', {id:'cg', x1:'0%', y1:'0%', x2:'0%', y2:'100%'});
    cg.appendChild(el('stop', {'offset':'0%',   'stop-color':'#1a5e3e'}));
    cg.appendChild(el('stop', {'offset':'100%', 'stop-color':'#134a30'}));
    defs.appendChild(cg);

    var seag = el('linearGradient', {id:'seag', x1:'0%', y1:'0%', x2:'0%', y2:'100%'});
    seag.appendChild(el('stop', {'offset':'0%',   'stop-color':'#1a4530'}));
    seag.appendChild(el('stop', {'offset':'100%', 'stop-color':'#103525'}));
    defs.appendChild(seag);

    var gf = el('filter', {id:'gf', x:'-60%', y:'-60%', width:'220%', height:'220%'});
    var gb = el('feGaussianBlur', {in:'SourceGraphic', stdDeviation:'3.5', result:'b'});
    var gm = el('feMerge', {});
    gm.appendChild(el('feMergeNode', {in:'b'}));
    gm.appendChild(el('feMergeNode', {in:'SourceGraphic'}));
    gf.appendChild(gb); gf.appendChild(gm);
    defs.appendChild(gf);

    var ds = el('filter', {id:'ds', x:'-30%', y:'-30%', width:'160%', height:'160%'});
    ds.appendChild(el('feDropShadow', {dx:'0', dy:'0', stdDeviation:'2',
      'flood-color':'#000', 'flood-opacity':'0.95'}));
    defs.appendChild(ds);

    svg.appendChild(defs);

    /* ── Ocean ── */
    svg.appendChild(el('rect', {width:W, height:H, fill:'url(#og)'}));

    /* ── Helper: land polygon ── */
    function land(pts, fill, sw, op) {
      return el('polygon', {
        points: polyStr(pts),
        fill: fill,
        stroke: 'rgba(255,255,255,0.20)',
        'stroke-width': sw || '1',
        'stroke-linejoin': 'round',
        opacity: op || '1'
      });
    }

    /* ── Countries back→front ── */
    svg.appendChild(land(SE_ASIA,    'url(#seag)', '0.8'));
    svg.appendChild(land(KAZAKHSTAN, '#5a4830'));
    svg.appendChild(land(MONGOLIA,   '#6e4f28'));
    svg.appendChild(land(CHINA,      'url(#cg)', '1.2'));
    svg.appendChild(land(TAIWAN,     '#1b6878', '1'));
    svg.appendChild(land(KOREA,      '#3d2870', '1.2'));
    svg.appendChild(land(SHIKOKU,    '#1b5e72', '1'));
    svg.appendChild(land(HONSHU,     '#1b5e72', '1.2'));
    svg.appendChild(land(HOKKAIDO,   '#1b5e72', '1.2'));
    svg.appendChild(land(KYUSHU,     '#1b5e72', '1.2'));
    svg.appendChild(land(KURILS,     '#1b5e72', '0.8'));
    svg.appendChild(land(RUSSIA,     'url(#rg)', '1.5'));
    svg.appendChild(land(KAMCHATKA,  'url(#rg)', '1.5'));
    svg.appendChild(land(SAKHALIN,   '#1e55a0',  '1.2'));

    /* ── Sea labels ── */
    SEAS.forEach(function (s) {
      var c = px(s.lon, s.lat);
      s.lines.forEach(function (line, i) {
        svg.appendChild(txt(line, c[0], c[1] + i * 13, {
          fill: 'rgba(120,200,255,0.50)',
          'font-size': '10',
          'font-family': 'Roboto,sans-serif',
          'font-style': 'italic',
          'text-anchor': 'middle',
          'pointer-events': 'none'
        }));
      });
    });

    /* ── Region watermarks ── */
    REGION_LABELS.forEach(function (rl) {
      var c = px(rl.lon, rl.lat);
      rl.lines.forEach(function (line, i) {
        svg.appendChild(txt(line, c[0], c[1] + i * 11, {
          fill: 'rgba(255,255,255,0.10)',
          'font-size': '9',
          'font-family': 'Roboto,sans-serif',
          'font-weight': '700',
          'letter-spacing': '1.5',
          'text-anchor': 'middle',
          'pointer-events': 'none'
        }));
      });
    });

    /* ── Country labels ── */
    COUNTRY_LABELS.forEach(function (cl) {
      var c = px(cl.lon, cl.lat);
      svg.appendChild(txt(cl.text, c[0], c[1], {
        fill: 'rgba(210,235,255,0.58)',
        'font-size': '10',
        'font-family': 'Roboto,sans-serif',
        'font-weight': '700',
        'letter-spacing': '2',
        'text-anchor': 'middle',
        'pointer-events': 'none'
      }));
    });

    /* ── Highway routes (animated white semi-transparent) ── */
    HIGHWAYS.forEach(function (r) {
      var a = byId[r.from], b = byId[r.to];
      if (!a || !b) return;
      var line = el('line', {
        x1:a.x, y1:a.y, x2:b.x, y2:b.y,
        stroke: 'rgba(255,255,255,0.30)',
        'stroke-width': '1.2'
      });
      line.classList.add('ps-hw');
      svg.appendChild(line);
    });

    /* ── Rail routes (animated blue dashed) ── */
    RAIL.forEach(function (r) {
      var a = byId[r.from], b = byId[r.to];
      if (!a || !b) return;
      var line = el('line', {
        x1:a.x, y1:a.y, x2:b.x, y2:b.y,
        stroke: '#90d0f8',
        'stroke-width': '1.2',
        'stroke-opacity': '0.7'
      });
      line.classList.add('ps-rail');
      svg.appendChild(line);
    });

    /* ── Sea routes (animated orange) ── */
    SEA.forEach(function (r) {
      var a = byId[r.from], b = byId[r.to];
      if (!a || !b) return;
      var line = el('line', {
        x1:a.x, y1:a.y, x2:b.x, y2:b.y,
        stroke: '#f5a623',
        'stroke-width': '1.5',
        'stroke-opacity': '0.6'
      });
      line.classList.add('ps-sea');
      svg.appendChild(line);
    });

    /* ── City markers + labels ── */
    CITIES.forEach(function (c) {
      var col = TYPE_COLOR[c.type] || '#ffffff';
      var r   = TYPE_RADIUS[c.type] || 4;

      svg.appendChild(el('circle', {
        cx:c.x, cy:c.y, r:String(r + 2),
        fill:'rgba(0,0,0,0.52)'
      }));

      svg.appendChild(el('circle', {
        cx:c.x, cy:c.y, r:String(r),
        fill:col,
        stroke:'rgba(255,255,255,0.88)',
        'stroke-width':'1.4',
        filter: c.type !== 'mega' ? 'url(#gf)' : ''
      }));

      var OFF = 8;
      var dx, dy, anchor;
      if (c.lox !== undefined) {
        dx = c.lox;
        dy = c.loy !== undefined ? c.loy : 4;
        anchor = c.anc || (c.lox < 0 ? 'end' : c.lox === 0 ? 'middle' : 'start');
      } else if (c.lp === 'l') { dx = -OFF; dy = 4;      anchor = 'end';    }
      else if   (c.lp === 't') { dx = 0;    dy = -OFF;   anchor = 'middle'; }
      else if   (c.lp === 'b') { dx = 0;    dy = OFF+9;  anchor = 'middle'; }
      else                     { dx = OFF;  dy = 4;      anchor = 'start';  }

      var fs = (c.type === 'mega') ? 8.5 : 9;
      var lblW = c.name.length * fs * 0.57;
      var bx = anchor === 'end'   ? c.x + dx - lblW
             : anchor === 'start' ? c.x + dx
             :                      c.x - lblW / 2;
      svg.appendChild(el('rect', {
        x:bx - 2, y:c.y + dy - fs - 1,
        width:lblW + 4, height:fs + 3,
        rx:'2', fill:'rgba(0,0,0,0.58)'
      }));

      svg.appendChild(txt(c.name, c.x + dx, c.y + dy, {
        fill: '#ffffff',
        'font-size': String(fs),
        'font-family': 'Roboto,sans-serif',
        'font-weight': c.type === 'mega' ? '400' : '600',
        'text-anchor': anchor,
        'pointer-events': 'none'
      }));
    });

    /* ── Legend ─────────────────────────────────────────────────────── */
    var LX = 12, LY = H - 200;
    svg.appendChild(el('rect', {
      x:LX - 10, y:LY - 14, width:'224', height:'196',
      rx:'10', fill:'rgba(4,14,26,0.90)',
      stroke:'rgba(255,255,255,0.15)', 'stroke-width':'1'
    }));

    var legendDots = [
      {col: TYPE_COLOR.mega,    lbl:'Крупные города РФ'},
      {col: TYPE_COLOR.port,    lbl:'Порты РФ / пограничные КПП'},
      {col: TYPE_COLOR.special, lbl:'Якутск — северный узел'},
      {col: TYPE_COLOR.cn,      lbl:'Китайские порты и города'},
      {col: TYPE_COLOR.jp,      lbl:'Японские порты и города'},
      {col: TYPE_COLOR.kr,      lbl:'Корейские порты'},
      {col: TYPE_COLOR.sg,      lbl:'Сингапур'}
    ];
    legendDots.forEach(function (ld, i) {
      var cy = LY + i * 14;
      svg.appendChild(el('circle', {cx:LX+5, cy:cy, r:'4.5',
        fill:ld.col, stroke:'rgba(255,255,255,0.45)', 'stroke-width':'1'}));
      svg.appendChild(txt(ld.lbl, LX + 17, cy + 4, {
        fill:'rgba(255,255,255,0.82)',
        'font-size':'9',
        'font-family':'Roboto,sans-serif'
      }));
    });

    /* Route legend lines (animated) */
    var ry = LY + 7 * 14 + 8;

    var seaLine = el('line', {
      x1:LX, y1:ry, x2:LX+26, y2:ry,
      stroke:'#f5a623', 'stroke-width':'1.5'
    });
    seaLine.classList.add('ps-sea');
    svg.appendChild(seaLine);
    svg.appendChild(txt('Морские маршруты', LX + 32, ry + 4, {
      fill:'rgba(255,255,255,0.82)',
      'font-size':'9', 'font-family':'Roboto,sans-serif'
    }));

    var ry2 = ry + 16;
    var railLine = el('line', {
      x1:LX, y1:ry2, x2:LX+26, y2:ry2,
      stroke:'#90d0f8', 'stroke-width':'1.2'
    });
    railLine.classList.add('ps-rail');
    svg.appendChild(railLine);
    svg.appendChild(txt('Ж/д магистрали', LX + 32, ry2 + 4, {
      fill:'rgba(255,255,255,0.82)',
      'font-size':'9', 'font-family':'Roboto,sans-serif'
    }));

    var ry3 = ry2 + 16;
    var hwLine = el('line', {
      x1:LX, y1:ry3, x2:LX+26, y2:ry3,
      stroke:'rgba(255,255,255,0.30)', 'stroke-width':'1.2'
    });
    hwLine.classList.add('ps-hw');
    svg.appendChild(hwLine);
    svg.appendChild(txt('Автодороги', LX + 32, ry3 + 4, {
      fill:'rgba(255,255,255,0.82)',
      'font-size':'9', 'font-family':'Roboto,sans-serif'
    }));

    container.appendChild(svg);
  }

  function init() {
    var c = document.getElementById('routeMapContainer');
    if (c) { buildMap(c); }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
