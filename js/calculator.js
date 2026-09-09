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
    { value: 'Петропавловск-Камч.',  i18n: 'calc.city.petropavlovsk' },
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

    /* PS-05: no unverified price is shown. Build a rate-request that carries
       the entered route and cargo parameters to the contact form. A numeric
       calculator returns only in PS-13, after approved tariffs. */
    function selectedText(sel, fallback) {
      if (sel && sel.options && sel.selectedIndex >= 0 && sel.options[sel.selectedIndex]) {
        return sel.options[sel.selectedIndex].text;
      }
      return fallback;
    }
    var fromLabel  = cityLabel(from);
    var toLabel    = cityLabel(to);
    var transLabel = selectedText(_calcTransport, transKey);
    var cargoLabel = selectedText(_calcCargo, cargoKey);

    var paramRows = '';
    if (weightVal > 0) paramRows += '<div><b>' + t('calc.result.weight', 'Вес:') + '</b> ' + weightVal + ' kg</div>';
    if (volVal > 0)    paramRows += '<div><b>' + t('calc.result.volume', 'Объём:') + '</b> ' + volVal + ' m³</div>';

    var routeStr  = fromLabel + ' \u2192 ' + toLabel;
    var cargoStr  = cargoLabel + ', ' + transLabel
      + (weightVal > 0 ? ', ' + weightVal + ' \u043a\u0433' : '')
      + (volVal > 0 ? ', ' + volVal + ' \u043c\u00b3' : '');
    /* PS-05: hand off via short-lived same-tab sessionStorage — the request
       content is NOT placed in the URL. Cleared by the contact form on read. */
    try {
      sessionStorage.setItem('ps_quote_request', JSON.stringify({ route: routeStr, cargo: cargoStr, ts: Date.now() }));
    } catch (e) { /* storage unavailable — the form still opens, just without prefill */ }
    var href = 'contacts.html#contactForm';

    resultBox.innerHTML = [
      '<div class="calc-result-grid">',
      '  <div class="calc-result-main">',
      '    <div class="calc-result-label">' + t('calc.result.quote_label', 'Запрос ставки') + '</div>',
      '    <div class="calc-result-note">' + t('calc.result.quote_note', 'Точную стоимость рассчитает менеджер по вашему маршруту и параметрам груза: ставки зависят от направления, сезона и наличия транспорта.') + '</div>',
      '  </div>',
      '  <div class="calc-result-meta">',
      '    <div><b>' + t('calc.result.route', 'Маршрут:') + '</b> ' + fromLabel + ' \u2192 ' + toLabel + '</div>',
      '    <div><b>' + t('calc.result.transport', 'Транспорт:') + '</b> ' + transLabel + '</div>',
      '    <div><b>' + t('calc.result.cargo_label', 'Груз:') + '</b> ' + cargoLabel + '</div>',
      paramRows,
      '  </div>',
      '</div>',
      '<a href="' + href + '" class="btn btn-primary" style="margin-top:20px;">',
      '  ' + t('calc.result.cta_quote', 'Запросить расчёт стоимости') + '</a>'
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
    var calcTracked = false;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      saveSession();
      estimate();
      /* Calculator use is NOT a lead. Fire once per page load. */
      if (!calcTracked && window.PSTrack) {
        calcTracked = true;
        window.PSTrack('calculator_used', { page: window.location.pathname });
      }
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
