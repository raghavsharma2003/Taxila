"""r4 METHOD CHANGE, turn (judge r3 fix 3): the painted 3/4 plates become runtime textures for a TRUE two-texture
keyform blend, restricted to the FACE SKIN (where the turn reads: turned nose and nose-bridge occlusion, far-cheek
compression, jaw). Hair and locks stay the warped frontal layers (a whole-head plate ghosted the painted locks next to the
live, sprung ones, and the hair outline doubled mid-dissolve: tposes0).
Per plate (keys/yawL-0, keys/yawR-2):
  1. matte = c-front's face-layer alpha mapped FORWARD through the key field into plate px (q -> denorm(q + D(q)),
     splatted on a 0.5 px grid), eroded 16 px + feathered (sigma 6) so the outer silhouette stays the frontal-warped one
  2. the plate's own dark locks inside that matte are inpainted (OpenCV Telea) so they cannot ghost the live locks
  3. the skin colour is matched to c-front (per-channel mean/std over the face skin of both): the live eyes / brows /
     mouth (and their skin margins) sit in holes over it, so a tone step would show as patches
-> layers/plateL.png / plateR.png + geom.json "plates" = {L|R: {rect}} (normalisation in yawKeys.norm).
    python3 scripts/character/puppet2d/polish-r5/plates.py"""
import json
import numpy as np
import cv2
from PIL import Image
from scipy import ndimage as ndi

K = "art/character/puppet2d/polish-r5/keys"
L = "art/character/puppet2d/polish-r5/layers"
g = json.load(open(f"{L}/geom.json"))
N = g["yawKeys"]["norm"]
fr = g["rects"]["face"]
face = np.asarray(Image.open(f"{L}/face.png").convert("RGBA")).astype(np.float32)
fa = face[..., 3] / 255.0
cf = np.asarray(Image.open("art/character/puppet2d/polish-r5/c-front.png").convert("RGB")).astype(np.float32)
lum = lambda c: 0.299 * c[..., 0] + 0.587 * c[..., 1] + 0.114 * c[..., 2]


def skin_stats(img, mask):
    px = img[mask]
    return px.mean(0), px.std(0)


g["plates"] = {}
# holes (rest space): rounded rectangles where the LIVE eyes / brows / mouth draw; shared with rig.js (geom.plates.holes)
R_ = g["rects"]
holes = []
for sd in "LR":
    ns = [R_[n + sd] for n in ("sclera", "lid", "lower", "lidmid", "lidshut") if n + sd in R_]
    x0, y0 = min(r[0] for r in ns) - 4, min(r[1] for r in ns) - 4
    x1, y1 = max(r[2] for r in ns) + 4, max(r[3] for r in ns) + 2
    # the lash flick side gets 8 px more
    if sd == "L": x0 -= 8
    else: x1 += 8
    holes.append({"c": [(x0 + x1) / 2, (y0 + y1) / 2], "h": [(x1 - x0) / 2, (y1 - y0) / 2], "r": 0.45 * min(x1 - x0, y1 - y0) / 2, "f": 12})
    b = R_["brow" + sd]
    bx0, by0, bx1, by1 = b[0] - 6, b[1] - 24, b[2] + 6, b[3] + 4
    holes.append({"c": [(bx0 + bx1) / 2, (by0 + by1) / 2], "h": [(bx1 - bx0) / 2, (by1 - by0) / 2], "r": 0.45 * min(bx1 - bx0, by1 - by0) / 2, "f": 12})


def hole_d(x, y, h):
    qx = np.abs(x - h["c"][0]) - (h["h"][0] - h["r"]); qy = np.abs(y - h["c"][1]) - (h["h"][1] - h["r"])
    return np.hypot(np.maximum(qx, 0), np.maximum(qy, 0)) + np.minimum(np.maximum(qx, qy), 0) - h["r"]


def sstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)


# the bindi: a tiny hole (the plate's hand-read bindi is a few px off; it ghosted at small yaw)
holes.append({"c": [525.0, 354.0], "h": [22.0, 22.0], "r": 21.0, "f": 10})
src_kf = open("scripts/character/puppet2d/polish-r5/keyfield.py").read()
_ns = {}
exec(src_kf[src_kf.index("LM = {"):src_kf.index("FILES =")], _ns)
LMk = _ns["LM"]
import os as _os
if _os.path.exists(f"{K}/lmR-r4.json"):
    _m = json.load(open(f"{K}/lmR-r4.json"))
    for _k in LMk:
        LMk[_k][2] = tuple(_m[_k])
if _os.environ.get("P2D_KEY30", "1") == "1":
    _l, _r = json.load(open(f"{K}/lm30-L.json")), json.load(open(f"{K}/lm30-R.json"))
    for _k in LMk:
        LMk[_k][1] = tuple(_l[_k]); LMk[_k][2] = tuple(_r[_k])
MOUTH = {"c": [530, 615], "h": [96, 52], "r": 40, "f": 12}   # static stand-in for the colour band only (runtime hole is live)
KEYS = (("L", "yawL30-0"), ("R", "yawR30-0")) if __import__("os").environ.get("P2D_KEY30", "1") == "1" else (("L", "yawL-0"), ("R", "yawR-2"))
for side, f in KEYS:
    im = np.asarray(Image.open(f"{K}/{f}.png").convert("RGB")).astype(np.float32)
    H, W = im.shape[:2]
    D = np.array(g["yawKeys"][side], np.float32)        # 33 x 33 x 2, step 32
    n = N[side]
    ys, xs = np.mgrid[fr[1]:fr[3]:0.5, fr[0]:fr[2]:0.5]
    gx, gy = xs / 32.0, ys / 32.0
    dx = ndi.map_coordinates(D[..., 0], [gy, gx], order=1, mode="nearest")
    dy = ndi.map_coordinates(D[..., 1], [gy, gx], order=1, mode="nearest")
    px = (xs + dx - n["fcx"]) / n["s"] + n["kcx"]
    py = (ys + dy - n["fe"]) / n["s"] + n["ke"]
    a = fa[(ys - fr[1]).astype(int), (xs - fr[0]).astype(int)]
    M = np.zeros((H, W), np.float32)
    ix, iy = np.clip(np.round(px).astype(int), 0, W - 1), np.clip(np.round(py).astype(int), 0, H - 1)
    np.maximum.at(M, (iy, ix), a)
    M = ndi.grey_closing(M, size=3)
    hard = M > 0.5
    hard = ndi.binary_erosion(hard, iterations=34)
    # r5 (judge r4 fix 1): a 40-60 px feather (sigma 13 ~ a 52 px 10-90 ramp) instead of r4's ~15 px: the near-cheek
    # plate edge was a visible vertical shading break; across a wide band, with the band colour transfer below, the
    # plate's turned shading fades into the frontal-warped skin with no step
    m = ndi.gaussian_filter(hard.astype(np.float32), 13.0)   # the outer ~28 px stay the frontal-warped silhouette (the plate's inpainted locks / earring smudged there)
    # 2. locks: dark strands in the outer band of the face region (the eyes / brows / nostrils / bindi are interior)
    dist = ndi.distance_transform_edt(M > 0.5)
    dark = (lum(im) < 95) & (M > 0.5) & (dist < 70)
    # keep dark interior features out of the lock mask: anything whose blob does not touch the outer band edge
    lab, k = ndi.label(dark)
    keep = np.zeros_like(dark)
    for i in range(1, k + 1):
        b = lab == i
        if (dist[b] < 12).any() and b.sum() > 30:
            keep |= b
    lockm = ndi.binary_dilation(keep, iterations=3)
    # the plate's own brows go too (the live brows draw in their holes; a plate brow edge peeked out as a speck)
    ki = 1 if side == "L" else 2
    for a_, b_ in (("browL_out", "browL_in"), ("browR_in", "browR_out")):
        (xa_, ya_), (xb_, yb_) = LMk[a_][ki], LMk[b_][ki]
        bx0, bx1 = int(min(xa_, xb_) - 22), int(max(xa_, xb_) + 22)
        by0, by1 = int(min(ya_, yb_) - 24), int(max(ya_, yb_) + 16)
        sub = np.zeros_like(lockm); sub[by0:by1, bx0:bx1] = True
        lockm |= ndi.binary_dilation(sub & (lum(im) < 120), iterations=3)
    # and the plate's bindi (its hand-read position is a few px off: a crescent ghost at small yaw); the live one shows
    bx_, by_ = LMk["bindi"][ki]
    sub = np.zeros_like(lockm); sub[int(by_ - 18):int(by_ + 18), int(bx_ - 18):int(bx_ + 18)] = True
    lockm |= ndi.binary_dilation(sub & (lum(im) < 140), iterations=3)
    im8 = im.clip(0, 255).astype(np.uint8)
    inp = cv2.inpaint(im8[..., ::-1].copy(), (lockm * 255).astype(np.uint8), 7, cv2.INPAINT_TELEA)[..., ::-1].astype(np.float32)
    im = np.where(lockm[..., None], inp, im)
    # 3a. the frontal reference in plate px: c-front's colour splatted through the same map, with the rig's far-side
    # shade at the key (shadeFace: 0.16 s^2 from the centre line to the far edge) - what the holes will show
    cfs = cf[ys.astype(int), xs.astype(int)]
    sgn = 1 if side == "R" else -1
    sx = np.clip(((xs - 530) * sgn) / 200.0, 0, 1)
    cfs = cfs * (1 - 0.16 * sx * sx)[..., None]
    REF = np.zeros((H, W, 3), np.float32); CNT = np.zeros((H, W), np.float32)
    np.add.at(REF, (iy, ix), cfs); np.add.at(CNT, (iy, ix), 1)
    # band weight around the holes (rest space -> plate px): 1 inside / near a hole, 0 beyond ~40 px
    dmin = np.full(xs.shape, 1e9, np.float32)
    for h in holes + [MOUTH]:
        dmin = np.minimum(dmin, hole_d(xs, ys, h))
    bw = 1 - sstep(0, 40, dmin)
    BW = np.zeros((H, W), np.float32); np.maximum.at(BW, (iy, ix), bw)
    BW = ndi.gaussian_filter(BW, 4)
    # r4b: and along the matte's own border (the outer 34 px): there the plate fades into the frontal-warped skin, which
    # on the near side is stretched and lit differently - a soft seam from the ear to the jaw at the strong key
    dm = ndi.distance_transform_edt(m > 0.02)
    BW = np.maximum(BW, 1 - np.clip((dm - 6) / 70.0, 0, 1))   # r5: the transfer covers the whole wide feather
    # 3b. global skin colour match (skin = bright, inside, away from the features)
    sk_p = (m > 0.95) & (lum(im) > 110) & ~lockm
    sk_f = np.zeros(cf.shape[:2], bool)
    sk_f[fr[1]:fr[3], fr[0]:fr[2]] = (fa > 0.98)
    sk_f &= lum(cf) > 110
    mp, sp = skin_stats(im, sk_p); mf, sf = skin_stats(cf, sk_f)
    im = (im - mp) * (sf / sp) + mf
    # 3c. low-frequency colour transfer IN THE BAND only: blur(ref) / blur(plate) (normalised convolution over the
    # face skin), so the hole edges carry no tone step while the plate keeps its own turned shading elsewhere
    valid = (CNT > 0) & (M > 0.5) & (lum(im) > 90)
    REFm = np.where(CNT[..., None] > 0, REF / np.maximum(CNT[..., None], 1), 0)
    sg = 9.0
    wv = ndi.gaussian_filter(valid.astype(np.float32), sg) + 1e-4
    lr = np.stack([ndi.gaussian_filter(REFm[..., c] * valid, sg) for c in range(3)], -1) / wv[..., None]
    lp = np.stack([ndi.gaussian_filter(im[..., c] * valid, sg) for c in range(3)], -1) / wv[..., None]
    ratio = np.clip(lr / np.maximum(lp, 1), 0.75, 1.3)
    im = im * (1 + BW[..., None] * (ratio - 1))
    print(side, "band ratio mean", ratio[BW > 0.5].mean(0).round(3))
    print(side, "skin mean plate", mp.round(1), "-> c-front", mf.round(1), "locks px", int(lockm.sum()))
    rows = np.where(m.max(1) > 0.002)[0]; cols = np.where(m.max(0) > 0.002)[0]
    x0, y0, x1, y1 = int(cols.min()) - 2, int(rows.min()) - 2, int(cols.max()) + 3, int(rows.max()) + 3
    rgba = np.dstack([im, m[..., None] * 255])[y0:y1, x0:x1]
    al = rgba[..., 3] > 128
    idx = ndi.distance_transform_edt(~al, return_distances=False, return_indices=True)
    rgba[..., :3] = rgba[..., :3][idx[0], idx[1]]
    Image.fromarray(rgba.clip(0, 255).astype(np.uint8), "RGBA").save(f"{L}/plate{side}.png")
    Image.fromarray((lockm * 255).astype(np.uint8)).save(f"{K}/plate-lockmask-{side}.png")
    g["plates"][side] = {"rect": [x0, y0, x1, y1]}
    print(side, f, "rect", [x0, y0, x1, y1])
g["plates"]["holes"] = holes
json.dump(g, open(f"{L}/geom.json", "w"), indent=1)
