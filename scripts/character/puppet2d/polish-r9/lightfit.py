"""r9 (judge r8 fix 1): the painted keys' LIGHT in rest space. Each rest point q of c-front is looked up in the painted
30-deg key through the fitted keyfield (q + D(q), denormalised: the same correspondence the r4 plate path used), so the
ratio key/c-front compares the SAME anatomical point and isolates the shading change the turn makes (geometry cancels).
Low-pass skin-only (normalised gaussian, sigma px). Prints a rest-space table and saves the maps as .npy for fitting.
    python3 lightfit.py [sigma=10]"""
import sys, json
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, map_coordinates
K = "art/character/puppet2d/polish-r9/keys/"
Y = json.load(open("art/character/puppet2d/polish-r9/pack/geom.json"))["yawKeys"]
sig = float(sys.argv[1]) if len(sys.argv) > 1 else 10
def lum(a): return 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]
def skin(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    return ((r > 0.5) & (r - b > 0.25) & (r - g > 0.1) & (g > 0.3) & (b < 0.6)).astype(np.float32)
C = np.asarray(Image.open("art/character/puppet2d/polish-r9/c-front.png").convert("RGB").resize((1024, 1024)), np.float32) / 255
yy, xx = np.mgrid[0:1024, 0:1024].astype(np.float32)
st, n = Y["grid"]["step"], Y["grid"]["n"]
out = {}
for side in ["R", "L"]:
    D = np.asarray(Y[side], np.float32)          # n x n x 2
    gx, gy = np.clip(xx / st, 0, n - 1.001), np.clip(yy / st, 0, n - 1.001)
    DX = map_coordinates(D[..., 0], [gy, gx], order=1); DY = map_coordinates(D[..., 1], [gy, gx], order=1)
    N = Y["norm"][side]
    px = (xx + DX - N["fcx"]) / N["s"] + N["kcx"]; py = (yy + DY - N["fe"]) / N["s"] + N["ke"]
    Kim = np.asarray(Image.open(K + f"yaw{side}30-0.png").convert("RGB"), np.float32) / 255
    W = np.stack([map_coordinates(Kim[..., c], [py, px], order=1) for c in range(3)], -1)
    m = skin(C) * skin(W)
    def lp(L): return gaussian_filter(L * m, sig) / np.maximum(gaussian_filter(m, sig), 1e-4)
    R = lp(lum(W)) / np.maximum(lp(lum(C)), 1e-3)
    ok = gaussian_filter(m, sig) > 0.6
    med = np.median(R[ok & (abs(xx - 530) < 150) & (abs(yy - 520) < 130)])
    R = np.where(ok, R / med, np.nan)
    out[side] = R
    print(f"side {side}: key/c-front at the same rest point (median {med:.3f}); + = features move screen-{'right' if side == 'R' else 'left'}")
    xs = list(range(370, 700, 25)); print("      " + " ".join(f"{x:5d}" for x in xs))
    for y in range(340, 720, 25):
        print(f"{y:5d} " + " ".join(("  .  " if np.isnan(R[y, x]) else f"{R[y, x]:5.2f}") for x in xs))
np.save("art/character/puppet2d/polish-r9/work/lightfit.npy", np.stack([out["R"], out["L"]]))
