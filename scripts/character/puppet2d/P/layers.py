"""P1-P3 for arm P: cut c-front into registered layers, complete hidden regions, write layer PNGs + rig geometry.

    python3 scripts/character/puppet2d/P/layers.py

Every layer is in c-front pixel space (1024^2), so the rest pose is pixel-registered by construction. Hidden regions
(behind the hair, under the features, behind the chin) are completed by a pull-push membrane fill from the layer's own
visible pixels: Memoji skin, hair and cloth are smooth fields, so a membrane fill reads as the same material (no image
spend). Outer edges are de-haloed: alpha comes from the soft mask, colour from the eroded interior extended outward.

Output: art/character/puppet2d/P/layers/<id>.png (cropped RGBA) + art/character/puppet2d/P/layers/geom.json.
"""
import json
import os
import numpy as np
import cv2
from PIL import Image
from scipy import ndimage as ndi

SRC = "art/character/puppet2d/P/c-front.png"
OUT = "art/character/puppet2d/P/layers"
WORK = "art/character/puppet2d/P/work"
os.makedirs(OUT, exist_ok=True)
im = np.asarray(Image.open(SRC).convert("RGB")).astype(np.float32)
H, W = im.shape[:2]
R, G, B = im[..., 0], im[..., 1], im[..., 2]
lum = 0.299 * R + 0.587 * G + 0.114 * B
yy, xx = np.mgrid[0:H, 0:W]

GEOM = {
    "jaw": [(322, 470), (326, 520), (338, 565), (356, 605), (380, 640), (410, 668), (450, 691), (490, 705), (530, 711),
            (570, 705), (603, 691), (640, 662), (675, 628), (705, 590), (726, 545), (736, 500), (738, 460)],
    "face_top": [(738, 420), (700, 300), (600, 215), (530, 200), (450, 215), (360, 300), (322, 420)],
    "earL": [(250, 430), (305, 430), (318, 545), (334, 556), (338, 598), (300, 602), (280, 578), (250, 540)],
    "earR": [(745, 420), (808, 420), (808, 548), (788, 588), (748, 592), (738, 560)],
    "lockL": [(278, 440), (318, 440), (330, 560), (320, 640), (338, 700), (322, 730), (296, 730), (300, 690), (282, 600), (284, 520)],
    "lockR": [(728, 395), (760, 395), (788, 520), (792, 620), (790, 705), (770, 705), (762, 640), (742, 560), (732, 480)],
    "bun": [(600, 575), (700, 560), (760, 600), (765, 700), (720, 745), (640, 745), (600, 700)],
    "browLpoly": [(371, 361), (400, 348), (430, 344), (452, 342), (467, 345), (476, 354), (478, 368), (470, 375), (450, 375),
                  (430, 377), (405, 380), (388, 384), (371, 390)],
    "browRbox": (566, 325, 712, 392),
    "eyeL": (346, 400, 482, 505), "eyeR": (572, 390, 714, 500),
    # eyes, read by hand at 6x zoom on a 5 px grid (2026-10-04); L = screen-left (her right), flick on the outer side
    "eyeL_pts": {
        "openTop": [(375.8, 456.7), (380, 448), (388, 436), (400, 428), (415, 425), (428, 424.7), (443, 427.5), (455, 433), (463, 441.7), (469, 450.5)],
        "openBot": [(375.8, 456.7), (378, 470), (388, 487), (400, 492.5), (420, 494), (438, 492.5), (455, 487), (466.7, 475), (470, 463), (469.5, 451)],
        "lashTop": [(352.5, 444), (370, 431.7), (386.7, 418), (411.7, 412.5), (428, 411.7), (448, 416), (461.7, 425), (470, 440), (471.7, 450)],
        "flickBot": [(352.5, 446), (361.7, 450), (370, 455)],
        "iris": (428.7, 457.4, 32.0), "pupil": (429.6, 456.5, 17.9, 18.5), "catch": (421.7, 440.8, 8.3),
    },
    "eyeR_pts": {
        "openTop": [(583.3, 451.7), (586.7, 440), (595, 426.7), (608, 416.7), (625, 411.7), (645, 411.7), (661.7, 415.8), (675, 423.3), (681.7, 433.3), (683.5, 442)],
        "openBot": [(583.3, 451.7), (586.7, 466.7), (595, 475), (608.3, 480.8), (628.3, 482.5), (646.7, 480), (663.3, 475), (675, 466.7), (680, 456.7), (683.5, 442.5)],
        "lashTop": [(581.7, 440), (591.7, 416.7), (608.3, 405), (630, 399), (650, 398.3), (668.3, 403.3), (681.7, 411.7), (690, 423.3), (705, 425)],
        "flickBot": [(685, 443.3), (691.7, 436.7), (705, 427)],
        "iris": (628.6, 447.2, 32.5), "pupil": (627.8, 445.8, 18.8, 20.0), "catch": (619.2, 430.8, 9.0),
    },
    "mouth_ellipse": (530, 628, 108, 64),   # cx, cy, rx, ry: the edit mask of gen-mouths.mjs
    "mouth_patch": (530, 626, 98, 56),     # the cut actually used (inside the edit mask), feathered
    "neck_pivot": (530, 720),
    "head_center": (530, 470),
}


def poly(pts):
    m = np.zeros((H, W), np.uint8)
    cv2.fillPoly(m, [np.array(pts, np.int32)], 1)
    return m.astype(bool)


def box(b):
    m = np.zeros((H, W), bool)
    m[b[1]:b[3], b[0]:b[2]] = True
    return m


def pullpush(img, known, smooth_iters=0, region=None):
    """Fill unknown pixels of img (HxWxC) from known ones: pull-push pyramid, then optional Jacobi smoothing in the
    filled region (a membrane: no edges invented)."""
    img = img.astype(np.float32)
    w = known.astype(np.float32)
    levels = []
    c, a = img * w[..., None], w.copy()
    while min(a.shape) > 2:
        levels.append((c, a))
        h2, w2 = (a.shape[0] + 1) // 2, (a.shape[1] + 1) // 2
        cp = np.zeros((h2 * 2, w2 * 2, c.shape[2]), np.float32)
        ap = np.zeros((h2 * 2, w2 * 2), np.float32)
        cp[:c.shape[0], :c.shape[1]] = c
        ap[:a.shape[0], :a.shape[1]] = a
        c = cp.reshape(h2, 2, w2, 2, -1).sum((1, 3))
        a = ap.reshape(h2, 2, w2, 2).sum((1, 3))
        nz = a > 0
        c[nz] /= a[nz][:, None]
        a = np.minimum(a, 1.0)
        c *= a[..., None]
    col = np.where(a[..., None] > 0, c / np.maximum(a, 1e-6)[..., None], c.mean((0, 1)))
    for c0, a0 in reversed(levels):
        up = cv2.resize(col, (a0.shape[1] * 1, a0.shape[0] * 1), interpolation=cv2.INTER_LINEAR) if False else \
            np.repeat(np.repeat(col, 2, 0), 2, 1)[:a0.shape[0], :a0.shape[1]]
        up = cv2.GaussianBlur(up, (3, 3), 0)
        own = np.where(a0[..., None] > 0, c0 / np.maximum(a0, 1e-6)[..., None], 0)
        aa = np.minimum(a0, 1)[..., None]
        col = own * aa + up * (1 - aa)
    out = np.where(known[..., None], img, col)
    if smooth_iters:
        reg = (~known) if region is None else (region & ~known)
        k = np.array([[0, .25, 0], [.25, 0, .25], [0, .25, 0]], np.float32)
        for _ in range(smooth_iters):
            sm = cv2.filter2D(out, -1, k, borderType=cv2.BORDER_REPLICATE)
            out[reg] = sm[reg]
    return out


def save_layer(name, rgb, alpha, pad=2):
    """Write a cropped straight-alpha RGBA PNG and return its rect."""
    a = np.clip(alpha, 0, 1)
    ys, xs = np.where(a > 0.004)
    x0, y0 = max(0, xs.min() - pad), max(0, ys.min() - pad)
    x1, y1 = min(W, xs.max() + 1 + pad), min(H, ys.max() + 1 + pad)
    rgba = np.dstack([np.clip(rgb, 0, 255), a * 255])[y0:y1, x0:x1].round().astype(np.uint8)
    Image.fromarray(rgba, "RGBA").save(f"{OUT}/{name}.png", optimize=True)
    return [int(x0), int(y0), int(x1), int(y1)]


def soft(mask, sigma=0.75):
    return np.clip(ndi.gaussian_filter(mask.astype(np.float32), sigma), 0, 1)


def dehalo(rgb, mask, area, erode=2, smooth=0):
    """Colour for every pixel of `area`: the mask interior (eroded) extended outward by pull-push."""
    inner = ndi.binary_erosion(mask, iterations=erode) if erode else mask
    return pullpush(rgb, inner, smooth_iters=smooth, region=area)


def matte(mask, overscan=None, band=2, erode=2):
    """Two-colour edge matting: in a band around the mask edge, alpha = the projection of the observed pixel onto
    the segment (background colour -> foreground colour), each colour extended from its own side by pull-push.
    Returns (rgb, alpha): rgb is the de-haloed foreground colour (exact c-front inside), alpha is c-front's own AA."""
    inner = ndi.binary_erosion(mask, iterations=erode) if erode > 0 else mask.copy()
    outer = ~ndi.binary_dilation(mask, iterations=band)
    F = pullpush(im, inner)
    Bk = pullpush(im, outer)
    d = F - Bk
    n2 = (d * d).sum(2)
    a = ((im - Bk) * d).sum(2) / np.maximum(n2, 1e-3)
    a = np.clip(a, 0, 1)
    weak = n2 < 30 ** 2          # similar colours either side: fall back to a soft binary edge
    a = np.where(weak, soft(mask, 0.7), a)
    bandm = ndi.binary_dilation(mask, iterations=band) & ~inner
    alpha = np.where(inner, 1.0, np.where(bandm, a, 0.0)).astype(np.float32)
    rgb = np.where(inner[..., None], im, F)
    if overscan is not None:
        alpha = np.maximum(alpha, (ndi.binary_dilation(overscan, iterations=band + 1) & ndi.binary_dilation(mask, iterations=band) | overscan).astype(np.float32))
    return rgb, alpha


# ------------------------------------------------------------------ classes
dark = (lum < 118) & ((R - B) < 45) & (B < R + 12) & (G < R + 12)
_earpolys = poly(GEOM["earL"]) | poly(GEOM["earR"])
dark &= ~(_earpolys & ((R - B) >= 25))   # the ears' inner shadow is brown, not hair
bgc = (lum > 205) & (B > 150) & (R > 235) & ((R - B) < 80)
face_poly = poly(GEOM["jaw"] + GEOM["face_top"])
strand_x = 372.5 + (387 - yy) * 25.0 / 36.0   # the hair strand's right edge over the brow tail (by eye)
browL = poly(GEOM["browLpoly"]) & (xx > strand_x + 0.5)
browR_box = box(GEOM["browRbox"])

lab, n = ndi.label(dark & ~browL)
feature_boxes = [GEOM["browRbox"], GEOM["eyeL"], GEOM["eyeR"], (440, 560, 620, 690)]
hair_all = np.zeros((H, W), bool)
for i, sl in enumerate(ndi.find_objects(lab), 1):
    if sl is None:
        continue
    comp = lab[sl] == i
    if comp.sum() < 30:
        continue
    ys, xs = sl
    inside = any(xs.start >= b[0] - 4 and xs.stop <= b[2] + 4 and ys.start >= b[1] - 4 and ys.stop <= b[3] + 4 for b in feature_boxes)
    if not inside and not (comp.sum() < 400 and face_poly[sl][comp].mean() > 0.9):
        hair_all[sl] |= comp
# the hair edge: include the anti-aliased rim (darkish pixels next to hair)
rim = ndi.binary_dilation(hair_all, iterations=2) & (lum < 170) & ~face_poly
hair_all = ndi.binary_closing(hair_all | rim, iterations=2) & ~browL
lockLp, lockRp, bunP = poly(GEOM["lockL"]), poly(GEOM["lockR"]), poly(GEOM["bun"])
earLp, earRp = poly(GEOM["earL"]), poly(GEOM["earR"])
lockL = hair_all & lockLp & (yy > 455)
lockR = hair_all & lockRp & (yy > 470)
bun = hair_all & bunP & ~lockRp
hair = hair_all & ~lockL & ~lockR & ~bun
# jaw curve: below it (between the jaw corners) is neck
jx = [p[0] for p in GEOM["jaw"]]
jy = [p[1] for p in GEOM["jaw"]]
jaw_y = np.interp(np.arange(W), jx, jy, left=-1, right=-1)
below_jaw = (yy > jaw_y[None, :]) & (jaw_y[None, :] > 600)
nonhair = ~hair_all & ~bgc
ears = nonhair & (earLp | earRp) & (yy < 600)
cand = nonhair & ~below_jaw & ~ears & (yy < 730)
lbl, k = ndi.label(cand)
face = lbl == lbl[450, 530]
face = ndi.binary_fill_holes(face | (browL & ~hair_all))
body = nonhair & ~face & ~ears & (yy > 600)
lb2, k2 = ndi.label(body)
sz = ndi.sum(body, lb2, range(1, k2 + 1))
body = np.isin(lb2, 1 + np.where(sz > 5000)[0])
fg = face | hair_all | ears | body
geom_out = {"size": [W, H], "rects": {}, "eyes": {}, "brows": {}, "src": "docs/design/teacher/stylised/concepts/c-front.webp"}

# ------------------------------------------------------------------ eyes (measured from colour inside each eye box)
eye_fill = np.zeros((H, W), bool)
eye_layers = {}
for side in ("L", "R"):
    bx = GEOM["eye" + side]
    eb = box(bx)
    E = GEOM["eye" + side + "_pts"]
    white = eb & (lum > 175) & ((R - B) < 60)
    xa, xb_ = int(np.floor(min(p[0] for p in E["openTop"]))), int(np.ceil(max(p[0] for p in E["openTop"])))
    X = np.arange(xa, xb_ + 1)

    def curve(pts, X):
        pts = sorted(pts)
        from scipy.interpolate import PchipInterpolator
        return PchipInterpolator([p[0] for p in pts], [p[1] for p in pts], extrapolate=True)(X)
    T = curve(E["openTop"], X)
    Bt = curve(E["openBot"], X)
    Bt = np.maximum(Bt, T)
    opening = np.zeros((H, W), bool)
    for i, x in enumerate(X):
        if Bt[i] > T[i]:
            opening[int(round(T[i])):int(round(Bt[i])), x] = True
    icx, icy, ir = E["iris"]
    disk = (xx - icx) ** 2 + (yy - icy) ** 2 <= (ir + 1.2) ** 2
    ccx, ccy, cr = E["catch"]
    catch = ((xx - ccx) ** 2 + (yy - ccy) ** 2 <= (cr + 1.5) ** 2)
    lash = eb & (lum < 110) & ~disk & ~opening

    # ---- sclera: the opening's white with the iris painted out (membrane fill from the white), with overscan
    sc_area = ndi.binary_dilation(opening, iterations=14) & eb
    known = ndi.binary_dilation(opening, iterations=2) & ~ndi.binary_dilation(disk, iterations=2) & (lum > 150)
    sclera_rgb = pullpush(im, known, smooth_iters=200, region=sc_area & ~known)
    rects = save_layer(f"sclera{side}", sclera_rgb, sc_area.astype(np.float32))
    geom_out["rects"][f"sclera{side}"] = rects

    # ---- iris: the disk from c-front, catchlight painted out, overscan ring of the limbus colour
    iris_area = (xx - icx) ** 2 + (yy - icy) ** 2 <= (ir + 3) ** 2
    known_i = disk & ~ndi.binary_dilation(catch, iterations=2) & ((xx - icx) ** 2 + (yy - icy) ** 2 <= (ir - 0.5) ** 2)
    # pixels of the disk that lie above the lash bottom are lid-covered: unknown
    covered = np.zeros((H, W), bool)
    for i, x in enumerate(X):
        covered[:int(np.ceil(T[i])) + 1, x] = True
    known_i &= ~covered & opening
    # fill radially: polar transform, inpaint along angle
    # lid-covered top of the iris: mirror the visible bottom half (same radius), darkened like the lid shadow
    iris_src = im.copy()
    my = np.clip((2 * icy - yy).round().astype(int), 0, H - 1)
    mir = iris_area & covered & (yy < icy) & known_i[my, xx]
    iris_src[mir] = im[my[mir], xx[mir]] * 0.82
    known_i = known_i | mir
    iris_rgb = pullpush(iris_src, known_i, smooth_iters=60, region=iris_area)
    ia = np.clip((ir + 0.6) - np.sqrt((xx - icx) ** 2 + (yy - icy) ** 2), 0, 1)
    geom_out["rects"][f"iris{side}"] = save_layer(f"iris{side}", iris_rgb, ia)

    # ---- catchlight: white disc with soft edge (alpha from luminance over the iris colour)
    cdist = np.sqrt((xx - ccx) ** 2 + (yy - ccy) ** 2)
    ca = np.clip((cr + 0.5) - cdist, 0, 1)
    geom_out["rects"][f"catch{side}"] = save_layer(f"catch{side}", np.full_like(im, 255), ca)

    # ---- upper lid: lash band + skin above it (feathered to 0 at the top), from c-front pixels
    LX = np.arange(int(min(p[0] for p in E["lashTop"])) - 2, int(max(p[0] for p in E["lashTop"])) + 3)
    LT = curve(E["lashTop"], LX)
    LB = curve(E["openTop"] + E["flickBot"], LX)   # lash bottom: the opening's top, continued along the flick
    # outside the opening the lash bottom is measured: the last lash-dark pixel of the column below the lash top
    for i, x in enumerate(LX):
        if xa + 1 < x < xb_ - 1:
            continue
        col = np.where(lum[int(LT[i]) - 2:int(LT[i]) + 26, x] < 120)[0]
        if len(col):
            LB[i] = max(LB[i] if (xa <= x <= xb_) else 0, int(LT[i]) - 2 + col.max() + 1)
    fall = 24
    lidmask = np.zeros((H, W), bool)
    lid_top = np.zeros((H, W), np.float32)
    for i, x in enumerate(LX):
        ytop = LT[i] - fall
        for y in range(int(ytop), int(np.ceil(LB[i])) + 2):
            lidmask[y, x] = True
            lid_top[y, x] = np.clip((y - ytop) / 16.0, 0, 1)
    # bottom edge: exact AA from c-front where the lash meets white (alpha = darkness), hard elsewhere
    lid_alpha = lid_top.copy()
    for i, x in enumerate(LX):
        yb = LB[i]
        for y in range(int(np.floor(yb)) - 1, int(np.ceil(yb)) + 2):
            if 0 <= y < H:
                inside_open = opening[y, x] or (x in range(xa, xb_ + 1) and y >= yb)
                if y >= yb:
                    # below the lash bottom: keep only lash-dark AA pixels
                    lid_alpha[y, x] = np.clip((200 - lum[y, x]) / 150.0, 0, 1) if y < yb + 1.5 else 0
    # sides: the flick tip and the inner corner fade over 2 px (c-front's own AA)
    side_fade = np.clip(np.minimum(xx - LX[0], LX[-1] - xx) / 2.0, 0, 1)
    lid_alpha *= side_fade
    lid_rgb = im.copy()
    geom_out["rects"][f"lid{side}"] = save_layer(f"lid{side}", lid_rgb, lid_alpha)

    # ---- lower lid band: skin under the opening, rises on squint / smile
    low = np.zeros((H, W), np.float32)
    for i, x in enumerate(X):
        yb = Bt[i]
        for y in range(int(yb) - 2, int(yb) + 18):
            low[y, x] = np.clip(y + 0.5 - (yb - 0.5), 0, 1) * np.clip((yb + 17 - y) / 8.0, 0, 1)
    # taper at the corners
    taper = np.clip(np.minimum(xx - xa, xb_ - xx) / 10.0, 0, 1)
    low *= taper
    low_rgb = im
    geom_out["rects"][f"lower{side}"] = save_layer(f"lower{side}", low_rgb, low)

    eye_fill |= ndi.binary_dilation(opening | lidmask, iterations=3)
    geom_out["eyes"][side] = {
        "x": [int(xa), int(xb_)], "top": [round(float(v), 2) for v in T], "bot": [round(float(v), 2) for v in Bt],
        "lashX": [int(LX[0]), int(LX[-1])], "lashTop": [round(float(v), 2) for v in LT], "lashBot": [round(float(v), 2) for v in LB],
        "iris": [icx, icy, ir], "pupil": E["pupil"], "catch": [ccx, ccy, cr], "fall": fall,
    }

# ------------------------------------------------------------------ brows
browR = browR_box & dark
lbl, k = ndi.label(browR)
sizes = ndi.sum(browR, lbl, range(1, k + 1))
browR = lbl == (1 + int(np.argmax(sizes)))
browLm = box((346, 330, 482, 396)) & (lum < 112) & (xx > strand_x + 0.5) & ~hair_all
lbl, k = ndi.label(browLm)
sizes = ndi.sum(browLm, lbl, range(1, k + 1))
browLm = lbl == (1 + int(np.argmax(sizes)))
brow_fill = np.zeros((H, W), bool)
for side, bm in (("L", browLm), ("R", browR)):
    bm = ndi.binary_closing(bm, iterations=2)
    # AA rim: include the darker transition pixels around the stroke, colour de-haloed to the stroke colour
    rgb, a = matte(bm, erode=1)
    if side == "L":   # the tail runs under the hair strand: continue it 14 px (hidden at rest, shows when raised)
        for k in range(1, 15):
            src_x = 374
            a[:, 373 - k] = np.maximum(a[:, 373 - k], np.roll(a[:, src_x], int(round(k * 0.35))) * np.clip(1 - k / 16, 0, 1))
    geom_out["rects"][f"brow{side}"] = save_layer(f"brow{side}", rgb, a)
    ys_b, xs_b = np.where(bm)
    geom_out["brows"][side] = {"x": [int(xs_b.min()), int(xs_b.max())], "y": [int(ys_b.min()), int(ys_b.max())]}
    brow_fill |= ndi.binary_dilation(bm, iterations=4)

# ------------------------------------------------------------------ mouth rest patch (c-front's own mouth)
import sys as _sys
_sys.path.insert(0, "scripts/character/puppet2d/P")
import mouthshape
mouth_alpha = mouthshape.alpha(H, W)
geom_out["rects"]["mouth_rest"] = save_layer("mouth_rest", im, mouth_alpha)
lips = ndi.binary_dilation(mouthshape.region(H, W), iterations=2)

# ------------------------------------------------------------------ face base: skin, features removed, overscan
over_face = hair | lockL | lockR                  # layers drawn above the face edge (ears are below it)
# under the hair the face continues widely; under the locks only its own silhouette continues (a closing), so a
# lock that swings away uncovers jaw, never a lock-shaped skin flap
_disk = lambda r: (np.add.outer(np.arange(-r, r + 1) ** 2, np.arange(-r, r + 1) ** 2) <= r * r)
face_sil = ndi.binary_closing(face, structure=_disk(16)) & ~ndi.binary_dilation(bgc & ~(lockL | lockR), iterations=0)
face_area = face | (ndi.binary_dilation(face, iterations=26) & hair) | (face_sil & (lockL | lockR | ndi.binary_dilation(lockL | lockR, iterations=3)) & ~bgc)
holes = eye_fill | brow_fill | lips
known = ndi.binary_erosion(face, iterations=3) & ~holes
face_rgb = pullpush(im, known, smooth_iters=400, region=face_area & ~known)
vis = ndi.binary_erosion(face, iterations=1) & ~holes
face_rgb[vis] = im[vis]
_, fa = matte(face, face_area & ~face)
geom_out["rects"]["face"] = save_layer("face", face_rgb, fa)

# ------------------------------------------------------------------ ears (+ studs), overscan under face/hair/locks
ear_area = ears | (ndi.binary_dilation(ears, iterations=10) & face) | (ndi.binary_dilation(ears, iterations=6) & hair & (lum < 80))
ear_rgb = dehalo(im, ears, ear_area, erode=1, smooth=40)
inner = ndi.binary_erosion(ears, iterations=1)
ear_rgb[inner] = im[inner]
_, ea = matte(ears, ear_area & ~ears)
geom_out["rects"]["ears"] = save_layer("ears", ear_rgb, ea)

# ------------------------------------------------------------------ hair front, bun, locks (de-haloed edges)
print({k:int(v.sum()) for k,v in dict(hair=hair,bun=bun,lockL=lockL,lockR=lockR,hair_all=hair_all).items()})
for name, m, sig in (("hair", hair, 0.7), ("bun", bun, 0.7), ("lockL", lockL, 0.6), ("lockR", lockR, 0.6)):
    over = None
    if name == "hair":   # the hair owns the locks' roots: opaque under their top 34 px (the locks fade in over it)
        roots = np.zeros_like(hair)
        for lk in (lockL, lockR):
            y0 = np.where(lk.any(1))[0].min()
            roots |= lk & (yy < y0 + 34)
        m = hair | roots
        over = None
    if name == "bun":    # the bun is behind the neck, the jaw and the lock: continue it under them
        # the bun is a round knot: its hidden part is the ellipse it belongs to (fitted by eye), under neck/jaw/lock
        ell = ((xx - 683) / 80.0) ** 2 + ((yy - 658) / 86.0) ** 2 <= 1
        over = ell & ~bun & (yy < 752) & ~ndi.binary_dilation(bgc, iterations=1)
    if name.startswith("lock"):
        core = m & (lum < 125)
        rgb, a = matte(core, None, band=2, erode=0)
        a = np.where(m | ndi.binary_dilation(m, iterations=2), a, 0)
        # the root fades into the hair mass over 14 px (same colour underneath: no visible top edge)
        y0 = np.where(m.any(1))[0].min()
        a = a * np.clip((yy - y0 - 6) / 24.0, 0, 1)
    else:
        rgb, a = matte(m, over)
    if over is not None:
        rgb = np.where((over & ~m)[..., None], pullpush(im, ndi.binary_erosion(m, iterations=2)), rgb)
    geom_out["rects"][name] = save_layer(name, rgb, a)

# ------------------------------------------------------------------ hair back plate (behind the face and ears)
hb_area = ndi.binary_fill_holes(hair_all | face_poly | ears) & ~(yy > 600)
hb_area = ndi.binary_erosion(hb_area, iterations=12) & ~ndi.binary_dilation(bgc, iterations=12)
hb_rgb = pullpush(im, hair & ~ndi.binary_dilation(face_poly, iterations=4), smooth_iters=200, region=hb_area)
geom_out["rects"]["hairback"] = save_layer("hairback", hb_rgb, soft(hb_area, 1.0))

# ------------------------------------------------------------------ body: kurta + neck, neck continued up behind the chin
# the neck continued straight up behind the chin between its visible edges (measured at y 712-735)
_ne = [np.where(body[y, 400:660])[0] for y in range(712, 736)]
nl = int(np.median([r.min() for r in _ne if len(r)])) + 400
nr = int(np.median([r.max() for r in _ne if len(r)])) + 400
neck_up = (yy > 560) & (yy < 740) & (xx >= nl) & (xx <= nr) & ~body & ~ndi.binary_dilation(bgc, iterations=2)
print("neck edges", nl, nr)
body_area = body | neck_up | (ndi.binary_dilation(body, iterations=8) & (lockL | lockR | hair))
neck_skin = ndi.binary_erosion(body, iterations=2) & ((R - B) > 60) & (yy < 760)
known_b = ndi.binary_erosion(body, iterations=2) & ~((yy < 760) & ((R - B) <= 60))
body_rgb = pullpush(im, known_b, smooth_iters=300, region=body_area & ~known_b)
neck_fill = pullpush(im, neck_skin, smooth_iters=300, region=neck_up)
body_rgb = np.where(neck_up[..., None], neck_fill, body_rgb)
# behind the chin the neck is in the jaw's shadow: darken toward the chin line
shade = 1 - 0.22 * np.clip((yy - 600) / 90.0, 0, 1) * neck_up
body_rgb = body_rgb * shade[..., None]
body_rgb[ndi.binary_erosion(body, iterations=1)] = im[ndi.binary_erosion(body, iterations=1)]
_, ba = matte(body, ndi.binary_dilation(neck_up, iterations=4) & body_area | (body_area & ~body))
geom_out["rects"]["body"] = save_layer("body", body_rgb, ba)

# ------------------------------------------------------------------ background plate
bg_rgb = pullpush(im, bgc & ~ndi.binary_dilation(fg, iterations=3), smooth_iters=0)
bg_rgb = np.where(ndi.binary_dilation(fg, iterations=3)[..., None], cv2.GaussianBlur(bg_rgb, (0, 0), 6), bg_rgb)
Image.fromarray(bg_rgb.clip(0, 255).astype(np.uint8)).save(f"{OUT}/bg.png", optimize=True)
geom_out["rects"]["bg"] = [0, 0, W, H]
geom_out["geom"] = GEOM
json.dump(geom_out, open(f"{OUT}/geom.json", "w"), indent=1)
print("layers:", sorted(geom_out["rects"].keys()))
print("eyes:", {k: {kk: v[kk] for kk in ("x", "iris", "catch")} for k, v in geom_out["eyes"].items()})
