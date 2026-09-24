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
    case 'vimeo-video':   return `https://player.vimeo.com/video/${source.id}?autoplay=1&title=0&byline=0&portrait=0&dnt=1`;
    case 'youtube-video': return `https://www.youtube-nocookie.com/embed/${source.id}?autoplay=1&rel=0&modestbranding=1`;
    default: return '';
  }
}

// Individual clips only — each card is one video, grouped by service type.
// title, w/h (the video's real shape) and the Vimeo thumbnail hash live here
// so pages never depend on a Vimeo/YouTube lookup at load time.
export const PROJECTS = [
  // Social Media Videos
  { cat: 'social', title: 'Fashion Runway ft. Altona', w: 240, h: 426, thumb: '2203755776-1c3fb7d5301253e9edc1586a44dddee4dab15089789409c75090912d3a458e86-d', source: { type: 'vimeo-video', id: '1229164404' } },
  { cat: 'social', title: 'Fashion Runway 02', w: 202, h: 426, thumb: '2203755760-a2ad6d60dd70c102cc700d3e2b9462194d23780537480f16b9212cb9e4238c4d-d', source: { type: 'vimeo-video', id: '1229164262' } },
  { cat: 'social', title: 'Fashion Runway 01', w: 240, h: 426, thumb: '2203755713-75d69e97d3124f0737d97b77ac58006c68fae1ed20ecd42a003a11e57eef5278-d', source: { type: 'vimeo-video', id: '1229164263' } },
  { cat: 'social', title: 'Fashion Runway 05', w: 202, h: 426, thumb: '2203755695-5ba935414903d87db1a0b57f2053865d7154f955327faf6cbe8e1284510eced1-d', source: { type: 'vimeo-video', id: '1229164260' } },
  { cat: 'social', title: 'Fashion Runway 04', w: 240, h: 426, thumb: '2203755539-0ebc60445eaa0a0ddfa2e77af8bc025d35e97fa869574868ccd8f1374c656e11-d', source: { type: 'vimeo-video', id: '1229164261' } },
  { cat: 'social', title: 'Social Media Video 01', w: 240, h: 426, thumb: '2203755044-695adaafc1ef7951dade7e2644a8246ec901e94146d5dd4f5fed5ec018d2a4cc-d', source: { type: 'vimeo-video', id: '1229163931' } },
  { cat: 'social', title: 'Thank You for Booking: Dublin', w: 240, h: 426, thumb: '2203754280-215bf896ac2528616eae71d002658b0d3c388dba72ca7f04917f1c1ca6300e90-d', source: { type: 'vimeo-video', id: '1229163463' } },
  { cat: 'social', title: 'Social Media Video 02', w: 426, h: 240, thumb: '2203752408-ebca3bdb99a693602df47d48b2fcaef3b547bd9a03deed6a92034d781ed3370d-d', source: { type: 'vimeo-video', id: '1229162045' } },
  { cat: 'social', title: 'Social Media Video 03', w: 426, h: 240, thumb: '2203751957-3a06b0769220a2ed858b71df6b067150fc0165134f996395effea42c5d0e04b3-d', source: { type: 'vimeo-video', id: '1229161749' } },
  { cat: 'social', title: 'Social Media Video 04', w: 240, h: 426, thumb: '2203748014-162abccbc052fb09e15144b048ca56874a02d01e8f27d61d0ef1430104035161-d', source: { type: 'vimeo-video', id: '1229158632' } },
  { cat: 'social', title: 'Social Media Video 05', w: 240, h: 426, thumb: '2203747808-7964653d7885f1836dedf6ad5e8285f7a0a9c2f53625c7c1f4cfbf4a14704e34-d', source: { type: 'vimeo-video', id: '1229158480' } },
  { cat: 'social', title: 'Stop Worshipping Spreadsheets: Estimate Fast, Win the Margin', w: 240, h: 426, thumb: '2203747572-40c207883ebda1104345f64cf4fce7c45db7a98f120ab610e3fdaa1426356762-d', source: { type: 'vimeo-video', id: '1229158258' } },
  { cat: 'social', title: 'The Excel Nightmare That Nearly Broke My Team', w: 240, h: 426, thumb: '2203747367-7a713aa1664f842a29d901525b63d848b52865dbee36c46e5f623a9a935e0a18-d', source: { type: 'vimeo-video', id: '1229158154' } },
  { cat: 'social', title: 'Social Media Video 06', w: 240, h: 426, thumb: '2203747251-54d8830d5a6bde170939e37b5ea863a4a6f28c70da43f29c058b170ea9e47fc9-d', source: { type: 'vimeo-video', id: '1229158027' } },
  // AI UGC Videos
  { cat: 'tvc', title: 'Some Things You Just Don’t Walk Away From', w: 240, h: 426, thumb: '2203764121-23cb135e33268a262d87aacd84a16a479c8a805f368b32dd5230648ee02deb2e-d', source: { type: 'vimeo-video', id: '1229171047' } },
  { cat: 'tvc', title: 'How to Apply Perfume', w: 426, h: 240, thumb: '2203764123-d96a0dacc52fa8e1db301747bb58a196a83566329d1b6c01f5c38ee289aa0e80-d', source: { type: 'vimeo-video', id: '1229171046' } },
  { cat: 'tvc', title: 'Dragon Ride', w: 240, h: 426, thumb: '2203763975-b3a24efe76d86bdc68674d66c85746d4f9d32b74dc5646ce47d5c9043b9a0446-d', source: { type: 'vimeo-video', id: '1229170904' } },
  { cat: 'tvc', title: 'Mystique Perfumes UGC Ad', w: 240, h: 426, thumb: '2203763529-c9a1e0b5fef87a83396fa67a917d7a352b1a7aada00e8fba54a7f17875d04da4-d', source: { type: 'vimeo-video', id: '1229170600' } },
  { cat: 'tvc', title: 'Drive-Thru UGC Ad', w: 240, h: 426, thumb: '2203763485-23fba5fd9623de8a8da4a8d24a7039a62cbf330157775cbd525a8f7bc0118c22-d', source: { type: 'vimeo-video', id: '1229170527' } },
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
// Vimeo thumbnail at a given pixel width (the CDN serves any width). Hashes
// are stored in PROJECTS so pages never wait on a Vimeo API round trip.
// YouTube thumbnails aren't used: they can carry the uploader's branding
// baked into the image, which no embed parameter can strip.
export function thumbSrc(project, width) {
  return project.thumb ? `https://i.vimeocdn.com/video/${project.thumb}_${width}?region=us` : null;
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
  modal.inert = false;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}

export function closeVideoModal() {
  const modal = document.getElementById('cardModal');
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  modal.inert = true;
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
