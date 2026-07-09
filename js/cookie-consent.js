/**
 * Cookie consent banner (152-FZ). Analytics loads only after user accepts.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'ps_cookie_consent';
  var VAL_ALL = 'all';
  var VAL_ESSENTIAL = 'essential';

  function grantAnalytics() {
    window.dispatchEvent(new CustomEvent('ps:analytics-consent'));
  }

  function save(value) {
    try { localStorage.setItem(STORAGE_KEY, value); } catch (_) { /* noop */ }
  }

  var existing = '';
  try { existing = localStorage.getItem(STORAGE_KEY) || ''; } catch (_) { /* noop */ }

  if (existing === VAL_ALL) {
    grantAnalytics();
    return;
  }
  if (existing === VAL_ESSENTIAL) {
    return;
  }

  var banner = document.createElement('div');
  banner.className = 'cookie-consent';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-live', 'polite');
  banner.setAttribute('aria-label', 'Согласие на использование cookie');
  banner.innerHTML =
    '<div class="cookie-consent-inner">' +
      '<p class="cookie-consent-text">' +
        'Мы используем cookie для работы сайта и&nbsp;аналитики ' +
        '(<a href="privacy.html#cookies">подробнее</a>). ' +
        'Яндекс.Метрика помогает улучшать сервис.' +
      '</p>' +
      '<div class="cookie-consent-actions">' +
        '<button type="button" class="btn btn-primary btn-sm" data-cookie-accept>Принять</button>' +
        '<button type="button" class="btn btn-secondary btn-sm" data-cookie-essential>Только необходимые</button>' +
      '</div>' +
    '</div>';

  function closeBanner() {
    banner.classList.add('cookie-consent--hide');
    setTimeout(function () {
      if (banner.parentNode) banner.parentNode.removeChild(banner);
    }, 300);
  }

  banner.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.getAttribute) return;
    if (t.getAttribute('data-cookie-accept') !== null) {
      save(VAL_ALL);
      closeBanner();
      grantAnalytics();
    } else if (t.getAttribute('data-cookie-essential') !== null) {
      save(VAL_ESSENTIAL);
      closeBanner();
    }
  });

  function mount() {
    document.body.appendChild(banner);
    requestAnimationFrame(function () {
      banner.classList.add('cookie-consent--visible');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
