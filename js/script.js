// ============================================================
// Papad Pixels — site interactions
// ============================================================
(() => {
  'use strict';

  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---------- hero showreel ---------- */
  // The Vimeo player is heavy; start it on the first sign of a real visitor
  // (or shortly after load) instead of competing with the first paint.
  const heroReel = document.getElementById('heroReelFrame');
  if (heroReel && heroReel.dataset.src) {
    const loadReel = () => { if (!heroReel.getAttribute('src')) heroReel.src = heroReel.dataset.src; };
    ['pointerdown', 'pointermove', 'touchstart', 'scroll', 'keydown'].forEach(ev =>
      window.addEventListener(ev, loadReel, { once: true, passive: true }));
    window.addEventListener('load', () => setTimeout(loadReel, 3000));
  }

  /* ---------- header scroll state ---------- */
  const header = document.getElementById('siteHeader');
  const progressBar = document.getElementById('progressBar');

  function onScroll(){
    header.classList.toggle('scrolled', window.scrollY > 40);

    const h = document.documentElement;
    const scrolled = h.scrollTop;
    const height = h.scrollHeight - h.clientHeight;
    progressBar.style.width = (height > 0 ? (scrolled / height) * 100 : 0) + '%';

    updateActiveNav();
  }
  document.addEventListener('scroll', onScroll, { passive:true });

  /* ---------- mobile nav ---------- */
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');
  const setMenuOpen = open => {
    mainNav.classList.toggle('open', open);
    navToggle.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    if (!open) mainNav.querySelectorAll('.has-dropdown.open').forEach(item => {
      item.classList.remove('open');
      item.querySelector('.nav-dropdown-toggle')?.setAttribute('aria-expanded', 'false');
    });
  };
  navToggle.addEventListener('click', () => setMenuOpen(!mainNav.classList.contains('open')));
  document.getElementById('navClose')?.addEventListener('click', () => setMenuOpen(false));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenuOpen(false); });
  mainNav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => setMenuOpen(false));
  });

  /* ---------- services dropdown ---------- */
  document.querySelectorAll('.has-dropdown').forEach(item => {
    const toggle = item.querySelector('.nav-dropdown-toggle');
    const setOpen = open => {
      item.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };
    toggle.addEventListener('click', e => {
      e.stopPropagation();
      setOpen(!item.classList.contains('open'));
    });
    item.addEventListener('focusout', e => { if (!item.contains(e.relatedTarget)) setOpen(false); });
    document.addEventListener('click', e => { if (!item.contains(e.target)) setOpen(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
  });

  /* ---------- active nav link on scroll ---------- */
  const navLinks = document.querySelectorAll('.nav-link[data-section]');
  const sections = Array.from(navLinks)
    .map(l => document.getElementById(l.dataset.section))
    .filter(Boolean);

  function updateActiveNav(){
    let currentId = null;
    const trigger = window.scrollY + window.innerHeight * 0.35;
    sections.forEach(sec => {
      if (sec.offsetTop <= trigger) currentId = sec.id;
    });
    navLinks.forEach(l => l.classList.toggle('active', l.dataset.section === currentId));
  }
  onScroll();

  /* ---------- cursor glow ---------- */
  const cursorGlow = document.getElementById('cursorGlow');
  let targetX = window.innerWidth / 2, targetY = window.innerHeight / 2;
  let curX = targetX, curY = targetY;
  const hasFinePointer = window.matchMedia('(pointer:fine)').matches;

  if (hasFinePointer){
    window.addEventListener('mousemove', e => {
      targetX = e.clientX; targetY = e.clientY;
    });
    (function raf(){
      curX += (targetX - curX) * 0.12;
      curY += (targetY - curY) * 0.12;
      cursorGlow.style.left = curX + 'px';
      cursorGlow.style.top = curY + 'px';
      requestAnimationFrame(raf);
    })();
  } else {
    cursorGlow.style.display = 'none';
  }

  /* ---------- service card mouse-follow glow ---------- */
  document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ---------- reveal on scroll ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  revealEls.forEach((el, i) => {
    el.style.transitionDelay = (i % 6) * 60 + 'ms';
    revealObserver.observe(el);
  });

  /* ---------- animated counters ---------- */
  const counters = document.querySelectorAll('.stat-num');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || '';
      const duration = 1400;
      const start = performance.now();

      function tick(now){
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target) + suffix;
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      counterObserver.unobserve(el);
    });
  }, { threshold: 0.6 });
  counters.forEach(c => counterObserver.observe(c));

  /* ---------- back to top ---------- */
  document.getElementById('backToTop').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ---------- enquiry tracking (Google Analytics key events) ---------- */
  // Mark these as key events in GA: Admin → Events → toggle "Mark as key event".
  const track = (name, params) => { if (typeof window.gtag === 'function') window.gtag('event', name, params); };
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (href.startsWith('mailto:')) track('email_click', { link_location: link.closest('footer') ? 'footer' : 'contact' });
    else if (/^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(href)) track('whatsapp_click', { link_location: link.closest('footer') ? 'footer' : 'contact' });
  });

  /* ---------- contact form (submits to Google Apps Script) ---------- */
  const CONTACT_ENDPOINT = 'https://script.google.com/macros/s/AKfycbyOW3W-wttVQkSp-0cG5DfclVr1GvgNJFPpGci1t6LExZRu2gmfzL18ZFeSYXnPbLRN/exec';

  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    const submitBtn = contactForm.querySelector('.form-submit');
    const submitLabel = submitBtn?.querySelector('span');
    const errorEl = document.getElementById('formError');

    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = contactForm.name.value.trim();

      if (errorEl) errorEl.hidden = true;
      if (submitBtn) submitBtn.disabled = true;
      if (submitLabel) submitLabel.textContent = 'Sending…';

      // The Apps Script only reads name/email/type/message, so the WhatsApp
      // number rides at the top of the message to reach the email and sheet.
      const data = new FormData(contactForm);
      const number = (data.get('whatsapp') || '').trim();
      if (number) {
        const whatsapp = `${data.get('whatsappCode') || ''} ${number}`.trim();
        data.set('whatsapp', whatsapp);
        data.set('message', `WhatsApp: ${whatsapp}\n\n${data.get('message')}`);
      }

      fetch(CONTACT_ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        body: data,
      })
        .then(() => {
          track('generate_lead', { form_name: 'contact', project_type: data.get('type') || '' });
          const success = document.getElementById('formSuccess');
          const successName = document.getElementById('formSuccessName');
          if (successName) successName.textContent = name ? `, ${name}` : '';
          if (success) success.hidden = false;
          contactForm.hidden = true;
        })
        .catch(() => {
          if (errorEl) errorEl.hidden = false;
        })
        .finally(() => {
          if (submitBtn) submitBtn.disabled = false;
          if (submitLabel) submitLabel.textContent = 'Send Message';
        });
    });

    document.getElementById('formSuccessReset')?.addEventListener('click', () => {
      contactForm.reset();
      contactForm.hidden = false;
      const success = document.getElementById('formSuccess');
      if (success) success.hidden = true;
    });
  }

})();
