/**
 * Pacific Star — World Map
 * ========================
 * Точная SVG-карта мира на основе реальных GeoJSON-границ стран.
 */
(function () {
  'use strict';

  var W = 1200;
  var H = 660;
  var LON_MIN = -180;
  var LON_MAX = 180;
  var LAT_MAX = 85;
  var LAT_MIN = -85;

  var C_OCEAN = '#2b4d8a';
  var C_LAND = '#6a9fc8';
  var C_BORDER = '#9cc4e0';
  var C_GRID = 'rgba(255,255,255,0.12)';
  var C_LABEL = 'rgba(255,255,255,0.8)';

  var NS = 'http://www.w3.org/2000/svg';
  var DATA_URL = 'data/world-countries.geo.json?v=20260309';

  var cachedFeatures = null;

  function px(lon, lat) {
    var x = (lon - LON_MIN) / (LON_MAX - LON_MIN) * W;
    var y = (LAT_MAX - lat) / (LAT_MAX - LAT_MIN) * H;
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
    { text: 'Северная Америка', lon: -108, lat: 49, size: 22 },
    { text: 'Южная Америка', lon: -60, lat: -20, size: 20 },
    { text: 'Европа', lon: 18, lat: 54, size: 18 },
    { text: 'Африка', lon: 20, lat: 7, size: 22 },
    { text: 'Азия', lon: 97, lat: 43, size: 24 },
    { text: 'Австралия', lon: 135, lat: -26, size: 20 },
    { text: 'Тихий океан', lon: -148, lat: 2, size: 18, opacity: 0.65 },
    { text: 'Атлантический океан', lon: -28, lat: 12, size: 18, opacity: 0.65 },
    { text: 'Индийский океан', lon: 80, lat: -18, size: 18, opacity: 0.65 },
    { text: 'Тихий океан', lon: 154, lat: 0, size: 18, opacity: 0.65 }
  ];

  function addGrid(svg) {
    for (var lon = -150; lon <= 150; lon += 30) {
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

    for (var lat = -60; lat <= 60; lat += 30) {
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
    var prevLon = ring[0][0];
    var prevPoint = first;

    for (var i = 1; i < ring.length; i += 1) {
      var lon = ring[i][0];
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

  function renderLabels(svg) {
    LABELS.forEach(function (label) {
      var point = px(label.lon, label.lat);
      svg.appendChild(txt(label.text, fmt(point[0]), fmt(point[1]), {
        'font-size': String(label.size),
        'font-weight': '600',
        opacity: label.opacity || '1'
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
      'aria-label': 'Точная карта мира Pacific Star'
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
