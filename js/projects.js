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
// title and w/h (the video's real shape) live here so the page text never
// depends on Vimeo/YouTube; fetchMeta only adds the Vimeo thumbnail.
export const PROJECTS = [
  // Social Media Videos
  { cat: 'social', title: 'Fashion Runway ft. Altona', w: 240, h: 426, source: { type: 'vimeo-video', id: '1229164404' } },
  { cat: 'social', title: 'Fashion Runway 02', w: 202, h: 426, source: { type: 'vimeo-video', id: '1229164262' } },
  { cat: 'social', title: 'Fashion Runway 01', w: 240, h: 426, source: { type: 'vimeo-video', id: '1229164263' } },
  { cat: 'social', title: 'Fashion Runway 05', w: 202, h: 426, source: { type: 'vimeo-video', id: '1229164260' } },
  { cat: 'social', title: 'Fashion Runway 04', w: 240, h: 426, source: { type: 'vimeo-video', id: '1229164261' } },
  { cat: 'social', title: 'Social Media Video 01', w: 240, h: 426, source: { type: 'vimeo-video', id: '1229163931' } },
  { cat: 'social', title: 'Thank You for Booking: Dublin', w: 240, h: 426, source: { type: 'vimeo-video', id: '1229163463' } },
  { cat: 'social', title: 'Social Media Video 02', w: 426, h: 240, source: { type: 'vimeo-video', id: '1229162045' } },
  { cat: 'social', title: 'Social Media Video 03', w: 426, h: 240, source: { type: 'vimeo-video', id: '1229161749' } },
  { cat: 'social', title: 'Social Media Video 04', w: 240, h: 426, source: { type: 'vimeo-video', id: '1229158632' } },
  { cat: 'social', title: 'Social Media Video 05', w: 240, h: 426, source: { type: 'vimeo-video', id: '1229158480' } },
  { cat: 'social', title: 'Stop Worshipping Spreadsheets: Estimate Fast, Win the Margin', w: 240, h: 426, source: { type: 'vimeo-video', id: '1229158258' } },
  { cat: 'social', title: 'The Excel Nightmare That Nearly Broke My Team', w: 240, h: 426, source: { type: 'vimeo-video', id: '1229158154' } },
  { cat: 'social', title: 'Social Media Video 06', w: 240, h: 426, source: { type: 'vimeo-video', id: '1229158027' } },
  // AI UGC Videos
  { cat: 'tvc', title: 'Some Things You Just Don’t Walk Away From', w: 240, h: 426, source: { type: 'vimeo-video', id: '1229171047' } },
  { cat: 'tvc', title: 'How to Apply Perfume', w: 426, h: 240, source: { type: 'vimeo-video', id: '1229171046' } },
  { cat: 'tvc', title: 'Dragon Ride', w: 240, h: 426, source: { type: 'vimeo-video', id: '1229170904' } },
  { cat: 'tvc', title: 'Mystique Perfumes UGC Ad', w: 240, h: 426, source: { type: 'vimeo-video', id: '1229170600' } },
  { cat: 'tvc', title: 'Drive-Thru UGC Ad', w: 240, h: 426, source: { type: 'vimeo-video', id: '1229170527' } },
  // AI Video Ads
  { cat: 'ai', title: 'GNOCCA: The Unveiling | AI Luxury Fragrance Film', w: 16, h: 9, source: { type: 'youtube-video', id: 'a99QuBXwC1A' } },
  { cat: 'ai', title: '100% AI-Generated Ice Cream Ad', w: 16, h: 9, source: { type: 'youtube-video', id: 'e9_L8YMh7zM' } },
  { cat: 'ai', title: 'Saucesome Noodles: Every Bite Glows | AI Commercial', w: 16, h: 9, source: { type: 'youtube-video', id: 'TMI4O6Ue3j4' } },
  { cat: 'ai', title: 'Moovelous | AI Cheese Commercial', w: 16, h: 9, source: { type: 'youtube-video', id: 'ngqz3CR3zEg' } },
  { cat: 'ai', title: 'Mystique | AI Perfume Ad', w: 16, h: 9, source: { type: 'youtube-video', id: 'KJANFtOF58w' } },
  { cat: 'ai', title: 'Cinematic AI Beauty Lipstick Commercial', w: 16, h: 9, source: { type: 'youtube-video', id: 'rMncClDYaiI' } },
  { cat: 'ai', title: 'Dejavu Jeans | AI Fashion Ad', w: 16, h: 9, source: { type: 'youtube-video', id: 'rNk6ySViTX4' } },
  { cat: 'ai', title: 'Dejavu Watches: The Emblem of Power', w: 16, h: 9, source: { type: 'youtube-video', id: 'fdwz_iO9it8' } },
  { cat: 'ai', title: 'Déjà Vu Perfumes: Golden Hour Whispers', w: 16, h: 9, source: { type: 'youtube-video', id: 'eBBz6YTp-Tc' } },
  { cat: 'ai', title: 'Desert Rose: A Fragrance Born from the Sand', w: 16, h: 9, source: { type: 'youtube-video', id: 'hNrWM6FdErA' } },
  { cat: 'ai', title: 'Déjà Vu Perfumes: A Fragrance That Tells a Story Untold', w: 4, h: 3, source: { type: 'youtube-video', id: 'mdaa5Q93FQ0' } },
];

PROJECTS.forEach(p => {
  p.aspect = p.w / p.h;
  p.orientation = p.h > p.w ? 'portrait' : 'landscape';
});

// Looks up the Vimeo thumbnail via the public oEmbed endpoint. YouTube
// thumbnails aren't used: they can carry the uploader's branding baked into
// the image, which no embed parameter can strip.
export async function fetchMeta(project) {
  if (project.source.type !== 'vimeo-video') return;
  try {
    const url = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(`https://vimeo.com/${project.source.id}`)}`;
    const res = await fetch(url);
    if (!res.ok) return;
    const data = await res.json();
    project.thumbUrl = data.thumbnail_url || null;
  } catch (err) {
    // No thumbnail: the card keeps its placeholder art.
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
