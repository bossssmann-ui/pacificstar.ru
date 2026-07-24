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
      var tabsEl = document.querySelector('.account-tabs');
      if (tabsEl) window.scrollTo({ top: tabsEl.offsetTop - 80, behavior: 'smooth' });
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
    var tabsEl = document.querySelector('.account-tabs');
    if (tabsEl) window.scrollTo({ top: tabsEl.offsetTop - 80, behavior: 'smooth' });
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

      fetch((window.PSApi && window.PSApi.url('/api/register')) || '/api/register', {
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
      var badge = document.getElementById('trackBadge');
      var routeEl = document.getElementById('trackRoute');
      var tl = document.getElementById('trackTimeline');
      if (badge) {
        badge.textContent = data.status;
        badge.className = 'track-status-badge ' + (data.status === 'Доставлен' ? 'delivered' : 'in-transit');
      }
      if (routeEl) routeEl.textContent = data.route;
      if (tl) {
        tl.innerHTML = data.events.map(function (ev) {
          return '<div class="track-event' + (ev.current ? ' track-event--current' : '') + '">' +
            '<div class="track-event-dot"></div>' +
            '<div class="track-event-body">' +
            '<div class="track-event-text">' + ev.text + '</div>' +
            '<div class="track-event-meta">' + ev.date + ' \u00b7 ' + ev.place + '</div>' +
            '</div>' +
            '</div>';
        }).join('');
      }
      trackResult.style.display = 'block';
      trackResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  /* New Order form — real submit via /api/contact (source: order) */
  var newOrderForm = document.getElementById('newOrderForm');
  if (newOrderForm) {
    var orderSubmitBtn = newOrderForm.querySelector('[type="submit"]');
    var orderSubmitLabel = orderSubmitBtn ? orderSubmitBtn.textContent : 'Отправить заявку';
    var orderSuccess = document.getElementById('newOrderSuccess');
    var orderError = document.getElementById('newOrderError');

    if (!orderError) {
      orderError = document.createElement('p');
      orderError.id = 'newOrderError';
      orderError.setAttribute('aria-live', 'polite');
      orderError.style.cssText = 'display:none;color:#b91c1c;margin:12px 0 0;font-size:0.95rem;';
      newOrderForm.appendChild(orderError);
    }

    function showOrderError(text) {
      orderError.textContent = text;
      orderError.style.display = 'block';
    }

    function clearOrderError() {
      orderError.textContent = '';
      orderError.style.display = 'none';
    }

    function markInvalid(field, on) {
      if (!field) return;
      if (on) field.classList.add('field-invalid');
      else field.classList.remove('field-invalid');
    }

    newOrderForm.addEventListener('submit', function (e) {
      e.preventDefault();
      clearOrderError();

      var originField = document.getElementById('orderFrom');
      var destField = document.getElementById('orderTo');
      var cargoField = document.getElementById('orderCargo');
      var nameField = document.getElementById('orderName');
      var phoneField = document.getElementById('orderPhone');
      var emailField = document.getElementById('orderEmail');
      var privacyCheck = document.getElementById('orderPrivacy');
      var weightField = document.getElementById('orderWeight');
      var volumeField = document.getElementById('orderVolume');
      var descField = document.getElementById('orderDesc');
      var dateField = document.getElementById('orderDate');
      var companyField = document.getElementById('orderCompany');
      var commentField = document.getElementById('orderComment');

      var valid = true;

      function requireText(field, minLen) {
        var val = field ? String(field.value || '').trim() : '';
        var ok = val.length >= (minLen || 1);
        markInvalid(field, !ok);
        if (!ok) valid = false;
        return val;
      }

      var origin = requireText(originField, 2);
      var destination = requireText(destField, 2);
      var cargoType = requireText(cargoField, 1);
      var contactName = requireText(nameField, 2);
      var contactPhone = requireText(phoneField, 6);

      if (privacyCheck && !privacyCheck.checked) {
        valid = false;
        markInvalid(privacyCheck, true);
      } else if (privacyCheck) {
        markInvalid(privacyCheck, false);
      }

      if (!valid) {
        showOrderError('Заполните обязательные поля и подтвердите согласие на обработку данных.');
        return;
      }

      var specials = [];
      var specialInputs = newOrderForm.querySelectorAll('input[name^="special_"]');
      for (var i = 0; i < specialInputs.length; i++) {
        if (specialInputs[i].checked) {
          var lab = specialInputs[i].parentNode ? specialInputs[i].parentNode.textContent : specialInputs[i].name;
          specials.push(String(lab || specialInputs[i].name).replace(/\s+/g, ' ').trim());
        }
      }

      var cargoLabel = cargoField.options && cargoField.selectedIndex >= 0
        ? cargoField.options[cargoField.selectedIndex].text
        : cargoType;

      var messageLines = [
        'Маршрут: ' + origin + ' → ' + destination,
        'Тип груза: ' + cargoLabel
      ];
      if (weightField && weightField.value) messageLines.push('Вес: ' + weightField.value + ' кг');
      if (volumeField && volumeField.value) messageLines.push('Объём: ' + volumeField.value + ' м³');
      if (descField && descField.value) messageLines.push('Описание: ' + descField.value.trim());
      if (dateField && dateField.value) messageLines.push('Готовность груза: ' + dateField.value);
      if (specials.length) messageLines.push('Особые условия: ' + specials.join('; '));
      if (companyField && companyField.value) messageLines.push('Компания: ' + companyField.value.trim());
      if (commentField && commentField.value) messageLines.push('Комментарий: ' + commentField.value.trim());

      var payload = {
        name: contactName,
        phone: contactPhone,
        email: emailField ? String(emailField.value || '').trim() : '',
        service: 'order',
        source: 'order',
        message: messageLines.join('\n'),
        page: window.location.pathname || 'account.html'
      };

      if (orderSubmitBtn) {
        orderSubmitBtn.disabled = true;
        orderSubmitBtn.textContent = 'Отправляем…';
      }

      fetch((window.PSApi && window.PSApi.url('/api/contact')) || '/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (response) {
          if (!response.ok) throw new Error('HTTP ' + response.status);
          return response.json();
        })
        .then(function () {
          newOrderForm.style.display = 'none';
          if (orderSuccess) orderSuccess.style.display = 'block';
          if (orderSubmitBtn) {
            orderSubmitBtn.disabled = false;
            orderSubmitBtn.textContent = orderSubmitLabel;
          }
        })
        .catch(function () {
          if (orderSubmitBtn) {
            orderSubmitBtn.disabled = false;
            orderSubmitBtn.textContent = orderSubmitLabel;
          }
          showOrderError('Не удалось отправить заявку. Попробуйте позже или позвоните нам.');
        });
    });

    /* Clear field errors on input */
    var liveFields = newOrderForm.querySelectorAll('.form-control, #orderPrivacy');
    for (var j = 0; j < liveFields.length; j++) {
      liveFields[j].addEventListener('input', function () {
        this.classList.remove('field-invalid');
        clearOrderError();
      });
      liveFields[j].addEventListener('change', function () {
        this.classList.remove('field-invalid');
        clearOrderError();
      });
    }
  }
})();
