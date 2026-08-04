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

  /* ---------- portfolio filter ---------- */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const workCards = document.querySelectorAll('.work-card');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      workCards.forEach(card => {
        const match = filter === 'all' || card.dataset.cat === filter;
        card.classList.toggle('hidden', !match);
      });
    });
  });

  /* ---------- back to top ---------- */
  document.getElementById('backToTop').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ---------- hero particle network canvas ---------- */
  const canvas = document.getElementById('heroCanvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let heroRect;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resizeCanvas(){
    const hero = canvas.closest('.hero');
    heroRect = hero.getBoundingClientRect();
    canvas.width = heroRect.width * window.devicePixelRatio;
    canvas.height = heroRect.height * window.devicePixelRatio;
    canvas.style.width = heroRect.width + 'px';
    canvas.style.height = heroRect.height + 'px';
    ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    initParticles();
  }

  function initParticles(){
    const count = Math.min(70, Math.floor((heroRect.width * heroRect.height) / 18000));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * heroRect.width,
      y: Math.random() * heroRect.height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.6 + 0.6
    }));
  }

  const mouse = { x: -9999, y: -9999 };
  canvas.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
  });
  canvas.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

  function drawParticles(){
    ctx.clearRect(0, 0, heroRect.width, heroRect.height);

    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > heroRect.width) p.vx *= -1;
      if (p.y < 0 || p.y > heroRect.height) p.vy *= -1;
    });

    const linkDist = 130;
    for (let i = 0; i < particles.length; i++){
      for (let j = i + 1; j < particles.length; j++){
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < linkDist){
          ctx.strokeStyle = `rgba(232,184,75,${(1 - dist / linkDist) * 0.18})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      const dxm = particles[i].x - mouse.x, dym = particles[i].y - mouse.y;
      const distm = Math.sqrt(dxm * dxm + dym * dym);
      if (distm < 160){
        ctx.strokeStyle = `rgba(94,234,212,${(1 - distm / 160) * 0.35})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();
      }
    }

    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(242,232,213,0.55)';
      ctx.fill();
    });

    if (!reduceMotion) requestAnimationFrame(drawParticles);
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  if (!reduceMotion) requestAnimationFrame(drawParticles);
  else drawParticles();

})();
