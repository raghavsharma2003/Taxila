"""r9 (judge r8 fix 5): the bun's lower contour showed a grainy dark fringe against the cream at 1:1. Cause (measured): its
alpha edge was a per-COLUMN ramp (255, 237, 164, 48 in every column, offset by whole pixels), i.e. quantised in y only, so a
diagonal contour became a light/dark staircase. Rebuild: smooth the contour (gaussian sigma 1.6 on the mask, re-threshold),
supersample x4 and box-filter back down (true 2D coverage), a 0.6 px gaussian feather, and the low-alpha pixels' colour is
the nearest solid interior colour (so the premultiplied edge never carries a darker or lighter rim). Only pixels within 4 px
of the contour change. In: layers/bun.png (backed up once to bun.r8.png). Then pack.py.
    python3 scripts/character/puppet2d/polish-r10/bunedge.py"""
import os, shutil
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
P = "art/character/puppet2d/polish-r10/layers/bun.png"
B = P.replace(".png", ".r8.png")
if not os.path.exists(B): shutil.copy(P, B)
a = np.asarray(Image.open(B).convert("RGBA")).astype(np.float32)
A = a[..., 3] / 255
m = ndi.gaussian_filter(A, 1.6)                       # smooth contour (subpixel position kept by the 0.5 threshold)
S = 4
hi = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).resize((m.shape[1] * S, m.shape[0] * S), Image.BICUBIC), np.float32) / 255
cov = (hi > 0.5).astype(np.float32).reshape(m.shape[0], S, m.shape[1], S).mean((1, 3))
cov = ndi.gaussian_filter(cov, 0.6)
# only near the contour; the solid interior and the far outside stay as they were
dist_in = ndi.distance_transform_edt(A > 0.5); dist_out = ndi.distance_transform_edt(A <= 0.5)
band = (np.minimum(dist_in, dist_out) <= 4).astype(np.float32)
newA = A * (1 - band) + cov * band
# colour: nearest solid interior pixel for everything that is not solid
solid = A > 0.98
_, (iy, ix) = ndi.distance_transform_edt(~solid, return_indices=True)
rgb = a[..., :3].copy()
fill = rgb[iy, ix]
w = np.clip((0.98 - A) / 0.5, 0, 1)[..., None] * band[..., None]
rgb = rgb * (1 - w) + fill * w
out = np.dstack([rgb, newA * 255]).clip(0, 255).astype(np.uint8)
Image.fromarray(out, "RGBA").save(P)
ch = np.abs(newA - A)
print("bun alpha rebuilt: px changed > 0.05:", int((ch > 0.05).sum()), "max", round(float(ch.max()), 3), "mean coverage delta", round(float((newA - A).sum()), 1), "px")
