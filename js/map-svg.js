/**
 * Pacific Star — Pure SVG Route Map
 * ====================================
 * Self-contained inline SVG map — no external libraries, no tile requests.
 * Uses Mercator projection + bundled GeoJSON land polygons (map-geodata.js).
 * Animated dashed gold routes from Vladivostok hub; pulsing city markers.
 *
 * Replaces: vendor/leaflet.js + CartoDB tile layer.
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

  function mercY(lat) {
    var r = lat * Math.PI / 180;
    return Math.log(Math.tan(Math.PI / 4 + r / 2));
  }

  var MERC_TOP = mercY(LAT_MAX);
  var MERC_BOT = mercY(LAT_MIN);

  function lonToX(lon) {
    /* Normalise antimeridian-crossing coordinates (lon < 0 in east-Asia). */
    if (lon < 0) { lon += 360; }
    return (lon - LON_MIN) / (LON_MAX - LON_MIN) * SVG_W;
  }

  function latToY(lat) {
    return (MERC_TOP - mercY(lat)) / (MERC_TOP - MERC_BOT) * SVG_H;
  }

  /* ---- City data ---- */
  var POINTS = [
    { name: 'Владивосток', lat: 43.1155, lon: 131.8855, hub: true,
      desc: 'Главный транспортный хаб' },
    { name: 'Сахалин',     lat: 50.9,    lon: 142.7,    hub: false,
      desc: 'Морские грузоперевозки' },
    { name: 'Магадан',     lat: 59.5635, lon: 150.8135, hub: false,
      desc: 'Северный завоз' },
    { name: 'Камчатка',    lat: 53.0,    lon: 158.65,   hub: false,
      desc: 'Морские перевозки' },
    { name: 'Чукотка',     lat: 64.7,    lon: 177.5,    hub: false,
      desc: 'Арктические поставки' },
    { name: 'Москва',      lat: 55.7558, lon:  37.6173, hub: false,
      desc: 'Федеральная логистика' }
  ];

  /* ---- GeoJSON → SVG path helper ---- */
  var LON_PAD = 8;
  var LAT_PAD = 5;

  function ringToD(ring) {
    var parts = [];
    var first = true;
    for (var i = 0; i < ring.length; i++) {
      var lon = ring[i][0];
      var lat = ring[i][1];
      /* Normalise antimeridian longitudes before viewport test. */
      var normLon = lon < 0 ? lon + 360 : lon;
      if (
        lat < LAT_MIN - LAT_PAD || lat > LAT_MAX + LAT_PAD ||
        normLon < LON_MIN - LON_PAD || normLon > LON_MAX + LON_PAD
      ) {
        first = true; /* lift pen when we skip a point */
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
    xhr.onerror = function () {
      onError(new Error('GeoJSON request failed'));
    };
    xhr.send();
  }

  /* ---- Build and insert SVG map ---- */
  function buildSVGMap(container, geoJson) {
    if (!container || !geoJson) { return; }
    prepareContainer(container);

    try {
      /* Root SVG element. */
      var svg = el('svg', {
        viewBox: '0 0 ' + SVG_W + ' ' + SVG_H,
        width:   SVG_W,
        height:  SVG_H,
        preserveAspectRatio: 'xMidYMid meet',
        'class': 'svg-route-map',
        role:    'img',
        'aria-label': 'Карта логистических маршрутов Pacific Star'
      });

      /* Ocean background. */
      svg.appendChild(el('rect', {
        width: SVG_W, height: SVG_H,
        fill: '#0d1b3e'
      }));

      /* ---- Land layer ---- */
      var landG = el('g', { 'class': 'svg-map-land' });
      geoJson.features.forEach(function (feature) {
        var name     = feature.properties ? feature.properties.name : '';
        var isRussia = (name === 'Russia');
        var d        = featureToD(feature);
        if (!d) { return; }
        landG.appendChild(el('path', {
          d:     d,
          fill:           isRussia ? '#5d96c3' : '#17345f',
          'fill-opacity': isRussia ? '0.92'    : '0.82',
          stroke:         isRussia ? '#9fd5ff'  : 'rgba(255,255,255,0.22)',
          'stroke-width': isRussia ? '0.9'      : '0.6',
          'stroke-linejoin': 'round',
          'class': 'svg-map-country' + (isRussia ? ' svg-map-country--russia' : '')
        }));
      });
      svg.appendChild(landG);

      /* ---- Route lines (hub → each city) ---- */
      var hub = null;
      POINTS.forEach(function (p) { if (p.hub) { hub = p; } });
      var hx = lonToX(hub.lon);
      var hy = latToY(hub.lat);

      var routesG = el('g', { 'class': 'svg-map-routes' });
      POINTS.forEach(function (pt) {
        if (pt.hub) { return; }
        var tx = lonToX(pt.lon);
        var ty = latToY(pt.lat);
        /* Use a quadratic bezier so routes arc slightly northward. */
        var cpx = (hx + tx) / 2;
        var cpy = Math.min(hy, ty) - Math.abs(tx - hx) * 0.12;
        routesG.appendChild(el('path', {
          d:     'M' + hx.toFixed(1) + ' ' + hy.toFixed(1) +
                 ' Q' + cpx.toFixed(1) + ' ' + cpy.toFixed(1) +
                 ' ' + tx.toFixed(1) + ' ' + ty.toFixed(1),
          fill:           'none',
          stroke:         '#d4af37',
          'stroke-width': '1.8',
          'stroke-opacity': '0.78',
          'stroke-dasharray': '8 8',
          'class': 'svg-map-route'
        }));
      });
      svg.appendChild(routesG);

      /* ---- City markers ---- */
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
          fill:           'none',
          stroke:         pt.hub ? '#ffffff' : '#d4af37',
          'stroke-width': '1.5',
          'class': 'svg-map-pulse'
        }));
        /* Solid dot. */
        g.appendChild(el('circle', {
          cx: cx, cy: cy,
          r:  pt.hub ? '5' : '3.5',
          fill: pt.hub ? '#ffffff' : '#d4af37',
          'class': 'svg-map-dot'
        }));
        markersG.appendChild(g);
      });
      svg.appendChild(markersG);

      /* ---- Insert into DOM ---- */
      container.innerHTML = '';
      container.appendChild(svg);

      /* ---- Tooltip ---- */
      var TOOLTIP_WIDTH = 180;
      var tooltip = document.createElement('div');
      tooltip.className = 'svg-map-tooltip';
      container.appendChild(tooltip);

      function getEventCoords(e) {
        var touch = e.touches && e.touches[0];
        return { x: touch ? touch.clientX : (e.clientX || 0),
                 y: touch ? touch.clientY : (e.clientY || 0) };
      }

      function showTooltip(markerEl, clientX, clientY) {
        var rect  = container.getBoundingClientRect();
        tooltip.innerHTML =
          '<strong class="svg-map-tt-title">' + markerEl.dataset.name + '</strong>' +
          '<span class="svg-map-tt-desc">'    + markerEl.dataset.desc  + '</span>';
        tooltip.style.display = 'flex';
        /* Prevent tooltip from leaving the right edge. */
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
          var dot          = g.querySelector('.svg-map-dot');
          var svgRect      = svg.getBoundingClientRect();
          var containerRect = container.getBoundingClientRect();
          var scale = svgRect.width / SVG_W;
          var cxPx  = parseFloat(dot.getAttribute('cx')) * scale + svgRect.left;
          var cyPx  = parseFloat(dot.getAttribute('cy')) * scale + svgRect.top;
          showTooltip(g, cxPx, cyPx + containerRect.top - svgRect.top);
        });
        g.addEventListener('blur', hideTooltip);
        /* Touch: toggle on tap. */
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

  function initSVGMap() {
    var container = getMapContainer();
    if (!container) {
      console.warn('[map-svg.js] #svg-map-container / #leaflet-map container not found — map skipped.');
      return;
    }

    prepareContainer(container);
    loadGeoJson(
      function (geoJson) {
        buildSVGMap(container, geoJson);
      },
      function (err) {
        console.warn('[map-svg.js] GeoJSON load failed: ' + (err && err.message ? err.message : err));
        renderFallbackNotice(container, 'Карта маршрутов временно загружается. Если она не появилась, обновите страницу через несколько секунд.');
      }
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSVGMap);
  } else {
    initSVGMap();
  }
})();
