/**
 * Pacific Star — World Map
 * ========================
 * Стилизованная SVG-карта мира в фирменной тёмно-синей палитре.
 */
(function () {
  'use strict';

  var W = 1200;
  var H = 660;
  var LON_MIN = -180;
  var LON_MAX = 180;
  var LAT_MAX = 85;
  var LAT_MIN = -60;

  var C_OCEAN = '#2b4d8a';
  var C_LAND = '#6a9fc8';
  var C_BORDER = '#9cc4e0';
  var C_GRID = 'rgba(255,255,255,0.12)';
  var C_LABEL = 'rgba(255,255,255,0.8)';

  var NS = 'http://www.w3.org/2000/svg';

  function px(lon, lat) {
    var x = (lon - LON_MIN) / (LON_MAX - LON_MIN) * W;
    var y = (LAT_MAX - lat) / (LAT_MAX - LAT_MIN) * H;
    return [x, y];
  }

  function polyStr(coords) {
    return coords.map(function (point) {
      var projected = px(point[0], point[1]);
      return projected[0].toFixed(1) + ',' + projected[1].toFixed(1);
    }).join(' ');
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

  /* Упрощённые контуры континентов для декоративной карты мира. */
  var NORTH_AMERICA = [
    [-168, 72], [-150, 70], [-135, 72], [-125, 68], [-114, 62], [-108, 56],
    [-102, 50], [-96, 49], [-90, 47], [-84, 44], [-80, 39], [-83, 31],
    [-92, 19], [-104, 18], [-112, 23], [-118, 30], [-124, 40], [-132, 48],
    [-145, 58], [-160, 64], [-168, 72]
  ];

  var GREENLAND = [
    [-73, 83], [-58, 81], [-42, 75], [-36, 68], [-42, 60], [-50, 58],
    [-58, 60], [-65, 66], [-70, 73], [-73, 83]
  ];

  var SOUTH_AMERICA = [
    [-81, 12], [-74, 8], [-70, 2], [-66, -8], [-61, -18], [-58, -28],
    [-56, -38], [-60, -50], [-68, -54], [-74, -45], [-78, -30], [-81, -14],
    [-81, 12]
  ];

  var EUROPE = [
    [-10, 36], [-5, 43], [2, 49], [10, 54], [18, 59], [28, 60], [35, 58],
    [40, 54], [36, 47], [28, 42], [18, 40], [8, 40], [0, 38], [-10, 36]
  ];

  var AFRICA = [
    [-17, 35], [-6, 37], [8, 36], [20, 33], [32, 31], [41, 18], [49, 11],
    [50, 2], [45, -10], [40, -20], [30, -31], [19, -35], [10, -35],
    [2, -29], [-5, -20], [-10, -5], [-15, 8], [-17, 20], [-17, 35]
  ];

  var ASIA = [
    [28, 36], [38, 42], [50, 50], [65, 56], [82, 60], [100, 62], [118, 58],
    [134, 50], [148, 47], [160, 56], [172, 61], [179, 55], [176, 48],
    [165, 42], [150, 35], [138, 26], [124, 18], [112, 12], [98, 10],
    [88, 20], [80, 24], [72, 28], [62, 28], [52, 26], [42, 28], [34, 32],
    [28, 36]
  ];

  var INDIA = [
    [68, 24], [74, 28], [82, 27], [88, 22], [84, 10], [77, 7], [72, 13], [68, 24]
  ];

  var SOUTHEAST_ASIA = [
    [95, 18], [102, 20], [108, 18], [112, 12], [110, 6], [105, 2], [100, 5], [95, 18]
  ];

  var JAPAN = [
    [129, 32], [134, 34], [139, 37], [143, 43], [146, 45], [142, 33], [136, 31], [129, 32]
  ];

  var BRITISH_ISLES = [
    [-10, 50], [-6, 52], [-3, 56], [-4, 59], [-8, 58], [-10, 54], [-10, 50]
  ];

  var MADAGASCAR = [
    [43, -12], [47, -15], [49, -22], [47, -28], [44, -24], [43, -12]
  ];

  var AUSTRALIA = [
    [112, -11], [123, -10], [136, -13], [149, -23], [153, -33], [145, -40],
    [132, -42], [120, -38], [113, -28], [112, -11]
  ];

  var NEW_ZEALAND = [
    [166, -35], [173, -38], [177, -44], [170, -47], [166, -42], [166, -35]
  ];

  var ANTARCTICA = [
    [-180, -60], [-150, -66], [-110, -68], [-70, -70], [-20, -72], [35, -71],
    [80, -69], [120, -66], [160, -64], [180, -60], [180, -85], [-180, -85], [-180, -60]
  ];

  var LANDMASSES = [
    NORTH_AMERICA,
    GREENLAND,
    SOUTH_AMERICA,
    EUROPE,
    AFRICA,
    ASIA,
    INDIA,
    SOUTHEAST_ASIA,
    JAPAN,
    BRITISH_ISLES,
    MADAGASCAR,
    AUSTRALIA,
    NEW_ZEALAND,
    ANTARCTICA
  ];

  var LABELS = [
    { text: 'Северная Америка', lon: -108, lat: 48, size: 22 },
    { text: 'Южная Америка', lon: -62, lat: -20, size: 20 },
    { text: 'Европа', lon: 15, lat: 51, size: 18 },
    { text: 'Африка', lon: 17, lat: 5, size: 22 },
    { text: 'Азия', lon: 100, lat: 42, size: 24 },
    { text: 'Австралия', lon: 134, lat: -26, size: 20 },
    { text: 'Атлантический океан', lon: -32, lat: 12, size: 18, opacity: 0.7 },
    { text: 'Тихий океан', lon: -150, lat: 2, size: 18, opacity: 0.7 },
    { text: 'Тихий океан', lon: 158, lat: 0, size: 18, opacity: 0.7 }
  ];

  function addGrid(svg) {
    for (var lon = -150; lon <= 150; lon += 30) {
      var p1 = px(lon, LAT_MAX);
      var p2 = px(lon, LAT_MIN);
      svg.appendChild(el('line', {
        x1: p1[0].toFixed(1),
        y1: p1[1].toFixed(1),
        x2: p2[0].toFixed(1),
        y2: p2[1].toFixed(1),
        stroke: C_GRID,
        'stroke-width': '1'
      }));
    }

    for (var lat = -30; lat <= 60; lat += 30) {
      var left = px(LON_MIN, lat);
      var right = px(LON_MAX, lat);
      svg.appendChild(el('line', {
        x1: left[0].toFixed(1),
        y1: left[1].toFixed(1),
        x2: right[0].toFixed(1),
        y2: right[1].toFixed(1),
        stroke: C_GRID,
        'stroke-width': '1'
      }));
    }
  }

  function buildMap(container) {
    var svg = el('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      preserveAspectRatio: 'xMidYMid meet',
      role: 'img',
      'aria-label': 'Карта мира Pacific Star'
    });
    svg.classList.add('route-map-svg');

    svg.appendChild(el('rect', {
      width: W,
      height: H,
      fill: C_OCEAN
    }));

    addGrid(svg);

    LANDMASSES.forEach(function (coords) {
      svg.appendChild(el('polygon', {
        points: polyStr(coords),
        fill: C_LAND,
        stroke: C_BORDER,
        'stroke-width': '1.2',
        'stroke-linejoin': 'round'
      }));
    });

    LABELS.forEach(function (label) {
      var point = px(label.lon, label.lat);
      svg.appendChild(txt(label.text, point[0].toFixed(1), point[1].toFixed(1), {
        'font-size': String(label.size),
        'font-weight': '600',
        opacity: label.opacity || '1'
      }));
    });

    container.innerHTML = '';
    container.appendChild(svg);
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
