/* ── Account page JS ─────────────────────────────────────────────────── */
(function () {
  'use strict';

  /* Tab switching */
  var tabs   = document.querySelectorAll('.account-tab');
  var panels = document.querySelectorAll('.account-panel');

  function switchTab(id) {
    tabs.forEach(function (t) {
      var active = t.dataset.tab === id;
      t.classList.toggle('active', active);
      t.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    panels.forEach(function (p) {
      p.classList.toggle('hidden', p.id !== 'panel-' + id);
    });
  }

  tabs.forEach(function (t) {
    t.addEventListener('click', function () { switchTab(t.dataset.tab); });
  });

  /* "Switch" links inside forms */
  document.querySelectorAll('[data-switch]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      switchTab(link.dataset.switch);
      window.scrollTo({ top: document.querySelector('.account-tabs').offsetTop - 80, behavior: 'smooth' });
    });
  });

  /* Password toggle */
  function togglePwd(inputId, btnId) {
    var btn = document.getElementById(btnId);
    var inp = document.getElementById(inputId);
    if (!btn || !inp) return;
    btn.addEventListener('click', function () {
      inp.type = inp.type === 'password' ? 'text' : 'password';
      btn.textContent = inp.type === 'password' ? '\u{1F441}' : '\u{1F648}';
    });
  }
  togglePwd('signinPassword', 'toggleSigninPwd');
  togglePwd('regPassword',    'toggleRegPwd');

  /* Password strength indicator */
  var pwdInput    = document.getElementById('regPassword');
  var pwdStrength = document.getElementById('pwdStrength');
  if (pwdInput && pwdStrength) {
    pwdInput.addEventListener('input', function () {
      var v = pwdInput.value;
      var score = 0;
      if (v.length >= 8)  score++;
      if (v.length >= 12) score++;
      if (/[A-Z]/.test(v)) score++;
      if (/[0-9]/.test(v)) score++;
      if (/[^A-Za-z0-9]/.test(v)) score++;
      var labels = ['', 'Слабый', 'Слабый', 'Средний', 'Хороший', 'Надёжный'];
      var classes = ['', 'pwd-weak', 'pwd-weak', 'pwd-medium', 'pwd-good', 'pwd-strong'];
      pwdStrength.textContent  = v.length ? labels[score] || 'Надёжный' : '';
      pwdStrength.className = 'password-strength ' + (classes[score] || 'pwd-strong');
    });
  }

  /* ── Show dashboard after login / register ── */
  function showDashboard(name, email, showSmtpNotice) {
    var dashTab = document.getElementById('tab-dashboard');
    var signinTab = document.getElementById('tab-signin');
    var registerTab = document.getElementById('tab-register');
    if (dashTab) dashTab.style.display = '';
    if (signinTab) signinTab.style.display = 'none';
    if (registerTab) registerTab.style.display = 'none';

    var nameEl = document.getElementById('dashName');
    var emailEl = document.getElementById('dashEmail');
    if (nameEl) nameEl.textContent = name || 'Пользователь';
    if (emailEl) emailEl.textContent = email || '—';

    var smtpNotice = document.getElementById('dashSmtpNotice');
    if (smtpNotice) smtpNotice.style.display = showSmtpNotice ? 'flex' : 'none';

    switchTab('dashboard');
    window.scrollTo({ top: document.querySelector('.account-tabs').offsetTop - 80, behavior: 'smooth' });
  }

  /* Logout */
  var logoutBtn = document.getElementById('dashLogout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      var dashTab = document.getElementById('tab-dashboard');
      var signinTab = document.getElementById('tab-signin');
      var registerTab = document.getElementById('tab-register');
      if (dashTab) dashTab.style.display = 'none';
      if (signinTab) signinTab.style.display = '';
      if (registerTab) registerTab.style.display = '';
      switchTab('signin');
    });
  }

  /* Sign in form */
  var signinForm = document.getElementById('signinForm');
  if (signinForm) {
    signinForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = signinForm.querySelector('[type="submit"]');
      var emailVal = (document.getElementById('signinEmail').value || '').trim();
      btn.disabled = true;
      btn.textContent = 'Входим…';
      setTimeout(function () {
        btn.disabled = false;
        btn.textContent = 'Войти';
        showDashboard(emailVal.split('@')[0], emailVal, false);
      }, 1200);
    });
  }

  /* Register form */
  var registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = registerForm.querySelector('[type="submit"]');
      var pwd = document.getElementById('regPassword');
      var cnf = document.getElementById('regConfirm');
      if (pwd && cnf && pwd.value !== cnf.value) {
        cnf.style.borderColor = '#e74c3c';
        cnf.focus();
        return;
      }
      var nameVal = (document.getElementById('regName').value || '').trim();
      var lastVal = (document.getElementById('regLastName').value || '').trim();
      var emailVal = (document.getElementById('regEmail').value || '').trim();
      var phoneVal = (document.getElementById('regPhone').value || '').trim();
      var fullName = (nameVal + ' ' + lastVal).trim();
      btn.disabled = true;
      btn.textContent = 'Регистрируем…';

      fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: nameVal,
          lastName: lastVal,
          email: emailVal,
          phone: phoneVal
        })
      })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        btn.disabled = false;
        btn.textContent = 'Зарегистрироваться';
        showDashboard(fullName, emailVal, !data.ok);
      })
      .catch(function () {
        btn.disabled = false;
        btn.textContent = 'Зарегистрироваться';
        showDashboard(fullName, emailVal, true);
      });
    });
  }

  /* Track form — demo data */
  var DEMO_TRACKS = {
    'PS-2025-001234': {
      status: 'В пути',
      route: 'Москва \u2192 Владивосток',
      events: [
        { date: '15.02.2025 09:00', place: 'Москва, склад Pacific Star',        text: '\u{1F4E6} Груз принят на склад, упакован и взвешен' },
        { date: '15.02.2025 18:30', place: 'Москва, ст. Москва-Товарная',       text: '\u{1F682} Отправлен ж/д рейсом \u2116\u00a02803' },
        { date: '18.02.2025 11:00', place: 'Новосибирск',                       text: '\u{1F504} Перегрузка в Новосибирске' },
        { date: '21.02.2025 07:00', place: 'Хабаровск',                         text: '\u{1F504} Прибыл в Хабаровск' },
        { date: '23.02.2025 14:00', place: 'Владивосток \u2014 ожидается',       text: '\u{1F4CD} Расчётное время прибытия: 25.02.2025', current: true }
      ]
    },
    'PS-2025-005678': {
      status: 'Доставлен',
      route: 'Владивосток \u2192 Петропавловск\u2011Камчатский',
      events: [
        { date: '10.01.2025 08:00', place: 'Владивосток, порт',                 text: '\u2693 Груз принят в порту Владивосток' },
        { date: '10.01.2025 22:00', place: 'Владивосток, ТС \u00abСапфир\u00bb', text: '\u{1F6A2} Погружен на судно, отход в 22:00' },
        { date: '14.01.2025 10:30', place: 'Петропавловск\u2011Камчатский, порт', text: '\u2693 Судно прибыло в порт ПКЧ' },
        { date: '14.01.2025 16:00', place: 'Петропавловск\u2011Камчатский',      text: '\u2705 Груз выдан получателю, ТН подписана' }
      ]
    }
  };

  var trackForm   = document.getElementById('trackForm');
  var trackResult = document.getElementById('trackResult');
  if (trackForm) {
    trackForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var num = (document.getElementById('trackNumber').value || '').trim().toUpperCase();
      /* Normalize: allow lowercase input */
      var key = num.replace(/^PS-/i, 'PS-');
      var data = DEMO_TRACKS[key];
      if (!data) {
        trackResult.innerHTML = '<p class="calc-error">Заявка с трек-номером <strong>' + num + '</strong> не найдена. Проверьте номер или <a href="contacts.html#contactForm">свяжитесь с нами</a>.</p>';
        trackResult.style.display = 'block';
        return;
      }
      document.getElementById('trackBadge').textContent = data.status;
      document.getElementById('trackBadge').className = 'track-status-badge ' + (data.status === 'Доставлен' ? 'delivered' : 'in-transit');
      document.getElementById('trackRoute').textContent = data.route;

      var tl = document.getElementById('trackTimeline');
      tl.innerHTML = data.events.map(function (ev) {
        return '<div class="track-event' + (ev.current ? ' track-event--current' : '') + '">' +
          '<div class="track-event-dot"></div>' +
          '<div class="track-event-body">' +
          '<div class="track-event-text">' + ev.text + '</div>' +
          '<div class="track-event-meta">' + ev.date + ' \u00b7 ' + ev.place + '</div>' +
          '</div>' +
          '</div>';
      }).join('');
      trackResult.style.display = 'block';
      trackResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  /* New Order form */
  var newOrderForm = document.getElementById('newOrderForm');
  if (newOrderForm) {
    newOrderForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = newOrderForm.querySelector('[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Отправляем…';
      /*
       * TODO: replace with AmoCRM webhook after API key is configured.
       * fetch('/api/order', { method:'POST', body: new FormData(newOrderForm) });
       */
      setTimeout(function () {
        newOrderForm.style.display = 'none';
        var ok = document.getElementById('newOrderSuccess');
        if (ok) ok.style.display = 'block';
      }, 1000);
    });
  }
})();
