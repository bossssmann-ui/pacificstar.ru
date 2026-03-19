/**
 * Pacific Star — Interactive Leaflet Map
 * =========================================
 * Premium dark map using local Leaflet assets and
 * bundled GeoJSON land polygons (inline via map-geodata.js).
 * Pulsing markers for key logistics hubs; animated
 * dashed polylines for routes from Vladivostok.
 *
 * Fix (2026-03-19): Added CartoDB Dark Matter tile layer —
 * without a tile layer Leaflet renders only the container
 * background colour (solid blue screen).
 */
(function () {
  'use strict';

  /* ---- Data ---- */
  var HUB_LAT = 43.1155;
  var HUB_LON = 131.8855;
  var HUB_COORDS = [HUB_LAT, HUB_LON];

  var POINTS = [
    { name: 'Владивосток',  lat: 43.1155, lon: 131.8855, hub: true,
      desc: 'Главный транспортный хаб' },
    { name: 'Сахалин',      lat: 50.9,    lon: 142.7,    hub: false,
      desc: 'Морские грузоперевозки' },
    { name: 'Магадан',      lat: 59.5635, lon: 150.8135, hub: false,
      desc: 'Северный завоз' },
    { name: 'Камчатка',     lat: 53.0,    lon: 158.65,   hub: false,
      desc: 'Морские перевозки' },
    { name: 'Чукотка',      lat: 64.7,    lon: 177.5,    hub: false,
      desc: 'Арктические поставки' },
    { name: 'Москва',       lat: 55.7558, lon:  37.6173, hub: false,
      desc: 'Федеральная логистика' }
  ];

  /* ---- Helpers ---- */
  function createMarkerIcon(isHub) {
    var size   = isHub ? 22 : 14;
    var anchor = size / 2;
    var cls    = 'leaflet-ps-marker' + (isHub ? ' leaflet-ps-marker--hub' : '');
    return L.divIcon({
      className: '',
      html: '<div class="' + cls + '"><span class="leaflet-ps-marker__pulse"></span></div>',
      iconSize:   [size, size],
      iconAnchor: [anchor, anchor],
      popupAnchor:[0, -(anchor + 6)]
    });
  }

  function buildPopup(point) {
    return (
      '<div class="leaflet-ps-popup">' +
        '<strong class="leaflet-ps-popup__title">' + point.name + '</strong>' +
        '<span class="leaflet-ps-popup__desc">'  + point.desc  + '</span>' +
      '</div>'
    );
  }

  function getFeatureStyle(feature) {
    var name = feature && feature.properties ? feature.properties.name : '';
    var isRussia = name === 'Russia';

    return {
      color: isRussia ? '#9fd5ff' : 'rgba(255, 255, 255, 0.22)',
      weight: isRussia ? 1.5 : 1,
      opacity: isRussia ? 0.95 : 0.65,
      fillColor: isRussia ? '#5d96c3' : '#17345f',
      fillOpacity: isRussia ? 0.92 : 0.82
    };
  }

  function addLandLayer(map) {
    /* Use inline GeoJSON bundled in map-geodata.js (no fetch required). */
    var geoJson = window.WORLD_GEOJSON;
    if (!geoJson) {
      console.warn('[map.js] window.WORLD_GEOJSON not found — land layer skipped.');
      return;
    }
    try {
      L.geoJSON(geoJson, {
        pane: 'land',
        style: getFeatureStyle
      }).addTo(map);
    } catch (e) {
      console.warn('[map.js] Failed to render GeoJSON land layer: ' + (e && e.message ? e.message : e));
    }
  }

  function addRoutes(map) {
    POINTS.forEach(function (point) {
      if (point.hub) return;

      L.polyline(
        [HUB_COORDS, [point.lat, point.lon]],
        {
          color: '#d4af37',
          weight: 2,
          opacity: 0.75,
          dashArray: '8 8',
          className: 'leaflet-ps-route'
        }
      ).addTo(map);
    });
  }

  function addMarkers(map) {
    POINTS.forEach(function (point) {
      L.marker([point.lat, point.lon], { icon: createMarkerIcon(point.hub) })
        .bindPopup(buildPopup(point), { className: 'leaflet-ps-popup-wrap' })
        .addTo(map);
    });
  }

  /* ---- Map initialization ---- */
  function init() {
    var container = document.getElementById('leaflet-map');
    if (!container || typeof L === 'undefined') {
      console.warn('[map.js] Leaflet map could not initialize: container or L is missing.');
      return;
    }

    try {
      /* Fix default Leaflet marker image path for production environments. */
      L.Icon.Default.imagePath = 'vendor/images/';

      var map = L.map('leaflet-map', {
        center:           [55, 110],
        zoom:             3,
        zoomControl:      true,
        attributionControl: true,
        minZoom:          2,
        maxZoom:          10
      });

      /* ---- Tile layer (ocean / land base) ---- */
      /* CartoDB Dark Matter — free, no API key required. */
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
        {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 19,
          opacity: 0.85
        }
      ).addTo(map);

      map.attributionControl.addAttribution('© Natural Earth');
      map.createPane('land');
      map.getPane('land').style.zIndex = '250';

      addLandLayer(map);
      addRoutes(map);
      addMarkers(map);

      /* Expose map instance for external invalidateSize calls (tab-switcher). */
      window.leafletMap = map;

      /* Ensure correct map size after any pending layout reflows. */
      setTimeout(function () {
        map.invalidateSize();
      }, 200);

    } catch (e) {
      console.warn('[map.js] Map initialization failed: ' + (e && e.message ? e.message : e));
    }
  }

  /* Expose init for manual (tab-triggered) startup. */
  window.initLeafletMap = init;

  /* Auto-init unless the tab-switcher is managing initialization. */
  if (!window.LEAFLET_MAP_TAB_MODE) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }
})();
