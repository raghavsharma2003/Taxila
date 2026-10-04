"""Arm B: wrap our skin template onto the sculpt target (TECH-PLAN 4.3). numpy + mathutils BVH (run inside bpy).

build_skin(T) -> dict(P (n,3), F (faces), groups {name: ids}, twin (n,), eye {L/R: centre, radius}, ...)
T = target dict: V, F, label, lm (3D landmarks), lm2 (2D image landmarks), K (m/px), bvh.
"""
import numpy as np

import lib as L
from template import Skin

DEG = np.pi / 180


def bezier2(p0, p1, p2, n):
    t = np.linspace(0, 1, n)[:, None]
    return (1 - t) ** 2 * p0 + 2 * (1 - t) * t * p1 + t ** 2 * p2


def through3(a, m, b, n):
    """quadratic curve through a, m (at t=0.5), b."""
    a, m, b = map(np.asarray, (a, m, b))
    ctrl = 2 * m - 0.5 * (a + b)
    return bezier2(a, ctrl, b, n)


def resample(poly, n):
    seg = np.linalg.norm(np.diff(poly, axis=0), axis=1)
    s = np.concatenate([[0], np.cumsum(seg)]); s /= s[-1]
    t = np.linspace(0, 1, n)
    return np.stack([np.interp(t, s, poly[:, k]) for k in range(poly.shape[1])], 1)


class Wrap:
    def __init__(self, T, cfg):
        self.T = T
        self.cfg = cfg
        self.bvh = T["bvh"]
        self.K = T["K"]
        lm = T["lm"]
        self.c = np.array([0.0, cfg["axis_y"], cfg["axis_z"]])

    # image px <-> world (x, z) on the front plane
    def img2xz(self, p):
        p = np.asarray(p, float)
        return np.stack([(p[..., 0] - 512) * self.K - self.T["x0"], (1024 - p[..., 1]) * self.K], -1)

    def front_hit(self, pts_img):
        xz = self.img2xz(pts_img).reshape(-1, 2)
        O = np.stack([xz[:, 0], np.full(len(xz), -5.0), xz[:, 1]], 1)
        D = np.tile([0, 1.0, 0], (len(xz), 1))
        P, ok, fi = L.raycast(self.bvh, O, D)
        return P, ok, fi

    def dom_of(self, P):
        """domain (u, e) of 3D points as seen from the axis origin c."""
        d = P - self.c
        u = np.arctan2(d[:, 0], -d[:, 1])
        e = np.arctan2(d[:, 2], np.hypot(d[:, 0], d[:, 1]))
        return u, e

    def ray_dom(self, u, e):
        D = np.stack([np.sin(u) * np.cos(e), -np.cos(u) * np.cos(e), np.sin(e)], 1)
        O = np.tile(self.c, (len(u), 1))
        P, ok, fi = L.raycast(self.bvh, O + D * 0.0, D)
        return P, ok, fi, D


def eye_contours(E, n_up, n_low):
    """upper / lower margin contours in image px, each from the outer... ordered low-u -> high-u (image x ascending)."""
    a, b = (E["outer"], E["inner"]) if E["outer"][0] < E["inner"][0] else (E["inner"], E["outer"])
    up = resample(through3(a, E["top"], b, 64), n_up + 2)
    lo = resample(through3(a, E["bottom"], b, 64), n_low + 2)
    return np.asarray(a, float), np.asarray(b, float), up, lo


def symmetric_lm2(lm2):
    """mirror-average the paired 2D landmarks about the face midline (px), so the design is exactly symmetric."""
    pairs = [("eyeL", "eyeR"), ("browL", "browR")]
    xs = [(lm2["eyeL"]["iris"][0] + lm2["eyeR"]["iris"][0]) / 2, (lm2["mouth"]["cornerL"][0] + lm2["mouth"]["cornerR"][0]) / 2,
          lm2["nose"]["tip"][0], lm2["bindi"]["c"][0]]
    xm = float(np.mean(xs))
    out = {k: (dict(v) if isinstance(v, dict) else v) for k, v in lm2.items()}
    mir = lambda p: [2 * xm - p[0], p[1]]
    for a, b in pairs:
        for k in lm2[a]:
            pa, pb = lm2[a][k], lm2[b][k]
            if isinstance(pa, list):
                q = [(pa[0] + mir(pb)[0]) / 2, (pa[1] + pb[1]) / 2]
                out[a][k] = q; out[b][k] = mir(q)
            else:
                out[a][k] = out[b][k] = (pa + pb) / 2
    m = lm2["mouth"]
    q = [(m["cornerL"][0] + mir(m["cornerR"])[0]) / 2, (m["cornerL"][1] + m["cornerR"][1]) / 2]
    out["mouth"] = dict(m, cornerL=q, cornerR=mir(q))
    for k in ("upperTop", "line", "lowerBottom"):
        out["mouth"][k] = [xm, m[k][1]]
    n = lm2["nose"]
    q = [(n["wingL"][0] + mir(n["wingR"])[0]) / 2, (n["wingL"][1] + n["wingR"][1]) / 2]
    out["nose"] = dict(n, wingL=q, wingR=mir(q), tip=[xm, n["tip"][1]], base=[xm, n["base"][1]])
    out["bindi"] = dict(lm2["bindi"], c=[xm, lm2["bindi"]["c"][1]])
    out["chin"] = [xm, lm2["chin"][1]]
    for a, b in (("cheekL", "cheekR"), ("earringL", "earringR")):
        q = [(lm2[a][0] + mir(lm2[b])[0]) / 2, (lm2[a][1] + lm2[b][1]) / 2]
        out[a] = q; out[b] = mir(q)
    return out, xm


def ring_targets_eye(E, n, W, H, scales):
    """px targets for every eye ring (index 1..len(scales)); the last scale (1.0) is the margin."""
    from template import Skin as _S
    lm_, rm_, upper, lower = _S.corner_split(None, n, W, H)
    a, b, up, lo = eye_contours(E, len(upper), len(lower))
    M = np.zeros((n, 2))
    M[lm_] = a; M[rm_] = b
    M[upper] = up[1:-1]; M[lower] = lo[1:-1]
    c = (a + b) / 2 + np.array([0, -2.0])
    out = []
    for sx, sy, lift in scales:
        R = c + (M - c) * np.array([sx, sy])
        R[upper, 1] -= lift                      # upper rings rise a little (lid fold / crease)
        out.append(R)
    return out, (lm_, rm_, upper, lower)


def ring_targets_mouth(m, n, W, H, spec):
    from template import Skin as _S
    lm_, rm_, upper, lower = _S.corner_split(None, n, W, H)
    cR, cL = np.asarray(m["cornerR"], float), np.asarray(m["cornerL"], float)
    line = through3(cR, m["line"], cL, 64)
    out = []
    for f_up, f_lo, ext in spec:        # fraction toward the upper border / lower border; lateral extension (px)
        a = cR + np.array([-ext, 0.0]); b = cL + np.array([ext, 0.0])
        top = through3(a, [m["line"][0], m["line"][1] + (m["upperTop"][1] - m["line"][1]) * f_up], b, 64)
        bot = through3(a, [m["line"][0], m["line"][1] + (m["lowerBottom"][1] - m["line"][1]) * f_lo], b, 64)
        if f_up > 0.5:                  # cupid's bow: a soft dip at the centre of the upper border
            x = (top[:, 0] - m["line"][0]) / (b[0] - a[0]) * 2
            top[:, 1] += 2.2 * f_up * np.exp(-(x / 0.12) ** 2) - 0.8 * f_up * np.exp(-((np.abs(x) - 0.22) / 0.12) ** 2)
        up = resample(top, len(upper) + 2); lo = resample(bot, len(lower) + 2)
        R = np.zeros((n, 2))
        R[lm_] = a; R[rm_] = b
        R[upper] = up[1:-1]; R[lower] = lo[1:-1]
        out.append(R)
    return out, (lm_, rm_, upper, lower)


def adjacency(nv, faces):
    nb = [set() for _ in range(nv)]
    for f in faces:
        for a in range(len(f)):
            p, q = f[a], f[(a + 1) % len(f)]
            nb[p].add(q); nb[q].add(p)
    return [np.array(sorted(s), int) for s in nb]


def laplacian_relax(X, nb, free, iters, lam=0.5):
    X = X.copy()
    idx = np.nonzero(free)[0]
    for _ in range(iters):
        avg = np.array([X[nb[i]].mean(0) for i in idx])
        X[idx] += lam * (avg - X[idx])
    return X
