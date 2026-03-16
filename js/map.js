/**
 * Pacific Star — Interactive Leaflet Map
 * =========================================
 * Premium dark map using CartoDB Dark Matter tiles.
 * Pulsing markers for key logistics hubs; animated
 * dashed polylines for routes from Vladivostok.
 */
(function () {
  'use strict';

  /* ---- Data ---- */
  var HUB_LAT = 43.1155;
  var HUB_LON = 131.8855;

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

  /* ---- Map initialisation ---- */
  function init() {
    var container = document.getElementById('leaflet-map');
    if (!container || typeof L === 'undefined') {
      if (typeof console !== 'undefined') {
        console.warn('[map.js] Leaflet map could not initialise: container or L is missing.');
      }
      return;
    }

    var map = L.map('leaflet-map', {
      center:           [55, 110],
      zoom:             3,
      zoomControl:      true,
      attributionControl: true,
      minZoom:          2,
      maxZoom:          10
    });

    /* Dark premium tile layer */
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" ' +
          'target="_blank" rel="noopener">OpenStreetMap</a> contributors ' +
          '&copy; <a href="https://carto.com/attributions" ' +
          'target="_blank" rel="noopener">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
      }
    ).addTo(map);

    /* Routes: animated dashed lines from Vladivostok */
    POINTS.forEach(function (point) {
      if (point.hub) return;
      L.polyline(
        [[HUB_LAT, HUB_LON], [point.lat, point.lon]],
        {
          color:     '#d4af37',
          weight:    2,
          opacity:   0.75,
          dashArray: '8 8',
          className: 'leaflet-ps-route'
        }
      ).addTo(map);
    });

    /* Markers */
    POINTS.forEach(function (point) {
      L.marker([point.lat, point.lon], { icon: createMarkerIcon(point.hub) })
        .bindPopup(buildPopup(point), { className: 'leaflet-ps-popup-wrap' })
        .addTo(map);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
