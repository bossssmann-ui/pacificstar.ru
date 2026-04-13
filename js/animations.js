/* global IntersectionObserver */
document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  var els = document.querySelectorAll('.animate-on-scroll');
  if (!els.length || !('IntersectionObserver' in window)) return;

  var scrollObserver = new IntersectionObserver(function (entries, observer) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { root: null, rootMargin: '0px', threshold: 0.12 });

  els.forEach(function (el) {
    scrollObserver.observe(el);
  });
});
