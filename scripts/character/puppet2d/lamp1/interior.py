"""The mouth interior strip for lamp1: r8's 128 x 64 strip (rows 0-31 teeth, 32-47 cavity roof -> floor, 48-63 tongue)
recoloured to the flat palette sampled in the painted speak edit (rs/speak-g.png, 2026-10-10): cavity roof (66, 32, 34)
-> floor (118, 54, 42), tongue a muted rose (172, 88, 70), teeth a warm off-white. Per-texel variation of r8's strip is
kept as a ratio to its row mean, so the shading structure the gl.js interior shader expects is unchanged.
    python3 -I interior.py <out.webp>"""
import sys
import numpy as np
from PIL import Image
a = np.asarray(Image.open("/home/user/Taxila/public/face-puppet/r8/interior.webp").convert("RGB")).astype(np.float32)
o = a.copy()
def band(r0, r1, c0, c1):
    for r in range(r0, r1):
        t = (r - r0) / max(1, r1 - r0 - 1)
        tgt = np.array(c0) * (1 - t) + np.array(c1) * t
        m = a[r].mean(0) + 1e-3
        o[r] = np.clip(a[r] / m * tgt, 0, 255)
band(0, 32, (226, 212, 192), (214, 198, 176))     # teeth: warm off-white, a touch darker toward the gum line
band(32, 48, (66, 32, 34), (118, 54, 42))         # cavity: deep plum-brown roof to a warmer floor
band(48, 64, (172, 88, 70), (182, 96, 76))        # tongue: muted rose
Image.fromarray(o.round().astype(np.uint8)).save(sys.argv[1], "WEBP", lossless=True)
print("interior recoloured", sys.argv[1])
