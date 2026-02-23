/**
 * Pacific Star — Currency Calculator
 * Fetches live rates from https://www.cbr-xml-daily.ru/daily_json.js (CORS-enabled)
 * Displays: USD, EUR, CNY, JPY, KRW → RUB
 */
(function () {
  'use strict';

  var CBR_URL = 'https://www.cbr-xml-daily.ru/daily_json.js';
  var CURRENCIES = [
    { code: 'USD', symbol: '$',  flag: '🇺🇸', name: 'Доллар США',      nominal: 1 },
    { code: 'EUR', symbol: '€',  flag: '🇪🇺', name: 'Евро',             nominal: 1 },
    { code: 'CNY', symbol: '¥',  flag: '🇨🇳', name: 'Китайский юань',   nominal: 1 },
    { code: 'JPY', symbol: '¥',  flag: '🇯🇵', name: 'Японская иена',    nominal: 100 },
    { code: 'KRW', symbol: '₩',  flag: '🇰🇷', name: 'Корейская вона',   nominal: 1000 }
  ];

  var rates = {};
  var lastUpdate = null;
  var isLoading = false;

  /* ── Fetch rates from CBR ── */
  function fetchRates(onDone) {
    if (isLoading) return;
    isLoading = true;

    var loadingEl = document.getElementById('currencyLoading');
    var errorEl   = document.getElementById('currencyError');
    if (loadingEl) loadingEl.style.display = 'flex';
    if (errorEl)   errorEl.style.display   = 'none';

    var xhr = new XMLHttpRequest();
    xhr.open('GET', CBR_URL, true);
    xhr.timeout = 8000;
    xhr.onload = function () {
      isLoading = false;
      if (loadingEl) loadingEl.style.display = 'none';
      if (xhr.status === 200) {
        try {
          var data = JSON.parse(xhr.responseText);
          CURRENCIES.forEach(function (c) {
            var entry = data.Valute && data.Valute[c.code];
            if (entry) {
              /* Normalize to rate per 1 unit */
              rates[c.code] = entry.Value / entry.Nominal;
            }
          });
          lastUpdate = new Date(data.Date);
          if (onDone) onDone();
        } catch (e) {
          showError();
        }
      } else {
        showError();
      }
    };
    xhr.onerror = xhr.ontimeout = function () {
      isLoading = false;
      if (loadingEl) loadingEl.style.display = 'none';
      showError();
    };
    xhr.send();
  }

  function showError() {
    /* On API failure: use hardcoded reference rates so widget stays useful */
    var FALLBACK = { USD: 90.50, EUR: 98.20, CNY: 12.50, JPY: 0.615, KRW: 0.068 };
    var hasFallback = false;
    CURRENCIES.forEach(function (c) {
      if (!rates[c.code] && FALLBACK[c.code]) {
        rates[c.code] = FALLBACK[c.code] / c.nominal;
        hasFallback = true;
      }
    });
    var errorEl = document.getElementById('currencyError');
    if (errorEl) {
      errorEl.style.display = 'flex';
      if (hasFallback) {
        var msgEl = errorEl.querySelector('span');
        if (msgEl) msgEl.textContent = 'Нет соединения с ЦБ РФ. Показаны ориентировочные курсы.';
        updateCards();
      }
    }
  }

  /* ── Update rate cards ── */
  function updateCards() {
    CURRENCIES.forEach(function (c) {
      var card = document.getElementById('rate-' + c.code);
      if (!card) return;
      var rateVal = card.querySelector('.currency-rate-value');
      var change  = card.querySelector('.currency-change');
      if (!rates[c.code]) return;

      /* Display rate per nominal */
      var displayRate = rates[c.code] * c.nominal;
      if (rateVal) rateVal.textContent = displayRate.toFixed(2) + ' ₽';

      /* Simulated change indicator (real prev-day diff requires extra field) */
      if (change && change.dataset.prev) {
        var prev = parseFloat(change.dataset.prev);
        var diff = displayRate - prev;
        change.textContent = (diff >= 0 ? '+' : '') + diff.toFixed(2);
        change.className = 'currency-change ' + (diff >= 0 ? 'up' : 'down');
      }
    });

    /* Timestamp */
    var ts = document.getElementById('currencyTimestamp');
    if (ts && lastUpdate) {
      var fmt = lastUpdate.toLocaleDateString('ru-RU', {
        day: '2-digit', month: 'long', year: 'numeric'
      });
      ts.textContent = 'Курсы ЦБ РФ на ' + fmt;
    }

    /* Run converter if filled */
    convert();
  }

  /* ── Converter ── */
  function convert() {
    var fromCode  = document.getElementById('convFrom');
    var toCode    = document.getElementById('convTo');
    var amountEl  = document.getElementById('convAmount');
    var resultEl  = document.getElementById('convResult');
    if (!fromCode || !toCode || !amountEl || !resultEl) return;

    var amount = parseFloat(amountEl.value);
    if (isNaN(amount) || amount <= 0) { resultEl.textContent = '—'; return; }

    var from = fromCode.value;
    var to   = toCode.value;

    var rubAmount;
    if (from === 'RUB') {
      rubAmount = amount;
    } else if (rates[from]) {
      rubAmount = amount * rates[from];
    } else {
      resultEl.textContent = '— (нет курса)';
      return;
    }

    var result;
    if (to === 'RUB') {
      result = rubAmount;
    } else if (rates[to]) {
      result = rubAmount / rates[to];
    } else {
      resultEl.textContent = '— (нет курса)';
      return;
    }

    /* Format nicely */
    var formatted = result >= 100
      ? result.toLocaleString('ru-RU', { maximumFractionDigits: 2 })
      : result.toFixed(4);
    var symbols = { USD:'$', EUR:'€', CNY:'¥', JPY:'¥', KRW:'₩', RUB:'₽' };
    resultEl.textContent = formatted + ' ' + (symbols[to] || to);
  }

  /* ── Build HTML ── */
  function buildWidget(container) {
    container.innerHTML = [
      '<div class="currency-header">',
      '  <div>',
      '    <span class="section-label">Актуальные котировки</span>',
      '    <h2 class="section-title" id="currency-title">Курсы валют</h2>',
      '    <p class="section-desc" id="currencyTimestamp">Загрузка курсов ЦБ РФ…</p>',
      '  </div>',
      '  <button type="button" class="btn btn-outline currency-refresh" id="currencyRefresh">',
      '    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"',
      '         fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">',
      '      <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>',
      '      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>',
      '    </svg>',
      '    Обновить',
      '  </button>',
      '</div>',

      /* Loading / error states */
      '<div class="currency-loading" id="currencyLoading" style="display:flex;">',
      '  <div class="spinner" aria-label="Загрузка"></div>',
      '  <span>Загружаем курсы ЦБ РФ…</span>',
      '</div>',
      '<div class="currency-error" id="currencyError" style="display:none;">',
      '  <span>⚠️ Не удалось загрузить курсы. Проверьте соединение.</span>',
      '  <button type="button" class="btn btn-outline btn-sm" id="currencyRetry">Повторить</button>',
      '</div>',

      /* Rate cards */
      '<div class="currency-grid" id="currencyGrid">',
      CURRENCIES.map(function (c) {
        return [
          '<div class="currency-card fade-in" id="rate-' + c.code + '">',
          '  <div class="currency-card-header">',
          '    <span class="currency-flag" aria-hidden="true">' + c.flag + '</span>',
          '    <div>',
          '      <div class="currency-code">' + c.code + '</div>',
          '      <div class="currency-name">' + c.name + '</div>',
          '    </div>',
          '  </div>',
          '  <div class="currency-rate">',
          '    <span class="currency-rate-label">' + (c.nominal > 1 ? c.nominal + ' ' + c.code : '1 ' + c.code) + ' =</span>',
          '    <strong class="currency-rate-value">—</strong>',
          '  </div>',
          '</div>'
        ].join('');
      }).join(''),
      '</div>',

      /* Converter */
      '<div class="currency-converter">',
      '  <h3 class="currency-converter-title">Конвертер валют</h3>',
      '  <div class="converter-row">',
      '    <div class="converter-group">',
      '      <label class="form-label" for="convAmount">Сумма</label>',
      '      <input type="number" id="convAmount" class="form-control" min="0" step="any" value="1000" placeholder="Введите сумму">',
      '    </div>',
      '    <div class="converter-group">',
      '      <label class="form-label" for="convFrom">Из</label>',
      '      <select id="convFrom" class="form-control">',
      '        <option value="USD">🇺🇸 USD — Доллар</option>',
      '        <option value="EUR">🇪🇺 EUR — Евро</option>',
      '        <option value="CNY">🇨🇳 CNY — Юань</option>',
      '        <option value="JPY">🇯🇵 JPY — Иена</option>',
      '        <option value="KRW">🇰🇷 KRW — Вона</option>',
      '        <option value="RUB">🇷🇺 RUB — Рубль</option>',
      '      </select>',
      '    </div>',
      '    <div class="converter-swap">',
      '      <button type="button" id="convSwap" class="btn btn-outline btn-sm" aria-label="Поменять местами">⇆</button>',
      '    </div>',
      '    <div class="converter-group">',
      '      <label class="form-label" for="convTo">В</label>',
      '      <select id="convTo" class="form-control">',
      '        <option value="RUB">🇷🇺 RUB — Рубль</option>',
      '        <option value="USD">🇺🇸 USD — Доллар</option>',
      '        <option value="EUR">🇪🇺 EUR — Евро</option>',
      '        <option value="CNY">🇨🇳 CNY — Юань</option>',
      '        <option value="JPY">🇯🇵 JPY — Иена</option>',
      '        <option value="KRW">🇰🇷 KRW — Вона</option>',
      '      </select>',
      '    </div>',
      '  </div>',
      '  <div class="converter-result">',
      '    <span class="converter-result-label">Результат:</span>',
      '    <span class="converter-result-value" id="convResult">—</span>',
      '  </div>',
      '  <p class="currency-disclaimer">* Курсы ЦБ РФ. Для расчёта стоимости грузоперевозки ',
      '    <a href="contacts.html">оставьте заявку</a>.</p>',
      '</div>'
    ].join('');

    /* Events */
    document.getElementById('currencyRefresh').addEventListener('click', function () {
      fetchRates(updateCards);
    });
    var retryBtn = document.getElementById('currencyRetry');
    if (retryBtn) retryBtn.addEventListener('click', function () { fetchRates(updateCards); });

    ['convAmount','convFrom','convTo'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', convert);
    });

    var swapBtn = document.getElementById('convSwap');
    if (swapBtn) {
      swapBtn.addEventListener('click', function () {
        var from = document.getElementById('convFrom');
        var to   = document.getElementById('convTo');
        var tmp  = from.value;
        from.value = to.value;
        to.value   = tmp;
        convert();
      });
    }
  }

  /* ── Init ── */
  function init() {
    var container = document.getElementById('currencyWidget');
    if (!container) return;
    buildWidget(container);
    fetchRates(function () {
      updateCards();
      /* Auto-refresh every 10 minutes */
      setInterval(function () { fetchRates(updateCards); }, 10 * 60 * 1000);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
