/**
 * Pacific Star — Interactive Route Map v2
 * Shows Russia + Asia-Pacific region with correct geography:
 *   Russia (mainland, Kamchatka, Sakhalin), China, Mongolia,
 *   Kazakhstan, Japan (Hokkaido + Honshu + Kyushu), Korea,
 *   with seas, country labels, animated routes and always-visible
 *   city name labels.
 *
 * Projection: equirectangular
 *   LON: 18°E – 195°E   (span = 177°)
 *   LAT: 22°N –  77°N   (span =  55°)
 *   SVG: 1200 × 560
 */
(function () {
  'use strict';

  var W = 1200, H = 560;
  var LON_MIN = 18,  LON_MAX = 195;   /* span = 177 */
  var LAT_MAX = 77,  LAT_MIN = 22;    /* span =  55 */

  /** Convert [lon, lat] → [svgX, svgY] */
  function px(lon, lat) {
    return [
      Math.round((lon - LON_MIN) / (LON_MAX - LON_MIN) * W),
      Math.round((LAT_MAX - lat) / (LAT_MAX - LAT_MIN) * H)
    ];
  }

  /** Build SVG `points` attribute string from [[lon,lat], ...] */
  function polyStr(coords) {
    return coords.map(function (p) {
      var c = px(p[0], p[1]);
      return c[0] + ',' + c[1];
    }).join(' ');
  }

  /* ─────────────────────────────────────────────────────────────────────
     LAND POLYGONS  (all coordinates as [lon, lat])
     Each polygon is drawn as an SVG <polygon>.
     Russia has Kamchatka and Sakhalin as separate polygons so the
     Sea of Okhotsk is visible as ocean between them.
     ───────────────────────────────────────────────────────────────────── */

  /**
   * Russia mainland
   * Trace: NW corner → N Arctic coast (E) → Chukotka → Koryak coast (S)
   *        → N Sea of Okhotsk (W) → Maritime Province coast (SW)
   *        → SE Russia/China border (Amur, simplified) → S border (W)
   *        → Caspian/Caucasus → W border (N) → close
   */
  var RUSSIA = [
    /* Western boundary going N */
    [20,54.5],[22,55],[27,60],[29,62],
    /* Kola Peninsula */
    [28,66],[33,70],[41,71],
    /* Arctic coast going E */
    [51,69],[60,68],[63,70.5],
    [68,73],[73,73],[80,73],[88,73],
    [100,77],[113,75],[119,73],
    [131,72],[140,72],
    /* Chukotka NE */
    [155,68],[160,65],[168,66.5],[173,67.5],[180,66.5],
    /* Koryak / Magadan coast going S */
    [177,64],[172,62],[168,63],[163,60],
    /* N Sea of Okhotsk coast (mainland) going W */
    [158,59],[152,58.5],[148,58],[144,54],[141,50],
    /* Maritime Province coast going SW */
    [135,45],[131,43],
    /* SE border (Russia–China along Ussuri/Amur, simplified) going NW */
    [131,48],[127,49.5],
    /* Southern border going W */
    [121,53],[107,50.5],[96,50],[87,49],[82,50.5],
    [59,51],[50,52],
    /* Caspian / Caucasus */
    [46,47],[46,44],[44,43],[40,43.5],
    [38.5,47],[38,48],[37,47],[35,46],[33,46.5],
    /* W border going N → close */
    [27,52],[24,54],[20,54.5]
  ];

  /** Kamchatka Peninsula — kept separate to reveal Sea of Okhotsk */
  var KAMCHATKA = [
    [163,60],[163,57.5],[162.5,55],[161.5,53],[160,51.2],[159.5,51],
    [158.5,52],[158,54],[157.5,57],[157,59.5],[160,60.5],[163,60]
  ];

  /** Sakhalin Island */
  var SAKHALIN = [
    [141.5,47.5],[142.5,48.5],[143,51],[143.3,53.5],[143,55],[142.5,55.2],
    [142,54.5],[141.5,52],[141,49],[141.5,47.5]
  ];

  /** Kazakhstan (northern part, borders Russia to south) */
  var KAZAKHSTAN = [
    [50,52],[59,51],[82,50.5],[87,48],
    [83,44],[75,41],[61,40],[52,44],[50,46],[50,52]
  ];

  /** Mongolia (between Russia and China) */
  var MONGOLIA = [
    [87,49],[96,50],[107,50.5],[119,52],
    [120,48],[115,44],[105,41],[91,43],[87,46],[87,49]
  ];

  /**
   * China — northern half (up to ~22°N, which is the map bottom).
   * Northern border coincides with Russia/Mongolia southern border.
   */
  var CHINA = [
    [87,45],[91,43],[105,41],[115,44],[120,48],
    [121,53],[127,49.5],[131,48],[131,43],[130,42],
    [128,38],[124,38],[124,33],[121,28],[122,26],[120,22],
    [113,22],[103,22],[97,24],[86,27],[78,30],[73,35],[73,39],
    [76,43],[82,44],[87,45]
  ];

  /** Korean Peninsula (N+S Korea combined) */
  var KOREA = [
    [124,38],[126,38],[130.5,38.5],[129.5,36],[128.5,34.5],
    [127,34.5],[126,35],[125,36.5],[124,38]
  ];

  /** Japan — Hokkaido */
  var HOKKAIDO = [
    [141,43],[142,43],[144,43.5],[145.5,44],[145.5,43.3],
    [145,42.8],[142.5,42.5],[141,43]
  ];

  /** Japan — Honshu (main island) */
  var HONSHU = [
    [130,33.5],[131,34.5],[134,34],[136,35],[138,35.5],[140,35.5],
    [141.5,38],[141.5,40.5],[140.5,41.5],[140.5,43],
    [138,37],[135.5,35.5],[133,35],[130,34],[130,33.5]
  ];

  /** Japan — Kyushu */
  var KYUSHU = [
    [129.5,31.5],[131,32.5],[132,32.5],[131,30.5],[130,31],[129.5,31.5]
  ];

  /* ─────────────────────────────────────────────────────────────────────
     CITIES
     type: 'mega' = city 1M+, 'port' = Far East port/border crossing,
           'special' = Yakutsk
     lp:  label position — 'r' right, 'l' left, 't' top, 'b' bottom
     ───────────────────────────────────────────────────────────────────── */
  var CITIES = [
    /* — Megacities 1M+ — */
    {id:'msc',  name:'Москва',         lat:55.75, lon:37.62,  type:'mega',    lp:'r'},
    {id:'spb',  name:'Санкт-Петербург',lat:59.95, lon:30.32,  type:'mega',    lp:'r'},
    {id:'nsk',  name:'Новосибирск',    lat:54.99, lon:82.92,  type:'mega',    lp:'b'},
    {id:'ekb',  name:'Екатеринбург',   lat:56.84, lon:60.63,  type:'mega',    lp:'t'},
    {id:'kzn',  name:'Казань',         lat:55.79, lon:49.12,  type:'mega',    lp:'b'},
    {id:'nnov', name:'Н. Новгород',    lat:56.33, lon:44.00,  type:'mega',    lp:'t'},
    {id:'chel', name:'Челябинск',      lat:55.15, lon:61.40,  type:'mega',    lp:'b'},
    {id:'sam',  name:'Самара',         lat:53.20, lon:50.15,  type:'mega',    lp:'b'},
    {id:'ufa',  name:'Уфа',           lat:54.74, lon:55.97,  type:'mega',    lp:'l'},
    {id:'rnd',  name:'Ростов-на-Дону', lat:47.23, lon:39.70,  type:'mega',    lp:'r'},
    {id:'omsk', name:'Омск',          lat:54.98, lon:73.37,  type:'mega',    lp:'b'},
    {id:'krsk', name:'Красноярск',    lat:56.01, lon:92.87,  type:'mega',    lp:'t'},
    {id:'vrn',  name:'Воронеж',       lat:51.67, lon:39.21,  type:'mega',    lp:'l'},
    {id:'prm',  name:'Пермь',         lat:58.00, lon:56.25,  type:'mega',    lp:'t'},
    {id:'vlg',  name:'Волгоград',     lat:48.71, lon:44.51,  type:'mega',    lp:'r'},
    /* — Far East ports & border crossings — */
    {id:'vvo',  name:'Владивосток',   lat:43.12, lon:131.87, type:'port',    lp:'l'},
    {id:'khv',  name:'Хабаровск',     lat:48.48, lon:135.08, type:'port',    lp:'r'},
    {id:'nkh',  name:'Находка',       lat:42.82, lon:132.87, type:'port',    lp:'r'},
    {id:'blg',  name:'Благовещенск',  lat:50.28, lon:127.53, type:'port',    lp:'l'},
    {id:'yta',  name:'Ю-Сахалинск',   lat:46.96, lon:142.73, type:'port',    lp:'r'},
    {id:'krs',  name:'Корсаков',      lat:46.63, lon:142.78, type:'port',    lp:'b'},
    {id:'pkc',  name:'Петропавловск-К',lat:53.01,lon:158.65, type:'port',    lp:'b'},
    {id:'mgd',  name:'Магадан',       lat:59.57, lon:150.79, type:'port',    lp:'t'},
    {id:'dyr',  name:'Анадырь',       lat:64.73, lon:177.51, type:'port',    lp:'l'},
    {id:'pvk',  name:'Певек',         lat:69.70, lon:170.27, type:'port',    lp:'b'},
    {id:'egv',  name:'Эгвекинот',     lat:66.32, lon:179.17, type:'port',    lp:'l'},
    /* — Special — */
    {id:'ykt',  name:'Якутск',        lat:62.04, lon:129.73, type:'special', lp:'l'}
  ];

  /* ─────────────────────────────────────────────────────────────────────
     TRADE ROUTES
     ───────────────────────────────────────────────────────────────────── */
  var ROUTES = [
    {from:'msc',  to:'nsk',  t:'land'},
    {from:'nsk',  to:'vvo',  t:'land'},
    {from:'nsk',  to:'ykt',  t:'land'},
    {from:'ykt',  to:'mgd',  t:'land'},
    {from:'vvo',  to:'krs',  t:'sea'},
    {from:'vvo',  to:'pkc',  t:'sea'},
    {from:'vvo',  to:'mgd',  t:'sea'},
    {from:'mgd',  to:'pvk',  t:'sea'},
    {from:'pvk',  to:'dyr',  t:'sea'},
    {from:'vvo',  to:'blg',  t:'land'},
    {from:'blg',  to:'khv',  t:'land'}
  ];

  /* ─────────────────────────────────────────────────────────────────────
     GEOGRAPHIC LABELS
     ───────────────────────────────────────────────────────────────────── */

  /** Water body labels (italic, light-blue) */
  var SEAS = [
    {lines:['Северный','Ледовитый океан'], lon:88,  lat:74.5},
    {lines:['Берингово','море'],           lon:183, lat:63.5},
    {lines:['Охотское','море'],            lon:151, lat:54.5},
    {lines:['Японское','море'],            lon:135, lat:40.5},
    {lines:['Тихий океан'],               lon:180, lat:47}
  ];

  /** Country name labels (semi-transparent, uppercase) */
  var COUNTRY_LABELS = [
    {text:'КИТАЙ',    lon:103, lat:35},
    {text:'МОНГОЛИЯ', lon:104, lat:46.5},
    {text:'ЯПОНИЯ',   lon:138, lat:36},
    {text:'КОРЕЯ',    lon:127.5, lat:36}
  ];

  /** Russia region labels (very faint) */
  var REGION_LABELS = [
    {lines:['ЕВРОПЕЙСКАЯ','РОССИЯ'],  lon:44,  lat:58},
    {lines:['ЗАПАДНАЯ','СИБИРЬ'],    lon:71,  lat:63},
    {lines:['ВОСТОЧНАЯ','СИБИРЬ'],   lon:112, lat:64.5},
    {lines:['ДАЛЬНИЙ','ВОСТОК'],     lon:140, lat:61.5},
    {lines:['АРКТИКА'],              lon:82,  lat:73.5}
  ];

  /* ─────────────────────────────────────────────────────────────────────
     SVG BUILDER
     ───────────────────────────────────────────────────────────────────── */
  var NS = 'http://www.w3.org/2000/svg';

  function el(tag, attrs) {
    var e = document.createElementNS(NS, tag);
    Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    return e;
  }

  function text(str, x, y, opts) {
    var t = el('text', Object.assign({x:x, y:y}, opts || {}));
    t.textContent = str;
    return t;
  }

  function buildMap(container) {
    /* Pre-compute SVG pixel positions for cities */
    CITIES.forEach(function (c) {
      var p = px(c.lon, c.lat);
      c.x = p[0]; c.y = p[1];
    });
    var byId = {};
    CITIES.forEach(function (c) { byId[c.id] = c; });

    /* ── Root SVG ── */
    var svg = el('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      role: 'img',
      'aria-label': 'Карта маршрутов Pacific Star: Россия, Дальний Восток, Азиатско-Тихоокеанский регион'
    });
    svg.classList.add('route-map-svg');

    /* ── Defs ── */
    var defs = document.createElementNS(NS, 'defs');

    /* Glow filter (port dots) */
    var glow = el('filter', {id:'ps-glow', x:'-50%', y:'-50%', width:'200%', height:'200%'});
    var gb = el('feGaussianBlur', {in:'SourceGraphic', stdDeviation:'3', result:'b'});
    var gm = el('feMerge', {});
    gm.appendChild(el('feMergeNode', {in:'b'}));
    gm.appendChild(el('feMergeNode', {in:'SourceGraphic'}));
    glow.appendChild(gb); glow.appendChild(gm);
    defs.appendChild(glow);

    /* Drop-shadow for city labels */
    var ds = el('filter', {id:'ps-ds', x:'-20%', y:'-20%', width:'140%', height:'140%'});
    ds.appendChild(el('feDropShadow', {dx:'0', dy:'0', stdDeviation:'2.5',
      'flood-color':'#000', 'flood-opacity':'1'}));
    defs.appendChild(ds);

    /* Inline animation keyframes */
    var style = document.createElementNS(NS, 'style');
    style.textContent = [
      '@keyframes ps-dash{to{stroke-dashoffset:0}}',
      '@keyframes ps-pulse{0%,100%{r:6;opacity:.8}55%{r:9;opacity:.3}}',
      '.ps-sea-route{stroke-dasharray:12 6;stroke-dashoffset:900;',
        'animation:ps-dash 7s linear infinite;}',
      '.ps-land-route{stroke-dasharray:14 7;stroke-dashoffset:900;',
        'animation:ps-dash 11s linear infinite;}',
      '.ps-port-ring{animation:ps-pulse 3s ease-in-out infinite;',
        'transform-box:fill-box;transform-origin:center;}'
    ].join('');
    defs.appendChild(style);

    svg.appendChild(defs);

    /* ── Ocean background ── */
    svg.appendChild(el('rect', {width:W, height:H, fill:'#071520'}));

    /* ── Helper: land polygon ── */
    function landPoly(pts, fill, stroke) {
      return el('polygon', {
        points: polyStr(pts),
        fill: fill,
        stroke: stroke || 'rgba(255,255,255,0.18)',
        'stroke-width': '0.8',
        'stroke-linejoin': 'round'
      });
    }

    /* ── Neighboring countries (draw before Russia so Russia is on top) ── */
    var COLOR_NEIGH = '#142340';
    svg.appendChild(landPoly(KAZAKHSTAN, COLOR_NEIGH));
    svg.appendChild(landPoly(MONGOLIA,   '#16284a'));
    svg.appendChild(landPoly(CHINA,      '#152240'));
    svg.appendChild(landPoly(KOREA,      '#16274a', 'rgba(255,255,255,0.22)'));
    svg.appendChild(landPoly(HONSHU,     '#16274a', 'rgba(255,255,255,0.22)'));
    svg.appendChild(landPoly(HOKKAIDO,   '#16274a', 'rgba(255,255,255,0.22)'));
    svg.appendChild(landPoly(KYUSHU,     '#16274a', 'rgba(255,255,255,0.22)'));

    /* ── Russia (brighter, on top) ── */
    var COLOR_RUSSIA = '#1e3f72';
    svg.appendChild(landPoly(RUSSIA,    COLOR_RUSSIA, 'rgba(255,255,255,0.25)'));
    svg.appendChild(landPoly(KAMCHATKA, COLOR_RUSSIA, 'rgba(255,255,255,0.25)'));
    svg.appendChild(landPoly(SAKHALIN,  COLOR_RUSSIA, 'rgba(255,255,255,0.25)'));

    /* Subtle warm Far-East highlight */
    svg.appendChild(el('rect', {
      x: String(px(107, 22)[0]), y: '0',
      width: String(W - px(107, 22)[0]), height: String(H),
      fill: 'rgba(245,166,35,0.04)'
    }));

    /* ── Sea labels ── */
    SEAS.forEach(function (s) {
      var c = px(s.lon, s.lat);
      s.lines.forEach(function (line, i) {
        svg.appendChild(text(line, c[0], c[1] + i * 13, {
          fill: 'rgba(100,185,255,0.38)',
          'font-size': '10',
          'font-family': 'Roboto,sans-serif',
          'font-style': 'italic',
          'text-anchor': 'middle',
          'pointer-events': 'none'
        }));
      });
    });

    /* ── Region labels (very faint, all-caps) ── */
    REGION_LABELS.forEach(function (rl) {
      var c = px(rl.lon, rl.lat);
      rl.lines.forEach(function (line, i) {
        svg.appendChild(text(line, c[0], c[1] + i * 10, {
          fill: 'rgba(255,255,255,0.10)',
          'font-size': '8.5',
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
      svg.appendChild(text(cl.text, c[0], c[1], {
        fill: 'rgba(255,255,255,0.32)',
        'font-size': '10',
        'font-family': 'Roboto,sans-serif',
        'font-weight': '700',
        'letter-spacing': '2',
        'text-anchor': 'middle',
        'pointer-events': 'none'
      }));
    });

    /* ── Trade-route lines ── */
    ROUTES.forEach(function (r) {
      var a = byId[r.from], b = byId[r.to];
      if (!a || !b) return;
      var isSea = (r.t === 'sea');
      var line = el('line', {
        x1: a.x, y1: a.y, x2: b.x, y2: b.y,
        stroke: isSea ? '#f5a623' : '#6ea8d8',
        'stroke-width': isSea ? '1.6' : '1.2',
        'stroke-opacity': isSea ? '0.55' : '0.45'
      });
      line.classList.add(isSea ? 'ps-sea-route' : 'ps-land-route');
      svg.appendChild(line);
    });

    /* ── City markers + permanent labels ── */
    CITIES.forEach(function (c) {
      var col = c.type === 'mega'    ? '#5aadff'
              : c.type === 'port'    ? '#f5a623'
              :                        '#4de8c2';

      /* Animated ring for ports and Yakutsk */
      if (c.type !== 'mega') {
        var ring = el('circle', {
          cx: c.x, cy: c.y, r: '7',
          fill: 'none',
          stroke: col,
          'stroke-width': '1.5',
          'stroke-opacity': '0.5'
        });
        ring.classList.add('ps-port-ring');
        svg.appendChild(ring);
      }

      /* Dot */
      svg.appendChild(el('circle', {
        cx: c.x, cy: c.y,
        r: c.type === 'port' ? '4' : (c.type === 'special' ? '5' : '4'),
        fill: col,
        stroke: 'rgba(255,255,255,0.75)',
        'stroke-width': '1.2',
        filter: c.type !== 'mega' ? 'url(#ps-glow)' : ''
      }));

      /* Label — always visible */
      var OFF = 7;
      var dx = OFF, dy = 4, anchor = 'start';
      if      (c.lp === 'l') { dx = -OFF;  anchor = 'end'; }
      else if (c.lp === 't') { dx = 0; dy = -OFF;  anchor = 'middle'; }
      else if (c.lp === 'b') { dx = 0; dy = OFF+8;  anchor = 'middle'; }

      svg.appendChild(text(c.name, c.x + dx, c.y + dy, {
        fill: 'rgba(255,255,255,0.92)',
        'font-size': '9',
        'font-family': 'Roboto,sans-serif',
        'font-weight': c.type === 'mega' ? '400' : '600',
        'text-anchor': anchor,
        filter: 'url(#ps-ds)',
        'pointer-events': 'none'
      }));
    });

    /* ── Legend (bottom-left) ── */
    var LX = 14, LY = H - 74;
    svg.appendChild(el('rect', {
      x: LX - 8, y: LY - 18, width: '172', height: '82',
      rx: '6', fill: 'rgba(7,21,32,0.80)',
      stroke: 'rgba(255,255,255,0.12)', 'stroke-width': '1'
    }));

    [
      {col:'#5aadff',  lbl:'Города 1 млн+'},
      {col:'#f5a623',  lbl:'Морские порты / КПП'},
      {col:'#4de8c2',  lbl:'Якутск — ключевой узел'}
    ].forEach(function (ld, i) {
      var cy = LY + i * 20;
      svg.appendChild(el('circle', {cx:LX+5, cy:cy, r:'4',
        fill:ld.col, stroke:'rgba(255,255,255,0.4)', 'stroke-width':'1'}));
      svg.appendChild(text(ld.lbl, LX + 15, cy + 4, {
        fill: 'rgba(255,255,255,0.70)',
        'font-size': '9',
        'font-family': 'Roboto,sans-serif'
      }));
    });

    /* route legend entry */
    svg.appendChild(el('line', {
      x1:LX, y1:LY+62, x2:LX+22, y2:LY+62,
      stroke:'#f5a623', 'stroke-width':'1.5', 'stroke-dasharray':'8 4'
    }));
    svg.appendChild(text('Морские маршруты', LX + 28, LY + 66, {
      fill:'rgba(255,255,255,0.70)',
      'font-size':'9',
      'font-family':'Roboto,sans-serif'
    }));

    container.appendChild(svg);
  }

  /* ── Init ── */
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
