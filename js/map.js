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
  var OFFSET_Y = Math.max(0, ((H - MAP_H) / 2) - 120);

  var C_OCEAN = '#2b4d8a';
  var C_LAND = '#6a9fc8';
  var C_BORDER = '#9cc4e0';
  var C_GRID = 'rgba(255,255,255,0.12)';
  var C_LABEL = 'rgba(255,255,255,0.8)';

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
    { text: 'Китай', lon: 106, lat: 35, size: 18 }
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
      'aria-label': 'Региональная карта Pacific Star от Калининграда до Чукотки'
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
        renderLabels(svg);
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
