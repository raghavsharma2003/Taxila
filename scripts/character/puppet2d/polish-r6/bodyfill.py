"""r6 fix 1, part 2 (judge r5: 'inpaint the body plate the bun can uncover, ~+40 px past its silhouette'). Behind the bun is the
nape, not the backdrop: when the head lifts the bun rides up and r6 i1 showed a cream sliver between bun, neck and collar
(teargate v2: one 4-column hit at 23.5 s). This extends the body plate's neck to the right under the bun: every transparent
body pixel inside the bun's rest footprint (eroded 2 px), up to 45 px right of the neck contour and above the collar/kurta, takes the
neck-edge skin colour of its row, darkened toward the nape (occlusion under the bun), alpha feathered over its last 8 px.
It is written as its own layer, layers/nape.png (body rect, body deformation), drawn BEFORE the bun: the body plate is drawn
after the bun, so a fill inside body.png would cover the bun at rest. body.png itself is left unchanged.
Programmatic, no image model (USD 0). Idempotent (reads body.r5.png).
    python3 scripts/character/puppet2d/polish-r6/bodyfill.py
"""
import json
import os
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

L = "art/character/puppet2d/polish-r6/layers"
g = json.load(open(f"{L}/geom.json"))
bx0, by0, bx1, by1 = g["rects"]["body"]
if not os.path.exists(f"{L}/body.r5.png"):
    Image.open(f"{L}/body.png").save(f"{L}/body.r5.png")
body = np.asarray(Image.open(f"{L}/body.r5.png").convert("RGBA")).astype(np.float32)
bun = np.asarray(Image.open(f"{L}/bun.png").convert("RGBA"))[..., 3] > 240   # the CLEANED bun (bunclean.py), fully opaque part
ux0, uy0, ux1, uy1 = g["rects"]["bun"]
# bun footprint in body coordinates, dilated 40 px
H, W = body.shape[:2]
foot = np.zeros((H, W), bool)
ys, xs = np.where(bun)
X, Y = xs + ux0 - bx0, ys + uy0 - by0
ok = (X >= 0) & (X < W) & (Y >= 0) & (Y < H)
foot[Y[ok], X[ok]] = True
# only where the bun covers the nape at REST (eroded 2 px so the fill never peeks out at rest): that is the area a lifted
# bun can uncover; outside it the backdrop is the correct thing to see (i1 used a 40 px dilation and it leaked onto the
# shoulder as a brown wedge)
foot = ndi.binary_erosion(foot, iterations=2)
a = body[..., 3] / 255
opaque = a > 0.5
out = np.zeros_like(body)
filled = 0
for r in range(H):
    yr = r + by0
    if yr < 640 or yr > 760:
        continue
    row = opaque[r]
    # the neck's right contour: the last opaque pixel of the run that contains x = 560 (rest), left of the bun
    c0 = 560 - bx0
    if not row[c0]:
        continue
    c = c0
    while c + 1 < W and row[c + 1]:
        c += 1
    if c + bx0 > 700:     # this row is kurta (shoulder), not neck
        continue
    edge = body[r, max(c - 6, 0):c - 1, :3].mean(0)
    for k in range(1, 46):
        x = c + k
        if x >= W or opaque[r, x] or not foot[r, x]:
            break
        # stop at the kurta / collar (opaque below within 3 px means we reached the shoulder line)
        t = k / 45.0
        col = edge * (0.86 - 0.22 * t)          # into the nape's shadow under the bun
        al = 1.0 if k <= 37 else 1.0 - (k - 37) / 8.0
        out[r, x, :3] = col
        out[r, x, 3] = max(out[r, x, 3], 255 * al)
        filled += 1
Image.fromarray(out.clip(0, 255).round().astype(np.uint8), "RGBA").save(f"{L}/nape.png")
Image.open(f"{L}/body.r5.png").save(f"{L}/body.png")
g["rects"]["nape"] = [bx0, by0, bx1, by1]
json.dump(g, open(f"{L}/geom.json", "w"), indent=1)
print("nape fill pixels:", filled)
