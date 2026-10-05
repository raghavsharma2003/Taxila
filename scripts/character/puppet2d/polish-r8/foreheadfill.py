"""r7 fix 1b: the face layer's temple edge under the hairline. Pinning the hairline to the brow warp (rig.js PIN_AT) lifts
the hair edge up to ~30 px above each brow's outer end, which exposed what the hair had always hidden: the face layer ends
only ~10-15 px under the hairline with a hard, aliased staircase edge, a notch (rest x 352-360, y 355-378: the hair back
showed through it as a dark square on surprise) and a ~10 px band of hair-tinted dark brown pixels along it.

Fix: in two temple boxes, every face pixel that is not clean skin (dark band, notch, transparent) within 48 px of clean
skin is refilled with the colour of the nearest clean skin pixel (distance-transform indices), lightly blurred, alpha 255,
with a 3 px feather at the new outer edge. The hair layer covers all of it at rest (rest-pose check: restcheck).
    python3 scripts/character/puppet2d/polish-r8/foreheadfill.py
"""
import json
import os
import shutil
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

L = "art/character/puppet2d/polish-r8/layers"
g = json.load(open(f"{L}/geom.json"))
r = g["rects"]["face"]
if not os.path.exists(f"{L}/face.r6.png"):
    shutil.copy(f"{L}/face.png", f"{L}/face.r6.png")
im = np.asarray(Image.open(f"{L}/face.r6.png").convert("RGBA")).astype(np.float32)
H, W = im.shape[:2]
rgb, a = im[..., :3], im[..., 3]
lum = rgb @ np.array([0.3, 0.59, 0.11])
# i1 sourced the fill from CLEAN skin and replaced the dark band too: the hairline's painted contact shadow vanished at
# rest (a light faceted stripe beside the hair). The visible pixels are kept now; only the transparent outside (and the
# notch) is filled, extending the edge's own colour (the shadow continues under the hair)
clean = ndi.binary_erosion(a > 250, iterations=1)
dist, (iy, ix) = ndi.distance_transform_edt(~clean, return_indices=True)
fill = rgb[iy, ix]
fill = np.stack([ndi.gaussian_filter(fill[..., c], 4.0) for c in range(3)], -1)
# the layer's OUTSIDE (transparent, connected to the layer border): eye or mouth holes are not the outside
lab, _ = ndi.label(a < 10)
edge_ids = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
outside = np.isin(lab, list(edge_ids))
near_out = ndi.distance_transform_edt(~outside) <= 30   # within 30 px of the outside: the hairline band only
# i3: the fill ran to the layer's rect edge (x 768) and showed as a hard vertical skin block beside the far ear on a
# turned playful: the fill fades out over the last 10 px before any rect edge
yy, xx = np.mgrid[0:H, 0:W]
border = np.clip((np.minimum.reduce([xx, W - 1 - xx, yy, H - 1 - yy]) - 2) / 10.0, 0, 1)
out = im.copy()
rep = {}
for name, (bx0, by0, bx1, by1) in {"L": (294, 190, 480, 450), "R": (590, 182, 769, 440)}.items():
    x0, y0, x1, y1 = bx0 - r[0], by0 - r[1], bx1 - r[0], by1 - r[1]
    sl = (slice(max(0, y0), y1), slice(max(0, x0), x1))
    d = dist[sl]
    # only the hairline band (near the layer's outside), never the eye sockets or brows' beds
    tgt = (a[sl] <= 250) & (d <= 48) & near_out[sl]
    na = np.clip((48 - d) / 3.0, 0, 1) * 255 * border[sl]
    o = out[sl]
    w = tgt[..., None]
    o[..., :3] = np.where(w, fill[sl], o[..., :3])
    o[..., 3] = np.where(tgt, np.maximum(o[..., 3], na), o[..., 3])   # (tgt pixels were transparent: max = the fill)
    out[sl] = o
    rep[name] = int(tgt.sum())
Image.fromarray(out.clip(0, 255).astype(np.uint8)).save(f"{L}/face.png")
print(json.dumps({"refilled_px": rep}))
