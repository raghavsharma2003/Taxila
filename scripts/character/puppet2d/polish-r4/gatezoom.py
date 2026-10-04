"""r4: 4x nearest-neighbour zoom of chosen gate frames (pixel-level check of seams / teeth / tongue).
    python3 gatezoom.py <dir> <out.png> f1,f2,...   (BOX env = mouth crop, default 300,425,460,565)"""
import os, sys
from PIL import Image
d, out, fr = sys.argv[1], sys.argv[2], [int(v) for v in sys.argv[3].split(",")]
box = tuple(int(v) for v in os.environ.get("BOX", "300,425,460,565").split(","))
W, H = (box[2] - box[0]) * 4, (box[3] - box[1]) * 4
M = Image.new("RGB", (W * 3, H * ((len(fr) + 2) // 3)))
for i, f in enumerate(fr):
    im = Image.open(f"{d}/g{f:05d}.png").convert("RGB").crop(box).resize((W, H), Image.NEAREST)
    M.paste(im, ((i % 3) * W, (i // 3) * H))
M.save(out)
