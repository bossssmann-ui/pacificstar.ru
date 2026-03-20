/**
 * Pacific Star — Premium Features
 * Preloader · Dark/Light Mode · Custom Cursor
 */

(function () {
  'use strict';

  /* =============================================
     1. PRELOADER
     Fade-out once all page resources are loaded
     ============================================= */
  var preloader = document.getElementById('preloader');

  function hidePreloader() {
    if (!preloader) return;
    preloader.classList.add('is-loaded');
    /* Remove from DOM after transition completes */
    preloader.addEventListener('transitionend', function handler() {
      preloader.removeEventListener('transitionend', handler);
      if (preloader.parentNode) preloader.parentNode.removeChild(preloader);
    });
  }

  if (preloader) {
    if (document.readyState === 'complete') {
      hidePreloader();
    } else {
      window.addEventListener('load', hidePreloader);
    }
  }

  /* =============================================
     2. DARK / LIGHT MODE TOGGLE
     Toggles `dark-theme` on <html>, saves to localStorage
     ============================================= */
  var THEME_KEY = 'ps-theme';
  var htmlEl = document.documentElement;

  /* Apply saved or OS-preferred theme immediately */
  (function applyInitialTheme() {
    var saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark') {
      htmlEl.classList.add('dark-theme');
    } else if (saved === 'light') {
      htmlEl.classList.remove('dark-theme');
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      htmlEl.classList.add('dark-theme');
    }
  }());

  document.addEventListener('DOMContentLoaded', function () {
    var toggleBtn = document.getElementById('themeToggle');
    if (!toggleBtn) return;

    toggleBtn.addEventListener('click', function () {
      var isDark = htmlEl.classList.toggle('dark-theme');
      localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
      toggleBtn.setAttribute('aria-label', isDark ? 'Включить светлую тему' : 'Включить тёмную тему');
    });
  });

  /* =============================================
     3. CUSTOM CURSOR
     Dot + ring that follow the mouse; ring uses
     requestAnimationFrame lerp for smooth lag
     ============================================= */
  document.addEventListener('DOMContentLoaded', function () {

    /* Only enable on pointer-fine devices */
    if (!window.matchMedia || !window.matchMedia('(pointer: fine)').matches) return;

    /* Create elements */
    var dot  = document.createElement('div');
    var ring = document.createElement('div');
    dot.className  = 'custom-cursor';
    ring.className = 'custom-cursor-ring';
    document.body.appendChild(ring);
    document.body.appendChild(dot);

    var mouseX = -100, mouseY = -100;  /* start off-screen */
    var ringX  = -100, ringY  = -100;
    var LERP   = 0.15; /* ring interpolation factor (0=no movement, 1=instant) */
    var THRESHOLD = 0.1; /* px — stop animating when this close to target */
    var rafId  = null;  /* rAF handle so we can avoid duplicate loops */

    /* Move dot instantly */
    document.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.left = mouseX + 'px';
      dot.style.top  = mouseY + 'px';
      /* Re-start ring animation if it isn't already running */
      if (!rafId) { rafId = requestAnimationFrame(animateRing); }
    }, { passive: true });

    /* Ring follows with lerp (smooth lag); stops when it reaches the cursor */
    function animateRing() {
      ringX += (mouseX - ringX) * LERP;
      ringY += (mouseY - ringY) * LERP;
      ring.style.left = ringX + 'px';
      ring.style.top  = ringY + 'px';

      var dx = mouseX - ringX;
      var dy = mouseY - ringY;
      if (dx * dx + dy * dy > THRESHOLD * THRESHOLD) {
        rafId = requestAnimationFrame(animateRing);
      } else {
        /* Close enough — snap to target and stop the loop */
        ring.style.left = mouseX + 'px';
        ring.style.top  = mouseY + 'px';
        ringX = mouseX;
        ringY = mouseY;
        rafId = null;
      }
    }

    /* Hover effect on interactive elements */
    var hoverTargets = 'a, button, [role="button"], label[for], input[type="submit"], input[type="button"], select, .cursor-pointer';

    document.addEventListener('mouseover', function (e) {
      if (e.target.closest(hoverTargets)) {
        dot.classList.add('is-hovered');
        ring.classList.add('is-hovered');
      }
    }, { passive: true });

    document.addEventListener('mouseout', function (e) {
      if (e.target.closest(hoverTargets)) {
        dot.classList.remove('is-hovered');
        ring.classList.remove('is-hovered');
      }
    }, { passive: true });

    /* Hide cursor when mouse leaves the window */
    document.addEventListener('mouseleave', function () {
      dot.style.opacity  = '0';
      ring.style.opacity = '0';
    });

    document.addEventListener('mouseenter', function () {
      dot.style.opacity  = '';
      ring.style.opacity = '';
    });
  });

}());
