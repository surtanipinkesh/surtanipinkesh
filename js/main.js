// ============================================================
// Papad Pixels — 3D Portfolio Universe (Three.js)
// ============================================================
import * as THREE from './vendor/three.module.min.js';
import {
  CATEGORIES, PROJECTS, previewEmbedUrl, fetchMeta, loadImage, openVideoModal, bindVideoModal,
} from './projects.js?v=7';

// Round-robins across categories so a touch-device card cap doesn't end up
// showing only the first category in the list.
function pickBalanced(list, count) {
  if (list.length <= count) return list.slice();
  const byCat = {};
  list.forEach(p => { (byCat[p.cat] || (byCat[p.cat] = [])).push(p); });
  const cats = Object.keys(byCat);
  const out = [];
  let i = 0;
  while (out.length < count && cats.some(c => byCat[c].length)) {
    const cat = cats[i % cats.length];
    if (byCat[cat].length) out.push(byCat[cat].shift());
    i++;
  }
  return out;
}

const isTouch = window.matchMedia('(pointer:coarse)').matches;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const cardCount = isTouch ? Math.min(PROJECTS.length, 11) : PROJECTS.length;
const starCount = isTouch ? 350 : 900;

function makeCardTexture(project) {
  const cfg = CATEGORIES[project.cat];
  const portrait = project.orientation === 'portrait';
  const w = portrait ? 576 : 1024;
  const h = portrait ? 1024 : 576;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');

  if (project.thumbImg) {
    drawImageCover(ctx, project.thumbImg, 0, 0, w, h);
  } else {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, cfg.colorA);
    grad.addColorStop(1, mix(cfg.colorA, cfg.colorB, 0.35));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // fine grid — only drawn on the placeholder art, not over real thumbnails
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  }

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
  ctx.fillStyle = 'rgba(24,22,17,0.6)';
  roundRect(ctx, 28, 28, textW + padX * 2, 44, 22);
  ctx.fill();
  ctx.fillStyle = '#f8f5ee';
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
  ctx.fillStyle = '#f8f5ee';
  ctx.textBaseline = 'alphabetic';
  wrapText(ctx, project.title, 30, h - 40, w - 60, 38);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// Draws img into the x/y/w/h box with cover-fit cropping (like CSS
// background-size: cover), so real thumbnails fill the card cleanly
// regardless of their native aspect ratio.
function drawImageCover(ctx, img, x, y, w, h) {
  const imgRatio = img.width / img.height;
  const boxRatio = w / h;
  let sx, sy, sw, sh;
  if (imgRatio > boxRatio) {
    sh = img.height;
    sw = sh * boxRatio;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = sw / boxRatio;
    sx = 0;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
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

function makeStarTexture() {
  const s = 64;
  const canvas = document.createElement('canvas');
  canvas.width = s; canvas.height = s;
  const ctx = canvas.getContext('2d');
  const cx = s / 2, cy = s / 2;

  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, s / 2);
  glow.addColorStop(0, 'rgba(255,255,255,1)');
  glow.addColorStop(0.25, 'rgba(255,241,214,0.85)');
  glow.addColorStop(1, 'rgba(255,241,214,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, s, s);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  const spikes = 4, outerR = s * 0.46, innerR = s * 0.09;
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = (Math.PI / spikes) * i - Math.PI / 2;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  return new THREE.CanvasTexture(canvas);
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
    this.cards = [];
    this.raycaster = new THREE.Raycaster();

    this.initScene();
    this.buildStarfield();
    this.buildStarlets();
    this.buildHud();
    this.buildPreviewPool();
    this.buildCards();
    this.bindEvents();
    this.onResize();
    this.observeVisibility();
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x18160f, 0.045);

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
      color: 0xe0af3b, size: 0.028, transparent: true, opacity: 0.55,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    this.stars = new THREE.Points(geo, mat);
    this.scene.add(this.stars);
  }

  // Bigger, brighter gold sparkle "starlets" layered over the fine
  // starfield — split into a few groups that twinkle out of phase.
  buildStarlets() {
    const tex = makeStarTexture();
    const groupCount = 3;
    const perGroup = isTouch ? 26 : 60;
    this.starlets = [];

    for (let g = 0; g < groupCount; g++) {
      const positions = new Float32Array(perGroup * 3);
      for (let i = 0; i < perGroup; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 36;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 22;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 36 - 4;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.PointsMaterial({
        map: tex, color: 0xf0c568, size: 0.16 + g * 0.05, transparent: true,
        opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
      });
      const points = new THREE.Points(geo, mat);
      this.scene.add(points);
      this.starlets.push({ mesh: points, phase: g * 2.1, speed: 0.5 + g * 0.15 });
    }
  }

  // Faint sci-fi HUD dressing behind the cards: a wireframe floor grid and
  // a few slow-spinning orbit rings. Kept low-opacity on purpose — this is
  // ambient texture, not the focal point.
  buildHud() {
    this.hud = new THREE.Group();

    const grid = new THREE.GridHelper(28, 28, 0xe0af3b, 0x24334c);
    grid.material.transparent = true;
    grid.material.opacity = 0.07;
    grid.position.set(0, -5.6, -7);
    this.hud.add(grid);

    this.rings = [3.6, 4.8, 6.1].map((r, i) => {
      const ringGeo = new THREE.RingGeometry(r, r + 0.014, 96);
      const ringMat = new THREE.MeshBasicMaterial({
        color: i % 2 ? 0xd3a46e : 0xe0af3b,
        transparent: true, opacity: 0.05 + i * 0.012,
        side: THREE.DoubleSide, depthWrite: false,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.35;
      ring.rotation.y = Math.random() * Math.PI;
      ring.position.z = -6.5 - i * 0.5;
      this.hud.add(ring);
      return { mesh: ring, speed: 0.015 + i * 0.008, boost: 0 };
    });

    this.scene.add(this.hud);
  }

  // Briefly speeds up the HUD rings — the "simulation" cue that fires on
  // every tab switch, on top of the scanline flash and card warp-in.
  pulseHud() {
    this.rings?.forEach(r => { r.boost = 0.4; });
  }

  triggerScanFlash() {
    const el = document.getElementById('universe');
    if (!el || reduceMotion) return;
    el.classList.remove('scan-flash');
    void el.offsetWidth;
    el.classList.add('scan-flash');
  }

  // Async: resolves each project's real title/thumbnail/aspect ratio via
  // oEmbed before building meshes, so cards always match their source video.
  // Stars/HUD are already visible at this point — cards simply pop in once
  // metadata resolves (well under a second on a normal connection).
  async buildCards() {
    const geoByOrientation = {
      landscape: new THREE.PlaneGeometry(2.3, 1.294),
      portrait: new THREE.PlaneGeometry(1.35, 2.4),
    };
    const list = pickBalanced(PROJECTS, cardCount);

    await Promise.all(list.map(async project => {
      await fetchMeta(project);
      project.thumbImg = await loadImage(project.thumbUrl);
    }));

    list.forEach((project, i) => {
      const geo = geoByOrientation[project.orientation === 'portrait' ? 'portrait' : 'landscape'];
      let texture = makeCardTexture(project);
      // Guard against a thumbnail CDN that doesn't send CORS headers —
      // that taints the canvas and throws on GPU upload. Fall back to the
      // placeholder art rather than breaking the whole scene.
      if (this.renderer && project.thumbImg) {
        try {
          this.renderer.initTexture(texture);
        } catch (err) {
          project.thumbImg = null;
          texture.dispose();
          texture = makeCardTexture(project);
        }
      }
      const material = new THREE.MeshBasicMaterial({
        map: texture, transparent: true, opacity: 1, side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geo, material);


      mesh.rotation.y = (Math.random() - 0.5) * 0.5;
      mesh.rotation.x = (Math.random() - 0.5) * 0.15;

      const record = {
        mesh, project,
        basePos: new THREE.Vector3(),
        baseRotY: mesh.rotation.y,
        floatOffset: Math.random() * Math.PI * 2,
        floatSpeed: 0.25 + Math.random() * 0.25,
        floatAmp: 0.18 + Math.random() * 0.14,
        targetScale: 1,
        targetOpacity: 1,
        hitTest: true,
        spawnAt: 0,
      };
      mesh.userData.record = record;
      this.cards.push(record);
      this.scene.add(mesh);
    });

    this.layoutCards();
    this.updateEmptyState();
  }

  // Places cards in screen space rather than by 3D distance: two cards far
  // apart in depth can still sit on top of each other from the camera's
  // point of view. Each card samples depth + screen position and keeps the
  // spot whose on-screen rect (padded for its float motion) overlaps the
  // already-placed cards least — zero in practice for 30 cards.
  layoutCards() {
    const tanH = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    const aspect = this.camera.aspect;
    const camZ = this.camera.position.z;
    const PAD = 0.1, D_MIN = 9, D_MAX = 22, EDGE = 1.1;
    const placed = [];

    this.cards.forEach(c => {
      const portrait = c.project.orientation === 'portrait';
      const w = portrait ? 1.35 : 2.3;
      const h = portrait ? 2.4 : 1.294;
      let best = null, bestCost = Infinity;
      for (let t = 0; t < 600 && bestCost > 0; t++) {
        const d = D_MIN + Math.random() * (D_MAX - D_MIN);
        const hx = (w / 2 + c.floatAmp / 2 + PAD) / (d * tanH * aspect);
        const hy = (h / 2 + c.floatAmp + PAD) / (d * tanH);
        const nx = (Math.random() * 2 - 1) * (EDGE - hx * 0.3);
        const ny = (Math.random() * 2 - 1) * (EDGE - hy * 0.3);
        const r = { l: nx - hx, r: nx + hx, b: ny - hy, t: ny + hy };
        let cost = 0;
        for (const p of placed) {
          const ox = Math.min(r.r, p.r) - Math.max(r.l, p.l);
          const oy = Math.min(r.t, p.t) - Math.max(r.b, p.b);
          if (ox > 0 && oy > 0) cost += ox * oy;
        }
        if (cost < bestCost) { bestCost = cost; best = { r, nx, ny, d }; }
      }
      placed.push(best.r);
      c.basePos.set(best.nx * best.d * tanH * aspect, best.ny * best.d * tanH, camZ - best.d);
      c.mesh.position.copy(c.basePos);
    });
    this.layoutAspect = aspect;
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

        const prevFilter = this.activeFilter;
        const nextFilter = btn.dataset.filter;
        this.activeFilter = nextFilter;

        // Cards that just became visible "warp in" instead of just fading —
        // the reassembly effect that sells the tab switch as a simulation.
        this.cards.forEach(c => {
          const wasMatch = prevFilter === 'all' || c.project.cat === prevFilter;
          const nowMatch = nextFilter === 'all' || c.project.cat === nextFilter;
          if (nowMatch && !wasMatch) c.spawnAt = performance.now();
        });

        this.updateEmptyState();
        this.pulseHud();
        this.triggerScanFlash();
      });
    });

    bindVideoModal();
  }

  updateEmptyState() {
    const empty = document.getElementById('universeEmpty');
    if (!empty) return;
    const hasMatches = this.activeFilter === 'all' || PROJECTS.some(p => p.cat === this.activeFilter);
    empty.style.opacity = hasMatches ? '0' : '1';
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
          this.clearPreviews();
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
      openVideoModal(hits[0].object.userData.record.project);
    }
  }

  onResize() {
    const rect = this.wrap.getBoundingClientRect();
    const w = Math.max(rect.width, 1), h = Math.max(rect.height, 1);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (this.renderer) this.renderer.setSize(w, h, false);
    // A big shape change (window resize, phone rotation) re-flows the cards
    // so they neither overlap nor bunch up in the middle.
    if (this.cards.length && Math.abs(this.camera.aspect / this.layoutAspect - 1) > 0.2) this.layoutCards();
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

      if (!reduceMotion) {
        this.starlets.forEach(s => {
          s.mesh.material.opacity = 0.35 + Math.sin(t * s.speed + s.phase) * 0.28;
          s.mesh.rotation.y = t * 0.008;
        });
      }

      if (!reduceMotion) {
        this.rings.forEach(r => {
          r.boost = THREE.MathUtils.lerp(r.boost, 0, 0.02);
          r.mesh.rotation.z += r.speed + r.boost;
        });
      }

      const now = performance.now();
      this.cards.forEach(c => {
        if (!reduceMotion) {
          c.mesh.position.y = c.basePos.y + Math.sin(t * c.floatSpeed + c.floatOffset) * c.floatAmp;
          c.mesh.position.x = c.basePos.x + Math.cos(t * c.floatSpeed * 0.8 + c.floatOffset) * (c.floatAmp * 0.5);
          c.mesh.rotation.y = c.baseRotY + Math.sin(t * c.floatSpeed * 0.6 + c.floatOffset) * 0.12;
        }

        const matches = this.activeFilter === 'all' || c.project.cat === this.activeFilter;
        const isHovered = this.hovered === c;
        c.targetScale = isHovered ? 1.14 : (matches ? 1 : 0.6);
        c.targetOpacity = matches ? (isHovered ? 1 : 0.92) : 0.08;
        c.hitTest = matches;

        const spawning = c.spawnAt && now - c.spawnAt < 550 && !reduceMotion;
        let s;
        if (spawning) {
          const p = Math.min(1, (now - c.spawnAt) / 550);
          const eased = 1 - Math.pow(1 - p, 3);
          s = THREE.MathUtils.lerp(0.35, c.targetScale, eased);
        } else {
          s = THREE.MathUtils.lerp(c.mesh.scale.x, c.targetScale, 0.12);
        }
        c.mesh.scale.setScalar(s);
        c.mesh.material.opacity = THREE.MathUtils.lerp(c.mesh.material.opacity, c.targetOpacity, spawning ? 0.3 : 0.12);
      });

      if (!isTouch) this.updateHover();
      this.updatePreviews(now);

      this.renderer.render(this.scene, this.camera);
    };
    loop();
  }

  // A handful of chromeless, muted iframes overlaid on the canvas so the
  // cards nearest the camera play live instead of showing a static
  // thumbnail — matching them 1:1 for every card would be far too heavy
  // (30 simultaneous video streams), so only the closest few play at once.
  buildPreviewPool() {
    this.previewCount = reduceMotion ? 0 : (isTouch ? 2 : 5);
    this.previewPool = [];
    for (let i = 0; i < this.previewCount; i++) {
      const wrap = document.createElement('div');
      wrap.className = 'card-preview-frame';
      wrap.setAttribute('aria-hidden', 'true');
      wrap.style.display = 'none';
      const inner = document.createElement('div');
      wrap.appendChild(inner);
      this.wrap.appendChild(wrap);
      this.previewPool.push({ id: i, wrap, inner, project: null, record: null, ytPlayer: null });
    }
    this._lastPreviewPick = 0;
    this._ytSeq = 0;
  }

  // Tears down whatever is currently playing in a slot (Vimeo iframe or a
  // YT.Player instance) so it can be reassigned to a different video.
  teardownSlot(slot) {
    if (slot.ytPlayer) {
      try { slot.ytPlayer.destroy(); } catch (err) { /* already gone */ }
      slot.ytPlayer = null;
    }
    slot.inner.innerHTML = '';
  }

  // Vimeo's background=1 mode is reliably chromeless regardless of play
  // state, so a plain iframe with URL params is enough. YouTube has no such
  // mode — its title/channel overlay only disappears once the video is
  // genuinely *playing*, and `mute=1` as a URL param isn't reliably honored
  // for autoplay purposes across browsers. So YouTube previews are driven
  // through the real IFrame Player API instead, explicitly calling mute()
  // then playVideo() (and resuming on pause/end) to guarantee it actually
  // plays instead of sitting on the branded paused frame.
  assignSlot(slot, project) {
    this.teardownSlot(slot);
    slot.project = project;
    if (!project) return;

    if (project.source.type === 'vimeo-video') {
      const iframe = document.createElement('iframe');
      iframe.className = 'card-preview-iframe';
      iframe.setAttribute('allow', 'autoplay');
      iframe.setAttribute('tabindex', '-1');
      iframe.src = previewEmbedUrl(project.source);
      slot.inner.appendChild(iframe);
    } else if (project.source.type === 'youtube-video') {
      const host = document.createElement('div');
      host.id = `preview-yt-${slot.id}-${++this._ytSeq}`;
      slot.inner.appendChild(host);
      const hostId = host.id;
      loadYouTubeAPI().then(YT => {
        // Slot may have been reassigned (or torn down) by the time the API
        // finished loading — bail out rather than resurrect a stale player.
        if (slot.project !== project || !document.getElementById(hostId)) return;
        slot.ytPlayer = new YT.Player(hostId, {
          width: '100%', height: '100%', videoId: project.source.id,
          playerVars: {
            autoplay: 1, mute: 1, controls: 0, modestbranding: 1, rel: 0,
            playsinline: 1, iv_load_policy: 3, disablekb: 1, fs: 0,
            loop: 1, playlist: project.source.id,
          },
          events: {
            onReady: e => { e.target.mute(); e.target.playVideo(); },
            onStateChange: e => {
              if (e.data === YT.PlayerState.ENDED) { e.target.seekTo(0); e.target.playVideo(); }
              else if (e.data === YT.PlayerState.PAUSED) { e.target.playVideo(); }
            },
          },
        });
      });
    }
  }

  clearPreviews() {
    this.previewPool?.forEach(slot => {
      this.teardownSlot(slot);
      slot.project = null;
      slot.record = null;
      slot.wrap.style.display = 'none';
    });
  }

  // Computes each on-screen card's projected rect once per pick cycle so
  // the "which cards get to play" choice can skip any that would overlap
  // one another on screen, not just the raw N-nearest-to-camera.
  projectCardRect(c, rect, vFov) {
    const ndc = c.mesh.position.clone().project(this.camera);
    const dist = this.camera.position.distanceTo(c.mesh.position);
    const pxPerWorldUnit = rect.height / (2 * dist * Math.tan(vFov / 2));
    const baseW = c.project.orientation === 'portrait' ? 1.35 : 2.3;
    const baseH = c.project.orientation === 'portrait' ? 2.4 : 1.294;
    const w = baseW * c.mesh.scale.x * pxPerWorldUnit;
    const h = baseH * c.mesh.scale.x * pxPerWorldUnit;
    const sx = (ndc.x * 0.5 + 0.5) * rect.width;
    const sy = (-ndc.y * 0.5 + 0.5) * rect.height;
    return { ndcZ: ndc.z, dist, w, h, left: sx - w / 2, right: sx + w / 2, top: sy - h / 2, bottom: sy + h / 2 };
  }

  updatePreviews(now) {
    if (!this.previewPool || !this.previewPool.length || !this.cards.length) return;
    const rect = this.wrap.getBoundingClientRect();
    const vFov = THREE.MathUtils.degToRad(this.camera.fov);

    // Re-pick which cards get to play every ~800ms — recomputing every
    // frame would reload the player (and restart the video) constantly.
    if (now - this._lastPreviewPick > 800) {
      this._lastPreviewPick = now;
      const scored = this.cards
        .filter(c => c.hitTest && c.mesh.material.opacity > 0.5)
        .map(c => ({ c, r: this.projectCardRect(c, rect, vFov) }))
        .filter(x => x.r.ndcZ > -1 && x.r.ndcZ < 1)
        .sort((a, b) => a.r.dist - b.r.dist);

      // Greedily take the closest cards, skipping any whose projected
      // rect overlaps one already chosen — this is what actually stops
      // two live previews from visually stacking on top of each other.
      const chosen = [];
      for (const item of scored) {
        if (chosen.length >= this.previewPool.length) break;
        const overlaps = chosen.some(o =>
          item.r.left < o.r.right && item.r.right > o.r.left &&
          item.r.top < o.r.bottom && item.r.bottom > o.r.top
        );
        if (!overlaps) chosen.push(item);
      }
      const candidates = chosen.map(x => x.c);

      this.previewPool.forEach((slot, i) => {
        const target = candidates[i] || null;
        if (slot.record === target) return;
        slot.record = target;
        this.assignSlot(slot, target ? target.project : null);
        if (!target) slot.wrap.style.display = 'none';
      });
    }

    this.previewPool.forEach(slot => {
      const record = slot.record;
      if (!record) return;
      const r = this.projectCardRect(record, rect, vFov);
      if (r.ndcZ > 1 || r.ndcZ < -1) { slot.wrap.style.display = 'none'; return; }

      slot.wrap.style.display = 'block';
      slot.wrap.style.opacity = String(record.mesh.material.opacity);
      slot.wrap.style.left = r.left + 'px';
      slot.wrap.style.top = r.top + 'px';
      slot.wrap.style.width = r.w + 'px';
      slot.wrap.style.height = r.h + 'px';
    });
  }
}

// Loads the YouTube IFrame Player API once (shared across every preview
// slot) and resolves with the global YT object once it's ready.
function loadYouTubeAPI() {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (!window.__ytApiPromise) {
    window.__ytApiPromise = new Promise(resolve => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof prev === 'function') prev();
        resolve(window.YT);
      };
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    });
  }
  return window.__ytApiPromise;
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
