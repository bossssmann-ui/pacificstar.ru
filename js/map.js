/**
 * Pacific Star — Interactive Leaflet Map
 * =========================================
 * Premium dark map using local Leaflet assets and
 * bundled GeoJSON land polygons.
 * Pulsing markers for key logistics hubs; animated
 * dashed polylines for routes from Vladivostok.
 */
(function () {
  'use strict';

  /* ---- Data ---- */
  var COUNTRIES_GEOJSON_PATH = 'data/world-countries.geo.json';
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
    return fetch(COUNTRIES_GEOJSON_PATH)
      .then(function (response) {
        if (!response.ok) {
          throw new Error('Failed to load "' + COUNTRIES_GEOJSON_PATH + '": HTTP ' + response.status + ' - ' + response.statusText);
        }

        return response.json();
      })
      .then(function (geoJson) {
        L.geoJSON(geoJson, {
          pane: 'land',
          style: getFeatureStyle
        }).addTo(map);
      });
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

    var map = L.map('leaflet-map', {
      center:           [55, 110],
      zoom:             3,
      zoomControl:      true,
      attributionControl: true,
      minZoom:          2,
      maxZoom:          10
    });

    map.attributionControl.addAttribution('© Natural Earth');
    map.createPane('land');
    map.getPane('land').style.zIndex = '250';

    addLandLayer(map)
      .catch(function (error) {
        console.warn('[map.js] Failed to load bundled GeoJSON land layer; routes and markers will still render. ' + (error && error.message ? error.message : error));
      })
      .finally(function () {
        addRoutes(map);
        addMarkers(map);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
