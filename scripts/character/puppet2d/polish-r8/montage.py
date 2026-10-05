"""Labelled crop montage of rendered poses.
    python3 montage.py <dir> <out.png> <x0,y0,x1,y1> <scale> <cols> [names,comma,separated]
"""
import sys, os
from PIL import Image, ImageDraw

d, out, box, sc, cols = sys.argv[1], sys.argv[2], tuple(map(int, sys.argv[3].split(","))), float(sys.argv[4]), int(sys.argv[5])
names = sys.argv[6].split(",") if len(sys.argv) > 6 else sorted(f[:-4] for f in os.listdir(d) if f.endswith(".png"))
w, h = int((box[2] - box[0]) * sc), int((box[3] - box[1]) * sc)
rows = (len(names) + cols - 1) // cols
M = Image.new("RGB", (w * cols, (h + 18) * rows), (30, 30, 30))
dr = ImageDraw.Draw(M)
for i, n in enumerate(names):
    p = f"{d}/{n}.png"
    if not os.path.exists(p):
        continue
    im = Image.open(p).convert("RGB").crop(box).resize((w, h), Image.LANCZOS)
    x, y = (i % cols) * w, (i // cols) * (h + 18)
    M.paste(im, (x, y + 18))
    dr.text((x + 4, y + 3), n, fill=(255, 255, 255))
M.save(out)
print(out, M.size)
