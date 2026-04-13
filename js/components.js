/**
 * components.js — Shared site-wide components (header, mobile nav, footer,
 * floating contacts, callback panel, scroll-to-top button).
 *
 * Loaded with `defer` BEFORE i18n.js & main.js so that injected DOM is
 * available for text-node snapshotting and event binding.
 *
 * Placeholder elements use data-component="<name>" in the HTML:
 *   <div data-component="header" data-theme-toggle></div>
 *   <div data-component="footer" data-description="extended"></div>
 *   <div data-component="floating-contacts"></div>
 *   <div data-component="callback-panel"></div>
 *   <div data-component="scroll-top"></div>
 */
'use strict';

(function () {

  /* ── SVG icons (shared) ─────────────────────────────────────────────── */

  var PHONE_SVG_16 =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"' +
    ' fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">' +
    '<path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07' +
    ' 11.2 19.79 19.79 0 010 2.57 2 2 0 012 .38h3a2 2 0 012 1.72c.127.96.361' +
    ' 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.26a16 16 0 006.29 6.29l1.25-1.25a2' +
    ' 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>';

  var PHONE_SVG_18 =
    '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"' +
    ' fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">' +
    '<path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07' +
    ' 11.2 19.79 19.79 0 010 2.57 2 2 0 012 .38h3a2 2 0 012 1.72c.127.96.361' +
    ' 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.26a16 16 0 006.29 6.29l1.25-1.25a2 2' +
    ' 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>';

  var PHONE_SVG_22 =
    '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"' +
    ' fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">' +
    '<path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 11.2' +
    ' 19.79 19.79 0 010 2.57 2 2 0 012 .38h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2' +
    ' 2 0 01-.45 2.11L6.09 8.26a16 16 0 006.29 6.29l1.25-1.25a2 2 0 012.11-.45c.907.339' +
    ' 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>';

  var CHEVRON_UP_SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"' +
    ' fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">' +
    '<polyline points="18 15 12 9 6 15"/></svg>';

  /* ── Theme toggle HTML ──────────────────────────────────────────────── */

  var THEME_TOGGLE =
    '<button type="button" class="theme-toggle" id="themeToggle"' +
    ' aria-label="Включить тёмную тему" title="Переключить тему">' +
    '<svg class="icon-moon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"' +
    ' fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
    '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>' +
    '<svg class="icon-sun" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"' +
    ' fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="5"/>' +
    '<line x1="12" y1="1" x2="12" y2="3"/>' +
    '<line x1="12" y1="21" x2="12" y2="23"/>' +
    '<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>' +
    '<line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>' +
    '<line x1="1" y1="12" x2="3" y2="12"/>' +
    '<line x1="21" y1="12" x2="23" y2="12"/>' +
    '<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>' +
    '<line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>' +
    '</button>';

  /* ── Language switcher HTML ─────────────────────────────────────────── */

  var LANG_SWITCHER =
    '<div class="lang-switcher" id="langSwitcher">' +
    '<button type="button" class="lang-btn" id="langBtn"' +
    ' aria-haspopup="listbox" aria-expanded="false" aria-label="Выбрать язык">' +
    '<span class="lang-flag" id="langFlag">\u{1F1F7}\u{1F1FA}</span>' +
    '<span class="lang-code" id="langCode">RU</span>' +
    '<svg class="lang-chevron" width="10" height="10" viewBox="0 0 24 24"' +
    ' fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">' +
    '<polyline points="6 9 12 15 18 9"/></svg></button>' +
    '<ul class="lang-dropdown" role="listbox" id="langDropdown">' +
    '<li role="option"><button type="button" data-lang="ru" data-active="true">\u{1F1F7}\u{1F1FA} Русский</button></li>' +
    '<li role="option"><button type="button" data-lang="en">\u{1F1EC}\u{1F1E7} English</button></li>' +
    '<li role="option"><button type="button" data-lang="zh">\u{1F1E8}\u{1F1F3} 中文</button></li>' +
    '<li role="option"><button type="button" data-lang="ja">\u{1F1EF}\u{1F1F5} 日本語</button></li>' +
    '<li role="option"><button type="button" data-lang="ko">\u{1F1F0}\u{1F1F7} 한국어</button></li>' +
    '</ul></div>';

  /* ── Header ─────────────────────────────────────────────────────────── */

  /* Inline SVGs for messenger links in header */
  var WA_SVG_16 =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"' +
    ' fill="currentColor" aria-hidden="true">' +
    '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15' +
    '-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475' +
    '-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52' +
    '.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207' +
    '-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297' +
    '-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487' +
    '.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413' +
    '.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>' +
    '<path d="M12 0C5.373 0 0 5.373 0 12c0 2.135.559 4.14 1.535 5.878L0 24l6.273-1.508A11.955' +
    ' 11.955 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.896 0-3.678-.513-5.2-1.408' +
    'l-.368-.224-3.85.924.999-3.77-.248-.386A9.955 9.955 0 012 12C2 6.486 6.486 2 12 2s10' +
    ' 4.486 10 10-4.486 10-10 10z"/></svg>';

  var TG_SVG_16 =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"' +
    ' fill="currentColor" aria-hidden="true">' +
    '<path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894' +
    ' 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295' +
    '-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.26 13.593l-2.95-.924c-.64' +
    '-.203-.658-.64.135-.954l11.566-4.458c.537-.194 1.006.131.883.964z"/></svg>';

  /* Nav dropdown chevron */
  var NAV_CHEVRON =
    '<svg class="nav-chevron" width="12" height="12" viewBox="0 0 24 24"' +
    ' fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">' +
    '<polyline points="6 9 12 15 18 9"/></svg>';

  function buildHeader(showThemeToggle) {
    return (
      '<header class="site-header"><div class="container"><div class="header-inner">' +
      '<a href="index.html" class="logo" aria-label="Pacific Star — главная страница">' +
      '<div class="logo-icon" aria-hidden="true"><img src="img/logo-icon.svg" alt="" width="44" height="44" loading="eager"></div>' +
      '<div class="logo-text"><strong>Pacific Star</strong><span data-i18n="comp.header.logo_subtitle">Логистика</span></div></a>' +
      '<nav class="nav-menu" aria-label="Основное меню">' +
      '<a href="index.html" class="nav-link" data-i18n="nav.home">Главная</a>' +
      '<a href="about.html" class="nav-link" data-i18n="nav.about">О нас</a>' +
      '<div class="nav-item">' +
      '<button type="button" class="nav-toggle" aria-expanded="false" aria-haspopup="true" data-i18n="nav.services">Услуги ' + NAV_CHEVRON + '</button>' +
      '<div class="nav-dropdown" role="menu"><div class="nav-dropdown-inner">' +
      '<a href="services.html" class="nav-dropdown-link" role="menuitem" data-i18n="nav.all_services_rates">Все услуги и тарифы</a>' +
      '<a href="severnyy-zavoz.html" class="nav-dropdown-link" role="menuitem" data-i18n="nav.northern_supply">Северный завоз</a>' +
      '<a href="kabotazh.html" class="nav-dropdown-link" role="menuitem" data-i18n="nav.cabotage">Каботажные перевозки</a>' +
      '<a href="avto-dfo.html" class="nav-dropdown-link" role="menuitem" data-i18n="nav.truck_dfo">Автодоставка ДФО</a>' +
      '</div></div></div>' +
      '<a href="contacts.html" class="nav-link" data-i18n="nav.contacts">Контакты</a></nav>' +
      '<div class="header-cta">' +
      '<a href="tel:+79147285880" class="header-phone" aria-label="Позвонить нам" data-i18n-aria-label="comp.header.call_aria">' +
      PHONE_SVG_16 + ' +7\u00a0(914)\u00a0728\u201158\u201180</a>' +
      '<a href="https://wa.me/79147285880" class="header-messenger" aria-label="WhatsApp"' +
      ' target="_blank" rel="noopener noreferrer">' + WA_SVG_16 + '</a>' +
      '<a href="https://t.me/KhmelRoman" class="header-messenger" aria-label="Telegram"' +
      ' target="_blank" rel="noopener noreferrer">' + TG_SVG_16 + '</a>' +
      (showThemeToggle ? THEME_TOGGLE : '') +
      LANG_SWITCHER +
      '<a href="contacts.html#contactForm" class="btn btn-primary header-btn" data-track="cta_click" data-track-label="header_cta" data-i18n="cta.request_quote">Запросить расчёт</a></div>' +
      '<button class="burger" aria-label="Открыть меню" data-i18n-aria-label="comp.header.burger_aria" aria-expanded="false" type="button">' +
      '<span class="burger-line"></span><span class="burger-line"></span><span class="burger-line"></span></button>' +
      '</div></div></header>'
    );
  }

  /* ── Mobile nav ─────────────────────────────────────────────────────── */

  var MOBILE_NAV =
    '<nav class="mobile-nav" aria-label="Мобильное меню">' +
    '<a href="index.html" class="nav-link" data-i18n="nav.home">Главная</a>' +
    '<a href="about.html" class="nav-link" data-i18n="nav.about">О нас</a>' +
    '<div class="mobile-nav-group">' +
    '<button type="button" class="mobile-nav-toggle nav-link" data-i18n="nav.services">Услуги <span class="mobile-nav-arrow" aria-hidden="true">\u203A</span></button>' +
    '<div class="mobile-nav-sub">' +
    '<a href="services.html" class="nav-link" data-i18n="nav.all_services_rates">Все услуги и тарифы</a>' +
    '<a href="severnyy-zavoz.html" class="nav-link" data-i18n="nav.northern_supply">Северный завоз</a>' +
    '<a href="kabotazh.html" class="nav-link" data-i18n="nav.cabotage">Каботажные перевозки</a>' +
    '<a href="avto-dfo.html" class="nav-link" data-i18n="nav.truck_dfo">Автодоставка ДФО</a>' +
    '</div></div>' +
    '<a href="contacts.html" class="nav-link" data-i18n="nav.contacts">Контакты</a>' +
    '<a href="tel:+79147285880" class="header-phone">' +
    PHONE_SVG_18 + ' +7\u00a0(914)\u00a0728\u201158\u201180</a>' +
    '<div class="mobile-nav-messengers">' +
    '<a href="https://wa.me/79147285880" class="mobile-nav-msg" aria-label="WhatsApp"' +
    ' target="_blank" rel="noopener noreferrer">' + WA_SVG_16 + ' WhatsApp</a>' +
    '<a href="https://t.me/KhmelRoman" class="mobile-nav-msg" aria-label="Telegram"' +
    ' target="_blank" rel="noopener noreferrer">' + TG_SVG_16 + ' Telegram</a></div>' +
    '<a href="contacts.html#contactForm" class="btn btn-primary header-btn" data-track="cta_click" data-track-label="mobile_nav_cta" data-i18n="cta.request_quote">Запросить расчёт</a></nav>';

  /* ── Footer ─────────────────────────────────────────────────────────── */

  var FOOTER_DESC_DEFAULT = 'Транспортно-логистическая компания, оказывающая полный спектр услуг по перевозке, хранению и экспедированию грузов с 2012\u00a0года.';
  var FOOTER_DESC_EXTENDED = 'Транспортно-логистическая компания, оказывающая полный спектр услуг по перевозке, хранению и экспедированию грузов по России и за рубежом с 2012\u00a0года.';
  var FOOTER_DESC_ARCTIC = 'Транспортно-логистическая компания, оказывающая полный спектр услуг по перевозке, хранению и экспедированию грузов с 2012\u00a0года. Специализируемся на Дальнем Востоке и Арктике.';

  function buildFooter(descVariant) {
    var desc = FOOTER_DESC_DEFAULT;
    if (descVariant === 'extended') desc = FOOTER_DESC_EXTENDED;
    else if (descVariant === 'arctic') desc = FOOTER_DESC_ARCTIC;

    return (
      '<footer class="site-footer"><div class="container"><div class="footer-grid">' +
      '<div class="footer-brand">' +
      '<a href="index.html" class="logo" aria-label="Pacific Star — главная">' +
      '<div class="logo-icon" aria-hidden="true"><img src="img/logo-icon.svg" alt="" width="44" height="44" loading="eager"></div>' +
      '<div class="logo-text"><strong>Pacific Star</strong><span data-i18n="comp.header.logo_subtitle">Логистика</span></div></a>' +
      '<p data-i18n="footer.desc_' + (descVariant || 'default') + '">' + desc + '</p>' +
      '<nav class="social-links" aria-label="Мы в социальных сетях" data-i18n-aria-label="comp.footer.social_aria">' +
      '<a href="#" class="social-link" aria-label="ВКонтакте">ВК</a>' +
      '<a href="https://t.me/KhmelRoman" class="social-link" aria-label="Telegram" target="_blank" rel="noopener noreferrer">TG</a>' +
      '<a href="https://wa.me/79147285880" class="social-link" aria-label="WhatsApp" target="_blank" rel="noopener noreferrer">WA</a>' +
      '</nav></div>' +
      '<div><p class="footer-col-title" data-i18n="footer.nav_title">Навигация</p>' +
      '<nav class="footer-nav" aria-label="Навигация в подвале" data-i18n-aria-label="comp.footer.nav_footer_aria">' +
      '<a href="index.html" data-i18n="nav.home">Главная</a>' +
      '<a href="about.html" data-i18n="footer.about">О компании</a>' +
      '<a href="services.html" data-i18n="nav.services">Услуги</a>' +
      '<a href="severnyy-zavoz.html" data-i18n="nav.northern_supply">Северный завоз</a>' +
      '<a href="kabotazh.html" data-i18n="nav.cabotage">Каботажные перевозки</a>' +
      '<a href="avto-dfo.html" data-i18n="nav.truck_dfo">Автодоставка ДФО</a>' +
      '<a href="contacts.html" data-i18n="nav.contacts">Контакты</a>' +
      '<a href="integrations.html" data-i18n="comp.footer.integrations">Интеграции</a></nav></div>' +
      '<div><p class="footer-col-title" data-i18n="comp.footer.services_title">Услуги</p>' +
      '<nav class="footer-nav" aria-label="Услуги">' +
      '<a href="services.html" data-i18n="comp.footer.freight">Грузоперевозки</a>' +
      '<a href="severnyy-zavoz.html" data-i18n="nav.northern_supply">Северный завоз</a>' +
      '<a href="kabotazh.html" data-i18n="nav.cabotage">Каботажные перевозки</a>' +
      '<a href="avto-dfo.html" data-i18n="nav.truck_dfo">Автодоставка ДФО</a>' +
      '<a href="services.html" data-i18n="comp.footer.forwarding">Экспедирование</a></nav></div>' +
      '<div><p class="footer-col-title" data-i18n="comp.footer.contacts_title">Контакты</p>' +
      '<div class="footer-contacts">' +
      '<div class="footer-contact-item"><span aria-hidden="true">\u{1F4CD}</span>' +
      '<span data-i18n="footer.address">Приморский край, г.\u00a0Находка, ул.\u00a0Северный проспект, 47с2</span></div>' +
      '<div class="footer-contact-item"><span aria-hidden="true">\u{1F4DE}</span>' +
      '<span><a href="tel:+79147285880">+7\u00a0(914)\u00a0728\u201158\u201180</a></span></div>' +
      '<div class="footer-contact-item"><span aria-hidden="true">\u{2709}\u{FE0F}</span>' +
      '<span><a href="mailto:info@pacificstar.ru">info@pacificstar.ru</a></span></div>' +
      '<div class="footer-contact-item"><span aria-hidden="true">\u{1F550}</span>' +
      '<span data-i18n="comp.footer.hours">Пн\u2013Пт: 9:00\u201318:00<br>Сб\u2013Вс: по договорённости</span></div>' +
      '</div></div></div>' +
      '<div class="footer-bottom">' +
      '<p class="footer-bottom-text" data-i18n="footer.copyright">\u00a9 2012\u20132026 ООО \u00abPacific Star\u00bb. Все права защищены.</p>' +
      '<p class="footer-bottom-text footer-legal" data-i18n="comp.footer.legal">ИНН\u00a02508139498 / ОГРН\u00a01192536024498</p>' +
      '<div class="footer-bottom-links">' +
      '<a href="privacy.html" data-i18n="footer.privacy_policy">Политика конфиденциальности</a>' +
      '<a href="privacy.html" data-i18n="comp.footer.terms">Условия использования</a>' +
      '</div></div></div></footer>'
    );
  }

  /* ── Floating contacts ──────────────────────────────────────────────── */

  var WA_URL = 'https://wa.me/79147285880?text=%D0%97%D0%B4%D1%80%D0%B0%D0%B2%D1%81%D1%82%D0%B2%D1%83%D0%B9%D1%82%D0%B5%21%20%D0%98%D0%BD%D1%82%D0%B5%D1%80%D0%B5%D1%81%D1%83%D1%8E%D1%81%D1%8C%20%D0%B3%D1%80%D1%83%D0%B7%D0%BE%D0%BF%D0%B5%D1%80%D0%B5%D0%B2%D0%BE%D0%B7%D0%BA%D0%BE%D0%B9.';

  var FLOATING_CONTACTS =
    '<div class="floating-contacts" id="floatingContacts">' +
    '<div class="floating-menu" id="floatingMenu" role="menu" aria-label="Способы связи">' +
    '<a href="' + WA_URL + '" class="floating-item floating-wa" target="_blank" rel="noopener noreferrer"' +
    ' role="menuitem" aria-label="WhatsApp">' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
    '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>' +
    '<path d="M12 0C5.373 0 0 5.373 0 12c0 2.135.559 4.14 1.535 5.878L0 24l6.273-1.508A11.955 11.955 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.896 0-3.678-.513-5.2-1.408l-.368-.224-3.85.924.999-3.77-.248-.386A9.955 9.955 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>' +
    '<span>WhatsApp</span></a>' +
    '<a href="https://t.me/KhmelRoman" class="floating-item floating-tg" target="_blank" rel="noopener noreferrer"' +
    ' role="menuitem" aria-label="Telegram">' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
    '<path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.26 13.593l-2.95-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.537-.194 1.006.131.883.964z"/></svg>' +
    '<span>Telegram</span></a>' +
    '<button type="button" class="floating-item floating-cb" id="openCallback" role="menuitem" data-track="cta_click" data-track-label="floating_callback">' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"' +
    ' fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">' +
    '<path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 11.2 19.79 19.79 0 010 2.57 2 2 0 012 .38h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.26a16 16 0 006.29 6.29l1.25-1.25a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>' +
    '<span data-i18n="common.callback">Перезвоним</span></button></div>' +
    '<button type="button" class="floating-toggle" id="floatingToggle"' +
    ' aria-label="Связаться с нами" data-i18n-aria-label="comp.floating.contact_aria" aria-expanded="false" aria-controls="floatingMenu">' +
    PHONE_SVG_22 + '</button></div>';

  /* ── Callback panel ─────────────────────────────────────────────────── */

  var CALLBACK_PANEL =
    '<div class="callback-overlay" id="callbackOverlay"></div>' +
    '<div class="callback-panel" id="callbackPanel" role="dialog" aria-modal="true"' +
    ' aria-labelledby="callback-title" aria-hidden="true">' +
    '<button type="button" class="callback-close" id="callbackClose" aria-label="Закрыть панель" data-i18n-aria-label="comp.callback.close_aria">\u2715</button>' +
    '<div class="callback-icon" aria-hidden="true">\u{1F4DE}</div>' +
    '<h3 id="callback-title" data-i18n="form.callback.title">Перезвоним вам</h3>' +
    '<p class="callback-desc" data-i18n="form.callback.desc">Менеджер свяжется с вами в течение 5\u00a0минут в рабочее время</p>' +
    '<form id="callbackForm" novalidate>' +
    '<div class="form-group">' +
    '<label for="cbName" class="form-label" data-i18n="form.callback.name_label">Ваше имя</label>' +
    '<input type="text" id="cbName" name="name" class="form-control" placeholder="Иван" autocomplete="given-name"></div>' +
    '<div class="form-group">' +
    '<label for="cbPhone" class="form-label" data-i18n="comp.callback.phone_required">Телефон <span class="form-required">(обязательно)</span></label>' +
    '<input type="tel" id="cbPhone" name="phone" class="form-control" placeholder="+7 (___) ___-__-__" required autocomplete="tel"></div>' +
    '<div class="form-group">' +
    '<label for="cbTime" class="form-label" data-i18n="form.callback.time_label">Удобное время</label>' +
    '<select id="cbTime" name="time" class="form-control">' +
    '<option value="any" data-i18n="form.callback.time_any">Любое рабочее время (9:00\u201318:00)</option>' +
    '<option value="morning" data-i18n="form.callback.time_morning">Утром (9:00\u201312:00)</option>' +
    '<option value="afternoon" data-i18n="form.callback.time_afternoon">Днём (12:00\u201315:00)</option>' +
    '<option value="evening" data-i18n="form.callback.time_evening">Вечером (15:00\u201318:00)</option></select></div>' +
    '<button type="submit" class="btn btn-primary" style="width:100%;margin-top:8px;" data-i18n="form.callback.submit">Перезвоните мне</button></form>' +
    '<div class="callback-success" id="callbackSuccess" style="display:none;" aria-live="polite">' +
    '<div class="cb-ok-icon" aria-hidden="true">\u2705</div>' +
    '<h4 data-i18n="form.callback.success_title">Заявка принята!</h4>' +
    '<p data-i18n="form.callback.success_desc">Перезвоним в ближайшее время</p></div>' +
    '<p class="callback-notice" data-i18n="form.privacy_notice">Нажимая кнопку, вы соглашаетесь на <a href="privacy.html">обработку персональных данных</a></p></div>';

  /* ── Scroll-to-top button ───────────────────────────────────────────── */

  var SCROLL_TOP =
    '<button class="scroll-top" aria-label="Наверх" data-i18n-aria-label="comp.scroll_top.aria" title="Вернуться наверх" data-i18n-title="comp.scroll_top.title" type="button">' +
    CHEVRON_UP_SVG + '</button>';

  /* ── Injection logic ────────────────────────────────────────────────── */

  function inject(selector, html) {
    var el = document.querySelector(selector);
    if (el) el.outerHTML = html;
  }

  /* Header — data-theme-toggle attribute controls theme toggle visibility */
  var headerEl = document.querySelector('[data-component="header"]');
  if (headerEl) {
    var showThemeToggle = headerEl.hasAttribute('data-theme-toggle');
    headerEl.outerHTML = buildHeader(showThemeToggle) + MOBILE_NAV;
  }

  /* Footer — data-description="extended|arctic" controls description text */
  var footerEl = document.querySelector('[data-component="footer"]');
  if (footerEl) {
    footerEl.outerHTML = buildFooter(footerEl.getAttribute('data-description') || '');
  }

  /* Floating contacts */
  inject('[data-component="floating-contacts"]', FLOATING_CONTACTS);

  /* Callback panel */
  inject('[data-component="callback-panel"]', CALLBACK_PANEL);

  /* Scroll-to-top button */
  inject('[data-component="scroll-top"]', SCROLL_TOP);

})();
