/**
 * Pacific Star — Route Cost Estimator
 * Client-side cost estimation based on distance/weight/cargo type.
 * Clearly marked as approximate; users are directed to request a formal quote.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'ps-calculator-session';

  /* ── Cached DOM element references (set in init after buildOptions) ── */
  var _calcFrom, _calcTo, _calcTransport, _calcCargo, _calcWeight, _calcVolume, _calcResult;

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
    auto:  { label: 'Автомобильный',    baseRate: 0.06,  min: 8000  },
    rail:  { label: 'Железнодорожный',  baseRate: 0.035, min: 12000 },
    sea:   { label: 'Морской',          baseRate: 0.02,  min: 20000 },
    air:   { label: 'Авиационный',      baseRate: 0.50,  min: 5000  }
  };

  /* ── Cargo type surcharges ──────────────────────────────────────── */
  var CARGO = {
    general:    { label: 'Генеральный груз',        mult: 1.0 },
    bulk:       { label: 'Навалочный / сыпучий',    mult: 0.8 },
    container20:{ label: 'Контейнер 20\'',           mult: 1.1, fixed: 80000 },
    container40:{ label: 'Контейнер 40\'',           mult: 1.1, fixed: 140000 },
    ref:        { label: 'Рефрижераторный',          mult: 1.5 },
    oversized:  { label: 'Негабаритный / тяжеловесный', mult: 1.8 },
    dangerous:  { label: 'Опасный груз (ADR)',       mult: 2.0 }
  };

  /* ── Arctic surcharge: derived from route keys containing these keywords ── */
  var ARCTIC_KEYWORDS = ['анадырь','певек','магадан','петропавловск'];

  function isArctic(city) {
    var lc = city.toLowerCase();
    return ARCTIC_KEYWORDS.some(function (k) { return lc.indexOf(k) !== -1; });
  }

  function getFieldValue(id, fallback) {
    var el = document.getElementById(id);
    if (!el || typeof el.value !== 'string') return fallback || '';
    return el.value;
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
    var fromSel     = calcEls.from;
    var toSel       = calcEls.to;
    var transSel    = calcEls.transport;
    var cargoSel    = calcEls.cargo;
    var weightInput = calcEls.weight;
    var volumeInput = calcEls.volume;

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

    var cities = ['Москва','Санкт-Петербург','Новосибирск','Екатеринбург','Красноярск',
                  'Хабаровск','Владивосток','Якутск','Южно-Сахалинск',
                  'Петропавловск-Камч.','Магадан','Анадырь','Певек','Другой город'];

    [fromSel, toSel].forEach(function (sel) {
      var frag = document.createDocumentFragment();
      cities.forEach(function (c) {
        var opt = document.createElement('option');
        opt.value = c; opt.textContent = c;
        frag.appendChild(opt);
      });
      sel.innerHTML = '';
      sel.appendChild(frag);
    });
    toSel.value = 'Владивосток';

    var transFrag = document.createDocumentFragment();
    Object.keys(TRANSPORT).forEach(function (k) {
      var opt = document.createElement('option');
      opt.value = k; opt.textContent = TRANSPORT[k].label;
      transFrag.appendChild(opt);
    });
    transSel.innerHTML = '';
    transSel.appendChild(transFrag);

    var cargoFrag = document.createDocumentFragment();
    Object.keys(CARGO).forEach(function (k) {
      var opt = document.createElement('option');
      opt.value = k; opt.textContent = CARGO[k].label;
      cargoFrag.appendChild(opt);
    });
    cargoSel.innerHTML = '';
    cargoSel.appendChild(cargoFrag);

    return true;
  }

  /* ── Cached field references (populated in init) ── */
  var _fromSel, _toSel, _transSel, _cargoSel, _weightInput, _volInput, _resultBox;

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
      resultBox.innerHTML = '<p class="calc-error">Укажите разные города отправления и назначения.</p>';
      resultBox.style.display = 'block';
      return;
    }
    if (weightVal <= 0 && volVal <= 0) {
      resultBox.innerHTML = '<p class="calc-error">Укажите вес или объём груза.</p>';
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

    function fmt(n) {
      return n.toLocaleString('ru-RU') + ' ₽';
    }

    resultBox.innerHTML = [
      '<div class="calc-result-grid">',
      '  <div class="calc-result-main">',
      '    <div class="calc-result-label">Ориентировочная стоимость</div>',
      '    <div class="calc-result-range">от ' + fmt(low) + ' до ' + fmt(high) + '</div>',
      '    <div class="calc-result-note">*  расчёт приблизительный, ±25%</div>',
      '  </div>',
      '  <div class="calc-result-meta">',
      '    <div><b>Маршрут:</b> ' + from + ' → ' + to + '</div>',
      '    <div><b>Расстояние:</b> ~' + dist.toLocaleString('ru-RU') + ' км</div>',
      '    <div><b>Тариф. вес:</b> ' + chargeableWeight.toLocaleString('ru-RU') + ' кг</div>',
      '    <div><b>Транспорт:</b> ' + trans.label + '</div>',
      (arctic ? '    <div class="calc-arctic-note">❄️ Надбавка за Арктику включена</div>' : ''),
      '  </div>',
      '</div>',
      '<a href="contacts.html" class="btn btn-primary" style="margin-top:20px;">',
      '  Получить точный расчёт бесплатно',
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
