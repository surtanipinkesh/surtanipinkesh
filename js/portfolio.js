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

function boot() {
  bindVideoModal();

  document.querySelectorAll('.portfolio-grid[data-cat]').forEach(grid => {
    const projects = PROJECTS.filter(p => p.cat === grid.dataset.cat);
    const setLayout = () => {
      const landscape = projects.filter(p => p.orientation === 'landscape').length;
      grid.classList.toggle('is-landscape', landscape > projects.length / 2);
    };
    setLayout();

    const metaLoads = projects.map(project => {
      const { card, update } = buildCard(project);
      grid.appendChild(card);
      return fetchMeta(project).then(update);
    });
    Promise.all(metaLoads).then(setLayout);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
