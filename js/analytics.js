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

  /* Returns { goal, channel? } — never the raw href (no phone/email in analytics). */
  function detectContact(href) {
    if (!href) return null;
    if (href.indexOf('tel:') === 0)     return { goal: 'phone_click' };
    if (href.indexOf('mailto:') === 0)  return { goal: 'email_click' };
    if (href.indexOf('wa.me') !== -1)   return { goal: 'messenger_click', channel: 'whatsapp' };
    if (href.indexOf('t.me') !== -1)    return { goal: 'messenger_click', channel: 'telegram' };
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

      /* Auto-detect contact links — send ONLY safe params (no phone/email/href) */
      if (el.tagName && el.tagName.toUpperCase() === 'A') {
        var href = el.getAttribute('href') || '';
        var contact = detectContact(href);
        if (contact) {
          var params = { page: window.location.pathname };
          if (contact.channel) params.channel = contact.channel;
          track(contact.goal, params);
          return;
        }
      }

      el = el.parentElement;
      i++;
    }
  });

  /* ── form_start: first interaction with a lead form (once per form) ──
     Attempt/success/error are fired explicitly from form handlers via PSTrack:
     form_error (validation/network/server) and lead_accepted (server ok:true only).
     The calculator fires calculator_used, never a lead. This replaces the old
     generic form_submit, which conflated attempts, calculator use and leads. */

  var LEAD_FORMS = { contactForm: 1, heroLeadForm: 1, newOrderForm: 1, registerForm: 1, callbackForm: 1 };
  var formStarted = {};

  document.addEventListener('focusin', function (e) {
    var el = e.target;
    var form = (el && el.form) ? el.form : (el && el.closest ? el.closest('form') : null);
    if (!form || !form.id || !LEAD_FORMS[form.id]) return;
    if (formStarted[form.id]) return;
    formStarted[form.id] = 1;
    track('form_start', { form_id: form.id, page: window.location.pathname });
  });

})();
