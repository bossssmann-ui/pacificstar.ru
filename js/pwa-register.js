/**
 * Register service worker for PWA install + offline shell.
 */
(function () {
  'use strict';

  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function () { /* noop */ });
  });
})();
