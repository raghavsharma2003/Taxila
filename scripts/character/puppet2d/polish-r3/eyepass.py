"""Eye pass on 4x crops of the battery renders (cream): brows, earrings + jaw, bun underside, right brow tail.
    python3 eyepass.py <out.png> pose1,pose2,...  [region names]"""
import sys
from PIL import Image, ImageDraw
D = "art/character/puppet2d/polish-r3/work/battery/cream"
REG = {"browL": (330, 320, 490, 420), "browR": (560, 310, 740, 410), "earL": (250, 500, 370, 620), "earR": (690, 480, 810, 600), "bun": (590, 560, 790, 760), "jawL": (300, 560, 440, 720)}
out, poses = sys.argv[1], sys.argv[2].split(",")
regs = sys.argv[3].split(",") if len(sys.argv) > 3 else list(REG)
sc = 2.5
tiles = []
for p in poses:
    im = Image.open(f"{D}/{p}.png").convert("RGB")
    for r in regs:
        b = REG[r]
        tiles.append((f"{p} {r}", im.crop(b).resize((int((b[2] - b[0]) * sc), int((b[3] - b[1]) * sc)), Image.LANCZOS)))
W = max(t[1].width for t in tiles); Hh = max(t[1].height for t in tiles)
cols = len(regs)
M = Image.new("RGB", (W * cols, (Hh + 14) * len(poses)), (20, 20, 20))
d = ImageDraw.Draw(M)
for i, (l, t) in enumerate(tiles):
    x, y = (i % cols) * W, (i // cols) * (Hh + 14)
    M.paste(t, (x, y + 14)); d.text((x + 2, y + 1), l, fill=(255, 255, 255))
M.save(out); print(M.size)
