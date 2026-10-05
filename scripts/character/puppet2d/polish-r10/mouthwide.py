"""r4: a WIDER mouth-shell texture. The r4 visemes move the lip corners up to ~28 px (o / u at 0.6-0.7x width) and the
corner displacement must fade to zero inside the shell's OPAQUE skin; r3's patch (mouthshape.ELL rx 104, feather 12)
was opaque only to |s| ~ 1.15-1.2 of the r4 half-widths, so U / O drew a seam from the corners to the patch edge.
The texture is c-front's own pixels (verified identical), so widening it changes nothing at rest; the face layer's hole
(mouthshape.region) is unchanged.  -> layers/mouth_rest.png + geom rect
    python3 scripts/character/puppet2d/polish-r10/mouthwide.py"""
import json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
L = "art/character/puppet2d/polish-r10/layers"
H = W = 1024
ELL = (530, 627, 134, 60)
CORNERS = [(452, 582, 21), (608, 578, 21), (436, 584, 24), (624, 580, 24)]
FEATHER = 14.0
yy, xx = np.mgrid[0:H, 0:W]
cx, cy, rx, ry = ELL
m = ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2 <= 1
for x, y, r in CORNERS:
    m |= (xx - x) ** 2 + (yy - y) ** 2 <= r * r
d = ndi.distance_transform_edt(m)
a = np.clip(d / FEATHER, 0, 1)
a = a * a * (3 - 2 * a)
a = ndi.gaussian_filter(a.astype(np.float32), 1.0)
# never less than r3's patch alpha: the face layer's hole is cut with that alpha, and a thinner feather over it let the
# backdrop show through as light dots above the upper lip
import sys
sys.path.insert(0, "scripts/character/puppet2d/polish-r10")
import mouthshape
a = np.maximum(a, mouthshape.alpha(H, W))
cf = np.asarray(Image.open("art/character/puppet2d/polish-r10/c-front.png").convert("RGB")).astype(np.float32)
ys, xs = np.where(a > 0.004)
x0, y0, x1, y1 = int(xs.min()) - 1, int(ys.min()) - 1, int(xs.max()) + 2, int(ys.max()) + 2
y0 = max(y0, 555)   # never above r3's top (the nostrils)
rgba = np.dstack([cf, a[..., None] * 255])[y0:y1, x0:x1]
Image.fromarray(rgba.round().clip(0, 255).astype(np.uint8), "RGBA").save(f"{L}/mouth_rest.png", optimize=True)
g = json.load(open(f"{L}/geom.json"))
g["rects"]["mouth_rest"] = [x0, y0, x1, y1]
json.dump(g, open(f"{L}/geom.json", "w"), indent=1)
row = a[606]
print("rect", [x0, y0, x1, y1], "opaque (>0.98) on the lip line x", int(np.where(row > 0.98)[0].min()), "-", int(np.where(row > 0.98)[0].max()))
