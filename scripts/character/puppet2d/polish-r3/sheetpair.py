"""Side-by-side crops (2x) of the same box from several pose PNGs. sheetpair.py out.png box=x0,y0,x1,y1 a.png b.png ..."""
import sys
from PIL import Image
out, box, files = sys.argv[1], tuple(map(int, sys.argv[2].split(","))), sys.argv[3:]
z = 2
w, h = (box[2] - box[0]) * z, (box[3] - box[1]) * z
W = Image.new("RGB", (w * len(files) + 6 * (len(files) - 1), h), "white")
for i, f in enumerate(files):
    W.paste(Image.open(f).convert("RGB").crop(box).resize((w, h), Image.LANCZOS), (i * (w + 6), 0))
W.save(out)
