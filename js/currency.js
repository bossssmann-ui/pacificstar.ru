/**
 * Pacific Star — Currency Calculator
 * Fetches live rates from https://www.cbr-xml-daily.ru/daily_json.js (CORS-enabled)
 * Displays: USD, EUR, CNY, JPY, KRW, SGD → RUB with SVG sparkline chart
 */
(function () {
  'use strict';

  var CBR_URL     = 'https://www.cbr-xml-daily.ru/daily_json.js';
  var CBR_ARCHIVE = 'https://www.cbr-xml-daily.ru/archive/';
  var CURRENCIES = [
    { code: 'USD', symbol: '$',  flag: '🇺🇸', name: 'Доллар США',         nominal: 1    },
    { code: 'EUR', symbol: '€',  flag: '🇪🇺', name: 'Евро',                nominal: 1    },
    { code: 'CNY', symbol: '¥',  flag: '🇨🇳', name: 'Китайский юань',      nominal: 1    },
    { code: 'JPY', symbol: '¥',  flag: '🇯🇵', name: 'Японская иена',       nominal: 100  },
    { code: 'KRW', symbol: '₩',  flag: '🇰🇷', name: 'Корейская вона',      nominal: 1000 },
    { code: 'SGD', symbol: 'S$', flag: '🇸🇬', name: 'Сингапурский доллар', nominal: 1    }
  ];
  var SYMBOLS = { USD: '$', EUR: '€', CNY: '¥', JPY: '¥', KRW: '₩', SGD: 'S$', RUB: '₽' };

  var rates       = {};
  var prevRates   = {};
  var lastUpdate  = null;
  var isLoading   = false;
  var selectedCode = 'USD';
  var chartCache   = {};   /* code → [{date, value}] */
  var cardCache    = {};   /* code → { card, rateVal, changeEl } */

  /* Converter element refs — populated once in buildWidget() */
  var convFromEl = null, convToEl = null, convAmountEl = null, convResultEl = null;

  /* ── Fetch rates from CBR ── */
  function fetchRates(onDone) {
    if (isLoading) return;
    isLoading = true;

    var loadingEl = document.getElementById('currencyLoading');
    var errorEl   = document.getElementById('currencyError');
    if (loadingEl) loadingEl.style.display = 'flex';
    if (errorEl)   errorEl.style.display   = 'none';

    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timeoutId = setTimeout(function () { if (controller) controller.abort(); }, 8000);

    fetch(CBR_URL, controller ? { signal: controller.signal } : {})
      .then(function (response) {
        clearTimeout(timeoutId);
        if (!response.ok) { throw new Error('HTTP ' + response.status); }
        return response.json();
      })
      .then(function (data) {
        isLoading = false;
        if (loadingEl) loadingEl.style.display = 'none';
        CURRENCIES.forEach(function (c) {
          var entry = data.Valute && data.Valute[c.code];
          if (entry) {
            rates[c.code]     = entry.Value    / entry.Nominal;
            prevRates[c.code] = entry.Previous / entry.Nominal;
          }
        });
        lastUpdate = new Date(data.Date);
        if (onDone) onDone();
      })
      .catch(function () {
        clearTimeout(timeoutId);
        isLoading = false;
        if (loadingEl) loadingEl.style.display = 'none';
        showError();
      });
  }

  function showError() {
    /* On API failure: use hardcoded reference rates so widget stays useful */
    var FALLBACK = { USD: 90.50, EUR: 98.20, CNY: 12.50, JPY: 0.615, KRW: 0.068, SGD: 66.20 };
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
      var cached = cardCache[c.code];
      if (!cached || !rates[c.code]) return;

      var displayRate = rates[c.code] * c.nominal;
      if (cached.rateVal) cached.rateVal.textContent = displayRate.toFixed(2) + ' ₽';

      if (cached.changeEl) {
        if (prevRates[c.code]) {
          var prevRate = prevRates[c.code] * c.nominal;
          var diff = displayRate - prevRate;
          var arrow = diff >= 0 ? '▲' : '▼';
          cached.changeEl.textContent = arrow + ' ' + Math.abs(diff).toFixed(2);
          cached.changeEl.className = 'currency-change ' + (diff >= 0 ? 'up' : 'down');
        } else {
          cached.changeEl.textContent = '';
        }
      }
    });

    var ts = document.getElementById('currencyTimestamp');
    if (ts && lastUpdate) {
      ts.textContent = 'Курсы ЦБ РФ на ' + lastUpdate.toLocaleDateString('ru-RU', {
        day: '2-digit', month: 'long', year: 'numeric'
      });
    }

    convert();
  }

  /* ── Converter ── */
  function convert() {
    if (!convFromEl || !convToEl || !convAmountEl || !convResultEl) return;

    var amount = parseFloat(convAmountEl.value);
    if (isNaN(amount) || amount <= 0) { convResultEl.value = '—'; return; }

    var from = convFromEl.value;
    var to   = convToEl.value;

    var rubAmount;
    if (from === 'RUB') {
      rubAmount = amount;
    } else if (rates[from]) {
      rubAmount = amount * rates[from];
    } else {
      convResultEl.value = '— (нет курса)';
      return;
    }

    var result;
    if (to === 'RUB') {
      result = rubAmount;
    } else if (rates[to]) {
      result = rubAmount / rates[to];
    } else {
      convResultEl.value = '— (нет курса)';
      return;
    }

    var formatted = result >= 100
      ? result.toLocaleString('ru-RU', { maximumFractionDigits: 2 })
      : result.toFixed(4);
    convResultEl.value = formatted + ' ' + (SYMBOLS[to] || to);
  }

  /* ── Chart: fetch archive data for last N work days ── */
  function getArchiveDates(count) {
    var dates = [];
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    /* CBR publishes next business day's rate, so start from yesterday */
    d.setDate(d.getDate() - 1);
    while (dates.length < count) {
      var dow = d.getDay();
      if (dow !== 0 && dow !== 6) {
        dates.unshift(formatDate(d));
      }
      d.setDate(d.getDate() - 1);
    }
    return dates;
  }

  function pad2(n) { return n < 10 ? '0' + n : String(n); }

  function formatDate(d) {
    return d.getFullYear() + '/' + pad2(d.getMonth() + 1) + '/' + pad2(d.getDate());
  }

  function fetchArchiveDay(dateStr, code, nominal, onDone) {
    var url = CBR_ARCHIVE + dateStr + '/daily_json.js';
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timeoutId = setTimeout(function () { if (controller) controller.abort(); }, 6000);

    fetch(url, controller ? { signal: controller.signal } : {})
      .then(function (response) {
        clearTimeout(timeoutId);
        if (!response.ok) { throw new Error('HTTP ' + response.status); }
        return response.json();
      })
      .then(function (data) {
        var entry = data.Valute && data.Valute[code];
        if (entry) {
          onDone(null, entry.Value / entry.Nominal * nominal);
        } else {
          onDone(new Error('no data'));
        }
      })
      .catch(function () {
        clearTimeout(timeoutId);
        onDone(new Error('error'));
      });
  }

  function loadChartData(code, onDone) {
    if (chartCache[code]) { onDone(chartCache[code]); return; }

    var cur    = CURRENCIES.filter(function (c) { return c.code === code; })[0];
    var nominal = cur ? cur.nominal : 1;
    var dates  = getArchiveDates(30);
    var results = new Array(dates.length);
    var pending = dates.length;
    var BATCH   = 5;   /* parallel requests per batch */
    var idx     = 0;

    function fetchNext() {
      var batchEnd = Math.min(idx + BATCH, dates.length);
      var batchSize = batchEnd - idx;
      if (batchSize <= 0) return;
      var done = 0;
      for (var i = idx; i < batchEnd; i++) {
        (function (pos) {
          fetchArchiveDay(dates[pos], code, nominal, function (err, val) {
            if (!err) { results[pos] = { date: dates[pos], value: val }; }
            done++;
            pending--;
            if (done === batchSize) {
              if (pending > 0) {
                setTimeout(fetchNext, 200);
              } else {
                var series = results.filter(Boolean);
                if (series.length >= 2) {
                  chartCache[code] = series;
                  onDone(series);
                } else {
                  onDone(null);
                }
              }
            }
          });
        })(i);
      }
      idx = batchEnd;
    }

    fetchNext();
  }

  /* ── SVG Sparkline ── */
  function renderChart(code, series) {
    var container = document.getElementById('chartSvgWrap');
    var titleEl   = document.getElementById('chartTitle');
    if (!container) return;

    if (titleEl) titleEl.textContent = code + ' / RUB за 30 дней';

    if (!series || series.length < 2) {
      container.innerHTML = '<p class="chart-no-data">Нет данных для графика</p>';
      return;
    }

    var W = container.clientWidth  || 600;
    var H = 140;
    var PAD = { top: 16, right: 12, bottom: 28, left: 52 };
    var innerW = W - PAD.left - PAD.right;
    var innerH = H - PAD.top  - PAD.bottom;

    var vals  = series.map(function (p) { return p.value; });
    var minV  = Math.min.apply(null, vals);
    var maxV  = Math.max.apply(null, vals);
    var range = maxV - minV || 1;

    var trend = vals[vals.length - 1] >= vals[0];
    var color = trend ? '#27ae60' : '#e74c3c';
    var fillId = 'chartFill' + code;

    var NS = 'http://www.w3.org/2000/svg';

    function px(i) { return PAD.left + (i / (series.length - 1)) * innerW; }
    function py(v) { return PAD.top  + innerH - ((v - minV) / range) * innerH; }

    /* Build polyline points */
    var pts = series.map(function (p, i) { return px(i) + ',' + py(p.value); }).join(' ');

    /* Build closed fill path */
    var fillPath = 'M' + px(0) + ',' + py(series[0].value) + ' ';
    series.forEach(function (p, i) {
      fillPath += 'L' + px(i) + ',' + py(p.value) + ' ';
    });
    fillPath += 'L' + px(series.length - 1) + ',' + (PAD.top + innerH) + ' ';
    fillPath += 'L' + px(0)                 + ',' + (PAD.top + innerH) + ' Z';

    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width',  '100%');
    svg.setAttribute('height', H);
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('preserveAspectRatio', 'none');

    /* Gradient def */
    var defs = document.createElementNS(NS, 'defs');
    var grad = document.createElementNS(NS, 'linearGradient');
    grad.setAttribute('id', fillId);
    grad.setAttribute('x1', '0'); grad.setAttribute('y1', '0');
    grad.setAttribute('x2', '0'); grad.setAttribute('y2', '1');
    var s0 = document.createElementNS(NS, 'stop');
    s0.setAttribute('offset', '0%');
    s0.setAttribute('stop-color', color);
    s0.setAttribute('stop-opacity', '0.25');
    var s1 = document.createElementNS(NS, 'stop');
    s1.setAttribute('offset', '100%');
    s1.setAttribute('stop-color', color);
    s1.setAttribute('stop-opacity', '0.02');
    grad.appendChild(s0); grad.appendChild(s1);
    defs.appendChild(grad);
    svg.appendChild(defs);

    /* Fill area */
    var area = document.createElementNS(NS, 'path');
    area.setAttribute('d', fillPath);
    area.setAttribute('fill', 'url(#' + fillId + ')');
    svg.appendChild(area);

    /* Line */
    var line = document.createElementNS(NS, 'polyline');
    line.setAttribute('points', pts);
    line.setAttribute('fill', 'none');
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', '2');
    line.setAttribute('stroke-linejoin', 'round');
    line.setAttribute('stroke-linecap', 'round');
    svg.appendChild(line);

    /* Y-axis labels */
    function addLabel(text, x, y, anchor) {
      var t = document.createElementNS(NS, 'text');
      t.setAttribute('x', x); t.setAttribute('y', y);
      t.setAttribute('text-anchor', anchor || 'start');
      t.setAttribute('font-size', '10');
      t.setAttribute('fill', '#888');
      t.textContent = text;
      svg.appendChild(t);
    }
    addLabel(minV.toFixed(2), PAD.left - 4, PAD.top + innerH, 'end');
    addLabel(maxV.toFixed(2), PAD.left - 4, PAD.top + 10, 'end');

    /* X-axis date labels */
    var labelIndices = [0, Math.floor((series.length - 1) / 2), series.length - 1];
    labelIndices.forEach(function (i) {
      var rawDate = series[i].date; /* "YYYY/MM/DD" */
      var parts   = rawDate.split('/');
      var display = parts[2] + '.' + parts[1];
      var anchor  = i === 0 ? 'start' : (i === series.length - 1 ? 'end' : 'middle');
      addLabel(display, px(i), H - 6, anchor);
    });

    /* Tooltip dots — interactive */
    series.forEach(function (p, i) {
      var circle = document.createElementNS(NS, 'circle');
      circle.setAttribute('cx', px(i));
      circle.setAttribute('cy', py(p.value));
      circle.setAttribute('r', '3');
      circle.setAttribute('fill', color);
      circle.setAttribute('opacity', '0');
      circle.setAttribute('class', 'chart-dot');
      circle.setAttribute('data-date', p.date);
      circle.setAttribute('data-value', p.value.toFixed(2));
      svg.appendChild(circle);
    });

    container.innerHTML = '';
    container.appendChild(svg);

    /* Tooltip logic */
    var tooltip = document.getElementById('chartTooltip');
    /* Cache dot elements once — they are never added/removed after render */
    var dots = svg.querySelectorAll('.chart-dot');
    svg.addEventListener('mousemove', function (e) {
      var rect = svg.getBoundingClientRect();
      var mx   = e.clientX - rect.left;
      var best = null, bestDist = Infinity;
      series.forEach(function (p, i) {
        var dist = Math.abs(mx - px(i) * (rect.width / W));
        if (dist < bestDist) { bestDist = dist; best = { i: i, p: p }; }
      });
      if (!best || !tooltip) return;
      /* Show dots near hover */
      for (var d = 0; d < dots.length; d++) {
        dots[d].setAttribute('opacity', d === best.i ? '1' : '0');
      }
      var dateParts = best.p.date.split('/');
      tooltip.textContent = dateParts[2] + '.' + dateParts[1] + '.' + dateParts[0] + ' — ' + best.p.value.toFixed(2) + ' ₽';
      tooltip.style.display = 'block';
      tooltip.style.left = (e.clientX - rect.left + 12) + 'px';
      tooltip.style.top  = (e.clientY - rect.top  - 28) + 'px';
    });
    svg.addEventListener('mouseleave', function () {
      if (tooltip) tooltip.style.display = 'none';
      for (var d = 0; d < dots.length; d++) {
        dots[d].setAttribute('opacity', '0');
      }
    });
  }

  function showChartLoading(code) {
    var container = document.getElementById('chartSvgWrap');
    var titleEl   = document.getElementById('chartTitle');
    if (titleEl) titleEl.textContent = code + ' / RUB за 30 дней';
    if (container) container.innerHTML = '<p class="chart-loading-msg">Загрузка данных графика…</p>';
  }

  function selectCard(code) {
    selectedCode = code;
    /* Deactivate all cards via cardCache — avoids a live DOM query */
    Object.keys(cardCache).forEach(function (k) {
      if (cardCache[k].card) cardCache[k].card.classList.remove('active');
    });
    var cached = cardCache[code];
    if (cached && cached.card) cached.card.classList.add('active');

    showChartLoading(code);
    loadChartData(code, function (series) {
      renderChart(code, series);
    });
  }

  /* ── Build HTML ── */
  function buildWidget(container) {
    var allOptions = CURRENCIES.map(function (c) {
      return '<option value="' + c.code + '">' + c.flag + ' ' + c.code + ' — ' + c.name + '</option>';
    });
    var rubOption = '<option value="RUB">🇷🇺 RUB — Рубль</option>';

    container.innerHTML = [
      /* Header */
      '<div class="currency-header">',
      '  <div>',
      '    <span class="section-label">Актуальные котировки</span>',
      '    <h2 class="section-title">Курсы валют ЦБ РФ</h2>',
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

      /* Loading / error */
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
          '<button type="button" class="currency-card" id="rate-' + c.code + '" aria-label="Показать график для ' + c.name + '">',
          '  <div class="currency-card-header">',
          '    <span class="currency-flag" aria-hidden="true">' + c.flag + '</span>',
          '    <span class="currency-code">' + c.code + '</span>',
          '  </div>',
          '  <strong class="currency-rate-value">—</strong>',
          '  <span class="currency-change"></span>',
          '</button>'
        ].join('');
      }).join(''),
      '</div>',

      /* Chart area */
      '<div class="currency-chart">',
      '  <div class="chart-header">',
      '    <span class="chart-title" id="chartTitle">USD / RUB за 30 дней</span>',
      '  </div>',
      '  <div class="chart-svg-wrap" id="chartSvgWrap">',
      '    <p class="chart-loading-msg">Выберите валюту для просмотра графика</p>',
      '  </div>',
      '  <div class="chart-tooltip" id="chartTooltip" style="display:none;"></div>',
      '</div>',

      /* Converter */
      '<div class="currency-converter">',
      '  <div class="converter-inline">',
      '    <input type="number" id="convAmount" class="conv-input" min="0" step="any" value="1000" placeholder="Сумма">',
      '    <select id="convFrom" class="conv-select">',
      '      ' + allOptions.join('') + rubOption,
      '    </select>',
      '    <button type="button" id="convSwap" class="conv-swap" aria-label="Поменять местами">⇆</button>',
      '    <input type="text" id="convResult" class="conv-result" readonly placeholder="Результат">',
      '    <select id="convTo" class="conv-select">',
      '      ' + rubOption + allOptions.join(''),
      '    </select>',
      '  </div>',
      '  <p class="currency-disclaimer">* Курсы ЦБ РФ. Для расчёта стоимости грузоперевозки ',
      '    <a href="contacts.html">оставьте заявку</a>.</p>',
      '</div>'
    ].join('');

    /* Card click + populate card cache */
    CURRENCIES.forEach(function (c) {
      var card = document.getElementById('rate-' + c.code);
      if (card) {
        cardCache[c.code] = {
          card:     card,
          rateVal:  card.querySelector('.currency-rate-value'),
          changeEl: card.querySelector('.currency-change')
        };
        card.addEventListener('click', function () { selectCard(c.code); });
      }
    });

    /* Refresh */
    var refreshBtn = document.getElementById('currencyRefresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', function () {
        fetchRates(function () { updateCards(); });
      });
    }

    /* Retry */
    var retryBtn = document.getElementById('currencyRetry');
    if (retryBtn) retryBtn.addEventListener('click', function () { fetchRates(function () { updateCards(); }); });

    /* Converter events */
    convAmountEl = document.getElementById('convAmount');
    convFromEl   = document.getElementById('convFrom');
    convToEl     = document.getElementById('convTo');
    convResultEl = document.getElementById('convResult');

    ['convAmount', 'convFrom', 'convTo'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', convert);
    });

    var swapBtn = document.getElementById('convSwap');
    if (swapBtn) {
      swapBtn.addEventListener('click', function () {
        if (convFromEl && convToEl) {
          var tmp      = convFromEl.value;
          convFromEl.value = convToEl.value;
          convToEl.value   = tmp;
          convert();
        }
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
      selectCard(selectedCode);
      setInterval(function () { fetchRates(function () { updateCards(); }); }, 10 * 60 * 1000);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
