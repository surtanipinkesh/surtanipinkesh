// ============================================================
// Papad Pixels — 3D Portfolio Universe (Three.js)
// ============================================================
import * as THREE from './vendor/three.module.min.js';

const CATEGORIES = {
  ai:    { label: 'AI Commercial', platform: 'behance',   colorA: '#16233f', colorB: '#e8b84b' },
  tvc:   { label: 'TVC Edit',      platform: 'vimeo',     colorA: '#0f1f2e', colorB: '#5eead4' },
  reel:  { label: 'Social Reel',   platform: 'instagram', colorA: '#241634', colorB: '#c98be0' },
  brand: { label: 'Brand Film',    platform: 'vimeo',     colorA: '#2a1c14', colorB: '#f2b56b' },
};

const PLATFORM_URLS = {
  behance:   'https://www.behance.net/surtanipinkesh',
  vimeo:     'https://www.vimeo.com/surtanipinkesh',
  instagram: 'https://www.instagram.com/davinciresolvecraftsman',
};

const PLATFORM_LABELS = {
  behance:   'Watch on Behance',
  vimeo:     'Watch on Vimeo',
  instagram: 'Watch on Instagram',
};

// Weighted toward AI commercials + TVCs per the brief.
const PROJECTS = [
  { cat: 'ai',    title: 'AI Commercial — Concept Reel' },
  { cat: 'ai',    title: 'Generative Product Ad' },
  { cat: 'ai',    title: 'AI Commercial — Brand Spot' },
  { cat: 'ai',    title: 'Synthetic Actor Campaign' },
  { cat: 'ai',    title: 'AI Commercial — Launch Film' },
  { cat: 'ai',    title: 'Generative VFX Spot' },
  { cat: 'tvc',   title: 'TVC Edit — Broadcast Cut' },
  { cat: 'tvc',   title: 'TVC Edit — 30s Spot' },
  { cat: 'tvc',   title: 'TVC Edit — Festive Campaign' },
  { cat: 'tvc',   title: 'TVC Edit — Product Launch' },
  { cat: 'tvc',   title: 'TVC Edit — Brand Spot' },
  { cat: 'reel',  title: 'Social Reel — Campaign Cut' },
  { cat: 'reel',  title: 'Instagram Reel Edit' },
  { cat: 'reel',  title: 'Short-Form Ad Edit' },
  { cat: 'brand', title: 'Brand Film — Hero Edit' },
  { cat: 'brand', title: 'Brand Film — Docu Style' },
];

const isTouch = window.matchMedia('(pointer:coarse)').matches;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const cardCount = isTouch ? Math.min(PROJECTS.length, 11) : PROJECTS.length;
const starCount = isTouch ? 350 : 900;

function makeCardTexture(project) {
  const cfg = CATEGORIES[project.cat];
  const w = 1024, h = 576;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, cfg.colorA);
  grad.addColorStop(1, mix(cfg.colorA, cfg.colorB, 0.35));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // fine grid
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = 0; y < h; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

  // vignette
  const vg = ctx.createRadialGradient(w/2, h/2, h*0.25, w/2, h/2, h*0.85);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);

  // border
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, w - 4, h - 4);

  // category pill
  ctx.font = '600 22px Space Grotesk, sans-serif';
  const label = cfg.label.toUpperCase();
  const padX = 20;
  const textW = ctx.measureText(label).width;
  ctx.fillStyle = 'rgba(7,11,20,0.55)';
  roundRect(ctx, 28, 28, textW + padX * 2, 44, 22);
  ctx.fill();
  ctx.fillStyle = '#f2e8d5';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 28 + padX, 28 + 23);

  // play button
  const cx = w / 2, cy = h / 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 64, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - 18, cy - 28);
  ctx.lineTo(cx - 18, cy + 28);
  ctx.lineTo(cx + 30, cy);
  ctx.closePath();
  ctx.fillStyle = '#fff';
  ctx.fill();

  // title
  ctx.font = '700 34px Orbitron, sans-serif';
  ctx.fillStyle = '#f2e8d5';
  ctx.textBaseline = 'alphabetic';
  wrapText(ctx, project.title, 30, h - 40, w - 60, 38);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  const lines = [];
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  lines.push(line);
  const startY = y - (lines.length - 1) * lineHeight;
  lines.forEach((l, i) => ctx.fillText(l, x, startY + i * lineHeight));
}

function mix(hexA, hexB, t) {
  const a = hexToRgb(hexA), b = hexToRgb(hexB);
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bch = Math.round(a.b + (b.b - a.b) * t);
  return `rgb(${r},${g},${bch})`;
}
function hexToRgb(hex) {
  const v = parseInt(hex.slice(1), 16);
  return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
}

class PortfolioUniverse {
  constructor(canvas, wrap) {
    this.canvas = canvas;
    this.wrap = wrap;
    this.hovered = null;
    this.activeFilter = 'all';
    this.mouseNDC = new THREE.Vector2(-10, -10);
    this.targetLook = new THREE.Vector2(0, 0);
    this.currentLook = new THREE.Vector2(0, 0);
    this.dragging = false;
    this.dragLast = new THREE.Vector2();
    this.running = false;

    this.initScene();
    this.buildStarfield();
    this.buildCards();
    this.bindEvents();
    this.onResize();
    this.observeVisibility();
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x070b14, 0.045);

    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 60);
    this.camera.position.set(0, 0, 6.5);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
    } catch (e) {
      renderer = null;
    }
    this.renderer = renderer;
    if (this.renderer) {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.setClearColor(0x000000, 0);
    }
  }

  buildStarfield() {
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 24;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40 - 5;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xe8b84b, size: 0.028, transparent: true, opacity: 0.55,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    this.stars = new THREE.Points(geo, mat);
    this.scene.add(this.stars);
  }

  buildCards() {
    this.cards = [];
    const geo = new THREE.PlaneGeometry(2.3, 1.294);
    const placed = [];
    const list = PROJECTS.slice(0, cardCount);

    list.forEach((project, i) => {
      const texture = makeCardTexture(project);
      const material = new THREE.MeshBasicMaterial({
        map: texture, transparent: true, opacity: 1, side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geo, material);

      // Keep a clear "safe zone" free of near/central cards so the hero
      // copy stays readable — cards frame the text instead of covering it.
      const inSafeZone = (p) => {
        const ex = (p.x / 4.2) ** 2 + (p.y / 2.9) ** 2;
        return ex < 1 && p.z > -5;
      };

      let pos;
      let tries = 0;
      do {
        pos = new THREE.Vector3(
          (Math.random() - 0.5) * 13.5,
          (Math.random() - 0.5) * 7.4,
          -1.5 - Math.random() * 9.5
        );
        tries++;
      } while (tries < 40 && (inSafeZone(pos) || placed.some(p => p.distanceTo(pos) < 2.3)));
      placed.push(pos);

      mesh.position.copy(pos);
      mesh.rotation.y = (Math.random() - 0.5) * 0.5;
      mesh.rotation.x = (Math.random() - 0.5) * 0.15;

      const record = {
        mesh, project,
        basePos: pos.clone(),
        baseRotY: mesh.rotation.y,
        floatOffset: Math.random() * Math.PI * 2,
        floatSpeed: 0.25 + Math.random() * 0.25,
        floatAmp: 0.18 + Math.random() * 0.14,
        targetScale: 1,
        targetOpacity: 1,
        hitTest: true,
      };
      mesh.userData.record = record;
      this.cards.push(record);
      this.scene.add(mesh);
    });

    this.raycaster = new THREE.Raycaster();
  }

  bindEvents() {
    const onMove = (clientX, clientY) => {
      const rect = this.wrap.getBoundingClientRect();
      const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -((clientY - rect.top) / rect.height) * 2 + 1;
      this.mouseNDC.set(nx, ny);
      this.targetLook.set(nx, ny);
    };

    if (!isTouch) {
      window.addEventListener('mousemove', e => onMove(e.clientX, e.clientY));
      this.wrap.addEventListener('click', e => this.handleSelect(e.clientX, e.clientY));
    } else {
      this.wrap.addEventListener('touchstart', e => {
        if (!e.touches.length) return;
        this.dragging = true;
        this.dragLast.set(e.touches[0].clientX, e.touches[0].clientY);
        this._touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() };
      }, { passive: true });
      this.wrap.addEventListener('touchmove', e => {
        if (!this.dragging || !e.touches.length) return;
        const t = e.touches[0];
        const dx = t.clientX - this.dragLast.x;
        const dy = t.clientY - this.dragLast.y;
        this.targetLook.x = THREE.MathUtils.clamp(this.targetLook.x + dx * 0.004, -1, 1);
        this.targetLook.y = THREE.MathUtils.clamp(this.targetLook.y - dy * 0.004, -1, 1);
        this.dragLast.set(t.clientX, t.clientY);
      }, { passive: true });
      this.wrap.addEventListener('touchend', e => {
        this.dragging = false;
        const start = this._touchStart;
        if (start && Date.now() - start.t < 350) {
          const dx = (e.changedTouches[0].clientX - start.x);
          const dy = (e.changedTouches[0].clientY - start.y);
          if (Math.hypot(dx, dy) < 12) this.handleSelect(start.x, start.y);
        }
      });
    }

    window.addEventListener('resize', () => this.onResize());

    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeFilter = btn.dataset.filter;
      });
    });

    document.getElementById('cardModalClose').addEventListener('click', () => this.closeModal());
    document.getElementById('cardModalBackdrop').addEventListener('click', () => this.closeModal());
  }

  observeVisibility() {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        this.running = entry.isIntersecting && !!this.renderer;
        if (this.running) {
          this.start();
        } else {
          this.hovered = null;
          this.wrap.style.cursor = 'default';
          const tooltip = document.getElementById('cardTooltip');
          if (tooltip) tooltip.style.opacity = '0';
        }
      });
    }, { threshold: 0.05 });
    io.observe(this.wrap);
  }

  handleSelect(clientX, clientY) {
    const rect = this.wrap.getBoundingClientRect();
    const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera({ x: nx, y: ny }, this.camera);
    const hitMeshes = this.cards.filter(c => c.hitTest).map(c => c.mesh);
    const hits = this.raycaster.intersectObjects(hitMeshes);
    if (hits.length) {
      this.openModal(hits[0].object.userData.record.project);
    }
  }

  openModal(project) {
    const cfg = CATEGORIES[project.cat];
    document.getElementById('modalCat').textContent = cfg.label;
    document.getElementById('modalTitle').textContent = project.title;
    const link = document.getElementById('modalLink');
    link.href = PLATFORM_URLS[cfg.platform];
    link.querySelector('span').textContent = PLATFORM_LABELS[cfg.platform];
    const modal = document.getElementById('cardModal');
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }

  closeModal() {
    const modal = document.getElementById('cardModal');
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }

  onResize() {
    const rect = this.wrap.getBoundingClientRect();
    const w = Math.max(rect.width, 1), h = Math.max(rect.height, 1);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (this.renderer) this.renderer.setSize(w, h, false);
  }

  updateHover() {
    if (isTouch) return;
    this.raycaster.setFromCamera(this.mouseNDC, this.camera);
    const hitMeshes = this.cards.filter(c => c.hitTest).map(c => c.mesh);
    const hits = this.raycaster.intersectObjects(hitMeshes);
    const tooltip = document.getElementById('cardTooltip');

    if (hits.length) {
      const record = hits[0].object.userData.record;
      this.hovered = record;
      this.wrap.style.cursor = 'pointer';
      const cfg = CATEGORIES[record.project.cat];
      document.getElementById('cardTooltipCat').textContent = cfg.label;
      document.getElementById('cardTooltipTitle').textContent = record.project.title;
      tooltip.style.opacity = '1';
      tooltip.style.transform = `translate(${this.lastClientX + 18}px, ${this.lastClientY + 18}px)`;
    } else {
      this.hovered = null;
      this.wrap.style.cursor = 'default';
      tooltip.style.opacity = '0';
    }
  }

  start() {
    if (this._started) return;
    this._started = true;
    const clock = new THREE.Clock();

    if (!isTouch) {
      window.addEventListener('mousemove', e => { this.lastClientX = e.clientX; this.lastClientY = e.clientY; });
    }

    const loop = () => {
      requestAnimationFrame(loop);
      if (!this.running || !this.renderer) return;
      const t = clock.getElapsedTime();

      const lerpFactor = reduceMotion ? 1 : 0.05;
      this.currentLook.lerp(this.targetLook, lerpFactor);

      const lookX = this.currentLook.x * 0.9;
      const lookY = this.currentLook.y * 0.5;
      this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, lookX * 0.6, 0.06);
      this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, lookY * 0.4, 0.06);
      this.camera.lookAt(lookX * 2.2, lookY * 1.4, -6);

      if (!reduceMotion) this.stars.rotation.y = t * 0.01;

      this.cards.forEach(c => {
        if (!reduceMotion) {
          c.mesh.position.y = c.basePos.y + Math.sin(t * c.floatSpeed + c.floatOffset) * c.floatAmp;
          c.mesh.position.x = c.basePos.x + Math.cos(t * c.floatSpeed * 0.8 + c.floatOffset) * (c.floatAmp * 0.5);
          c.mesh.rotation.y = c.baseRotY + Math.sin(t * c.floatSpeed * 0.6 + c.floatOffset) * 0.12;
        }

        const matches = this.activeFilter === 'all' || c.project.cat === this.activeFilter;
        const isHovered = this.hovered === c;
        c.targetScale = isHovered ? 1.14 : (matches ? 1 : 0.82);
        c.targetOpacity = matches ? (isHovered ? 1 : 0.92) : 0.12;
        c.hitTest = matches;

        const s = THREE.MathUtils.lerp(c.mesh.scale.x, c.targetScale, 0.12);
        c.mesh.scale.setScalar(s);
        c.mesh.material.opacity = THREE.MathUtils.lerp(c.mesh.material.opacity, c.targetOpacity, 0.12);
      });

      if (!isTouch) this.updateHover();

      this.renderer.render(this.scene, this.camera);
    };
    loop();
  }
}

function boot() {
  const canvas = document.getElementById('universeCanvas');
  const wrap = document.querySelector('.universe-canvas-wrap');
  if (!canvas || !wrap) return;

  try {
    const universe = new PortfolioUniverse(canvas, wrap);
    window.__universe = universe;
    if (!universe.renderer) {
      document.getElementById('universe').classList.add('no-webgl');
    }
  } catch (err) {
    document.getElementById('universe').classList.add('no-webgl');
    console.error('Portfolio Universe failed to initialize:', err);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
