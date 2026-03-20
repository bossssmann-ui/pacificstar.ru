/**
 * Pacific Star — Pure SVG Route Map  (v3 — multi-theme, expanded routes, city labels)
 * ======================================================================================
 * Self-contained inline SVG map — no external libraries, no tile requests.
 * Uses Mercator projection + bundled GeoJSON land polygons (map-geodata.js).
 * Three design themes: Navy (морская), Sapphire (сапфир), Amber (янтарь).
 * Animated dashed routes from Vladivostok hub; pulsing city markers; city labels.
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
    /* Hub */
    { name: 'Владивосток', lat: 43.1155, lon: 131.8855, hub: true,   type: 'sea',
      desc: 'Главный транспортный хаб',     lx:  12, ly: -12 },
    /* Russian Far East — sea / coastal routes */
    { name: 'Сахалин',     lat: 50.9,    lon: 142.7,    hub: false,  type: 'sea',
      desc: 'Морские грузоперевозки',       lx:  11, ly:  -8 },
    { name: 'Магадан',     lat: 59.5635, lon: 150.8135, hub: false,  type: 'sea',
      desc: 'Северный завоз',               lx:  11, ly:  -8 },
    { name: 'Камчатка',    lat: 53.0,    lon: 158.65,   hub: false,  type: 'sea',
      desc: 'Морские перевозки',            lx:  11, ly:  -8 },
    { name: 'Чукотка',     lat: 64.7,    lon: 177.5,    hub: false,  type: 'sea',
      desc: 'Арктические поставки',         lx: -11, ly:  -8 },
    /* Russia mainland — land / rail routes */
    { name: 'Хабаровск',   lat: 48.4827, lon: 135.0838, hub: false, type: 'land',
      desc: 'Транссибирская магистраль',    lx: -11, ly: -10 },
    { name: 'Новосибирск', lat: 54.9885, lon:  82.9357, hub: false, type: 'land',
      desc: 'Транзитный узел',              lx:  11, ly:  -8 },
    { name: 'Москва',      lat: 55.7558, lon:  37.6173, hub: false, type: 'land',
      desc: 'Федеральная логистика',        lx:  11, ly:  -8 },
    /* International — sea routes across Sea of Japan / Pacific */
    { name: 'Шанхай',      lat: 31.2304, lon: 121.4737, hub: false, type: 'sea',
      desc: 'Морские перевозки (Китай)',    lx: -12, ly:  -8 },
    { name: 'Сеул',        lat: 37.5665, lon: 126.9780, hub: false, type: 'sea',
      desc: 'Морские перевозки (Корея)',    lx: -12, ly:  17 },
    { name: 'Токио',       lat: 35.6762, lon: 139.6503, hub: false, type: 'sea',
      desc: 'Морские перевозки (Япония)',   lx:  11, ly:  17 }
  ];

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

  /* ---- Build the legend (bottom-left corner of SVG) ---- */
  function buildLegend(svg, theme) {
    var items = [
      { color: theme.routeSea,  dash: '8 8', label: getText('legendSea') },
      { color: theme.routeLand, dash: '5 5', label: getText('legendLand') }
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

      /* Ocean background. */
      svg.appendChild(el('rect', {
        width: SVG_W, height: SVG_H,
        fill: theme.ocean
      }));

      /* ---- Land layer ---- */
      var landG = el('g', { 'class': 'svg-map-land' });
      geoJson.features.forEach(function (feature) {
        var name     = feature.properties ? feature.properties.name : '';
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
      svg.appendChild(landG);

      /* ---- Route lines (hub → each destination) ---- */
      var hub = null;
      POINTS.forEach(function (p) { if (p.hub) { hub = p; } });
      var hx = lonToX(hub.lon);
      var hy = latToY(hub.lat);

      var routesG = el('g', { 'class': 'svg-map-routes' });
      POINTS.forEach(function (pt) {
        if (pt.hub) { return; }
        var tx  = lonToX(pt.lon);
        var ty  = latToY(pt.lat);
        /* Quadratic bezier arcing slightly northward. */
        var cpx = (hx + tx) / 2;
        var cpy = Math.min(hy, ty) - Math.abs(tx - hx) * 0.14;
        var routeColor = (pt.type === 'land') ? theme.routeLand : theme.routeSea;
        var dashArray  = (pt.type === 'land') ? '5 5' : '8 8';
        var strokeW    = (pt.type === 'land') ? '1.5' : '1.8';
        routesG.appendChild(el('path', {
          d: 'M' + hx.toFixed(1) + ' ' + hy.toFixed(1) +
             ' Q' + cpx.toFixed(1) + ' ' + cpy.toFixed(1) +
             ' ' + tx.toFixed(1) + ' ' + ty.toFixed(1),
          style: 'fill:none;stroke:' + routeColor +
                 ';stroke-width:' + strokeW +
                 ';stroke-opacity:0.82;stroke-dasharray:' + dashArray,
          'class': 'svg-map-route svg-map-route--' + (pt.type || 'sea')
        }));
      });
      svg.appendChild(routesG);

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
      svg.appendChild(markersG);

      /* ---- Legend ---- */
      buildLegend(svg, theme);

      /* ---- Insert into DOM ---- */
      container.innerHTML = '';
      container.appendChild(svg);

      /* ---- Tooltip ---- */
      var TOOLTIP_WIDTH = 200;
      var tooltip = document.createElement('div');
      tooltip.className = 'svg-map-tooltip';
      container.appendChild(tooltip);

      function getEventCoords(e) {
        var touch = e.touches && e.touches[0];
        return { x: touch ? touch.clientX : (e.clientX || 0),
                 y: touch ? touch.clientY : (e.clientY || 0) };
      }

      function showTooltip(markerEl, clientX, clientY) {
        var rect = container.getBoundingClientRect();
        tooltip.innerHTML =
          '<strong class="svg-map-tt-title">' + markerEl.dataset.name + '</strong>' +
          '<span class="svg-map-tt-desc">'    + markerEl.dataset.desc  + '</span>';
        tooltip.style.display = 'flex';
        var tx = clientX - rect.left + 14;
        if (tx + TOOLTIP_WIDTH > rect.width) { tx = clientX - rect.left - TOOLTIP_WIDTH - 4; }
        tooltip.style.left = tx + 'px';
        tooltip.style.top  = (clientY - rect.top - 10) + 'px';
      }

      function hideTooltip() {
        tooltip.style.display = 'none';
      }

      markersG.querySelectorAll('.svg-map-marker').forEach(function (g) {
        g.addEventListener('mouseenter', function (e) { showTooltip(g, e.clientX, e.clientY); });
        g.addEventListener('mousemove',  function (e) { showTooltip(g, e.clientX, e.clientY); });
        g.addEventListener('mouseleave', hideTooltip);
        g.addEventListener('focus', function () {
          var dot      = g.querySelector('.svg-map-dot');
          var svgRect  = svg.getBoundingClientRect();
          var cRect    = container.getBoundingClientRect();
          var scale    = svgRect.width / SVG_W;
          var cxPx     = parseFloat(dot.getAttribute('cx')) * scale + svgRect.left;
          var cyPx     = parseFloat(dot.getAttribute('cy')) * scale + svgRect.top;
          showTooltip(g, cxPx, cyPx + cRect.top - svgRect.top);
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
