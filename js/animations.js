/* global IntersectionObserver */
document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  var observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.12
  };

  var scrollObserver = new IntersectionObserver(function (entries, observer) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.animate-on-scroll').forEach(function (el) {
    scrollObserver.observe(el);
  });
});
