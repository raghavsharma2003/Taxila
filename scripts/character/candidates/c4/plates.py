"""Tier D plate assets from B+ renders: plate.webp + a 5-cell mouth strip + a blink overlay (crop rects in plate.json)."""
import json, os, sys
import numpy as np
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
load = lambda n: Image.open(os.path.join(src, n)).convert("RGB")
plate = load("plate.png")


def diff_box(a, b, pad=6, thr=12):
    d = np.abs(np.asarray(a, np.int16) - np.asarray(b, np.int16)).max(2) > thr
    ys, xs = np.nonzero(d)
    if len(xs) == 0:
        return None
    x0, x1, y0, y1 = xs.min() - pad, xs.max() + pad, ys.min() - pad, ys.max() + pad
    return [int(max(0, x0)), int(max(0, y0)), int(min(a.width, x1)), int(min(a.height, y1))]


cells = [load(f"m{i}.png") for i in range(5)]
mb = diff_box(cells[0], cells[-1])
strip = Image.new("RGB", ((mb[2] - mb[0]) * 5, mb[3] - mb[1]))
for i, c in enumerate(cells):
    strip.paste(c.crop(mb), (i * (mb[2] - mb[0]), 0))
bb = diff_box(plate, load("blink.png"))
plate.save(os.path.join(out, "plate.webp"), quality=82, method=6)
strip.save(os.path.join(out, "mouth.webp"), quality=85, method=6)
load("blink.png").crop(bb).save(os.path.join(out, "blink.webp"), quality=85, method=6)
size = sum(os.path.getsize(os.path.join(out, f)) for f in ("plate.webp", "mouth.webp", "blink.webp"))
json.dump({"plate": [plate.width, plate.height], "mouthRect": mb, "mouthCells": 5, "mouthJaw": [0, 0.15, 0.3, 0.45, 0.6],
           "blinkRect": bb, "bytes": size, "source": "rendered from the B+ runtime (scripts/character/render.mjs)"},
          open(os.path.join(out, "plate.json"), "w"), indent=1)
print("plates", size, "bytes")
