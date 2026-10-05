"""crop the face of each pose png in a dir into a labelled sheet: python3 exsheet.py <dir> <out> [names...]"""
import sys, os
from PIL import Image, ImageDraw
d, out = sys.argv[1], sys.argv[2]
names = sys.argv[3:] or sorted(f[:-4] for f in os.listdir(d) if f.endswith(".png"))
W = 420
cols = 4
rows = (len(names) + cols - 1) // cols
S = Image.new("RGB", (W * cols, int(W * 1.1) * rows), "white")
for i, n in enumerate(names):
    im = Image.open(f"{d}/{n}.png").convert("RGB")
    s = im.width / 1024
    c = im.crop((int(200 * s), int(150 * s), int(820 * s), int(832 * s))).resize((W, int(W * 1.1)))
    ImageDraw.Draw(c).text((6, 6), n, fill=(0, 0, 0))
    S.paste(c, ((i % cols) * W, (i // cols) * int(W * 1.1)))
S.save(out)
