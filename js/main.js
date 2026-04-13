/**
 * Pacific Star — Main JavaScript
 */

(function () {
  'use strict';

  /* =======================================
     HEADER: sticky shadow + active link
     ======================================= */
  const header = document.querySelector('.site-header');
  const scrollTopBtn = document.querySelector('.scroll-top');

  var scrollTicking = false;

  function onScroll() {
    if (header) header.classList.toggle('scrolled', window.scrollY > 10);
    if (scrollTopBtn) scrollTopBtn.classList.toggle('visible', window.scrollY > 400);
    scrollTicking = false;
  }

  var scrollTicking = false;
  window.addEventListener('scroll', function () {
    if (!scrollTicking) {
      requestAnimationFrame(function () { scrollTicking = false; onScroll(); });
      scrollTicking = true;
    }
  }, { passive: true });
  onScroll();

  /* Mark active nav link based on current page */
  const navLinks = document.querySelectorAll('.nav-link, .nav-dropdown-link');
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';

  navLinks.forEach(function (link) {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  /* Cache nav-toggle buttons once — used both for active-marking and click handler */
  var navToggleBtns = document.querySelectorAll('.nav-item .nav-toggle');

  /* Also mark parent "Услуги" nav-toggle active when on a sub-page */
  var servicePages = ['services.html', 'truck-delivery.html', 'remote-regions.html'];
  if (servicePages.indexOf(currentPath) !== -1) {
    navToggleBtns.forEach(function (btn) {
      btn.classList.add('active');
    });
  }

  /* =======================================
     DESKTOP NAV DROPDOWN: click to toggle
     ======================================= */
  var openNavItem = null; /* track currently open dropdown item */

  function closeOpenNavItem() {
    if (openNavItem) {
      openNavItem.classList.remove('open');
      var toggle = openNavItem.querySelector('.nav-toggle');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
      openNavItem = null;
    }
  }

  navToggleBtns.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var item = btn.closest('.nav-item');
      var wasOpen = item === openNavItem;

      closeOpenNavItem();

      if (!wasOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        openNavItem = item;
      }
    });
  });

  /* Close desktop dropdown on outside click */
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.nav-item')) {
      closeOpenNavItem();
    }
  });

  /* =======================================
     BURGER MENU (mobile)
     ======================================= */
  const burger = document.querySelector('.burger');
  const mobileNav = document.querySelector('.mobile-nav');

  if (burger && mobileNav) {
    burger.addEventListener('click', function () {
      const isOpen = burger.classList.toggle('open');
      mobileNav.classList.toggle('open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    /* Mobile nav: expandable "Услуги" group */
    mobileNav.querySelectorAll('.mobile-nav-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        btn.parentElement.classList.toggle('open');
      });
    });

    /* Auto-open mobile group if current page is inside it */
    if (servicePages.indexOf(currentPath) !== -1) {
      mobileNav.querySelectorAll('.mobile-nav-group').forEach(function (g) {
        g.classList.add('open');
      });
    }

    /* Close on nav link click (skip toggle buttons) */
    mobileNav.querySelectorAll('a.nav-link').forEach(function (link) {
      link.addEventListener('click', function () {
        burger.classList.remove('open');
        mobileNav.classList.remove('open');
        document.body.style.overflow = '';
      });
    });

    /* Close on outside click */
    document.addEventListener('click', function (e) {
      if (mobileNav.classList.contains('open') &&
          !mobileNav.contains(e.target) &&
          !burger.contains(e.target)) {
        burger.classList.remove('open');
        mobileNav.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  }

  /* =======================================
     SCROLL-TO-TOP BUTTON
     ======================================= */
  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* =======================================
     FADE-IN ON SCROLL — opt-in approach
     ─────────────────────────────────────
     1. Mark elements already in viewport as
        .visible BEFORE enabling animations
        → no content ever flashes invisible
     2. Add .anim-ready to <html> — only
        off-screen .fade-in els are hidden
     3. IntersectionObserver reveals on scroll
     4. 300 ms safety-net for any stragglers
     ======================================= */
  const fadeEls = document.querySelectorAll('.fade-in');

  if (fadeEls.length) {
    /* Step 1 — tag in-viewport elements FIRST */
    const vpH = window.innerHeight;
    fadeEls.forEach(function (el) {
      const r = el.getBoundingClientRect();
      if (r.top < vpH + 200) {
        el.classList.add('visible');
      }
    });

    /* Step 2 — enable animations for off-screen els */
    document.documentElement.classList.add('anim-ready');

    /* Step 3 — scroll-reveal via IntersectionObserver */
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.05, rootMargin: '0px 0px 80px 0px' }
      );

      fadeEls.forEach(function (el) {
        if (!el.classList.contains('visible')) {
          observer.observe(el);
        }
      });
    } else {
      /* Fallback: no IO support */
      fadeEls.forEach(function (el) { el.classList.add('visible'); });
    }

    /* Step 4 — safety-net at 300 ms */
    setTimeout(function () {
      fadeEls.forEach(function (el) { el.classList.add('visible'); });
    }, 300);
  }

  /* =======================================
     ANIMATED COUNTERS
     ======================================= */
  var ruNumFmt = new Intl.NumberFormat('ru-RU');

  function animateCounter(el, target, duration, suffix) {
    const start = 0;
    const startTime = performance.now();

    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      const current = Math.round(start + (target - start) * eased);
      el.textContent = ruNumFmt.format(current) + suffix;

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }

  const counterEls = document.querySelectorAll('[data-counter]');

  if (counterEls.length && 'IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            const el = entry.target;
            const target = parseInt(el.dataset.counter, 10);
            const suffix = el.dataset.suffix || '';
            const duration = parseInt(el.dataset.duration, 10) || 2000;
            animateCounter(el, target, duration, suffix);
            counterObserver.unobserve(el);
          }
        });
      },
      { threshold: 0.5 }
    );

    counterEls.forEach(function (el) {
      counterObserver.observe(el);
    });
  }

  /* =======================================
     CONTACT FORM
     ======================================= */
  const contactForm = document.getElementById('contactForm');

  if (contactForm) {
    /* Cache form field references once — avoids repeated DOM queries on submit */
    const submitBtn   = contactForm.querySelector('[type="submit"]');
    const successMsg  = document.getElementById('formSuccess');
    const emailField  = contactForm.querySelector('[type="email"]');
    const phoneField  = contactForm.querySelector('[name="phone"]');
    const privacyCheck = contactForm.querySelector('[name="privacy"]');
    const nameField   = contactForm.querySelector('[name="name"]');
    const serviceField = contactForm.querySelector('[name="service"]');
    const messageField = contactForm.querySelector('[name="message"]');

    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      /* Basic validation */
      let valid = true;
      contactForm.querySelectorAll('[required]').forEach(function (field) {
        const group = field.closest('.form-group');
        const error = group && group.querySelector('.field-error');

        if (!field.value.trim()) {
          valid = false;
          field.classList.add('field-invalid');
          if (error) error.classList.add('field-error-visible');
        } else {
          field.classList.remove('field-invalid');
          if (error) error.classList.remove('field-error-visible');
        }
      });

      /* Email format */
      if (emailField && emailField.value.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailField.value.trim())) {
          valid = false;
          emailField.classList.add('field-invalid');
        }
      }

      /* Phone format (loose check) */
      if (phoneField && phoneField.value.trim()) {
        const cleaned = phoneField.value.replace(/\D/g, '');
        if (cleaned.length < 10) {
          valid = false;
          phoneField.classList.add('field-invalid');
        }
      }

      /* Privacy checkbox */
      if (privacyCheck && !privacyCheck.checked) {
        valid = false;
        privacyCheck.classList.add('field-invalid');
      } else if (privacyCheck) {
        privacyCheck.classList.remove('field-invalid');
      }

      if (!valid) return;

      /* Send to backend */
      submitBtn.disabled = true;
      submitBtn.textContent = 'Отправка...';

      const formData = {
        name:    nameField    ? nameField.value    : '',
        email:   emailField   ? emailField.value   : '',
        phone:   phoneField   ? phoneField.value   : '',
        service: serviceField ? serviceField.value : '',
        message: messageField ? messageField.value : ''
      };

      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      .then(function (response) {
        if (!response.ok) { throw new Error('HTTP ' + response.status); }
        return response.json();
      })
      .then(function () {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Отправить заявку <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
        contactForm.reset();

        if (successMsg) {
          successMsg.classList.add('show');
          setTimeout(function () {
            successMsg.classList.remove('show');
          }, 6000);
        }
      })
      .catch(function () {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Отправить заявку <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';

        if (successMsg) {
          successMsg.textContent = '❌ Не удалось отправить заявку. Попробуйте позже или позвоните нам.';
          successMsg.classList.add('show');
          setTimeout(function () {
            successMsg.classList.remove('show');
          }, 6000);
        }
      });
    });

    /* Live validation: clear error on input */
    var fieldErrorCache = new Map();
    contactForm.querySelectorAll('.form-control').forEach(function (field) {
      var grp = field.closest('.form-group');
      var err = grp && grp.querySelector('.field-error');
      if (err) fieldErrorCache.set(field, err);
      field.addEventListener('input', function () {
        field.classList.remove('field-invalid');
        var cachedErr = fieldErrorCache.get(field);
        if (cachedErr) cachedErr.classList.remove('field-error-visible');
      });
    });
  }

  /* =======================================
     PHONE MASK (simple)
     ======================================= */
  const phoneInputs = document.querySelectorAll('[name="phone"]');

  phoneInputs.forEach(function (input) {
    input.addEventListener('input', function () {
      let val = input.value.replace(/\D/g, '');
      if (val.startsWith('8')) val = '7' + val.slice(1);
      if (val.startsWith('7') && val.length > 0) {
        var parts = ['+7'];
        if (val.length > 1) parts.push(' (' + val.substring(1, 4));
        if (val.length >= 4) parts.push(') ' + val.substring(4, 7));
        if (val.length >= 7) parts.push('-' + val.substring(7, 9));
        if (val.length >= 9) parts.push('-' + val.substring(9, 11));
        input.value = parts.join('');
      }
    });
  });

  /* =======================================
     SMOOTH ANCHOR SCROLL (within page)
     ─────────────────────────────────────
     Single delegated listener instead of
     one handler per anchor element.
     ======================================= */
  document.addEventListener('click', function (e) {
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;
    const targetId = anchor.getAttribute('href');
    if (targetId === '#') return;
    const target = document.querySelector(targetId);
    if (target) {
      e.preventDefault();
      const headerHeight = (header && header.offsetHeight) || 72;
      const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 16;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }
  });
})();

/* =========================================================
   FLOATING CONTACT WIDGET + CALLBACK PANEL
   ========================================================= */
(function () {
  'use strict';

  var toggle   = document.getElementById('floatingToggle');
  var menu     = document.getElementById('floatingMenu');
  var openBtn  = document.getElementById('openCallback');
  var overlay  = document.getElementById('callbackOverlay');
  var panel    = document.getElementById('callbackPanel');
  var closeBtn = document.getElementById('callbackClose');
  var cbForm   = document.getElementById('callbackForm');
  var cbOk     = document.getElementById('callbackSuccess');

  if (!toggle || !menu) return;

  /* --- floating menu toggle --- */
  function setMenu(open) {
    menu.classList.toggle('is-open', open);
    toggle.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  toggle.addEventListener('click', function () {
    setMenu(!menu.classList.contains('is-open'));
  });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('#floatingContacts')) setMenu(false);
  });

  /* --- callback panel --- */
  function openCallback() {
    setMenu(false);
    if (!panel) return;
    panel.classList.add('is-open');
    overlay && overlay.classList.add('is-open');
    panel.removeAttribute('aria-hidden');
    document.body.style.overflow = 'hidden';
    var first = panel.querySelector('input, select, button');
    if (first) setTimeout(function () { first.focus(); }, 60);
  }

  function closeCallback() {
    if (!panel) return;
    panel.classList.remove('is-open');
    overlay && overlay.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (openBtn)  openBtn.addEventListener('click', openCallback);
  if (overlay)  overlay.addEventListener('click', closeCallback);
  if (closeBtn) closeBtn.addEventListener('click', closeCallback);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { setMenu(false); closeCallback(); }
  });

  /* --- callback form submit --- */
  if (cbForm) {
    cbForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var phoneEl = document.getElementById('cbPhone');
      if (!phoneEl || !phoneEl.value.trim()) {
        if (phoneEl) phoneEl.focus();
        return;
      }
      /*
       * TODO: replace stub with AmoCRM webhook after API key is configured.
       * fetch('/api/callback', {
       *   method: 'POST',
       *   headers: { 'Content-Type': 'application/json' },
       *   body: JSON.stringify({
       *     name:  document.getElementById('cbName').value,
       *     phone: phoneEl.value,
       *     time:  document.getElementById('cbTime').value,
       *     source: 'callback-widget'
       *   })
       * });
       */
      cbForm.style.display = 'none';
      if (cbOk) cbOk.style.display = 'block';
      setTimeout(closeCallback, 3200);
    });
  }

}());

/* =========================================================
   PARALLAX BACKGROUND
   ========================================================= */
(function () {
  'use strict';

  function initParallax() {
    var heroEl = document.querySelector('.hero');
    var pageHeroEl = document.querySelector('.page-hero');
    var parallaxTarget = heroEl || pageHeroEl;

    if (!parallaxTarget) return;

    // Respect reduced-motion preference — no scroll listener, keep ::after as static background
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var bg = document.createElement('div');
    bg.className = 'parallax-bg';
    parallaxTarget.insertBefore(bg, parallaxTarget.firstChild);
    parallaxTarget.classList.add('has-parallax-bg');

    var PARALLAX_SPEED = 0.4; // коэффициент параллакса (0 = нет, 1 = фиксированный)
    var ticking = false;

    function updateParallax() {
      var scrollY = window.scrollY || window.pageYOffset;
      var rect = parallaxTarget.getBoundingClientRect();

      if (rect.bottom > 0 && rect.top < window.innerHeight) {
        var offset = scrollY * PARALLAX_SPEED;
        bg.style.transform = 'translateY(' + offset + 'px) translateZ(0)';
      }
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }, { passive: true });

    updateParallax();
  }

  initParallax();

  /* ── Hash-based scroll to form ──────────────────────────────────────── */
  if (window.location.hash) {
    var hashTarget = document.getElementById(window.location.hash.slice(1));
    if (hashTarget) {
      setTimeout(function () {
        hashTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }
}());
