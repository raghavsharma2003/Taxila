# Arm V (parametric vector) build: c-front -> layered vector regions with fitted soft-shading fields.
#
#   python3 scripts/character/puppet2d/V/build.py            (from the repo root)
#
# What it makes (art/character/puppet2d/V/puppet-v.json + puppet-v.js):
#   * every static region (hair back/front, locks, ears, face, neck, kurta, piping) as a closed vector contour,
#     tessellated into a mesh (Delaunay of boundary + interior lattice, filtered by the contour);
#   * a soft-shading FIELD per region: constant + Gaussian RBFs (coarse lattice, finer lattice where the art has
#     detail: nose, mouth corners, lids, ears) + edge-distance terms, fitted by ridge least squares to c-front with
#     the features (eyes, brows, lips, bindi, studs) removed and hidden areas push-pull filled. The field is
#     evaluated at the mesh vertices (a gradient mesh). No image is shipped and no image model is called;
#   * a 2.5D depth per vertex (one head dome shared by face and hair, so turns never tear; nose/lip/brow bumps;
#     bun and ears set back), plus jaw / cheek / sway weights that the runtime's vertex shader uses;
#   * a depth grid so the runtime can give its parametric features (eyes, brows, mouth) the same depth.
# The eyes, brows, mouth, bindi, studs, lashes are NOT here: they are parametric shapes built per frame by rig.js.
import json, math, os, sys
import numpy as np, cv2
from PIL import Image
from scipy.spatial import Delaunay
from scipy.ndimage import map_coordinates, distance_transform_edt, gaussian_filter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.."))
SRC = os.path.join(ROOT, "docs/design/teacher/stylised/concepts/c-front.webp")
OUT = os.path.join(ROOT, "art/character/puppet2d/V")
WORK = os.path.join(OUT, "work")
os.makedirs(WORK, exist_ok=True)
SPEC = json.load(open(os.path.join(os.path.dirname(__file__), "shapes.json")))

img = np.asarray(Image.open(SRC).convert("RGB")).astype(np.float32)
H, W = img.shape[:2]
R, G, B = img[..., 0], img[..., 1], img[..., 2]
luma = 0.299 * R + 0.587 * G + 0.114 * B
sat = img.max(-1) - img.min(-1)


def poly_mask(pts, closed=True):
    m = np.zeros((H, W), np.uint8)
    p = np.round(np.array(pts, np.float32) * 8).astype(np.int32)
    cv2.fillPoly(m, [p], 1, lineType=cv2.LINE_8, shift=3)
    return m.astype(bool)


def catmull(pts, n=8, closed=True):
    P = np.array(pts, float)
    out = []
    k = len(P)
    rng = range(k) if closed else range(k - 1)
    for i in rng:
        p0, p1, p2, p3 = P[(i - 1) % k], P[i], P[(i + 1) % k], P[(i + 2) % k]
        if not closed:
            p0 = P[max(i - 1, 0)]; p3 = P[min(i + 2, k - 1)]
        for t in np.linspace(0, 1, n, endpoint=False):
            t2, t3 = t * t, t * t * t
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3))
    if not closed:
        out.append(P[-1])
    return np.array(out)


def disk(c, r):
    yy, xx = np.mgrid[0:H, 0:W]
    return (xx - c[0]) ** 2 + (yy - c[1]) ** 2 <= r * r


def dil(m, r):
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))
    return cv2.dilate(m.astype(np.uint8), k).astype(bool)


def ero(m, r):
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))
    return cv2.erode(m.astype(np.uint8), k).astype(bool)


def fill_holes(m):
    m8 = m.astype(np.uint8).copy()
    ff = np.zeros((H + 2, W + 2), np.uint8)
    inv = (1 - m8).copy()
    cv2.floodFill(inv, ff, (0, 0), 2)
    return (inv != 2) | m


# ---------------------------------------------------------------- segmentation
bgc = np.array([252, 230, 188.0])
d_bg = np.sqrt(((img - bgc) ** 2).sum(-1))
n, lab = cv2.connectedComponents((d_bg < 28).astype(np.uint8))
border = set(np.unique(np.r_[lab[0], lab[-1], lab[:, 0], lab[:, -1]])) - {0}
BG = np.isin(lab, list(border))
DARK = (luma < 105) & (sat < 60)
TEAL = B > R + 30
GR = G / (R + 1)
PIPE = (GR < 0.56) & (R > 150) & ~TEAL & (np.mgrid[0:H, 0:W][0] > 720)
PIPE = ero(dil(PIPE, 1), 1) & dil(TEAL, 16)
SKIN = ~BG & ~DARK & ~TEAL & ~PIPE

S = SPEC
FACE = poly_mask(catmull(S["face"], 10))
EAR_L = poly_mask(catmull(S["ear_L"], 8))
EAR_R = poly_mask(catmull(S["ear_R"], 8))

# features (excluded from the skin fits; drawn parametrically at runtime)
feat = np.zeros((H, W), bool)
for box in S["eye_boxes"]:
    x0, y0, x1, y1 = box
    sub = np.zeros((H, W), bool); sub[y0:y1, x0:x1] = True
    nonskin = sub & ((luma < 110) | (sat < 70))
    feat |= fill_holes(dil(nonskin, 2))
for box in S["brow_boxes"]:
    x0, y0, x1, y1 = box
    sub = np.zeros((H, W), bool); sub[y0:y1, x0:x1] = True
    feat |= dil(sub & DARK, 4)
feat |= disk(S["bindi"][:2], S["bindi"][2] + 4)
feat |= dil(poly_mask(catmull(S["lips"], 8)), 5)
STUDS = np.zeros((H, W), bool)
for c in S["studs"]:
    STUDS |= disk(c[:2], c[2] + 3)

# hair
featbox = np.zeros((H, W), bool)
for box in S["eye_boxes"] + S["brow_boxes"]:
    x0, y0, x1, y1 = box; featbox[y0:y1, x0:x1] = True
featbox |= disk(S["bindi"][:2], 14)
HAIR = DARK & ~featbox
HAIR = dil(ero(HAIR, 1), 1) | (DARK & ~featbox)


def tube(center, half):
    pts = catmull(center, 10, closed=False)
    m = np.zeros((H, W), np.uint8)
    for i in range(len(pts) - 1):
        w = half[0] + (half[1] - half[0]) * i / (len(pts) - 1)
        cv2.line(m, tuple(np.round(pts[i]).astype(int)), tuple(np.round(pts[i + 1]).astype(int)), 1, int(round(2 * w)))
    return m.astype(bool)


LOCK_L = HAIR & tube(S["lock_L"]["c"], S["lock_L"]["half"]) & (np.mgrid[0:H, 0:W][0] >= S["lock_L"]["ymin"])
LOCK_R = HAIR & tube(S["lock_R"]["c"], S["lock_R"]["half"]) & (np.mgrid[0:H, 0:W][0] >= S["lock_R"]["ymin"])
# keep only the main component of each lock
for nm in ("LOCK_L", "LOCK_R"):
    m = globals()[nm].astype(np.uint8)
    k, lb, st, _ = cv2.connectedComponentsWithStats(m)
    if k > 1:
        big = 1 + np.argmax(st[1:, 4]); globals()[nm] = lb == big
LOCKS = LOCK_L | LOCK_R
HAIR_NL = HAIR & ~LOCKS
yy, xx = np.mgrid[0:H, 0:W]
FRONT_RULE = np.zeros((H, W), bool)
fr = S["front"]
FRONT_RULE |= poly_mask(fr["poly"])
HAIR_FRONT = HAIR_NL & (FRONT_RULE | (dil(FACE, 5) & (yy < fr["face_adj_ymax"])))
HAIR_FRONT = fill_holes(HAIR_FRONT) & ~FACE | (HAIR_NL & FACE)
HAIR_FRONT &= HAIR_NL
# hair back: the whole silhouette minus the locks, filled behind the face top and behind the locks
HB_EXT = (FACE & (yy < S["hair_back_face_ymax"])) | EAR_L | EAR_R
HAIR_BACK = fill_holes(HAIR_NL | HB_EXT | (dil(HAIR_NL, 6) & LOCKS))
HAIR_BACK &= ~(EAR_L | EAR_R) | dil(HAIR_NL, 3) | (FACE & (yy < S["hair_back_face_ymax"]))
# behind-lock fill where the lock sits over the hair mass
HAIR_BACK |= LOCKS & dil(HAIR_NL, 10)

NECK_VIS = SKIN & ~FACE & ~EAR_L & ~EAR_R & (yy > 600) & (xx > 380) & (xx < 690) & ~STUDS
k, lb, st, _ = cv2.connectedComponentsWithStats(NECK_VIS.astype(np.uint8))
NECK_VIS = lb == (1 + np.argmax(st[1:, 4]))
KURTA = fill_holes(TEAL | PIPE)
KURTA = ero(dil(KURTA, 2), 2)
NECK = NECK_VIS | poly_mask(S["neck_hidden"]) | (dil(NECK_VIS, 10) & KURTA & ~TEAL) | (dil(NECK_VIS, 8) & KURTA)
NECK = fill_holes(NECK)
PIPING = PIPE

EARS_VIS = {"ear_L": SKIN & EAR_L & ~FACE & ~STUDS, "ear_R": SKIN & EAR_R & ~FACE & ~STUDS}


# ---------------------------------------------------------------- push-pull fill (smooth hole filling)
def push_pull(im, known):
    lv = [(im * known[..., None], known.astype(np.float32))]
    while min(lv[-1][1].shape) > 4:
        c, w = lv[-1]
        c2 = cv2.resize(c, (c.shape[1] // 2, c.shape[0] // 2), interpolation=cv2.INTER_AREA)
        w2 = cv2.resize(w, (w.shape[1] // 2, w.shape[0] // 2), interpolation=cv2.INTER_AREA)
        lv.append((c2, w2))
    c, w = lv[-1]
    cur = c / np.maximum(w, 1e-6)[..., None]
    for c, w in reversed(lv[:-1]):
        up = cv2.resize(cur, (c.shape[1], c.shape[0]), interpolation=cv2.INTER_LINEAR)
        ww = np.clip(w * 1.0, 0, 1)[..., None]
        val = c / np.maximum(w, 1e-6)[..., None]
        cur = val * ww + up * (1 - ww)
    return cur


# ---------------------------------------------------------------- mesh from region mask
def contour_of(mask, smooth=1.2):
    m = gaussian_filter(mask.astype(np.float32), 0.8)
    up = cv2.resize(m, (W * 4, H * 4), interpolation=cv2.INTER_LINEAR)
    cnts, hier = cv2.findContours((up > 0.5).astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    out = []
    for c in cnts:
        if cv2.contourArea(c) < 16 * 30:
            continue
        p = c[:, 0, :].astype(np.float64) / 4.0
        # resample by arc length every ~2.2 px, then smooth
        seg = np.sqrt((np.diff(np.vstack([p, p[:1]]), axis=0) ** 2).sum(1))
        L = seg.sum(); s = np.r_[0, np.cumsum(seg)][:-1]
        nS = max(12, int(L / 2.2))
        t = np.linspace(0, L, nS, endpoint=False)
        q = np.c_[np.interp(t, s, p[:, 0], period=L), np.interp(t, s, p[:, 1], period=L)]
        if smooth > 0:
            q = np.c_[gaussian_filter(q[:, 0], smooth, mode="wrap"), gaussian_filter(q[:, 1], smooth, mode="wrap")]
        out.append(q)
    return out


def mesh_of(mask, spacing):
    cs = contour_of(mask)
    bpts = np.vstack(cs)
    inner = ero(mask, max(2, int(spacing * 0.6)))
    gy, gx = np.mgrid[0:H:spacing, 0:W:spacing].astype(np.float64)
    gx += (np.arange(gx.shape[0])[:, None] % 2) * spacing * 0.5  # hex-ish lattice
    gx = gx.ravel(); gy = gy.ravel()
    ok = (gx < W) & inner[np.clip(gy.astype(int), 0, H - 1), np.clip(gx.astype(int), 0, W - 1)]
    pts = np.vstack([bpts, np.c_[gx[ok], gy[ok]]])
    tri = Delaunay(pts)
    T = tri.simplices
    cen = pts[T].mean(1)
    sm = gaussian_filter(mask.astype(np.float32), 0.7)
    inside = map_coordinates(sm, [cen[:, 1], cen[:, 0]], order=1) > 0.5
    # also drop slivers that bridge concavities: check edge midpoints
    for a, b in ((0, 1), (1, 2), (2, 0)):
        mid = (pts[T[:, a]] + pts[T[:, b]]) / 2
        inside &= map_coordinates(sm, [mid[:, 1], mid[:, 0]], order=1) > 0.35
    T = T[inside]
    used = np.unique(T)
    remap = -np.ones(len(pts), int); remap[used] = np.arange(len(used))
    return pts[used], remap[T], cs


# ---------------------------------------------------------------- shading field fit (ridge LS over RBF + edge terms)
def centers(mask, spacing, box=None):
    gy, gx = np.mgrid[0:H:spacing, 0:W:spacing].astype(np.float64)
    gx = gx.ravel() + spacing / 2; gy = gy.ravel() + spacing / 2
    if box:
        x0, y0, x1, y1 = box
        k = (gx >= x0) & (gx < x1) & (gy >= y0) & (gy < y1); gx, gy = gx[k], gy[k]
    k = (gx < W) & (gy < H)
    gx, gy = gx[k], gy[k]
    md = dil(mask, int(spacing))
    k = md[gy.astype(int), gx.astype(int)]
    return np.c_[gx[k], gy[k], np.full(k.sum(), spacing * 0.85)]


def basis(P, C, dist, coarse):
    # P: (n,2) points; C: (k,3) centres with sigma; dist: (n,) inside edge distance; coarse: (m,3)
    cols = [np.ones((len(P), 1))]
    d2 = ((P[:, None, 0] - C[None, :, 0]) ** 2 + (P[:, None, 1] - C[None, :, 1]) ** 2) / (C[None, :, 2] ** 2)
    cols.append(np.exp(-0.5 * d2))
    dc2 = ((P[:, None, 0] - coarse[None, :, 0]) ** 2 + (P[:, None, 1] - coarse[None, :, 1]) ** 2) / (coarse[None, :, 2] ** 2)
    g = np.exp(-0.5 * dc2)
    for tau in (2.5, 7.0):
        cols.append(g * np.exp(-dist / tau)[:, None])
    return np.hstack(cols)


def fit_field(region, target, spacing, fine=(), lam=1e-3, step=2):
    C = centers(region, spacing)
    for box, sp in fine:
        C = np.vstack([C, centers(region, sp, box)])
    ys, xs = np.mgrid[0:H, 0:W]
    bb = np.argwhere(region)
    y0, x0 = bb.min(0); y1, x1 = bb.max(0)
    coarse = centers(region, 90)
    dist = distance_transform_edt(region)
    sel = region.copy(); sel[::step, :] &= True
    sm = np.zeros_like(region); sm[::step, ::step] = True
    sel &= sm
    py, px = np.nonzero(sel)
    P = np.c_[px, py].astype(np.float64)
    Y = target[py, px] / 255.0
    K = 1 + len(C) + 2 * len(coarse)
    AtA = np.zeros((K, K)); AtY = np.zeros((K, 3))
    for i in range(0, len(P), 4000):
        A = basis(P[i:i + 4000], C, dist[py[i:i + 4000], px[i:i + 4000]], coarse)
        AtA += A.T @ A; AtY += A.T @ Y[i:i + 4000]
    reg = lam * np.trace(AtA) / K
    coef = np.linalg.solve(AtA + reg * np.eye(K), AtY)
    return dict(C=C, coarse=coarse, coef=coef, dist=dist)


def eval_field(F, P):
    d = map_coordinates(F["dist"], [P[:, 1], P[:, 0]], order=1)
    out = np.zeros((len(P), 3))
    for i in range(0, len(P), 4000):
        out[i:i + 4000] = basis(P[i:i + 4000], F["C"], d[i:i + 4000], F["coarse"]) @ F["coef"]
    return np.clip(out * 255, 0, 255)


# ---------------------------------------------------------------- depth
head_sil = HAIR_NL | FACE | EAR_L | EAR_R
dt = distance_transform_edt(head_sil)
DM = S["depth"]["dome_dm"]
h = np.where(dt < DM, np.sqrt(np.clip(dt * (2 * DM - dt), 0, None)) / DM, 1.0)
h = gaussian_filter(h, S["depth"]["dome_blur"])
h /= h.max()
DOME = h * S["depth"]["dome_rz"]


def gauss2(c, s, amp):
    return amp * np.exp(-0.5 * (((xx - c[0]) / s[0]) ** 2 + ((yy - c[1]) / s[1]) ** 2))


BUMPS = np.zeros((H, W))
for b in S["depth"]["bumps"]:
    BUMPS += gauss2(b["c"], b["s"], b["amp"])
FACE_Z = DOME + BUMPS
bun = S["depth"]["bun"]
WB = np.exp(-0.5 * (((xx - bun["c"][0]) / bun["s"][0]) ** 2 + ((yy - bun["c"][1]) / bun["s"][1]) ** 2))
HAIR_Z = DOME * (1 - WB) + bun["z"] * WB


def samp(field, P):
    return map_coordinates(field, [P[:, 1], P[:, 0]], order=1, mode="nearest")


# jaw / cheek weights (the runtime mirrors these exactly: rig.js jawW / cheekW)
JW = S["jaw"]


def jaw_w(P):
    x, y = P[:, 0], P[:, 1]
    t = np.clip((y - JW["y0"]) / (JW["y1"] - JW["y0"]), 0, 1)
    t = t * t * (3 - 2 * t)
    hx = np.clip((np.abs(x - JW["cx"]) - JW["hx0"]) / (JW["hx1"] - JW["hx0"]), 0, 1)
    return t * (1 - hx * hx * (3 - 2 * hx))


def cheek_w(P, c, s):
    return np.exp(-0.5 * (((P[:, 0] - c[0]) / s[0]) ** 2 + ((P[:, 1] - c[1]) / s[1]) ** 2))


# ---------------------------------------------------------------- regions
regions = []
dbg = np.zeros((H, W, 3), np.float32)
target_full = img.copy()


def add_region(rid, mask, vis, spacing, fit_sp, fine=(), group="head", z="face", extra=None, lam=1e-3, alpha=255):
    known = vis & mask
    T = push_pull(img, known.astype(np.float32))
    T = np.where(known[..., None], img, T)
    F = fit_field(mask, T, fit_sp, fine, lam=lam)
    P, tri, cs = mesh_of(mask, spacing)
    col = eval_field(F, P)
    if z == "face":
        Z = samp(FACE_Z, P)
    elif z == "hair":
        Z = samp(HAIR_Z, P) + S["depth"]["hair_off"]
    elif z == "hair_front":
        Z = samp(HAIR_Z, P) + S["depth"]["hair_front_off"]
    elif z == "ear":
        Z = samp(DOME, P) + S["depth"]["ear_off"]
    elif isinstance(z, (int, float)):
        Z = np.full(len(P), float(z))
    else:
        Z = z(P)
    w = np.zeros((len(P), 4))
    if rid == "face":
        w[:, 0] = jaw_w(P)
        w[:, 1] = cheek_w(P, S["cheek"]["L"]["c"], S["cheek"]["L"]["s"])
        w[:, 2] = cheek_w(P, S["cheek"]["R"]["c"], S["cheek"]["R"]["s"])
    if extra:
        extra(P, w)
    regions.append(dict(id=rid, group=group, P=P, T=tri, col=col, Z=Z, w=w, contours=cs, alpha=alpha))
    # debug composite of the fitted field over the region
    print(f"{rid:12s} verts {len(P):6d} tris {len(tri):6d} rbf {len(F['C']):5d}", file=sys.stderr)
    return F


def sway(lock):
    pts = catmull(S[lock]["c"], 10, closed=False)
    seg = np.sqrt((np.diff(pts, axis=0) ** 2).sum(1)); s = np.r_[0, np.cumsum(seg)]; L = s[-1]
    y_anchor = S[lock]["ymin"]

    def f(P, w):
        d2 = ((P[:, None, :] - pts[None, :, :]) ** 2).sum(-1)
        j = d2.argmin(1)
        t = s[j] / L
        w[:, 3] = np.clip(t, 0, 1)
    return f


fine_face = [(tuple(b), sp) for b, sp in S["fine"]["face"]]
def bunw(P, w):
    w[:, 3] = samp(WB, P)


add_region("hair_back", HAIR_BACK, HAIR_NL, 6, 12, [(tuple(b), sp) for b, sp in S["fine"]["hair"]], z="hair", extra=bunw)
add_region("neck", NECK, NECK_VIS, 7, 12, [((430, 690, 640, 760), 7)], group="neck", z=lambda P: 20 + 0 * P[:, 0])
add_region("kurta", KURTA, TEAL, 9, 22, [((380, 720, 680, 1024), 11)], group="body", z=0)
add_region("piping", PIPING, PIPING, 3, 8, group="body", z=1)
add_region("ear_L", EAR_L, EARS_VIS["ear_L"], 4, 7, z="ear")
add_region("ear_R", EAR_R, EARS_VIS["ear_R"], 4, 7, z="ear")
add_region("face", FACE, SKIN & FACE & ~feat & ~STUDS, 6, 16, fine_face, z="face")
add_region("hair_front", HAIR_FRONT, HAIR_FRONT, 5, 10, [(tuple(b), sp) for b, sp in S["fine"]["hair"]], z="hair_front")
add_region("lock_L", LOCK_L, LOCK_L, 3, 6, group="lock_L", z="hair_front", extra=sway("lock_L"))
add_region("lock_R", LOCK_R, LOCK_R, 3, 6, group="lock_R", z="hair_front", extra=sway("lock_R"))

# depth grid for the runtime features (face z incl. bumps), 128 x 128 over the 1024 canvas
ZG = cv2.resize(FACE_Z.astype(np.float32), (128, 128), interpolation=cv2.INTER_AREA)

# ---------------------------------------------------------------- serialise (compact)
out = dict(W=W, H=H, bg=[int(v) for v in bgc], spec=dict(jaw=S["jaw"], cheek=S["cheek"], pivots=S["pivots"]),
           zgrid=dict(n=128, data=[round(float(v), 1) for v in ZG.ravel()]), regions=[])
total_v = total_t = 0
for r in regions:
    P = r["P"]
    out["regions"].append(dict(
        id=r["id"], group=r["group"],
        p=[round(float(v), 2) for v in P.ravel()],
        z=[round(float(v), 1) for v in r["Z"]],
        c=[int(round(v)) for v in r["col"].ravel()],
        w=[round(float(v), 3) for v in r["w"].ravel()],
        t=[int(v) for v in r["T"].ravel()],
    ))
    total_v += len(P); total_t += len(r["T"])
json.dump(out, open(os.path.join(OUT, "puppet-v.json"), "w"), separators=(",", ":"))
with open(os.path.join(OUT, "puppet-v.js"), "w") as f:
    f.write("window.PUPPET_V=")
    json.dump(out, f, separators=(",", ":"))
    f.write(";\n")
print(f"total verts {total_v} tris {total_t}", file=sys.stderr)

# debug masks overlay
vis = np.zeros((H, W, 3), np.uint8)
cols = dict(hair_back=(60, 60, 200), hair_front=(200, 60, 200), lock_L=(255, 255, 0), lock_R=(0, 255, 255), neck=(200, 120, 60),
            kurta=(0, 120, 120), piping=(255, 90, 0), ear_L=(255, 0, 0), ear_R=(0, 255, 0), face=(240, 180, 120))
masks = dict(hair_back=HAIR_BACK, neck=NECK, kurta=KURTA, piping=PIPING, ear_L=EAR_L, ear_R=EAR_R, face=FACE, hair_front=HAIR_FRONT, lock_L=LOCK_L, lock_R=LOCK_R)
for k in ["hair_back", "neck", "kurta", "piping", "ear_L", "ear_R", "face", "hair_front", "lock_L", "lock_R"]:
    vis[masks[k]] = cols[k]
vis[feat] = (vis[feat] * 0.4).astype(np.uint8)
Image.fromarray(vis).save(os.path.join(WORK, "masks.png"))
Image.fromarray((np.clip(DOME / DOME.max(), 0, 1) * 255).astype(np.uint8)).save(os.path.join(WORK, "dome.png"))
