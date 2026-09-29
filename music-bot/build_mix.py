"""Turn Suno tracks in inbox/<mood>/ into a ready-to-upload YouTube video.

Creates output/<mood>_<date>_<n>/ containing:
    mix.m4a        crossfaded, loudness-normalised audio
    video.mp4      background (image or looping clip) + audio
    thumbnail.jpg  1280x720
    metadata.json  title, description with timestamps, tags

Used tracks are moved to library/<mood>/ (reused by livestream + Spotify prep).

    python build_mix.py jazz
    python build_mix.py sleep --minutes 180
"""
import argparse
import datetime as dt
import json
import random
import shutil
import subprocess

from PIL import Image, ImageOps

from common import (AUDIO_EXTS, IMAGE_EXTS, ROOT, VIDEO_EXTS, duration,
                    list_files, load_config, pretty_title, run, timestamp)


def pick_tracks(tracks, target_sec, crossfade):
    random.shuffle(tracks)
    chosen, total = [], 0.0
    for t in tracks:
        d = duration(t)
        chosen.append((t, d))
        total += d - (crossfade if len(chosen) > 1 else 0)
        if total >= target_sec:
            break
    return chosen, total


def render_audio(chosen, crossfade, lufs, out):
    cmd = ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error"]
    for path, _ in chosen:
        cmd += ["-i", path]
    parts, last = [], "[0:a]"
    for i in range(1, len(chosen)):
        label = f"[x{i}]"
        parts.append(f"{last}[{i}:a]acrossfade=d={crossfade}:c1=tri:c2=tri{label}")
        last = label
    parts.append(f"{last}loudnorm=I={lufs}:TP=-1.5:LRA=11,aresample=48000[out]")
    cmd += ["-filter_complex", ";".join(parts), "-map", "[out]",
            "-c:a", "aac", "-b:a", "256k", out]
    run(cmd)


def make_placeholder(path, w, h, text):
    img = Image.new("RGB", (w, h), (24, 26, 38))
    img.save(path)
    print(f"No background found - using a plain placeholder ({text}). "
          f"Add images or clips to backgrounds/{text}/")


def render_video(bg, audio, out, cfg):
    w, h, fps = cfg["video_width"], cfg["video_height"], cfg["video_fps"]
    scale = (f"scale={w}:{h}:force_original_aspect_ratio=increase,"
             f"crop={w}:{h},format=yuv420p")
    if bg.suffix.lower() in VIDEO_EXTS:
        inputs = ["-stream_loop", "-1", "-i", bg]
        vopts = ["-r", "30", "-preset", "veryfast", "-crf", "23"]
    else:
        inputs = ["-loop", "1", "-framerate", fps, "-i", bg]
        vopts = ["-tune", "stillimage", "-preset", "veryfast", "-crf", "20",
                 "-g", fps * 10]
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", *inputs,
         "-i", audio, "-map", "0:v", "-map", "1:a", "-vf", scale,
         "-c:v", "libx264", *vopts, "-c:a", "copy", "-shortest",
         "-movflags", "+faststart", out])


def make_thumbnail(bg, out):
    frame = bg
    if bg.suffix.lower() in VIDEO_EXTS:
        frame = out.with_suffix(".frame.png")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", "1",
                        "-i", str(bg), "-frames:v", "1", str(frame)], check=True)
    img = ImageOps.fit(Image.open(frame).convert("RGB"), (1280, 720))
    img.save(out, quality=90)
    if frame != bg:
        frame.unlink()


def build_metadata(cfg, mood, tracklist, total):
    mood_cfg = cfg["moods"][mood]
    title = random.choice(mood_cfg["title_templates"])[:100]
    lines = [
        f"{title}",
        "",
        f"Relax, focus or unwind with {timestamp(total)} of {mood} music "
        f"from {cfg['channel_name']}. New mixes every week - subscribe "
        "and turn on notifications 🔔",
        "",
        "🎵 Tracklist",
        *[f"{timestamp(start)} {name}" for start, name in tracklist],
        "",
        "Music created with AI (Suno) and curated, arranged and mastered "
        f"by {cfg['channel_name']}.",
        "",
        " ".join("#" + t.replace(" ", "") for t in mood_cfg["tags"][:3]),
    ]
    tags, size = [], 0
    for t in mood_cfg["tags"]:
        if size + len(t) + 1 > 450:
            break
        tags.append(t)
        size += len(t) + 1
    return {"title": title, "description": "\n".join(lines)[:4900],
            "tags": tags, "mood": mood}


def main():
    cfg = load_config()
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("mood", choices=cfg["moods"].keys())
    ap.add_argument("--minutes", type=float, default=cfg["mix"]["target_minutes"])
    ap.add_argument("--keep", action="store_true",
                    help="leave tracks in inbox instead of moving to library")
    args = ap.parse_args()
    mix = cfg["mix"]

    tracks = list_files(ROOT / "inbox" / args.mood, AUDIO_EXTS)
    if not tracks:
        raise SystemExit(f"No tracks in inbox/{args.mood}/ - download some from Suno first.")

    chosen, total = pick_tracks(tracks, args.minutes * 60, mix["crossfade_seconds"])
    if total < args.minutes * 60:
        print(f"Warning: only {timestamp(total)} of music available "
              f"(wanted {args.minutes:.0f} min). Building a shorter mix.")

    stamp = dt.date.today().isoformat()
    n = 1
    while (ROOT / "output" / f"{args.mood}_{stamp}_{n}").exists():
        n += 1
    out = ROOT / "output" / f"{args.mood}_{stamp}_{n}"
    out.mkdir(parents=True)

    tracklist, t = [], 0.0
    for path, d in chosen:
        tracklist.append((t, pretty_title(path)))
        t += d - mix["crossfade_seconds"]

    print(f"Mixing {len(chosen)} tracks ({timestamp(total)}) ...")
    render_audio(chosen, mix["crossfade_seconds"], mix["loudness_lufs"], out / "mix.m4a")

    backgrounds = list_files(ROOT / "backgrounds" / args.mood, IMAGE_EXTS | VIDEO_EXTS)
    if backgrounds:
        bg = random.choice(backgrounds)
    else:
        bg = out / "placeholder.png"
        make_placeholder(bg, mix["video_width"], mix["video_height"], args.mood)

    print(f"Rendering video with background {bg.name} ...")
    render_video(bg, out / "mix.m4a", out / "video.mp4", mix)
    make_thumbnail(bg, out / "thumbnail.jpg")

    meta = build_metadata(cfg, args.mood, tracklist, total)
    meta["tracks"] = [p.name for p, _ in chosen]
    (out / "metadata.json").write_text(json.dumps(meta, indent=2, ensure_ascii=False),
                                       encoding="utf-8")

    if not args.keep:
        lib = ROOT / "library" / args.mood
        lib.mkdir(parents=True, exist_ok=True)
        for p, _ in chosen:
            shutil.move(str(p), lib / p.name)

    print(f"\nDone: {out}\nNext: python youtube_upload.py {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
