/**
 * Pacific Star — Analytics & Conversion Tracking
 *
 * Lightweight event-delegation layer for Yandex Metrica and Google Analytics / GTM.
 *
 * Configuration (set BEFORE this script loads):
 *   window.PS_YM_ID = 12345678;   // Yandex Metrica counter ID
 *   window.PS_GA_ID = 'G-XXXXXX'; // Google Analytics measurement ID (optional)
 *
 * Tracked events:
 *   - form submissions  (auto-detected by <form> submit)
 *   - phone clicks      (auto-detected by href="tel:…")
 *   - email clicks      (auto-detected by href="mailto:…")
 *   - WhatsApp clicks   (auto-detected by href containing wa.me)
 *   - Telegram clicks   (auto-detected by href containing t.me)
 *   - explicit goals    (any element with data-track="<goal_name>")
 *
 * All calls are no-ops when analytics SDKs are not loaded.
 */
(function () {
  'use strict';

  /* ── Yandex Metrica loader ─────────────────────────────────────────── */

  var ymId = window.PS_YM_ID;
  var gaId = window.PS_GA_ID;

  function initYandexMetrika() {
    var id = Number(ymId);
    if (!id || id <= 0) return;

    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
      m[i].l = 1 * new Date();
      for (var j = 0; j < document.scripts.length; j++) {
        if (document.scripts[j].src === r) return;
      }
      k = e.createElement(t);
      a = e.getElementsByTagName(t)[0];
      k.async = 1;
      k.src = r + '?id=' + id;
      a.parentNode.insertBefore(k, a);
    })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');

    window.ym(id, 'init', {
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      webvisor: true,
      ecommerce: 'dataLayer'
    });
  }

  function initGoogleAnalytics() {
    if (!gaId || typeof gaId !== 'string') return;

    var gtagScript = document.createElement('script');
    gtagScript.async = true;
    gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(gaId);
    document.head.appendChild(gtagScript);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', gaId);
  }

  function bootAnalytics() {
    initYandexMetrika();
    initGoogleAnalytics();
  }

  function hasAnalyticsConsent() {
    try { return localStorage.getItem('ps_cookie_consent') === 'all'; } catch (_) { return false; }
  }

  if (hasAnalyticsConsent()) {
    bootAnalytics();
  } else {
    window.addEventListener('ps:analytics-consent', bootAnalytics, { once: true });
  }

  /* ── Helpers ──────────────────────────────────────────────────────── */

  /**
   * Send a goal / event to every configured analytics provider.
   * @param {string} goalName  — e.g. 'form_submit', 'phone_click'
   * @param {Object} [params] — optional key-value payload
   */
  function track(goalName, params) {
    /* Yandex Metrica */
    if (ymId && typeof window.ym === 'function') {
      try { window.ym(ymId, 'reachGoal', goalName, params || {}); } catch (_) { /* noop */ }
    }

    /* Google Analytics (gtag.js) */
    if (typeof window.gtag === 'function') {
      try { window.gtag('event', goalName, params || {}); } catch (_) { /* noop */ }
    }

    /* Google Tag Manager dataLayer */
    if (window.dataLayer && typeof window.dataLayer.push === 'function') {
      try {
        var dl = { event: goalName };
        if (params) {
          for (var k in params) {
            if (params.hasOwnProperty(k)) dl[k] = params[k];
          }
        }
        window.dataLayer.push(dl);
      } catch (_) { /* noop */ }
    }
  }

  /* Expose for programmatic use from other scripts */
  window.PSTrack = track;

  /* ── Auto-detect link type from href ─────────────────────────────── */

  function detectGoal(href) {
    if (!href) return null;
    if (href.indexOf('tel:') === 0)     return 'phone_click';
    if (href.indexOf('mailto:') === 0)  return 'email_click';
    if (href.indexOf('wa.me') !== -1)   return 'whatsapp_click';
    if (href.indexOf('t.me') !== -1)    return 'telegram_click';
    return null;
  }

  /* ── Click delegation ────────────────────────────────────────────── */

  document.addEventListener('click', function (e) {
    var el = e.target;

    /* Walk up to find the nearest trackable element (max 10 levels) */
    var i = 0;
    while (el && el !== document && i < 10) {
      var explicit = el.getAttribute && el.getAttribute('data-track');
      if (explicit) {
        track(explicit, {
          track_label: el.getAttribute('data-track-label') || '',
          page: window.location.pathname
        });
        return;
      }

      /* Auto-detect links */
      if (el.tagName && el.tagName.toUpperCase() === 'A') {
        var href = el.getAttribute('href') || '';
        var goal = detectGoal(href);
        if (goal) {
          track(goal, {
            track_label: href,
            page: window.location.pathname
          });
          return;
        }
      }

      el = el.parentElement;
      i++;
    }
  });

  /* ── Form submission delegation ──────────────────────────────────── */

  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form || !form.tagName || form.tagName.toUpperCase() !== 'FORM') return;

    var formId = form.id || form.getAttribute('name') || 'unknown';
    var label = form.getAttribute('data-track-label') || formId;

    track('form_submit', {
      track_label: label,
      form_id: formId,
      page: window.location.pathname
    });
  });

})();
