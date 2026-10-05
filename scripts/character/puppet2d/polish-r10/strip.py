"""r8 motion strip from a clip's frame dir: frames t0..t1 every step s -> one labelled row (head crop).
    python3 strip.py <clipdir/all> <out.jpg> t0 t1 step [S=300]"""
import sys
from PIL import Image, ImageDraw
d, out, t0, t1, st = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4]), float(sys.argv[5])
S = int(sys.argv[6]) if len(sys.argv) > 6 else 300
ts = []; t = t0
while t <= t1 + 1e-6: ts.append(t); t += st
cols = min(8, len(ts)); rows = (len(ts) + cols - 1) // cols
M = Image.new("RGB", (S * cols, (S + 16) * rows), (250, 240, 225)); dr = ImageDraw.Draw(M)
for i, t in enumerate(ts):
    im = Image.open(f"{d}/f{int(round(t * 30)):05d}.png").convert("RGB")
    w = im.size[0]; c = (int(w * 0.16), int(w * 0.04), int(w * 0.86), int(w * 0.74))
    im = im.crop(c).resize((S, S), Image.LANCZOS)
    x, y = (i % cols) * S, (i // cols) * (S + 16)
    M.paste(im, (x, y + 16)); dr.text((x + 3, y + 2), f"t={t:.2f}", fill=(60, 40, 30))
M.save(out, quality=88); print(out)
