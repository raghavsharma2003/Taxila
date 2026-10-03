"""E-GNM1 step 4 (geometry): assemble the GNM teal into the runtime contract (CHARACTER-PIPELINE 4) for H and B+.

face    = GNM skin + teeth/gums + tongue + mouth sock (GNM's own anatomy, one mesh, _region 0 skin / 1 teeth (+ gum
          weight in the fraction, from GNM's `gums` group) / 2 tongue / 3 mouth sock = the bag), keys from keys.py,
          + procedural-v3's bust below the neck (shoulders and the kurti neckline skin) joined by a bridge strip at GNM's
          neck boundary; the v3 neck is blended radially onto GNM's boundary over a 5 cm band (weights too)
eyes    = the contract's eye mesh (procedural-v3's ball + cornea bulge, which TaxilaEye's analytic iris expects) scaled
          to GNM's fitted eyeball (sphere fit of GNM's sclera vertices) and centred on GNM's eye joints; the LeftEye /
          RightEye bones move to those centres
hair, cards (lashes; H brows), garment = procedural-v3's own generators' output (hair_v3 strand cards, garments_v3
          kurti), carried onto the GNM head by corr.py's displacement field (inverse-distance over the nearest v3 scalp
          vertices), pushed out of the GNM skin where they would sink in; card morphs copy the nearest GNM vertex's keys
Placement: GNM keeps its metric size (the fit's scale); it is rotated into v3's frame and translated so GNM's eye-joint
midpoint sits on v3's eye-bone midpoint, so the armature, the camera framings and the body are v3's.
Writes $CHAR_HOME/bakeoff-gnm/teal/{H,Bplus}/scene.json + bins (for write_glb.mjs) and assemble.json.
    python assemble.py [--tier H,Bplus] [--no-brows]"""
import argparse, json, os, subprocess, time, tempfile
import numpy as np
from scipy.spatial import cKDTree
import gnm_model as G
import v3data, geom

ap = argparse.ArgumentParser()
ap.add_argument("--tier", default="H,Bplus")
ap.add_argument("--brows", action="store_true", help="keep v3's brow cards at H (default off: the projected brows carry them)")
a = ap.parse_args()
t0 = time.time()
BD = os.path.join(G.CH, "bakeoff-gnm", "teal")
m = G.GNM()
fit = json.load(open(os.path.join(G.ART, "fit", "teal.json")))
cid = np.array(fit["identity"])
K = np.load(os.path.join(BD, "keys.npz"))
KN = [str(x) for x in K["names"]]
V0 = K["V0"].astype(np.float64)
KD = K["deltas"].astype(np.float64)
C = np.load(os.path.join(BD, "corr.npz"))
J = m.joints(cid)
JOINTS = ["Spine2", "Neck", "Head", "LeftEye", "RightEye", "LeftShoulder", "RightShoulder"]
rep = {"method": __doc__.split("\n")[0], "date": time.strftime("%Y-%m-%d")}

# ---------------------------------------------------------------- placement GNM -> world (v3 armature frame)
M3H, B3 = v3data.load(os.path.join(G.CH, "bakeoff-gnm", "v3dump", "H"))
R_pl = C["R"].T
eye_w3 = 0.5 * (B3["LeftEye"]["world"][:3, 3] + B3["RightEye"]["world"][:3, 3])
t_w = eye_w3 - R_pl @ (0.5 * (J[2] + J[3]))
W = lambda X: X @ R_pl.T + t_w
Winv = lambda Y: (Y - t_w) @ R_pl
rep["placement"] = {"R": R_pl.round(5).tolist(), "t": t_w.round(5).tolist(), "scale": 1.0,
                    "note": "GNM keeps its fitted metric size; v3 head was %.3fx smaller by landmark similarity" % (1 / float(C["s"]))}
V0w = W(V0)
KDw = KD @ R_pl.T                                           # deltas rotate with the placement

# ---------------------------------------------------------------- GNM face part, split at UV seams
inc = m.group("skin") | m.group("teeth") | m.group("gums") | m.group("tongue")
inc &= ~m.group("eyes")
Fm = m.tri[inc[m.tri].all(1)]
UVm = m.tri_uv[inc[m.tri].all(1)]                            # (T, 3, 2) GNM convention (v up)
key = {}
src, uvs, Fg = [], [], np.zeros_like(Fm)
for ti in range(len(Fm)):
    for c in range(3):
        k = (int(Fm[ti, c]), round(float(UVm[ti, c, 0]), 6), round(float(UVm[ti, c, 1]), 6))
        if k not in key:
            key[k] = len(src); src.append(k[0]); uvs.append((k[1], k[2]))
        Fg[ti, c] = key[k]
src = np.array(src); uvs = np.array(uvs)
# UV pack: GNM's single head chart into [0, 0.85]^2 (glTF v down), the bust chart in the bottom strip, the bridge on the right
uv_g = np.stack([0.85 * uvs[:, 0], 0.15 + 0.85 * (1 - uvs[:, 1])], 1)
nG = len(src)
gw = np.zeros((nG, 4)); gj = np.zeros((nG, 4), int)
gj[:, 0], gj[:, 1] = 1, 2                                    # Neck, Head
gw[:, 0], gw[:, 1] = m.W[0, src], m.W[1, src]
gw /= gw.sum(1, keepdims=True)
region = np.zeros(nG)
region[m.group("teeth")[src] | m.group("gums")[src]] = 1.0
_gm = m.group("gums")[src]
region[_gm] = 1.0 + 0.45 * np.clip(m.G[m.gnames.index("gums"), src[_gm]], 0, 1)
region[m.group("tongue")[src]] = 2.0
region[m.group("mouth_sock")[src]] = 3.0
# the inner lips (two vertex rings of skin next to the mouth sock that face into the mouth, n.z < 0.3) shade as mouth
# interior too: projected portrait texels there were never seen and read as a pale, lit band in every open viseme
_sk = m.group("mouth_sock")
_r1 = np.zeros(m.V, bool); _r1[m.tri[_sk[m.tri].any(1)].ravel()] = True
_r2 = np.zeros(m.V, bool); _r2[m.tri[_r1[m.tri].any(1)].ravel()] = True
_nv = np.zeros_like(V0); _fn = np.cross(V0[m.tri[:, 1]] - V0[m.tri[:, 0]], V0[m.tri[:, 2]] - V0[m.tri[:, 0]])
for _c in range(3):
    np.add.at(_nv, m.tri[:, _c], _fn)
_nv /= np.maximum(np.linalg.norm(_nv, axis=1, keepdims=True), 1e-12)
_inner_lip = _r2 & ~_sk & m.group("skin") & (_nv[:, 2] < 0.3)
region[_inner_lip[src]] = 3.0
rep["innerLipAsInterior"] = int(_inner_lip.sum())
rep["gnmFace"] = {"verts": int(nG), "tris": int(len(Fg)), "seamDuplicates": int(nG - len(np.unique(src)))}

# ---------------------------------------------------------------- the GNM neck boundary (world)
skin_v = m.group("skin")
Fs = m.tri[skin_v[m.tri].all(1) & inc[m.tri].all(1)]
from collections import Counter, defaultdict
ec = Counter(tuple(sorted(e)) for t in Fs for e in ((t[0], t[1]), (t[1], t[2]), (t[2], t[0])))
bedges = [e for e, n in ec.items() if n == 1]
adj = defaultdict(list)
for i, j in bedges:
    adj[i].append(j); adj[j].append(i)
# the neck loop = the boundary component with the lowest vertex
comp, seen = [], set()
for v0 in adj:
    if v0 in seen:
        continue
    loop, prev, cur = [v0], None, v0
    seen.add(v0)
    while True:
        nx = [u for u in adj[cur] if u != prev and u not in seen]
        if not nx:
            break
        prev, cur = cur, nx[0]; loop.append(cur); seen.add(cur)
    comp.append(loop)
neck = min(comp, key=lambda L: V0[L][:, 1].min())
neck = np.array(neck)
NB = V0w[neck]
axis_c = NB[:, [0, 2]].mean(0)
th = lambda P: np.arctan2(P[:, 0] - axis_c[0], P[:, 2] - axis_c[1])
rad = lambda P: np.hypot(P[:, 0] - axis_c[0], P[:, 2] - axis_c[1])
o = np.argsort(th(NB))
nb_th, nb_y, nb_r = th(NB)[o], NB[o, 1], rad(NB)[o]
per = lambda q, xs, ys: np.interp(q, np.r_[xs - 2 * np.pi, xs, xs + 2 * np.pi], np.r_[ys, ys, ys])
rep["neckLoop"] = {"verts": int(len(neck)), "yRange": [round(float(NB[:, 1].min()), 4), round(float(NB[:, 1].max()), 4)]}

# ---------------------------------------------------------------- v3 head field (for hair, cards)
F3 = M3H["face"]
reg3 = np.round(F3["_REGION"]).astype(int)
P3 = F3["POSITION"].astype(np.float64)
head3 = C["head3"]
Wp = C["Wp"]
D_head = W(Wp[head3]) - P3[head3]
head_tree = cKDTree(P3[head3])


def field(X, k=8):
    d, j = head_tree.query(X, k=k)
    w = 1 / np.maximum(d, 1e-4) ** 2
    return X + (w[:, :, None] * D_head[j]).sum(1) / w.sum(1, keepdims=True)


def field_body(X):
    """The kurti collar follows the head field near the neck top, fading to the unchanged body 4 cm lower."""
    Y = field(X)
    f = np.clip((X[:, 1] - (NB[:, 1].min() + 0.03)) / 0.06, 0, 1)
    return X + (Y - X) * f[:, None]


# ---------------------------------------------------------------- v3 bust below the neck, blended onto GNM
GAP, BAND = 0.006, 0.05


def neck_blend(X, r_v3_cut_fn):
    """Radial blend of v3 geometry onto GNM's neck boundary radius, f = 1 at the cut height, 0 one band lower."""
    t, r = th(X), rad(X)
    hcut = per(t, nb_th, nb_y) - GAP
    f = np.clip((X[:, 1] - (hcut - BAND)) / BAND, 0, 1)
    f = f * f * (3 - 2 * f)
    f[X[:, 1] > hcut + 0.02] = 0
    dr = (per(t, nb_th, nb_r) - r_v3_cut_fn(t)) * f
    Y = X.copy()
    Y[:, 0] += dr * np.sin(t); Y[:, 2] += dr * np.cos(t)
    return Y, f


def bust_part(F3t):
    P = F3t["POSITION"].astype(np.float64)
    rg = np.round(F3t["_REGION"]).astype(int)
    t = th(P)
    keep = (rg == 0) & (P[:, 1] < per(t, nb_th, nb_y) - GAP)
    # the head itself never: anything above the chin height in front is the v3 face (GNM replaces it)
    keep &= ~((P[:, 1] > NB[:, 1].max()) & (rad(P) < 0.2))
    tri = F3t["idx"][keep[F3t["idx"]].all(1)]
    # the cut loop = boundary edges of the kept part near the neck
    ec = Counter(tuple(sorted(e)) for tt in tri for e in ((tt[0], tt[1]), (tt[1], tt[2]), (tt[2], tt[0])))
    be = np.array([e for e, n in ec.items() if n == 1]).reshape(-1, 2)
    for q in (0, 0.5, 1.5, 3.0, -1.5):
        print("  h_b(th=%.1f) = %.3f r %.3f" % (q, per(np.array([q]), nb_th, nb_y)[0], per(np.array([q]), nb_th, nb_r)[0]))
    fr = (rg == 0) & (P[:, 1] < 1.31)
    print("  v3 low skin th", np.round(th(P[fr])[:10], 2), "y", np.round(P[fr][:10, 1], 3), "axis", axis_c)
    print(f"[assemble] bust: keep {int(keep.sum())} of {len(keep)}, tris {len(tri)}, boundary edges {len(be)}; neck loop y {NB[:, 1].min():.3f}..{NB[:, 1].max():.3f} r {rad(NB).min():.3f}..{rad(NB).max():.3f}", flush=True)
    hb = per(th(P[be[:, 0]]), nb_th, nb_y)
    near = (P[be[:, 0], 1] > hb - 0.04) & (P[be[:, 1], 1] > hb - 0.04) & (rad(P[be[:, 0]]) < 0.1)
    cut_v = np.unique(be[near])
    ct = th(P[cut_v]); oc = np.argsort(ct)
    r_cut = lambda q: per(q, ct[oc], rad(P[cut_v])[oc])
    Pb, f = neck_blend(P, r_cut)
    return keep, tri, cut_v, Pb, f


def loop_order(verts, P):
    t = th(P[verts]); o = np.argsort(t)
    return verts[o], t[o]


def zipper(A, ta, Bv, tb):
    """Triangles between two closed loops ordered by angle (A on top: GNM; B below: v3 cut)."""
    i = j = 0
    na, nb = len(A), len(Bv)
    tris = []
    while i < na or j < nb:
        a0, a1 = A[i % na], A[(i + 1) % na]
        b0, b1 = Bv[j % nb], Bv[(j + 1) % nb]
        ta1 = ta[(i + 1) % na] + (2 * np.pi if i + 1 >= na else 0)
        tb1 = tb[(j + 1) % nb] + (2 * np.pi if j + 1 >= nb else 0)
        if (j >= nb) or (i < na and ta1 <= tb1):
            tris.append(("A", i, "B", j, "A", i + 1)); i += 1
        else:
            tris.append(("A", i, "B", j, "B", j + 1)); j += 1
    return tris


def build_tier(tier):
    T3, _ = v3data.load(os.path.join(G.CH, "bakeoff-gnm", "v3dump", tier))
    keys_t = T3["face"]["targetNames"]
    kidx = [KN.index(k) for k in keys_t]
    # ---- GNM part
    P = [V0w[src]]; UV = [uv_g]; JI = [gj]; WT = [gw]; RG = [region]
    MD = [KDw[kidx][:, src, :]]
    F = [Fg]
    n0 = nG
    # ---- GNM's neck reaches lower than v3's visible skin: its front boundary is at the sternal notch (world y 1.251,
    # below all of v3's kept skin, which v3 culled under the kurti down to the V slit), sides 1.31 under the kurti's
    # shoulders. So the face is GNM alone; v3's bust skin is NOT used (measured: 7 of its vertices lay below the boundary)
    face = {"POSITION": V0w[src], "TEXCOORD_0": uv_g, "JOINTS_0": gj, "WEIGHTS_0": gw, "_REGION": region, "idx": Fg.copy(),
            "targets": KDw[kidx][:, src, :], "targetNames": keys_t, "weld": src.copy()}
    rep.setdefault("tiers", {})[tier] = {"gnmVerts": int(n0), "bustVerts": 0}
    # ---- eyes: the contract eye mesh scaled to GNM's eyeball and centred on its joints
    E = T3["eyes"]; Pe = E["POSITION"].astype(np.float64).copy()
    for side, jn, sgn in (("L", 2, 1), ("R", 3, -1)):
        s_ = (Pe[:, 0] * sgn) > 0
        c3 = Pe[s_].mean(0)
        back = s_ & (Pe[:, 2] < c3[2])
        r3 = np.linalg.norm(Pe[back] - c3, axis=1).max()
        scl = m.group("scleras") & ((V0[:, 0] * sgn) > 0)
        X = V0[scl]
        A_ = np.c_[2 * X, np.ones(len(X))]; sol = np.linalg.lstsq(A_, (X ** 2).sum(1), rcond=None)[0]
        cg = sol[:3]; rg_ = np.sqrt(sol[3] + cg @ cg)
        Pe[s_] = W(cg[None]) + (Pe[s_] - c3) * (rg_ / r3)
        rep.setdefault("eyes", {})[side] = {"gnmRadiusMM": round(float(rg_ * 1000), 2), "v3RadiusMM": round(float(r3 * 1000), 2),
                                            "centreFromJointMM": round(float(np.linalg.norm(cg - J[jn]) * 1000), 2), "centreWorld": W(cg[None])[0].round(5).tolist()}
    eyes = {"POSITION": Pe, "TEXCOORD_0": E["TEXCOORD_0"], "JOINTS_0": E["JOINTS_0"], "WEIGHTS_0": E["WEIGHTS_0"], "idx": E["idx"]}
    # ---- hair, cards, garment through the field (+ push-out of the GNM skin)
    gskin_tri = Fg[(region[Fg] == 0).all(1)]

    def push_out(X, min_d, max_reach=0.012):
        d, ti, bw = geom.surf_closest(X, V0w[src], gskin_tri, k=8)
        A_, B_, C_ = (V0w[src][gskin_tri[ti, q]] for q in range(3))
        n = np.cross(B_ - A_, C_ - A_); n /= np.linalg.norm(n, axis=1, keepdims=True)
        Q = bw[:, :1] * A_ + bw[:, 1:2] * B_ + bw[:, 2:] * C_
        sd = ((X - Q) * n).sum(1)
        fix = (sd < min_d) & (d < max_reach)
        X = X.copy(); X[fix] += n[fix] * (min_d - sd[fix])[:, None]
        return X, int(fix.sum())
    Hh = T3["hair"]; Ph = field(Hh["POSITION"].astype(np.float64))
    Ph, nh = push_out(Ph, 0.0015)
    hair = {"POSITION": Ph, **{k: Hh[k] for k in ("TEXCOORD_0", "JOINTS_0", "WEIGHTS_0", "_STRAND")}, "idx": Hh["idx"]}
    Cc = T3["cards"]; Pc = field(Cc["POSITION"].astype(np.float64))
    cidx = Cc["idx"]
    if tier == "H" and not a.brows:
        # brow cards: the vertices above the lash line (the brow card sits >= 6 mm above the eye centre)
        browv = Pc[:, 1] > eye_w3[1] + 0.006
        cidx = cidx[~browv[cidx].any(1)]
    Pc, ncard = push_out(Pc, 0.0004, 0.006)
    # card morphs: the nearest GNM face vertex's delta (lashes ride the lid, brows the brow skin)
    ct = cKDTree(V0w[src][region == 0] if False else V0w[src])
    _, nn = ct.query(Pc)
    ckeys = Cc["targetNames"]
    CT = np.stack([KDw[KN.index(k)][src[nn]] for k in ckeys])
    cards = {"POSITION": Pc, **{k: Cc[k] for k in ("TEXCOORD_0", "JOINTS_0", "WEIGHTS_0", "_STRAND")}, "idx": cidx,
             "targets": CT, "targetNames": ckeys}
    Gm = T3["garment"]; Pg = Gm["POSITION"].astype(np.float64)
    # the kurti is v3's, fitted to the MakeHuman neck: wherever GNM's neck or shoulder skin would show through it, the
    # cloth is pushed out to 2.5 mm above the skin (the penetration count is re-measured by gates.py)
    Pg, ng = push_out(field_body(Pg), 0.0025, 0.03)
    # the studs (24 garment vertices above y 1.40, one cluster per ear) sit on GNM's earlobes: the lowest 15 % of each
    # ear's vertices, 1.2 mm out along their mean normal (they had followed the head field to the cheek, rendered)
    stud = Pg[:, 1] > 1.40
    earv = m.group("ears")
    for sgn in (1, -1):
        cl = stud & (np.sign(Pg[:, 0]) == sgn)
        if not cl.any():
            continue
        ev = np.where(earv & (np.sign(V0[:, 0]) == sgn))[0]
        low = ev[V0w[ev, 1] < np.percentile(V0w[ev, 1], 15)]
        lat = low[np.argsort(-np.abs(V0w[low, 0]))[: max(3, len(low) // 4)]]
        nrm_ = np.zeros(3)
        gi = {int(sv): i for i, sv in enumerate(src)}
        Pc_ = V0w[lat].mean(0)
        nrm_ = np.array([sgn * 0.8, 0, 0.6])
        Pg[cl] += (Pc_ + nrm_ * 0.0012) - Pg[cl].mean(0)
    garment = {"POSITION": Pg, **{k: Gm[k] for k in ("TEXCOORD_0", "JOINTS_0", "WEIGHTS_0")}, "idx": Gm["idx"]}
    rep["tiers"][tier].update({"garmentPushedOut": ng, "hairPushedOut": nh, "cardsPushedOut": ncard, "cardTris": int(len(cidx))})
    return {"face": face, "eyes": eyes, "hair": hair, "cards": cards, "garment": garment}


# ---------------------------------------------------------------- simplification (B+ face, H teeth)
def simplify(mesh, sel_tris, target, lock_mask, err=0.02, attr_w=None):
    """Simplify the triangles sel_tris (bool over mesh idx) to ~target tris, locked verts kept; others untouched."""
    idx = mesh["idx"]
    sub = idx[sel_tris]
    with tempfile.TemporaryDirectory() as d:
        mesh["POSITION"].astype(np.float32).tofile(os.path.join(d, "pos.f32"))
        sub.astype(np.uint32).tofile(os.path.join(d, "idx.u32"))
        lock_mask.astype(np.uint8).tofile(os.path.join(d, "lock.u8"))
        cfg = {"targetTris": int(target), "error": err, "flags": ["LockBorder"]}
        if attr_w is not None:
            attr_w[0].astype(np.float32).tofile(os.path.join(d, "attr.f32")); cfg["attrWeights"] = attr_w[1]
        json.dump(cfg, open(os.path.join(d, "in.json"), "w"))
        r = subprocess.run(["node", os.path.join(G.HERE, "simplify.mjs"), d], capture_output=True, text=True, check=True)
        out = np.fromfile(os.path.join(d, "out.u32"), np.uint32).reshape(-1, 3)
    mesh["idx"] = np.concatenate([idx[~sel_tris], out.astype(idx.dtype)])
    return json.loads(r.stdout)


def compact(mesh):
    used = np.unique(mesh["idx"])
    remap = -np.ones(len(mesh["POSITION"]), int); remap[used] = np.arange(len(used))
    for k, v in list(mesh.items()):
        if k in ("idx", "targetNames"):
            continue
        if k == "targets":
            mesh[k] = v[:, used]
        elif isinstance(v, np.ndarray) and len(v) == len(remap):
            mesh[k] = v[used]
    mesh["idx"] = remap[mesh["idx"]]


def normals(P, F, weld=None):
    n = np.zeros_like(P)
    fn = np.cross(P[F[:, 1]] - P[F[:, 0]], P[F[:, 2]] - P[F[:, 0]])
    for c in range(3):
        np.add.at(n, F[:, c], fn)
    if weld is not None:                                   # average across UV-seam duplicates and the bridge
        _, inv = np.unique(weld, return_inverse=True)
        acc = np.zeros((inv.max() + 1, 3)); np.add.at(acc, inv, n); n = acc[inv]
    return n / np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-12)


def write_scene(tier, parts):
    out = os.path.join(BD, tier)
    os.makedirs(out, exist_ok=True)
    meshes = []
    stats = {"tier": tier, "meshes": {}}
    for nm, mat in (("face", "TaxilaSkin"), ("eyes", "TaxilaEye"), ("cards", "TaxilaCards"), ("hair", "TaxilaHair"), ("garment", "TaxilaCloth")):
        p = parts[nm]
        P = p["POSITION"].astype(np.float64)
        Nn = normals(P, p["idx"], p.get("weld"))
        attrs = {}
        def put(sem, arr, dt=np.float32):
            f = f"{nm}_{sem}.bin"; np.ascontiguousarray(arr, dt).tofile(os.path.join(out, f))
            attrs[sem] = {"file": f, "size": int(arr.shape[1]) if arr.ndim > 1 else 1, "type": "u8" if dt == np.uint8 else "f32"}
        put("POSITION", P); put("NORMAL", Nn); put("TEXCOORD_0", p["TEXCOORD_0"])
        put("JOINTS_0", p["JOINTS_0"].astype(np.uint8), np.uint8); put("WEIGHTS_0", p["WEIGHTS_0"])
        if "_REGION" in p:
            put("_REGION", p["_REGION"].reshape(-1, 1))
        if "_STRAND" in p:
            put("_STRAND", p["_STRAND"])
        fi = f"{nm}_idx.bin"; p["idx"].astype(np.uint32).tofile(os.path.join(out, fi))
        tg = []
        for i, tn in enumerate(p.get("targetNames", [])):
            f = f"{nm}_t{i}.bin"; p["targets"][i].astype(np.float32).tofile(os.path.join(out, f)); tg.append(f)
        meshes.append({"name": nm, "material": mat, "attrs": attrs, "indices": fi, "targets": tg, "targetNames": list(p.get("targetNames", []))})
        stats["meshes"][nm] = {"verts": int(len(P)), "tris": int(len(p["idx"])), "keys": len(tg)}
    bones = []
    for nm in ["Armature", "Spine2", "Neck", "Head", "LeftShoulder", "RightShoulder", "LeftEye", "RightEye"]:
        b = B3[nm]
        t = list(map(float, b["t"]))
        if nm in ("LeftEye", "RightEye"):
            c = np.array(rep["eyes"]["L" if nm == "LeftEye" else "R"]["centreWorld"])
            Hw = B3["Head"]["world"]
            t = (np.linalg.inv(Hw) @ np.r_[c, 1])[:3].tolist()
        bones.append({"name": nm, "parent": b["parent"], "t": t, "r": list(map(float, b["r"])), "s": list(map(float, b["s"]))})
    stats["tris"] = sum(v["tris"] for v in stats["meshes"].values()); stats["draws"] = len(meshes)
    stats["faceKeys"] = list(parts["face"]["targetNames"])
    json.dump({"tier": tier, "joints": JOINTS, "bones": bones, "meshes": meshes}, open(os.path.join(out, "scene.json"), "w"), indent=1)
    json.dump(stats, open(os.path.join(BD, f"{tier}.stats.json"), "w"), indent=1)
    return stats


for tier in a.tier.split(","):
    parts = build_tier(tier)
    face = parts["face"]
    gsrc = face["weld"]
    reg = face["_REGION"]
    isg = gsrc >= 0
    lipl = np.zeros(len(gsrc), bool)
    lipl[isg] = (m.group("upper_lip") | m.group("lower_lip"))[gsrc[isg]]
    lidl = np.zeros(len(gsrc), bool)
    orb = (m.group("left_orbital_region") | m.group("right_orbital_region"))
    lidl[isg] = orb[gsrc[isg]] & (np.min([np.linalg.norm(V0[gsrc[isg]] - J[q], axis=1) for q in (2, 3)], 0) < 0.016)
    teeth_t = (np.round(reg[face["idx"]]) == 1).all(1)
    if tier == "H":
        # H: the teeth/gums are dense in GNM (5.6k tris, rigid rows): decimated to 1.6k so H fits 45k tris
        rep["tiers"][tier]["teethSimplify"] = simplify(face, teeth_t, 1600, np.zeros(len(gsrc), bool), err=0.01)
    else:
        rep["tiers"][tier]["teethSimplify"] = simplify(face, teeth_t, 900, np.zeros(len(gsrc), bool), err=0.02)
        tong = (np.round(face["_REGION"][face["idx"]]) == 2).all(1)
        rep["tiers"][tier]["tongueSimplify"] = simplify(face, tong, 500, np.zeros(len(gsrc), bool), err=0.02)
        sk = (face["_REGION"][face["idx"]] != 1).all(1) & (face["_REGION"][face["idx"]] != 2).all(1) & (gsrc[face["idx"]] >= 0).all(1)
        # keyed areas keep detail: the per-vertex max key displacement is a simplifier attribute
        mot = np.linalg.norm(face["targets"], axis=2).max(0)[:, None]
        rep["tiers"][tier]["skinSimplify"] = simplify(face, sk, 7200, lipl | lidl, err=0.03, attr_w=(mot * 50.0, [1.0]))
    compact(face)
    rep["tiers"][tier]["stats"] = write_scene(tier, parts)
    print(f"[assemble] {tier}: {rep['tiers'][tier]['stats']['meshes']} total tris {rep['tiers'][tier]['stats']['tris']}", flush=True)
# the upper lid's rest height in eye radii (MediaPipe 386 / 159 mid upper lid on GNM), for the eye shader's lid shadow
C_ = G.mp_correspondence(); MP_ = {int(k): int(v) for k, v in zip(C_["landmarks"], C_["vertices"])}
r_eye = rep["eyes"]["L"]["gnmRadiusMM"] / 1000
hL = (V0[MP_[386], 1] - J[2][1]) / r_eye; hR = (V0[MP_[159], 1] - J[3][1]) / r_eye
rep["restLid"] = {"upperLidHeightEyeRadii": [round(float(hL), 3), round(float(hR), 3)],
                  "shaderRestLid": round(float(np.clip((0.62 - 0.5 * (hL + hR)) / 0.82, 0, 1)), 3)}
rep["seconds"] = round(time.time() - t0)
json.dump(rep, open(os.path.join(BD, "assemble.json"), "w"), indent=1)
json.dump(rep, open(os.path.join(G.ART, "reports", "assemble.json"), "w"), indent=1)
print(json.dumps({k: rep[k] for k in ("placement", "neckLoop", "eyes")}, indent=1))
