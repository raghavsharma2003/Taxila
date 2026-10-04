# Arm A: analytic signed-distance description of the style C head (numpy, vectorised).
#
# Coordinates (Blender, metres): +X = her left, -Y = her front, +Z = up. Eye level z = 0, eye centres y = 0.
# The head is a smooth union of a few rounded primitives (style C is built from simple rounded forms), so the
# parameters the polish loop edits are radii and centres, never vertices.
import numpy as np


def smin(a, b, k):
    if k <= 0:
        return np.minimum(a, b)
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0.0, 1.0)
    return b * (1 - h) + a * h - k * h * (1 - h)


def smax(a, b, k):
    return -smin(-a, -b, k)


def ellipsoid(p, c, r):
    q = (p - np.asarray(c)) / np.asarray(r)
    k0 = np.linalg.norm(q, axis=-1)
    k1 = np.linalg.norm(q / np.asarray(r), axis=-1)
    return k0 * (k0 - 1.0) / np.maximum(k1, 1e-9)


def sphere(p, c, r):
    return np.linalg.norm(p - np.asarray(c), axis=-1) - r


def capsule(p, a, b, r):
    a = np.asarray(a, float); b = np.asarray(b, float)
    pa = p - a; ba = b - a
    h = np.clip((pa @ ba) / (ba @ ba), 0, 1)
    if np.ndim(r) == 0:
        rr = r
    else:
        rr = r[0] * (1 - h) + r[1] * h
    return np.linalg.norm(pa - h[..., None] * ba, axis=-1) - rr


class HeadSDF:
    """The skin surface. `P` is the parameter dict (params.json 'head')."""

    def __init__(self, P, with_eyes=True, with_lips=True):
        self.P = P
        self.with_eyes = with_eyes
        self.with_lips = with_lips

    def __call__(self, p):
        P = self.P
        p = np.atleast_2d(p)
        d = ellipsoid(p, P["cranium_c"], P["cranium_r"])
        d = smin(d, ellipsoid(p, P["face_c"], P["face_r"]), P["k_face"])
        d = smin(d, ellipsoid(p, P["jaw_c"], P["jaw_r"]), P["k_jaw"])
        d = smin(d, ellipsoid(p, P["chin_c"], P["chin_r"]), P["k_chin"])
        for s in (1, -1):
            c = np.array(P["cheek_c"]) * [s, 1, 1]
            d = smin(d, ellipsoid(p, c, P["cheek_r"]), P["k_cheek"])
        # forehead fill (keeps the brow plane round and soft)
        d = smin(d, ellipsoid(p, P["fore_c"], P["fore_r"]), P["k_fore"])
        # neck and the top of the chest (fills the kurta's U neckline)
        d = smin(d, capsule(p, P["neck_a"], P["neck_b"], P["neck_r"]), P["k_neck"])
        if "chest_c" in P:
            d = smin(d, ellipsoid(p, P["chest_c"], P["chest_r"]), P["k_chest"])
        # eye sockets: a soft dish around each eye so the lids can wrap the ball
        for s in (1, -1):
            c = np.array(P["eye_c"]) * [s, 1, 1]
            d = smax(d, -sphere(p, c + np.array(P["socket_off"]) * [s, 1, 1], P["socket_r"]), P["k_socket"])
        # eye surround (polish r2, fix 4): near each eye the skin is blended (not unioned, not carved) toward a
        # sphere just outside the lid sphere, so the under-eye is one smooth convex surface with no dent or crease
        if P.get("eye_blend", 0) > 0:
            for s in (1, -1):
                c = np.array(P["eye_c"]) * [s, 1, 1]
                Rs = P["eye_r"] + P["lid_t"] + P["eye_blend_off"]
                q = (p - c) * np.asarray(P.get("eye_blend_scale", [1, 1, 1]))
                r = np.linalg.norm(q, axis=-1)
                t = np.clip((Rs + P["eye_blend"] - r) / P["eye_blend"], 0, 1)
                w = t * t * (3 - 2 * t)
                ds = np.linalg.norm(p - c, axis=-1) - Rs
                m = P.get("eye_blend_m", 0.008)
                ds = np.clip(ds, d - m, d + m)   # only moves the surface; never opens a pocket deep inside the head
                d = d * (1 - w) + ds * w
        if self.with_eyes:
            for s in (1, -1):
                c = np.array(P["eye_c"]) * [s, 1, 1]
                d = smin(d, sphere(p, c, P["eye_r"] + P["lid_t"]), P["k_eye"])
        # nose: a button (tip ball + soft wings + a low bridge)
        if P.get("bridge_r", 0) > 0:
            d = smin(d, capsule(p, P["bridge_a"], P["bridge_b"], P["bridge_r"]), P["k_bridge"])
        d = smin(d, ellipsoid(p, P["nose_c"], P["nose_r"]), P["k_nose"])
        for s in (1, -1):
            c = np.array(P["wing_c"]) * [s, 1, 1]
            d = smin(d, ellipsoid(p, c, P["wing_r"]), P["k_wing"])
        if self.with_lips:
            d = smin(d, ellipsoid(p, P["lipU_c"], P["lipU_r"]), P["k_lip"])
            d = smin(d, ellipsoid(p, P["lipL_c"], P["lipL_r"]), P["k_lip"])
            # philtrum / upper lip mass
            d = smin(d, ellipsoid(p, P["muzzle_c"], P["muzzle_r"]), P["k_muzzle"])
        return d

    def grad(self, p, h=1e-4):
        p = np.atleast_2d(p)
        g = np.zeros_like(p)
        for i in range(3):
            e = np.zeros(3); e[i] = h
            g[:, i] = (self(p + e) - self(p - e)) / (2 * h)
        return g

    def project(self, p, iters=6):
        p = np.array(p, float)
        for _ in range(iters):
            d = self(p)
            g = self.grad(p)
            n2 = np.maximum((g * g).sum(1), 1e-12)
            p = p - (d / n2)[:, None] * g
        return p

    def normal(self, p):
        g = self.grad(p)
        return g / np.maximum(np.linalg.norm(g, axis=1, keepdims=True), 1e-12)

    def raycast(self, o, d, tmax=0.4, iters=200):
        """Sphere-trace from o along unit d (arrays Nx3). Returns hit points (nan where missed)."""
        o = np.array(o, float); d = np.array(d, float)
        n = len(o)
        step = 0.0005
        ts = np.arange(0, tmax, step)
        lo = np.full(n, np.nan); hi = np.full(n, np.nan)
        prev = self(o)
        found = np.zeros(n, bool)
        for t in ts[1:]:
            s = self(o + t * d)
            new = (~found) & (prev > 0) & (s <= 0)
            lo[new] = t - step; hi[new] = t
            found |= new
            prev = s
            if found.all():
                break
        a = np.where(found, lo, 0); b = np.where(found, hi, 0)
        for _ in range(30):
            m = 0.5 * (a + b)
            s = self(o + m[:, None] * d)
            a = np.where(s > 0, m, a); b = np.where(s > 0, b, m)
        q = o + (0.5 * (a + b))[:, None] * d
        q[~found] = np.nan
        return q

    def front_y(self, xz):
        """Surface y seen from the front at each (x, z)."""
        xz = np.atleast_2d(xz)
        o = np.stack([xz[:, 0], np.full(len(xz), -0.2), xz[:, 1]], 1)
        d = np.tile([0.0, 1.0, 0.0], (len(xz), 1))
        return self.raycast(o, d)[:, 1]
