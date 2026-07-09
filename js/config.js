/**
 * Pacific Star — runtime configuration (set before other app scripts).
 *
 * Forms use PHP on shared hosting (api/*.php) — no App Platform ENV needed.
 * Set PS_MAIL_BACKEND = 'node' + PS_API_BASE to use Timeweb App Platform instead.
 *
 * Yandex Metrika: set PS_YM_ID below or GitHub Secret PS_YM_ID (injected at deploy).
 */
(function () {
  'use strict';

  window.PS_MAIL_BACKEND = window.PS_MAIL_BACKEND || 'php';
  window.PS_API_BASE = window.PS_API_BASE || '';
  window.PS_YM_ID    = window.PS_YM_ID    || 110523171;
  window.PS_GA_ID    = window.PS_GA_ID    || '';

  window.PSApi = {
    /**
     * php → same-origin /api/contact.php (shared hosting)
     * node → PS_API_BASE + /api/contact (App Platform)
     */
    url: function (path) {
      if (window.PS_MAIL_BACKEND === 'php') {
        return path.replace(/\/api\/([a-z]+)$/, '/api/$1.php');
      }
      var base = String(window.PS_API_BASE || '').replace(/\/$/, '');
      return base + path;
    }
  };
})();
