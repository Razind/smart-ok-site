(() => {
  'use strict';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    document.documentElement.classList.add('js');
    const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); }
    }), { threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
  }
  const header = document.querySelector('.header');
  const photo = document.querySelector('.hero-photo');
  let pending = false;
  const updateScroll = () => {
    header.classList.toggle('scrolled', scrollY > 15);
    if (!reduceMotion.matches && scrollY < 1000) photo.style.setProperty('--photo-shift', `${Math.min(scrollY * 0.025, 18) - 20}px`);
    pending = false;
  };
  addEventListener('scroll', () => { if (!pending) { pending = true; requestAnimationFrame(updateScroll); } }, { passive: true });
  updateScroll();

  const menuButton = document.querySelector('.menu-button');
  const menu = document.querySelector('.mobile-menu');
  const closeMenu = () => {
    menu.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Открыть меню');
    document.body.classList.remove('menu-open');
  };
  menuButton.addEventListener('click', () => {
    const opening = menuButton.getAttribute('aria-expanded') !== 'true';
    menu.hidden = !opening;
    menuButton.setAttribute('aria-expanded', String(opening));
    menuButton.setAttribute('aria-label', opening ? 'Закрыть меню' : 'Открыть меню');
    document.body.classList.toggle('menu-open', opening);
  });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => {
    if (menu.hidden) return;
    if (e.key === 'Escape') { closeMenu(); menuButton.focus(); }
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === menuButton) { e.preventDefault(); menu.lastElementChild.focus(); }
      else if (!e.shiftKey && document.activeElement === menu.lastElementChild) { e.preventDefault(); menuButton.focus(); }
    }
  });
  matchMedia('(min-width:641px)').addEventListener('change', e => { if (e.matches) closeMenu(); });
  if ('IntersectionObserver' in window) {
    const links = [...document.querySelectorAll('.desktop-nav a')];
    const sections = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) links.forEach(a => a.classList.toggle('active', a.hash === `#${entry.target.id}`));
    }), { rootMargin: '-15% 0px -60% 0px', threshold: 0 });
    document.querySelectorAll('main>section[id]').forEach(section => sections.observe(section));
  }
  const features = [...document.querySelectorAll('.feature-list details')];
  features.forEach(details => details.addEventListener('toggle', () => {
    if (details.open) features.forEach(other => { if (other !== details) other.open = false; });
  }));

  const form = document.querySelector('#inquiry-form');
  const message = document.querySelector('#inquiry-message');
  const status = document.querySelector('#form-status');
  const copyButton = document.querySelector('#copy-inquiry');
  const defaultStatus = 'Письмо откроется в вашем почтовом приложении.';
  const prepareInquiry = () => {
    const data = new FormData(form);
    const topics = data.getAll('topic');
    const text = String(data.get('message') || '').trim();
    message.setCustomValidity(topics.length || text ? '' : 'Выберите направление или напишите несколько слов о задаче.');
    if (!form.reportValidity()) return null;
    const body = ['Здравствуйте!', topics.length ? `Интересует: ${topics.join(', ')}.` : '', text].filter(Boolean).join('\n\n');
    return { subject: 'Запрос в Смарт-ОК', body };
  };
  const clearStatus = () => {
    message.setCustomValidity('');
    status.textContent = defaultStatus;
    copyButton.classList.remove('copied');
    copyButton.setAttribute('aria-label', 'Скопировать текст запроса');
  };
  form.addEventListener('input', clearStatus);
  form.addEventListener('change', clearStatus);
  form.addEventListener('submit', e => {
    e.preventDefault();
    const inquiry = prepareInquiry();
    if (!inquiry) return;
    location.href = `mailto:smart-ok@mail.ru?subject=${encodeURIComponent(inquiry.subject)}&body=${encodeURIComponent(inquiry.body)}`;
    status.textContent = 'Если почта не открылась, скопируйте запрос кнопкой рядом и отправьте на smart-ok@mail.ru.';
  });
  copyButton.addEventListener('click', async () => {
    const inquiry = prepareInquiry();
    if (!inquiry) return;
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(inquiry.body);
      else {
        const field = document.createElement('textarea');
        field.value = inquiry.body;
        field.setAttribute('aria-hidden', 'true');
        field.style.cssText = 'position:fixed;opacity:0;inset:0;width:1px;height:1px;pointer-events:none';
        form.append(field); field.select();
        try { if (!document.execCommand('copy')) throw new Error('Copy unavailable'); }
        finally { field.remove(); copyButton.focus({ preventScroll: true }); }
      }
      status.textContent = 'Запрос скопирован. Вставьте его в письмо на smart-ok@mail.ru.';
      copyButton.classList.add('copied');
      copyButton.setAttribute('aria-label', 'Запрос скопирован');
    } catch { status.textContent = 'Копирование недоступно. Откройте письмо в почтовом приложении.'; }
  });
  document.querySelector('#year').textContent = String(new Date().getFullYear());
})();
