// ============================================================
// Papad Pixels — site interactions
// ============================================================
(() => {
  'use strict';

  document.getElementById('year').textContent = new Date().getFullYear();

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
  navToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('open');
    navToggle.classList.toggle('open', isOpen);
    navToggle.setAttribute('aria-expanded', isOpen);
  });
  mainNav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      mainNav.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', false);
    });
  });

  /* ---------- active nav link on scroll ---------- */
  const navLinks = document.querySelectorAll('.nav-link');
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

  /* ---------- contact form (mailto — no backend yet) ---------- */
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = contactForm.name.value.trim();
      const email = contactForm.email.value.trim();
      const type = contactForm.type.value;
      const message = contactForm.message.value.trim();

      const subject = `Project Inquiry: ${type} (${name})`;
      const body = `Name: ${name}\nEmail: ${email}\nProject type: ${type}\n\n${message}`;
      const mailto = `mailto:create@papadpixels.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      window.location.href = mailto;

      const note = document.getElementById('formNote');
      if (note) note.textContent = "Opening your email app to send this. If nothing happens, email create@papadpixels.com directly.";
    });
  }

})();
