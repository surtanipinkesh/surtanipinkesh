#!/usr/bin/env python3
"""Builds the AI News section of papadpixels.com.

Each story is a JSON file in tools/news/articles/. This script turns every
story into news/<slug>.html, rebuilds the news/index.html listing and adds
the pages to sitemap.xml. Header and footer are copied from learn.html so
the menu always matches the rest of the site.

    python3 tools/news/build.py            build everything
    python3 tools/news/build.py --cards    also (re)render the image cards

A story's image card is assets/news/<slug>.jpg, rendered from its "card"
field with tools/xcard/render.js.
"""
import datetime as dt
import html
import json
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
ARTICLES = ROOT / 'tools' / 'news' / 'articles'
SITE = 'https://papadpixels.com'
CSS_VERSION = re.search(r'css/style\.css\?v=(\d+)', (ROOT / 'index.html').read_text()).group(1)
JS_VERSION = re.search(r'js/script\.js\?v=(\d+)', (ROOT / 'index.html').read_text()).group(1)


def esc(s):
    return html.escape(s, quote=True)


def long_date(d):
    return f'{d.day} {d:%B %Y}'


def absolute(fragment):
    """learn.html uses paths relative to the site root; news pages live one folder down."""
    return re.sub(r'(src|srcset|href)="(assets|css|js)/', r'\1="/\2/', fragment)


def site_parts():
    learn = (ROOT / 'learn.html').read_text()
    header = learn[learn.index('<!-- ============ NAV ============ -->'):learn.index('</header>') + len('</header>')]
    footer = learn[learn.index('<!-- ============ FOOTER ============ -->'):learn.index('</footer>') + len('</footer>')]
    header = header.replace(' active" aria-current="page"', '"')
    header = header.replace('<a href="/news/" class="nav-link">', '<a href="/news/" class="nav-link active" aria-current="page">')
    return absolute(header), absolute(footer)


def head(title, description, url, image, extra_ld):
    return f'''<!doctype html>
<html lang="en">
<head>
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-JH0HNK2BWK"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){{dataLayer.push(arguments);}}
  gtag('js', new Date());

  gtag('config', 'G-JH0HNK2BWK');
</script>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{esc(title)}</title>
<meta name="description" content="{esc(description)}">
<link rel="canonical" href="{url}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="theme-color" content="#18160f">

<meta property="og:type" content="article">
<meta property="og:site_name" content="Papad Pixels">
<meta property="og:url" content="{url}">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(description)}">
<meta property="og:image" content="{image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="675">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@papadpixels">
<meta name="twitter:title" content="{esc(title)}">
<meta name="twitter:description" content="{esc(description)}">
<meta name="twitter:image" content="{image}">
{extra_ld}
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/assets/favicon-48.png" sizes="48x48" type="image/png">
<link rel="icon" href="/assets/favicon-96.png" sizes="96x96" type="image/png">
<link rel="icon" href="/assets/favicon-192.png?v=2" sizes="192x192" type="image/png">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png?v=2">

<link rel="preload" href="/assets/fonts/space-grotesk-var-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/orbitron-var-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/space-mono-400-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/css/style.css?v={CSS_VERSION}">
</head>
<body>

<div class="cursor-glow" id="cursorGlow" aria-hidden="true"></div>
<div class="progress-bar" id="progressBar" aria-hidden="true"></div>

'''


def ld(obj):
    return '<script type="application/ld+json">\n' + json.dumps(obj, indent=2, ensure_ascii=False) + '\n</script>'


def breadcrumbs(items):
    return {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': i + 1, 'name': n, 'item': u} for i, (n, u) in enumerate(items)]}


TAIL = '''
<script>
// YouTube videos load only when someone presses play, so news pages stay fast.
document.querySelectorAll('.yt-lite').forEach(btn => btn.addEventListener('click', () => {
  const f = document.createElement('iframe');
  f.src = 'https://www.youtube-nocookie.com/embed/' + btn.dataset.id + '?autoplay=1&rel=0';
  f.title = btn.dataset.title || 'YouTube video';
  f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
  f.allowFullscreen = true;
  btn.replaceWith(f);
}, { once: true }));
</script>
<script src="/js/script.js?v={js}"></script>
</body>
</html>
'''


def load():
    stories = []
    for f in sorted(ARTICLES.glob('*.json')):
        a = json.loads(f.read_text())
        a['_date'] = dt.date.fromisoformat(a['date'])
        a['url'] = f"{SITE}/news/{a['slug']}"
        a['image'] = f"/assets/news/{a['slug']}.jpg"
        stories.append(a)
    return sorted(stories, key=lambda a: (a['_date'], a['slug']), reverse=True)


def render_card(a):
    c = a['card']
    data = {'kicker': f"AI News · {a['_date']:%d %b %Y}", 'headline': c['headline'], 'source': c['source']}
    if c.get('points'):
        data['points'] = c['points']
    if c.get('sub'):
        data['sub'] = c['sub']
    out = ROOT / a['image'].lstrip('/')
    out.parent.mkdir(parents=True, exist_ok=True)
    npm_root = subprocess.run(['npm', 'root', '-g'], capture_output=True, text=True).stdout.strip()
    subprocess.run(['node', str(ROOT / 'tools/xcard/render.js'), str(out), json.dumps(data, ensure_ascii=False)],
                   check=True, env={**__import__('os').environ, 'NODE_PATH': npm_root})
    print('card', out.relative_to(ROOT))


def words(a):
    text = ' '.join([a['dek']] + a.get('tldr', []) + [p for s in a['sections'] for p in s.get('paragraphs', []) + s.get('list', [])])
    return len(re.sub(r'<[^>]+>', ' ', text).split())


def video_block(v):
    vid = v['youtube']
    return f'''
      <figure class="news-video reveal">
        <button type="button" class="yt-lite" data-id="{esc(vid)}" data-title="{esc(v['title'])}" aria-label="Play video: {esc(v['title'])}">
          <img src="https://i.ytimg.com/vi/{esc(vid)}/hqdefault.jpg" alt="" loading="lazy" width="480" height="360">
          <span class="yt-lite-play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor"/></svg></span>
        </button>
        <figcaption><strong>{esc(v['title'])}</strong> · {esc(v['caption'])}</figcaption>
      </figure>'''


def article_page(a, others, header, footer):
    d = a['_date']
    title = f"{a['title']} | AI News | Papad Pixels"
    image = SITE + a['image']
    article_ld = {
        '@context': 'https://schema.org', '@type': 'NewsArticle',
        'headline': a['title'], 'description': a['dek'], 'image': [image],
        'datePublished': f"{a['date']}T09:00:00+04:00", 'dateModified': f"{a['date']}T09:00:00+04:00",
        'author': {'@type': 'Organization', 'name': 'Papad Pixels', 'url': SITE + '/'},
        'publisher': {'@type': 'Organization', 'name': 'Papad Pixels',
                      'logo': {'@type': 'ImageObject', 'url': SITE + '/assets/logo-mark.png'}},
        'mainEntityOfPage': a['url'], 'keywords': ', '.join(a.get('tags', [])),
    }
    extra = ld(article_ld) + '\n' + ld(breadcrumbs([('Home', SITE + '/'), ('AI News', SITE + '/news/'), (a['title'], a['url'])]))
    body = []
    video_after = a.get('video_after', 1)
    for i, s in enumerate(a['sections']):
        label = f'<span class="news-label">{esc(s["label"])}</span>' if s.get('label') else ''
        part = f'\n      <section class="news-section reveal">\n        {label}<h2>{esc(s["heading"])}</h2>'
        for p in s.get('paragraphs', []):
            part += f'\n        <p>{p}</p>'
        if s.get('list'):
            part += '\n        <ul class="news-facts">' + ''.join(f'\n          <li>{li}</li>' for li in s['list']) + '\n        </ul>'
        body.append(part + '\n      </section>')
        if a.get('video') and i == video_after:
            body.append(video_block(a['video']))
    tldr = ''.join(f'\n          <li>{esc(t)}</li>' for t in a.get('tldr', []))
    sources = ''.join(f'\n          <li><a href="{esc(s["url"])}" target="_blank" rel="noopener">{esc(s["name"])}</a></li>' for s in a['sources'])
    tags = ''.join(f'<li>{esc(t)}</li>' for t in a.get('tags', []))
    more = ''.join(f'''
        <a class="news-card" href="/news/{o['slug']}">
          <img src="{o['image']}" alt="" loading="lazy" width="1200" height="675">
          <span class="news-card-date">{long_date(o['_date'])}</span>
          <span class="news-card-title">{esc(o['title'])}</span>
        </a>''' for o in others[:3])
    more_block = f'''
  <section class="section section-alt news-more">
    <div class="wrap">
      <p class="section-tag">MORE AI NEWS</p>
      <div class="news-grid">{more}
      </div>
    </div>
  </section>''' if others else ''
    minutes = max(2, round(words(a) / 200))
    return head(title, a['dek'], a['url'], image, extra) + header + f'''

<main>
  <article class="news-article">
    <header class="news-head wrap">
      <nav class="news-crumbs" aria-label="Breadcrumb"><a href="/news/">AI News</a><span aria-hidden="true">/</span><time datetime="{a['date']}">{long_date(d)}</time></nav>
      <h1 class="reveal">{a['headline_html']}</h1>
      <p class="news-dek reveal">{esc(a['dek'])}</p>
      <p class="news-byline">By Papad Pixels · {minutes} min read</p>
    </header>

    <figure class="news-hero wrap reveal">
      <img src="{a['image']}" alt="{esc(a['title'])}" width="1200" height="675" fetchpriority="high">
    </figure>

    <div class="news-body wrap">
      <aside class="news-tldr reveal">
        <h2>In 30 seconds</h2>
        <ul>{tldr}
        </ul>
      </aside>
{''.join(body)}

      <section class="news-sources">
        <h2>Sources</h2>
        <ol>{sources}
        </ol>
        <ul class="news-tags" aria-label="Topics">{tags}</ul>
      </section>

      <aside class="news-cta reveal">
        <p class="section-tag">PAPAD PIXELS</p>
        <h2>Need ads that look this good <span class="accent">everywhere?</span></h2>
        <p>We make AI video ads, AI TV commercials and AI UGC for brands worldwide, from brief to 4K delivery.</p>
        <div class="news-cta-actions">
          <a href="/#contact" class="btn btn-primary"><span>Start a Project</span></a>
          <a href="/portfolio" class="btn btn-outline"><span>See Our Work</span></a>
        </div>
      </aside>
    </div>
  </article>{more_block}
</main>

''' + footer + TAIL.replace('{js}', JS_VERSION)


def index_page(stories, header, footer):
    url = SITE + '/news/'
    title = 'AI News: Image and Video Generation, Explained for Brands | Papad Pixels'
    desc = 'The latest news on AI image and video generation and AI advertising, explained in plain words with what it means for brands. Updated by Papad Pixels.'
    image = SITE + (stories[0]['image'] if stories else '/assets/og-image.jpg')
    extra = ld({'@context': 'https://schema.org', '@type': 'CollectionPage', 'name': 'AI News', 'url': url, 'description': desc}) \
        + '\n' + ld(breadcrumbs([('Home', SITE + '/'), ('AI News', url)]))
    lead, rest = (stories[0], stories[1:]) if stories else (None, [])
    feature = f'''
      <a class="news-feature reveal" href="/news/{lead['slug']}">
        <img src="{lead['image']}" alt="" width="1200" height="675" fetchpriority="high">
        <span class="news-feature-text">
          <span class="news-card-date">{long_date(lead['_date'])} · Latest</span>
          <span class="news-feature-title">{esc(lead['title'])}</span>
          <span class="news-feature-dek">{esc(lead['dek'])}</span>
          <span class="news-read">Read the story &rarr;</span>
        </span>
      </a>''' if lead else '<p class="news-empty">The first stories are on their way.</p>'
    cards = ''.join(f'''
        <a class="news-card reveal" href="/news/{o['slug']}">
          <img src="{o['image']}" alt="" loading="lazy" width="1200" height="675">
          <span class="news-card-date">{long_date(o['_date'])}</span>
          <span class="news-card-title">{esc(o['title'])}</span>
          <span class="news-card-dek">{esc(o['dek'])}</span>
        </a>''' for o in rest)
    grid = f'\n      <div class="news-grid">{cards}\n      </div>' if rest else ''
    return head(title, desc, url, image, extra) + header.replace('class="nav-link">News', 'class="nav-link active" aria-current="page">News') + f'''

<main>
  <section class="service-hero news-index-hero">
    <div class="wrap">
      <p class="section-tag reveal">AI NEWS</p>
      <h1 class="reveal">AI image &amp; video news, <span class="accent">explained for brands</span></h1>
      <p class="service-lead reveal">The biggest updates in AI image generation, AI video and AI advertising, in plain words: what happened, the details that matter and what it means for your brand. All in one place.</p>
    </div>
  </section>

  <section class="section news-list">
    <div class="wrap">{feature}{grid}
    </div>
  </section>
</main>

''' + footer + TAIL.replace('{js}', JS_VERSION)


def update_sitemap(stories):
    p = ROOT / 'sitemap.xml'
    s = p.read_text()
    s = re.sub(r'\s*<url>\s*<loc>https://papadpixels\.com/news/[^<]*</loc>.*?</url>', '', s, flags=re.S)
    entries = [(f'{SITE}/news/', stories[0]['date'] if stories else dt.date.today().isoformat())]
    entries += [(a['url'], a['date']) for a in stories]
    block = ''.join(f'\n  <url>\n    <loc>{u}</loc>\n    <lastmod>{d}</lastmod>\n  </url>' for u, d in entries)
    s = s.replace('\n</urlset>', block + '\n</urlset>')
    p.write_text(s)


def main():
    stories = load()
    if '--cards' in sys.argv:
        for a in stories:
            render_card(a)
    for a in stories:
        if not (ROOT / a['image'].lstrip('/')).is_file():
            render_card(a)
    header, footer = site_parts()
    out = ROOT / 'news'
    out.mkdir(exist_ok=True)
    for a in stories:
        others = [o for o in stories if o is not a]
        (out / f"{a['slug']}.html").write_text(article_page(a, others, header, footer))
        print('page ', f"news/{a['slug']}.html")
    (out / 'index.html').write_text(index_page(stories, header, footer))
    print('page  news/index.html')
    update_sitemap(stories)
    print('sitemap updated')


if __name__ == '__main__':
    main()
