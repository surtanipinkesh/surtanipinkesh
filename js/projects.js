// ============================================================
// Papad Pixels — shared portfolio data (3D universe + portfolio page)
// ============================================================

export const CATEGORIES = {
  ai:     { label: 'AI Video Ads',        colorA: '#24334c', colorB: '#e0af3b' },
  tvc:    { label: 'AI UGC Videos',       colorA: '#18160f', colorB: '#d3a46e' },
  social: { label: 'Social Media Videos', colorA: '#24334c', colorB: '#d3a46e' },
};

// Turns a { type, id } source into a playable embed URL for the modal —
// full controls, but branding kept to a minimum (no title/byline/avatar).
export function embedUrl(source) {
  switch (source.type) {
    case 'vimeo-video':   return `https://player.vimeo.com/video/${source.id}?autoplay=1&title=0&byline=0&portrait=0`;
    case 'youtube-video': return `https://www.youtube-nocookie.com/embed/${source.id}?autoplay=1&rel=0&modestbranding=1`;
    default: return '';
  }
}

// Muted, looping, chromeless embed used for the live "floating" previews —
// Vimeo's background=1 and YouTube's controls=0 both strip UI entirely.
export function previewEmbedUrl(source) {
  switch (source.type) {
    case 'vimeo-video':   return `https://player.vimeo.com/video/${source.id}?background=1&autoplay=1&muted=1&loop=1&byline=0&title=0&portrait=0`;
    case 'youtube-video': return `https://www.youtube-nocookie.com/embed/${source.id}?autoplay=1&mute=1&loop=1&playlist=${source.id}&controls=0&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1`;
    default: return '';
  }
}

// Individual clips only — each card is one video, grouped by service type.
// orientation/title/thumbUrl are filled in at runtime from each provider's
// oEmbed endpoint (fetchMeta), so cards always match the real video.
export const PROJECTS = [
  // Social Media Videos
  { cat: 'social', source: { type: 'vimeo-video', id: '1229164404' } },
  { cat: 'social', source: { type: 'vimeo-video', id: '1229164262' } },
  { cat: 'social', source: { type: 'vimeo-video', id: '1229164263' } },
  { cat: 'social', source: { type: 'vimeo-video', id: '1229164260' } },
  { cat: 'social', source: { type: 'vimeo-video', id: '1229164261' } },
  { cat: 'social', source: { type: 'vimeo-video', id: '1229163931' } },
  { cat: 'social', source: { type: 'vimeo-video', id: '1229163463' } },
  { cat: 'social', source: { type: 'vimeo-video', id: '1229162045' } },
  { cat: 'social', source: { type: 'vimeo-video', id: '1229161749' } },
  { cat: 'social', source: { type: 'vimeo-video', id: '1229158632' } },
  { cat: 'social', source: { type: 'vimeo-video', id: '1229158480' } },
  { cat: 'social', source: { type: 'vimeo-video', id: '1229158258' } },
  { cat: 'social', source: { type: 'vimeo-video', id: '1229158154' } },
  { cat: 'social', source: { type: 'vimeo-video', id: '1229158027' } },
  // AI UGC Videos
  { cat: 'tvc', source: { type: 'vimeo-video', id: '1229171047' } },
  { cat: 'tvc', source: { type: 'vimeo-video', id: '1229171046' } },
  { cat: 'tvc', source: { type: 'vimeo-video', id: '1229170904' } },
  { cat: 'tvc', source: { type: 'vimeo-video', id: '1229170600' } },
  { cat: 'tvc', source: { type: 'vimeo-video', id: '1229170527' } },
  // AI Video Ads
  { cat: 'ai', source: { type: 'youtube-video', id: 'a99QuBXwC1A' } },
  { cat: 'ai', source: { type: 'youtube-video', id: 'e9_L8YMh7zM' } },
  { cat: 'ai', source: { type: 'youtube-video', id: 'TMI4O6Ue3j4' } },
  { cat: 'ai', source: { type: 'youtube-video', id: 'ngqz3CR3zEg' } },
  { cat: 'ai', source: { type: 'youtube-video', id: 'KJANFtOF58w' } },
  { cat: 'ai', source: { type: 'youtube-video', id: 'rMncClDYaiI' } },
  { cat: 'ai', source: { type: 'youtube-video', id: 'rNk6ySViTX4' } },
  { cat: 'ai', source: { type: 'youtube-video', id: 'fdwz_iO9it8' } },
  { cat: 'ai', source: { type: 'youtube-video', id: 'eBBz6YTp-Tc' } },
  { cat: 'ai', source: { type: 'youtube-video', id: 'hNrWM6FdErA' } },
  { cat: 'ai', source: { type: 'youtube-video', id: 'mdaa5Q93FQ0' } },
];

// Category defaults used until (or unless) oEmbed metadata resolves.
const DEFAULT_ORIENTATION = { ai: 'landscape', tvc: 'portrait', social: 'portrait' };
PROJECTS.forEach(p => {
  p.orientation = DEFAULT_ORIENTATION[p.cat];
  p.title = CATEGORIES[p.cat].label;
});

// Fetches the real title + thumbnail + aspect ratio for a project from the
// hosting service's public oEmbed endpoint — runs client-side so nothing
// about the source channel needs to be known or hardcoded ahead of time.
export async function fetchMeta(project) {
  try {
    const { type, id } = project.source;
    const url = type === 'vimeo-video'
      ? `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(`https://vimeo.com/${id}`)}`
      : type === 'youtube-video'
        ? `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}`
        : null;
    if (!url) return;
    const res = await fetch(url);
    if (!res.ok) throw new Error('oembed request failed');
    const data = await res.json();
    if (data.title) project.title = data.title;
    // Only use the real thumbnail for Vimeo. YouTube thumbnails often have
    // the uploader's own branding/handle baked into the image itself, which
    // no embed parameter can strip — so YouTube cards keep the placeholder
    // art (real title + correct aspect ratio, no screenshot).
    if (type === 'vimeo-video') project.thumbUrl = data.thumbnail_url || null;
    // Player width/height reflect the video's real shape; YouTube's
    // thumbnail is always a 4:3 480x360 frame regardless of the video.
    const w = data.width || data.thumbnail_width;
    const h = data.height || data.thumbnail_height;
    if (w && h) {
      project.orientation = h > w ? 'portrait' : 'landscape';
      project.aspect = w / h;
    }
  } catch (err) {
    // Keep the category default title/orientation and no thumbnail —
    // the card still renders fine with the placeholder art.
  }
}

export function loadImage(url) {
  return new Promise((resolve) => {
    if (!url) { resolve(null); return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

// Video modal shared by the 3D universe and the portfolio grid. Expects the
// #cardModal markup on the page.
export function openVideoModal(project) {
  document.getElementById('modalCat').textContent = CATEGORIES[project.cat].label;
  document.getElementById('modalTitle').textContent = project.title;
  document.getElementById('modalVideoFrame').src = embedUrl(project.source);
  document.querySelector('.modal-video')?.classList.toggle('is-portrait', project.orientation === 'portrait');
  const modal = document.getElementById('cardModal');
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}

export function closeVideoModal() {
  const modal = document.getElementById('cardModal');
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  // Stop playback/audio the instant the modal closes.
  document.getElementById('modalVideoFrame').src = '';
}

export function bindVideoModal() {
  document.getElementById('cardModalClose').addEventListener('click', closeVideoModal);
  document.getElementById('cardModalBackdrop').addEventListener('click', closeVideoModal);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeVideoModal();
  });
}
