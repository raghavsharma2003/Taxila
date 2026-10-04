# Arm A head: front-weighted cube-sphere -> raycast onto the SDF -> concentric ring patches (eyes, mouth) made by
# repeated insets, so every loop is named by construction (loops['eye_L'][k], loops['mouth'][k]) and no stage ever
# searches for "the nearest vertex". Ring 0 is the margin (lid edge / lip seam); ring K is the original patch boundary.
import math
import numpy as np
import bmesh
from mathutils import Vector

from sdf import HeadSDF


# ---------------------------------------------------------------- analytic feature curves
def eye_frame(P, side):
    """side=+1 her left (x>0), -1 her right. Returns centre, forward, out (away from nose), up."""
    c = np.array(P["eye_c"], float) * [side, 1, 1]
    yaw = math.radians(P["eye_yaw"])
    f = np.array([side * math.sin(yaw), -math.cos(yaw), 0.0])
    up = np.array([0.0, 0.0, 1.0])
    pitch = math.radians(P.get("eye_pitch", 0.0))
    f = f * math.cos(pitch) + up * math.sin(pitch)
    out = np.cross(up, f) * side  # points away from the nose
    out /= np.linalg.norm(out)
    up = np.cross(f, out) * side
    up /= np.linalg.norm(up)
    return c, f, out, up


def eye_dir(F, a, e):
    c, f, out, up = F
    a = np.asarray(a)[..., None]; e = np.asarray(e)[..., None]
    return np.cos(e) * (np.cos(a) * f + np.sin(a) * out) + np.sin(e) * up


def eye_ae(F, p):
    """Inverse of eye_dir for points p (Nx3): azimuth a (+ outwards), elevation e, radius."""
    c, f, out, up = F
    q = np.atleast_2d(p) - c
    r = np.linalg.norm(q, axis=1)
    e = np.arcsin(np.clip((q @ up) / np.maximum(r, 1e-9), -1, 1))
    a = np.arctan2(q @ out, q @ f)
    return a, e, r


def lid_margin(P, t, upper):
    """(a, e) of the lid margin at t in [0, 1] (inner corner -> outer corner), radians."""
    A_in = math.radians(P["eye_A_in"]); A_out = math.radians(P["eye_A_out"])
    a = -A_in + (A_in + A_out) * t
    e0 = math.radians(P["eye_e_inner"]) * (1 - t) + math.radians(P["eye_e_outer"]) * t
    if upper:
        tt = np.power(t, P["eye_u_skew"])
        e = e0 + math.radians(P["eye_E_up"]) * np.power(np.sin(np.pi * tt), P["eye_u_pow"])
    else:
        tt = np.power(t, P["eye_l_skew"])
        e = e0 - math.radians(P["eye_E_lo"]) * np.power(np.sin(np.pi * tt), P["eye_l_pow"])
    return a, e


def mouth_curve(P, t, k, upper):
    """xz of mouth ring k at t in [0,1] (her right corner -> her left corner)."""
    a = P["mouth_a"][k]
    x = -a * np.cos(np.pi * t)
    s = np.sin(np.pi * t)
    zm = P["mouth_z"]
    if upper:
        b = P["mouth_bU"][k]
        z = zm + b * np.power(s, P["mouth_pU"])
        if k == P["cupid_ring"]:
            z = z - P["cupid_dip"] * np.exp(-(x / P["cupid_w"]) ** 2)
    else:
        b = P["mouth_bL"][k]
        z = zm - b * np.power(s, P["mouth_pL"])
    # resting corner lift (a soft closed smile; 0 = straight)
    z = z + P["mouth_rest_smile"] * (x / max(P["mouth_a"][0], 1e-6)) ** 2
    return x, z


# ---------------------------------------------------------------- base grid
def cube_sphere(N, warp):
    verts, faces, keymap, grid = [], [], {}, {}
    axes = [  # (normal, u, v)
        (np.array([0, -1, 0]), np.array([1, 0, 0]), np.array([0, 0, 1])),   # 0 front (-Y)
        (np.array([0, 1, 0]), np.array([-1, 0, 0]), np.array([0, 0, 1])),   # 1 back
        (np.array([1, 0, 0]), np.array([0, 1, 0]), np.array([0, 0, 1])),    # 2 her left
        (np.array([-1, 0, 0]), np.array([0, -1, 0]), np.array([0, 0, 1])),  # 3 her right
        (np.array([0, 0, 1]), np.array([1, 0, 0]), np.array([0, 1, 0])),    # 4 top
        (np.array([0, 0, -1]), np.array([1, 0, 0]), np.array([0, -1, 0])),  # 5 bottom
    ]
    for fi, (n, u, v) in enumerate(axes):
        idx = np.zeros((N + 1, N + 1), int)
        for i in range(N + 1):
            for j in range(N + 1):
                q = n + u * (2 * i / N - 1) + v * (2 * j / N - 1)
                key = tuple(np.round(q * N).astype(int))
                if key not in keymap:
                    keymap[key] = len(verts)
                    verts.append(q.astype(float))
                idx[i, j] = keymap[key]
                if fi == 0:
                    grid[keymap[key]] = (i, j)
        for i in range(N):
            for j in range(N):
                faces.append([idx[i, j], idx[i + 1, j], idx[i + 1, j + 1], idx[i, j + 1]])
    V = np.array(verts)
    x, y, z = V[:, 0], V[:, 1], V[:, 2]
    S = np.stack([x * np.sqrt(1 - y * y / 2 - z * z / 2 + y * y * z * z / 3),
                  y * np.sqrt(1 - z * z / 2 - x * x / 2 + z * z * x * x / 3),
                  z * np.sqrt(1 - x * x / 2 - y * y / 2 + x * x * y * y / 3)], 1)
    S = S + warp * np.array([0, -1, 0])
    S /= np.linalg.norm(S, axis=1, keepdims=True)
    # make sure every face winds outward
    F = []
    for f in faces:
        a, b, c = S[f[0]], S[f[1]], S[f[2]]
        if np.dot(np.cross(b - a, c - a), a) < 0:
            f = f[::-1]
        F.append(f)
    return S, F, grid


def march_out(sdf, o, d, tmax=0.5):
    """First exit of the skin along each ray from an interior point (step + bisection; no Newton jumps)."""
    o = np.broadcast_to(np.asarray(o, float), d.shape).copy()
    t = np.zeros(len(d)); tp = np.zeros(len(d))
    done = np.zeros(len(d), bool)
    for _ in range(600):
        q = o + t[:, None] * d
        s = sdf(q)
        done |= s >= 0
        if np.all(done | (t > tmax)):
            break
        step = np.clip(-s, 2e-5, 0.004)
        tp = np.where(done, tp, t)
        t = np.where(done, t, t + step)
    a, b = tp, t
    for _ in range(30):
        m = 0.5 * (a + b)
        s = sdf(o + m[:, None] * d)
        a = np.where(s < 0, m, a); b = np.where(s < 0, b, m)
    return o + (0.5 * (a + b))[:, None] * d


# ---------------------------------------------------------------- ring helpers
def boundary_loop(ring_verts):
    """Order a set of BMVerts that form a closed boundary of a hole."""
    S = set(ring_verts)
    start = next(iter(S))
    loop = [start]
    prev = None
    cur = start
    while True:
        nxt = None
        for e in cur.link_edges:
            o = e.other_vert(cur)
            if o in S and o is not prev and len(e.link_faces) == 1:
                nxt = o
                break
        if nxt is None or nxt is start:
            break
        loop.append(nxt)
        prev, cur = cur, nxt
        if len(loop) > len(S) + 2:
            raise RuntimeError("loop walk failed")
    if len(loop) != len(S):
        raise RuntimeError(f"loop walk {len(loop)} != {len(S)}")
    return loop


def next_ring(ring, prev_ring):
    A = set(ring); B = set(prev_ring) if prev_ring else set()
    out = []
    for v in ring:
        cand = [e.other_vert(v) for e in v.link_edges if e.other_vert(v) not in A and e.other_vert(v) not in B]
        if len(cand) != 1:
            raise RuntimeError(f"ring step ambiguous ({len(cand)})")
        out.append(cand[0])
    return out


def make_ring_patch(bm, patch_faces, K, th):
    region = list(patch_faces)
    for _ in range(K):
        bmesh.ops.inset_region(bm, faces=region, thickness=th, depth=0.0, use_even_offset=True)
    inner = set(v for f in region for v in f.verts)
    edge_v = set()
    for f in region:
        for e in f.edges:
            if any(ff not in region for ff in e.link_faces):
                edge_v.update(e.verts)
    rs = set(region)
    bmesh.ops.delete(bm, geom=list(rs), context='FACES')
    ring0 = boundary_loop([v for v in edge_v if v.is_valid])
    rings = [ring0]
    prev = None
    for k in range(K):
        r = next_ring(rings[-1], prev)
        prev = rings[-1]
        rings.append(r)
    return rings


def build_head(P, N, warp, K_eye, K_mouth, eye_patch, mouth_patch):
    sdf = HeadSDF(P, with_eyes=P.get('skin_with_eyes', True))
    S, F, grid = cube_sphere(N, warp)
    H = np.array(P["ray_centre"], float)
    V = march_out(sdf, H, S)
    bm = bmesh.new()
    bv = [bm.verts.new(Vector(p)) for p in V]
    for f in F:
        bm.faces.new([bv[i] for i in f])
    bm.verts.ensure_lookup_table()
    # neck opening
    zc = P["neck_cut_z"]
    kill = [f for f in bm.faces if all(v.co.z < zc for v in f.verts)]
    bmesh.ops.delete(bm, geom=kill, context='FACES')
    neck_ring = [v for v in bm.verts if v.is_boundary]
    for v in neck_ring:
        v.co.z = zc
    neck_ring = boundary_loop(neck_ring)

    # pick patch centres on the front grid
    front = {i: ij for i, ij in grid.items()}
    def nearest_grid(target):
        best, bd = None, 1e9
        for i, ij in front.items():
            d = np.linalg.norm(V[i] - target)
            if d < bd:
                best, bd = ij, d
        return best
    ij_of_face = {}
    for f in bm.faces:
        ids = [v.index for v in f.verts]
        if all(i in front for i in ids):
            ij_of_face[f] = np.mean([front[i] for i in ids], axis=0)

    fc = {f: np.mean([V[v.index] for v in f.verts], axis=0) for f in ij_of_face}

    def patch(centre, ax, az):
        return [f for f, c in fc.items() if ((c[0] - centre[0]) / ax) ** 2 + ((c[2] - centre[2]) / az) ** 2 <= 1.0]

    eyeL_c = np.array(P["eye_c"]) + [P.get("eye_patch_dx", 0.0), 0, P["eye_patch_dz"]]
    eyeR_c = eyeL_c * [-1, 1, 1]
    mouth_c = np.array([0.0, -0.05, P["mouth_z"] + P.get("mouth_patch_dz", 0.0)])
    pL = patch(eyeL_c, *eye_patch); pR = patch(eyeR_c, *eye_patch); pM = patch(mouth_c, *mouth_patch)
    loops = {}
    loops["eye_L"] = make_ring_patch(bm, pL, K_eye, 0.002)
    loops["eye_R"] = make_ring_patch(bm, pR, K_eye, 0.002)
    loops["mouth"] = make_ring_patch(bm, pM, K_mouth, 0.002)
    loops["neck"] = [neck_ring]

    # lid tucks (one ring inward, hidden inside the ball) and the mouth interior
    for key in ("eye_L", "eye_R"):
        r0 = loops[key][0]
        edges = [e for e in bm.edges if e.verts[0] in set(r0) and e.verts[1] in set(r0) and e.is_boundary]
        res = bmesh.ops.extrude_edge_only(bm, edges=edges)
        newv = [g for g in res["geom"] if isinstance(g, bmesh.types.BMVert)]
        tuck = next_ring(r0, loops[key][1])
        loops[key + "_tuck"] = [tuck]
    r0 = loops["mouth"][0]
    s0 = set(r0)
    edges = [e for e in bm.edges if e.verts[0] in s0 and e.verts[1] in s0 and e.is_boundary]
    bmesh.ops.extrude_edge_only(bm, edges=edges)
    inner1 = next_ring(r0, loops["mouth"][1])
    s1 = set(inner1)
    edges = [e for e in bm.edges if e.verts[0] in s1 and e.verts[1] in s1 and e.is_boundary]
    bmesh.ops.extrude_edge_only(bm, edges=edges)
    inner2 = next_ring(inner1, r0)
    s2 = set(inner2)
    edges = [e for e in bm.edges if e.verts[0] in s2 and e.verts[1] in s2 and e.is_boundary]
    bmesh.ops.extrude_edge_only(bm, edges=edges)
    inner3 = next_ring(inner2, inner1)
    loops["mouth_in"] = [inner1, inner2, inner3]
    # close the bag with a fan (the back of the mouth is never seen straight on)
    cen = bm.verts.new(sum((v.co for v in inner3), Vector()) / len(inner3))
    n3 = len(inner3)
    for i in range(n3):
        a, b = inner3[i], inner3[(i + 1) % n3]
        try:
            bm.faces.new([b, a, cen])
        except ValueError:
            pass
    loops["mouth_bag_c"] = [[cen]]
    return bm, loops, sdf


# ---------------------------------------------------------------- placement
def ring_param(ring, axis_x, centre):
    """Split a ring into its two corners and halves. Returns per-vertex (t in [0,1], upper bool)."""
    X = np.array([v.co.x for v in ring]) * axis_x
    Z = np.array([v.co.z for v in ring])
    n = len(ring)
    th = np.arctan2(Z - Z.mean(), X - X.mean())
    i1 = int(np.argmin(np.abs(th)))
    i0 = int(np.argmin(np.abs(np.abs(th) - np.pi)))
    order = [(i0 + k) % n for k in range(n)]
    pos1 = order.index(i1)
    half_a = order[:pos1 + 1]
    half_b = order[pos1:] + [i0]
    za = np.mean(Z[half_a[1:-1]]) if len(half_a) > 2 else 0
    zb = np.mean(Z[half_b[1:-1]]) if len(half_b) > 2 else 0
    up, lo = (half_a, half_b[::-1]) if za > zb else (half_b[::-1], half_a)
    t = np.zeros(n); upper = np.zeros(n, bool)
    for k, i in enumerate(up):
        t[i] = k / (len(up) - 1); upper[i] = True
    for k, i in enumerate(lo):
        t[i] = k / (len(lo) - 1)
    upper[i0] = upper[i1] = False
    return t, upper, i0, i1


def angle_param(ringK, cx, cz, sx, ax, az, curve, i0, i1):
    """Give each ring vertex the curve parameter at the same normalised angle as its boundary vertex, so the
    spokes between rings run straight (the inset correspondence alone is rotated by up to 30 degrees)."""
    X = (np.array([v.co.x for v in ringK]) - cx) * sx / ax
    Z = (np.array([v.co.z for v in ringK]) - cz) / az
    th = np.arctan2(Z, X)
    ts = np.linspace(0, 1, 400)
    out_t = np.zeros(len(ringK)); out_u = np.zeros(len(ringK), bool)
    for upper in (True, False):
        x, z = curve(ts, upper)
        a = np.arctan2((z - cz) / az, (x - cx) * sx / ax)
        if not upper:
            a = np.where(a > 0.5, a - 2 * np.pi, a)  # lower half: angles in (-pi, 0]
        order = np.argsort(a)
        for j in range(len(ringK)):
            if j in (i0, i1):
                continue
            tj = th[j]
            if upper and tj > 0:
                out_t[j] = np.interp(tj, a[order], ts[order]); out_u[j] = True
            elif not upper and tj <= 0:
                out_t[j] = np.interp(tj if tj < 0.5 else tj - 2 * np.pi, a[order], ts[order])
    out_t[i0] = 0.0; out_t[i1] = 1.0
    return out_t, out_u


def monotone_halves(t, upper, i0, i1, t_uniform, mix):
    """Blend angle-matched t with uniform t, then force it monotone along each half (no swapped spokes)."""
    n = len(t)
    t = t * mix + t_uniform * (1 - mix)
    for want_upper in (True, False):
        idx = [i for i in range(n) if i not in (i0, i1) and bool(upper[i]) == want_upper]
        idx.sort(key=lambda i: t_uniform[i])
        vals = np.sort(t[idx])
        lo, hi = 0.0, 1.0
        k = len(idx)
        vals = np.clip(vals, lo + 0.3 / (k + 1), hi - 0.3 / (k + 1))
        for i, v in zip(idx, vals):
            t[i] = v
    t[i0] = 0.0; t[i1] = 1.0
    return t


def place(bm, loops, sdf, P):
    """Put the named rings on their analytic curves, then relax the band around them onto the SDF."""
    pinned = {}
    meta = {}
    # eyes
    for key, side in (("eye_L", 1), ("eye_R", -1)):
        Fr = eye_frame(P, side)
        rings = loops[key]
        K = len(rings) - 1
        # corners: inner corner = min "out" coordinate
        r0 = rings[0]
        t, upper, i0, i1 = ring_param(rings[-1], side, None)  # x*side: min = inner (towards nose)
        R0 = P["eye_r"] + P["lid_t"]

        def curve(ts, up, Fr=Fr, R0=R0):
            a, e = lid_margin(P, ts, up)
            q = Fr[0] + eye_dir(Fr, a, e) * R0
            return q[:, 0], q[:, 2]
        t_u, up_u = t.copy(), upper.copy()
        t, upper = angle_param(rings[-1], Fr[0][0], Fr[0][2], side, 1.0, 1.0, curve, i0, i1)
        t = monotone_halves(t, up_u, i0, i1, t_u, P["eye_angle_mix"])
        upper = up_u
        meta[key] = (t, upper)
        face = HeadSDF(P, with_eyes=False)
        for k in range(K):
            ring = rings[k]
            g = P["eye_ring_grow"][k]
            for vi, v in enumerate(ring):
                up_v = bool(upper[vi])
                bul = P["eye_ring_bulge"] if up_v else P.get("eye_ring_bulge_lo", P["eye_ring_bulge"])
                rad = R0 + bul[k]
                a, e = lid_margin(P, np.array([t[vi]]), bool(upper[vi]) or vi == i0 or vi == i1)
                if vi in (i0, i1):
                    a = a * (1 + g * (P.get("eye_outer_grow", 1.0) if vi == i1 else P["eye_inner_grow"]))
                    e = e
                else:
                    ec = math.radians(P["eye_e_inner"]) * (1 - t[vi]) + math.radians(P["eye_e_outer"]) * t[vi]
                    a = a * (1 + g * 0.55)
                    e = ec + (e - ec) * (1 + g)
                d = eye_dir(Fr, a, e)[0]
                ps = Fr[0] + d * rad
                fw = P["eye_ring_face_w"] if up_v else P.get("eye_ring_face_w_lo", P["eye_ring_face_w"])
                w = fw[k] if k < len(fw) else 1.0
                if k > 1:
                    edge = max(0.0, 1 - min(t[vi], 1 - t[vi]) / 0.2)  # 1 at the corners, 0 from 20% in
                    w = max(w, P.get("eye_corner_face_w", 0.85) * edge * edge * (3 - 2 * edge))
                if w > 0:
                    pf = march_out(face, Fr[0], d[None, :])[0]
                    ps = ps * (1 - w) + pf * w
                    rmin = R0 + bul[k] * 0.5
                    if np.linalg.norm(ps - Fr[0]) < rmin:
                        ps = Fr[0] + (ps - Fr[0]) / np.linalg.norm(ps - Fr[0]) * rmin
                pinned[v] = (ps, 1.0 if k < P["eye_pin_rings"] else 0.0)
        tuck = loops[key + "_tuck"][0]
        for vi, v in enumerate(tuck):
            a, e = lid_margin(P, np.array([t[vi]]), bool(upper[vi]))
            d = eye_dir(Fr, a * 0.97, e * 0.92)[0]
            pinned[v] = (Fr[0] + d * (P["eye_r"] - 0.0012), 1.0)
    # mouth
    rings = loops["mouth"]
    K = len(rings) - 1
    t, upper, i0, i1 = ring_param(rings[-1], 1, None)
    meta["mouth"] = (t, upper)
    for k in range(K):
        ring = rings[k]
        xz = []
        for vi, v in enumerate(ring):
            x, z = mouth_curve(P, t[vi], k, bool(upper[vi]))
            if k == 0 and vi not in (i0, i1):
                z += P["seam_gap"] * (1 if upper[vi] else -1)
            xz.append((float(x), float(z)))
        xz = np.array(xz)
        y = sdf.front_y(xz) + P["mouth_ring_recess"][k]
        for vi, v in enumerate(ring):
            pinned[v] = (np.array([xz[vi, 0], y[vi], xz[vi, 1]]), 1.0 if k < P["mouth_pin_rings"] else 0.0)
    r0 = rings[0]
    for j, ring in enumerate(loops["mouth_in"]):
        for vi, v in enumerate(ring):
            p0 = pinned[r0[vi]][0]
            sgn = 1 if upper[vi] else (-1 if vi not in (i0, i1) else 0)
            off = P["mouth_in_off"][j]
            q = np.array([p0[0] * off[0], p0[1] + off[1], p0[2] + sgn * off[2] + off[3]])
            pinned[v] = (q, 1.0)
    for v, (q, w) in pinned.items():
        if w >= 1.0:
            v.co = Vector(q)
    # transition rings: interpolate from the last analytic ring to the (jagged) patch boundary, smooth along the
    # ring, project onto the skin. This is what keeps the rings concentric and fold-free.
    H0 = np.array(P["ray_centre"], float)
    for key in ("eye_L", "eye_R", "mouth"):
        rings = loops[key]
        K = len(rings) - 1
        npin = P["eye_pin_rings"] if key != "mouth" else P["mouth_pin_rings"]
        A = np.array([list(v.co) for v in rings[npin - 1]])
        B = np.array([list(v.co) for v in rings[K]])
        # smooth the boundary target along the ring (it is a jagged grid outline)
        Bs = B.copy()
        for _ in range(4):
            Bs = 0.5 * Bs + 0.25 * (np.roll(Bs, 1, 0) + np.roll(Bs, -1, 0))
        proj = lambda Q: np.stack([Q[:, 0], sdf.front_y(Q[:, [0, 2]]), Q[:, 2]], 1)
        Bs = proj(Bs)
        for j, k in enumerate(range(npin, K + 1)):
            s = (k - npin + 1) / (K - npin + 1)
            Q = A * (1 - s) + Bs * s
            for _ in range(2):
                Q = 0.5 * Q + 0.25 * (np.roll(Q, 1, 0) + np.roll(Q, -1, 0))
            Q = proj(Q)
            if k == K:
                for v, q in zip(rings[k], Q):
                    pinned[v] = (q, 0.0)
                continue
            for v, q in zip(rings[k], Q):
                v.co = Vector(q)
                pinned[v] = (q, 1.0)
    # relax band: vertices within `band` edges of a feature ring (excluding pinned) + unpinned rings
    bm.verts.ensure_lookup_table()
    hard = set(v for v, (q, w) in pinned.items() if w >= 1.0)
    soft = {v: q for v, (q, w) in pinned.items() if w < 1.0}
    seeds = set(soft.keys())
    band = set(seeds)
    frontier = set(seeds)
    for _ in range(P["relax_band"]):
        nf = set()
        for v in frontier:
            for e in v.link_edges:
                o = e.other_vert(v)
                if o not in band and o not in hard and not o.is_boundary:
                    nf.add(o)
        band |= nf
        frontier = nf
    band = [v for v in band if v not in hard]
    H = np.array(P["ray_centre"], float)
    for it in range(P["relax_iters"]):
        newp = {}
        for v in band:
            nb = [e.other_vert(v).co for e in v.link_edges]
            c = sum(nb, Vector()) / len(nb)
            p = v.co.lerp(c, 0.6)
            if v in soft:
                p = p.lerp(Vector(soft[v]), 0.35)
            newp[v] = p
        pts = np.array([list(newp[v]) for v in band])
        # reproject onto skin radially from the ray centre
        d = pts - H
        d /= np.linalg.norm(d, axis=1, keepdims=True)
        pr = march_out(sdf, H, d)
        for v, q in zip(band, pr):
            v.co = Vector(q)
    return meta
