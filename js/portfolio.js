// ============================================================
// Papad Pixels — Portfolio grid page
// ============================================================
import { CATEGORIES, PROJECTS, fetchMeta, openVideoModal, bindVideoModal } from './projects.js?v=5';

const PLAY_ICON = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg>';

// oEmbed hands back a small (~295px) Vimeo thumbnail; the CDN serves any
// width if the size suffix is swapped.
function largeVimeoThumb(url) {
  return url.replace(/_\d+x\d+(?=$|\?)/, '_960');
}

function aspectFor(project) {
  if (project.aspect) return String(Math.min(2, Math.max(0.5, project.aspect)));
  return project.orientation === 'portrait' ? '9 / 16' : '16 / 9';
}

function buildCard(project) {
  const cfg = CATEGORIES[project.cat];

  const card = document.createElement('article');
  card.className = 'work-card';
  card.dataset.cat = project.cat;

  const thumb = document.createElement('button');
  thumb.type = 'button';
  thumb.className = 'work-thumb';
  thumb.style.setProperty('--ca', cfg.colorA);
  thumb.style.setProperty('--cb', cfg.colorB);
  thumb.innerHTML = `<span class="work-play" aria-hidden="true">${PLAY_ICON}</span>`;
  thumb.addEventListener('click', () => openVideoModal(project));

  const cat = document.createElement('p');
  cat.className = 'work-cat';
  cat.textContent = cfg.label.toUpperCase();

  const title = document.createElement('h3');
  title.className = 'work-title';

  card.append(thumb, cat, title);

  let img = null;
  const update = () => {
    title.textContent = project.title;
    thumb.setAttribute('aria-label', `Play video: ${project.title}`);
    thumb.style.aspectRatio = aspectFor(project);
    if (project.thumbUrl && !img) {
      img = document.createElement('img');
      img.alt = project.title;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.src = largeVimeoThumb(project.thumbUrl);
      img.addEventListener('error', () => {
        if (img.src !== project.thumbUrl) img.src = project.thumbUrl;
        else img.remove();
      });
      thumb.prepend(img);
    }
  };
  update();
  return { card, update };
}

// Round-robins the categories for "All Videos". The grid fills column by
// column, so category order would otherwise put every AI ad in column one.
function mixedOrder(cards) {
  const byCat = {};
  cards.forEach(c => (byCat[c.dataset.cat] || (byCat[c.dataset.cat] = [])).push(c));
  const queues = Object.values(byCat).map(list => list.slice());
  const out = [];
  while (queues.some(q => q.length)) queues.forEach(q => { if (q.length) out.push(q.shift()); });
  return out;
}

function boot() {
  bindVideoModal();

  const grid = document.getElementById('portfolioGrid');
  const tabs = [...document.querySelectorAll('.portfolio-tabs [data-cat]')];
  const descs = [...document.querySelectorAll('.portfolio-desc[data-cat]')];
  const cards = [];
  let active = 'all';

  // Mostly-landscape selections get fewer, wider columns so 16:9 videos
  // aren't squeezed into portrait-width columns.
  const setLayout = () => {
    const shown = PROJECTS.filter(p => active === 'all' || p.cat === active);
    const landscape = shown.filter(p => p.orientation === 'landscape').length;
    grid.classList.toggle('is-landscape', landscape > shown.length / 2);
  };

  const select = (cat, { scroll = false, updateUrl = true } = {}) => {
    active = cat;
    tabs.forEach(t => {
      const on = t.dataset.cat === cat;
      t.classList.toggle('active', on);
      t.setAttribute('aria-pressed', String(on));
    });
    descs.forEach(d => { d.hidden = d.dataset.cat !== cat; });
    cards.forEach(c => { c.hidden = cat !== 'all' && c.dataset.cat !== cat; });
    grid.append(...(cat === 'all' ? mixedOrder(cards) : cards));
    setLayout();

    grid.classList.remove('is-switching');
    void grid.offsetWidth;
    grid.classList.add('is-switching');

    if (updateUrl) {
      const slug = tabs.find(t => t.dataset.cat === cat)?.dataset.slug;
      history.replaceState(null, '', slug && cat !== 'all' ? `#${slug}` : location.pathname);
    }
    // Once the tab bar is pinned, bring the top of the new selection into
    // view instead of leaving the visitor mid-way down the old grid.
    const desc = descs.find(d => d.dataset.cat === cat);
    if (scroll && desc && grid.getBoundingClientRect().top < 140) {
      desc.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  tabs.forEach(t => t.addEventListener('click', () => select(t.dataset.cat, { scroll: true })));

  const metaLoads = PROJECTS.map(project => {
    const { card, update } = buildCard(project);
    cards.push(card);
    grid.appendChild(card);
    return fetchMeta(project).then(update);
  });
  Promise.all(metaLoads).then(setLayout);

  // Deep links like portfolio.html#ai-video-ads open on that tab.
  const selectFromHash = () => {
    const tab = tabs.find(t => `#${t.dataset.slug}` === location.hash);
    select(tab ? tab.dataset.cat : 'all', { updateUrl: false });
  };
  window.addEventListener('hashchange', selectFromHash);
  selectFromHash();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
