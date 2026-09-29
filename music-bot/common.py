"""Shared helpers: config loading, ffprobe, file discovery."""
import json
import subprocess
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent
AUDIO_EXTS = {".mp3", ".wav", ".m4a", ".flac", ".ogg"}
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}
VIDEO_EXTS = {".mp4", ".mov", ".webm"}


def load_config():
    with open(ROOT / "config.yaml", encoding="utf-8") as f:
        return yaml.safe_load(f)


def duration(path):
    """Duration of a media file in seconds."""
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "json", str(path)],
        capture_output=True, text=True, check=True,
    ).stdout
    return float(json.loads(out)["format"]["duration"])


def list_files(folder, exts):
    folder = Path(folder)
    if not folder.exists():
        return []
    return sorted(p for p in folder.iterdir() if p.suffix.lower() in exts)


def run(cmd):
    print("$", " ".join(str(c) for c in cmd[:6]), "...")
    subprocess.run([str(c) for c in cmd], check=True)


def timestamp(seconds):
    seconds = int(seconds)
    h, rem = divmod(seconds, 3600)
    m, s = divmod(rem, 60)
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m:02d}:{s:02d}"


def pretty_title(path):
    """'midnight_rain-2.mp3' -> 'Midnight Rain'."""
    stem = Path(path).stem
    for ch in "_-":
        stem = stem.replace(ch, " ")
    words = [w for w in stem.split() if not w.isdigit()]
    return " ".join(words).title() or Path(path).stem
