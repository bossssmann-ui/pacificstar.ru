/**
 * Pacific Star — runtime configuration (set before other app scripts).
 *
 * Production overrides (inject via deploy or inline before this file):
 *   window.PS_API_BASE = 'https://api.pacificstar.ru';  // Phase 0 variant B
 *   window.PS_YM_ID    = 12345678;
 *   window.PS_GA_ID    = 'G-XXXXXXXX';
 */
(function () {
  'use strict';

  window.PS_API_BASE = window.PS_API_BASE || 'https://bossssmann-ui-pacificstar-ru-73ae.twc1.net';
  window.PS_YM_ID    = window.PS_YM_ID    || 0;
  window.PS_GA_ID    = window.PS_GA_ID    || '';

  window.PSApi = {
    /** Build absolute API URL; empty PS_API_BASE → same-origin /api/* */
    url: function (path) {
      var base = String(window.PS_API_BASE || '').replace(/\/$/, '');
      return base + path;
    }
  };
})();
