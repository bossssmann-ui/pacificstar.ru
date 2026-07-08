/**
 * Pacific Star — i18n Engine v2
 * Languages: Russian (ru), English (en), Chinese (zh), Japanese (ja), Korean (ko)
 *
 * Architecture:
 *   - Translation dictionaries live in /locales/*.json (flat key-value pairs).
 *   - Translatable DOM elements carry data-i18n="key" attributes.
 *   - Attributes (placeholder, aria-label, title) use data-i18n-<attr>="key".
 *   - Russian text stays in the HTML as the no-JS fallback.
 *   - Switching to another language fetches the JSON once, caches it, then
 *     replaces every data-i18n node's textContent with the translated value.
 *   - Switching back to Russian restores the original text from a DOM snapshot.
 *
 * Public API  (window.PSi18n):
 *   setLang(lang)          – switch language
 *   getLang()              – return active language code
 *   t(key)                 – look up a single key in the active dictionary
 *   applyLang(lang)        – (re-)apply translations for the given lang
 */
(function () {
  'use strict';

  /* ─── Language metadata ──────────────────────────────────────────────── */
  var LANGS = {
    ru: { flag: '\u{1F1F7}\u{1F1FA}', label: '\u0420\u0443\u0441\u0441\u043A\u0438\u0439', code: 'RU' },
    en: { flag: '\u{1F1EC}\u{1F1E7}', label: 'English',  code: 'EN' },
    zh: { flag: '\u{1F1E8}\u{1F1F3}', label: '\u4E2D\u6587', code: '\u4E2D\u6587' },
    ja: { flag: '\u{1F1EF}\u{1F1F5}', label: '\u65E5\u672C\u8A9E', code: '\u65E5\u672C\u8A9E' },
    ko: { flag: '\u{1F1F0}\u{1F1F7}', label: '\uD55C\uAD6D\uC5B4', code: '\uD55C\uAD6D\uC5B4' }
  };

  /* ─── CJK font loader ────────────────────────────────────────────────── */
  var CJK_FONTS = {
    zh: 'Noto+Sans+SC:wght@400;500;700',
    ja: 'Noto+Sans+JP:wght@400;500;700',
    ko: 'Noto+Sans+KR:wght@400;500;700'
  };

  function loadCJKFont(lang) {
    if (!CJK_FONTS[lang]) return;
    if (document.querySelector('[data-cjk="' + lang + '"]')) return;
    var old = document.querySelector('[data-cjk]');
    if (old) old.remove();
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.dataset.cjk = lang;
    link.href = 'https://fonts.googleapis.com/css2?family=' + CJK_FONTS[lang] + '&display=swap';
    document.head.appendChild(link);
  }

  /* ─── Dictionary cache ──────────────────────────────────────────────── */
  var dictCache = {};
  var ruSnapshot = {};  /* key -> original Russian text from DOM */
  var attrSnapshot = []; /* [{el, attr, key, orig}] */

  /* ─── Load a language dictionary ────────────────────────────────────── */
  function loadDict(lang, callback) {
    if (dictCache[lang]) {
      callback(dictCache[lang]);
      return;
    }
    var basePath = (document.querySelector('script[src*="i18n.js"]') || {}).src || '';
    var localesBase = basePath.replace(/js\/i18n\.js[^]*$/, 'locales/');
    if (!localesBase || localesBase === basePath) {
      localesBase = 'locales/';
    }

    var xhr = new XMLHttpRequest();
    xhr.open('GET', localesBase + lang + '.json', true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      if (xhr.status === 200 || xhr.status === 0) {
        try {
          dictCache[lang] = JSON.parse(xhr.responseText);
        } catch (e) {
          dictCache[lang] = {};
        }
      } else {
        dictCache[lang] = {};
      }
      callback(dictCache[lang]);
    };
    xhr.send();
  }

  /* ─── Snapshot Russian text from data-i18n elements ────────────────── */
  function snapshotDOM() {
    ruSnapshot = {};
    attrSnapshot = [];

    /* Text content via data-i18n */
    var els = document.querySelectorAll('[data-i18n]');
    els.forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (key && !ruSnapshot[key + '__' + elId(el)]) {
        ruSnapshot[key + '__' + elId(el)] = { el: el, orig: el.textContent };
      }
    });

    /* Attribute translations: data-i18n-placeholder, data-i18n-aria-label, data-i18n-title */
    var attrNames = ['placeholder', 'aria-label', 'title'];
    attrNames.forEach(function (attr) {
      var dataAttr = 'data-i18n-' + attr;
      var attrEls = document.querySelectorAll('[' + dataAttr + ']');
      attrEls.forEach(function (el) {
        var key = el.getAttribute(dataAttr);
        var orig = el.getAttribute(attr) || '';
        attrSnapshot.push({ el: el, attr: attr, key: key, orig: orig });
      });
    });
  }

  /* Unique identifier for element (to handle duplicate keys on same page) */
  var _idCounter = 0;
  function elId(el) {
    if (!el._i18nId) {
      _idCounter++;
      el._i18nId = _idCounter;
    }
    return el._i18nId;
  }

  /* ─── Apply translations ─────────────────────────────────────────────── */
  function applyDict(dict, isRussian) {
    /* Text content */
    var els = document.querySelectorAll('[data-i18n]');
    els.forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (!key) return;
      var snapKey = key + '__' + elId(el);

      if (isRussian) {
        /* Restore original Russian text */
        var snap = ruSnapshot[snapKey];
        if (snap) el.textContent = snap.orig;
      } else if (dict[key] !== undefined) {
        el.textContent = dict[key];
      }
    });

    /* Attributes */
    attrSnapshot.forEach(function (entry) {
      if (isRussian) {
        entry.el.setAttribute(entry.attr, entry.orig);
      } else if (dict[entry.key] !== undefined) {
        entry.el.setAttribute(entry.attr, dict[entry.key]);
      }
    });
  }

  /* ─── Full language switch ──────────────────────────────────────────── */
  function applyLang(lang) {
    if (lang === 'ru') {
      applyDict(null, true);
      finalizeLang(lang);
      return;
    }

    loadDict(lang, function (dict) {
      applyDict(dict, false);
      loadCJKFont(lang);
      finalizeLang(lang);
    });
  }

  function finalizeLang(lang) {
    /* html lang attribute */
    document.documentElement.lang = lang;

    /* CJK body font */
    var fontMap = {
      zh: "'Noto Sans SC',sans-serif",
      ja: "'Noto Sans JP',sans-serif",
      ko: "'Noto Sans KR',sans-serif"
    };
    document.body.style.fontFamily = fontMap[lang] || '';

    /* Page title & meta description */
    var page = (window.location.pathname.split('/').pop() || 'index.html');
    var titleKey = 'meta.' + page.replace('.html', '').replace(/-/g, '_') + '.title';
    var descKey  = 'meta.' + page.replace('.html', '').replace(/-/g, '_') + '.desc';

    if (lang !== 'ru' && dictCache[lang]) {
      if (dictCache[lang][titleKey]) document.title = dictCache[lang][titleKey];
      var metaEl = document.querySelector('meta[name="description"]');
      if (metaEl && dictCache[lang][descKey]) metaEl.setAttribute('content', dictCache[lang][descKey]);
    }

    updateSwitcherUI(lang);

    try {
      document.dispatchEvent(new CustomEvent('ps-lang-change', { detail: { lang: lang } }));
    } catch (e) { /* noop */ }
  }

  /* ─── Language switcher UI ───────────────────────────────────────────── */
  function updateSwitcherUI(lang) {
    var meta = LANGS[lang] || LANGS.ru;
    var flagEl = document.getElementById('langFlag');
    var codeEl = document.getElementById('langCode');
    var btn    = document.getElementById('langBtn');
    if (flagEl) flagEl.textContent = meta.flag;
    if (codeEl) codeEl.textContent = meta.code;
    if (btn) {
      var label = lang === 'ru' ? '\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u044F\u0437\u044B\u043A' : 'Select language';
      btn.setAttribute('aria-label', label);
    }
    document.querySelectorAll('#langDropdown [data-lang]').forEach(function (b) {
      b.setAttribute('data-active', b.dataset.lang === lang ? 'true' : 'false');
    });
  }

  /* ─── Persist & read language ────────────────────────────────────────── */
  function readLangFromUrl() {
    try {
      var params = new URLSearchParams(window.location.search);
      var urlLang = params.get('lang');
      if (urlLang && LANGS[urlLang]) return urlLang;
    } catch (e) { /* old browsers */ }
    return null;
  }

  function getLang() {
    var urlLang = readLangFromUrl();
    if (urlLang) return urlLang;
    var saved;
    try { saved = localStorage.getItem('ps-lang'); } catch (e) { /* private browsing */ }
    if (saved && LANGS[saved]) return saved;
    var browser = (navigator.language || 'ru').slice(0, 2).toLowerCase();
    if (LANGS[browser] && browser !== 'en') return browser;
    return 'ru';
  }

  function setLang(lang) {
    if (!LANGS[lang]) return;
    try { localStorage.setItem('ps-lang', lang); } catch (e) { /* private browsing */ }
    applyLang(lang);
    /* Sync ?lang= in URL for hreflang / shareable links */
    try {
      var url = new URL(window.location.href);
      if (lang === 'ru') {
        url.searchParams.delete('lang');
      } else {
        url.searchParams.set('lang', lang);
      }
      window.history.replaceState({}, '', url.pathname + url.search + url.hash);
    } catch (e) { /* noop */ }
    /* Close dropdown */
    var dd  = document.getElementById('langDropdown');
    var btn = document.getElementById('langBtn');
    if (dd)  dd.classList.remove('open');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  /* ─── Switcher events ────────────────────────────────────────────────── */
  function initSwitcher() {
    var btn = document.getElementById('langBtn');
    var dd  = document.getElementById('langDropdown');
    if (!btn || !dd) return;

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = dd.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    dd.querySelectorAll('[data-lang]').forEach(function (b) {
      b.addEventListener('click', function () { setLang(b.dataset.lang); });
    });

    document.addEventListener('click', function (e) {
      if (!btn.contains(e.target) && !dd.contains(e.target)) {
        dd.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && dd.classList.contains('open')) {
        dd.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        btn.focus();
      }
    });
  }

  /* ─── Public API ─────────────────────────────────────────────────────── */
  window.PSi18n = {
    setLang: setLang,
    getLang: getLang,
    applyLang: applyLang,
    t: function (key) {
      var lang = getLang();
      if (lang === 'ru') {
        return (dictCache.ru && dictCache.ru[key]) || key;
      }
      return (dictCache[lang] && dictCache[lang][key]) || key;
    }
  };

  /* ─── Initialise ─────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    snapshotDOM();
    initSwitcher();
    var lang = getLang();
    if (lang !== 'ru') {
      applyLang(lang);
    } else {
      updateSwitcherUI('ru');
    }
  });

})();
