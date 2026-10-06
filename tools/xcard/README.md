# Daily AI news: website story + X post

Every morning a Claude routine picks the day's most important AI image /
video / AI-advertising news and publishes it twice:

- a **full story page** on papadpixels.com/ai-news (built by
  `tools/news/build.py` from a story file), and
- a **short X post** for x.com/papadpixels with the same image card,
  posted by the robot in github.com/surtanipinkesh/papad-social.

`tools/` itself is never published (the deploy workflow leaves it out).
AI ads go to X straight from the robot's own post files.

## 1. Pick the story

- Work out today's date in Asia/Dubai (YYYY-MM-DD).
- Web-search the last 24–48 hours: model launches and updates (Veo,
  Kling, Seedance, Wan, Runway, Luma, Midjourney, GPT Image, Flux,
  MiniMax, Pika, LTX…), big feature or pricing changes, or AI advertising
  news that matters to brands.
- Use only stories that at least two independent outlets (or the
  company's own announcement) report. Never invent or guess details. If
  nothing new and confirmed happened, publish nothing that day.
- Skip anything already covered: check `tools/news/articles/`.

## 2. Research it properly

The website story must let a reader understand everything in one place.
Search more than once: the announcement itself, the key numbers (who can
use it, where, when, price, limits, partners), what came before it (the
background), and how people are reacting. Keep a list of the pages you
used for the Sources list.

**Video:** search YouTube (`allowed_domains: ["youtube.com"]`) for the
company's official launch/demo video, or failing that a well-known
creator testing it. Only use a video whose title and channel clearly
match the story; leave `video` out rather than guess.

## 3. Write the story file

The News section exists to bring search traffic, so every story is
written for the reader first and for Google second.

Add `tools/news/articles/YYYY-MM-DD-<slug>.json` (copy the shape of an
existing one):

- `slug`: the words people would search, lowercase with hyphens, no date
  (e.g. `kling-3-release-features`, `veo-4-pricing`).
- `title` (the page headline, plain), `headline_html` (same with 1–3
  words in `<span class="accent">…</span>`), `dek` (2–3 sentence summary).
- `seo_title`: what people would type into Google, with the main keyword
  first (product + what happened), max 55 characters.
- `description`: the Google snippet, 140–155 characters, with the main
  keyword and a reason to click.
- `card`: `headline` (≤60 characters, gold words in `*stars*`),
  `points` (2–3 key facts, ≤75 characters each), `source`.
- `tldr`: 3–5 one-line facts.
- `sections`: "What happened", "The key details" (a `list` of
  `<strong>Label:</strong> fact` items), "The background", and "What it
  means for brands" with `"label": "Papad Pixels view"` (clearly our
  opinion, practical, about creative and advertising). Include one
  natural link to the most relevant service page (`/ai-video-ads`,
  `/ai-ugc-videos` or `/ai-social-media-videos`) or an earlier story
  (`/ai-news/<slug>`).
- `faq`: 3–4 questions people really search about this news ("When…",
  "Who can use…", "How much…", "How does it compare…"), each answered in
  1–2 factual sentences. They show as "Questions people ask" and as FAQ
  data for Google.
- `video` (optional): `youtube` id, `title`, one-line `caption` saying
  whose video it is. `video_after` = index of the section it follows.
- `sources`: every page used, with a descriptive name. `tags`: 3–5.

Write everything in your own words: no copied sentences from articles.
Never mention any person's name from the Papad Pixels team.

## 4. Build and publish the website story

```
python3 tools/news/build.py      # renders assets/ai-news/<slug>.jpg, builds ai-news/ + feed, homepage strip, sitemap
```

Serve the site locally and look at the new page (desktop and 390px
phone) before publishing. Then commit on the working branch, open a pull
request and squash-merge it; the site deploys on merge.

## 5. Hand the X post to the robot

- Copy `assets/ai-news/<slug>.jpg` to `/home/user/papad-social/media/x-news/YYYY-MM-DD.jpg`.
- Add `posts/YYYY-MM-DD-1230-x-ai-news.yml` in papad-social:

  ```yaml
  publish_at: YYYY-MM-DD 12:30   # India time = 11:00 Dubai
  image: media/x-news/YYYY-MM-DD.jpg
  x:
    text: "…"
  ```

- The X text explains the news on its own: what happened, the key
  details, why it matters for brands, then 2–3 hashtags. **No links and
  no "via" / "read more"** (posts with links cost more on X; the robot
  rejects them). Max 280 characters as X counts them (every emoji counts
  as 2).
- Run `python poster.py list`, then commit and push to papad-social main.

## 6. Tell the owner

One or two plain lines: today's story, the link to the new page
(papadpixels.com/ai-news/<slug>), and
that the X post goes out at 11:00 Dubai. Send the card with SendUserFile.
