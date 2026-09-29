"""Generate a batch of varied Suno prompts (style + title) for a mood.

Paste each line into Suno -> Create -> Custom mode, switch on "Instrumental",
and put the title in the Title field. Downloaded files then go to inbox/<mood>/
named after the title (e.g. "Midnight Rain.mp3") so tracklists read nicely.

    python suno_prompts.py jazz --count 30
"""
import argparse
import csv
import random

from common import ROOT, load_config

EXTRAS = {
    "mood": ["warm", "cozy", "mellow", "dreamy", "nostalgic", "peaceful",
             "intimate", "gentle", "soothing", "laid-back"],
    "texture": ["vinyl crackle", "soft room reverb", "tape saturation",
                "analog warmth", "subtle rain in the background", "clean studio mix"],
    "structure": ["slow build", "steady groove", "loopable arrangement",
                  "soft intro and outro", "no sudden changes"],
}

TITLE_A = ["Midnight", "Velvet", "Amber", "Rainy", "Golden", "Quiet", "Moonlit",
           "Slow", "Soft", "Silver", "Late", "Hazy", "Cozy", "Blue", "Autumn",
           "Candle", "Misty", "Sunday", "Lazy", "Starlit"]
TITLE_B = ["Streets", "Window", "Lounge", "Avenue", "Morning", "Dreams", "Corner",
           "Café", "Lights", "Harbor", "Garden", "Hours", "Letters", "Balcony",
           "Rooftop", "Breeze", "Pages", "Glow", "Echoes", "Rain"]


def make_prompts(mood_cfg, count, seed=None):
    rng = random.Random(seed)
    lo, hi = mood_cfg["tempo"]
    titles, rows = set(), []
    while len(rows) < count:
        title = f"{rng.choice(TITLE_A)} {rng.choice(TITLE_B)}"
        if title in titles:
            continue
        titles.add(title)
        style = ", ".join([
            rng.choice(mood_cfg["styles"]),
            rng.choice(EXTRAS["mood"]),
            rng.choice(EXTRAS["texture"]),
            rng.choice(EXTRAS["structure"]),
            f"{rng.randrange(lo, hi + 1)} bpm",
            "instrumental, no vocals",
        ])
        rows.append({"title": title, "style": style})
    return rows


def main():
    cfg = load_config()
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("mood", choices=cfg["moods"].keys())
    ap.add_argument("--count", type=int, default=20)
    ap.add_argument("--seed", type=int)
    args = ap.parse_args()

    rows = make_prompts(cfg["moods"][args.mood], args.count, args.seed)
    out = ROOT / "output" / f"suno_prompts_{args.mood}.csv"
    out.parent.mkdir(exist_ok=True)
    with open(out, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["title", "style"])
        w.writeheader()
        w.writerows(rows)

    for i, r in enumerate(rows, 1):
        print(f"\n#{i}  TITLE: {r['title']}\n    STYLE: {r['style']}")
    print(f"\nSaved {len(rows)} prompts to {out}")
    print(f"Download finished tracks into inbox/{args.mood}/")


if __name__ == "__main__":
    main()
