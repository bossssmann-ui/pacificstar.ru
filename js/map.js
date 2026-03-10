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
  var C_ROUTE = 'rgba(255,209,102,0.92)';
  var C_ROUTE_GLOW = 'rgba(255,255,255,0.28)';

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
    { text: 'Санкт-Петербург', lon: 30.3, lat: 59.9, dx: 8, dy: -8 },
    { text: 'Новороссийск', lon: 37.8, lat: 44.7, dx: 8, dy: 18 },
    { text: 'Владивосток', lon: 131.9, lat: 43.1, dx: 8, dy: -8 },
    { text: 'Находка', lon: 132.9, lat: 42.8, dx: 8, dy: 18 },
    { text: 'Пекин', lon: 116.4, lat: 39.9, dx: -10, dy: -10, anchor: 'end', kind: 'capital' },
    { text: 'Шанхай', lon: 121.5, lat: 31.2, dx: 8, dy: 18 },
    { text: 'Циндао', lon: 120.4, lat: 36.1, dx: 8, dy: -8 },
    { text: 'Шэньчжэнь', lon: 114.1, lat: 22.5, dx: 8, dy: 18 },
    { text: 'Токио', lon: 139.7, lat: 35.7, dx: 8, dy: -8, kind: 'capital' },
    { text: 'Йокогама', lon: 139.6, lat: 35.4, dx: 8, dy: 18 },
    { text: 'Кобе', lon: 135.2, lat: 34.7, dx: -10, dy: 18, anchor: 'end' },
    { text: 'Сеул', lon: 127.0, lat: 37.6, dx: -10, dy: -10, anchor: 'end', kind: 'capital' },
    { text: 'Пусан', lon: 129.1, lat: 35.2, dx: 8, dy: 18 },
    { text: 'Инчхон', lon: 126.7, lat: 37.5, dx: -10, dy: 18, anchor: 'end' },
    { text: 'Нью-Дели', lon: 77.2, lat: 28.6, dx: 8, dy: -8, kind: 'capital' },
    { text: 'Мумбаи', lon: 72.9, lat: 19.1, dx: 8, dy: 18 },
    { text: 'Ченнаи', lon: 80.3, lat: 13.1, dx: 8, dy: 18 },
    { text: 'Колката', lon: 88.4, lat: 22.6, dx: 8, dy: -8 }
  ];

  var SEA_ROUTES = [
    {
      points: [
        [131.9, 43.1],
        [130.4, 40.6],
        [128.9, 38.1],
        [129.1, 35.2]
      ]
    },
    {
      points: [
        [131.9, 43.1],
        [135.2, 41.5],
        [138.1, 38.7],
        [139.6, 35.4]
      ]
    },
    {
      points: [
        [121.5, 31.2],
        [124.2, 33.4],
        [126.6, 34.5],
        [129.1, 35.2]
      ]
    },
    {
      points: [
        [121.5, 31.2],
        [126.8, 32.2],
        [133.1, 33.4],
        [139.6, 35.4]
      ]
    },
    {
      points: [
        [131.9, 43.1],
        [126.2, 36.5],
        [121.5, 31.2],
        [112.5, 19.8],
        [103.8, 7.4],
        [91.8, 9.5],
        [80.3, 13.1]
      ]
    },
    {
      points: [
        [121.5, 31.2],
        [112.5, 19.8],
        [103.8, 7.4],
        [91.8, 9.5],
        [72.9, 19.1]
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

  function routeToPath(points) {
    if (!points || points.length < 2) {
      return '';
    }

    var first = px(points[0][0], points[0][1]);
    var d = 'M ' + fmt(first[0]) + ' ' + fmt(first[1]);

    for (var i = 1; i < points.length; i += 1) {
      var point = px(points[i][0], points[i][1]);
      d += ' L ' + fmt(point[0]) + ' ' + fmt(point[1]);
    }

    return d;
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

  function renderSeaRoutes(svg) {
    SEA_ROUTES.forEach(function (route) {
      var path = routeToPath(route.points);
      if (!path) {
        return;
      }

      svg.appendChild(el('path', {
        d: path,
        fill: 'none',
        stroke: C_ROUTE_GLOW,
        'stroke-width': '11',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
      }));

      svg.appendChild(el('path', {
        d: path,
        fill: 'none',
        stroke: C_ROUTE,
        'stroke-width': '3.5',
        'stroke-dasharray': '12 12',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
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
      'aria-label': 'Карта Pacific Star с основными портовыми городами, столицами и символическими морскими маршрутами России, Китая, Японии, Южной Кореи и Индии'
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
    renderLabels(svg);
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
        renderSeaRoutes(svg);
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
