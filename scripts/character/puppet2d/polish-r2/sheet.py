"""Frames sheet: c-front next to the rest render at full size, then every pose tile (head crop) with its reference."""
import json, sys, os
from PIL import Image, ImageDraw
P = "art/character/puppet2d/polish-r2/work/poses"
C = "docs/design/teacher/stylised/concepts"
REF = {"rest": f"{C}/c-front.webp", "talk_aa": f"{C}/c-talking.webp", "listening": f"{C}/c-listening.webp", "thinking": f"{C}/c-thinking.webp",
       "delight": f"{C}/c-happy.webp", "yaw_m20": "docs/design/teacher/stylised/build/refs/q3-left.webp", "yaw_p20": "docs/design/teacher/stylised/build/refs/q3-right.webp"}
out = sys.argv[1]
poses = list(json.load(open("art/character/puppet2d/polish-r2/work/poses.json")).keys())
crop = (150, 20, 874, 800)
T = 300
tw, th = T, int(T * (crop[3] - crop[1]) / (crop[2] - crop[0]))
top = Image.new("RGB", (2048 + 24, 1024 + 40), "white")
d = ImageDraw.Draw(top)
top.paste(Image.open(f"{C}/c-front.webp").convert("RGB"), (0, 40)); d.text((8, 12), "c-front (concept)", fill="black")
top.paste(Image.open(f"{P}/rest.png").convert("RGB"), (1024 + 24, 40)); d.text((1032, 12), "arm P rest render (WebGL, all weights 0)", fill="black")
cols = 6
rows = []
items = []
for p in poses:
    items.append((p, f"{P}/{p}.png"))
    if p in REF and p != "rest":
        items.append((f"ref: {os.path.basename(REF[p])}", REF[p]))
R = (len(items) + cols - 1) // cols
grid = Image.new("RGB", (cols * tw, R * (th + 18)), "white")
g = ImageDraw.Draw(grid)
for i, (n, f) in enumerate(items):
    im = Image.open(f).convert("RGB").resize((1024, 1024)).crop(crop).resize((tw, th), Image.LANCZOS)
    x, y = (i % cols) * tw, (i // cols) * (th + 18)
    grid.paste(im, (x, y + 18)); g.text((x + 4, y + 3), n, fill="black")
W = max(top.size[0], grid.size[0])
sheet = Image.new("RGB", (W, top.size[1] + grid.size[1] + 10), "white")
sheet.paste(top, (0, 0)); sheet.paste(grid, (0, top.size[1] + 10))
sheet.save(out, quality=90)
print(out, sheet.size)
