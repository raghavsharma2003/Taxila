"""r4 teeth (judge r3 fix 2): the painted upper / lower teeth strips keep their COLOUR (painted shading and the faint
tooth separations), but their ragged alpha contour is replaced. The shader (gl.js FS_IN) draws each tooth row's free edge
from the painted contour's smooth fit (rows = 12.9 - 2.7 u^2 - 0.3 u^4, measured from layers/interior.png rows 0-15) with
an analytic, screen-space antialiased edge, so nothing shimmers frame to frame. Here: every teeth pixel becomes opaque,
dark specks left by the atlas cut (the gaps between teeth, lum < row median - 30) are filled from the row median, and the
rows past the painted edge are filled with the last clean row (the shader never samples past contour - 2 rows anyway).
    python3 scripts/character/puppet2d/polish-r4/interior-r4.py   (in place on layers/interior.png; keeps a .r3 copy)
"""
import os
import shutil
import numpy as np
from PIL import Image

P = "art/character/puppet2d/polish-r4/layers/interior.png"
if not os.path.exists(P + ".r3.png"):
    shutil.copy(P, P + ".r3.png")
a = np.asarray(Image.open(P + ".r3.png").convert("RGBA")).astype(np.float32)
lum = lambda c: 0.299 * c[..., 0] + 0.587 * c[..., 1] + 0.114 * c[..., 2]
u = np.linspace(-1, 1, a.shape[1])
edge = 12.9 - 2.7 * u ** 2 - 0.3 * u ** 4      # painted contour fit, rows from the anchored edge


def clean(rows, anchored_top):
    blk = a[rows].copy()                         # 16 x W x 4, straight alpha
    n = blk.shape[0]
    for x in range(blk.shape[1]):
        lim = int(np.floor(edge[x] - 2))         # last clean row index from the anchor
        for j in range(n):
            jj = j if anchored_top else n - 1 - j
            src = min(j, lim)
            ss = src if anchored_top else n - 1 - src
            if blk[ss, x, 3] < 128 or j > lim:
                # walk back to the nearest opaque row toward the anchor
                k = src
                while k > 0 and blk[(k if anchored_top else n - 1 - k), x, 3] < 128:
                    k -= 1
                ss = k if anchored_top else n - 1 - k
            blk[jj, x, :3] = a[rows][ss, x, :3]
    # specks: per row, pull dark outliers to the row median (keeps the faint separations, kills the gap pixels)
    for j in range(n):
        L = lum(blk[j])
        med = np.median(L)
        bad = L < med - 30
        if bad.any():
            mc = np.median(blk[j][~bad][:, :3], axis=0) if (~bad).any() else blk[j, :, :3].mean(0)
            blk[j, bad, :3] = mc
        # soften the separations a touch more so they read as painted shading, not cracks
        blk[j, :, :3] = 0.75 * blk[j, :, :3] + 0.25 * np.median(blk[j, :, :3], axis=0)
    # painted vertical shading kept exactly (row medians); the column detail is low-passed and halved, so the tooth
    # separations stay as soft painted shading and nothing high-frequency is left to alias at 1x
    from scipy.ndimage import gaussian_filter1d
    med = np.median(blk[..., :3], axis=1, keepdims=True)
    lo = gaussian_filter1d(blk[..., :3], 1.6, axis=1, mode="nearest")
    blk[..., :3] = med + 0.5 * (lo - med)
    blk[..., 3] = 255
    return blk


out = a.copy()
out[0:16] = clean(slice(0, 16), True)
out[16:32] = clean(slice(16, 32), False)
Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), "RGBA").save(P)
print("wrote", P)
