"""r10 corner-tick gate (judge r9 fix 1): in every frame where the lips are open, scan the closed lip line just OUTSIDE
each end of the opening (2..8 screen px beyond the first fully closed column, i.e. a 6 px window just past the opening's own AA rim, along the projected line the rig exports in ends.json) for a
forked tick: a vertical luminance profile with a dark-pale-dark triple (two local minima with a local maximum between
them, each minimum >= T below the maximum, all within 9 px), the signature of c-front's closed lip line stretched past
an open corner (dark seam + its pale lip rim). Requires 0 hits.
    python3 cornertick.py <dir> [T=10] [--dbg]     (dir: frames f*/g* + ends.json, or a pose dir with named pngs)"""
import json, sys, os, glob
import numpy as np
from PIL import Image
d = sys.argv[1]
T = float(sys.argv[2]) if len(sys.argv) > 2 and not sys.argv[2].startswith("-") else 10.0
DBG = "--dbg" in sys.argv
E = json.load(open(f"{d}/ends.json"))
if isinstance(E, dict): items = [(f"{d}/{k}.png", v) for k, v in E.items()]
else:
    fr = sorted(glob.glob(f"{d}/f*.png")) or sorted(glob.glob(f"{d}/g*.png"))
    items = list(zip(fr, E))
def lum(im): a = np.asarray(im.convert("RGB"), dtype=np.float32); return 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]
def walk(pts, s):
    """point at arc length s along the polyline pts"""
    acc = 0.0
    for a, b in zip(pts, pts[1:]):
        L = ((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2) ** 0.5
        if acc + L >= s and L > 1e-6: t = (s - acc) / L; return a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])
        acc += L
    return None
def triple(p):
    """dark-pale-dark: a local maximum j with a minimum >= T below it within 4 px on EACH side (k - i <= 8)"""
    n = len(p)
    for j in range(1, n - 1):
        if not (p[j] >= p[j - 1] and p[j] >= p[j + 1]): continue
        a = p[max(0, j - 4):j]; b = p[j + 1:min(n, j + 5)]
        if len(a) and len(b) and p[j] - a.min() >= T and p[j] - b.min() >= T:
            i = max(0, j - 4) + int(a.argmin()); k = j + 1 + int(b.argmin())
            return (i, j, k, round(float(p[j] - a.min()), 1), round(float(p[j] - b.min()), 1))
    return None
hits, n_open, rep = [], 0, {}
for f, e in items:
    if not e or e.get("g", 0) < 4 or not os.path.exists(f): continue
    n_open += 1
    Lm = lum(Image.open(f)); H, W = Lm.shape
    for side in ("L", "R"):
        pts = e.get(side) or []
        if len(pts) < 2: continue
        # start at the first CLOSED column beyond the end (pts[1]); profiles run perpendicular to the local line, +-8 px
        base = pts[1:]
        if len(base) < 2: continue
        for s in np.arange(2.0, 8.01, 1.0):   # 6 px window; the first 2 px past the first closed column are the opening's own AA rim (i2: all 9 s=0 hits sat ON the cavity edge, inspected at 10x)
            q = walk(base, s); q2 = walk(base, s + 1.0)
            if not q or not q2: continue
            tx, ty = q2[0] - q[0], q2[1] - q[1]; tl = (tx * tx + ty * ty) ** 0.5 or 1.0
            nx, ny = -ty / tl, tx / tl
            if ny < 0: nx, ny = -nx, -ny
            xs = q[0] + nx * np.arange(-8, 9); ys = q[1] + ny * np.arange(-8, 9)
            if xs.min() < 1 or ys.min() < 1 or xs.max() > W - 2 or ys.max() > H - 2: continue
            x0 = np.floor(xs).astype(int); y0 = np.floor(ys).astype(int); fx = xs - x0; fy = ys - y0
            prof = (Lm[y0, x0] * (1 - fx) * (1 - fy) + Lm[y0, x0 + 1] * fx * (1 - fy) + Lm[y0 + 1, x0] * (1 - fx) * fy + Lm[y0 + 1, x0 + 1] * fx * fy)
            x, y = int(round(q[0])), int(round(q[1]))
            tr = triple(prof)
            if DBG and s in (1.0, 3.0): print(os.path.basename(f), side, s, x, y, np.round(prof).astype(int).tolist(), tr)
            if tr: hits.append((os.path.basename(f), side, float(s), x, y, tr, np.round(prof).astype(int).tolist() if DBG else None)); break
out = {"dir": d, "T": T, "open_frames": n_open, "hits": len(hits), "first": hits[:12]}
print(json.dumps(out))
