"""r4b: clean the painted mid-lid key's lash bottom edge. The key's lash had a 1-2 px brown/orange fringe under it (the
edit's anti-aliasing against its dark opening, colour-gained to skin), which read as a second thin line under the
lash once the opening shows (MID_DEPTH 0.6). Per column: below the lowest lash-dark pixel, fringe pixels (mid
luminance) are recoloured to the lash colour with their alpha ramped down -> one clean antialiased dark edge.
Idempotent (keeps the original as <name>.pre-fringe.png and always works from it).
    python3 scripts/character/puppet2d/polish-r8/lidfringe.py"""
import os, shutil
import numpy as np
from PIL import Image
L = "art/character/puppet2d/polish-r8/layers"
for s in "LR":
    p = f"{L}/lidmid{s}.png"; o = f"{L}/lidmid{s}.pre-fringe.png"
    if not os.path.exists(o): shutil.copy(p, o)
    a = np.asarray(Image.open(o).convert("RGBA")).astype(np.float32)
    rgb, al = a[..., :3], a[..., 3] / 255
    lum = rgb @ np.array([0.299, 0.587, 0.114])
    dark = (lum < 75) & (al > 0.5)
    lash = rgb[dark].mean(0)
    H, W = al.shape
    n = 0
    for x in range(W):
        ys = np.where(dark[:, x])[0]
        if len(ys) == 0: continue
        yb = ys.max()
        for k, y in enumerate(range(yb + 1, min(H, yb + 4))):
            if al[y, x] < 0.02: break
            if lum[y, x] < 170:   # fringe, not lid skin (the opening below is transparent)
                rgb[y, x] = lash
                al[y, x] = al[y, x] * (0.55 if k == 0 else 0.2)
                n += 1
    Image.fromarray(np.dstack([rgb, al * 255]).clip(0, 255).round().astype(np.uint8), "RGBA").save(p, optimize=True)
    print(s, "fringe px", n, "lash", lash.round())
