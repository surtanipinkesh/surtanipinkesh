// ============================================================
// Papad Pixels — Portfolio grid (portfolio page + service pages)
// ============================================================
// The cards (titles and thumbnails) are static HTML written by the page
// build, so the grid never shifts while loading, images start downloading
// immediately and search engines read every title. This script only wires
// up playback and the portfolio tabs.
import { PROJECTS, openVideoModal, bindVideoModal } from './projects.js?v=11';

const byId = new Map(PROJECTS.map(p => [p.source.id, p]));

function hydrate(card) {
  const project = byId.get(card.dataset.id);
  if (!project) return;
  card.querySelector('.work-thumb').addEventListener('click', () => openVideoModal(project));
  // If a thumbnail ever fails, fall back to the card's placeholder art.
  const img = card.querySelector('.work-thumb img');
  img?.addEventListener('error', () => img.remove());
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

function setupTabs(grid, tabs) {
  const descs = [...document.querySelectorAll('.portfolio-desc[data-cat]')];
  const cards = [...grid.querySelectorAll('.work-card')];

  // Mostly-landscape selections get fewer, wider columns so 16:9 videos
  // aren't squeezed into portrait-width columns.
  const setLayout = cat => {
    const shown = PROJECTS.filter(p => cat === 'all' || p.cat === cat);
    const landscape = shown.filter(p => p.orientation === 'landscape').length;
    grid.classList.toggle('is-landscape', landscape > shown.length / 2);
  };

  const select = (cat, { fromClick = false } = {}) => {
    tabs.forEach(t => {
      const on = t.dataset.cat === cat;
      t.classList.toggle('active', on);
      t.setAttribute('aria-pressed', String(on));
    });
    descs.forEach(d => { d.hidden = d.dataset.cat !== cat; });
    cards.forEach(c => { c.hidden = cat !== 'all' && c.dataset.cat !== cat; });
    grid.append(...(cat === 'all' ? mixedOrder(cards) : cards));
    setLayout(cat);
    if (!fromClick) return;

    grid.classList.remove('is-switching');
    void grid.offsetWidth;
    grid.classList.add('is-switching');
    const slug = tabs.find(t => t.dataset.cat === cat)?.dataset.slug;
    history.replaceState(null, '', slug && cat !== 'all' ? `#${slug}` : location.pathname);
    // Once the tab bar is pinned, bring the top of the new selection into
    // view instead of leaving the visitor mid-way down the old grid.
    const desc = descs.find(d => d.dataset.cat === cat);
    if (desc && grid.getBoundingClientRect().top < 140) {
      desc.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  tabs.forEach(t => t.addEventListener('click', () => select(t.dataset.cat, { fromClick: true })));

  // Deep links like portfolio.html#ai-video-ads open on that tab.
  const selectFromHash = () => {
    const tab = tabs.find(t => `#${t.dataset.slug}` === location.hash);
    select(tab ? tab.dataset.cat : 'all');
  };
  window.addEventListener('hashchange', selectFromHash);
  selectFromHash();
}

function boot() {
  bindVideoModal();
  document.querySelectorAll('.work-card[data-id]').forEach(hydrate);

  const grid = document.getElementById('portfolioGrid');
  const tabs = [...document.querySelectorAll('.portfolio-tabs [data-cat]')];
  if (grid && tabs.length) setupTabs(grid, tabs);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
