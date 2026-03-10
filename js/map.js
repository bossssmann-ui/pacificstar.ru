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

  var NS = 'http://www.w3.org/2000/svg';
  var DATA_URL = 'data/world-countries.geo.json?v=20260309';

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
    { text: 'Калькутта', lon: 88.4, lat: 22.6, dx: 8, dy: -8 }
  ];

  var ROAD_ROUTES = [
    {
      /* М-ось: Владивосток — Мурманск */
      kind: 'main',
      points: [
        { lon: 131.9, lat: 43.1 },
        { lon: 131.9, lat: 43.8 },
        { lon: 135.1, lat: 48.5 },
        { lon: 132.9, lat: 48.8 },
        { lon: 130.7, lat: 49.5 },
        { lon: 128.5, lat: 50.9 },
        { lon: 128.1, lat: 51.4 },
        { lon: 113.5, lat: 52.0 },
        { lon: 107.6, lat: 51.8 },
        { lon: 104.3, lat: 52.3 },
        { lon: 92.9, lat: 56.0 },
        { lon: 82.9, lat: 55.0 },
        { lon: 73.4, lat: 55.0 },
        { lon: 68.9, lat: 57.1 },
        { lon: 60.6, lat: 56.8 },
        { lon: 61.4, lat: 55.2 },
        { lon: 56.0, lat: 54.7 },
        { lon: 49.1, lat: 55.8 },
        { lon: 44.0, lat: 56.3 },
        { lon: 37.6, lat: 55.8 },
        { lon: 30.3, lat: 59.9 },
        { lon: 34.3, lat: 61.8 },
        { lon: 33.1, lat: 69.0 }
      ]
    },
    {
      /* Ответвление: Находка */
      kind: 'branch',
      points: [
        { lon: 132.9, lat: 42.8 },
        { lon: 131.9, lat: 43.1 }
      ]
    },
    {
      /* Ответвление: Пограничный (граница КНР) */
      kind: 'branch',
      points: [
        { lon: 131.4, lat: 44.4 },
        { lon: 131.9, lat: 43.8 }
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
      /* Ответвление: Забайкальск (Р-258, юго-восток от Читы) */
      kind: 'branch',
      points: [
        { lon: 113.5, lat: 52.0 },
        { lon: 117.3, lat: 49.7 }
      ]
    },
    {
      /* Р-504 «Колыма»: Хабаровск — Комсомольск — Нерюнгри — Якутск — Магадан */
      kind: 'branch',
      points: [
        { lon: 135.1, lat: 48.5 },
        { lon: 136.9, lat: 50.6 },
        { lon: 124.7, lat: 56.7 },
        { lon: 129.7, lat: 62.0 },
        { lon: 150.8, lat: 59.6 }
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
    var d = 'M ' + fmt(first[0]) + ' ' + fmt(first[1]);
    var prevLon = normalizeLon(ring[0][0]);
    var prevPoint = first;

    for (var i = 1; i < ring.length; i += 1) {
      var lon = normalizeLon(ring[i][0]);
      var lat = ring[i][1];
      var point = px(lon, lat);

      if (Math.abs(lon - prevLon) > 180) {
        if (prevLon > lon) {
          d += ' L ' + fmt(W) + ' ' + fmt(prevPoint[1]);
          d += ' M 0.0 ' + fmt(point[1]);
        } else {
          d += ' L 0.0 ' + fmt(prevPoint[1]);
          d += ' M ' + fmt(W) + ' ' + fmt(point[1]);
        }
      }

      d += ' L ' + fmt(point[0]) + ' ' + fmt(point[1]);
      prevLon = lon;
      prevPoint = point;
    }

    return d + ' Z';
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
    CITY_POINTS.forEach(function (pointData) {
      var point = px(pointData.lon, pointData.lat);
      var isCapital = pointData.kind === 'capital';
      var radius = isCapital ? 6 : 4.5;
      var marker = el('circle', {
        cx: fmt(point[0]),
        cy: fmt(point[1]),
        r: String(radius),
        fill: isCapital ? C_CAPITAL : C_POINT,
        stroke: C_POINT_STROKE,
        'stroke-width': '2'
      });

      svg.appendChild(marker);
      svg.appendChild(txt(pointData.text, fmt(point[0] + (pointData.dx || 0)), fmt(point[1] + (pointData.dy || 0)), {
        'font-size': String(pointData.size || 16),
        'font-weight': isCapital ? '700' : '600',
        'text-anchor': pointData.anchor || 'start',
        fill: isCapital ? C_CAPITAL : '#ffffff',
        stroke: C_LABEL_STROKE,
        'stroke-width': '3',
        'stroke-linejoin': 'round',
        'paint-order': 'stroke fill'
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

  function renderRoadPath(svg, points, stroke, width, dashArray) {
    var pixelPoints = points.map(function (p) { return px(p.lon, p.lat); });
    var d = smoothPath(pixelPoints);
    if (!d) { return; }
    var attrs = {
      d: d,
      fill: 'none',
      stroke: stroke,
      'stroke-width': String(width),
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round'
    };
    if (dashArray) {
      attrs['stroke-dasharray'] = dashArray;
    }
    svg.appendChild(el('path', attrs));
  }

  function renderRoads(svg) {
    ROAD_ROUTES.forEach(function (route) {
      var isMain = route.kind === 'main';
      var isCrossing = route.kind === 'crossing';
      var stroke = isCrossing ? 'rgba(255,255,255,0.90)' : isMain ? C_ROAD_LINE : C_ROAD_BRANCH_LINE;
      var width = isMain ? 1.5 : 1.0;
      var dash = isCrossing ? '4 3' : null;
      renderRoadPath(svg, route.points, stroke, width, dash);
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
      'aria-label': 'Карта Pacific Star с автодорожными маршрутами России, приграничными переходами с Китаем и ключевыми городами России, Китая, Японии, Южной Кореи и Индии'
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

    return fetch(DATA_URL, { cache: 'force-cache' })
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
        renderFeatures(svg, features);
        renderRoads(svg);
        renderLabels(svg);
        renderPointLabels(svg);
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
