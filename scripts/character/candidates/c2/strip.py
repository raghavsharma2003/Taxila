"""side-by-side strip of PNGs: python3 strip.py out.jpg w h a.png b.png ..."""
import sys
from PIL import Image, ImageDraw
out, w, h = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
fs = sys.argv[4:]
s = Image.new("RGB", (w * len(fs), h + 16), (20, 20, 20))
d = ImageDraw.Draw(s)
for i, f in enumerate(fs):
    s.paste(Image.open(f).convert("RGB").resize((w, h)), (i * w, 16))
    d.text((i * w + 3, 2), f.split("/")[-1][:-4], fill=(240, 220, 150))
s.save(out, quality=90)
