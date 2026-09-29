"""Package library tracks into a distributor-ready release (DistroKid, TuneCore, ...).

Spotify has no upload API, so the final upload is done in your distributor's
website. This script prepares everything so that upload takes ~5 minutes:

    output/release_<mood>_<date>/
        01 - Midnight Rain.wav     16-bit / 44.1 kHz WAV, loudness-normalised
        cover.jpg                  3000x3000 cover art
        release.csv                track number, title, duration, file

    python spotify_prep.py focus --tracks 8 --cover backgrounds/focus/room.png
"""
import argparse
import csv
import datetime as dt
import json
import random

from PIL import Image, ImageOps

from common import (AUDIO_EXTS, IMAGE_EXTS, ROOT, duration, list_files,
                    load_config, pretty_title, run, timestamp)

RELEASED_LOG = ROOT / "library" / "released.json"


def main():
    cfg = load_config()
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("mood", choices=cfg["moods"].keys())
    ap.add_argument("--tracks", type=int, default=8, help="tracks per release (EP/album)")
    ap.add_argument("--cover", help="cover image (default: random from backgrounds/<mood>)")
    args = ap.parse_args()

    released = set(json.loads(RELEASED_LOG.read_text())) if RELEASED_LOG.exists() else set()
    pool = [p for p in list_files(ROOT / "library" / args.mood, AUDIO_EXTS)
            if p.name not in released]
    if not pool:
        raise SystemExit(f"No unreleased tracks in library/{args.mood}/ "
                         "(tracks land there after build_mix.py).")
    chosen = random.sample(pool, min(args.tracks, len(pool)))

    out = ROOT / "output" / f"release_{args.mood}_{dt.date.today().isoformat()}"
    out.mkdir(parents=True, exist_ok=True)

    rows = []
    for i, src in enumerate(chosen, 1):
        title = pretty_title(src)
        dst = out / f"{i:02d} - {title}.wav"
        run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", src,
             "-af", f"loudnorm=I={cfg['mix']['loudness_lufs']}:TP=-1:LRA=11",
             "-ar", "44100", "-sample_fmt", "s16", dst])
        rows.append({"track": i, "title": title,
                     "duration": timestamp(duration(dst)), "file": dst.name})

    images = list_files(ROOT / "backgrounds" / args.mood, IMAGE_EXTS)
    cover_src = args.cover or (random.choice(images) if images else None)
    if cover_src:
        img = ImageOps.fit(Image.open(cover_src).convert("RGB"), (3000, 3000))
        img.save(out / "cover.jpg", quality=95)
    else:
        print(f"No cover image - add one to backgrounds/{args.mood}/ or pass --cover")

    with open(out / "release.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["track", "title", "duration", "file"])
        w.writeheader()
        w.writerows(rows)

    RELEASED_LOG.write_text(json.dumps(sorted(released | {p.name for p in chosen}), indent=2))
    print(f"\nRelease ready: {out}")
    print("Upload in your distributor. Tick 'instrumental' and the AI-generated "
          "disclosure; do NOT opt into YouTube Content ID for these tracks.")


if __name__ == "__main__":
    main()
