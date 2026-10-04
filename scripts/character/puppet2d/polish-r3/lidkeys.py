"""r3 blink rebuild (judge r2 fix 4): cut the PAINTED mid-lid and closed-lid keys (keys/mid-0.png, keys/closed-0.png,
gpt-image-2 masked edits of c-front) into per-eye layers. No stretched smear: the half-lid and the closed lid are
painted lids with a real crease.
  lidmid{L,R}    opaque lid skin + lash down to the painted lash's lower edge, transparent in the opening (the live
                 sclera / iris show below it), the edit ellipse's border feathered into c-front's skin
  lidshut{L,R}   the whole closed eye, opaque, border feathered
Each layer is colour-matched to c-front on a ring just outside the edit ellipse (per-channel gain), so the feather
never shows a tone step. geom.json gets the rects and the mid lid's lash-bottom curve (rest px) per eye.
    python3 scripts/character/puppet2d/polish-r3/lidkeys.py
"""
import json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

K = "art/character/puppet2d/polish-r3/keys"
L = "art/character/puppet2d/polish-r3/layers"
front = np.asarray(Image.open("art/character/puppet2d/polish-r3/c-front.png").convert("RGB")).astype(np.float32)
mid = np.asarray(Image.open(f"{K}/mid-0.png").convert("RGB")).astype(np.float32)
shut = np.asarray(Image.open(f"{K}/closed-0.png").convert("RGB")).astype(np.float32)
H, W = front.shape[:2]
yy, xx = np.mgrid[0:H, 0:W]
g = json.load(open(f"{L}/geom.json"))
# the edit ellipses (gen-keys.mjs eyemask.png)
ELL = {"L": (340, 392, 488, 510), "R": (566, 380, 716, 502)}


def ell(b, shrink=0):
    cx, cy, rx, ry = (b[0] + b[2]) / 2, (b[1] + b[3]) / 2, (b[2] - b[0]) / 2 - shrink, (b[3] - b[1]) / 2 - shrink
    return ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2 <= 1


def save(name, rgb, a, pad=2):
    ys, xs = np.where(a > 0.004)
    x0, y0, x1, y1 = max(0, xs.min() - pad), max(0, ys.min() - pad), min(W, xs.max() + 1 + pad), min(H, ys.max() + 1 + pad)
    Image.fromarray(np.dstack([rgb.clip(0, 255), a * 255])[y0:y1, x0:x1].round().astype(np.uint8), "RGBA").save(f"{L}/{name}.png", optimize=True)
    return [int(x0), int(y0), int(x1), int(y1)]


def lum(c):
    return 0.299 * c[..., 0] + 0.587 * c[..., 1] + 0.114 * c[..., 2]


g.setdefault("lidKeys", {})
for s, b in ELL.items():
    inside = ell(b, 3)
    ring = ell(b, -6) & ~ell(b, 1)
    border = np.clip(ndi.distance_transform_edt(ell(b, 0)) / 9.0, 0, 1)   # 0 at the ellipse edge -> 1 9 px inside
    border = border * border * (3 - 2 * border)
    e = g["eyes"][s]
    xa, xb = e["x"]
    out = {}
    for key, img in (("mid", mid), ("shut", shut)):
        # colour match on the ring (outside the editable area the edit kept c-front, but its tone drifts slightly)
        gain = (front[ring].mean(0) + 1) / (img[ring].mean(0) + 1)
        im2 = img * gain[None, None, :]
        if key == "shut":
            a = border.copy()
            out["shut"] = save(f"lidshut{s}", im2, a)
        else:
            # lash bottom per column: last neutral-dark (lash) row below the lash's top, above the opening
            Lm = lum(img)
            R, B = img[..., 0], img[..., 2]
            lash = (Lm < 70) & (np.abs(R - B) < 30) & inside
            bot = np.full(W, np.nan)
            for x in range(b[0] + 4, b[2] - 4):
                ys = np.where(lash[:, x])[0]
                if len(ys) < 3:
                    continue
                # the lash band is the topmost run of lash pixels
                run_end = ys[0]
                for y in ys[1:]:
                    if y - run_end > 2:
                        break
                    run_end = y
                if run_end - ys[0] >= 2:
                    bot[x] = run_end + 1.0
            # across the iris the pupil (also near-black) merges with the lash: fit the lash bottom from the columns
            # either side of the iris (a quadratic, the lid edge is a smooth arc) and use it across the iris
            icx, icy, ir = e["iris"]
            xs_all = np.where(~np.isnan(bot))[0]
            okc = xs_all[np.abs(xs_all - icx) > ir + 3]
            okc = okc[(okc > xa + 2) & (okc < xb - 2)]
            top = np.full(W, np.nan)
            for x in xs_all:
                top[x] = np.where(lash[:, x])[0][0]
            tmed = float(np.median(bot[okc] - top[okc]))
            topS = ndi.gaussian_filter1d(np.interp(np.arange(W), xs_all, top[xs_all]), 1.5)
            over = (np.abs(np.arange(W) - icx) <= ir + 3) & (np.arange(W) >= xa) & (np.arange(W) <= xb)
            bot[over] = topS[over] + tmed
            print(s, "lash thickness", round(tmed, 1))
            xs = np.where(~np.isnan(bot))[0]
            bs = np.interp(np.arange(W), xs, bot[xs])
            bs = ndi.gaussian_filter1d(ndi.median_filter(bs, 5), 1.5)
            # opaque above the lash bottom (+0.5 px AA), only across the eye's opening span; outside it the lid layer is
            # the painted skin (opaque) so the lid continues to the corners
            cov = np.clip(bs[None, :] + 0.5 - yy, 0, 1)
            span = (xx >= xs.min()) & (xx <= xs.max())
            # below the lash and outside the opening (corners, lower lid) keep c-front's own surface: transparent
            # soft ends: the painted lid fades into the live lid over 8 px at each end of its span (a hard vertical cut
            # showed as a white notch in a squinted playful eye)
            endf = np.clip(np.minimum(xx - xs.min(), xs.max() - xx) / 8.0, 0, 1)
            a = border * np.where(span, cov, 0.0) * endf
            # above the lash: everywhere in the ellipse (crease, lid skin)
            a = np.maximum(a, border * (yy < bs[None, :] - 1) * ((xx < xs.min()) | (xx > xs.max())) * 0)
            out["mid"] = save(f"lidmid{s}", im2, a)
            out["midLash"] = {"x0": int(xa), "y": [round(float(bs[x]), 2) for x in range(xa, xb + 1)]}
            print(s, "mid lash bottom at iris x", round(float(bs[int(e["iris"][0])]), 1), "open top", e["top"][int(e["iris"][0]) - xa])
    g["lidKeys"][s] = out
    g["rects"][f"lidmid{s}"] = out["mid"]
    g["rects"][f"lidshut{s}"] = out["shut"]
json.dump(g, open(f"{L}/geom.json", "w"), indent=1)
print(json.dumps({k: {kk: vv for kk, vv in v.items() if kk != "midLash"} for k, v in g["lidKeys"].items()}))
