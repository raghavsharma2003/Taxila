"""Painted keys at exact registration (lamp2). For every key edit (raw/<key>-t<n>.png, or a Stage B edit):
  1. register the repaint to the front: ORB + RANSAC similarity on features OUTSIDE the key's region, then ECC
     (affine) on a window round the region with the region itself masked out;
  2. colour: a per-channel gain + offset fitted on the ring just outside the region, then the remaining boundary
     difference spread inside by a membrane (Laplace) solve, so the key meets the front with no step;
  3. composite: comp = front * (1 - m) + key * m, m = the region mask feathered INWARD (m = 0 on and outside the
     region boundary), so every pixel outside the region is the front's, bit for bit;
  4. prove it: SSIM(comp, front) over the pixels outside the region (gate >= 0.995; by construction 1.0), plus the
     seam residual on the ring (mean |key - front| in 0-255 before and after the colour fit).
Regions are hand-read on a 20 px grid in rig space (scratch grid-eyes.png, grid-mouth.png).
    python3 -I keys.py <key>=<file> [...]      (writes rs/k-<key>.png comp + rs/m-<key>.png mask, evidence/keys.json)"""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
import numpy as np, cv2
from PIL import Image
from scipy import ndimage as ndi
from scipy.sparse import lil_matrix
from scipy.sparse.linalg import spsolve

def ell(cx, cy, rx, ry_top, ry_bot):
    yy, xx = np.mgrid[0:1024, 0:1024].astype(np.float32)
    ry = np.where(yy < cy, ry_top, ry_bot)
    return ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2 <= 1.0

# region masks (rig space). Feather = px of inward soft edge.
REGIONS = {
    # lips, the corners' creases and the chin pad; above the chin contour (y ~720) and below the nose base (y ~550)
    # v3 K2: lips only (K1: "facial shading shifts around the mouth": every repaint shades the cheeks and chin pad a
    # little differently, so the skin round the lips is now always the front's)
    "mouth": (lambda: ell(527, 613, 112, 44, 64), 12),
    # both eyes with lids, lashes, the lid crease and the lower-lid shadow; under the brows
    "eyes": (lambda: ell(421, 413, 76, 32, 40) | ell(627, 413, 76, 32, 40), 9),
    # both brows with the skin round them, down to just above the lid crease
    # P2: wider and deeper (J2: the old inner brow ends sat on the region edge and the boundary fill dragged them inward
    # as a ghost); the two lobes now meet over the nose bridge
    "brows": (lambda: ell(420, 358, 116, 42, 40) | ell(630, 356, 116, 42, 40), 10),
}
KEY_REGION = {k: "mouth" for k in ["mbp", "aa", "eh", "ee", "oh", "oo", "fv", "ltd", "smile", "calm"]}
KEY_REGION.update({k: "eyes" for k in ["closed", "half", "lookL", "lookR", "lookUp"]})
KEY_REGION.update({k: "brows" for k in ["raised", "concern"]})

def to_rs(path):
    im = Image.open(path).convert("RGB")
    if path.endswith(".webp") and "/images/" in path:   # a Stage B edit: full 1024 front frame -> rig space
        im = im.crop((X0, Y0, X0 + SZ, Y0 + SZ)).resize((1024, 1024), Image.LANCZOS)
    return np.asarray(im).astype(np.float32)

def register(front, key, region):
    g1 = cv2.cvtColor(front.astype(np.uint8), cv2.COLOR_RGB2GRAY); g2 = cv2.cvtColor(key.astype(np.uint8), cv2.COLOR_RGB2GRAY)
    excl = (~ndi.binary_dilation(region, iterations=30)).astype(np.uint8) * 255
    orb = cv2.ORB_create(6000)
    k1, d1 = orb.detectAndCompute(g1, excl); k2, d2 = orb.detectAndCompute(g2, excl)
    m = sorted(cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True).match(d2, d1), key=lambda x: x.distance)[:1200]
    p2 = np.float32([k2[x.queryIdx].pt for x in m]); p1 = np.float32([k1[x.trainIdx].pt for x in m])
    M, inl = cv2.estimateAffinePartial2D(p2, p1, method=cv2.RANSAC, ransacReprojThreshold=2.5)
    w = cv2.warpAffine(key, M, (1024, 1024), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE)
    # ECC refinement on a window round the region (the face near the key is what must line up)
    ys, xs = np.where(region)
    x0, x1, y0, y1 = max(0, xs.min() - 90), min(1024, xs.max() + 90), max(0, ys.min() - 90), min(1024, ys.max() + 90)
    win = np.zeros((1024, 1024), np.uint8); win[y0:y1, x0:x1] = 255
    win[ndi.binary_dilation(region, iterations=4)] = 0
    W = np.eye(2, 3, dtype=np.float32)
    a = cv2.GaussianBlur(cv2.cvtColor(front.astype(np.uint8), cv2.COLOR_RGB2GRAY).astype(np.float32), (0, 0), 1.2)
    b = cv2.GaussianBlur(cv2.cvtColor(w.clip(0, 255).astype(np.uint8), cv2.COLOR_RGB2GRAY).astype(np.float32), (0, 0), 1.2)
    try:
        _, W = cv2.findTransformECC(a, b, W, cv2.MOTION_AFFINE, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 200, 1e-6), win, 5)
        w = cv2.warpAffine(w, W, (1024, 1024), flags=cv2.INTER_LANCZOS4 + cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REPLICATE)
    except cv2.error as e:
        print("ECC failed", e)
    s = float(np.hypot(M[0, 0], M[1, 0]))
    return w, {"orb_scale": round(s, 4), "orb_rot_deg": round(float(np.degrees(np.arctan2(M[1, 0], M[0, 0]))), 3),
               "orb_shift_px": [round(float(M[0, 2]), 1), round(float(M[1, 2]), 1)], "inliers": int(inl.sum()),
               "ecc_affine": [[round(float(v), 4) for v in r] for r in W]}

def membrane(diff, region):
    """harmonic fill of `diff` (H x W x 3, known outside `region`) inside the region's bbox"""
    ys, xs = np.where(region)
    y0, y1, x0, x1 = ys.min() - 1, ys.max() + 2, xs.min() - 1, xs.max() + 2
    R = region[y0:y1, x0:x1]; D = diff[y0:y1, x0:x1]
    idx = -np.ones(R.shape, int); pts = np.argwhere(R); idx[R] = np.arange(len(pts))
    A = lil_matrix((len(pts), len(pts))); B = np.zeros((len(pts), 3))
    for n, (y, x) in enumerate(pts):
        A[n, n] = 4
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            yy, xx = y + dy, x + dx
            if R[yy, xx]: A[n, idx[yy, xx]] = -1
            else: B[n] += D[yy, xx]
    sol = spsolve(A.tocsr(), B)
    out = diff.copy(); sub = out[y0:y1, x0:x1]; sub[R] = sol; return out

def ssim_map(x, y):
    x = x.mean(2) / 255; y = y.mean(2) / 255; f = lambda v: ndi.gaussian_filter(v, 1.5)
    mx, my = f(x), f(y); vx = f(x * x) - mx * mx; vy = f(y * y) - my * my; cv = f(x * y) - mx * my
    return ((2 * mx * my + 1e-4) * (2 * cv + 9e-4)) / ((mx * mx + my * my + 1e-4) * (vx + vy + 9e-4))

def build(key, path, front):
    rname = KEY_REGION[key]; region = REGIONS[rname][0](); feather = REGIONS[rname][1]
    raw = to_rs(path)
    reg, info = register(front, raw, region)
    ring = ndi.binary_dilation(region, iterations=24) & ~region
    before = float(np.abs(reg[ring] - front[ring]).mean())
    # gain + offset per channel on the ring
    fit = []
    for c in range(3):
        A = np.stack([reg[..., c][ring], np.ones(ring.sum())], 1)
        g, o = np.linalg.lstsq(A, front[..., c][ring], rcond=None)[0]
        reg[..., c] = reg[..., c] * g + o; fit.append([round(float(g), 4), round(float(o), 2)])
    after_fit = float(np.abs(reg[ring] - front[ring]).mean())
    # membrane: the leftover boundary difference spread inside the region. P2: low-passed first (sigma 3 px), so only
    # the colour step crosses the border, never a sharp line of the front (J2: the lid crease came in as a brow ghost)
    diff = ndi.gaussian_filter(front - reg, sigma=(3, 3, 0))
    reg = reg + membrane(diff, region) * region[..., None]
    m = np.clip(ndi.distance_transform_edt(region) / feather, 0, 1).astype(np.float32)
    m = m * m * (3 - 2 * m)
    comp = front * (1 - m[..., None]) + reg * m[..., None]
    comp = comp.clip(0, 255)
    outside = ~region
    S_ = ssim_map(comp, front)
    res = {"key": key, "src": os.path.basename(path), "region": rname, "feather_px": feather, **info,
           "ring_mean_abs_diff_255": {"registered": round(before, 2), "after_gain_offset": round(after_fit, 2)}, "gain_offset_rgb": fit,
           "ssim_outside_region": round(float(S_[ndi.binary_erosion(outside, iterations=4)].mean()), 5),
           "max_abs_diff_outside_region_255": float(np.abs(comp - front)[outside].max()),
           "region_px": int(region.sum())}
    Image.fromarray(comp.round().astype(np.uint8)).save(f"{S}/rs/k-{key}.png")
    Image.fromarray((m * 255).round().astype(np.uint8)).save(f"{S}/rs/m-{rname}.png")
    return res

# The chosen take of every key (review notes in RESULTS.md): raw/<key>-t<n>.png, or a Stage B edit of rig-b.
# eh / oh t3 were painted FROM the aa composite and ltd t3 FROM the ee composite (P1: one set of teeth per family).
# P3's aa t4 (a fuller interior) and its eh / oh t4 are on file and NOT used: J4 regressed ("teeth a flat block").
# v3 (one mouth model sheet): ee, ltd, fv, oo t5 painted FROM the aa t1 composite too, so all seven open mouths share
# aa's teeth; lookUp t5 (both irises move the same, measured < 1 px apart).
STAGEB = "/home/user/Taxila/docs/design/round4/asha/images"
SOURCES = {"mbp": "t1", "aa": "t1", "eh": "t3", "ee": "t5", "oh": "t3", "oo": "t5", "fv": "t5", "ltd": "t5", "smile": "t1",
           "calm": "t1", "lookL": "t1", "lookR": "t1", "lookUp": "t5", "raised": "t1", "concern": "t2",
           "closed": f"{STAGEB}/x-blink.webp", "half": f"{STAGEB}/x-mid.webp"}
ORDER = ["aa", "ee", "oo", "mbp", "fv", "smile", "calm", "lookL", "lookR", "lookUp", "raised", "concern", "closed", "half", "eh", "oh", "ltd"]

if __name__ == "__main__":
    if sys.argv[1:] == ["--all"]:
        sys.argv[1:] = [f"{k}={SOURCES[k] if '/' in SOURCES[k] else f'{S}/raw/{k}-{SOURCES[k]}.png'}" for k in ORDER]
    front = np.asarray(Image.open(f"{S}/rs/front.png").convert("RGB")).astype(np.float32)
    os.makedirs(EVID, exist_ok=True)
    jf = f"{EVID}/keys.json"
    J = json.load(open(jf)) if os.path.exists(jf) else {"date": "2026-10-10", "method": __doc__.strip(), "keys": {}}
    for a in sys.argv[1:]:
        k, p = a.split("=", 1)
        r = build(k, p, front); J["keys"][k] = r
        print(k, {x: r[x] for x in ("orb_scale", "orb_shift_px", "ring_mean_abs_diff_255", "ssim_outside_region", "max_abs_diff_outside_region_255")})
    json.dump(J, open(jf, "w"), indent=1)
