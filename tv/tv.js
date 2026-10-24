// ============================================================
// Papad Pixels TV — 10-foot portfolio for smart-TV browsers
// (built for the Hisense VIDAA browser, works in any TV browser
// or desktop with arrow keys + Enter + Esc/Backspace).
// ============================================================
import { PROJECTS, CATEGORIES, thumbSrc } from '../js/projects.js?v=17';

const stage = document.getElementById('stage');
const rowsEl = document.getElementById('rows');
const heroCopy = document.getElementById('heroCopy');
const heroVideo = document.getElementById('heroVideo');
const player = document.getElementById('player');
const playerTitle = document.getElementById('playerTitle');
const lobby = document.getElementById('lobby');
const lobbyVideo = lobby.querySelector('video');
const lobbyNews = document.getElementById('lobbyNews');

const IDLE_TO_LOBBY_MS = 3 * 60 * 1000;
const VISIBLE_RIGHT = 1920 - 96 - 140; // keep the focused card clear of the right edge

// Remote keys differ per TV platform: VIDAA sends Backspace (8) for BACK,
// webOS 461, Tizen 10009; media keys arrive as 415/19/179 or by name.
const KEY = {
  left:  ['ArrowLeft', 37],
  right: ['ArrowRight', 39],
  up:    ['ArrowUp', 38],
  down:  ['ArrowDown', 40],
  ok:    ['Enter', 13],
  back:  ['Escape', 'Backspace', 'GoBack', 'BrowserBack', 27, 8, 461, 10009],
  play:  ['MediaPlayPause', 'MediaPlay', 'MediaPause', 179, 415, 19],
};
const is = (e, name) => KEY[name].includes(e.key) || KEY[name].includes(e.keyCode);

// ---------- stage scaling ----------
function fitStage() {
  const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
  stage.style.transform = `scale(${s})`;
  stage.style.left = `${(window.innerWidth - 1920 * s) / 2}px`;
  stage.style.top = `${(window.innerHeight - 1080 * s) / 2}px`;
}
window.addEventListener('resize', fitStage);
fitStage();

// ---------- clock ----------
function tick() {
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  document.getElementById('clock').textContent = time;
  document.getElementById('lobbyClock').textContent = time;
  document.getElementById('lobbyDate').textContent =
    now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });
}
setInterval(tick, 1000 * 15);
tick();

// ---------- rows ----------
// Each row: { title, items: [{ el, action }] }, focus remembered per row.
const rows = [];
let rowIdx = 0;

function addRow(title, cls) {
  const row = { el: document.createElement('div'), track: document.createElement('div'), items: [], col: 0, shift: 0 };
  row.el.className = `row ${cls || ''}`;
  if (title) {
    const h = document.createElement('h2');
    h.textContent = title;
    row.el.appendChild(h);
  }
  row.track.className = 'track';
  row.el.appendChild(row.track);
  rowsEl.appendChild(row.el);
  rows.push(row);
  return row;
}

function addItem(row, el, action) {
  row.track.appendChild(el);
  row.items.push({ el, action });
}

function button(label) {
  const b = document.createElement('div');
  b.className = 'btn';
  b.textContent = label;
  return b;
}

function card(kind, imgUrl, label) {
  const c = document.createElement('div');
  c.className = `card ${kind}`;
  if (imgUrl) {
    const img = document.createElement('img');
    img.loading = 'lazy';
    img.alt = '';
    img.src = imgUrl;
    c.appendChild(img);
  }
  const l = document.createElement('div');
  l.className = 'label';
  l.textContent = label;
  c.appendChild(l);
  return c;
}

const actions = addRow('', 'actions');
actions.el.style.height = '200px';
addItem(actions, button('▶ Play showreel'), playShowreel);
addItem(actions, button('Lobby mode'), openLobby);

['ai', 'tvc', 'social'].forEach(cat => {
  const row = addRow(CATEGORIES[cat].label);
  PROJECTS.filter(p => p.cat === cat).forEach(p => {
    const kind = p.orientation === 'portrait' ? 'port' : 'land';
    addItem(row, card(kind, thumbSrc(p, 640), p.title), () => playProject(p));
  });
});

// AI news comes from the site's own RSS feed, so new posts show up on the TV automatically.
const newsHeadlines = [];
fetch('../ai-news/feed.xml')
  .then(r => r.text())
  .then(xml => {
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    const items = Array.from(doc.querySelectorAll('item')).slice(0, 12);
    if (!items.length) return;
    const row = addRow('AI News');
    items.forEach(item => {
      const title = item.querySelector('title').textContent;
      const link = new URL(item.querySelector('link').textContent).pathname;
      const enc = item.querySelector('enclosure');
      const img = enc ? new URL(enc.getAttribute('url')).pathname : null;
      newsHeadlines.push(title);
      addItem(row, card('news', img, title), () => { window.location.href = link; });
    });
  })
  .catch(() => {});

// ---------- focus ----------
function focus() {
  rows.forEach((r, i) => {
    r.el.classList.toggle('active', i === rowIdx);
    r.el.classList.toggle('above', i < rowIdx);
  });
  document.body.classList.toggle('browsing', rowIdx > 0);
  document.querySelectorAll('.focus').forEach(el => el.classList.remove('focus'));
  const row = rows[rowIdx];
  const item = row.items[row.col];
  if (!item) return;
  item.el.classList.add('focus');

  // horizontal: scroll the track just enough to keep the card in view
  const left = item.el.offsetLeft;
  const right = left + item.el.offsetWidth;
  if (left - row.shift < 0) row.shift = left;
  else if (right - row.shift > VISIBLE_RIGHT) row.shift = right - VISIBLE_RIGHT;
  if (row.col === 0) row.shift = 0;
  row.track.style.transform = `translateX(${-row.shift}px)`;

  // vertical: the button row sits under the hero copy; a focused content row slides up to
  // y=300 on the stage (#rows starts at 560) so the next row peeks in underneath it
  const y = rowIdx === 0 ? 0 : 300 - 560 - row.el.offsetTop;
  rowsEl.style.transform = `translateY(${y}px)`;
  heroCopy.style.opacity = rowIdx === 0 ? '1' : '0';
}

function move(dRow, dCol) {
  if (dRow) {
    const next = rowIdx + dRow;
    if (next < 0 || next >= rows.length) return;
    rowIdx = next;
  } else {
    const row = rows[rowIdx];
    row.col = Math.max(0, Math.min(row.items.length - 1, row.col + dCol));
  }
  focus();
}

// ---------- player ----------
let playerKind = null; // 'reel' | 'vimeo-video' | 'youtube-video'
let titleTimer = null;

function embed(source) {
  // Same minimal-branding embeds as the site, plus the JS APIs so OK/Play on the remote
  // can pause without the iframe ever taking keyboard focus away from this page.
  if (source.type === 'vimeo-video')
    return `https://player.vimeo.com/video/${source.id}?autoplay=1&title=0&byline=0&portrait=0&dnt=1&api=1`;
  return `https://www.youtube-nocookie.com/embed/${source.id}?autoplay=1&rel=0&modestbranding=1&controls=0&enablejsapi=1`;
}

function showTitle(title, sub) {
  playerTitle.innerHTML = '';
  playerTitle.textContent = title;
  const s = document.createElement('small');
  s.textContent = sub;
  playerTitle.appendChild(s);
  playerTitle.style.opacity = '1';
  clearTimeout(titleTimer);
  titleTimer = setTimeout(() => { playerTitle.style.opacity = '0'; }, 4000);
}

function openPlayer(media, kind) {
  player.querySelectorAll('iframe, video').forEach(el => el.remove());
  player.insertBefore(media, playerTitle);
  player.classList.add('open');
  playerKind = kind;
  heroVideo.pause();
}

function playProject(p) {
  const f = document.createElement('iframe');
  f.allow = 'autoplay; fullscreen; encrypted-media';
  f.tabIndex = -1;
  f.src = embed(p.source);
  openPlayer(f, p.source.type);
  showTitle(p.title, CATEGORIES[p.cat].label);
}

function playShowreel() {
  const v = document.createElement('video');
  v.src = '../assets/hero/reel-1080.mp4';
  v.autoplay = true;
  v.playsInline = true;
  v.onended = closePlayer;
  openPlayer(v, 'reel');
  showTitle('Papad Pixels Showreel', 'AI Films | Editing | Social Media');
}

let paused = false;
function togglePlay() {
  const media = player.querySelector('video, iframe');
  if (!media) return;
  paused = !paused;
  if (playerKind === 'reel') {
    if (paused) media.pause(); else media.play();
  } else if (playerKind === 'vimeo-video') {
    media.contentWindow.postMessage(JSON.stringify({ method: paused ? 'pause' : 'play' }), '*');
  } else {
    media.contentWindow.postMessage(JSON.stringify({ event: 'command', func: paused ? 'pauseVideo' : 'playVideo', args: [] }), '*');
  }
  playerTitle.style.opacity = paused ? '1' : '0';
}

function seek(sec) {
  const v = player.querySelector('video');
  if (playerKind === 'reel' && v) v.currentTime = Math.max(0, v.currentTime + sec);
}

function closePlayer() {
  player.querySelectorAll('iframe, video').forEach(el => { el.src = ''; el.remove(); });
  player.classList.remove('open');
  playerKind = null;
  paused = false;
  heroVideo.play().catch(() => {});
}

// ---------- lobby (ambient) mode ----------
let newsTimer = null;
let newsIdx = 0;

function rotateNews() {
  if (!newsHeadlines.length) { lobbyNews.textContent = 'AI video ads · TV commercials · UGC · papadpixels.com'; return; }
  lobbyNews.style.opacity = '0';
  setTimeout(() => {
    lobbyNews.innerHTML = '<span>AI NEWS</span>';
    lobbyNews.appendChild(document.createTextNode(newsHeadlines[newsIdx++ % newsHeadlines.length]));
    lobbyNews.style.opacity = '1';
  }, 800);
}

function openLobby() {
  lobby.classList.add('open');
  heroVideo.pause();
  lobbyVideo.play().catch(() => {});
  rotateNews();
  newsTimer = setInterval(rotateNews, 12000);
}

function closeLobby() {
  lobby.classList.remove('open');
  lobbyVideo.pause();
  clearInterval(newsTimer);
  heroVideo.play().catch(() => {});
}

let idleTimer = null;
function resetIdle() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => { if (!playerKind) openLobby(); }, IDLE_TO_LOBBY_MS);
}

// ---------- remote ----------
document.addEventListener('keydown', e => {
  resetIdle();

  if (lobby.classList.contains('open')) {
    e.preventDefault();
    closeLobby();
    return;
  }

  if (playerKind) {
    if (is(e, 'back')) closePlayer();
    else if (is(e, 'ok') || is(e, 'play')) togglePlay();
    else if (is(e, 'left')) seek(-10);
    else if (is(e, 'right')) seek(10);
    else return;
    e.preventDefault();
    return;
  }

  if (is(e, 'left')) move(0, -1);
  else if (is(e, 'right')) move(0, 1);
  else if (is(e, 'up')) move(-1, 0);
  else if (is(e, 'down')) move(1, 0);
  else if (is(e, 'ok')) { const it = rows[rowIdx].items[rows[rowIdx].col]; if (it) it.action(); }
  else if (is(e, 'back') && rowIdx > 0) { rowIdx = 0; focus(); }
  else return; // BACK on the home row falls through so the TV can leave the page
  e.preventDefault();
});

// Lets a mouse / VIDAA pointer remote work too.
rowsEl.addEventListener('click', e => {
  rows.forEach((row, r) => row.items.forEach((it, c) => {
    if (it.el.contains(e.target)) { rowIdx = r; row.col = c; focus(); it.action(); }
  }));
});
document.body.addEventListener('mousemove', () => { document.body.style.cursor = 'default'; });
player.addEventListener('click', e => { if (e.target === player) closePlayer(); });
lobby.addEventListener('click', closeLobby);

focus();
resetIdle();
heroVideo.play().catch(() => {});
