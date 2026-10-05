"""r9 evidence strips from the review clip's frames (30 fps PNGs): python3 strip9.py <framesdir> <out.jpg> <t0> <t1> <fps> <cols> [crop x0,y0,x1,y1] [cell]"""
import sys
from PIL import Image, ImageDraw
d, out, t0, t1, fps, cols = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4]), float(sys.argv[5]), int(sys.argv[6])
crop = tuple(map(int, sys.argv[7].split(","))) if len(sys.argv) > 7 else (130, 40, 894, 804)
cell = int(sys.argv[8]) if len(sys.argv) > 8 else 256
ts = []; t = t0
while t < t1 - 1e-6: ts.append(t); t += 1 / fps
rows = (len(ts) + cols - 1) // cols
ch = int(cell * (crop[3] - crop[1]) / (crop[2] - crop[0]))
M = Image.new("RGB", (cols * cell, rows * (ch + 14)), (250, 240, 225)); D = ImageDraw.Draw(M)
for i, t in enumerate(ts):
    f = round(t * 30)
    im = Image.open(f"{d}/f{f:05d}.png").convert("RGB").crop(crop).resize((cell, ch), Image.LANCZOS)
    x, y = (i % cols) * cell, (i // cols) * (ch + 14)
    M.paste(im, (x, y + 14)); D.text((x + 3, y + 1), f"{t:.2f}", fill=(60, 40, 30))
M.save(out, quality=88); print(out, M.size)
