"""lamp1 cutter: the rig front (Asha, option 4 lamplight flat, rig space) into the r8 layer set, adapted from
scripts/character/puppet2d/polish-r8/layers.py (same layer names, same pull-push / matte / hairfinish machinery).
Flat colour makes two things automatic that r8 read by hand: the eye openings (traced per column from the sclera and iris
colour classes) and the lip line (darkest pixel per column). Everything else is a hand-read polygon in RIG SPACE
(rigspace.py), read at 2x / 6x on a grid (gridcrop.py), 2026-10-10.
Masks come from the ungraded front (front.png); colours from the skin-graded one (front-g.png, skin.py).
    python3 -I layers.py
Output: <scratch>/layers/<id>.png (cropped straight-alpha RGBA) + layers/geom.json."""
import json, os, sys
import numpy as np, cv2
from PIL import Image
from scipy import ndimage as ndi
from scipy.interpolate import PchipInterpolator

S = "/tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/r4-asha"
OUT = f"{S}/layers"
os.makedirs(OUT, exist_ok=True)
im0 = np.asarray(Image.open(f"{S}/rs/front.png").convert("RGB")).astype(np.float32)     # masks
im = np.asarray(Image.open(f"{S}/rs/front-g.png").convert("RGB")).astype(np.float32)    # colours (skin graded)
H, W = im.shape[:2]
R, G, B = im0[..., 0], im0[..., 1], im0[..., 2]
lum = 0.299 * R + 0.587 * G + 0.114 * B
yy, xx = np.mgrid[0:H, 0:W]
BGC = np.array([246.0, 209.0, 152.0])            # the front's cream (sampled)

GEOM = {
    "jaw": [(338, 600), (348, 630), (362, 652), (382, 668), (405, 688), (430, 704), (480, 716), (530, 721), (580, 715),
            (630, 700), (668, 677), (690, 656), (705, 632), (715, 600)],
    "face_top": [(722, 560), (735, 450), (730, 380), (700, 280), (640, 215), (525, 195), (410, 215), (350, 280), (322, 380),
                 (318, 450), (332, 560)],
    "earL": [(236, 395), (305, 395), (322, 470), (326, 560), (308, 576), (282, 566), (262, 532), (244, 480)],
    "earR": [(740, 395), (810, 395), (804, 470), (788, 532), (768, 566), (744, 576), (726, 560), (728, 470)],
    "lockL": [(248, 436), (274, 436), (280, 520), (288, 560), (303, 600), (312, 640), (312, 690), (300, 732), (296, 796),
              (272, 796), (274, 740), (286, 690), (287, 652), (276, 612), (260, 572), (250, 520)],
    "lockR": [(774, 466), (798, 466), (806, 520), (806, 572), (800, 612), (790, 650), (793, 690), (807, 730), (809, 800),
              (785, 800), (783, 744), (772, 702), (768, 650), (776, 600), (782, 560), (780, 520)],
    "bunL": (292, 562, 392, 768), "bunR": (660, 562, 776, 776),
    "eyeL": (355, 380, 495, 450), "eyeR": (555, 380, 698, 450),
    "browLbox": (330, 328, 502, 392), "browRbox": (548, 328, 722, 392),
    "irisL": (425.5, 418.0, 21.5), "irisR": (626.0, 417.0, 21.5),
    "catchL": (429.5, 408.5, 3.8), "catchR": (626.5, 407.5, 3.8),
    # the openings, read from column / row colour profiles of front.png (2026-10-10); L = screen-left (her right)
    "eyeL_pts": {"top": [(386, 419), (390, 413), (395, 409), (400, 406), (410, 404.5), (420, 403.8), (428, 403.5), (440, 405), (450, 408), (455, 410.5), (460, 414), (465, 420)],
                 "bot": [(386, 421), (390, 425), (395, 427), (400, 428), (410, 430.5), (420, 432.5), (428, 433), (436, 432.5), (445, 430.5), (452, 428), (458, 426.5), (465, 420)]},
    "eyeR_pts": {"top": [(583, 421), (586, 418), (590, 415), (595, 411.5), (600, 408.5), (605, 406.5), (615, 404.5), (627, 403.5), (640, 404.5), (650, 406.5), (656, 408.5), (660, 411.5), (664, 415), (668, 420)],
                 "bot": [(583, 421), (586, 423.5), (590, 425), (597, 427.5), (605, 430), (615, 432.5), (627, 433.5), (638, 432.5), (648, 430), (655, 427.5), (660, 425.5), (664, 423), (668, 420)]},
    "neck_x": (382, 670),
}

def poly(pts):
    m = np.zeros((H, W), np.uint8); cv2.fillPoly(m, [np.array(pts, np.int32)], 1); return m.astype(bool)
def box(b):
    m = np.zeros((H, W), bool); m[b[1]:b[3], b[0]:b[2]] = True; return m

def pullpush(img, known, smooth_iters=0, region=None):
    img = img.astype(np.float32); w = known.astype(np.float32); levels = []
    c, a = img * w[..., None], w.copy()
    while min(a.shape) > 2:
        levels.append((c, a))
        h2, w2 = (a.shape[0] + 1) // 2, (a.shape[1] + 1) // 2
        cp = np.zeros((h2 * 2, w2 * 2, c.shape[2]), np.float32); ap = np.zeros((h2 * 2, w2 * 2), np.float32)
        cp[:c.shape[0], :c.shape[1]] = c; ap[:a.shape[0], :a.shape[1]] = a
        c = cp.reshape(h2, 2, w2, 2, -1).sum((1, 3)); a = ap.reshape(h2, 2, w2, 2).sum((1, 3))
        nz = a > 0; c[nz] /= a[nz][:, None]; a = np.minimum(a, 1.0); c *= a[..., None]
    col = np.where(a[..., None] > 0, c / np.maximum(a, 1e-6)[..., None], c.mean((0, 1)))
    for c0, a0 in reversed(levels):
        up = np.repeat(np.repeat(col, 2, 0), 2, 1)[:a0.shape[0], :a0.shape[1]]
        up = cv2.GaussianBlur(up, (3, 3), 0)
        own = np.where(a0[..., None] > 0, c0 / np.maximum(a0, 1e-6)[..., None], 0)
        aa = np.minimum(a0, 1)[..., None]
        col = own * aa + up * (1 - aa)
    out = np.where(known[..., None], img, col)
    if smooth_iters:
        reg = (~known) if region is None else (region & ~known)
        k = np.array([[0, .25, 0], [.25, 0, .25], [0, .25, 0]], np.float32)
        for _ in range(smooth_iters):
            sm = cv2.filter2D(out, -1, k, borderType=cv2.BORDER_REPLICATE); out[reg] = sm[reg]
    return out

def save_layer(name, rgb, alpha, pad=2):
    a = np.clip(alpha, 0, 1); ys, xs = np.where(a > 0.004)
    x0, y0 = max(0, xs.min() - pad), max(0, ys.min() - pad); x1, y1 = min(W, xs.max() + 1 + pad), min(H, ys.max() + 1 + pad)
    rgba = np.dstack([np.clip(rgb, 0, 255), a * 255])[y0:y1, x0:x1].round().astype(np.uint8)
    Image.fromarray(rgba, "RGBA").save(f"{OUT}/{name}.png", optimize=True)
    return [int(x0), int(y0), int(x1), int(y1)]

def soft(mask, sigma=0.75): return np.clip(ndi.gaussian_filter(mask.astype(np.float32), sigma), 0, 1)
def dehalo(rgb, mask, area, erode=2, smooth=0):
    inner = ndi.binary_erosion(mask, iterations=erode) if erode else mask
    return pullpush(rgb, inner, smooth_iters=smooth, region=area)

def matte(mask, overscan=None, band=2, erode=2):
    """two-colour edge matting (r8): alpha from the observed pixel's position between the extended background and
    foreground colours (computed on the ungraded front), colour = the graded foreground extended outward."""
    inner = ndi.binary_erosion(mask, iterations=erode) if erode > 0 else mask.copy()
    outer = ~ndi.binary_dilation(mask, iterations=band)
    F0 = pullpush(im0, inner); Bk = pullpush(im0, outer)
    d = F0 - Bk; n2 = (d * d).sum(2)
    a = np.clip(((im0 - Bk) * d).sum(2) / np.maximum(n2, 1e-3), 0, 1)
    a = np.where(n2 < 30 ** 2, soft(mask, 0.7), a)
    bandm = ndi.binary_dilation(mask, iterations=band) & ~inner
    alpha = np.where(inner, 1.0, np.where(bandm, a, 0.0)).astype(np.float32)
    Fg = pullpush(im, inner)
    rgb = np.where(inner[..., None], im, Fg)
    if overscan is not None:
        alpha = np.maximum(alpha, (ndi.binary_dilation(overscan, iterations=band + 1) & ndi.binary_dilation(mask, iterations=band) | overscan).astype(np.float32))
    return rgb, alpha

bgc = (np.sqrt(((im0 - BGC) ** 2).sum(2)) < 34) & (lum > 175)
def hairfinish(rgb, a, shrink=0.14):
    solid = ndi.binary_erosion(a > 0.97, iterations=1)
    ext = pullpush(rgb, solid); rgb = np.where(solid[..., None], rgb, ext)
    near_bg = ndi.gaussian_filter(ndi.binary_dilation(bgc, iterations=2).astype(np.float32), 1.0)
    a2 = np.clip((a - shrink) / (1 - shrink), 0, 1); a2 = ndi.gaussian_filter(a2, 0.45)
    a2 = a * (1 - near_bg) + np.minimum(a2, a) * near_bg
    return rgb, np.where(solid, 1.0, a2).astype(np.float32)

# ------------------------------------------------------------------ classes
dark = (lum < 78) & ((R - B) < 42)
face_poly = poly(GEOM["jaw"] + GEOM["face_top"])
earLp, earRp = poly(GEOM["earL"]), poly(GEOM["earR"])
feature_boxes = [GEOM["eyeL"], GEOM["eyeR"], GEOM["browLbox"], GEOM["browRbox"], (470, 520, 580, 560), (430, 575, 625, 645), (510, 330, 540, 356)]
lab, n = ndi.label(dark)
hair_all = np.zeros((H, W), bool)
for i, sl in enumerate(ndi.find_objects(lab), 1):
    if sl is None: continue
    comp = lab[sl] == i
    if comp.sum() < 30: continue
    ys, xs = sl
    inside = any(xs.start >= b[0] - 4 and xs.stop <= b[2] + 4 and ys.start >= b[1] - 4 and ys.stop <= b[3] + 4 for b in feature_boxes)
    if not inside and not (comp.sum() < 400 and face_poly[sl][comp].mean() > 0.9):
        hair_all[sl] |= comp
rim = ndi.binary_dilation(hair_all, iterations=2) & (lum < 175) & ~face_poly & ~bgc
hair_all = ndi.binary_closing(hair_all | rim, iterations=2)
# the brows are never hair (the brow boxes sit inside the face polygon's top)
hair_all &= ~(box(GEOM["browLbox"]) | box(GEOM["browRbox"]))
lockLp, lockRp = poly(GEOM["lockL"]), poly(GEOM["lockR"])
lockL = hair_all & lockLp & (yy > 446)
lockR = hair_all & lockRp & (yy > 476)
bunbox = box(GEOM["bunL"]) | box(GEOM["bunR"])
bun = hair_all & bunbox & ~lockLp & ~lockRp & (yy > 566)
_lb, _ = ndi.label(bun)
_sz = ndi.sum(bun, _lb, range(1, _lb.max() + 1))
bun = np.isin(_lb, 1 + np.where(_sz > 2000)[0])
hair = hair_all & ~lockL & ~lockR & ~bun
hair &= ~((yy > 560) & (xx > 330) & (xx < 720))
jx = [p[0] for p in GEOM["jaw"]]; jy = [p[1] for p in GEOM["jaw"]]
jaw_y = np.interp(np.arange(W), jx, jy, left=-1, right=-1)
below_jaw = (yy > jaw_y[None, :]) & (jaw_y[None, :] > 590)
nonhair = ~hair_all & ~bgc
ears = nonhair & (earLp | earRp) & ~face_poly & (yy < 590)
cand = nonhair & ~below_jaw & ~ears & (yy < 740)
lbl, k = ndi.label(cand)
face = lbl == lbl[500, 525]
face = ndi.binary_fill_holes(face | (face_poly & ~hair_all & (yy < 735) & ~below_jaw))
body = nonhair & ~face & ~ears & (yy > 590)
lb2, k2 = ndi.label(body)
sz = ndi.sum(body, lb2, range(1, k2 + 1))
body = np.isin(lb2, 1 + np.where(sz > 5000)[0])
fg = face | hair_all | ears | body
geom_out = {"size": [W, H], "rects": {}, "eyes": {}, "brows": {}, "src": "docs/design/round4/asha/images/rig-b.webp (rig space: rigspace.py)"}

# ------------------------------------------------------------------ eyes: openings traced per column from colour classes
eye_fill = np.zeros((H, W), bool)
sclera_c = (lum > 108) & ((R - B) < 118)
def smooth_curve(xs, ys, s=1.6, med=5):
    ys = ndi.median_filter(np.asarray(ys, np.float64), med, mode="nearest")
    return ndi.gaussian_filter1d(ys, s, mode="nearest")
for side in ("L", "R"):
    bx = GEOM["eye" + side]; eb = box(bx)
    icx, icy, ir = GEOM["iris" + side]; ccx, ccy, cr = GEOM["catch" + side]
    disk = (xx - icx) ** 2 + (yy - icy) ** 2 <= ir ** 2
    E = GEOM["eye" + side + "_pts"]
    xa, xb_ = int(E["top"][0][0]), int(E["top"][-1][0])
    X = np.arange(xa, xb_ + 1)
    T = PchipInterpolator([p[0] for p in E["top"]], [p[1] for p in E["top"]])(X)
    Bt = np.maximum(PchipInterpolator([p[0] for p in E["bot"]], [p[1] for p in E["bot"]])(X), T)
    opening = np.zeros((H, W), bool)
    for i, x in enumerate(X):
        if Bt[i] > T[i]: opening[int(round(T[i])):int(round(Bt[i])), x] = True
    # the lash band: the dark run above the opening, per column (and the wing beyond the outer corner)
    lashm = eb & (lum < 62) & ((R - B) < 30) & ~disk
    lashm = ndi.binary_closing(lashm, iterations=1)
    LXc = np.where(lashm.any(0))[0]
    LX = np.arange(max(int(LXc.min()), xa - 18), min(int(LXc.max()), xb_ + 18) + 1)
    LT = np.zeros(len(LX)); LB = np.zeros(len(LX))
    for i, x in enumerate(LX):
        ys = np.where(lashm[:, x])[0]
        if len(ys) == 0: LT[i] = np.nan; LB[i] = np.nan; continue
        if xa <= x <= xb_:
            t = T[x - xa]; ys = ys[ys < t + 2]
            if len(ys) == 0: LT[i] = t - 4; LB[i] = t; continue
            # the bottom-most contiguous run ending at the opening
            run = [ys[-1]]
            for y in ys[::-1][1:]:
                if run[-1] - y <= 2: run.append(y)
                else: break
            LT[i] = min(run); LB[i] = max(t, max(run) + 1)
        else:
            run = [ys[0]]
            for y in ys[1:]:
                if y - run[-1] <= 2: run.append(y)
                else: break
            LT[i] = min(run); LB[i] = max(run) + 1
    ok = ~np.isnan(LT)
    LT = np.interp(LX, LX[ok], LT[ok]); LB = np.interp(LX, LX[ok], LB[ok])
    LT = smooth_curve(LX, LT, 1.2, 5); LB = smooth_curve(LX, LB, 1.2, 5)
    # ---- sclera
    sc_area = ndi.binary_dilation(opening, iterations=14) & eb
    known = ndi.binary_dilation(opening, iterations=2) & ~ndi.binary_dilation(disk, iterations=2) & sclera_c
    sclera_rgb = pullpush(im, known, smooth_iters=200, region=sc_area & ~known)
    geom_out["rects"][f"sclera{side}"] = save_layer(f"sclera{side}", sclera_rgb, sc_area.astype(np.float32))
    # ---- iris: the disk, catchlight painted out, lid-covered top mirrored from the visible bottom (r8)
    catch = (xx - ccx) ** 2 + (yy - ccy) ** 2 <= (cr + 1.5) ** 2
    iris_area = (xx - icx) ** 2 + (yy - icy) ** 2 <= (ir + 3) ** 2
    known_i = disk & ~ndi.binary_dilation(catch, iterations=2) & ((xx - icx) ** 2 + (yy - icy) ** 2 <= (ir - 0.5) ** 2)
    covered = np.zeros((H, W), bool); low_cov = np.zeros((H, W), bool)
    for i, x in enumerate(X):
        covered[:int(np.ceil(T[i])) + 1, x] = True; low_cov[int(np.floor(Bt[i])) - 1:, x] = True
    known_i &= ~covered & ~low_cov & opening
    iris_src = im.copy()
    my = np.clip((2 * icy - yy).round().astype(int), 0, H - 1)
    mir = iris_area & (covered | low_cov) & known_i[my, xx]
    iris_src[mir] = im[my[mir], xx[mir]] * 0.85
    known_i = known_i | mir
    iris_rgb = pullpush(iris_src, known_i, smooth_iters=60, region=iris_area)
    ia = np.clip((ir + 0.3) - np.sqrt((xx - icx) ** 2 + (yy - icy) ** 2), 0, 1)
    geom_out["rects"][f"iris{side}"] = save_layer(f"iris{side}", iris_rgb, ia)
    cdist = np.sqrt((xx - ccx) ** 2 + (yy - ccy) ** 2)
    geom_out["rects"][f"catch{side}"] = save_layer(f"catch{side}", np.full_like(im, 255), np.clip((cr + 0.5) - cdist, 0, 1))
    # ---- upper lid: the lash band + the lid skin above it (feathered to 0 at the top), analytic lower edge in the opening
    fall = 24
    lid_alpha = np.zeros((H, W), np.float32); lidmask = np.zeros((H, W), bool)
    lashness = np.clip((150 - lum) / 100.0, 0, 1) * np.clip((45 - (R - B)) / 25.0, 0, 1)
    for i, x in enumerate(LX):
        ytop = LT[i] - fall
        for y in range(int(ytop), int(np.ceil(LB[i])) + 9):
            if not (0 <= y < H): continue
            lidmask[y, x] = True
            if y < LB[i] - 2.5: lid_alpha[y, x] = np.clip((y - ytop) / 16.0, 0, 1)
            elif y < LB[i] + 8 and not (xa + 2 <= x <= xb_ - 2): lid_alpha[y, x] = lashness[y, x]
    solid_lash = (lashness > 0.9) & lidmask
    lash_col = pullpush(im, ndi.binary_erosion(solid_lash, iterations=1) | (solid_lash & (lum < 45)))
    Tfull = np.interp(xx, X, np.minimum(T + 1.0, Bt))       # the lash's lower edge in the opening ~1 px below T
    inside = (xx >= xa + 2) & (xx <= xb_ - 2)
    band = inside & (yy >= Tfull - 6) & (yy <= Tfull + 3)
    cov = np.clip(Tfull + 0.5 - yy, 0, 1)
    endw = np.clip(np.minimum(xx - xa - 2, xb_ - 2 - xx) / 6.0, 0, 1)
    lid_alpha = np.where(band, cov * endw + lid_alpha * (1 - endw), lid_alpha)
    lid_alpha *= np.clip(np.minimum(xx - LX[0], LX[-1] - xx) / 2.0, 0, 1)
    lid_rgb = np.where((band & (yy >= Tfull - 4))[..., None], lash_col, im)
    lidmask |= band
    geom_out["rects"][f"lid{side}"] = save_layer(f"lid{side}", lid_rgb, lid_alpha)
    # ---- lower lid band
    low = np.zeros((H, W), np.float32)
    for i, x in enumerate(X):
        yb = Bt[i]
        for y in range(int(yb) - 2, int(yb) + 18):
            low[y, x] = np.clip(y + 0.5 - (yb - 0.5), 0, 1) * np.clip((yb + 17 - y) / 8.0, 0, 1)
    low *= np.clip(np.minimum(xx - xa, xb_ - xx) / 10.0, 0, 1)
    geom_out["rects"][f"lower{side}"] = save_layer(f"lower{side}", im, low)
    eye_fill |= ndi.binary_dilation(opening | lidmask, iterations=3)
    geom_out["eyes"][side] = {"x": [xa, xb_], "top": [round(float(v), 2) for v in T], "bot": [round(float(v), 2) for v in Bt],
        "lashX": [int(LX[0]), int(LX[-1])], "lashTop": [round(float(v), 2) for v in LT], "lashBot": [round(float(v), 2) for v in LB],
        "iris": [icx, icy, ir], "pupil": [icx, icy, ir * 0.5, ir * 0.5], "catch": [ccx, ccy, cr], "fall": fall}

# ------------------------------------------------------------------ brows: the dark stroke in each box, with a centreline
brow_fill = np.zeros((H, W), bool)
for side in ("L", "R"):
    bm = box(GEOM["brow" + side + "box"]) & (lum < 95) & ((R - B) < 60) & ~hair & ~lockL & ~lockR
    lb_, k_ = ndi.label(bm); szs = ndi.sum(bm, lb_, range(1, k_ + 1)); bm = lb_ == (1 + int(np.argmax(szs)))
    bm = ndi.binary_closing(bm, iterations=2)
    rgb, a = matte(bm, erode=1)
    geom_out["rects"][f"brow{side}"] = save_layer(f"brow{side}", rgb, a)
    ys_b, xs_b = np.where(bm)
    x0b, x1b = int(xs_b.min()), int(xs_b.max())
    cl = [float(np.where(bm[:, x])[0].mean()) if bm[:, x].any() else np.nan for x in range(x0b, x1b + 1)]
    cl = np.array(cl); okc = ~np.isnan(cl); cl = np.interp(np.arange(len(cl)), np.where(okc)[0], cl[okc])
    cl = ndi.gaussian_filter1d(cl, 2.0)
    geom_out["brows"][side] = {"x": [x0b, x1b], "y": [int(ys_b.min()), int(ys_b.max())], "cl": {"x0": x0b, "y": [round(float(v), 1) for v in cl]}}
    brow_fill |= ndi.binary_dilation(bm, iterations=4)

# ------------------------------------------------------------------ mouth: the traced lip line + the rest patch
MCX, MCY = 525, 606
LX0, LSTEP = 445, 4
line = []
for x in range(LX0, 609, LSTEP):
    col = lum[580:632, x]
    line.append(int(580 + int(np.argmin(col))))
line = [int(v) for v in ndi.median_filter(np.array(line), 3, mode="nearest")]
ELL, CORN, FEATH = (525, 612, 102, 46), [(446, 600, 18), (606, 600, 18)], 12.0
mreg = ((xx - ELL[0]) / ELL[2]) ** 2 + ((yy - ELL[1]) / ELL[3]) ** 2 <= 1
for x, y, r in CORN: mreg |= (xx - x) ** 2 + (yy - y) ** 2 <= r * r
dm = ndi.distance_transform_edt(mreg); ma = np.clip(dm / FEATH, 0, 1); ma = ndi.gaussian_filter((ma * ma * (3 - 2 * ma)).astype(np.float32), 1.0)
geom_out["rects"]["mouth_rest"] = save_layer("mouth_rest", im, ma)
lips = ndi.binary_dilation(mreg, iterations=2)
geom_out["mouthLine"] = {"x0": LX0, "step": LSTEP, "y": line}

# ------------------------------------------------------------------ face base: skin with the features removed, overscan
over_face = hair | lockL | lockR
_disk = lambda r: (np.add.outer(np.arange(-r, r + 1) ** 2, np.arange(-r, r + 1) ** 2) <= r * r)
face_area = face | (ndi.binary_dilation(face, iterations=28) & (hair | ears) & ~ndi.binary_dilation(bgc, iterations=6))
face_area |= ndi.binary_dilation(face, iterations=10) & (lockL | lockR | bun) & ~bgc
holes = eye_fill | brow_fill | lips
known = ndi.binary_erosion(face, iterations=3) & ~holes
face_rgb = pullpush(im, known, smooth_iters=400, region=face_area & ~known)
vis = ndi.binary_erosion(face, iterations=1) & ~holes
face_rgb[vis] = im[vis]
_, fa = matte(face, face_area & ~face, band=5)
# the chin: no ink contour, a shading step into the neck: feather the face over the neck across ~9 px
dj = (yy - jaw_y[None, :])
chin_band = (xx > 400) & (xx < 650) & (np.abs(dj) < 12) & (jaw_y[None, :] > 590)
_cb = np.clip(1.0 - dj / 9.0, 0, 1)
_cw = np.clip((xx - 405) / 30.0, 0, 1) * np.clip((645 - xx) / 30.0, 0, 1)
fa = np.where(chin_band, _cb * _cw + fa * (1 - _cw), fa)
face_rgb = np.where((chin_band & (dj >= -2))[..., None], im, face_rgb)
_nk = ndi.binary_dilation(body, iterations=1) & (dj > 1)
fa = np.where(_nk, fa * _cw * chin_band, fa)
_fl_, _ = ndi.label(fa > 0.02)
fa = np.where(_fl_ == _fl_[500, 525], fa, 0)
geom_out["rects"]["face"] = save_layer("face", face_rgb, fa)

# ------------------------------------------------------------------ ears (+ studs), continued under the hair and locks
ear_area = ndi.binary_fill_holes(ears | ((earLp | earRp) & (hair | lockL | lockR) & ~bgc)) | (ndi.binary_dilation(ears, iterations=10) & face)
ear_area &= (earLp | earRp) | face
ear_rgb = dehalo(im, ears, ear_area, erode=1, smooth=40)
inner_e = ndi.binary_erosion(ears, iterations=1); ear_rgb[inner_e] = im[inner_e]
_, ea = matte(ears, ear_area & ~ears)
ea = np.maximum(ea, soft(ear_area & ~ears & ~ndi.binary_dilation(bgc, iterations=1) & (earLp | earRp), 0.8))
geom_out["rects"]["ears"] = save_layer("ears", ear_rgb, ea)

# ------------------------------------------------------------------ hair front, bun, locks
for name, m in (("hair", hair), ("bun", bun), ("lockL", lockL), ("lockR", lockR)):
    over = None
    if name == "hair":   # the hair owns the locks' roots (opaque under their top 30 px; the locks fade in over it)
        roots = np.zeros_like(hair)
        for lk in (lockL, lockR):
            y0 = np.where(lk.any(1))[0].min(); roots |= lk & (yy < y0 + 30)
        m = hair | roots
    if name == "bun":    # one knot behind the neck: its whole shape is the convex hull of both lobes
        _pts = np.argwhere(bun)[:, ::-1].astype(np.int32)
        _hull = np.zeros((H, W), np.uint8); cv2.fillConvexPoly(_hull, cv2.convexHull(_pts), 1)
        bun_shape = _hull.astype(bool) & (yy > 566)
        over = bun_shape & ~bun & ~ndi.binary_dilation(bgc, iterations=1)
    if name.startswith("lock"):
        rgb, a = matte(m, None, band=2, erode=1)
        a = np.where(ndi.binary_dilation(m, iterations=2), a, 0)
        y0 = np.where(m.any(1))[0].min(); a = a * np.clip((yy - y0 - 6) / 24.0, 0, 1)
    else:
        rgb, a = matte(m, over)
    if over is not None:
        rgb = np.where((over & ~m)[..., None], pullpush(im, ndi.binary_erosion(m, iterations=2)), rgb)
        a = np.where(over & ~ndi.binary_dilation(m, iterations=2), soft(bun_shape, 0.8), a)
    # cream trapped inside the mask (between strands) matted out by colour (rj-p2d-trapped-cream-in-locks)
    cream_t = np.clip((lum - 70.0) / (205.0 - 70.0), 0, 1) * (np.sqrt(((im0 - BGC) ** 2).sum(2)) < 60)
    inner_m = ndi.binary_dilation(m, iterations=2)
    a = np.where(inner_m & ~(over if over is not None else np.zeros_like(m)), a * (1 - cream_t), a)
    rgb, a = hairfinish(rgb, a)
    geom_out["rects"][name] = save_layer(name, rgb, a)

# ------------------------------------------------------------------ lock bed: a clean plate under each lock (r8)
_lk_all = lockL | lockR
_fp = ndi.binary_dilation(_lk_all, iterations=3)
_known_bed = ~ndi.binary_dilation(_lk_all, iterations=2)
bed_rgb = pullpush(im, _known_bed, smooth_iters=60, region=_fp & ~_known_bed)
bed_a = soft(ndi.binary_dilation(_lk_all, iterations=2) & ~ndi.binary_dilation(bun, iterations=1), 0.7)
bed_rgb = np.where(_known_bed[..., None], im, bed_rgb)
_bl = 0.299 * bed_rgb[..., 0] + 0.587 * bed_rgb[..., 1] + 0.114 * bed_rgb[..., 2]
bed_a = bed_a * np.clip((190 - _bl) / 15.0, 0, 1)
geom_out["rects"]["lockbed"] = save_layer("lockbed", bed_rgb, bed_a)

# ------------------------------------------------------------------ hair back plate (behind the face and ears)
hb_area = ndi.binary_fill_holes(hair_all | face_poly | ears) & ~(yy > 600)
hb_area = ndi.binary_erosion(hb_area, iterations=12) & ~ndi.binary_dilation(bgc, iterations=12)
hb_rgb = pullpush(im, hair & ~ndi.binary_dilation(face_poly, iterations=4), smooth_iters=200, region=hb_area)
geom_out["rects"]["hairback"] = save_layer("hairback", hb_rgb, soft(hb_area, 1.0))

# ------------------------------------------------------------------ body: clothes + neck, the neck continued up behind the chin
nl, nr = GEOM["neck_x"]
_el = np.full(H, np.nan); _er = np.full(H, np.nan)
for _y in range(820, 640, -1):
    _r = np.where(body[_y, 340:720])[0]
    if len(_r) and _r.min() + 340 > nl - 30 and _r.max() + 340 < nr + 30 and _r.max() - _r.min() > 120:
        _el[_y], _er[_y] = _r.min() + 340, _r.max() + 340
_yt = int(np.nanargmin(np.where(np.isnan(_el), np.inf, np.arange(H))))
_el[:_yt] = _el[_yt]; _er[:_yt] = _er[_yt]
_el = np.where(np.isnan(_el), nl, _el); _er = np.where(np.isnan(_er), nr, _er)
neck_shape = (yy > 600) & (yy < 820) & (xx >= _el[:, None]) & (xx <= _er[:, None])
neck_up = neck_shape & ~body & ~ndi.binary_dilation(bgc, iterations=1) & ~lockL & ~lockR & ~ndi.binary_dilation(bun, iterations=1)
body_area = body | neck_up | (ndi.binary_dilation(body, iterations=8) & (lockL | lockR | hair | bun) & ~bgc)
neck_skin = ndi.binary_erosion(body, iterations=2) & ((R - B) > 60) & (yy < 820) & neck_shape
known_b = ndi.binary_erosion(body, iterations=2) & ~((yy < 820) & neck_shape & ((R - B) <= 60))
body_rgb = pullpush(im, known_b, smooth_iters=300, region=body_area & ~known_b)
neck_fill = pullpush(im, neck_skin, smooth_iters=300, region=neck_up)
body_rgb = np.where(neck_up[..., None], neck_fill, body_rgb)
_dv = ndi.distance_transform_edt(~(body & (yy < 820)))
body_rgb = body_rgb * (1 - 0.22 * np.clip(_dv / 30.0, 0, 1) * neck_up)[..., None]
body_rgb[ndi.binary_erosion(body, iterations=1)] = im[ndi.binary_erosion(body, iterations=1)]
_, ba = matte(body, (body_area & ~body) & ~neck_up)
ba = np.maximum(ba, soft(neck_up | (body & neck_shape), 0.9) * ndi.binary_dilation(neck_up, iterations=3))
geom_out["rects"]["body"] = save_layer("body", body_rgb, ba)

geom_out["rects"]["bg"] = [0, 0, W, H]
geom_out["geom"] = {k: v for k, v in GEOM.items()}
np.savez_compressed(f"{S}/masks.npz", hair=hair, bun=bun, lockL=lockL, lockR=lockR, ears=ears, face=face, body=body, hair_all=hair_all, bgc=bgc)
json.dump(geom_out, open(f"{OUT}/geom-layers.json", "w"), indent=1)
print("layers:", sorted(geom_out["rects"].keys()))
print("eyes:", {k: {kk: v[kk] for kk in ("x", "lashX", "iris")} for k, v in geom_out["eyes"].items()})
print("brows:", {k: v["x"] for k, v in geom_out["brows"].items()}, "mouth line:", line)
print({k: int(v.sum()) for k, v in dict(hair=hair, bun=bun, lockL=lockL, lockR=lockR, ears=ears, face=face, body=body).items()})
