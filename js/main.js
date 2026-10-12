// ============================================================
// Papad Pixels — 3D Portfolio Universe (Three.js)
// ============================================================
import * as THREE from './vendor/three.module.min.js';
import {
  CATEGORIES, PROJECTS, thumbSrc, loadImage, openVideoModal, bindVideoModal,
} from './projects.js?v=16';

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
    // Film stills stay clean: just the frame and a hairline edge. The title
    // shows in the hover tooltip instead.
    if (project.frame) {
      ctx.strokeStyle = 'rgba(255,255,255,0.14)';
      ctx.lineWidth = 3;
      ctx.strokeRect(1.5, 1.5, w - 3, h - 3);
      const clean = new THREE.CanvasTexture(canvas);
      clean.colorSpace = THREE.SRGBColorSpace;
      clean.anisotropy = 4;
      return clean;
    }
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
    this.buildPixels();
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
  // every tab switch, alongside the flying pixels and card warp-in.
  pulseHud() {
    this.rings?.forEach(r => { r.boost = 0.4; });
  }

  // "Flying pixels" for tab switches: a pool of small square points that
  // break off a moving card in its own colours, stream along a curved path
  // and re-form at the card's new spot. One draw call for the whole pool.
  buildPixels() {
    const N = isTouch ? 900 : 2400;
    const geo = new THREE.BufferGeometry();
    this.px = {
      N, next: 0, live: 0,
      pos: new Float32Array(N * 3), col: new Float32Array(N * 3),
      size: new Float32Array(N), alpha: new Float32Array(N),
      list: Array.from({ length: N }, () => ({ start: 0, dur: 0, from: new THREE.Vector3(), to: new THREE.Vector3(), off: new THREE.Vector3(), done: true })),
    };
    geo.setAttribute('position', new THREE.BufferAttribute(this.px.pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.px.col, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(this.px.size, 1));
    geo.setAttribute('alpha', new THREE.BufferAttribute(this.px.alpha, 1));
    this.pxMat = new THREE.ShaderMaterial({
      uniforms: { uScale: { value: 400 } },
      vertexShader: `
        attribute float size; attribute float alpha; attribute vec3 color;
        varying float vAlpha; varying vec3 vColor; uniform float uScale;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * uScale / -mv.z;
          gl_Position = projectionMatrix * mv;
          vAlpha = alpha; vColor = color;
        }`,
      fragmentShader: `
        varying float vAlpha; varying vec3 vColor;
        void main() { if (vAlpha < 0.01) discard; gl_FragColor = vec4(vColor, vAlpha); }`,
      transparent: true, depthWrite: false,
    });
    const points = new THREE.Points(geo, this.pxMat);
    points.frustumCulled = false;
    points.renderOrder = 3;
    this.scene.add(points);
    this.pxPoints = points;
  }

  // Samples a card's own picture into a small colour grid, so its pixels
  // fly off in the card's real colours. Falls back to brand gold.
  samplePixelColors(record) {
    try {
      const src = record.mesh.material.map.image;
      const c = document.createElement('canvas');
      c.width = 16; c.height = 16;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(src, 0, 0, 16, 16);
      record.pixelColors = ctx.getImageData(0, 0, 16, 16).data;
    } catch (e) {
      record.pixelColors = null;
    }
  }

  emitPixels(c, from, to, start, dur) {
    if (reduceMotion || !this.px) return;
    const px = this.px;
    const { width: w, height: h } = c.mesh.geometry.parameters;
    const count = isTouch ? 45 : 100;
    const gold = [[0.878, 0.686, 0.231], [0.941, 0.773, 0.408], [0.973, 0.961, 0.933], [0.827, 0.643, 0.431]];
    for (let i = 0; i < count; i++) {
      const k = px.next;
      px.next = (px.next + 1) % px.N;
      const p = px.list[k];
      const u = Math.random(), v = Math.random();
      const lx = (u - 0.5) * w, ly = (v - 0.5) * h;
      p.from.set(from.x + lx, from.y + ly, from.z);
      p.to.set(to.x + lx, to.y + ly, to.z);
      // Spread mid-flight: outward from the card's centre plus some drift.
      p.off.set(lx * 1.4 + (Math.random() - 0.5) * 1.6, ly * 1.4 + (Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 1.5);
      p.start = start + Math.random() * dur * 0.25;
      p.dur = dur * (0.6 + Math.random() * 0.25);
      p.done = false;
      let rgb;
      if (c.pixelColors && Math.random() > 0.22) {
        const gx = Math.min(15, Math.floor(u * 16)), gy = Math.min(15, Math.floor((1 - v) * 16));
        const o = (gy * 16 + gx) * 4;
        rgb = [c.pixelColors[o] / 255, c.pixelColors[o + 1] / 255, c.pixelColors[o + 2] / 255];
      } else {
        rgb = gold[(Math.random() * gold.length) | 0];
      }
      px.col.set(rgb, k * 3);
      px.size[k] = 0.025 + Math.random() * 0.05;
      px.alpha[k] = 0;
      px.pos.set([p.from.x, p.from.y, p.from.z], k * 3);
    }
    this.pxPoints.geometry.attributes.color.needsUpdate = true;
    this.pxPoints.geometry.attributes.size.needsUpdate = true;
    this.pxActive = true;
  }

  updatePixels(now) {
    if (!this.pxActive) return;
    const px = this.px;
    let any = false;
    for (let k = 0; k < px.N; k++) {
      const p = px.list[k];
      if (p.done) continue;
      const t = (now - p.start) / p.dur;
      if (t < 0) { any = true; continue; }
      if (t >= 1) { p.done = true; px.alpha[k] = 0; continue; }
      any = true;
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const sw = Math.sin(Math.PI * e);
      px.pos[k * 3] = p.from.x + (p.to.x - p.from.x) * e + p.off.x * sw;
      px.pos[k * 3 + 1] = p.from.y + (p.to.y - p.from.y) * e + p.off.y * sw;
      px.pos[k * 3 + 2] = p.from.z + (p.to.z - p.from.z) * e + p.off.z * sw;
      px.alpha[k] = Math.min(1, Math.sin(Math.PI * t) * 1.6) * 0.95;
    }
    this.pxPoints.geometry.attributes.position.needsUpdate = true;
    this.pxPoints.geometry.attributes.alpha.needsUpdate = true;
    this.pxActive = any;
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
      project.thumbImg = await loadImage(thumbSrc(project, project.frame ? 1280 : 640));
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
        // Scattered "home" spot deep in space; a tab's cards fly from here
        // to spots near the screen and back (see applyFilter).
        homePos: new THREE.Vector3(),
        homeRotY: mesh.rotation.y,
        homeRotX: mesh.rotation.x,
        focused: false,
        anim: null,
        floatOffset: Math.random() * Math.PI * 2,
        floatSpeed: 0.25 + Math.random() * 0.25,
        floatAmp: 0.08 + Math.random() * 0.04,
        targetScale: 1,
        targetOpacity: 1,
        hitTest: true,
        spawnAt: 0,
      };
      mesh.userData.record = record;
      this.samplePixelColors(record);
      this.cards.push(record);
      this.scene.add(mesh);
    });

    this.layoutCards();
    this.updateEmptyState();
  }

  // Screen-space box covering every view of the card at (x, y, z): tilted
  // to both ends of its sway, seen from every camera position the mouse can
  // slide to, padded for its float. Coordinates are NDC (-1..1).
  footprint(c, x, y, z) {
    const tanH = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    const aspect = this.camera.aspect;
    const camZ = this.camera.position.z;
    const PAD = 0.04, CAM_X = 0.18, CAM_Y = 0.075, SWAY = 0.12;
    const { width: w, height: h } = c.mesh.geometry.parameters;
    const cosX = Math.cos(c.homeRotX), sinX = Math.sin(c.homeRotX);
    const box = { l: Infinity, r: -Infinity, b: Infinity, t: -Infinity };
    let nearest = Infinity;
    for (const ry of [c.homeRotY - SWAY, c.homeRotY + SWAY]) {
      const cosY = Math.cos(ry), sinY = Math.sin(ry);
      for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        // Euler XYZ on a flat quad: rotate about Y, then about X.
        const lx = sx * w / 2, ly = sy * h / 2;
        const px = x + lx * cosY;
        const pz0 = -lx * sinY;
        const py = y + ly * cosX - pz0 * sinX;
        const pz = z + ly * sinX + pz0 * cosX;
        const dist = camZ - pz;
        nearest = Math.min(nearest, dist);
        for (const [cx, cy] of [[-CAM_X, -CAM_Y], [CAM_X, -CAM_Y], [-CAM_X, CAM_Y], [CAM_X, CAM_Y]]) {
          const nx = (px - cx) / (dist * tanH * aspect);
          const ny = (py - cy) / (dist * tanH);
          if (nx < box.l) box.l = nx;
          if (nx > box.r) box.r = nx;
          if (ny < box.b) box.b = ny;
          if (ny > box.t) box.t = ny;
        }
      }
    }
    const padX = (c.floatAmp / 2 + PAD) / (nearest * tanH * aspect);
    const padY = (c.floatAmp + PAD) / (nearest * tanH);
    box.l -= padX; box.r += padX; box.b -= padY; box.t += padY;
    return box;
  }

  // Scatters cards by sampling depth + screen position and keeping, for each
  // card, the spot whose on-screen box overlaps the already-placed ones least
  // (plus any penalty from outOf, e.g. leaving the allowed area). Working in
  // screen space matters: two cards far apart in depth can still sit on top
  // of each other from the camera's point of view.
  scatter(list, pick, outOf = () => 0) {
    const placed = [];
    const out = new Map();
    list.forEach(c => {
      let best = null, bestCost = Infinity;
      for (let t = 0; t < 4000 && bestCost > 0; t++) {
        const [x, y, z] = pick();
        const r = this.footprint(c, x, y, z);
        let cost = outOf(r) * 10;
        for (const p of placed) {
          const ox = Math.min(r.r, p.r) - Math.max(r.l, p.l);
          const oy = Math.min(r.t, p.t) - Math.max(r.b, p.b);
          if (ox > 0 && oy > 0) cost += ox * oy;
        }
        if (cost < bestCost) { bestCost = cost; best = { r, x, y, z }; }
      }
      placed.push(best.r);
      out.set(c, new THREE.Vector3(best.x, best.y, best.z));
    });
    return out;
  }

  // Every card's "home": scattered deep in space across the whole view.
  layoutCards() {
    const tanH = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    const aspect = this.camera.aspect;
    const camZ = this.camera.position.z;
    const narrow = aspect < 1;
    const EDGE = 1.15;
    const D_MIN = narrow ? 7 : 5.5, D_MAX = narrow ? 18 : 14;
    const homes = this.scatter(this.cards, () => {
      const d = D_MIN + Math.random() * (D_MAX - D_MIN);
      return [(Math.random() * 2 - 1) * EDGE * d * tanH * aspect, (Math.random() * 2 - 1) * EDGE * d * tanH, camZ - d];
    });
    this.cards.forEach(c => {
      c.homePos.copy(homes.get(c));
      c.basePos.copy(c.homePos);
      c.mesh.position.copy(c.homePos);
    });
    this.layoutAspect = aspect;
    this.nearCache = {};
    // A re-flow mid-tab snaps the selected cards straight to their new spots.
    this.applyFilter(false);
  }

  // Where a tab's cards float when it's selected: still scattered and tilted
  // like the rest of the universe, but pulled in close to the screen and
  // gathered into the free area between the header and the tab bar. Cached
  // per tab so a tab always brings its cards to the same spots.
  nearLayout(filter, list) {
    if (!list.length) return new Map();
    if (this.nearCache[filter]) return this.nearCache[filter];
    const tanH = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    const aspect = this.camera.aspect;
    const camZ = this.camera.position.z;
    // Free band on screen, as NDC: below the fixed header, above the tab bar.
    const wrapRect = this.wrap.getBoundingClientRect();
    const hPx = Math.max(wrapRect.height, 1);
    const bar = document.getElementById('universeFilters')?.getBoundingClientRect();
    const botPx = bar && bar.height ? bar.top - wrapRect.top - 16 : hPx * 0.78;
    const yTop = 1 - 2 * 92 / hPx;
    const yBot = Math.min(1 - 2 * botPx / hPx, 0.1);
    const xLim = aspect < 1 ? 0.94 : 0.9;
    // Depth that gives the group roughly 30% coverage of that band, so the
    // cards come in big but still have room to float apart.
    const area = list.reduce((s, c) => s + c.mesh.geometry.parameters.width * c.mesh.geometry.parameters.height, 0);
    const perD2 = 2 * xLim * tanH * aspect * (yTop - yBot) * tanH;
    const d0 = THREE.MathUtils.clamp(Math.sqrt(area / (0.3 * perD2)), 4, 11);
    const outOf = r => Math.max(0, r.r - xLim) + Math.max(0, -xLim - r.l) + Math.max(0, r.t - yTop) + Math.max(0, yBot - r.b);
    const spots = this.scatter(list, () => {
      const d = d0 * (0.85 + Math.random() * 0.35);
      const ny = yBot + Math.random() * (yTop - yBot);
      return [(Math.random() * 2 - 1) * xLim * d * tanH * aspect, ny * d * tanH, camZ - d];
    }, outOf);
    this.nearCache[filter] = spots;
    return spots;
  }

  // Brings the active tab's cards in from deep space to float close to the
  // screen, and sends every other card back to its home spot. Animated on
  // tab clicks (staggered ease with a swoop), instant on layout changes.
  applyFilter(animate) {
    const f = this.activeFilter;
    const chosen = f === 'all' ? [] : this.cards.filter(c => c.project.cat === f);
    const near = this.nearLayout(f, chosen);
    const now = performance.now();
    let order = 0;
    this.cards.forEach(c => {
      const to = near.get(c) || c.homePos;
      c.focused = near.has(c);
      c.mesh.renderOrder = c.focused ? 2 : 0;
      if (animate && !reduceMotion) {
        c.anim = {
          from: c.basePos.clone(), to: to.clone(),
          start: now + (c.focused ? order++ * 70 : Math.random() * 160),
          dur: c.focused ? 1500 : 1200,
          arc: c.focused ? 1 : -0.8,
        };
        if (c.anim.from.distanceToSquared(c.anim.to) > 0.01) this.emitPixels(c, c.anim.from, c.anim.to, c.anim.start, c.anim.dur);
      } else {
        c.anim = null;
        c.basePos.copy(to);
      }
    });
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

        this.applyFilter(true);
        this.updateEmptyState();
        this.pulseHud();
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
    // Point sprites are sized in device pixels: world size × this ÷ depth.
    if (this.pxMat) {
      const tanH = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
      this.pxMat.uniforms.uScale.value = h * Math.min(window.devicePixelRatio, 2) / (2 * tanH);
    }
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

      // Calmer mouse-look while a tab's cards are up close, so they stay in view.
      this.lookScale = THREE.MathUtils.lerp(this.lookScale ?? 1, this.activeFilter === 'all' ? 1 : 0.45, 0.05);
      const lookX = this.currentLook.x * 0.9 * this.lookScale;
      const lookY = this.currentLook.y * 0.5 * this.lookScale;
      this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, lookX * 0.2, 0.06);
      this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, lookY * 0.15, 0.06);
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
        let spin = 0, dip = 0;
        if (c.anim) {
          const a = c.anim;
          const p = THREE.MathUtils.clamp((now - a.start) / a.dur, 0, 1);
          const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
          const swoop = Math.sin(Math.PI * e);
          c.basePos.lerpVectors(a.from, a.to, e);
          c.basePos.z += swoop * a.arc;
          spin = swoop * 0.4 * Math.sign(a.arc);
          // The card thins out mid-flight while its pixels carry it across.
          if (a.from.distanceToSquared(a.to) > 0.01) dip = swoop * 0.65;
          if (p >= 1) c.anim = null;
        }
        if (!reduceMotion) {
          c.mesh.position.y = c.basePos.y + Math.sin(t * c.floatSpeed + c.floatOffset) * c.floatAmp;
          c.mesh.position.x = c.basePos.x + Math.cos(t * c.floatSpeed * 0.8 + c.floatOffset) * (c.floatAmp * 0.5);
          c.mesh.position.z = c.basePos.z;
          c.mesh.rotation.y = c.homeRotY + spin + Math.sin(t * c.floatSpeed * 0.6 + c.floatOffset) * 0.12;
        } else {
          c.mesh.position.copy(c.basePos);
        }

        const matches = this.activeFilter === 'all' || c.project.cat === this.activeFilter;
        const isHovered = this.hovered === c;
        c.targetScale = isHovered ? 1.08 : (matches ? 1 : 0.6);
        c.targetOpacity = matches ? (isHovered ? 1 : 0.92) : 0.08;
        c.hitTest = matches;
        // Faded cards mustn't hide the grid behind them.
        c.mesh.material.depthWrite = matches;

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
        c.mesh.material.opacity = THREE.MathUtils.lerp(c.mesh.material.opacity, c.targetOpacity * (1 - dip), spawning || dip ? 0.3 : 0.12);
      });

      if (!isTouch) this.updateHover();

      this.updatePixels(now);
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
