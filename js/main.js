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

  function onScroll() {
    if (header) header.classList.toggle('scrolled', window.scrollY > 10);
    if (scrollTopBtn) scrollTopBtn.classList.toggle('visible', window.scrollY > 400);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mark active nav link based on current page */
  const navLinks = document.querySelectorAll('.nav-link');
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';

  navLinks.forEach(function (link) {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
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

    /* Close on nav link click */
    mobileNav.querySelectorAll('.nav-link').forEach(function (link) {
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
  function animateCounter(el, target, duration, suffix) {
    const start = 0;
    const startTime = performance.now();

    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      const current = Math.round(start + (target - start) * eased);
      el.textContent = current.toLocaleString('ru-RU') + suffix;

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }

  const counterEls = document.querySelectorAll('[data-counter]');

  if (counterEls.length) {
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
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const submitBtn = contactForm.querySelector('[type="submit"]');
      const successMsg = document.getElementById('formSuccess');

      /* Basic validation */
      let valid = true;
      contactForm.querySelectorAll('[required]').forEach(function (field) {
        const group = field.closest('.form-group');
        const error = group && group.querySelector('.field-error');

        if (!field.value.trim()) {
          valid = false;
          field.style.borderColor = '#e74c3c';
          if (error) error.style.display = 'block';
        } else {
          field.style.borderColor = '';
          if (error) error.style.display = 'none';
        }
      });

      /* Email format */
      const emailField = contactForm.querySelector('[type="email"]');
      if (emailField && emailField.value.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailField.value.trim())) {
          valid = false;
          emailField.style.borderColor = '#e74c3c';
        }
      }

      /* Phone format (loose check) */
      const phoneField = contactForm.querySelector('[name="phone"]');
      if (phoneField && phoneField.value.trim()) {
        const cleaned = phoneField.value.replace(/\D/g, '');
        if (cleaned.length < 10) {
          valid = false;
          phoneField.style.borderColor = '#e74c3c';
        }
      }

      /* Privacy checkbox */
      const privacyCheck = contactForm.querySelector('[name="privacy"]');
      if (privacyCheck && !privacyCheck.checked) {
        valid = false;
        privacyCheck.style.outline = '2px solid #e74c3c';
      } else if (privacyCheck) {
        privacyCheck.style.outline = '';
      }

      if (!valid) return;

      /* Simulate sending */
      submitBtn.disabled = true;
      submitBtn.textContent = 'Отправка...';

      setTimeout(function () {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Отправить заявку <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
        contactForm.reset();

        if (successMsg) {
          successMsg.classList.add('show');
          setTimeout(function () {
            successMsg.classList.remove('show');
          }, 6000);
        }
      }, 1200);
    });

    /* Live validation: clear error on input */
    contactForm.querySelectorAll('.form-control').forEach(function (field) {
      field.addEventListener('input', function () {
        field.style.borderColor = '';
        const group = field.closest('.form-group');
        const error = group && group.querySelector('.field-error');
        if (error) error.style.display = 'none';
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
        let masked = '+7';
        if (val.length > 1) masked += ' (' + val.substring(1, 4);
        if (val.length >= 4) masked += ') ' + val.substring(4, 7);
        if (val.length >= 7) masked += '-' + val.substring(7, 9);
        if (val.length >= 9) masked += '-' + val.substring(9, 11);
        input.value = masked;
      }
    });
  });

  /* =======================================
     SMOOTH ANCHOR SCROLL (within page)
     ======================================= */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
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
  });
})();
