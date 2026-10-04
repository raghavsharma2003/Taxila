# Arm A parts: every non-skin mesh, generated from numbers (params.json 'parts'). Pure numpy: each builder returns
# (verts Nx3, faces list, extras dict). build.py turns them into Blender objects.
import math
import numpy as np

import head as HD


def _norm(v):
    return v / np.maximum(np.linalg.norm(v, axis=-1, keepdims=True), 1e-12)


def tube(C, N, B, wa, wb, M=8, cap=True, off=None):
    """Elliptic tube along centreline C (Lx3) with frame N (normal-ish) and B (side), half-widths wa (along B),
    wb (along N). Returns verts, quads (+ fan caps)."""
    L = len(C)
    ang = np.linspace(0, 2 * np.pi, M, endpoint=False)
    V = []
    for i in range(L):
        for a in ang:
            V.append(C[i] + B[i] * wa[i] * math.cos(a) + N[i] * wb[i] * math.sin(a))
    F = []
    for i in range(L - 1):
        for j in range(M):
            a = i * M + j; b = i * M + (j + 1) % M
            F.append([a, b, b + M, a + M])
    if cap:
        c0 = len(V); V.append(C[0] - _norm(C[1] - C[0]) * min(wa[0], wb[0]) * 0.3)
        c1 = len(V); V.append(C[-1] + _norm(C[-1] - C[-2]) * min(wa[-1], wb[-1]) * 0.3)
        for j in range(M):
            F.append([(j + 1) % M, j, c0])
            F.append([(L - 1) * M + j, (L - 1) * M + (j + 1) % M, c1])
    return np.array(V), F


def frames_from_normals(C, Nsurf):
    T = np.gradient(C, axis=0)
    T = _norm(T)
    Bv = _norm(np.cross(Nsurf, T))
    Nv = _norm(np.cross(T, Bv))
    return Nv, Bv


# ------------------------------------------------------------------ eyes
def eyeball(P, side, seg=28, rings=18):
    """UV sphere with its pole on the gaze axis (-Y). UV = planar front projection (iris texture)."""
    c = np.array(P["eye_c"]) * [side, 1, 1]
    r = P["eye_r"]
    V, UV, F = [], [], []
    for i in range(rings + 1):
        th = math.pi * i / rings          # 0 = front pole
        for j in range(seg):
            ph = 2 * math.pi * j / seg
            d = np.array([math.sin(th) * math.cos(ph), -math.cos(th), math.sin(th) * math.sin(ph)])
            # behind the lids (beyond ~55 deg from the gaze axis) the ball tucks in so it never pokes through the skin
            k = min(1.0, max(0.0, (math.degrees(th) - P.get('ball_tuck_deg', 55)) / P.get('ball_tuck_ramp', 45.0)))
            V.append(c + d * r * (1 - P.get('ball_tuck', 0.3) * k * k * (3 - 2 * k)))
            if th <= math.pi / 2:
                UV.append((0.5 + 0.5 * d[0] * side, 0.5 + 0.5 * d[2]))
            else:
                UV.append((0.5 + 0.5 * math.cos(ph), 0.5 + 0.5 * math.sin(ph)))  # rim (sclera)
    for i in range(rings):
        for j in range(seg):
            a = i * seg + j; b = i * seg + (j + 1) % seg
            F.append([a, a + seg, b + seg, b] if side > 0 else [a, b, b + seg, a + seg])
    return np.array(V), F, {"uv": UV, "centre": c}


def cornea(P, side, seg=28, rings=9):
    """Clear shell over the front of the ball: flush with the sclera at its edge, a soft dome over the iris only."""
    c = np.array(P["eye_c"]) * [side, 1, 1]
    r = P["eye_r"]; lim = math.radians(P["cornea_deg"]); bulge = P["cornea_bulge"]
    iris = math.radians(P["iris_deg"])
    def rad(th):
        k = max(0.0, 1 - (th / (iris * 1.15)) ** 2)
        return r + 0.00012 + bulge * k ** 1.5
    V, F = [c + np.array([0, -rad(0.0), 0])], []
    for i in range(1, rings + 1):
        th = lim * i / rings
        rr = rad(th)
        for j in range(seg):
            ph = 2 * math.pi * j / seg
            d = np.array([math.sin(th) * math.cos(ph), -math.cos(th), math.sin(th) * math.sin(ph)])
            V.append(c + d * rr)
    for j in range(seg):
        a = 1 + j; b = 1 + (j + 1) % seg
        F.append([0, b, a] if side < 0 else [0, a, b])
    for i in range(rings - 1):
        for j in range(seg):
            a = 1 + i * seg + j; b = 1 + i * seg + (j + 1) % seg
            q = [a, b, b + seg, a + seg]
            F.append(q if side < 0 else q[::-1])
    return np.array(V), F, {}


def iris_texture(P, size=256):
    """Procedural iris/sclera map (our own): warm brown radial fibres, dark limbus, black pupil. RGB uint8."""
    y, x = np.mgrid[0:size, 0:size].astype(float)
    u = (x + 0.5) / size * 2 - 1; v = (y + 0.5) / size * 2 - 1
    rr = np.sqrt(u * u + v * v)  # in units of eye radius (front projection)
    ang = np.arctan2(v, u)
    ri = math.sin(math.radians(P["iris_deg"]))
    rp = ri * P["pupil_frac"]
    scl = np.array(P["sclera_rgb"], float)
    img = np.ones((size, size, 3)) * scl
    # soft shading toward the rim of the visible ball
    img *= (1 - 0.10 * np.clip((rr - 0.55) / 0.45, 0, 1) ** 2)[..., None]
    iris_in = np.array(P["iris_in_rgb"], float); iris_out = np.array(P["iris_out_rgb"], float)
    t = np.clip(rr / ri, 0, 1)
    fib = 0.5 + 0.5 * np.sin(ang * 23 + 3 * np.sin(ang * 7)) * np.sin(ang * 11 + 1.3)
    col = iris_in[None, None] * (1 - t[..., None] ** 1.4) + iris_out[None, None] * (t[..., None] ** 1.4)
    col *= (0.88 + 0.16 * fib[..., None] * np.clip((t - 0.45) / 0.4, 0, 1)[..., None])
    # top of the iris a touch darker (lid shadow is painted by light; keep subtle)
    col *= (1 - 0.12 * np.clip(-v / ri, 0, 1)[..., None] * (rr < ri)[..., None])
    limb = np.clip((t - 0.86) / 0.14, 0, 1)
    col = col * (1 - limb[..., None] * 0.55)
    mask = np.clip((ri - rr) / 0.012 + 0.5, 0, 1)[..., None]
    img = img * (1 - mask) + col * mask
    pm = np.clip((rp - rr) / 0.01 + 0.5, 0, 1)[..., None]
    img = img * (1 - pm) + np.array([6, 5, 5.0]) * pm
    return np.clip(img, 0, 255).astype(np.uint8)


def lash_line(P, side, snap=None, n=26, M=8):
    """Thick upper liner riding the lid margin, with the style C flick: a straight taper out and slightly up."""
    Fr = HD.eye_frame(P, side)
    R0 = P["eye_r"] + P["lid_t"]
    t0 = P["lash_t0"]; t1 = P.get("lash_t1", 0.93)
    ts = np.linspace(t0, t1, n)
    C, Nn, W, Hh, AE = [], [], [], [], []
    for t in ts:
        a, e = HD.lid_margin(P, np.array([t]), True)
        w = P["lash_w"][0] + (P["lash_w"][1] - P["lash_w"][0]) * ((t - t0) / (t1 - t0)) ** 1.2
        h = P["lash_h"]
        e2 = e + w / R0 * P.get('lash_e_off', 0.22)
        d = HD.eye_dir(Fr, a, e2)[0]
        C.append(Fr[0] + d * (R0 + P.get('lash_r_off', 0.0011) + P.get('lash_r_rise', 0.0) * ((t - t0) / (t1 - t0)) ** 3)); Nn.append(d); W.append(w * 0.5); Hh.append(h * 0.5)
        AE.append((float(a[0]), float(e2[0])))
    nf = 0
    C = np.array(C); Nn = np.array(Nn)
    if snap is not None:
        # sit on the actual lid skin: ray from the eye centre through each point, onto the head mesh
        C2, N2 = [], []
        for p, hh in zip(C, Hh):
            q, nrm = snap(Fr[0], p)
            if q is None or np.linalg.norm(q + nrm * hh * 0.6 - Fr[0]) < np.linalg.norm(p - Fr[0]):
                C2.append(p); N2.append(_norm(p - Fr[0]))
            else:
                C2.append(q + nrm * hh * 0.6); N2.append(nrm)
        C = np.array(C2); Nn = np.array(N2)
        for _ in range(2):
            C[1:-1] = 0.5 * C[1:-1] + 0.25 * (C[:-2] + C[2:])
    # the wing: straight out-and-up along the skin from the end of the liner, tapering to a point
    nwing = 8
    Tn = _norm(C[-1] - C[-3])
    n_end = _norm(Nn[-1])
    upv = np.array([0, 0, 1.0]); upv = _norm(upv - n_end * np.dot(upv, n_end))
    Tt = _norm(Tn - n_end * np.dot(Tn, n_end))
    ang = math.radians(P["lash_flick"][1])
    D = _norm(Tt * math.cos(ang) + upv * math.sin(ang))
    Lw = P.get("lash_wing_len", 0.0055)
    Cw, Nw = [], []
    for k in range(1, nwing + 1):
        s_ = k / nwing
        q = C[-1] + D * Lw * s_ + upv * Lw * 0.25 * s_ * s_
        if snap is not None:
            hit, nrm = snap(q - n_end * 0.01, q + n_end * 0.002)
            if hit is not None:
                q = hit + nrm * Hh[-1] * 0.6
        Cw.append(q); Nw.append(n_end)
        W.append((P["lash_w"][1] * 0.5) * (1 - s_) ** 0.8 + 0.00008)
        Hh.append(P["lash_h"] * 0.5 * (1 - 0.6 * s_))
    C = np.vstack([C, np.array(Cw)]); Nn = np.vstack([Nn, np.array(Nw)])
    Nv, Bv = frames_from_normals(C, Nn)
    V, F = tube(C, Nv, Bv, np.array(W), np.array(Hh), M=M)
    return V, F, {}


# ------------------------------------------------------------------ brows
def brow(P, sdf, side, n=22, M=10):
    pts = np.array(P["brow_pts"], float)  # (x, z) control points inner -> outer, her left
    ts = np.linspace(0, 1, n)
    # Catmull-Rom through the control points
    k = len(pts)
    u = ts * (k - 1)
    xs = np.interp(u, np.arange(k), pts[:, 0]); zs = np.interp(u, np.arange(k), pts[:, 1])
    for _ in range(3):
        xs[1:-1] = 0.5 * xs[1:-1] + 0.25 * (xs[:-2] + xs[2:])
        zs[1:-1] = 0.5 * zs[1:-1] + 0.25 * (zs[:-2] + zs[2:])
    xz = np.stack([xs * side, zs], 1)
    y = sdf.front_y(xz)
    C0 = np.stack([xz[:, 0], y, xz[:, 1]], 1)
    Ns = sdf.normal(C0)
    th = np.array(P["brow_thick"], float)  # inner, mid, outer full thickness
    w = np.interp(ts, [0, 0.35, 1.0], th) * 0.5
    # rounded blunt inner end, tapered outer tip
    w = w * np.sqrt(np.clip(ts / 0.06, 0, 1)) ** 0.5 * (1 - 0.85 * np.clip((ts - 0.82) / 0.18, 0, 1) ** 1.5)
    w = np.maximum(w, 0.0003)
    h = np.full(n, P["brow_h"]) * (0.6 + 0.4 * w / w.max())
    C = C0 + Ns * (h * 0.35)[:, None]
    Nv, Bv = frames_from_normals(C, Ns)
    V, F = tube(C, Nv, Bv, w, h, M=M)
    if side < 0:
        F = [f[::-1] for f in F]
    return V, F, {}


# ------------------------------------------------------------------ mouth interior
def teeth(P, sdf, upper, n=18, M=8):
    zm = P["mouth_z"]
    y0 = float(sdf.front_y(np.array([[0.0, zm]]))[0]) + P["teeth_back"]
    half = P["teeth_half_w"]
    ts = np.linspace(-1, 1, n)
    x = ts * half
    y = y0 + P["teeth_arch"] * (ts ** 2) * half
    hgt = P["teeth_h"]
    zc = zm + (hgt * 0.5 - P["teeth_show"]) * (1 if upper else -1) + (P["teeth_upper_dz"] if upper else P["teeth_lower_dz"])
    C = np.stack([x, y, np.full(n, zc)], 1)
    Nn = np.tile([0, 0, 1.0], (n, 1))
    Nv, Bv = frames_from_normals(C, Nn)
    # Bv is the front-back axis here (perp to tangent and up)
    wa = np.full(n, P["teeth_t"] * 0.5) * (1 - 0.3 * np.abs(ts) ** 3)
    wb = np.full(n, hgt * 0.5) * (1 - 0.35 * np.abs(ts) ** 4)
    V, F = tube(C, Nv, Bv, wa, wb, M=M)
    return V, F, {}


def tongue(P, sdf, seg=16, rings=10):
    zm = P["mouth_z"]
    y0 = float(sdf.front_y(np.array([[0.0, zm]]))[0])
    c = np.array([0.0, y0 + P["tongue_c"][1], zm + P["tongue_c"][2]])
    r = np.array(P["tongue_r"])
    V, F = [], []
    for i in range(rings + 1):
        th = math.pi * i / rings
        for j in range(seg):
            ph = 2 * math.pi * j / seg
            d = np.array([math.sin(th) * math.cos(ph), math.sin(th) * math.sin(ph), math.cos(th)])
            p = d * r
            if d[2] > 0:
                p[2] *= 0.7  # flatter top
            V.append(c + p)
    for i in range(rings):
        for j in range(seg):
            a = i * seg + j; b = i * seg + (j + 1) % seg
            F.append([a, b, b + seg, a + seg])
    return np.array(V), F, {"centre": c}


# ------------------------------------------------------------------ ears, jewellery
def ear(P, sdf, side, seg=20, rings=12):
    c = np.array(P["ear_c"], float) * [side, 1, 1]
    hgt, wid, thk = P["ear_size"]
    V, F = [], []
    for i in range(rings + 1):
        th = math.pi * i / rings
        for j in range(seg):
            ph = 2 * math.pi * j / seg
            # local: u = forward/back (y), v = up (z), w = outward (x)
            lu = math.sin(th) * math.cos(ph); lv = math.cos(th); lw = math.sin(th) * math.sin(ph)
            # egg: wider top, narrow lobe
            sc = 1.0 + 0.18 * lv
            p = np.array([lw * thk * 0.5, lu * wid * 0.5 * sc, lv * hgt * 0.5])
            # concha: push the outer face in (bowl), keep a rim
            rad = math.hypot(lu, lv * 0.9)
            if lw > 0:
                p[0] -= P["ear_bowl"] * max(0, 1 - (rad / 0.78) ** 2) * lw
            V.append(p)
    V = np.array(V)
    rot = math.radians(P["ear_rot"])
    Ry = np.array([[1, 0, 0], [0, math.cos(rot), -math.sin(rot)], [0, math.sin(rot), math.cos(rot)]])
    flare = math.radians(P["ear_flare"])
    Rz = np.array([[math.cos(flare), -math.sin(flare), 0], [math.sin(flare), math.cos(flare), 0], [0, 0, 1]])
    V = V @ Ry.T @ Rz.T
    V[:, 0] *= side
    V = V + c
    for i in range(rings):
        for j in range(seg):
            a = i * seg + j; b = i * seg + (j + 1) % seg
            q = [a, b, b + seg, a + seg]
            F.append(q if side > 0 else q[::-1])
    return V, F, {}


def ico(c, r, sub=2):
    t = (1 + 5 ** 0.5) / 2
    V = [(-1, t, 0), (1, t, 0), (-1, -t, 0), (1, -t, 0), (0, -1, t), (0, 1, t), (0, -1, -t), (0, 1, -t),
         (t, 0, -1), (t, 0, 1), (-t, 0, -1), (-t, 0, 1)]
    F = [(0, 11, 5), (0, 5, 1), (0, 1, 7), (0, 7, 10), (0, 10, 11), (1, 5, 9), (5, 11, 4), (11, 10, 2), (10, 7, 6),
         (7, 1, 8), (3, 9, 4), (3, 4, 2), (3, 2, 6), (3, 6, 8), (3, 8, 9), (4, 9, 5), (2, 4, 11), (6, 2, 10),
         (8, 6, 7), (9, 8, 1)]
    V = [np.array(v, float) / np.linalg.norm(v) for v in V]
    for _ in range(sub):
        cache = {}; NF = []
        def mid(a, b):
            k = (min(a, b), max(a, b))
            if k not in cache:
                m = V[a] + V[b]; V.append(m / np.linalg.norm(m)); cache[k] = len(V) - 1
            return cache[k]
        for a, b, cc in F:
            ab, bc, ca = mid(a, b), mid(b, cc), mid(cc, a)
            NF += [(a, ab, ca), (b, bc, ab), (cc, ca, bc), (ab, bc, ca)]
        F = NF
    return np.array(V) * r + np.asarray(c), [list(f) for f in F], {}


def disc(c, n, r, seg=16, h=0.0003):
    n = _norm(np.asarray(n, float))
    a = _norm(np.cross(n, [0, 0, 1.0])); b = np.cross(n, a)
    V = [c + n * h]
    for j in range(seg):
        ph = 2 * math.pi * j / seg
        V.append(c + (a * math.cos(ph) + b * math.sin(ph)) * r + n * h * 0.4)
    for j in range(seg):
        V.append(c + (a * math.cos(2 * math.pi * j / seg) + b * math.sin(2 * math.pi * j / seg)) * r * 1.02 - n * 0.0006)
    F = [[0, 1 + j, 1 + (j + 1) % seg] for j in range(seg)]
    for j in range(seg):
        a0 = 1 + j; b0 = 1 + (j + 1) % seg
        F.append([a0, a0 + seg, b0 + seg, b0])
    return np.array(V), F, {}


# ------------------------------------------------------------------ hair
def _slerp_dirs(a, b, t):
    a = _norm(a); b = _norm(b)
    om = math.acos(np.clip(np.dot(a, b), -1, 1))
    if om < 1e-6:
        return a
    return (math.sin((1 - t) * om) * a + math.sin(t * om) * b) / math.sin(om)


def _dir(az, el):
    az = math.radians(az); el = math.radians(el)
    return np.array([math.sin(az) * math.cos(el), -math.cos(az) * math.cos(el), math.sin(el)])


def _catmull(ctrl, n, upow=1.0):
    """Centripetal-free uniform Catmull-Rom through unit vectors; returns n unit vectors."""
    C = [ctrl[0] * 2 - ctrl[1]] + list(ctrl) + [ctrl[-1] * 2 - ctrl[-2]]
    segs = len(ctrl) - 1
    out = []
    for i in range(n):
        u = (i / (n - 1)) ** upow * segs
        k = min(int(u), segs - 1); t = u - k
        p0, p1, p2, p3 = C[k], C[k + 1], C[k + 2], C[k + 3]
        q = 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3)
        out.append(_norm(q))
    return np.array(out)


def hair_shell(P, sdf, side, nv=54, nu=30):
    """One half of the swept shell (side +1 her left). v: parting front -> back; u: parting -> bun."""
    H = np.array(P["hair_centre"], float)
    bunA = np.array(P["bun_attach"], float)
    db = _norm(bunA - H)
    from head import march_out
    V = np.zeros((nv + 1, nu + 1, 3)); Tn = np.zeros((nv + 1, nu + 1)); flow = np.zeros((nv + 1, nu + 1, 3))
    G = P["hair_clumps"]
    for i in range(nv + 1):
        v = i / nv
        al = P["part_el"][0] + (P["part_el"][1] - P["part_el"][0]) * v   # elevation along the midline (deg, >90 = back)
        S = np.array([0.0, -math.cos(math.radians(al)), math.sin(math.radians(al))])
        # off-centre parting (to her left at the front, centred by the crown)
        S[0] = P.get("part_dx", 0.0) / 0.08 * max(0.0, 1 - v / 0.55) ** 1.5 + side * 1e-4
        S = _norm(S)
        F = [_dir(side * az, el) for az, el in P["hair_front_pts"]]
        Bk = [_dir(side * az, el) for az, el in P["hair_back_pts"]]
        vw = v ** P.get("hair_v_pow", 1.0)
        ctrl = [S] + [_norm(f * (1 - vw) + bb * vw) for f, bb in zip(F, Bk)] + [db]
        dirs = _catmull(ctrl, nu + 1, P["hair_u_pow"])
        base = march_out(sdf, H, dirs)
        # thickness profile
        TT = np.array(P["hair_T2"], float)  # rows: v = 0, 0.5, 1
        row = np.array([np.interp(v, [0, 0.5, 1.0], TT[:, c]) for c in range(TT.shape[1])])
        T = np.interp(np.arange(nu + 1) / nu, [0, 0.15, 0.55, 0.85, 1.0], row)
        # parting groove (front half only)
        u = np.arange(nu + 1) / nu
        pd = P["part_depth"] * max(0.0, 1 - v / P["part_len"])
        T = T * (1 - pd * (1 - np.sqrt(np.clip(u / 0.12, 0, 1) * (2 - np.clip(u / 0.12, 0, 1)))))
        # front edge roll into the skin
        edge = np.clip(v / P["edge_roll"], 0, 1)
        T = T * np.sqrt(np.sin(edge * math.pi / 2)) - P["edge_tuck"] * (1 - edge)
        # clumps
        c = (v * G) % 1.0
        g = (1 - (2 * c - 1) ** 2) ** P["clump_pow"]
        T = T * (1 - P["clump_depth"] + P["clump_depth"] * g) if v > 0.02 else T
        nrm = sdf.normal(base)
        V[i] = base + nrm * T[:, None]
        Tn[i] = T
        f = np.gradient(V[i], axis=0)
        flow[i] = _norm(f)
    verts = V.reshape(-1, 3)
    F = []
    for i in range(nv):
        for j in range(nu):
            a = i * (nu + 1) + j; b = a + 1; c2 = a + (nu + 1); d = c2 + 1
            q = [a, b, d, c2]
            F.append(q if side > 0 else q[::-1])
    return verts, F, {"flow": flow.reshape(-1, 3), "grid": (nv, nu)}


def bun(P, seg=28, rings=18):
    c = np.array(P["bun_c"], float); r = np.array(P["bun_r"], float)
    V, F = [], []
    for i in range(rings + 1):
        th = math.pi * i / rings
        for j in range(seg):
            ph = 2 * math.pi * j / seg
            d = np.array([math.sin(th) * math.cos(ph), math.sin(th) * math.sin(ph), math.cos(th)])
            # wrapped-coil grooves: a spiral around the bun's back axis (+Y)
            swirl = math.cos(P["bun_coils"] * (ph + 1.8 * th))
            k = 1 + P["bun_groove"] * (0.5 + 0.5 * swirl) ** 3 - P["bun_groove"] * 0.5
            V.append(c + d * r * k)
    for i in range(rings):
        for j in range(seg):
            a = i * seg + j; b = i * seg + (j + 1) % seg
            F.append([a, b, b + seg, a + seg])
    return np.array(V), F, {}


def lock(P, pts, thick, M=6, n=26):
    pts = np.array(pts, float)
    k = len(pts)
    u = np.linspace(0, k - 1, n)
    C = np.stack([np.interp(u, np.arange(k), pts[:, i]) for i in range(3)], 1)
    for _ in range(4):
        C[1:-1] = 0.5 * C[1:-1] + 0.25 * (C[:-2] + C[2:])
    ts = np.linspace(0, 1, n)
    w = thick * (1 - 0.75 * ts ** 1.5) + 0.00015
    Nn = np.tile([0, -1.0, 0], (n, 1))
    Nv, Bv = frames_from_normals(C, Nn)
    V, F = tube(C, Nv, Bv, w * 1.4, w * 0.8, M=M)
    return V, F, {}


# ------------------------------------------------------------------ kurta bust
def kurta(P, M=56):
    """Lofted superellipse sections: collar ring -> shoulders -> torso. Returns verts, quads, collar ring ids."""
    secs = P["kurta_secs"]  # [z, half_w, half_d, y_centre, exponent, collar_blend]
    nc = P["neck_ring_c"]; rr = P["neck_ring_r"]
    V = []
    for (z, hw, hd, yc, ex, cb, rs) in secs:
        for j in range(M):
            ph = 2 * math.pi * j / M
            cx, cy = math.sin(ph), -math.cos(ph)
            # superellipse
            sx = np.sign(cx) * abs(cx) ** (2 / ex); sy = np.sign(cy) * abs(cy) ** (2 / ex)
            p_body = np.array([sx * hw, yc + sy * hd, z])
            p_coll = np.array([cx * rr[0] * rs, nc[1] + cy * rr[1] * rs, z + P["neck_v"] * max(0, -cy) ** 4])
            V.append(p_body * (1 - cb) + p_coll * cb)
    V = np.array(V)
    F = []
    S = len(secs)
    for i in range(S - 1):
        for j in range(M):
            a = i * M + j; b = i * M + (j + 1) % M
            F.append([a, a + M, b + M, b])
    return V, F, {"collar": list(range(M)), "M": M}
