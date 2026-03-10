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
  var BASE_POINT_STROKE_WIDTH = 2;
  var BASE_LABEL_STROKE_WIDTH = 3;
  var pointLabelScalingBindings = new WeakMap();

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
    var renderedPoints = {
      markers: [],
      labels: []
    };

    CITY_POINTS.forEach(function (pointData) {
      var point = px(pointData.lon, pointData.lat);
      var isCapital = pointData.kind === 'capital';
      var radius = isCapital ? 6 : 4.5;
      var dx = pointData.dx || 0;
      var dy = pointData.dy || 0;
      var fontSize = pointData.size || 16;
      var marker = el('circle', {
        cx: fmt(point[0]),
        cy: fmt(point[1]),
        r: String(radius),
        fill: isCapital ? C_CAPITAL : C_POINT,
        stroke: C_POINT_STROKE,
        'stroke-width': String(BASE_POINT_STROKE_WIDTH),
        'data-base-radius': String(radius),
        'data-base-stroke-width': String(BASE_POINT_STROKE_WIDTH)
      });

      svg.appendChild(marker);
      renderedPoints.markers.push(marker);

      var label = txt(pointData.text, fmt(point[0] + dx), fmt(point[1] + dy), {
        'font-size': String(fontSize),
        'font-weight': isCapital ? '700' : '600',
        'text-anchor': pointData.anchor || 'start',
        fill: isCapital ? C_CAPITAL : '#ffffff',
        stroke: C_LABEL_STROKE,
        'stroke-width': String(BASE_LABEL_STROKE_WIDTH),
        'stroke-linejoin': 'round',
        'paint-order': 'stroke fill',
        'data-base-font-size': String(fontSize),
        'data-base-stroke-width': String(BASE_LABEL_STROKE_WIDTH),
        'data-point-x': fmt(point[0]),
        'data-point-y': fmt(point[1]),
        'data-base-dx': String(dx),
        'data-base-dy': String(dy)
      });

      svg.appendChild(label);
      renderedPoints.labels.push(label);
    });

    return renderedPoints;
  }

  function getPointScale(container) {
    var rect = container.getBoundingClientRect();

    if (!rect.width || !rect.height) {
      return 1;
    }

    var fitScale = Math.min(rect.width / W, rect.height / H);

    /* Only shrink city markers and labels when the rendered map grows beyond the base SVG size. */
    if (!Number.isFinite(fitScale) || fitScale < 1) {
      return 1;
    }

    return 1 / fitScale;
  }

  function resizePointLabels(container, markers, labels) {
    var pointScale = getPointScale(container);

    markers.forEach(function (marker) {
      var baseRadius = Number(marker.getAttribute('data-base-radius'));
      var baseStrokeWidth = Number(marker.getAttribute('data-base-stroke-width'));

      marker.setAttribute('r', fmt(baseRadius * pointScale));
      marker.setAttribute('stroke-width', fmt(baseStrokeWidth * pointScale));
    });

    labels.forEach(function (label) {
      var baseFontSize = Number(label.getAttribute('data-base-font-size'));
      var baseStrokeWidth = Number(label.getAttribute('data-base-stroke-width'));
      var pointX = Number(label.getAttribute('data-point-x'));
      var pointY = Number(label.getAttribute('data-point-y'));
      var baseDx = Number(label.getAttribute('data-base-dx'));
      var baseDy = Number(label.getAttribute('data-base-dy'));

      label.setAttribute('x', fmt(pointX + (baseDx * pointScale)));
      label.setAttribute('y', fmt(pointY + (baseDy * pointScale)));
      label.setAttribute('font-size', fmt(baseFontSize * pointScale));
      label.setAttribute('stroke-width', fmt(baseStrokeWidth * pointScale));
    });
  }

  function bindPointLabelScaling(container, renderedPoints) {
    var existingBinding = pointLabelScalingBindings.get(container);

    if (existingBinding) {
      window.removeEventListener('resize', existingBinding.handleScaleUpdate);
      if (existingBinding.resizeObserver) {
        existingBinding.resizeObserver.disconnect();
      }
    }

    var resizeFrame = null;

    function handleScaleUpdate() {
      if (resizeFrame !== null) {
        return;
      }

      resizeFrame = window.requestAnimationFrame(function () {
        resizeFrame = null;
        resizePointLabels(container, renderedPoints.markers, renderedPoints.labels);
      });
    }
    window.addEventListener('resize', handleScaleUpdate);

    var resizeObserver = null;
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(handleScaleUpdate);
      resizeObserver.observe(container);
    }

    pointLabelScalingBindings.set(container, {
      handleScaleUpdate: handleScaleUpdate,
      resizeObserver: resizeObserver
    });

    handleScaleUpdate();
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
      'aria-label': 'Карта Pacific Star с основными портовыми городами и столицами России, Китая, Японии, Южной Кореи и Индии'
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
        var renderedPoints;
        renderFeatures(svg, features);
        renderLabels(svg);
        renderedPoints = renderPointLabels(svg);
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
