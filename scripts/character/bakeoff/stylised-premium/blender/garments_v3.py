"""procedural-v3 garments: modelled cloth, not offset skin (CHARACTER-PIPELINE §8, §10.3).

Each layer starts as a shell of the bust, then is RELAXED as a membrane: Laplacian (tension) steps with a hard
constraint that keeps it at least its ease outside everything under it. Tension removes the skin's anatomy (clavicle
hollows, the sternum, the cleavage line) and bridges concavities the way fabric does; the constraint keeps it on the
body. On top of the relaxed layers the details are modelled as their own geometry:

  kurti   : relaxed shell (ease 3 mm), cropped to the window the open jacket shows (+3 cm under the jacket edge),
            a scoop neckline smoothed along itself, a round piping tube on the neckline.
  jacket  : relaxed shell (ease 9 mm over skin, >= 4 mm over the kurti), open front, a raised placket strip along each
            front edge, a two-part shirt collar (stand + fall) generated from the neckline loop and constrained outside
            the jacket and the neck, two pointed chest-pocket flaps conformed to the jacket, copper shank buttons.
  edges   : every open cloth edge is rolled inward (visible thickness).

A penetration gate (ray test, `penetration`) runs on every under/over pair and the build FAILS unless all are 0:
kurti -> jacket, skin skirt -> kurti and jacket, kurti piping -> jacket, jacket -> collar fall.
Vertex attributes for texture.py: gLayer (0 kurti, 1 denim, 2 accessory metal), gEdge (distance to the nearest open
edge, m), gPart (0 shell, 1 placket, 2 collar, 3 pocket flap, 4 piping, 5 button), cylindrical or own-strip UVs.
"""
import math
import numpy as np
import bpy, bmesh
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from mpfb_env import co, smoothstep, delete_verts
import parts as P0

ACC_PATCH = dict(P0.ACC_PATCH)
ACC_PATCH["copper"] = (0.955, 0.905)
ACC_PATCH["piping"] = (0.905, 0.855)
P0.ACC_PATCH.update(ACC_PATCH)          # texture.py reads parts.ACC_PATCH


def _bvh_of(obs):
    Ps, Ts, off = [], [], 0
    for ob in obs:
        me = ob.data
        me.calc_loop_triangles()
        t = np.empty(len(me.loop_triangles) * 3, np.int64)
        me.loop_triangles.foreach_get("vertices", t)
        Ps.append(co(me))
        Ts.append(t.reshape(-1, 3) + off)
        off += len(me.vertices)
    return BVHTree.FromPolygons([Vector(p) for p in np.concatenate(Ps)], np.concatenate(Ts).tolist())


def _adjacency(me):
    e = np.empty(len(me.edges) * 2, np.int64)
    me.edges.foreach_get("vertices", e)
    e = e.reshape(-1, 2)
    nb = [[] for _ in range(len(me.vertices))]
    for a, b in e:
        nb[a].append(b)
        nb[b].append(a)
    bm = bmesh.new()
    bm.from_mesh(me)
    bnd = np.zeros(len(me.vertices), bool)
    bnb = [[] for _ in range(len(me.vertices))]
    for ed in bm.edges:
        if ed.is_boundary:
            a, b = ed.verts[0].index, ed.verts[1].index
            bnd[a] = bnd[b] = True
            bnb[a].append(b)
            bnb[b].append(a)
    bm.free()
    return nb, bnd, bnb


def _push_outside(P, constraints, mask=None):
    """constraints: [(bvh, ease)]; every vertex at least `ease` outside each surface (signed along its normal)."""
    moved = 0
    for i in range(len(P)):
        if mask is not None and not mask[i]:
            continue
        for bvh, ease, reach in constraints:
            loc, n, _, d = bvh.find_nearest(Vector(P[i]), reach)
            if loc is None:
                continue
            n = np.array(n)
            s = (P[i] - np.array(loc)) @ n
            if s < ease:
                P[i] = P[i] + n * (ease - s)
                moved += 1
    return moved


def relax(ob, constraints, fixed, iters=36, lam=0.55, free_edge_lam=0.5):
    """Membrane relaxation: Laplacian tension + hard outside-constraints. `fixed` (bool per vertex) never moves."""
    me = ob.data
    P = co(me)
    nb, bnd, bnb = _adjacency(me)
    moved = 0
    for it in range(iters):
        Q = P.copy()
        for i in range(len(P)):
            if fixed[i]:
                continue
            if bnd[i]:
                if len(bnb[i]) == 2:
                    m = 0.5 * (P[bnb[i][0]] + P[bnb[i][1]])
                    Q[i] = P[i] + free_edge_lam * (m - P[i])
            elif nb[i]:
                Q[i] = P[i] + lam * (P[nb[i]].mean(0) - P[i])
        P = Q
        moved = _push_outside(P, constraints, ~fixed)
    me.vertices.foreach_set("co", P.ravel())
    me.update()
    return moved


def _attr(ob, name, arr, kind="FLOAT"):
    a = ob.data.attributes.get(name) or ob.data.attributes.new(name, kind, "POINT")
    a.data.foreach_set("value", np.asarray(arr, np.float32 if kind == "FLOAT" else np.int32))


def _strip_uv(ob, uv_of_vertex):
    me = ob.data
    uvl = me.uv_layers.get("UVMap") or me.uv_layers.new(name="UVMap")
    for p in me.polygons:
        for li, vi in zip(p.loop_indices, p.vertices):
            uvl.data[li].uv = uv_of_vertex(vi)


def _cyl_uv(ob, ctr, v0, v1, z0, z1):
    me = ob.data
    Pp = co(me)
    th = np.arctan2(Pp[:, 0] - ctr[0], -(Pp[:, 1] - ctr[1]))
    _strip_uv(ob, lambda vi: (0.02 + 0.86 * (th[vi] + math.pi) / (2 * math.pi),
                              v0 + (v1 - v0) * float(np.clip((Pp[vi, 2] - z0) / (z1 - z0), 0, 1))))


def _grid(name, Pgrid, uv_rect, close_u=False):
    """Quad grid mesh from (n_u, n_v, 3) points; uv_rect = (u0, v0, u1, v1)."""
    nu, nv, _ = Pgrid.shape
    bm = bmesh.new()
    uvl = bm.loops.layers.uv.new("UVMap")
    V = [[bm.verts.new(Vector(Pgrid[i, j])) for j in range(nv)] for i in range(nu)]
    u0, v0, u1, v1 = uv_rect
    rng_i = range(nu if close_u else nu - 1)
    for i in rng_i:
        i2 = (i + 1) % nu
        for j in range(nv - 1):
            f = bm.faces.new([V[i][j], V[i2][j], V[i2][j + 1], V[i][j + 1]])
            for l, (a, b) in zip(f.loops, ((i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1))):
                l[uvl].uv = (u0 + (u1 - u0) * a / max(nu - (0 if close_u else 1), 1), v0 + (v1 - v0) * b / max(nv - 1, 1))
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    return ob


def _tube(name, path, radius, sides, uv):
    """Closed tube along a polyline (piping)."""
    n = len(path)
    tan = np.gradient(path, axis=0)
    tan /= np.linalg.norm(tan, axis=1, keepdims=True)
    ref = np.array([0.0, 0.0, 1.0])
    G = np.zeros((n, sides, 3))
    for i in range(n):
        a = np.cross(tan[i], ref)
        if np.linalg.norm(a) < 1e-6:
            a = np.cross(tan[i], [1.0, 0, 0])
        a /= np.linalg.norm(a)
        b = np.cross(tan[i], a)
        for k in range(sides):
            ph = 2 * math.pi * k / sides
            G[i, k] = path[i] + radius * (math.cos(ph) * a + math.sin(ph) * b)
    ob = _grid(name, G.transpose(1, 0, 2), (uv[0], uv[1], uv[0], uv[1]), close_u=True)
    return ob


def _roll(ob, inward, keep):
    """Extrude the open edges whose both vertices satisfy keep(co) inward (towards the body) by `inward`."""
    me = ob.data
    bm = bmesh.new()
    bm.from_mesh(me)
    bm.normal_update()
    edges = [e for e in bm.edges if e.is_boundary and all(keep(np.array(v.co)) for v in e.verts)]
    if edges:
        ret = bmesh.ops.extrude_edge_only(bm, edges=edges)
        for v in [g for g in ret["geom"] if isinstance(g, bmesh.types.BMVert)]:
            n = v.normal if v.normal.length > 0 else Vector((0, 0, 1))
            v.co -= n * inward
    bm.to_mesh(me)
    bm.free()
    me.update()


def penetration(under, over, reach=0.03, where=None):
    """Vertices of `under` OUTSIDE `over` where `over` exists (parts.penetration semantics: no `over` ahead along the
    vertex normal within `reach`, but `over` behind within 15 mm). Returns the count; offending positions -> where."""
    bvh = _bvh_of([over])
    me = under.data
    me.update()
    bad = []
    for v in me.vertices:
        p, nn = v.co, v.normal
        ahead = bvh.ray_cast(p + nn * 1e-4, nn, reach)[0]
        if ahead is None and bvh.ray_cast(p - nn * 1e-4, -nn, 0.015)[0] is not None:
            bad.append(v.index)
    if where is not None:
        where[under.name + ">" + over.name] = [[round(x, 6) for x in me.vertices[i].co] for i in bad]
    return len(bad)


def _ordered_loop(ob, sel):
    """Boundary vertices `sel` (bool) of ob, ordered along their boundary edges (longest chain)."""
    me = ob.data
    _, bnd, bnb = _adjacency(me)
    S = set(np.nonzero(sel & bnd)[0].tolist())
    best = []
    seen = set()
    for s in list(S):
        if s in seen:
            continue
        # walk to one end
        chain = [s]
        seen.add(s)
        for direction in (0, 1):
            cur = s
            prev = None
            while True:
                nxt = [v for v in bnb[cur] if v in S and v != prev and v not in seen]
                if not nxt:
                    break
                prev, cur = cur, nxt[0]
                seen.add(cur)
                if direction == 0:
                    chain.append(cur)
                else:
                    chain.insert(0, cur)
        if len(chain) > len(best):
            best = chain
    return np.array(best)


def make(skin, look, J, report):
    """kurti + denim jacket (teal). Returns [objects] (joined by the caller into `garment`)."""
    g = look["garment"]
    gv = g.get("v3", {})
    Pk = co(skin.data)
    ctr = np.array([0.0, J["joint-neck"][1] + 0.005])
    th = np.arctan2(Pk[:, 0] - ctr[0], -(Pk[:, 1] - ctr[1]))
    z_clav = J["joint-l-clavicle"][2]
    zmin = Pk[:, 2].min()
    x_arm = abs(J["joint-l-shoulder"][0]) + 0.045 - 0.006
    front = np.clip(np.cos(th), 0, 1)
    base = z_clav + 0.045
    z_col = base - gv.get("scoop", 0.055) * front ** gv.get("scoopExp", 2.0)    # kurti scoop neckline (U for exp ~1)
    z_colJ = base + 0.006 - 0.03 * front ** 2                     # jacket neckline (higher: the collar sits on it)
    polys = skin.data.polygons
    skin_bvh = _bvh_of([skin])
    out = []

    def shell_from(mask_v, offset, name):
        fm = np.array([all(mask_v[i] for i in p.vertices) for p in polys])
        ob, _ = P0._shell(skin, fm, offset, name)
        return ob

    def fixed_mask(ob):
        Q = co(ob.data)
        _, bnd, _ = _adjacency(ob.data)
        return bnd & ((Q[:, 2] < zmin + 0.012) | (np.abs(Q[:, 0]) > x_arm - 0.004))

    # ------------------------------------------------ kurti
    ease_k = gv.get("easeKurti", 0.0035)
    kur = shell_from(Pk[:, 2] < z_col, ease_k, "g_kurti")
    P0._clean_edges(kur, skin_bvh, ease_k, iters=18)
    relax(kur, [(skin_bvh, ease_k, 0.04)], fixed_mask(kur), iters=gv.get("relaxIters", 36))
    kur_bvh = _bvh_of([kur])

    # ------------------------------------------------ jacket
    ease_j = gv.get("easeJacket", 0.009)
    open_half = np.radians(gv.get("openHalfDeg", 26))
    # the opening widens towards the hem (an unbuttoned jacket falls open)
    th_open = open_half + 0.22 * np.clip((base - 0.04 - Pk[:, 2]) / 0.12, 0, 1)
    jm = (Pk[:, 2] < z_colJ) & (np.abs(th) > th_open)
    jac = shell_from(jm, ease_j, "g_jacket")
    P0._clean_edges(jac, skin_bvh, ease_j, iters=18)
    P0._cap_arm_holes(jac, abs(J["joint-l-shoulder"][0]) - 0.01)
    relax(jac, [(skin_bvh, ease_j, 0.05), (kur_bvh, 0.0045, 0.04)], fixed_mask(jac), iters=gv.get("relaxIters", 36))
    # placket: a raised strip along each front opening edge
    Q = co(jac.data)
    _, bndJ, _ = _adjacency(jac.data)
    thJ = np.arctan2(Q[:, 0] - ctr[0], -(Q[:, 1] - ctr[1]))
    open_edge = bndJ & (Q[:, 2] < z_colJ.max() - 0.004) & (Q[:, 2] > zmin + 0.012) & (np.abs(Q[:, 0]) < x_arm - 0.01) & (np.abs(thJ) < 1.2)
    from scipy.spatial import cKDTree
    de, _ = cKDTree(Q[open_edge]).query(Q) if open_edge.any() else (np.full(len(Q), 1.0), None)
    plk = smoothstep(0.034, 0.026, de)
    N = np.empty(len(Q) * 3)
    jac.data.vertices.foreach_get("normal", N)
    N = N.reshape(-1, 3)
    Q = Q + N * (0.0016 * plk)[:, None]
    jac.data.vertices.foreach_set("co", Q.ravel())
    jac.data.update()
    jac_bvh = _bvh_of([jac])

    # ------------------------------------------------ kurti crop: keep the window the open jacket shows + 3 cm
    Kq = co(kur.data)
    thK = np.arctan2(Kq[:, 0] - ctr[0], -(Kq[:, 1] - ctr[1]))
    th_openK = open_half + 0.22 * np.clip((base - 0.04 - Kq[:, 2]) / 0.12, 0, 1)
    keepK = (np.abs(thK) < th_openK + gv.get("kurtiUnderlap", 0.30))
    delete_verts(kur, ~keepK)
    # the kurti must sit inside the jacket where they overlap: pull any kurti vertex that is not >= 4 mm inside the
    # jacket inward along the jacket normal (the relaxation already holds the jacket outside the kurti)
    Kq = co(kur.data)
    NK = np.empty(len(Kq) * 3)
    kur.data.vertices.foreach_get("normal", NK)
    NK = NK.reshape(-1, 3)
    pulled = 0
    for i in range(len(Kq)):
        hit = jac_bvh.ray_cast(Vector(Kq[i] + NK[i] * 1e-4), Vector(NK[i]), 0.03)
        if hit[0] is None:
            continue                      # in the open window: nothing over it
        n = np.array(hit[1])
        if n @ NK[i] < 0:
            n = -n
        s_ = (Kq[i] - np.array(hit[0])) @ n
        if s_ > -0.004:
            Kq[i] = Kq[i] - n * (s_ + 0.004)
            pulled += 1
    kur.data.vertices.foreach_set("co", Kq.ravel())
    kur.data.update()
    report.setdefault("garmentV3", {})["kurtiPulledIn"] = pulled

    # ------------------------------------------------ kurti neckline piping (a round tube)
    Kq = co(kur.data)
    _, bndK, _ = _adjacency(kur.data)
    zk = Kq[:, 2]
    neck_sel = bndK & (zk > zmin + 0.03) & (np.abs(Kq[:, 0]) < x_arm - 0.02)
    # neckline = the top boundary of the cropped kurti: highest boundary vertex per angle bin
    loop = _ordered_loop(kur, neck_sel & (zk > np.percentile(zk[bndK], 40)))
    piping = None
    if len(loop) > 6:
        path = Kq[loop]
        for _ in range(3):
            path[1:-1] = 0.25 * path[:-2] + 0.5 * path[1:-1] + 0.25 * path[2:]
        # sit the tube on the kurti edge; keep only the run the jacket does not cover (+ 8 mm under its edge)
        vis = np.zeros(len(path), bool)
        for i in range(len(path)):
            loc, n, _, _ = skin_bvh.find_nearest(Vector(path[i]))
            n = np.array(n)
            path[i] = np.array(loc) + n * (ease_k + 0.0022)
            vis[i] = jac_bvh.ray_cast(Vector(path[i] + n * 1e-4), Vector(n), 0.03)[0] is None
        from scipy.ndimage import binary_dilation
        keep = vis.copy()
        idx = np.nonzero(keep)[0]
        path = path[idx[0]:idx[-1] + 1] if len(idx) else path[:0]
        # where the remaining ends run under the jacket, pull them inside it (tube radius + 3 mm)
        for i in range(len(path)):
            loc, n, _, _ = skin_bvh.find_nearest(Vector(path[i]))
            n = np.array(n)
            hit = jac_bvh.ray_cast(Vector(path[i] + n * 1e-4), Vector(n), 0.03)
            if hit[0] is not None:
                s_ = (path[i] - np.array(hit[0])) @ n
                path[i] = path[i] - n * max(0.0, s_ + 0.0052)
        if len(path) > 3:
            piping = _tube("g_piping", path, 0.0022, 8, ACC_PATCH["piping"])
        report.setdefault("garmentV3", {})["pipingPts"] = int(len(path))

    # ------------------------------------------------ collar: stand + fall from the jacket neckline loop
    Q = co(jac.data)
    _, bndJ, _ = _adjacency(jac.data)
    thJ = np.arctan2(Q[:, 0] - ctr[0], -(Q[:, 1] - ctr[1]))
    zcJ = base + 0.006 - 0.03 * np.clip(np.cos(thJ), 0, 1) ** 2
    nsel = bndJ & (Q[:, 2] > zcJ - 0.016) & (np.abs(Q[:, 0]) < x_arm - 0.02)
    loopJ = _ordered_loop(jac, nsel)
    collar = None
    if len(loopJ) > 8:
        L0 = Q[loopJ]
        phi = (np.arctan2(L0[:, 0] - ctr[0], -(L0[:, 1] - ctr[1])) + 2 * math.pi) % (2 * math.pi)
        order = np.argsort(phi)
        L0 = L0[order]
        phi = phi[order]
        for _ in range(4):
            L0[1:-1] = 0.25 * L0[:-2] + 0.5 * L0[1:-1] + 0.25 * L0[2:]
        # resample evenly
        sl = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(L0, axis=0), axis=1))])
        nU = 48
        su = np.linspace(0, sl[-1], nU)
        L = np.stack([np.interp(su, sl, L0[:, k]) for k in range(3)], 1)
        ph = np.interp(su, sl, phi)
        back = 0.5 - 0.5 * np.cos(ph)                    # 1 at the back of the neck, 0 at the front ends
        hs = 0.011 + 0.011 * back                         # stand height
        hf = 0.040 + 0.012 * (1 - back) ** 2               # fall width (pointed at the front)
        neck_ax = np.array([0.0, J["joint-neck"][1], 0.0])
        prof = []
        for i in range(nU):
            radial = L[i] - np.array([0, ctr[1], L[i, 2]]) * np.array([0, 1, 1]) - np.array([0, 0, 0])
            radial = np.array([L[i, 0], L[i, 1] - ctr[1], 0.0])
            radial /= max(np.linalg.norm(radial), 1e-9)
            up = np.array([0, 0, 1.0]) - radial * 0.18
            up /= np.linalg.norm(up)
            # the stand is sewn OVER the jacket neckline: its base starts 6 mm below the neckline, 1.5 mm outside it,
            # so the jacket edge sits inside the collar (penetration gate jacket -> collar)
            locj, nj, _, _ = jac_bvh.find_nearest(Vector(L[i]))
            nj = np.array(nj)
            if nj @ radial < 0 and nj[2] < 0:
                nj = -nj
            away = (radial - np.array([0, 0, 1.0])) - nj * ((radial - np.array([0, 0, 1.0])) @ nj)
            away /= max(np.linalg.norm(away), 1e-9)
            b0 = L[i] + nj * 0.0018 + away * 0.007
            top = L[i] + up * hs[i] + radial * 0.0035
            pts = [b0, b0 + up * hs[i] * 0.55 + radial * 0.0008, top,
                   top + radial * 0.0055 - up * hf[i] * 0.35,
                   top + radial * 0.0105 - up * hf[i] * 0.72,
                   top + radial * 0.0140 - up * hf[i] * 1.0 + np.array([0, 0, 0]) * 0]
            # pointed tips: the front ends of the fall swing forward and down
            if back[i] < 0.12:
                k = (0.12 - back[i]) / 0.12
                pts[-1] = pts[-1] + np.array([0, -0.012, -0.012]) * k
                pts[-2] = pts[-2] + np.array([0, -0.006, -0.006]) * k
            prof.append(pts)
        G = np.array(prof)                               # (nU, 6, 3)
        # the fall (profile points 3..5) lies >= 2.5 mm outside the jacket and >= 4 mm off the neck
        for it in range(6):
            for i in range(nU):
                for j in range(1, 6):
                    cons = [(skin_bvh, 0.004)] + ([(jac_bvh, 0.0025)] if j >= 3 else [])
                    for bvh, ease in cons:
                        loc, n, _, d = bvh.find_nearest(Vector(G[i, j]), 0.03)
                        if loc is None:
                            continue
                        n = np.array(n)
                        s = (G[i, j] - np.array(loc)) @ n
                        if s < ease:
                            G[i, j] += n * (ease - s)
            G[1:-1] = 0.25 * G[:-2] + 0.5 * G[1:-1] + 0.25 * G[2:]
        collar = _grid("g_collar", G, (0.02, 0.72, 0.60, 0.98))
        report.setdefault("garmentV3", {})["collarLoopPts"] = int(len(loopJ))

    # ------------------------------------------------ chest-pocket flaps + buttons (conformed to the jacket)
    flaps, buttons = [], []
    zp = z_clav - gv.get("pocketDrop", 0.048)
    for sg in (1, -1):
        thc = sg * gv.get("pocketThetaDeg", 40) * math.pi / 180
        rr = 0.3
        c0 = np.array([math.sin(thc) * rr, ctr[1] - math.cos(thc) * rr, zp])
        hit = jac_bvh.ray_cast(Vector(c0), Vector(np.array([0, ctr[1], zp]) - c0).normalized(), 0.5)
        report.setdefault("garmentV3", {}).setdefault("pocket", []).append(None if hit[0] is None else [round(x, 4) for x in hit[0]])
        if hit[0] is None:
            continue
        cpt, cn = np.array(hit[0]), np.array(hit[1])
        if cn @ (c0 - cpt) < 0:
            cn = -cn
        right = np.cross([0, 0, 1.0], cn)
        right /= np.linalg.norm(right)
        upv = np.cross(cn, right)
        W_, H_ = 0.085, 0.042
        nu, nv = 9, 5
        G = np.zeros((nu, nv, 3))
        for i in range(nu):
            for j in range(nv):
                x = (i / (nu - 1) - 0.5) * W_
                tt = j / (nv - 1)
                # pentagon: straight top, sides, a point at the bottom centre
                yb = -H_ * (0.62 + 0.38 * (1 - abs(x) / (W_ / 2)))
                y = tt * 0 + (1 - tt) * yb
                q = cpt + right * x + upv * (y + H_ * 0.5)
                loc, n, _, _ = jac_bvh.find_nearest(Vector(q))
                G[i, j] = np.array(loc) + np.array(n) * 0.0028
        fl = _grid(f"g_flap{sg}", G, (0.62 + (0.0 if sg > 0 else 0.13), 0.74, 0.74 + (0.0 if sg > 0 else 0.13), 0.96))
        flaps.append(fl)
        tip = G[nu // 2, 0]
        buttons.append((tip + upv * 0.006 + cn * 0.0012, cn))
    # front buttons on her left edge (visible in the bust frame) at two heights
    for zz in (z_clav - 0.02, z_clav - 0.10):
        sel = np.nonzero(open_edge)[0]
        Qe = co(jac.data)
        cand = sel[(Qe[sel, 0] > 0)]
        if not len(cand):
            continue
        k = cand[np.argmin(np.abs(Qe[cand, 2] - zz))]
        loc, n, _, _ = jac_bvh.find_nearest(Vector(Qe[k]))
        n = np.array(n)
        if n[1] > 0:
            n = -n
        tdir = np.array([1.0, 0, 0])
        buttons.append((np.array(loc) + n * 0.0012 + tdir * 0.012, n))
    bobjs = []
    for pc, n in buttons:
        bm = bmesh.new()
        r = bmesh.ops.create_cone(bm, cap_ends=True, segments=12, radius1=0.0065, radius2=0.0055, depth=0.0026)
        ob = bpy.data.objects.new("g_button", bpy.data.meshes.new("g_button"))
        bm.to_mesh(ob.data)
        bm.free()
        bpy.context.collection.objects.link(ob)
        # orient +z to n
        from mathutils import Vector as V_
        q = V_((0, 0, 1)).rotation_difference(V_(n))
        Pb = co(ob.data)
        Pb = np.array([np.array(q @ V_(p)) for p in Pb]) + pc + n * 0.0013
        ob.data.vertices.foreach_set("co", Pb.ravel())
        ob.data.update()
        P0._uv_patch(ob, ACC_PATCH["copper"])
        bobjs.append(ob)

    # ------------------------------------------------ rolled edges, UVs, attributes
    # only the edges you can see are rolled: the kurti neckline (its crop edges lie under the jacket), the jacket's
    # neckline and front edges (not the frame cuts at the hem and the arms)
    _roll(kur, 0.0025, lambda p: p[2] > z_clav - 0.09 and abs(p[0]) < 0.075)
    def _zcj(p):
        t_ = math.atan2(p[0] - ctr[0], -(p[1] - ctr[1]))
        return base + 0.006 - 0.03 * max(0.0, math.cos(t_)) ** 2
    # the jacket neckline is inside the collar: only the front opening edges are rolled
    _roll(jac, 0.0035, lambda p: zmin + 0.012 < p[2] < _zcj(p) - 0.012 and abs(p[0]) < x_arm - 0.012)
    if collar is not None:
        P0._rolled_edge(collar, 0.0025, -1.0)
    for fl in flaps:
        P0._rolled_edge(fl, 0.0022, -1.0)
    zs = (zmin, z_clav + 0.09)
    _cyl_uv(kur, ctr, 0.02, 0.30, *zs)
    _cyl_uv(jac, ctr, 0.32, 0.70, *zs)
    parts_ = [(kur, 0, 0), (jac, 1, 0)]
    if collar is not None:
        parts_.append((collar, 1, 2))
    parts_ += [(f, 1, 3) for f in flaps]
    for ob, layer, part in parts_:
        dist, _ = P0._edge_distance(ob)
        if part == 0 and layer == 1:
            # placket marker: distance to the front opening edge drives the double topstitch in texture.py
            Qj = co(ob.data)
            dd, _ = cKDTree(Q[open_edge]).query(Qj) if open_edge.any() else (np.full(len(Qj), 1.0), None)
            _attr(ob, "gPlacket", dd)
        _attr(ob, "gEdge", np.minimum(dist, 0.2))
        _attr(ob, "gLayer", np.full(len(ob.data.vertices), layer))
        _attr(ob, "gPart", np.full(len(ob.data.vertices), part))
        if part != 0:
            _attr(ob, "gOwnUV", np.ones(len(ob.data.vertices)))
        out.append(ob)
    if piping is not None:
        for nm, v in (("gEdge", 0.2), ("gLayer", 2), ("gPart", 4), ("gOwnUV", 1)):
            _attr(piping, nm, np.full(len(piping.data.vertices), v))
        out.append(piping)
    for ob in bobjs:
        for nm, v in (("gEdge", 0.2), ("gLayer", 2), ("gPart", 5), ("gOwnUV", 1)):
            _attr(ob, nm, np.full(len(ob.data.vertices), v))
        out.append(ob)
    for ob in out:
        if "gPlacket" not in ob.data.attributes:
            _attr(ob, "gPlacket", np.full(len(ob.data.vertices), 1.0))

    # ------------------------------------------------ delete the skin the garments cover (keep a 1.5 cm skirt)
    under = Pk[:, 2] < (np.minimum(z_col, z_colJ + 0.0) - 0.015)
    # behind the open front the kurti covers; elsewhere the jacket does: the skirt is relative to whichever is lower
    delete_verts(skin, under)

    # ------------------------------------------------ penetration gate (all must be 0; build_look fails otherwise)
    W = {}
    for it in range(3):
        Wd = {}
        if penetration(skin, jac, 0.03, Wd) == 0:
            break
        bad = np.array(Wd[skin.name + ">" + jac.name])
        Ps = co(skin.data)
        kill = np.zeros(len(Ps), bool)
        for b in bad:
            kill |= np.linalg.norm(Ps - b, axis=1) < 1e-6
        # the gate lists at most 12 positions: recompute the full set by brute force on the last pass
        delete_verts(skin, kill)
        report.setdefault("garmentV3", {})["skinSkirtDeleted"] = int(kill.sum()) + report.get("garmentV3", {}).get("skinSkirtDeleted", 0)
    # resolve the residue: an under-layer vertex that still sits outside its over-layer (seam corners) moves inward
    # along its own normal by 3 mm per pass, at most 4 passes; the gate below then counts what is left
    def _resolve(under, over, reach):
        for _ in range(4):
            Wd = {}
            if penetration(under, over, reach, Wd) == 0:
                return
            bad = np.array(Wd[under.name + ">" + over.name])
            Pu = co(under.data)
            Nu = np.empty(len(Pu) * 3)
            under.data.vertices.foreach_get("normal", Nu)
            Nu = Nu.reshape(-1, 3)
            for b in bad:
                i = int(np.argmin(np.linalg.norm(Pu - b, axis=1)))
                Pu[i] -= Nu[i] * 0.003
            under.data.vertices.foreach_set("co", Pu.ravel())
            under.data.update()
    _resolve(kur, jac, 0.03)
    if collar is not None:
        _resolve(jac, collar, 0.02)
    if piping is not None:
        _resolve(piping, jac, 0.02)
    pen = {
        "kurtiThroughJacket": penetration(kur, jac, 0.03, W),
        "skinThroughKurti": penetration(skin, kur, 0.02, W),
        "skinThroughJacket": penetration(skin, jac, 0.03, W),
        "jacketThroughCollar": penetration(jac, collar, 0.02, W) if collar is not None else 0,
        "pipingThroughJacket": penetration(piping, jac, 0.02, W) if piping is not None else 0,
    }
    report.setdefault("garmentV3", {})["penetrationWhere"] = W
    report.setdefault("garmentV3", {})["penetration"] = pen
    report["garment"] = {"kind": "kurti-jacket (v3 modelled)", "collarBaseZ": float(base)}
    return out, pen
