# 🎷 Music Bot: Suno → YouTube + Spotify

A semi-automatic pipeline for a jazz, coffee, focus and sleep music channel.

```
suno_prompts.py ──► Suno (manual: generate + download) ──► inbox/<mood>/
                                                              │
                          build_mix.py (crossfade, loudness, video, thumbnail, tracklist)
                                                              │
               ┌──────────────────────────────┬───────────────┴──────────────┐
      youtube_upload.py               livestream.sh (24/7)            spotify_prep.py
      (auto upload + schedule)        (nonstop YouTube Live)          (DistroKid-ready release)
```

**Why is the Suno step manual?** Suno has no official public API. The "Suno API"
wrappers on GitHub use your login cookies, which is against Suno's terms and can
get your account banned, and with it the commercial rights to your songs. One
Suno session of about 30 minutes produces enough tracks for several videos. The
rest of the pipeline runs automatically.

## ⚠️ Before you start: rights and money

1. **Use a paid Suno plan (Pro or Premier).** Only songs made *while subscribed*
   come with commercial-use rights. Songs made on the free plan stay non-commercial
   even if you upgrade later. Check Suno's current terms, because plans changed in 2026.
2. **YouTube "inauthentic content" policy:** mass-produced, near-identical videos
   can be refused for monetization. Build a recognisable brand: consistent visuals,
   curated themes, varied mixes, and a real description. Quality beats quantity.
3. **Tick the AI disclosure.** The upload script sets `containsSyntheticMedia`
   automatically. On your distributor, mark the tracks as AI-generated.
4. **Never enable Content ID** for AI tracks. It causes false claims against other
   channels and can get you banned from your distributor.
5. **Spotify pays nothing until a track has 1,000 streams in 12 months.** Release
   fewer, better EPs instead of hundreds of singles.

## Setup (once)

```bash
# 1. Install ffmpeg (Windows: winget install ffmpeg | Mac: brew install ffmpeg | Linux: apt install ffmpeg)
# 2. Install Python deps
cd music-bot
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Edit `config.yaml`: set `channel_name` and adjust the titles, tags and Suno styles for each mood.

Put 3–10 background **images (16:9)** or short **looping .mp4 clips** into
`backgrounds/jazz/`, `backgrounds/coffee/`, and so on. These make your channel's
look, so keep them consistent. Examples: a rainy café window, a desk lamp at night,
a moonlit bedroom.

### YouTube API setup
1. Go to <https://console.cloud.google.com/>, create a project, open **APIs & Services → Library**, and enable **YouTube Data API v3**.
2. Open **OAuth consent screen** → External → add your Gmail as a *test user*.
3. Open **Credentials → Create credentials → OAuth client ID → Desktop app**. Download the JSON and save it as `music-bot/client_secret.json`.
4. The first `youtube_upload.py` run opens a Google login. Pick your channel. A `token.json` is saved and later runs need no login.
5. **Important:** uploads from an unverified API project are forced to *private*.
   Request the **YouTube API audit** (Google Cloud → YouTube API Services audit form)
   early. Until it's approved, upload as private and switch to public in YouTube Studio.
6. Default quota is about 6 uploads per day, which is plenty.

## Weekly workflow

```bash
# 1. Get 20 varied prompts for Suno
python suno_prompts.py jazz --count 20
```
In Suno, choose **Create → Custom**, turn **Instrumental** on, paste the STYLE and
TITLE, and generate. Keep only the good takes and download them as MP3 or WAV into
`inbox/jazz/`, named after the title (e.g. `Golden Echoes.mp3`). The filename becomes
the tracklist name.

```bash
# 2. Build a 1-hour video (use --minutes 180 for long sleep mixes)
python build_mix.py jazz

# 3. Upload and schedule it
python youtube_upload.py output/jazz_2026-09-29_1 --publish-at 2026-10-01T14:00:00Z

# 4. Every few weeks, package an 8-track EP for Spotify / Apple Music
python spotify_prep.py jazz --tracks 8
```
Then upload the `output/release_jazz_*` folder in DistroKid, TuneCore or another distributor.

## 24/7 nonstop live stream

Rent a small Linux VPS (2 vCPU is enough, about $6–12/month, e.g. Hetzner, DigitalOcean
or Contabo). Copy `music-bot/` with its `output/` mixes and `backgrounds/` to it, then:

```bash
sudo apt install ffmpeg tmux
tmux new -s live
export YT_STREAM_KEY=xxxx-xxxx-xxxx-xxxx   # YouTube Studio → Create → Go live → Stream key
./livestream.sh jazz
# detach with Ctrl+B then D. The stream keeps running and auto-restarts if ffmpeg drops.
```
New mixes you add to `output/` are picked up automatically each playlist cycle.

## Suggested schedule for a new channel

| Day | Task | Time |
|---|---|---|
| Mon | Suno session: 20–30 tracks across 2 moods | 45 min |
| Tue | `build_mix.py` ×2, schedule uploads for Wed and Sat | 10 min |
| Always | 24/7 livestream of your best mood | 0 min |
| Monthly | `spotify_prep.py`, then upload one EP per mood to your distributor | 20 min |
