"""r6 fix 1 (judge r5: the shoulder tear). The bun layer carried a thin dark strip below its round silhouette (the kurta's
contact line from c-front, assigned to the bun by the r1 segmentation). At rest the body plate is drawn over it, so it was
invisible; once the head lifts or rolls the bun rides up and the strip shows as a jagged saw-tooth on the shoulder. The
bun's alpha was also binary (a staircase edge everywhere).

  1. the strip: a morphological opening (disk r 9) of the bun mask, applied only below y 726, removes every structure
     thinner than ~18 px there (the strip is 9-12 px); a disk-15 opening below y 712, x < 690 rounds the stub where it
     joined into the bun's arc; the round mass survives;
  2. the edge: a signed distance of the cleaned mask (sub-pixel, from a lightly blurred mask) -> alpha ramp 3.5 px wide on
     the mass silhouette, 1.6 px on the thin wisps (a 3.5 px ramp would fade a 4-6 px strand);
  3. colour: every pixel the new alpha reaches takes the colour of the nearest original opaque pixel (no dark fringe from
     whatever RGB sat under alpha 0).
No image model is used (USD 0).
    python3 scripts/character/puppet2d/polish-r8/bunclean.py
"""
import json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

L = "art/character/puppet2d/polish-r8/layers"
g = json.load(open(f"{L}/geom.json"))
x0, y0, x1, y1 = g["rects"]["bun"]
src = f"{L}/bun.png"
import os
if not os.path.exists(f"{L}/bun.r5.png"):
    Image.open(src).save(f"{L}/bun.r5.png")
im = np.asarray(Image.open(f"{L}/bun.r5.png").convert("RGBA")).astype(np.float32)
a0 = im[..., 3] / 255
m = a0 > 0.5
H, W = m.shape
yy, xx = np.mgrid[0:H, 0:W]
Y, X = yy + y0, xx + x0

# 1. strip removal below y 726 (rest px)
r = 9
disk = (np.hypot(*np.mgrid[-r:r + 1, -r:r + 1]) <= r)
opened = ndi.binary_opening(np.pad(m, r + 2), structure=disk)[r + 2:-r - 2, r + 2:-r - 2]
low = Y >= 726
mc = np.where(low, opened, m)
# the stub where the strip joined the mass (x 600-645, y 735-750): a larger opening rounds the lower-left into the arc
r2 = 15
disk2 = (np.hypot(*np.mgrid[-r2:r2 + 1, -r2:r2 + 1]) <= r2)
opened2 = ndi.binary_opening(np.pad(mc, r2 + 2), structure=disk2)[r2 + 2:-r2 - 2, r2 + 2:-r2 - 2]
mc = np.where((Y >= 712) & (X < 690), opened2, mc)
# then the lower-left follows the bun's own bottom arc: a circle fitted to the clean bottom boundary (x 655-728) cuts
# what hangs below it at x < 660 (hidden behind the collar at rest; once lifted, a bun has a round bottom)
xs = np.arange(655, 729); ys = np.array([Y[:, c - x0][mc[:, c - x0]].max() for c in xs], float)
A = np.c_[xs, ys, np.ones_like(xs)]; bb = -(xs ** 2 + ys ** 2)
cD, cE, cF = np.linalg.lstsq(A, bb, rcond=None)[0]
ccx, ccy = -cD / 2, -cE / 2; crr = np.sqrt(ccx ** 2 + ccy ** 2 - cF)
print("bottom arc circle", round(ccx, 1), round(ccy, 1), round(crr, 1))
below = (X < 660) & (Y > ccy) & (np.hypot(X - ccx, Y - ccy) > crr) & (Y > 712)
mc = mc & ~below
# keep only the largest component plus the wisps (components touching x >= 735 or the top-right strand)
lab, n = ndi.label(mc)
sizes = ndi.sum(mc, lab, range(1, n + 1))
keep = np.zeros_like(mc)
big = 1 + int(np.argmax(sizes))
for k in range(1, n + 1):
    comp = lab == k
    if k == big or (X[comp].min() >= 730) or (Y[comp].max() < 600):
        keep |= comp
removed = m & ~keep
print("strip pixels removed:", int(removed.sum()), "rows", (Y[removed].min(), Y[removed].max()) if removed.any() else None)

# 2. sub-pixel signed distance -> feathered alpha
soft = ndi.gaussian_filter(keep.astype(np.float32), 0.8)
inside = soft >= 0.5
din = ndi.distance_transform_edt(inside)
dout = ndi.distance_transform_edt(~inside)
sd = np.where(inside, din - 0.5, -(dout - 0.5))
# wisps: thin strands (local thickness < 8 px) keep a near-crisp ramp
thick = ndi.maximum_filter(np.where(inside, din, 0), size=9)
wisp = thick < 4.2
ramp = np.where(wisp, 1.6, 3.5)
alpha = np.clip(0.5 + sd / ramp, 0, 1)
# the feather is centred on the silhouette, so the bun keeps its painted size

# 3. colour extension from the nearest original opaque pixel
_, (iy, ix) = ndi.distance_transform_edt(~m, return_indices=True)
rgb = im[..., :3].copy()
grow = (alpha > 0) & ~m
rgb[grow] = im[iy[grow], ix[grow], :3]
out = np.dstack([rgb, alpha * 255]).clip(0, 255).round().astype(np.uint8)
Image.fromarray(out, "RGBA").save(src)
print("wrote", src, "alpha levels", len(np.unique(out[..., 3])))
