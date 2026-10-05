"""r7 fix 1 (judge r6 blocking): the forehead hair spike. The `hair` layer's lower hairline above her right eye (viewer's
left, rest x 340-400, y 350-410) carries a hard, aliased triangular shard (a wisp tip from the painted fringe) that the
brow's outer tail hides at rest (brows draw UNDER hair). Any brow raise moves the tail away and exposes it. Owner proven
with ?dbg=tint (the shard tints with the hair layer, not the face, brow or lockbed).

Fix: per row, the hairline's true boundary is fitted (quadratic in y) from the clean rows above and below the shard; in
the shard rows every hair pixel right of the fitted contour is cut with a 1.4 px anti-aliased ramp (alpha only ever
LOWERED, never added), so the hairline is the hair shell's own smooth rest silhouette. The same scan runs on the
mirrored side (viewer's right) and reports, so a second spike would be seen.
    python3 scripts/character/puppet2d/polish-r8/hairline.py
"""
import json
import shutil
import os
import numpy as np
from PIL import Image

L = "art/character/puppet2d/polish-r8/layers"
g = json.load(open(f"{L}/geom.json"))
r = g["rects"]["hair"]
if not os.path.exists(f"{L}/hair.r6.png"):
    shutil.copy(f"{L}/hair.png", f"{L}/hair.r6.png")
im = np.asarray(Image.open(f"{L}/hair.r6.png").convert("RGBA")).astype(np.float32)
a = im[..., 3]


def bound(Y, xa, xb, side):
    """left-side hairline: the first hair->skin transition scanning right from xa (alpha 128 crossing, sub-px)."""
    row = a[Y - r[1], xa - r[0]:xb - r[0]]
    for i in range(1, len(row)):
        if (row[i - 1] >= 128) != (row[i] >= 128):
            f = (row[i - 1] - 128) / (row[i - 1] - row[i])
            return xa + i - 1 + f
    return None


def fix_side(y_clean, y_cut, xa, xb):
    ys, xs = [], []
    for Y in y_clean:
        b = bound(Y, xa, xb, "L")
        if b is not None:
            ys.append(Y); xs.append(b)
    c = np.polyfit(ys, xs, 2)
    res = np.abs(np.polyval(c, ys) - np.array(xs)).max()
    cut = 0
    for Y in y_cut:
        bx = np.polyval(c, Y)
        for X in range(int(bx) - 2, xb):
            d = X + 0.5 - bx                       # signed distance (px) right of the contour
            keep = np.clip(0.5 - d / 1.4, 0, 1)    # 1.4 px AA ramp
            j, i = Y - r[1], X - r[0]
            if keep < 1 and a[j, i] > 0:
                na = min(a[j, i], 255 * keep)
                if na < a[j, i] - 1:
                    cut += 1
                a[j, i] = na
    return {"fit_residual_px": round(float(res), 2), "pixels_cut": cut, "coef": [round(float(v), 5) for v in c]}


rep = {"left": fix_side(list(range(322, 351)) + list(range(410, 432)), range(349, 412), 300, 425)}
# report-only scan of the viewer's-right hairline (mirror side, brow R x 570-710): per-row hair->skin transitions;
# more than one transition in a row = a detached shard
multi = []
for Y in range(300, 420):
    row = a[Y - r[1], 560 - r[0]:760 - r[0]] >= 128
    tr = int(np.count_nonzero(row[1:] != row[:-1]))
    if tr > 2:
        multi.append(Y)
rep["right_rows_with_extra_transitions"] = multi
out = im.copy(); out[..., 3] = a
Image.fromarray(out.clip(0, 255).astype(np.uint8)).save(f"{L}/hair.png")
print(json.dumps(rep))
