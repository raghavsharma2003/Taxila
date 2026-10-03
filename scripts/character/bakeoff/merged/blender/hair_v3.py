"""procedural-v3 hair: guide curves on our own scalp -> clumped strand cards, flyaways, baby hairs, a ponytail with a
core, plus the strand atlas they sample. Replaces the MakeHuman CC0 card hair ("helmet", CHARACTER-PIPELINE §8).

Everything is generated from the look spec and the character's own scalp; no third-party hair asset is used.

Geometry (Blender space: x = her left, -y = forward, +z = up):
  * guide curves: one per clump, rooted on the hairline loop (the scalpW = 0.5 iso-line, ordered by angle around the
    axis from the head centre to the ponytail tie) and on interior scalp points, pulled taut to the tie point, carried
    on the scalp by radial projection with a volume offset profile; seeded clump noise and partings.
    The guides are also kept as a Blender curve object ("hair_guides") in base.blend for inspection; they do not ship.
  * cards: a ribbon per guide (normal = the scalp normal), three layers at increasing offset with sparser textures;
    hairline baby-hair cards; flyaway wisps leaving the surface; the tail as radial + crossing clump cards around a
    gravity-hung master curve with an opaque core tube and an elastic band.
  * every card vertex stores `strandT` (root -> tip tangent) and `hairS` (0 root .. 1 tip), so the exporter writes the
    `_strand` attribute from the generator, not from a UV heuristic (which flips sign across the crown).
Atlas (2048 x 1024, RGBA, sRGB colour): eight 256-px columns of card variants (dense / medium / strandy / sparse clumps,
a wisp, baby hair, opaque core + elastic patch), each a few dozen to ~150 anti-aliased fibres with taper, waviness,
per-fibre tone and clump convergence at the tip. Blender UV convention: v = 1 is the root (image row 0).
"""
import math
import numpy as np
import bpy, bmesh
from mathutils import Vector
from mathutils.bvhtree import BVHTree

ATLAS_W, ATLAS_H = 2048, 1024
COL = 256
# column index per card kind (u0 = col * 256 / 2048)
KIND = {"dense": 0, "denseB": 1, "medium": 2, "strandy": 3, "sparse": 4, "wisp": 5, "baby": 6, "core": 7}


def _u_range(kind, sub=None):
    c = KIND[kind]
    u0, u1 = c * COL / ATLAS_W, (c + 1) * COL / ATLAS_W
    pad = 2 / ATLAS_W
    if kind == "core":   # left 3/4 opaque fibres, right 1/4 elastic patch
        return (u0 + pad, u0 + 0.75 * (u1 - u0) - pad) if sub != "band" else (u0 + 0.8 * (u1 - u0), u1 - pad)
    return u0 + pad, u1 - pad


# ------------------------------------------------------------------ atlas
def make_atlas(hair_lin, seed=7, W=ATLAS_W, H=ATLAS_H):
    """Return an RGBA float array (H, W, 4): RGB linear hair colour with per-fibre tone, A coverage."""
    rng = np.random.default_rng(seed)
    out = np.zeros((H, W, 4), np.float32)
    rows = np.arange(H, dtype=np.float32)
    t_all = rows / (H - 1)

    def fibres(col, n, wpx, length, conv, wave, alpha, tone):
        x0c = col * COL
        acc_a = np.zeros((H, COL), np.float32)
        acc_c = np.zeros((H, COL), np.float32)
        xs = np.arange(COL, dtype=np.float32)[None, :]
        for _ in range(n):
            base = rng.uniform(10, COL - 10)
            L = rng.uniform(*length)
            w = rng.uniform(*wpx)
            amp = rng.uniform(0, wave) * COL
            fr = rng.uniform(0.6, 2.2)
            ph = rng.uniform(0, 2 * math.pi)
            drift = rng.normal(0, 6)
            t = np.clip(t_all / L, 0, 1)
            # clump convergence: fibres pull to the clump centre towards the tip
            cx = COL / 2 + (base - COL / 2) * (1 - conv * t ** 1.5)
            x = cx + amp * np.sin(2 * math.pi * fr * t + ph) * (0.3 + 0.7 * t) + drift * t
            prof = np.where(t_all <= L, 1.0, 0.0) * (1 - np.clip((t - 0.82) / 0.18, 0, 1) ** 1.5)
            ww = w * (1 - 0.55 * t)
            cov = np.clip(ww[:, None] / 2 + 0.5 - np.abs(xs - x[:, None]), 0, 1) * prof[:, None] * rng.uniform(*alpha)
            tn = rng.uniform(*tone) * (1 + 0.08 * t)[:, None]            # tips slightly lighter
            acc_c = acc_c * (1 - cov) + tn * cov
            acc_a = 1 - (1 - acc_a) * (1 - cov)
        sl = slice(x0c, x0c + COL)
        out[:, sl, 3] = np.maximum(out[:, sl, 3], acc_a)
        out[:, sl, 0:3] = np.where(acc_a[:, :, None] > 0, (acc_c / np.maximum(acc_a, 1e-4))[:, :, None], 1.0) * hair_lin[None, None, :]

    fibres(KIND["dense"], 150, (1.6, 3.0), (0.85, 1.0), 0.35, 0.03, (0.85, 1.0), (0.75, 1.2))
    fibres(KIND["denseB"], 130, (1.5, 2.8), (0.8, 1.0), 0.5, 0.05, (0.8, 1.0), (0.7, 1.25))
    fibres(KIND["medium"], 90, (1.4, 2.4), (0.7, 1.0), 0.55, 0.06, (0.7, 1.0), (0.7, 1.25))
    fibres(KIND["strandy"], 55, (1.3, 2.2), (0.6, 1.0), 0.6, 0.08, (0.6, 1.0), (0.7, 1.3))
    fibres(KIND["sparse"], 28, (1.2, 2.0), (0.5, 1.0), 0.3, 0.1, (0.5, 0.95), (0.75, 1.3))
    fibres(KIND["wisp"], 9, (1.5, 2.3), (0.6, 1.0), 0.1, 0.15, (0.75, 1.0), (0.8, 1.2))
    fibres(KIND["baby"], 22, (0.9, 1.4), (0.3, 0.9), 0.0, 0.2, (0.35, 0.7), (0.85, 1.4))
    # core: opaque fibres (left 3/4) + an elastic band patch (right 1/4)
    c0 = KIND["core"] * COL
    yy, xx = np.mgrid[0:H, 0:192]
    fib = 0.75 + 0.5 * (0.5 + 0.5 * np.sin(xx * 1.7 + 3 * np.sin(yy * 0.013 + xx * 0.11)))
    out[:, c0:c0 + 192, 0:3] = np.clip(fib[:, :, None], 0, 2) * hair_lin[None, None, :] * 0.85
    out[:, c0:c0 + 192, 3] = 1.0
    out[:, c0 + 192:c0 + COL, 0:3] = np.array([0.012, 0.010, 0.012])
    out[:, c0 + 192:c0 + COL, 3] = 1.0
    return out


# ------------------------------------------------------------------ helpers
def _co(me):
    a = np.empty(len(me.vertices) * 3)
    me.vertices.foreach_get("co", a)
    return a.reshape(-1, 3)


def _attr(ob, nm):
    a = np.zeros(len(ob.data.vertices), np.float32)
    ob.data.attributes[nm].data.foreach_get("value", a)
    return a


def _smooth_curve(P, it=2):
    for _ in range(it):
        P[1:-1] = 0.25 * P[:-2] + 0.5 * P[1:-1] + 0.25 * P[2:]
    return P


class Scalp:
    """Radial projection onto the hair-bearing skull (skin triangles away from the face, ears and neck)."""

    def __init__(self, face, c):
        me = face.data
        P = _co(me)
        reg = np.round(_attr(face, "region"))
        ears = _attr(face, "earsW")
        me.calc_loop_triangles()
        T = np.empty(len(me.loop_triangles) * 3, np.int64)
        me.loop_triangles.foreach_get("vertices", T)
        T = T.reshape(-1, 3)
        skin = np.all(reg[T] == 0, axis=1)
        self.P, self.c = P, c
        self.bvh = BVHTree.FromPolygons([Vector(p) for p in P], T[skin].tolist())
        far = skin & np.all(ears[T] < 0.3, axis=1)
        self.bvh_noears = BVHTree.FromPolygons([Vector(p) for p in P], T[far].tolist())
        self.T = T[skin]

    def project(self, q, off=0.0, noears=True):
        """Surface point + outward normal along the ray from the head centre through q."""
        d = Vector(q - self.c).normalized()
        bvh = self.bvh_noears if noears else self.bvh
        hit = bvh.ray_cast(Vector(self.c), d, 0.3)
        if hit[0] is None:
            loc, n, _, _ = bvh.find_nearest(Vector(q))
        else:
            loc, n = hit[0], hit[1]
        n = np.array(n)
        if n @ np.array(d) < 0:
            n = -n
        return np.array(loc) + n * off, n


def _ribbon(bm, uvl, attrs, pts, nrm, width, u_rng, v_rng=(1.0, 0.0), flip=False):
    """One card along pts (K,3) with plane normal nrm (K,3) and width (K,). Root at v_rng[0]."""
    K = len(pts)
    tan = np.gradient(pts, axis=0)
    tan /= np.maximum(np.linalg.norm(tan, axis=1, keepdims=True), 1e-9)
    side = np.cross(nrm, tan)
    side /= np.maximum(np.linalg.norm(side, axis=1, keepdims=True), 1e-9)
    if flip:
        side = -side
    L = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(pts, axis=0), axis=1))])
    s = L / max(L[-1], 1e-9)
    vs = []
    for i in range(K):
        a = bm.verts.new(Vector(pts[i] - side[i] * width[i] * 0.5))
        b = bm.verts.new(Vector(pts[i] + side[i] * width[i] * 0.5))
        for v in (a, b):
            attrs["strandT"].append(tan[i])
            attrs["hairS"].append(s[i])
        vs.append((a, b))
    for i in range(K - 1):
        f = bm.faces.new([vs[i][0], vs[i][1], vs[i + 1][1], vs[i + 1][0]])
        v0 = v_rng[0] + (v_rng[1] - v_rng[0]) * s[i]
        v1 = v_rng[0] + (v_rng[1] - v_rng[0]) * s[i + 1]
        for l, uv in zip(f.loops, ((u_rng[0], v0), (u_rng[1], v0), (u_rng[1], v1), (u_rng[0], v1))):
            l[uvl].uv = uv
    return K * 2


def _finish(bm, name, attrs):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    a = me.attributes.new("strandT", "FLOAT_VECTOR", "POINT")
    a.data.foreach_set("vector", np.asarray(attrs["strandT"], np.float32).ravel())
    a = me.attributes.new("hairS", "FLOAT", "POINT")
    a.data.foreach_set("value", np.asarray(attrs["hairS"], np.float32))
    for p in me.polygons:
        p.use_smooth = True
    return ob


# ------------------------------------------------------------------ the designed hairline
# elevation (deg, from the head centre: joint-head + (0, -1, +4) cm) of the hairline by azimuth (deg, 0 = front, + = her
# left), symmetric: a soft female hairline about 6 cm above the brows, a slight temple recess, a sideburn in front of
# the ear, the line over the ear top, behind the ear and down to the nape.
HAIRLINE = [(0, 46), (20, 45), (38, 40), (50, 27), (60, 8), (68, -4), (76, -9), (83, -6), (89, 1), (100, 2), (110, -2),
            (118, -14), (135, -31), (155, -42), (180, -45)]


def hairline_el(az_deg, hv=None):
    a = np.abs(((np.asarray(az_deg) + 180) % 360) - 180)
    xs, ys = zip(*HAIRLINE)
    el = np.interp(a, xs, ys)
    return el + (hv or {}).get("hairlineRaise", 0.0)


def head_centre(J):
    return np.array(J["joint-head"]) + np.array([0.0, -0.01, 0.04])


def hair_weight(P, J, ears_w, region, seed=0, soft=2.0):
    """Per-vertex hair-bearing weight on the skin (0 bare .. 1 hair), with a seeded irregular edge; 0 on the ears."""
    c = head_centre(J)
    d = P - c
    az = np.degrees(np.arctan2(d[:, 0], -d[:, 1]))
    el = np.degrees(np.arctan2(d[:, 2], np.hypot(d[:, 0], d[:, 1])))
    rng = np.random.default_rng(seed)
    k = rng.normal(0, 1, (6, 3))
    jit = sum(np.sin(P @ (k[i] * (40 + 25 * i)) + i) for i in range(6)) / 6 * 2.2
    t = np.clip((el - hairline_el(az) - jit + soft) / (2 * soft), 0, 1)
    w = t * t * (3 - 2 * t)
    return w * (ears_w < 0.3) * (region == 0)


# ------------------------------------------------------------------ the generator
def build(face, look, J, eyeC, report, collide=(), lod="H"):
    """Return the hair object for one LOD ("H" or "B"). `collide` = objects the tail must stay outside of."""
    cfg = look["hair"]
    hv = cfg.get("v3", {})
    rng = np.random.default_rng(look["seed"] * 31 + (0 if lod == "H" else 1))
    c = head_centre(J)
    S = Scalp(face, c)
    # the tie: high on the back of the head (scalp-projected), lifted off by the gathered hair
    tie_dir = np.array([0.0, np.cos(np.radians(hv.get("tieElevDeg", 38))), np.sin(np.radians(hv.get("tieElevDeg", 38)))])
    tie_s, tie_n = S.project(c + tie_dir * 0.2)
    tie = tie_s + tie_n * 0.006
    axis = (tie - c) / np.linalg.norm(tie - c)
    report.setdefault("hairV3", {})["tie"] = np.round(tie, 4).tolist()

    # ---- hairline loop: the designed hairline (HAIRLINE: elevation by azimuth about the head centre), radially
    # projected on the skull. MakeHuman's scalp group is the crown only (376 vertices above z 1.40), so it cannot
    # carry a hairline.
    def hairline_at(a):
        el = np.radians(hairline_el(np.degrees(a), hv))
        d = np.array([math.sin(a) * math.cos(el), -math.cos(a) * math.cos(el), math.sin(el)])
        p, _ = S.project(c + d * 0.2)
        return p

    def guide(root, off_peak, layer_off, noise_amp, n=14):
        """Root -> tie on the scalp: lerp + radial projection, offset profile, seeded lateral noise."""
        s = np.linspace(0, 1, n) ** 0.9
        pts, nrm = [], []
        lat = rng.normal(0, 1, 3)
        for t in s:
            q = root * (1 - t) + tie * t
            off = (0.0015 + (off_peak - 0.0015) * np.sin(min(t / 0.55, 1) * math.pi / 2)) * (1 - 0.55 * t ** 3) + layer_off
            p, nn = S.project(q, off)
            # lateral clump wander (zero at both ends so roots and the tie stay put)
            p = p + noise_amp * math.sin(math.pi * t) * (lat - nn * (lat @ nn))
            pts.append(p)
            nrm.append(nn)
        return _smooth_curve(np.array(pts)), np.array(nrm)

    H = lod == "H"
    bm = bmesh.new()
    uvl = bm.loops.layers.uv.new("UVMap")
    attrs = {"strandT": [], "hairS": []}
    guides_for_report = []
    counts = {}

    def cap_layer(n_cards, kinds, layer_off, width_k, peak, noise, inset=0.04, jitter=0.5, seg=14):
        k = 0
        step = 2 * math.pi / n_cards
        for i in range(n_cards):
            a = -math.pi + (i + rng.uniform(-jitter, jitter)) * step
            hl = hairline_at(a)
            root = hl * (1 - inset) + tie * inset
            root_s, _ = S.project(root)
            pts, nrm = guide(root_s, peak, layer_off, noise, n=seg)
            dist_tie = np.linalg.norm(root_s - tie)
            w0 = width_k * dist_tie * step * 1.15
            s = np.linspace(0, 1, len(pts))
            width = np.maximum(w0 * (1 - s) ** 0.85 + 0.0035 * s, 0.002)
            width[0] *= 0.7
            kind = kinds[rng.integers(len(kinds))]
            _ribbon(bm, uvl, attrs, pts, nrm, width, _u_range(kind), flip=bool(rng.integers(2)))
            guides_for_report.append(pts)
            k += 1
        return k

    if H:
        counts["cap0"] = cap_layer(54, ["dense", "denseB"], 0.0004, 1.0, hv.get("volume", 0.0055), 0.0025)
        counts["cap1"] = cap_layer(46, ["medium", "denseB"], 0.0016, 0.95, hv.get("volume", 0.0055) * 1.15, 0.004)
        counts["cap2"] = cap_layer(34, ["medium", "denseB"], 0.0024, 0.8, hv.get("volume", 0.0055) * 1.2, 0.005, inset=0.08)
    else:
        counts["cap0"] = cap_layer(40, ["dense", "denseB"], 0.0006, 1.15, hv.get("volume", 0.0055), 0.0025, seg=10)
        counts["cap1"] = cap_layer(26, ["medium"], 0.0022, 1.0, hv.get("volume", 0.0055) * 1.2, 0.004, inset=0.08, seg=9)

    # ---- baby hairs: short fine cards at the front hairline and temples, lying flat, combed back and slightly down
    if H:
        nb = 0
        for i in range(hv.get("babyHairs", 46)):
            a = rng.uniform(-math.pi, math.pi)
            hl = hairline_at(a)
            if hl[2] < eyeC["L"][2] + 0.02 and hl[1] > -0.06:     # not at the nape / behind the ears
                continue
            root, n0 = S.project(hl * 1.0 + (hl - tie) * rng.uniform(0.0, 0.03))
            toward = tie - root
            toward -= n0 * (toward @ n0)
            toward /= np.linalg.norm(toward)
            L = rng.uniform(0.008, 0.018)
            pts, nrm = [], []
            for t in np.linspace(0, 1, 5):
                p, nn = S.project(root + toward * L * t + np.array([0, 0, -0.003]) * t * t, 0.0008 + 0.0012 * t)
                pts.append(p)
                nrm.append(nn)
            w = np.full(5, rng.uniform(0.004, 0.007))
            _ribbon(bm, uvl, attrs, np.array(pts), np.array(nrm), w, _u_range("baby"))
            nb += 1
        counts["baby"] = nb

    # ---- flyaways on the cap: thin wisps that leave the surface in a loose arc
    nfly = hv.get("flyaways", 22) if H else 6
    for i in range(nfly):
        a = rng.uniform(-math.pi, math.pi)
        hl = hairline_at(a)
        t0 = rng.uniform(0.15, 0.75)
        root, n0 = S.project(hl * (1 - t0) + tie * t0, 0.004)
        tdir = tie - root
        tdir -= n0 * (tdir @ n0)
        tdir /= np.linalg.norm(tdir)
        sdir = np.cross(n0, tdir)
        L = rng.uniform(0.02, 0.05)
        lift = rng.uniform(0.003, 0.011)
        curl = rng.normal(0, 0.6)
        K = 8
        pts = []
        for t in np.linspace(0, 1, K):
            pts.append(root + tdir * L * t + n0 * lift * t ** 1.6 + sdir * L * 0.35 * curl * t ** 2)
        pts = np.array(pts)
        nrm = np.repeat(n0[None, :], K, 0)
        w = np.linspace(0.003, 0.0018, K)
        _ribbon(bm, uvl, attrs, pts, nrm, w, _u_range("wisp"))
    counts["flyaways"] = nfly

    # ---- ponytail: master curve hung from the tie, kept outside the skull, neck and collar
    obs = []
    for ob in (face,) + tuple(collide):
        me = ob.data
        me.calc_loop_triangles()
        tt = np.empty(len(me.loop_triangles) * 3, np.int64)
        me.loop_triangles.foreach_get("vertices", tt)
        obs.append(BVHTree.FromPolygons([Vector(p) for p in _co(me)], tt.reshape(-1, 3).tolist()))
    Ltail = hv.get("tailLength", 0.22)
    ctrl = np.array([[0, 0.0, 0.0], [0, 0.03, 0.004], [0, 0.058, -0.028], [0, 0.068, -0.085], [0.004, 0.062, -0.15],
                     [0.008, 0.055, -Ltail]]) + tie
    # resample to K points
    K = 22 if H else 12
    seg = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(ctrl, axis=0), axis=1))])
    st = np.linspace(0, seg[-1], K)
    M = np.stack([np.interp(st, seg, ctrl[:, k]) for k in range(3)], 1)
    M = _smooth_curve(M, 3)
    sT = st / seg[-1]
    rad = 0.009 + 0.021 * np.sin(np.clip(sT / 0.3, 0, 1) * math.pi / 2) * (1 - 0.65 * np.clip((sT - 0.3) / 0.7, 0, 1) ** 1.3)
    rad[-1] *= 0.6
    # collision: push the master curve so the tail surface (radius rad) clears every obstacle by 4 mm
    for it in range(30):
        moved = False
        for i in range(2, K):
            for bvh in obs:
                loc, n, _, d = bvh.find_nearest(Vector(M[i]), 0.08)
                if loc is None:
                    continue
                n = np.array(n)
                sd = (M[i] - np.array(loc)) @ n
                need = rad[i] + 0.004
                if sd < need:
                    M[i] = M[i] + n * (need - sd) * 0.6
                    moved = True
        M[2:] = _smooth_curve(M[2:].copy(), 1) if moved else M[2:]
        if not moved:
            break
    tan = np.gradient(M, axis=0)
    tan /= np.linalg.norm(tan, axis=1, keepdims=True)
    # a stable frame along the tail (parallel transport from the head's up axis)
    ref = np.array([1.0, 0, 0])
    F1 = []
    for i in range(K):
        f1 = ref - tan[i] * (ref @ tan[i])
        f1 /= np.linalg.norm(f1)
        F1.append(f1)
        ref = f1
    F1 = np.array(F1)
    F2 = np.cross(tan, F1)
    ntail = 40 if H else 18
    for j in range(ntail):
        phi0 = 2 * math.pi * j / ntail + rng.uniform(-0.1, 0.1)
        rho = rng.uniform(0.55, 1.0)
        twist = rng.uniform(0.25, 0.6)
        Lk = rng.uniform(0.82, 1.0)
        kk = max(4, int(K * Lk))
        phi = phi0 + twist * sT[:kk]
        rr = rad[:kk] * rho * (1 + 0.15 * rng.normal() * sT[:kk])
        radial = np.cos(phi)[:, None] * F1[:kk] + np.sin(phi)[:, None] * F2[:kk]
        pts = M[:kk] + radial * rr[:, None]
        # tips spread and fall a little more (gravity on the free ends)
        pts[:, 2] -= 0.006 * sT[:kk] ** 2 * rng.uniform(0.5, 1.5)
        w = 2 * math.pi * rr / (ntail / 2.2)
        w = np.maximum(w, 0.004)
        kind = ["dense", "denseB", "medium"][rng.integers(3)] if rho > 0.75 else ["dense", "denseB"][rng.integers(2)]
        _ribbon(bm, uvl, attrs, pts, radial, w, _u_range(kind), flip=bool(rng.integers(2)))
    counts["tail"] = ntail
    if H:
        for j in range(14):           # crossing cards: radial planes, so the tail has volume edge-on
            phi = 2 * math.pi * j / 14 + rng.uniform(-0.2, 0.2)
            kk = max(4, int(K * rng.uniform(0.8, 0.98)))
            radial = np.cos(phi) * F1[:kk] + np.sin(phi) * F2[:kk]
            nrm = np.cross(tan[:kk], radial)
            pts = M[:kk] + radial * (rad[:kk] * 0.35)[:, None]
            _ribbon(bm, uvl, attrs, pts, nrm, rad[:kk] * 1.3, _u_range(["dense", "medium"][j % 2]))
        counts["tailCross"] = 14
        for i in range(8):            # tail flyaways
            s0 = rng.uniform(0.2, 0.8)
            i0 = int(s0 * (K - 1))
            phi = rng.uniform(0, 2 * math.pi)
            radial = np.cos(phi) * F1[i0] + np.sin(phi) * F2[i0]
            root = M[i0] + radial * rad[i0] * 0.9
            L = rng.uniform(0.025, 0.05)
            pts = np.array([root + tan[i0] * L * t + radial * 0.012 * t ** 1.5 for t in np.linspace(0, 1, 7)])
            _ribbon(bm, uvl, attrs, pts, np.repeat(radial[None], 7, 0), np.linspace(0.003, 0.0018, 7), _u_range("wisp"))
        counts["tailFly"] = 8
    # opaque core tube inside the tail (the cards never show the background through the middle)
    ncirc = 10 if H else 6
    kc = int(K * 0.85)
    ring = []
    u0, u1 = _u_range("core")
    for i in range(kc):
        r_ = []
        for k in range(ncirc + 1):
            phi = 2 * math.pi * k / ncirc
            p = M[i] + (math.cos(phi) * F1[i] + math.sin(phi) * F2[i]) * rad[i] * 0.5 * (1 - 0.5 * sT[i])
            v = bm.verts.new(Vector(p))
            attrs["strandT"].append(tan[i])
            attrs["hairS"].append(sT[i])
            r_.append(v)
        ring.append(r_)
    for i in range(kc - 1):
        for k in range(ncirc):
            f = bm.faces.new([ring[i][k], ring[i][k + 1], ring[i + 1][k + 1], ring[i + 1][k]])
            for l, uv in zip(f.loops, ((u0 + (u1 - u0) * k / ncirc, 1 - sT[i]), (u0 + (u1 - u0) * (k + 1) / ncirc, 1 - sT[i]),
                                       (u0 + (u1 - u0) * (k + 1) / ncirc, 1 - sT[i + 1]), (u0 + (u1 - u0) * k / ncirc, 1 - sT[i + 1]))):
                l[uvl].uv = uv
    # elastic band at the tie: a small torus
    b0, b1 = _u_range("core", "band")
    nb_, nt_ = 14, 6
    band_v = []
    for i in range(nb_ + 1):
        th = 2 * math.pi * i / nb_
        row = []
        for k in range(nt_ + 1):
            ps = 2 * math.pi * k / nt_
            cdir = math.cos(th) * F1[1] + math.sin(th) * F2[1]
            p = M[1] + cdir * (rad[1] * 0.95 + 0.0022 * math.cos(ps)) + tan[1] * 0.0022 * math.sin(ps)
            v = bm.verts.new(Vector(p))
            attrs["strandT"].append(tan[1])
            attrs["hairS"].append(0.0)
            row.append(v)
        band_v.append(row)
    for i in range(nb_):
        for k in range(nt_):
            f = bm.faces.new([band_v[i][k], band_v[i + 1][k], band_v[i + 1][k + 1], band_v[i][k + 1]])
            for l in f.loops:
                l[uvl].uv = (0.5 * (b0 + b1), 0.5)
    bmesh.ops.recalc_face_normals(bm, faces=[f for f in bm.faces])
    ob = _finish(bm, "hair" if H else "hair_lo", attrs)
    tris = sum(len(p.vertices) - 2 for p in ob.data.polygons)
    report.setdefault("hairV3", {})[lod] = {"cards": counts, "tris": int(tris), "verts": len(ob.data.vertices),
                                           "tailLength": Ltail}
    if H:
        # keep the guide curves as a Blender curve object (provenance; not exported)
        cu = bpy.data.curves.new("hair_guides", "CURVE")
        cu.dimensions = "3D"
        for g in guides_for_report:
            sp = cu.splines.new("POLY")
            sp.points.add(len(g) - 1)
            for p, q in zip(sp.points, g):
                p.co = (*q, 1)
        go = bpy.data.objects.new("hair_guides", cu)
        bpy.context.collection.objects.link(go)
    return ob
