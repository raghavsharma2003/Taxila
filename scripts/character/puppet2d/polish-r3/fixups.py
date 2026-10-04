"""r3 layer fix-ups found by the full-size artefact battery (battery.sh), applied to the cut layers after layers.py.
Idempotent on a fresh copy of the r2 layers (it reads layers-r2/ and writes layers/).
  1. bun under the edges above it: where the face, the neck/kurta or the right lock has a partial-alpha edge band and the
     knot is beneath it, the knot is opaque. The knot's own matte against those layers left a 0.5-0.7 alpha trough
     exactly under their edges: when an expression or a roll slid the jaw a pixel, the backdrop showed through as a
     light (teal-on-teal) line along the jaw and the neck (judge r2 item 3, "ragged bun underside").
    python3 scripts/character/puppet2d/polish-r3/fixups.py
"""
import json
import os
import shutil
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

L = "art/character/puppet2d/polish-r3/layers"
SRC = "art/character/puppet2d/polish-r2/layers"
g = json.load(open(f"{L}/geom.json"))
g_src = json.load(open(f"{SRC}/geom.json"))


def load(n, src=SRC):
    r = (g_src if src == SRC else g)["rects"][n]
    im = np.asarray(Image.open(f"{src}/{n}.png").convert("RGBA")).astype(np.float32)
    full = np.zeros((1024, 1024, 4), np.float32)
    full[r[1]:r[3], r[0]:r[2]] = im
    return full


def save(n, full):
    a = full[..., 3]
    ys, xs = np.where(a > 1)
    x0, y0, x1, y1 = max(0, xs.min() - 2), max(0, ys.min() - 2), min(1024, xs.max() + 3), min(1024, ys.max() + 3)
    Image.fromarray(full[y0:y1, x0:x1].clip(0, 255).round().astype(np.uint8), "RGBA").save(f"{L}/{n}.png", optimize=True)
    g["rects"][n] = [int(x0), int(y0), int(x1), int(y1)]


report = {}
# start every run from the r2 cut for the layers this script edits in place (idempotent)
for _n in ("face", "lockbed"):
    shutil.copy(f"{SRC}/{_n}.png", f"{L}/{_n}.png")
    g["rects"][_n] = g_src["rects"][_n]
# ---- 1. under-layers opaque beneath the upper layers' edge bands (never where c-front shows the backdrop: that would
# put a dark fringe on the silhouette at rest)
cf = np.asarray(Image.open("art/character/puppet2d/polish-r3/c-front.png").convert("RGB")).astype(np.float32)
R_, G_, B_ = cf[..., 0], cf[..., 1], cf[..., 2]
lum = 0.299 * R_ + 0.587 * G_ + 0.114 * B_
bgc = (lum > 205) & (B_ > 150) & (R_ > 235) & ((R_ - B_) < 80)
nobg = ~ndi.binary_dilation(bgc, iterations=2)
ORDER = ["hairback", "bun", "body", "ears", "face", "lockbed", "hair", "lockL", "lockR"]
PLAN = {"hairback": (10, ["bun", "body", "ears", "face", "hair", "lockL", "lockR"]),
        "bun": (10, ["body", "ears", "face", "lockR"]),
        "body": (4, ["ears", "face", "lockL", "lockR"]),
        "ears": (4, ["face", "hair", "lockL", "lockR"])}
cache = {}
def get(n):
    if n not in cache:
        cache[n] = load(n)
    return cache[n]
for low, (rad, ups) in PLAN.items():
    X = get(low)
    ax = X[..., 3] / 255
    hull = ndi.binary_fill_holes(ndi.binary_closing(ax > 0.3, iterations=4))
    over = np.zeros_like(hull)
    for u in ups:
        over |= get(u)[..., 3] / 255 > 0.02
    zone = over & ndi.binary_dilation(hull, iterations=rad) & nobg
    solid = ax > 0.97
    idx = ndi.distance_transform_edt(~solid, return_distances=False, return_indices=True)
    ext = X[..., :3][idx[0], idx[1]]
    raise_ = zone & (ax < 0.97)
    X[..., :3] = np.where(raise_[..., None], ext, X[..., :3])
    X[..., 3] = np.where(zone, 255, X[..., 3])
    report[low + "_raised_px"] = int(raise_.sum())
    save(low, X)

# ---- 2. left brow tail (judge r2: "brow-tail fragment and light seam under the hair strand", thinking / surprise).
# The tail runs under the hair strand in c-front, so it was never painted; r2 extrapolated it per column (a stair-cut
# underside and a detached speck). The right brow is complete and clean: mirror it, fit it to the left brow's visible
# part (scale + translation + rotation, least squares on the alpha), and use it for the tail; the visible part stays
# c-front's own pixels, blended across 8 px. The brow then extends fully under the hair mask: no end, no fragment.
from scipy.optimize import minimize
bl, br = load("browL"), load("browR")
al = bl[..., 3] / 255
vis = (al > 0.5) & (np.arange(1024)[None, :] > 408)
brm = br[:, ::-1].copy()                                   # mirrored about x = 511.5
def warp(img, p):
    import cv2
    s_, th, tx, ty = p
    c, sn = np.cos(th), np.sin(th)
    cx, cy = 440.0, 365.0
    M = np.array([[s_ * c, -s_ * sn, cx - s_ * (c * cx - sn * cy) + tx], [s_ * sn, s_ * c, cy - s_ * (sn * cx + c * cy) + ty]], np.float32)
    return cv2.warpAffine(img, M, (1024, 1024), flags=cv2.INTER_LINEAR)
ys, xs = np.where(brm[..., 3] > 128)
x0 = (np.where(al > 0.5)[1]).mean(); y0 = (np.where(al > 0.5)[0]).mean()
def cost(p):
    w = warp(brm[..., 3], [p[0], p[1], p[2] + (x0 - xs.mean()), p[3] + (y0 - ys.mean())]) / 255
    return float(((w - al) ** 2 * vis).sum() + 0.3 * ((w > 0.5) & (al < 0.1) & (np.arange(1024)[None, :] > 408)).sum())
best = None
for th0 in (-0.1, 0.0, 0.1):
    r_ = minimize(cost, [1.0, th0, 0, 0], method="Nelder-Mead", options={"maxiter": 600, "xatol": 0.01, "fatol": 0.5})
    if best is None or r_.fun < best.fun: best = r_
p = [best.x[0], best.x[1], best.x[2] + (x0 - xs.mean()), best.x[3] + (y0 - ys.mean())]
fit = np.dstack([warp(brm[..., c], p) for c in range(4)])
report["browL_fit"] = [round(float(v), 3) for v in p]
X = np.arange(1024)[None, :]
wv = np.clip((X - 404) / 22.0, 0, 1)                         # 1 = c-front's own visible brow
new = bl * wv[..., None] + fit * (1 - wv[..., None])
# only the brow's own main component (no detached specks)
lab_, n_ = ndi.label(new[..., 3] > 8)
if n_ > 1:
    sz_ = ndi.sum(new[..., 3] > 8, lab_, range(1, n_ + 1))
    keep = ndi.binary_dilation(lab_ == 1 + int(np.argmax(sz_)), iterations=1)
    new[..., 3] *= keep
save("browL", new)
# browR: main component only (a stray dark speck rode along with the brow near its tail)
lab_, n_ = ndi.label(br[..., 3] > 8)
if n_ > 1:
    sz_ = ndi.sum(br[..., 3] > 8, lab_, range(1, n_ + 1))
    br[..., 3] *= ndi.binary_dilation(lab_ == 1 + int(np.argmax(sz_)), iterations=1)
    report["browR_specks_removed"] = int(n_ - 1)
save("browR", br)

# ---- 4. the face under the brows (judge r2: "dark speck near the right brow tail"): the face's membrane fill kept a
# few dark brow-edge pixels just outside the brow cut (704,384 at the right tail; 367-372,387-390 at the left). They sit
# under the brow at rest and show the moment the brow lifts. Within 8 px of either brow, any pixel darker than its
# 11 px median by > 18 takes the median colour.
fc = load("face", L)
zoneb = np.zeros((1024, 1024), bool)
for n in ("browL", "browR"):
    zoneb |= ndi.binary_dilation(load(n, L)[..., 3] > 10, iterations=8)
lum_f = 0.299 * fc[..., 0] + 0.587 * fc[..., 1] + 0.114 * fc[..., 2]
medc = np.dstack([ndi.median_filter(fc[..., c], 11) for c in range(3)])
lum_m = 0.299 * medc[..., 0] + 0.587 * medc[..., 1] + 0.114 * medc[..., 2]
dk = zoneb & (lum_f < lum_m - 18) & (fc[..., 3] > 128)
dk[330:370, 505:550] = False                                 # the bindi is meant to be dark
fc[..., :3] = np.where(dk[..., None], medc, fc[..., :3])
report["face_specks_px"] = int(dk.sum())
save("face", fc)

# ---- 3. rest consistency (judge r2: "skin-coloured overscan triangles beside both earrings at the jaw"). The ear's
# under-lock fill and the lock bed were visible at REST in a few spots where the lock's cut does not cover them (a
# triangle under each lobe, a straight-edged panel beside the right stud). Composite the rest pose in Python, and
# wherever an under-fill layer is the visible top layer and the composite departs from c-front, clear that layer there.
def full_of(n):
    r = g["rects"][n]
    im = np.asarray(Image.open(f"{L}/{n}.png").convert("RGBA")).astype(np.float32) / 255
    f = np.zeros((1024, 1024, 4), np.float32); f[r[1]:r[3], r[0]:r[2]] = im
    return f
ORDER_REST = ["hairback", "bun", "body", "ears", "face", "browL", "browR", "mouth_rest", "lockbed", "hair", "lockL", "lockR"]
FIXABLE = {"ears", "lockbed", "body", "bun", "hairback"}
ref = cf / 255
def comp(F, skip=None):
    out = np.zeros((1024, 1024, 3), np.float32) + np.array([251.4, 229.4, 188.6]) / 255
    for n in ORDER_REST:
        if n == skip: continue
        a_ = F[n][..., 3:4]
        out = out * (1 - a_) + F[n][..., :3] * a_
    return out
for it in range(2):
    F = {n: full_of(n) for n in ORDER_REST}
    err = np.abs(comp(F) - ref).max(2)
    changed = 0
    gold = (ref[..., 0] > 0.6) & (ref[..., 1] > 0.45) & (ref[..., 2] < 0.4) & (ref[..., 0] - ref[..., 2] > 0.35)
    for n in ["face", "lockbed"]:
        errw = np.abs(comp(F, n) - ref).max(2)
        bad = (err > 0.07) & (errw < err - 0.04)          # clearing the layer here brings the pixel back to c-front
        bad[380:520, 330:720] = False; bad[550:700, 420:640] = False
        bad &= ~ndi.binary_dilation(gold, iterations=2)
        if n == "face":                                    # the face only around the lobes (the jaw-side chips)
            zone = np.zeros_like(bad); zone[535:605, 295:355] = True; zone[505:585, 715:770] = True
            bad &= zone
        lab_, n_ = ndi.label(bad)
        if n_:
            sz_ = ndi.sum(bad, lab_, range(1, n_ + 1))
            bad = np.isin(lab_, 1 + np.where(sz_ >= 3)[0])
        bad = ndi.binary_dilation(bad, iterations=1) & (F[n][..., 3] > 0) & (errw <= err + 0.01) & ~ndi.binary_dilation(gold, iterations=2)
        if bad.sum():
            X = load(n, L)
            X[..., 3] = np.where(bad, 0, X[..., 3])
            save(n, X)
            changed += int(bad.sum())
            report[f"rest_fix_{n}_it{it}"] = int(bad.sum())
    if not changed:
        break

# ---- 6. the hair strand over the left brow tail: r2 gave the hair a 2 px brow-shaped overscan there (to hide a
# conflation line at rest). With the brow now continuous under the strand, that overscan is a dark fin that the lifted
# brow leaves behind (surprise / thinking). Re-cut the strand's edge in that zone as an exact AA line (layers.py's
# strand_x, read by eye at 4x), colour = the strand's own solid colour.
shutil.copy(f"{SRC}/hair.png", f"{L}/hair.png"); g["rects"]["hair"] = g_src["rects"]["hair"]
hr = load("hair", L)
yy_, xx_ = np.mgrid[0:1024, 0:1024]
strand_x = 372.5 + (387 - yy_) * 25.0 / 36.0
zone6 = (yy_ >= 330) & (yy_ <= 398) & (xx_ >= 355) & (xx_ <= 420)
cov6 = np.clip(strand_x + 0.5 - xx_, 0, 1) * 255
newa = np.where(zone6, np.minimum(hr[..., 3], np.maximum(cov6, np.where(xx_ < strand_x - 2, hr[..., 3], 0))), hr[..., 3])
report["hair_fin_px"] = int(((hr[..., 3] - newa) > 20).sum())
hr[..., 3] = newa
save("hair", hr)

# ---- 5. brow centrelines for the thickness-preserving ribbon (rig.js browOffset): alpha-weighted centre per column
for n in ("browL", "browR"):
    B = load(n, L)[..., 3] / 255
    xs_ = np.where(B.max(0) > 0.3)[0]
    yv = np.arange(1024)[:, None]
    cl = (B * yv).sum(0) / np.maximum(B.sum(0), 1e-3)
    cl = ndi.gaussian_filter1d(np.interp(np.arange(1024), xs_, cl[xs_]), 3)
    g["brows"][n[-1]]["cl"] = {"x0": int(xs_.min()), "y": [round(float(cl[x]), 2) for x in range(xs_.min(), xs_.max() + 1)]}
    g["brows"][n[-1]]["x"] = [int(xs_.min()), int(xs_.max())]

json.dump(g, open(f"{L}/geom.json", "w"), indent=1)
print(report)
