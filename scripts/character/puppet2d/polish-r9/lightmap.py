"""r9 (judge r8 fix 1): low-frequency SKIN luminance ratio, painted 30-deg key (normalised into c-front's frame) over the
rig's yaw render, so the yaw relight is fitted to the painting's light, not guessed. Skin-only normalised blur (sigma px),
then ratio key/rig, normalised by the median over the face. Prints a coarse table (rest-space x,y) and writes a heatmap.
    python3 lightmap.py <posedir> <out.jpg> [sigma=14]"""
import sys, json
import numpy as np
from PIL import Image, ImageFilter
K = "art/character/puppet2d/polish-r9/keys/"
g = json.load(open("art/character/puppet2d/polish-r9/pack/geom.json"))["yawKeys"]["norm"]
def normkey(f, n):
    im = Image.open(K + f).convert("RGB"); s = n["s"]
    return im.transform((1024, 1024), Image.AFFINE, (1 / s, 0, n["kcx"] - n["fcx"] / s, 0, 1 / s, n["ke"] - n["fe"] / s), Image.BICUBIC)
def skinL(im, sig):
    a = np.asarray(im).astype(np.float32) / 255
    r, gg, b = a[..., 0], a[..., 1], a[..., 2]
    L = 0.299 * r + 0.587 * gg + 0.114 * b
    m = ((r > 0.55) & (r < 0.98) & (gg > 0.33) & (gg < 0.72) & (b > 0.15) & (b < 0.55) & (r - b > 0.3) & (r - gg > 0.12)).astype(np.float32)
    from scipy.ndimage import gaussian_filter
    def bl(x): return gaussian_filter(x, sig)
    num, den = bl(L * m), bl(m)
    return num / np.maximum(den, 1e-4), den, m
d, out = sys.argv[1], sys.argv[2]
sig = float(sys.argv[3]) if len(sys.argv) > 3 else 14
for side, rig, key in [("R", "yaw_p20.png", "yawR30-0.png"), ("L", "yaw_m20.png", "yawL30-0.png")]:
    A, dA, mA = skinL(Image.open(d + "/" + rig).convert("RGB"), sig)
    B, dB, mB = skinL(normkey(key, g[side]), sig)
    ok = (dA > 0.5) & (dB > 0.5) & (mA > 0) & (mB > 0)
    R = np.where(ok, B / np.maximum(A, 1e-3), np.nan)
    med = np.nanmedian(R[380:700, 380:700])
    R = R / med
    print(f"side {side} median {med:.3f}  ratio key/rig (rows y, cols x):")
    xs = list(range(380, 720, 30)); print("      " + " ".join(f"{x:5d}" for x in xs))
    for y in range(340, 720, 30):
        print(f"{y:5d} " + " ".join(("  .  " if np.isnan(R[y, x]) else f"{R[y, x]:5.2f}") for x in xs))
    hm = np.nan_to_num((R - 1) * 4 + 0.5, nan=0.5).clip(0, 1)
    rgb = np.stack([hm, 1 - abs(hm - 0.5) * 2, 1 - hm], -1)
    Image.fromarray((rgb * 255).astype(np.uint8)).crop((290, 300, 810, 760)).save(out.replace(".jpg", f"-{side}.jpg"))
