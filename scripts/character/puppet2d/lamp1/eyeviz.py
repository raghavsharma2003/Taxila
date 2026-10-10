"""Overlay the traced eye curves (geom-layers.json) on 6x eye crops: opening top (green), bottom (cyan), lash top (magenta),
lash bottom (yellow), iris circle (red). python3 -I eyeviz.py <out.png>"""
import json, sys
from PIL import Image, ImageDraw
S = "/tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/r4-asha"
g = json.load(open(f"{S}/layers/geom-layers.json")); im = Image.open(f"{S}/rs/front.png").convert("RGB")
tiles = []
for s, bx in (("L", (355, 380, 495, 450)), ("R", (555, 380, 698, 450))):
    k = 6; c = im.crop(bx).resize(((bx[2] - bx[0]) * k, (bx[3] - bx[1]) * k), Image.NEAREST); d = ImageDraw.Draw(c); e = g["eyes"][s]
    P = lambda x, y: ((x - bx[0]) * k, (y - bx[1]) * k)
    xa = e["x"][0]
    d.line([P(xa + i, v) for i, v in enumerate(e["top"])], fill=(0, 255, 0), width=2)
    d.line([P(xa + i, v) for i, v in enumerate(e["bot"])], fill=(0, 255, 255), width=2)
    lx = e["lashX"][0]
    d.line([P(lx + i, v) for i, v in enumerate(e["lashTop"])], fill=(255, 0, 255), width=2)
    d.line([P(lx + i, v) for i, v in enumerate(e["lashBot"])], fill=(255, 255, 0), width=2)
    cx, cy, r = e["iris"]; d.ellipse([P(cx - r, cy - r), P(cx + r, cy + r)], outline=(255, 0, 0), width=2)
    tiles.append(c)
O = Image.new("RGB", (max(t.width for t in tiles), sum(t.height for t in tiles) + 10), "black"); y = 0
for t in tiles: O.paste(t, (0, y)); y += t.height + 10
O.save(sys.argv[1])
