"""gnm round 3: short-curl hair for slate (the Arjun design), generated as strands and converted to cards.

His reference has short, dense coils (~1.5 cm on top, under 1 cm at the sides); the iteration-2 build carried a straight
glossy helmet. This module replaces it, in GNM's world frame, with:
  1. a hair REGION on GNM's scalp: the vertices whose projected albedo is hair-dark (the portraits' own hairline), minus
     the brows / face, with a height field (top 15 mm, sides 9 mm, nape 6 mm) that tapers to 2 mm at the hairline;
  2. two scalp-conforming SHELLS (inner 40 % of the height, nearly opaque; outer 100 %, an alpha coil texture), simplified
     with meshoptimizer: the volume of the curls without thousands of cards;
  3. STRANDS: helical coils grown from area-sampled roots along the normal with a slight back-and-down comb, CLUMPED
     (k-means on the roots) and each clump converted to ONE card along its mean centreline, width = its spread + the
     coil diameter: the fuzzy silhouette and the break-up over the shells;
  4. a procedural ATLAS (2048 x 1024): u 0-0.5 the shell coil field (rows 0-0.88) and an opaque inner strip (0.9-1.0),
     u 0.5-1 four clump tiles of coiled strands (root at v 0).
Everything is skinned to Head (joint 2) only. H: ~2.5k card tris + 2 x ~1.4k shell tris; B+: ~0.5k + 2 x ~450.
"""
import numpy as np
from PIL import Image, ImageDraw
from scipy.spatial import cKDTree

HEAD_J = 2


def _vnormals(P, F):
    n = np.zeros_like(P)
    fn = np.cross(P[F[:, 1]] - P[F[:, 0]], P[F[:, 2]] - P[F[:, 0]])
    for c in range(3):
        np.add.at(n, F[:, c], fn)
    return n / np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-12)


def atlas(path, hair_srgb, seed=7):
    """The procedural curl atlas (sRGB RGBA, 2048 x 1024)."""
    rng = np.random.default_rng(seed)
    W, H = 2048, 1024
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    base = np.array(hair_srgb) * 255

    def col(k=1.0):
        c = np.clip(base * k * rng.uniform(0.75, 1.35) + rng.normal(0, 4, 3), 0, 255)
        return tuple(int(x) for x in c) + (255,)

    # shell coil field: small spirals, ~80 % coverage
    for _ in range(42000):
        cx, cy = rng.uniform(0, 1024), rng.uniform(0, 0.88 * H)
        r = rng.uniform(3, 8); turns = rng.uniform(1.0, 1.8); ph = rng.uniform(0, 2 * np.pi)
        t = np.linspace(0, turns * 2 * np.pi, 18)
        rr = r * (0.55 + 0.45 * t / t[-1])
        pts = [(cx + rr[i] * np.cos(t[i] + ph), cy + 0.8 * rr[i] * np.sin(t[i] + ph)) for i in range(len(t))]
        d.line(pts, fill=col(rng.choice([0.85, 1.0, 1.0, 1.25])), width=int(rng.choice([2, 3, 3])))
    # inner strip: opaque, a darker coil field on a solid base
    d.rectangle([0, int(0.9 * H), 1023, H - 1], fill=col(0.7))
    for _ in range(3000):
        cx, cy = rng.uniform(0, 1024), rng.uniform(0.9 * H, H)
        r = rng.uniform(2, 5)
        d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=col(1.2), width=1)
    # clump tiles: 4 x (256 x 1024), coiled strands from the root (row 0) fanning slightly to the tip
    for k in range(4):
        x0 = 1024 + 256 * k
        for s in range(16):
            ln = rng.uniform(0.7, 0.98) * H
            amp = rng.uniform(7, 13); per = rng.uniform(38, 62); ph = rng.uniform(0, 2 * np.pi)
            xc = x0 + 128 + rng.normal(0, 18)
            spread = rng.normal(0, 30)
            y = np.linspace(0, ln, 120)
            x = xc + spread * (y / H) + amp * np.sin(2 * np.pi * y / per + ph)
            c = col(rng.choice([0.85, 1.0, 1.0, 1.5]))
            pts = list(zip(x, y))
            d.line(pts, fill=c, width=int(rng.choice([3, 4, 4])))
    a = np.array(img).astype(np.float32)
    # tips fade (alpha) in the clump tiles
    fade = np.clip((H - np.arange(H)) / (0.15 * H), 0, 1)[:, None]
    a[:, 1024:, 3] *= fade
    Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), "RGBA").save(path)


def build(Vw, F, Nv, uvA, hair_mask, eye_c, tier, simplify, compact, seed=3):
    """Vw (V,3) GNM world positions (all GNM verts), F skin tris (GNM idx), Nv vertex normals, uvA (V,2) albedo uv of
    each vertex (for the shell uv), hair_mask (V,) 0..1, eye_c the mid-eye world point. simplify/compact: assemble's."""
    rng = np.random.default_rng(seed)
    ey, ez = eye_c[1], eye_c[2]
    P = Vw
    face_zone = ((P[:, 2] > ez - 0.035) & (P[:, 1] < ey + 0.05)) | ((P[:, 2] > ez - 0.08) & (P[:, 1] < ey + 0.03))   # brows, face, sideburns stay painted
    reg = (hair_mask > 0.5) & (P[:, 1] > ey - 0.06) & ~face_zone
    # keep the largest connected patch (drop stubble / stray dark texels)
    Ft = F[reg[F].all(1)]
    # height field: top 15 mm, sides 9, nape 6; tapering to 2 mm over 1.2 cm from the region boundary
    top = np.clip((P[:, 1] - (ey + 0.02)) / 0.08, 0, 1)
    back = np.clip((ez - 0.06 - P[:, 2]) / 0.08, 0, 1) * np.clip((ey + 0.02 - P[:, 1]) / 0.06, 0, 1)
    h = 0.009 + 0.006 * top - 0.003 * back
    edge = np.zeros(len(P), bool)
    from collections import Counter
    ec = Counter(tuple(sorted(e)) for t in Ft for e in ((t[0], t[1]), (t[1], t[2]), (t[2], t[0])))
    for (a_, b_), n in ec.items():
        if n == 1:
            edge[a_] = edge[b_] = True
    bd = cKDTree(P[edge]).query(P)[0] if edge.any() else np.full(len(P), 1.0)
    h = 0.002 + (h - 0.002) * np.clip(bd / 0.012, 0, 1)
    used = np.unique(Ft)
    remap = -np.ones(len(P), int); remap[used] = np.arange(len(used))
    Fl = remap[Ft]
    Pu, Nu, hu = P[used], Nv[used], h[used]
    # shell uv: the albedo uv of the scalp, bbox-fitted into the shell field / inner strip
    uv = uvA[used]
    lo, hi = uv.min(0), uv.max(0)
    q = (uv - lo) / np.maximum(hi - lo, 1e-6)
    tgt = {"H": 1400, "Bplus": 450}.get(tier, 450)
    parts = []
    for frac, vrange, nm in ((0.4, (0.905, 0.995), "inner"), (1.0, (0.01, 0.87), "outer")):
        Ps = Pu + Nu * (hu * frac)[:, None]
        uvs = np.stack([0.005 + 0.49 * q[:, 0], vrange[0] + (vrange[1] - vrange[0]) * q[:, 1]], 1)
        m = {"POSITION": Ps, "idx": Fl.copy()}
        if len(Fl) > tgt:
            simplify(m, np.ones(len(Fl), bool), tgt, np.zeros(len(Ps), bool), err=0.05)
        keep = np.unique(m["idx"])
        rm = -np.ones(len(Ps), int); rm[keep] = np.arange(len(keep))
        comb = np.array([0.0, -0.6, -0.8]); comb /= np.linalg.norm(comb)
        # coils have no coherent strand direction: a random tangent per vertex breaks the shifted highlight into
        # sparse glints instead of a glossy helmet sheen
        rnd = rng.normal(size=(len(keep), 3))
        st = rnd - Nu[keep] * (Nu[keep] * rnd).sum(1)[:, None]
        st /= np.maximum(np.linalg.norm(st, axis=1, keepdims=True), 1e-9)
        parts.append({"POSITION": Ps[keep], "TEXCOORD_0": uvs[keep], "_STRAND": st, "idx": rm[m["idx"]]})
    # strands -> clumps -> cards
    nstr, ncl = {"H": (5000, 620), "Bplus": (1600, 130)}.get(tier, (1600, 130))
    tri_a = 0.5 * np.linalg.norm(np.cross(Pu[Fl[:, 1]] - Pu[Fl[:, 0]], Pu[Fl[:, 2]] - Pu[Fl[:, 0]]), axis=1)
    ti = rng.choice(len(Fl), nstr, p=tri_a / tri_a.sum())
    bw = rng.dirichlet([1, 1, 1], nstr)
    R0 = (bw[:, :, None] * Pu[Fl[ti]]).sum(1)
    N0 = (bw[:, :, None] * Nu[Fl[ti]]).sum(1); N0 /= np.linalg.norm(N0, axis=1, keepdims=True)
    H0 = (bw * hu[Fl[ti]]).sum(1)
    comb = np.array([0.0, -0.5, -0.85]); comb /= np.linalg.norm(comb)
    ns = 8
    t = np.linspace(0, 1, ns)
    L = H0 * rng.uniform(1.1, 1.5, nstr) + 0.003
    dirv = N0 * 0.85 + (comb - N0 * (N0 @ comb)[:, None]) * 0.35
    dirv /= np.linalg.norm(dirv, axis=1, keepdims=True)
    u1 = np.cross(dirv, np.array([0.31, 0.89, 0.33])); u1 /= np.linalg.norm(u1, axis=1, keepdims=True)
    u2 = np.cross(dirv, u1)
    rad = rng.uniform(0.0015, 0.0026, nstr); ph = rng.uniform(0, 2 * np.pi, nstr); turns = L / rng.uniform(0.0035, 0.005, nstr)
    ang = ph[:, None] + 2 * np.pi * turns[:, None] * t[None]
    S = (R0[:, None] + dirv[:, None] * (L[:, None] * t[None])[..., None]
         + rad[:, None, None] * (np.cos(ang)[..., None] * u1[:, None] + np.sin(ang)[..., None] * u2[:, None]))
    # k-means on roots
    C = R0[rng.choice(nstr, ncl, replace=False)]
    for _ in range(12):
        lab = cKDTree(C).query(R0)[1]
        for k in range(ncl):
            mk = lab == k
            if mk.any():
                C[k] = R0[mk].mean(0)
    lab = cKDTree(C).query(R0)[1]
    CP, CU, CS, CI = [], [], [], []
    rows = 3
    for k in range(ncl):
        mk = lab == k
        if mk.sum() < 2:
            continue
        cl = S[mk]
        cen = cl.mean(0)                                        # (ns, 3) clump centreline
        cen = cen[np.linspace(0, ns - 1, rows).astype(int)]
        sp = np.sqrt(((cl - cl.mean(0)[None]) ** 2).sum(-1).mean())
        w = float(np.clip(2 * sp + 0.005, 0.006, 0.013))
        dv = cen[-1] - cen[0]; dv /= max(np.linalg.norm(dv), 1e-9)
        nrm = N0[mk].mean(0); nrm /= np.linalg.norm(nrm)
        side = np.cross(dv, nrm)
        if np.linalg.norm(side) < 0.3:
            side = np.cross(dv, rng.normal(size=3))
        side /= np.linalg.norm(side)
        side = side * np.cos(rng.uniform(-0.6, 0.6)) + np.cross(dv, side) * np.sin(rng.uniform(-0.6, 0.6))
        tile = rng.integers(4)
        u0, u1_ = 0.5 + 0.125 * tile + 0.004, 0.5 + 0.125 * (tile + 1) - 0.004
        base = len(CP) * 0 + sum(len(x) for x in CP)
        pts, uvs = [], []
        for r_ in range(rows):
            ww = w * (1.0 - 0.25 * r_ / (rows - 1))
            pts += [cen[r_] - side * ww / 2, cen[r_] + side * ww / 2]
            v = r_ / (rows - 1)
            uvs += [(u0, v), (u1_, v)]
        idx = []
        for r_ in range(rows - 1):
            a_ = base + 2 * r_
            idx += [(a_, a_ + 1, a_ + 3), (a_, a_ + 3, a_ + 2)]
        CP.append(np.array(pts)); CU.append(np.array(uvs)); CS.append(np.repeat(dv[None], 2 * rows, 0)); CI.append(np.array(idx))
    parts.append({"POSITION": np.vstack(CP), "TEXCOORD_0": np.vstack(CU), "_STRAND": np.vstack(CS), "idx": np.vstack(CI)})
    # merge
    Pm, Um, Sm, Im = [], [], [], []
    off = 0
    for p in parts:
        Pm.append(p["POSITION"]); Um.append(p["TEXCOORD_0"]); Sm.append(p["_STRAND"]); Im.append(p["idx"] + off); off += len(p["POSITION"])
    Pm = np.vstack(Pm)
    J = np.zeros((len(Pm), 4), int); J[:, 0] = HEAD_J
    Wt = np.zeros((len(Pm), 4)); Wt[:, 0] = 1
    hair = {"POSITION": Pm, "TEXCOORD_0": np.vstack(Um), "_STRAND": np.vstack(Sm).astype(np.float32), "JOINTS_0": J, "WEIGHTS_0": Wt,
            "idx": np.vstack(Im), "extras": {"taxilaHair": {"kk": 0.07}}}
    info = {"regionVerts": int(reg.sum()), "strands": int(nstr), "clumps": int(len(CP)), "cardTris": int(sum(len(x) for x in CI)),
            "shellTris": [int(len(p["idx"])) for p in parts[:2]], "heightMM": [round(float(hu.min() * 1000), 1), round(float(hu.max() * 1000), 1)]}
    return hair, info
