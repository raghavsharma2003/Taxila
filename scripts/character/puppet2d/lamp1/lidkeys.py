"""lamp1 lid keys, ported from polish-r8/lidkeys.py (its shipped path, P2D_MIDFROM=shut): cut the PAINTED closed-lid key
(rs/blink-g.png, the x-blink edit registered to the front: 0.1 px drift) into lidshut{L,R}, and build the ~0.62 mid key
FROM it (rj-p2d-mid-blink-06-still: a painted mid edit reads sleepy as a still; r8 compressed the shut key per column so
its lash lands on a smooth arc at 0.62 of the live opening). Colour matched to the front on a ring outside each ellipse.
    python3 -I lidkeys.py      (reads and updates <scratch>/layers/geom-layers.json -> layers/geom.json)"""
import json, os
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

S = "/tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/r4-asha"
L = f"{S}/layers"
front = np.asarray(Image.open(f"{S}/rs/front-g.png").convert("RGB")).astype(np.float32)
shut = np.asarray(Image.open(f"{S}/rs/blink-g.png").convert("RGB")).astype(np.float32)
H, W = front.shape[:2]
yy, xx = np.mgrid[0:H, 0:W]
g = json.load(open(f"{L}/geom-layers.json"))
ELL = {"L": (358, 372, 492, 454), "R": (560, 372, 694, 454)}
MID_CLOSE = 0.62
ARCH = 3.0

def ell(b, shrink=0):
    cx, cy, rx, ry = (b[0] + b[2]) / 2, (b[1] + b[3]) / 2, (b[2] - b[0]) / 2 - shrink, (b[3] - b[1]) / 2 - shrink
    return ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2 <= 1
def save(name, rgb, a, pad=2):
    ys, xs = np.where(a > 0.004)
    x0, y0, x1, y1 = max(0, xs.min() - pad), max(0, ys.min() - pad), min(W, xs.max() + 1 + pad), min(H, ys.max() + 1 + pad)
    Image.fromarray(np.dstack([rgb.clip(0, 255), a * 255])[y0:y1, x0:x1].round().astype(np.uint8), "RGBA").save(f"{L}/{name}.png", optimize=True)
    return [int(x0), int(y0), int(x1), int(y1)]
lum = lambda c: 0.299 * c[..., 0] + 0.587 * c[..., 1] + 0.114 * c[..., 2]

g["lidKeys"] = {}
for s, b in ELL.items():
    inside = ell(b, 3)
    ring = ell(b, -6) & ~ell(b, 1)
    border = np.clip(ndi.distance_transform_edt(ell(b, 0)) / 9.0, 0, 1); border = border * border * (3 - 2 * border)
    e = g["eyes"][s]; xa, xb = e["x"]
    gs = (front[ring].mean(0) + 1) / (shut[ring].mean(0) + 1)
    Sh = shut * gs[None, None, :]
    out = {"shut": save(f"lidshut{s}", Sh, border.copy())}
    # mid from shut: the closed key's lash (the bottom-most run of dark pixels per column) carried onto the target arc
    Ls = lum(Sh)
    dark = (Ls < 85) & inside
    sb = np.full(W, np.nan); st = np.full(W, np.nan)
    for x in range(b[0], b[2] + 1):
        ys = np.where(dark[:, x])[0]
        if len(ys) < 2: continue
        r1 = ys[-1]; r0 = r1
        for y in ys[::-1][1:]:
            if r0 - y > 2: break
            r0 = y
        if r1 - r0 >= 2: sb[x] = r1 + 1.0; st[x] = r0
    xs_ok = np.where(~np.isnan(sb))[0]
    sx0, sx1 = xs_ok.min(), xs_ok.max()
    lt = float(np.median((sb - st)[xs_ok])) + 1.0
    sbS = ndi.gaussian_filter1d(np.interp(np.arange(W), xs_ok, sb[xs_ok]), 1.2)
    et, eb = np.array(e["top"], float), np.array(e["bot"], float)
    xs_e = np.arange(xa, xb + 1)
    want = et + MID_CLOSE * (eb - et)
    m = (xs_e > xa + 0.1 * (xb - xa)) & (xs_e < xb - 0.1 * (xb - xa))
    cf = np.polyfit(xs_e[m], want[m], 2)
    tg = np.polyval(cf, np.arange(W).astype(float))
    uu = (np.arange(W) - (xa + xb) / 2) / ((xb - xa) / 2)
    tg = tg - ARCH * np.clip(1 - uu * uu, 0, 1)
    ease = np.clip(np.minimum(np.arange(W) - sx0, sx1 - np.arange(W)) / 14.0, 0, 1); ease = ease * ease * (3 - 2 * ease)
    tg = sbS + (tg - sbS) * ease
    Y0 = float(b[1])
    src_y = yy.astype(np.float32).copy()
    for x in range(sx0, sx1 + 1):
        ys = np.arange(H, dtype=np.float32)
        k = (sbS[x] - lt - Y0) / max(1.0, tg[x] - lt - Y0)
        sy = np.where(ys <= tg[x] - lt, Y0 + (ys - Y0) * k, ys + (sbS[x] - tg[x]))
        src_y[:, x] = np.where(ys < Y0, ys, sy)
    im2 = np.stack([ndi.map_coordinates(Sh[..., c], [src_y, xx.astype(np.float32)], order=1, mode="nearest") for c in range(3)], -1)
    cov = np.clip(tg[None, :] + 0.5 - yy, 0, 1)
    EXT = 16
    endf = np.clip(np.minimum(xx - (sx0 - EXT), (sx1 + EXT) - xx) / 6.0, 0, 1)
    a_mid = border * cov * endf * ((xx >= sx0 - EXT) & (xx <= sx1 + EXT))
    out["mid"] = save(f"lidmid{s}", im2, a_mid)
    out["midLash"] = {"x0": int(xa), "y": [round(float(tg[x]), 2) for x in range(xa, xb + 1)]}
    print(s, "mid-from-shut: lash", round(lt, 1), "px; lash bottom at iris", round(float(tg[int(e["iris"][0])]), 1),
          "opening", e["top"][int(e["iris"][0]) - xa], e["bot"][int(e["iris"][0]) - xa], "ring gain", gs.round(3))
    g["lidKeys"][s] = out
    g["rects"][f"lidmid{s}"] = out["mid"]
    g["rects"][f"lidshut{s}"] = out["shut"]
json.dump(g, open(f"{L}/geom.json", "w"), indent=1)
