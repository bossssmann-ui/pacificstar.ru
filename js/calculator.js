/**
 * Pacific Star — Route Cost Estimator
 * Client-side cost estimation based on distance/weight/cargo type.
 * Clearly marked as approximate; users are directed to request a formal quote.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'ps-calculator-session';

  function t(key, fallback) {
    if (window.PSi18n && typeof window.PSi18n.t === 'function') {
      var val = window.PSi18n.t(key);
      if (val && val !== key) return val;
    }
    return fallback;
  }

  function activeLocale() {
    var lang = (window.PSi18n && window.PSi18n.getLang && window.PSi18n.getLang()) || 'ru';
    return lang === 'ru' ? 'ru-RU' : 'en-US';
  }

  /* ── Cached DOM element references (set in init after buildOptions) ── */
  var _calcFrom, _calcTo, _calcTransport, _calcCargo, _calcWeight, _calcVolume, _calcResult;

  var CITIES = [
    { value: 'Москва',               i18n: 'calc.city.moscow' },
    { value: 'Санкт-Петербург',      i18n: 'calc.city.spb' },
    { value: 'Новосибирск',          i18n: 'calc.city.novosibirsk' },
    { value: 'Екатеринбург',         i18n: 'calc.city.ekaterinburg' },
    { value: 'Красноярск',           i18n: 'calc.city.krasnoyarsk' },
    { value: 'Хабаровск',            i18n: 'calc.city.khabarovsk' },
    { value: 'Владивосток',          i18n: 'calc.city.vladivostok' },
    { value: 'Якутск',               i18n: 'calc.city.yakutsk' },
    { value: 'Южно-Сахалинск',       i18n: 'calc.city.yuzhno_sakhalinsk' },
    { value: 'Петропавловsk-Камч.',  i18n: 'calc.city.petropavlovsk' },
    { value: 'Магадан',              i18n: 'calc.city.magadan' },
    { value: 'Анадырь',              i18n: 'calc.city.anadyr' },
    { value: 'Певек',                i18n: 'calc.city.pevek' },
    { value: 'Другой город',         i18n: 'calc.city.other' }
  ];

  /* ── Distance table (km) between major hubs ──────────────────────── */
  var DIST = {
    'Москва-Владивосток':          9240,
    'Москва-Хабаровск':            8000,
    'Москва-Новосибирск':          3200,
    'Москва-Екатеринбург':         1800,
    'Москва-Красноярск':           4100,
    'Москва-Якутск':               9000,
    'Москва-Южно-Сахалинск':       9800,
    'Москва-Петропавловск-Камч.':  10500,
    'Москва-Магадан':              9900,
    'Москва-Анадырь':              11000,
    'Новосибирск-Владивосток':     5800,
    'Новосибирск-Хабаровск':       4900,
    'Екатеринбург-Владивосток':    7500,
    'Владивосток-Южно-Сахалинск':   900,
    'Владивосток-Магадан':         2300,
    'Владивосток-Петропавловск-Камч.': 1800,
    'Владивосток-Анадырь':         4200,
    'Владивосток-Певек':           3800
  };

  /* ── Transport type multipliers ──────────────────────────────────── */
  var TRANSPORT = {
    auto:  { i18n: 'calc.transport.auto',  baseRate: 0.06,  min: 8000  },
    rail:  { i18n: 'calc.transport.rail',  baseRate: 0.035, min: 12000 },
    sea:   { i18n: 'calc.transport.sea',   baseRate: 0.02,  min: 20000 },
    air:   { i18n: 'calc.transport.air',   baseRate: 0.50,  min: 5000  }
  };

  /* ── Cargo type surcharges ──────────────────────────────────────── */
  var CARGO = {
    general:    { i18n: 'calc.cargo.general',    mult: 1.0 },
    bulk:       { i18n: 'calc.cargo.bulk',       mult: 0.8 },
    container20:{ i18n: 'calc.cargo.container20', mult: 1.1, fixed: 80000 },
    container40:{ i18n: 'calc.cargo.container40', mult: 1.1, fixed: 140000 },
    ref:        { i18n: 'calc.cargo.ref',        mult: 1.5 },
    oversized:  { i18n: 'calc.cargo.oversized',  mult: 1.8 },
    dangerous:  { i18n: 'calc.cargo.dangerous',  mult: 2.0 }
  };

  function cityLabel(value) {
    for (var i = 0; i < CITIES.length; i++) {
      if (CITIES[i].value === value) {
        return t(CITIES[i].i18n, CITIES[i].value);
      }
    }
    return value;
  }

  /* ── Arctic surcharge: derived from route keys containing these keywords ── */
  var ARCTIC_KEYWORDS = ['анадырь','певек','магадан','петропавловск'];

  function isArctic(city) {
    var lc = city.toLowerCase();
    return ARCTIC_KEYWORDS.some(function (k) { return lc.indexOf(k) !== -1; });
  }

  function hasOptionValue(select, value) {
    if (!select || !select.options || !value) return false;
    return Array.prototype.some.call(select.options, function (opt) {
      return opt.value === value;
    });
  }

  function saveSession() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        from:      (_calcFrom      || {}).value || '',
        to:        (_calcTo        || {}).value || '',
        transport: (_calcTransport || {}).value || 'auto',
        cargo:     (_calcCargo     || {}).value || 'general',
        weight:    (_calcWeight    || {}).value || '',
        volume:    (_calcVolume    || {}).value || ''
      }));
    } catch (err) {
      /* Ignore storage failures */
    }
  }

  function restoreSession() {
    var raw;
    var state;
    var restored = false;
    var fromSel     = _calcFrom;
    var toSel       = _calcTo;
    var transSel    = _calcTransport;
    var cargoSel    = _calcCargo;
    var weightInput = _calcWeight;
    var volumeInput = _calcVolume;

    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch (err) {
      return false;
    }
    if (!raw) return false;

    try {
      state = JSON.parse(raw);
    } catch (err) {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (storageErr) {
        /* Ignore storage failures */
      }
      return false;
    }

    if (state.from && hasOptionValue(fromSel, state.from)) {
      fromSel.value = state.from;
      restored = true;
    }
    if (state.to && hasOptionValue(toSel, state.to)) {
      toSel.value = state.to;
      restored = true;
    }
    if (state.transport && hasOptionValue(transSel, state.transport)) {
      transSel.value = state.transport;
      restored = true;
    }
    if (state.cargo && hasOptionValue(cargoSel, state.cargo)) {
      cargoSel.value = state.cargo;
      restored = true;
    }
    if (weightInput && typeof state.weight === 'string' && state.weight) {
      weightInput.value = state.weight;
      restored = true;
    }
    if (volumeInput && typeof state.volume === 'string' && state.volume) {
      volumeInput.value = state.volume;
      restored = true;
    }

    return restored;
  }

  /* ── Build options ── */
  function buildOptions() {
    var fromSel  = document.getElementById('calcFrom');
    var toSel    = document.getElementById('calcTo');
    var transSel = document.getElementById('calcTransport');
    var cargoSel = document.getElementById('calcCargo');
    if (!fromSel || !toSel || !transSel || !cargoSel) return false;

    var cities = CITIES;

    [fromSel, toSel].forEach(function (sel) {
      var frag = document.createDocumentFragment();
      cities.forEach(function (c) {
        var opt = document.createElement('option');
        opt.value = c.value;
        opt.textContent = t(c.i18n, c.value);
        frag.appendChild(opt);
      });
      sel.innerHTML = '';
      sel.appendChild(frag);
    });
    toSel.value = 'Владивосток';

    var transFrag = document.createDocumentFragment();
    Object.keys(TRANSPORT).forEach(function (k) {
      var opt = document.createElement('option');
      opt.value = k;
      opt.textContent = t(TRANSPORT[k].i18n, k);
      transFrag.appendChild(opt);
    });
    transSel.innerHTML = '';
    transSel.appendChild(transFrag);

    var cargoFrag = document.createDocumentFragment();
    Object.keys(CARGO).forEach(function (k) {
      var opt = document.createElement('option');
      opt.value = k;
      opt.textContent = t(CARGO[k].i18n, k);
      cargoFrag.appendChild(opt);
    });
    cargoSel.innerHTML = '';
    cargoSel.appendChild(cargoFrag);

    return true;
  }

  /* ── Estimate ── */
  function estimate() {
    var from      = (_calcFrom      || {}).value || '';
    var to        = (_calcTo        || {}).value || '';
    var transKey  = (_calcTransport || {}).value || 'auto';
    var cargoKey  = (_calcCargo     || {}).value || 'general';
    var weightVal = parseFloat((_calcWeight || {}).value) || 0;
    var volVal    = parseFloat((_calcVolume || {}).value) || 0;

    var resultBox = _calcResult;
    if (!resultBox) return;

    if (!from || !to || from === to) {
      resultBox.innerHTML = '<p class="calc-error">' + t('calc.error.same_cities', 'Укажите разные города отправления и назначения.') + '</p>';
      resultBox.style.display = 'block';
      return;
    }
    if (weightVal <= 0 && volVal <= 0) {
      resultBox.innerHTML = '<p class="calc-error">' + t('calc.error.weight_volume', 'Укажите вес или объём груза.') + '</p>';
      resultBox.style.display = 'block';
      return;
    }

    /* Find distance */
    var distKey  = from + '-' + to;
    var distKeyR = to + '-' + from;
    var dist = DIST[distKey] || DIST[distKeyR];

    if (!dist) {
      /* Generic fallback by region */
      var farEast = ['Владивосток','Хабаровск','Якутск','Южно-Сахалинск',
                     'Петропавловск-Камч.','Магадан','Анадырь','Певек'];
      var fromFE  = farEast.indexOf(from)  !== -1;
      var toFE    = farEast.indexOf(to)    !== -1;
      if (fromFE !== toFE) dist = 7000;  /* rough cross-country */
      else if (fromFE && toFE) dist = 1500;
      else dist = 2000;
    }

    /* Chargeable weight: max(actual weight, volumetric weight) */
    /* Volumetric weight = volume(m³) × 333 kg/m³ (road), 167 (sea), 1000 (air) */
    var volFactors = { auto: 333, rail: 200, sea: 167, air: 1000 };
    var volFactor  = volFactors[transKey] || 333;
    var chargeableWeight = Math.max(weightVal, volVal * volFactor);
    if (chargeableWeight <= 0) chargeableWeight = 1000; /* default 1 tonne */

    var trans = TRANSPORT[transKey];
    var cargo = CARGO[cargoKey];

    /* Base cost */
    var base;
    if (cargo.fixed) {
      /* Container: fixed rate per container */
      base = cargo.fixed + dist * 20; /* 20 ₽/km surcharge */
    } else {
      /* Rate per tonne-km × chargeable weight */
      base = trans.baseRate * dist * (chargeableWeight / 1000);
    }
    base = Math.max(base, trans.min);
    base *= cargo.mult;

    /* Arctic surcharge +30% */
    var arctic = isArctic(to) || isArctic(from);
    if (arctic && transKey === 'sea')  base *= 1.3;
    if (arctic && transKey === 'auto') base *= 1.5;

    /* ±25% range */
    var low  = Math.round(base * 0.80);
    var high = Math.round(base * 1.25);

    var locale = activeLocale();
    function fmt(n) {
      return n.toLocaleString(locale) + ' ₽';
    }

    var fromLabel = cityLabel(from);
    var toLabel   = cityLabel(to);
    var transLabel = t(trans.i18n, transKey);

    resultBox.innerHTML = [
      '<div class="calc-result-grid">',
      '  <div class="calc-result-main">',
      '    <div class="calc-result-label">' + t('calc.result.label', 'Ориентировочная стоимость') + '</div>',
      '    <div class="calc-result-range">' + t('calc.result.range_from', 'от') + ' ' + fmt(low) + ' ' + t('calc.result.range_to', 'до') + ' ' + fmt(high) + '</div>',
      '    <div class="calc-result-note">' + t('calc.result.approx_note', '*  расчёт приблизительный, ±25%') + '</div>',
      '  </div>',
      '  <div class="calc-result-meta">',
      '    <div><b>' + t('calc.result.route', 'Маршрут:') + '</b> ' + fromLabel + ' → ' + toLabel + '</div>',
      '    <div><b>' + t('calc.result.distance', 'Расстояние:') + '</b> ~' + dist.toLocaleString(locale) + ' km</div>',
      '    <div><b>' + t('calc.result.chargeable_weight', 'Тариф. вес:') + '</b> ' + chargeableWeight.toLocaleString(locale) + ' kg</div>',
      '    <div><b>' + t('calc.result.transport', 'Транспорт:') + '</b> ' + transLabel + '</div>',
      (arctic ? '    <div class="calc-arctic-note">' + t('calc.result.arctic_note', '❄️ Надбавка за Арктику включена') + '</div>' : ''),
      '  </div>',
      '</div>',
      '<a href="contacts.html" class="btn btn-primary" style="margin-top:20px;">',
      '  ' + t('calc.result.cta', 'Получить точный расчёт бесплатно'),
      '</a>'
    ].join('');
    resultBox.style.display = 'block';
  }

  /* ── Init ── */
  function init() {
    var form = document.getElementById('calcForm');
    if (!form) return;
    if (!buildOptions()) return;

    /* Cache element references once after options are built */
    _calcFrom      = document.getElementById('calcFrom');
    _calcTo        = document.getElementById('calcTo');
    _calcTransport = document.getElementById('calcTransport');
    _calcCargo     = document.getElementById('calcCargo');
    _calcWeight    = document.getElementById('calcWeight');
    _calcVolume    = document.getElementById('calcVolume');
    _calcResult    = document.getElementById('calcResult');

    var restored = restoreSession();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      saveSession();
      estimate();
    });

    /* Live update on input change */
    [_calcFrom, _calcTo, _calcTransport, _calcCargo].forEach(function (el) {
      if (el) el.addEventListener('change', function () {
        saveSession();
        if (_calcResult && _calcResult.style.display !== 'none') estimate();
      });
    });

    [_calcWeight, _calcVolume].forEach(function (el) {
      if (el) el.addEventListener('input', function () {
        saveSession();
        if (_calcResult && _calcResult.style.display !== 'none') estimate();
      });
    });

    var fromValue = _calcFrom ? _calcFrom.value : '';
    var toValue   = _calcTo   ? _calcTo.value   : '';

    if (restored &&
        fromValue &&
        toValue &&
        hasOptionValue(_calcFrom, fromValue) &&
        hasOptionValue(_calcTo, toValue) &&
        fromValue !== toValue &&
        ((parseFloat((_calcWeight || {}).value) || 0) > 0 ||
         (parseFloat((_calcVolume || {}).value) || 0) > 0)) {
      estimate();
    }
  }

  document.addEventListener('ps-lang-change', function () {
    if (!document.getElementById('calcForm')) return;
    buildOptions();
    if (_calcResult && _calcResult.style.display !== 'none') estimate();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
