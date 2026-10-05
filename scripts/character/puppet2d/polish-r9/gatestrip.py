"""r4 articulation gate strip: every frame of the scripted "chalo, aao, mama, bubbly" (shoot.mjs gate), mouth crop,
labelled with the phoneme under the clock. Judged by eye: each phoneme must be identifiable.
    python3 gatestrip.py <dir> <out.png> [scale]"""
import json, sys
from PIL import Image, ImageDraw
d, out = sys.argv[1], sys.argv[2]
sc = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0
lab = json.load(open(f"{d}/labels.json"))
import os
box = tuple(int(v) for v in os.environ.get("BOX", "300,425,460,565").split(","))
w, h = int((box[2] - box[0]) * sc), int((box[3] - box[1]) * sc)
cols = 12
rows = (len(lab) + cols - 1) // cols
M = Image.new("RGB", (w * cols, (h + 16) * rows), (25, 25, 25))
dr = ImageDraw.Draw(M)
for i, l in enumerate(lab):
    im = Image.open(f"{d}/g{i:05d}.png").convert("RGB").crop(box).resize((w, h), Image.LANCZOS)
    x, y = (i % cols) * w, (i // cols) * (h + 16)
    M.paste(im, (x, y + 16))
    dr.text((x + 3, y + 2), f"{i} {l}", fill=(255, 255, 255))
M.save(out)
print(out, M.size)
