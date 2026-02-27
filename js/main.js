// Мобильное меню
const navToggle = document.getElementById('navToggle');
const mainNav = document.getElementById('mainNav');

if (navToggle && mainNav) {
  navToggle.addEventListener('click', function () {
    const isOpen = mainNav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', isOpen);
    navToggle.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
  });

  // Закрывать меню при клике на ссылку
  mainNav.querySelectorAll('.nav__link').forEach(function (link) {
    link.addEventListener('click', function () {
      mainNav.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Открыть меню');
    });
  });
}

// Форма обратной связи
const contactForm = document.getElementById('contactForm');

if (contactForm) {
  const formMsg = document.createElement('p');
  formMsg.className = 'form-success';
  contactForm.parentNode.insertBefore(formMsg, contactForm.nextSibling);

  contactForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    if (name) {
      formMsg.textContent = 'Спасибо, ' + name + '! Мы свяжемся с вами в ближайшее время.';
      formMsg.style.display = 'block';
      contactForm.reset();
      setTimeout(function () { formMsg.style.display = 'none'; }, 6000);
    }
  });
}
