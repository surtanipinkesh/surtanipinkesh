#!/usr/bin/env bash
# 24/7 YouTube livestream of every finished mix for a mood, on repeat.
#
#   export YT_STREAM_KEY=xxxx-xxxx-xxxx-xxxx   # YouTube Studio -> Go live -> Stream key
#   ./livestream.sh jazz
#
# Run it on a VPS inside tmux/screen (or as a systemd service) so it never stops.
# It streams output/<mood>_*/mix.m4a (already crossfaded + normalised by build_mix.py)
# over a background image/clip from backgrounds/<mood>/.
set -euo pipefail

MOOD="${1:?usage: ./livestream.sh <mood>}"
: "${YT_STREAM_KEY:?set YT_STREAM_KEY first}"
cd "$(dirname "$0")"

PLAYLIST="output/stream_${MOOD}.txt"
BG="$(find "backgrounds/${MOOD}" -maxdepth 1 -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.mp4' \) | shuf -n1 || true)"
[ -n "$BG" ] || { echo "Add an image or .mp4 to backgrounds/${MOOD}/"; exit 1; }

while true; do
  # Fresh shuffled playlist each cycle so new mixes are picked up automatically.
  find output -path "output/${MOOD}_*/mix.m4a" | shuf | sed "s|^|file '$(pwd)/|; s|$|'|" > "$PLAYLIST"
  [ -s "$PLAYLIST" ] || { echo "No mixes yet - run: python build_mix.py ${MOOD}"; exit 1; }

  if [[ "$BG" == *.mp4 ]]; then
    VIN=(-stream_loop -1 -re -i "$BG")
  else
    VIN=(-loop 1 -framerate 30 -re -i "$BG")
  fi

  ffmpeg -hide_banner -loglevel warning \
    "${VIN[@]}" \
    -re -f concat -safe 0 -i "$PLAYLIST" \
    -map 0:v -map 1:a \
    -vf "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,format=yuv420p" \
    -c:v libx264 -preset veryfast -r 30 -g 60 -b:v 2500k -maxrate 2500k -bufsize 5000k \
    -c:a aac -b:a 160k -ar 44100 \
    -shortest -f flv "rtmp://a.rtmp.youtube.com/live2/${YT_STREAM_KEY}" \
    || echo "ffmpeg exited ($?) - restarting in 5s"
  sleep 5
done
