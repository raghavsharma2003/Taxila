"""P1-P3 for arm P: cut c-front into registered layers, complete hidden regions, write layer PNGs + rig geometry.

    python3 scripts/character/puppet2d/polish-r2/layers.py

Every layer is in c-front pixel space (1024^2), so the rest pose is pixel-registered by construction. Hidden regions
(behind the hair, under the features, behind the chin) are completed by a pull-push membrane fill from the layer's own
visible pixels: Memoji skin, hair and cloth are smooth fields, so a membrane fill reads as the same material (no image
spend). Outer edges are de-haloed: alpha comes from the soft mask, colour from the eroded interior extended outward.

Output: art/character/puppet2d/polish-r2/layers/<id>.png (cropped RGBA) + art/character/puppet2d/polish-r2/layers/geom.json.
"""
import json
import os
import numpy as np
import cv2
from PIL import Image
from scipy import ndimage as ndi

SRC = "art/character/puppet2d/polish-r2/c-front.png"
OUT = "art/character/puppet2d/polish-r2/layers"
WORK = "art/character/puppet2d/polish-r2/work"
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
    # r2: the strand crosses the bun's right edge at x 749-764, y 630-690 (read at 4x on a 10 px grid), then curls out
    "lockR": [(728, 395), (760, 395), (788, 520), (792, 620), (788, 640), (772, 652), (765, 668), (766, 690), (777, 706),
              (764, 708), (752, 688), (750, 660), (754, 630), (757, 600), (760, 575), (742, 540), (732, 480)],
    "bun": [(600, 575), (700, 560), (760, 600), (765, 700), (720, 745), (640, 750), (598, 752), (588, 700)],
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
        "iris": (428.7, 457.4, 31.2), "pupil": (429.6, 456.5, 17.9, 18.5), "catch": (421.7, 440.8, 8.3),
    },
    "eyeR_pts": {
        "openTop": [(583.3, 451.7), (586.7, 440), (595, 426.7), (608, 416.7), (625, 411.7), (645, 411.7), (661.7, 415.8), (675, 423.3), (681.7, 433.3), (683.5, 442)],
        "openBot": [(583.3, 451.7), (586.7, 466.7), (595, 475), (608.3, 480.8), (628.3, 482.5), (646.7, 480), (663.3, 475), (675, 466.7), (680, 456.7), (683.5, 442.5)],
        "lashTop": [(581.7, 440), (591.7, 416.7), (608.3, 405), (630, 399), (650, 398.3), (668.3, 403.3), (681.7, 411.7), (690, 423.3), (705, 425)],
        "flickBot": [(685, 443.3), (691.7, 436.7), (705, 427)],
        "iris": (628.6, 447.2, 31.8), "pupil": (627.8, 445.8, 18.8, 20.0), "catch": (619.2, 430.8, 9.0),
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


def hairfinish(rgb, a, shrink=0.14):
    """r2 edge re-matte for dark hair over light ground: (1) background decontamination: every pixel that is not
    solid takes the colour of the solid interior extended outward (so a partially transparent edge pixel carries
    hair colour, never the cream it was mixed with); (2) a ~1 px alpha erode (shrink the ramp) and a 0.45 px dark
    feather. Stored straight-alpha; gl.js premultiplies on upload. Result: no light fringe over any ground."""
    solid = ndi.binary_erosion(a > 0.97, iterations=1)
    ext = pullpush(rgb, solid)
    rgb = np.where(solid[..., None], rgb, ext)
    # the erode + feather only where the edge faces the background: at internal edges (hair against brow, lock
    # against ear/jaw/bun) c-front's own AA is kept, or the ground under the edge would peek through as a line
    near_bg = ndi.gaussian_filter(ndi.binary_dilation(bgc, iterations=2).astype(np.float32), 1.0)
    a2 = np.clip((a - shrink) / (1 - shrink), 0, 1)
    a2 = ndi.gaussian_filter(a2, 0.45)
    a2 = a * (1 - near_bg) + np.minimum(a2, a) * near_bg
    a2 = np.where(solid, 1.0, a2)
    return rgb, a2.astype(np.float32)


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
_lkL = ndi.binary_dilation(lockLp, iterations=9) & (xx < 345)
_bun_ell = ((xx - 683) / 80.0) ** 2 + ((yy - 658) / 86.0) ** 2 <= 1
# lock R: generous above the bun, tight (polygon + 2 px) where it lies over the bun, so the bun's own pixels stay
# in the bun and the strand's own pixels stay in the lock (dark on dark: the polygon is the separator)
_bun_zone = ndi.binary_dilation(_bun_ell, iterations=8)
_lb0, _ = ndi.label(hair_all & ~lockRp & (yy > 568) & (xx > 575) & (xx < 800))
_bun0 = _lb0 == _lb0[700, 683]          # the knot alone: the lock's generous rim never takes knot pixels
_lkR = (((ndi.binary_dilation(lockRp, iterations=9) & ~_bun_zone) & ~ndi.binary_dilation(_bun0, iterations=1)) | (lockRp & _bun_zone)) & (xx > 722)
lockL = hair_all & _lkL & (yy > 455)
lockR = hair_all & _lkR & (yy > 470)
lockLp, lockRp = _lkL, _lkR
# r2: the bun is every dark pixel of the lower-right zone that is not the lock (the connected knot), so no part of
# the visible knot is left to nobody (r1 left a cream wedge between neck and knot at rest)
_bz = hair_all & ~lockR & (yy > 568) & (xx > 575) & (xx < 800)
_lb, _ = ndi.label(_bz)
bun = _lb == _lb[700, 683]
hair = hair_all & ~lockL & ~lockR & ~bun
hair &= ~((yy > 560) & (xx > 380) & (xx < 680))
# jaw curve: below it (between the jaw corners) is neck
jx = [p[0] for p in GEOM["jaw"]]
jy = [p[1] for p in GEOM["jaw"]]
jaw_y = np.interp(np.arange(W), jx, jy, left=-1, right=-1)
below_jaw = (yy > jaw_y[None, :]) & (jaw_y[None, :] > 600) & (xx > 425) & (xx < 640)
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
    ia = np.clip((ir + 0.3) - np.sqrt((xx - icx) ** 2 + (yy - icy) ** 2), 0, 1)
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
    # bottom edge: c-front's own AA. Near the lash bottom the alpha is the pixel's lash-ness (dark AND neutral, so
    # the brown iris under the lid is never baked into the lid); above it the lid is opaque, below it transparent
    lashness = np.clip((200 - lum) / 150.0, 0, 1) * np.clip((40 - (R - B)) / 15.0, 0, 1)
    lashness = lashness * ~((xx - icx) ** 2 + (yy - icy) ** 2 <= (ir + 1.5) ** 2) * (yy < np.interp(xx, LX, LB) + 2.5)
    lid_alpha = lid_top.copy()
    for i, x in enumerate(LX):
        yb = LB[i]
        for y in range(int(np.floor(yb)) - 3, int(np.ceil(yb)) + 9):
            if 0 <= y < H:
                if y >= yb - 2.5:
                    lid_alpha[y, x] = lashness[y, x] if y < yb + 8 else 0
                lidmask[y, x] = True
    # sides: the flick tip and the inner corner fade over 2 px (c-front's own AA)
    side_fade = np.clip(np.minimum(xx - LX[0], LX[-1] - xx) / 2.0, 0, 1)
    lid_alpha *= side_fade
    lid_rgb = im.copy()
    # r2 (judge item 5, the lid seam): along the lash bottom c-front's pixel is lash MIXED with the sclera under it.
    # Drawing that mixed colour at partial alpha over the sclera counted the white twice (a light streak + stairs
    # under the lash). Two-colour matte instead: alpha = where the pixel sits between the lash colour and the white,
    # colour = the solid lash colour extended outward (decontaminated), so lid-over-sclera reproduces c-front.
    solid_lash = (lashness > 0.97) & lidmask
    lash_col = pullpush(im, ndi.binary_erosion(solid_lash, iterations=1) | (solid_lash & (lum < 60)))
    Lc = 0.299 * lash_col[..., 0] + 0.587 * lash_col[..., 1] + 0.114 * lash_col[..., 2]
    # inside the opening the lash's lower edge IS the opening's top curve (read by hand, smooth): draw it as an
    # analytic edge with exact pixel coverage (the per-column binary cut was a staircase at 2x+ and under turns)
    # measured: c-front's lash runs ~2-3 px below the hand-read T; per column, the last lash-dark row below T-4
    # (stopping at the iris disk, where the default T+2.5 holds), median + gaussian smoothed into one clean curve
    lbm = np.array(T, np.float64) + 2.5
    for i, x in enumerate(X):
        y = int(np.floor(T[i])) - 4
        last = None
        while y < T[i] + 8:
            if (x - icx) ** 2 + (y - icy) ** 2 <= (ir + 1) ** 2:
                last = None; break
            if lum[y, x] < 70: last = y
            elif last is not None: break
            y += 1
        if last is not None: lbm[i] = last + (lum[last + 1, x] < 140) * 0.5 + 0.5
    lbm = ndi.gaussian_filter1d(ndi.median_filter(lbm, 7), 2.0)
    Tfull = np.interp(xx, X, lbm)
    inside = (xx >= xa + 2) & (xx <= xb_ - 2)
    band = inside & (yy >= Tfull - 5) & (yy <= Tfull + 3) & (yy < LB.max() + 12)
    cov = np.clip(Tfull + 0.5 - yy, 0, 1)
    endw = np.clip(np.minimum(xx - xa - 2, xb_ - 2 - xx) / 6.0, 0, 1)    # blend into the measured edge at the ends
    lid_alpha = np.where(band, cov * endw + lid_alpha * (1 - endw), lid_alpha)
    lid_rgb = np.where((band & (yy >= Tfull - 3))[..., None], lash_col, lid_rgb)
    lidmask |= band
    geom_out.setdefault("lashBotFine", {})[side] = [round(float(v), 2) for v in lbm]
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
_sys.path.insert(0, "scripts/character/puppet2d/polish-r2")
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
face_area = face | (ndi.binary_dilation(face, iterations=26) & hair & ~ndi.binary_dilation(bgc, iterations=6)) | (face_sil & (lockL | lockR | ndi.binary_dilation(lockL | lockR, iterations=3)) & ~bgc)
holes = eye_fill | brow_fill | lips
known = ndi.binary_erosion(face, iterations=3) & ~holes
face_rgb = pullpush(im, known, smooth_iters=400, region=face_area & ~known)
vis = ndi.binary_erosion(face, iterations=1) & ~holes
face_rgb[vis] = im[vis]
# r2: a 5 px matte band, so jaw-shadow skin that the hair rim took next to the knot gets its alpha from colour
# (skin vs knot) instead of from the mask's staircase
_, fa = matte(face, face_area & ~face, band=5)
# the chin has no contour in c-front, only shading into the neck: feather the face over the neck across ~9 px
dj = (yy - jaw_y[None, :])
chin_band = (xx > 440) & (xx < 615) & (np.abs(dj) < 12)
_cb = np.clip(1.0 - dj / 9.0, 0, 1) * (jaw_y[None, :] > 600) * (1 - soft(ndi.binary_dilation(bgc, iterations=3), 1.5))
_cb = _cb * np.where(dj > 0, 1 - soft(ndi.binary_dilation(hair_all, iterations=1), 1.5), 1.0)   # never the knot below the jaw
_cw = np.clip((xx - 458) / 30.0, 0, 1) * np.clip((598 - xx) / 26.0, 0, 1)   # inside the visible neck span (452-601)   # blend into the matte at the band ends
fa = np.where(chin_band, _cb * _cw + fa * (1 - _cw), fa)
face_rgb = np.where((chin_band & (dj >= -2))[..., None], im, face_rgb)   # c-front's own pixels across the chin band
# r2: outside the chin feather, the face never owns rest-visible neck below the jaw (it slid with the face on a turn as
# a light chip at the jaw/neck corners); at rest the same neck pixels lie underneath in the body layer
_nk = ndi.binary_dilation(body, iterations=1) & (dj > 1)
fa = np.where(_nk, fa * _cw * chin_band, fa)
# r2: islands (a skin chip at the left jaw that slid on turns): keep only the main component of the alpha
_fl_, _ = ndi.label(fa > 0.02)
fa = np.where(_fl_ == _fl_[450, 530], fa, 0)
geom_out["rects"]["face"] = save_layer("face", face_rgb, fa)

# ------------------------------------------------------------------ ears (+ studs), overscan under face/hair/locks
# ear under a lock: only lock pixels with ear on BOTH sides within 18 px on the same row (never where the lock
# borders background, or skin would be painted behind the lock's soft edge and fringe at rest)
_lk = lockL | lockR
_l = ndi.maximum_filter1d(ears.astype(np.uint8), 18, axis=1, origin=8).astype(bool)
_r = ndi.maximum_filter1d(ears.astype(np.uint8), 18, axis=1, origin=-9).astype(bool)
_under = _lk & _l & _r & (earLp | earRp)
_under = ndi.binary_erosion(_under | ears, iterations=1) & _under & ndi.binary_closing(ears, structure=_disk(12))
_lb, _nb = ndi.label(_under)
if _nb:
    _sz = ndi.sum(_under, _lb, range(1, _nb + 1))
    _under = np.isin(_lb, 1 + np.where(_sz >= 40)[0])
ears_full = ears | _under
ear_area = ears_full | (ndi.binary_dilation(ears, iterations=10) & face)
ear_rgb = dehalo(im, ears, ear_area, erode=1, smooth=40)
inner = ndi.binary_erosion(ears, iterations=1)
ear_rgb[inner] = im[inner]
_, ea = matte(ears, ear_area & ~ears)
ea = np.maximum(ea, soft(_under, 0.8))
geom_out["rects"]["ears"] = save_layer("ears", ear_rgb, ea)

# ------------------------------------------------------------------ hair front, bun, locks (de-haloed edges)
np.savez_compressed(WORK + "/masks-r2.npz", hair=hair, bun=bun, lockL=lockL, lockR=lockR, ears=ears, face=face, body=body)
print({k:int(v.sum()) for k,v in dict(hair=hair,bun=bun,lockL=lockL,lockR=lockR,hair_all=hair_all).items()})
for name, m, sig in (("hair", hair, 0.7), ("bun", bun, 0.7), ("lockL", lockL, 0.6), ("lockR", lockR, 0.6)):
    over = None
    if name == "hair":   # the hair owns the locks' roots: opaque under their top 34 px (the locks fade in over it)
        roots = np.zeros_like(hair)
        for lk in (lockL, lockR):
            y0 = np.where(lk.any(1))[0].min()
            roots |= lk & (yy < y0 + 34)
        m = hair | roots
        # 2 px overscan over the brow tail where the strand crosses it (no conflation line between hair and brow)
        over = ndi.binary_dilation(hair, iterations=2) & browL
    if name == "bun":    # the bun is behind the neck, the jaw and the lock: continue it under them
        # the bun is a round knot: its hidden part is the ellipse it belongs to (fitted by eye), under neck/jaw/lock
        # r2: the knot's whole shape is the convex hull of its visible pixels and a deeper ellipse bottom under the
        # jaw/neck/kurta (a ball: convex). Hidden at rest = hull minus visible knot minus rest-visible backdrop. A
        # turn that slides the jaw off it uncovers a round knot, never a rectangle (r1's `ext` box was the debris).
        ell_low = ((xx - 683) / 80.0) ** 2 + ((yy - 662) / 98.0) ** 2 <= 1
        _seed = bun | (ell_low & (face | body | lockR) & (yy > 600)) | (lockR & ndi.binary_dilation(bun, iterations=5) & (yy > 600))
        _pts = np.argwhere(_seed)[:, ::-1].astype(np.int32)
        _hull = np.zeros((H, W), np.uint8)
        cv2.fillConvexPoly(_hull, cv2.convexHull(_pts), 1)
        bun_shape = _hull.astype(bool)
        over = bun_shape & ~bun & ~ndi.binary_dilation(bgc, iterations=1)
    if name.startswith("lock"):
        rgb, a = matte(m, None, band=2, erode=2)
        a = np.where(ndi.binary_dilation(m, iterations=2), a, 0)
        # the root fades into the hair mass over 14 px (same colour underneath: no visible top edge)
        y0 = np.where(m.any(1))[0].min()
        a = a * np.clip((yy - y0 - 6) / 24.0, 0, 1)
    else:
        rgb, a = matte(m, over)
    if over is not None and name == "bun":
        # continue the knot's own radial shading into its hidden part: sample the visible bun at the same
        # normalised radius, at the nearest visible angle (polar extrapolation about the fitted ellipse)
        cx0, cy0, ax, ay = 683, 658, 80.0, 86.0
        vis = ndi.binary_erosion(bun, iterations=3)
        ang = np.arctan2((yy - cy0) / ay, (xx - cx0) / ax)
        rad = np.sqrt(((xx - cx0) / ax) ** 2 + ((yy - cy0) / ay) ** 2)
        NA, NR = 360, 60
        ai = ((ang + np.pi) / (2 * np.pi) * NA).astype(int) % NA
        ri = np.clip((rad * NR).astype(int), 0, NR - 1)
        tab = np.zeros((NR, NA, 3), np.float32); cnt = np.zeros((NR, NA), np.float32)
        np.add.at(tab, (ri[vis], ai[vis]), im[vis]); np.add.at(cnt, (ri[vis], ai[vis]), 1)
        known_t = cnt > 0
        tab[known_t] /= cnt[known_t][:, None]
        for r in range(NR):   # fill missing angles from the nearest known angle (circular)
            ks = np.where(known_t[r])[0]
            if len(ks) == 0:
                continue
            for a_ in np.where(~known_t[r])[0]:
                d = np.minimum(np.abs(ks - a_), NA - np.abs(ks - a_))
                tab[r, a_] = tab[r, ks[np.argmin(d)]]
        for r in range(NR):
            if not known_t[r].any():
                tab[r] = tab[r - 1] if r > 0 else tab[r]
        fillc = tab[ri, ai]
        fillc = cv2.GaussianBlur(fillc, (0, 0), 2.0)
        seam = m & ~ndi.binary_erosion(m, iterations=3) & ndi.binary_dilation(over, iterations=4)
        rgb = np.where((over & ~m)[..., None] | seam[..., None], fillc, rgb)
        a = np.where(seam, 1.0, a)
        # the hidden contour is the hull's, anti-aliased (never the hard edge of a cut)
        a = np.where(over & ~ndi.binary_dilation(m, iterations=2), soft(bun_shape, 0.8), a)
        # where the knot meets the lock (dark on dark) its contour is the hull's too: the cut edge was a staircase
        _nl = ndi.binary_dilation(lockR, iterations=4) & ~ndi.binary_dilation(bgc, iterations=1)
        a = np.where(_nl, np.maximum(a * (~_nl), soft(bun_shape, 0.8)), a)
        rgb = np.where((_nl & ~ndi.binary_erosion(m, iterations=2))[..., None], fillc, rgb)
    elif over is not None:
        rgb = np.where((over & ~m)[..., None], pullpush(im, ndi.binary_erosion(m, iterations=2)), rgb)
    # r2 rev: cream trapped INSIDE the mask (the gap between two strands of a lock, closed by the mask's closing) is
    # matted out by colour: warm light pixels get alpha = their position between hair and backdrop. Over cream at
    # rest nothing changes; over skin, teal or white it was a light line running inside the lock (the r1 "halo").
    if True:
        warm = np.clip(((R - B) - 12) / 20.0, 0, 1)
        cream_t = np.clip((lum - 70.0) / (238.0 - 70.0), 0, 1) * warm * (lum > 95)
        inner_m = ndi.binary_dilation(m, iterations=2)
        a = np.where(inner_m & ~(over if over is not None else np.zeros_like(m)), a * (1 - cream_t), a)
    rgb, a = hairfinish(rgb, a)
    geom_out["rects"][name] = save_layer(name, rgb, a)

# ------------------------------------------------------------------ lock bed (r2): a clean plate under each lock
# Under a lock's soft edge the layers below are themselves soft-edged (ear, jaw, the cream gap), so two 50% edges
# let the clear colour bleed through as a light line. The bed is the two-colour matting background: what lies beside
# the lock, extended under its footprint, opaque. At rest it is invisible (it IS the ground the lock was matted
# against); when a lock swings on its spring it uncovers a plausible continuation of the ear/jaw/hair beside it.
_lk_all = lockL | lockR
_fp = ndi.binary_dilation(_lk_all, iterations=3)
_known_bed = ~ndi.binary_dilation(_lk_all, iterations=2)
bed_rgb = pullpush(im, _known_bed, smooth_iters=60, region=_fp & ~_known_bed)
bed_a = soft(ndi.binary_dilation(_lk_all, iterations=2) & ~ndi.binary_dilation(_bun_ell, iterations=1), 0.7) * (yy > 455)
bed_rgb = np.where(_known_bed[..., None], im, bed_rgb)
_bl = 0.299 * bed_rgb[..., 0] + 0.587 * bed_rgb[..., 1] + 0.114 * bed_rgb[..., 2]
bed_a = bed_a * np.clip((205 - _bl) / 15.0, 0, 1)          # never where the ground is the cream backdrop
geom_out["rects"]["lockbed"] = save_layer("lockbed", bed_rgb, bed_a)

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
# r2: the neck flares up into the jaw (a smooth contour, not a column), and is painted only where the face hides it at
# rest, so the rest pose is unchanged and a chin that moves over it on a turn uncovers neck in jaw shadow, never cream
# r2 rev: a straight column (the visible edges continued up), widening only well under the jaw where no turn in range
# uncovers it; painted wherever c-front is not backdrop or the knot at rest, so its side is a clean neck line on a turn
# r2 rev2: the column's sides ARE the visible neck's sides, traced row by row and continued straight up from the
# highest visible row (+ a slow flare on the cream side only), so an uncovered neck never shows a step
_el = np.full(H, np.nan); _er = np.full(H, np.nan)
for _y in range(760, 575, -1):
    _r = np.where(body[_y, 400:660])[0]
    if len(_r) and _r.min() + 400 > nl - 30 and _r.max() + 400 < nr + 30 and _r.max() - _r.min() > 60:
        _el[_y], _er[_y] = _r.min() + 400, _r.max() + 400
_yt = int(np.nanargmin(np.where(np.isnan(_el), np.inf, np.arange(H))))   # top visible neck row
_el[:_yt] = _el[_yt]; _er[:_yt] = _er[_yt]
_el = np.where(np.isnan(_el), nl, _el); _er = np.where(np.isnan(_er), nr, _er)
_fl = 10.0 * np.clip((_yt - yy) / 60.0, 0, 1)
neck_shape = (yy > 575) & (yy < 760) & (xx >= _el[:, None] - _fl) & (xx <= _er[:, None])
print("neck top row", _yt, _el[_yt], _er[_yt])
neck_up = neck_shape & ~body & ~ndi.binary_dilation(bgc, iterations=1) & ~lockL & ~lockR & ~ndi.binary_dilation(bun, iterations=1)
print("neck edges", nl, nr)
body_area = body | neck_up | (ndi.binary_dilation(body, iterations=8) & (lockL | lockR | hair))
neck_skin = ndi.binary_erosion(body, iterations=2) & ((R - B) > 60) & (yy < 760)
known_b = ndi.binary_erosion(body, iterations=2) & ~((yy < 760) & ((R - B) <= 60))
body_rgb = pullpush(im, known_b, smooth_iters=300, region=body_area & ~known_b)
neck_fill = pullpush(im, neck_skin, smooth_iters=300, region=neck_up)
body_rgb = np.where(neck_up[..., None], neck_fill, body_rgb)
# behind the chin the neck is in the jaw's shadow: darken toward the chin line
# shade by distance from the rest-visible neck (continuous across the jaw line, so the rest jaw polyline never shows
# as steps in the hidden neck when a turn uncovers it)
_dv = ndi.distance_transform_edt(~(body & (yy < 760)))
shade = 1 - 0.26 * np.clip(_dv / 30.0, 0, 1) * neck_up
body_rgb = body_rgb * shade[..., None]
body_rgb[ndi.binary_erosion(body, iterations=1)] = im[ndi.binary_erosion(body, iterations=1)]
_, ba = matte(body, (body_area & ~body) & ~neck_up)
ba = np.maximum(ba, soft(neck_up | (body & neck_shape), 0.9) * ndi.binary_dilation(neck_up, iterations=3))
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
