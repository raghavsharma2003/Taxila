"""E-GNM1 step 2b: the 82 runtime keys (ARKit 52, 15 visemes, Hindi tongue keys, 12 correctives) solved INSIDE GNM
Head v3.0's expression space, by regularised least squares, never sculpted by eye (talking-avatars.md S2, A10).

For key k, the morph delta is  d_k = B_ex^T e_k  with  e_k = argmin_e  sum_v w_v |B_ex(v) e - t_k(v)|^2 + lam |e|^2
  B_ex   GNM's 382 expression components (100 per eye region, 150 lower face, 32 tongue; the iris component is left
         out), unit-std units, so lam is a prior "stay near the scanned expressions";
  t_k    the TARGET: procedural-v3's own key shape (its MakeHuman CC0 face units + v3's expression stage), carried to
         GNM by corr.py's label-constrained surface correspondence and scaled by the v3->GNM similarity;
  w_v    1 on GNM skin within 2 mm of the v3 surface, falling to 0 at 6 mm (no target where the two heads disagree),
         0 on teeth, gums, tongue and eyes (they follow GNM's own learned coupling: the lower teeth ride the jaw);
Exceptions, each solved in the same space:
  * tongue keys (tongueTipUp / tongueCurl / tongueWide / tongueOut): GNM's tongue has its own learned shape, so the
    targets are written on GNM's tongue (the same progressive bends iteration 2 used on the MakeHuman tongue:
    tip-up 16 deg from 62 % of the length, curl 40 deg from 70 % (iteration 2's 26 / 70 deg put GNM's longer tongue through the lip), wide +20 % width and 15 % flatter, out +22 mm at the tip)
    with the skin held at v3's delta for that key (0 for the three Hindi keys);
  * Left/Right pairs: the Left key is solved; the Right key is its exact mirror on GNM's topological mirror map
    (G3 by construction); bilateral keys are solved against a symmetrised target;
  * seal terms (G5): viseme_PP and mouthClose (on top of jawOpen) get an extra residual putting every lip contact
    vertex on the opposite lip's surface, weight a.seal. The REST pose is GNM's own scanned neutral, NOT sealed: a
    rest seal in GNM's space (--rest-seal) closed the contact metric (p95 1.99 -> 0.11-0.35 mm) only by flattening
    the lower lip into a slab (12-14 mm vertex shifts, rendered and rejected);
  * eyeBlink gets a lid-closure term: each upper-lid margin vertex to its lower-lid partner (G4).
Writes $CHAR_HOME/bakeoff-gnm/teal/keys.npz and art/character/bakeoff/gnm/reports/keys.json.
    python keys.py [--lam 2e-6] [--seal 30]"""
import argparse, json, os, time
import numpy as np
from scipy.spatial import cKDTree
import gnm_model as G
import v3data

ap = argparse.ArgumentParser()
ap.add_argument("--lam", type=float, default=2e-6, help="ridge weight (m^2 per unit-std coefficient^2)")
ap.add_argument("--seal", type=float, default=30.0)
ap.add_argument("--seal-close", type=float, default=3.0, help="seal weight for mouthClose at jaw 0.3 + close 0.3")
ap.add_argument("--lipw", type=float, default=4.0)
ap.add_argument("--gainmax", type=float, default=1.6)
ap.add_argument("--blink", type=float, default=8.0)
ap.add_argument("--rest-seal", action="store_true", help="bake a rest lip seal (OFF: it flattened the scanned lips into a slab, 12 mm shifts; measured)")
ap.add_argument("--hold", type=float, default=1.0, help="rest seal: weight holding every vertex in place")
a = ap.parse_args()
t0 = time.time()
BD = os.path.join(G.CH, "bakeoff-gnm", "teal")
m = G.GNM()
c = np.load(os.path.join(BD, "corr.npz"))
M3, _ = v3data.load(os.path.join(G.CH, "bakeoff-gnm", "v3dump", "H"))
F3 = M3["face"]
names3 = F3["targetNames"]
T3 = F3["targets"].astype(np.float64)
s, R = float(c["s"]), c["R"]
Vg = c["Vg"]
tri3, gt, gb, gd = c["tri3"], c["gtri_idx"], c["gbw"], c["gdist"]
NEX = len(m.ex_names) - 1                                # no iris
B = m.Bex[:NEX].astype(np.float64)                       # (E, V, 3)
mir = m.mirror
MX = np.array([-1.0, 1, 1])
skin_ext = m.group("skin_exterior")
tongue = m.group("tongue")
inner = m.group("teeth") | m.group("gums") | tongue | m.group("eyes")


def transfer(name):
    D = T3[names3.index(name)] * s @ R.T
    out = np.zeros_like(Vg)
    ok = gt >= 0
    out[ok] = np.einsum("vb,vbd->vd", gb[ok], D[tri3[gt[ok]]])
    return out


def mirror_field(D):
    return D[mir] * MX


conf = np.clip((0.006 - gd) / 0.004, 0, 1)
# the lips and lid margins carry the shapes the eye reads (aperture, corners): weighted a.lipw x in every solve
_lipz = m.group("upper_lip_region") | m.group("lower_lip_region") | m.group("upper_lip") | m.group("lower_lip")
conf = conf * np.where(_lipz, a.lipw, 1.0)
conf[~(skin_ext & ~inner)] = 0
conf[np.isinf(gd)] = 0

# ---------------------------------------------------------------- lips: contact vertices and the opposite SURFACE (G5)
import geom
ul_g, ll_g = m.group("upper_lip"), m.group("lower_lip")
F_lo = m.tri[(ll_g | m.group("lower_lip_region"))[m.tri].all(1) & skin_ext[m.tri].all(1)]
F_up = m.tri[(ul_g | m.group("upper_lip_region"))[m.tri].all(1) & skin_ext[m.tri].all(1)]
up_l, lo_l = np.where(ul_g)[0], np.where(ll_g)[0]


def contacts(V, reach=0.0024):
    """G5's contact set (CHARACTER-PIPELINE 5): every upper-lip vertex within reach of the lower lip's SURFACE, and
    vice versa. Returns rows (vertex, tri vertex ids (3), bary (3), gap)."""
    out = []
    for verts, F in ((up_l, F_lo), (lo_l, F_up)):
        d, t, b = geom.surf_closest(V[verts], V, F)
        k = d < reach
        out.append((verts[k], F[t[k]], b[k], d[k]))
    return tuple(np.concatenate([o[i] for o in out]) for i in range(4))


def gap_stats(V, pairs=None):
    v, tv, b, _ = contacts(V) if pairs is None else pairs
    if not len(v):
        return None
    # measured on V (the pose), against the pose's own opposite surface
    g = np.linalg.norm(V[v] - (b[:, :, None] * V[tv]).sum(1), axis=1) if pairs is not None else contacts(V)[3]
    return {"p95mm": round(float(np.percentile(g, 95) * 1000), 3), "maxmm": round(float(g.max() * 1000), 3), "n": int(len(g))}


def seal_rows(base_d, pairs, wgt, scale=1.0):
    """Rows A e = b that put each contact vertex ON the opposite surface point (fixed tri + bary) in the pose
    V0 + base_d + scale * B e."""
    v, tv, bb, _ = pairs
    if not len(v):
        return []
    Bv = B[:, v, :]                                           # (E, n, 3)
    Bs = np.einsum("nk,enkd->end", bb, B[:, tv, :])          # opposite point basis
    A = (Bv - Bs).transpose(1, 2, 0).reshape(-1, NEX) * wgt * scale
    P = V0 + (base_d if base_d is not None else 0)
    r = P[v] - (bb[:, :, None] * P[tv]).sum(1)
    return [(A, -r.ravel() * wgt)]


# lid margin pairs for the blink term: MediaPipe upper/lower lid margin landmarks on GNM
C = G.mp_correspondence()
MP = {int(k): int(v) for k, v in zip(C["landmarks"], C["vertices"])}
LID_L = list(zip([466, 388, 387, 386, 385, 384, 398], [249, 390, 373, 374, 380, 381, 382]))
lid_pairs_mp = np.array([(MP[u], MP[l]) for u, l in LID_L])
# all lid-margin vertices: exterior skin sharing a triangle with GNM's eye-socket lining, upper / lower by corr.py's
# fissure labels (3 / 4), left eye; each upper margin vertex is paired with its nearest lower one (and vice versa)
_sock = m.group("eye_sockets")
_adj = np.zeros(m.V, bool)
_tt = m.tri[_sock[m.tri].any(1) & ~_sock[m.tri].all(1)]
_adj[_tt.ravel()] = True
_marg = _adj & ~_sock & skin_ext & (m.Vlabel if False else True)
labg = c["labg"]
_up = np.where(_marg & (labg == 3) & (Vg[:, 0] > 0))[0]; _lo = np.where(_marg & (labg == 4) & (Vg[:, 0] > 0))[0]
_p1 = [(u, _lo[np.argmin(np.linalg.norm(Vg[_lo] - Vg[u], axis=1))]) for u in _up]
_p2 = [(_up[np.argmin(np.linalg.norm(Vg[_up] - Vg[l], axis=1))], l) for l in _lo]
# measured: pairing EVERY margin vertex forced the blink out of GNM's space (coefficient norm 144, max 41.8, explained
# -0.44): the margins do not meet vertex-to-vertex. The 7 MediaPipe lid-margin pairs are kept (G4 decides)
lid_pairs = lid_pairs_mp
F_lowlid = m.tri[((labg == 4) & skin_ext & ~_sock)[m.tri].all(1) & (Vg[m.tri][:, :, 0] > 0).all(1)]


def solve(target, w, extra=None, lam=None):
    """min sum w|B e - t|^2 + sum_extra |A e - b|^2 + lam |e|^2 ; extra = list of (A (n, E), b (n,))"""
    lam = a.lam if lam is None else lam
    sel = np.where(w > 0)[0]
    Bs = B[:, sel, :].reshape(NEX, -1).T                  # (3n, E)
    ww = np.repeat(w[sel], 3)
    A = (Bs * ww[:, None]).T @ Bs + lam * np.eye(NEX)
    b = (Bs * ww[:, None]).T @ target[sel].ravel()
    for Ae, be in (extra or []):
        A += Ae.T @ Ae; b += Ae.T @ be
    e = np.linalg.solve(A, b)
    return e


rep = {"method": __doc__.split("\n")[0], "date": time.strftime("%Y-%m-%d"), "lam": a.lam, "keys": {}}
# ---------------------------------------------------------------- rest seal (baked into the basis if needed)
V0 = Vg.copy()
rep["restGapBefore"] = gap_stats(V0)
e_rest = np.zeros(NEX)
lf = np.ones(m.V)                                         # hold every other vertex (skin, teeth, tongue) where it is
if a.rest_seal and rep["restGapBefore"] and rep["restGapBefore"]["p95mm"] > 0.25:
    for it in range(4):                                   # re-pick the opposite surface points as the lips close
        V0 = Vg + np.tensordot(e_rest, B, 1)
        P = contacts(V0)
        de = solve(np.zeros_like(Vg), lf * a.hold, seal_rows(None, P, a.seal), lam=a.lam)
        e_rest = e_rest + de
V0 = Vg + np.tensordot(e_rest, B, 1)
rep["restGapAfter"] = gap_stats(V0)
rep["restExpressionNorm"] = round(float(np.linalg.norm(e_rest)), 3)
_sh = np.linalg.norm(V0 - Vg, axis=1)
rep["restMaxShiftMM"] = {"skin": round(float(_sh[skin_ext].max() * 1000), 2), "inner": round(float(_sh[inner].max() * 1000), 2),
                         "skin_p99": round(float(np.percentile(_sh[skin_ext], 99) * 1000), 2)}
# the mouth sock sits 2 mm further into the mouth (normals of the lining face the oral cavity), fading in from 1 mm to
# 3 mm away from where it joins the inner lips: 2-4 interior sock vertices 3.9 mm from that seam crossed the upper lip
# at the midline in viseme_aa and the tongue keys (measured; a dark sliver on the upper lip, rendered)
_sk = m.group("mouth_sock")
_ring = np.zeros(m.V, bool); _rt = m.tri[_sk[m.tri].any(1) & (~_sk)[m.tri].any(1)]; _ring[_rt.ravel()] = True; _ring &= _sk
_n = np.zeros_like(V0); _fn = np.cross(V0[m.tri[:, 1]] - V0[m.tri[:, 0]], V0[m.tri[:, 2]] - V0[m.tri[:, 0]])
for _c in range(3):
    np.add.at(_n, m.tri[:, _c], _fn)
_n /= np.maximum(np.linalg.norm(_n, axis=1, keepdims=True), 1e-12)
_skv = np.where(_sk)[0]
_dr, _ = cKDTree(V0[_ring]).query(V0[_skv])
_f = np.clip((_dr - 0.001) / 0.002, 0, 1)
# orient: the lining's normal must point toward the mouth's centre
_cen = V0[_skv].mean(0)
_sgn = np.sign(((_cen - V0[_skv]) * _n[_skv]).sum(1).mean())
V0[_skv] += _sgn * _n[_skv] * (0.002 * _f)[:, None]
rep["sockInset"] = {"vertices": int((_f > 0).sum()), "maxMM": 2.0}
print("[keys] rest seal", rep["restGapBefore"], "->", rep["restGapAfter"], "shift", rep["restMaxShiftMM"], "mm", flush=True)


# ---------------------------------------------------------------- tongue targets on GNM's tongue
def tongue_target(kind):
    T = V0[tongue]
    zb, zt = T[:, 2].min(), T[:, 2].max()
    f = (T[:, 2] - zb) / (zt - zb)                     # 0 back .. 1 tip
    D = np.zeros_like(V0)
    if kind in ("tongueTipUp", "tongueCurl"):
        start, ang = (0.62, 16) if kind == "tongueTipUp" else (0.70, 40)   # gnm: 26 / 70 deg (iteration 2) sent GNM's longer tongue tip through the upper lip at jaw 0.4 (rendered)
        hinge_z = zb + start * (zt - zb)
        hy = np.median(T[np.abs(f - start) < 0.05, 1])
        u = np.clip((f - start) / (1 - start), 0, 1)
        th = np.radians(ang) * u
        dz, dy = T[:, 2] - hinge_z, T[:, 1] - hy
        nz = np.where(f > start, dz * np.cos(th) - dy * np.sin(th), dz)
        ny = np.where(f > start, dz * np.sin(th) + dy * np.cos(th), dy)
        if kind == "tongueCurl":
            nz -= 0.004 * u                               # retroflex: tip up AND back
        D[tongue] = np.stack([np.zeros(len(T)), ny - dy, nz - dz], 1)
    elif kind == "tongueWide":
        cx, cy = T[:, 0].mean(), np.median(T[:, 1])
        D[tongue] = np.stack([(T[:, 0] - cx) * 0.20, -(T[:, 1] - cy) * 0.15, np.zeros(len(T))], 1)
    elif kind == "tongueOut":
        D[tongue] = np.stack([np.zeros(len(T)), -0.004 * f, 0.022 * f ** 1.5 + 0.004], 1)
    return D


# ---------------------------------------------------------------- the key list (H contract order = v3's)
ARK = [n for n in names3]
deltas = {}
coeffs = {}
sided = lambda k: k.endswith("Left") or k.endswith("Right")


def solve_key(k):
    tgt = transfer(k)
    w = conf.copy()
    extra = []
    if k in ("tongueTipUp", "tongueCurl", "tongueWide", "tongueOut"):
        tgt = tgt * skin_ext[:, None] + tongue_target(k)
        w = np.where(tongue, 1.0, w)
        if k != "tongueOut":
            tgt[skin_ext] = 0
            w = np.where(skin_ext & (np.linalg.norm(V0 - V0[tongue].mean(0), axis=1) < 0.06), np.maximum(w, 0.3), w)
    if not sided(k) and "_" not in k[1:] or k.startswith("viseme_"):
        tgt = 0.5 * (tgt + mirror_field(tgt))           # bilateral: symmetric target
    seal_pose = None
    if k == "viseme_PP":
        seal_pose = (None, 1.0)
    if k == "mouthClose":                                 # sealed at jaw 0.3 + close 0.3 (the G5 state)
        seal_pose = (0.3 * deltas["jawOpen"], 0.3)
    if seal_pose is not None:
        e = solve(tgt, w)
        for it in range(3):
            base = (seal_pose[0] if seal_pose[0] is not None else 0) + seal_pose[1] * np.tensordot(e, B, 1)
            P = contacts(V0 + base)
            # rows linearised about the current e: seal (V0 + base0 + scale B e')
            extra = seal_rows(seal_pose[0], P, a.seal if k == "viseme_PP" else a.seal_close, seal_pose[1])
            e = solve(tgt, w, extra)
    if k.startswith("eyeBlink") and "_" not in k:
        # lid closure (G4) by SURFACE contact, like the lip seal: every upper-lid margin vertex (exterior skin bordering
        # GNM's socket lining, left eye) onto the closest point of the lower lid's surface, re-picked as the lid moves
        e = solve(tgt, w)
        for it in range(3):
            Vb = V0 + np.tensordot(e, B, 1)
            d_, t_, b_ = geom.surf_closest(Vb[_up], Vb, F_lowlid)
            pairs = (_up, F_lowlid[t_], b_, d_)
            extra = seal_rows(None, pairs, a.blink)
            e = solve(tgt, w, extra)
        seal_pose = "blink"
    if seal_pose is None:
        e = solve(tgt, w, extra)
    d = np.tensordot(e, B, 1)
    sel = w > 0
    # amplitude: the ridge prior shrinks every solution toward the mean face (smile reached 81 % of its target's peak,
    # browInnerUp 68 %, measured), and the presets were authored for full-amplitude keys. The least-squares optimal
    # scalar of the in-space shape against its target restores it (an in-space shape times a scalar stays in-space),
    # clamped to [1, a.gainmax]; keys with a contact constraint (PP, mouthClose, blink) keep their solved amplitude
    gk = 1.0
    if seal_pose is None and not k.startswith("tongue") and "_" not in k[1:].replace("viseme_", ""):
        num = float((w[sel, None] * d[sel] * tgt[sel]).sum()); den = float((w[sel, None] * d[sel] * d[sel]).sum())
        gk = float(np.clip(num / den if den > 0 else 1.0, 1.0, a.gainmax))
        e = e * gk; d = d * gk
    rep.setdefault("amplitudeGain", {})[k] = round(gk, 3)
    res = np.linalg.norm(d - tgt, axis=1)[sel]
    tn = np.linalg.norm(tgt, axis=1)[sel]
    _mu = np.where(m.group("upper_lip") & (np.abs(V0[:, 0]) < 0.003))[0]; _ml = np.where(m.group("lower_lip") & (np.abs(V0[:, 0]) < 0.003))[0]
    _op = lambda D: float(((V0[_mu] + D[_mu])[:, 1].min() - (V0[_ml] + D[_ml])[:, 1].max()) * 1000)
    rep.setdefault("lipOpeningMM", {})[k] = {"target": round(_op(tgt), 2), "solved": round(_op(d), 2)}
    rep["keys"][k] = {"targetMaxMM": round(float(tn.max() * 1000), 2), "deltaMaxMM": round(float(np.linalg.norm(d, axis=1).max() * 1000), 2),
                      "residRmsMM": round(float(np.sqrt((res ** 2).mean()) * 1000), 3),
                      "explained": round(float(1 - (res ** 2).sum() / max(1e-18, (tn ** 2).sum())), 3),
                      "coeffNorm": round(float(np.linalg.norm(e)), 2), "coeffAbsMax": round(float(np.abs(e).max()), 2)}
    return e, d


order = ["jawOpen"] + [k for k in ARK if k != "jawOpen"]
for k in order:
    if k.endswith("Right") and k[:-5] + "Left" in ARK:
        continue
    e, d = solve_key(k)
    coeffs[k], deltas[k] = e, d
    if k.endswith("Left") and k[:-4] + "Right" in ARK:
        kr = k[:-4] + "Right"
        deltas[kr] = mirror_field(d)
        coeffs[kr] = None                                  # an exact mirror of an in-space shape (see doc)
        rep["keys"][kr] = {"mirrorOf": k}
    print(f"[keys] {k}: {rep['keys'][k]}", flush=True)

# jawOpen_mouthClose stays the transferred v3 corrective solved like any key: re-solving it for the full seal at its 0.09
# weight made it 28.7 mm (over G2's 26 mm bound) and mouthClose 51 mm (over 45), measured; the seal is mouthClose's job
# (tried and removed: gluing the mouth sock's deltas to the nearest lip skin; by the segment test it moved the crossing
# from the upper lip to the lower one, 2-4 -> 3-22 sock vertices; measured)
# seal checks (G5 in the GNM frame): rest, PP, jaw 0.3 + close 0.3 + 0.09 corrective
Vpp = V0 + deltas["viseme_PP"]
Vjc = V0 + 0.3 * deltas["jawOpen"] + 0.3 * deltas["mouthClose"] + 0.09 * deltas["jawOpen_mouthClose"]
rep["seal"] = {"rest": gap_stats(V0), "PP": gap_stats(Vpp), "jaw03_close03": gap_stats(Vjc)}
print("[keys] seal", rep["seal"])
names = ARK
np.savez(os.path.join(BD, "keys.npz"), names=np.array(names), deltas=np.stack([deltas[k] for k in names]).astype(np.float32),
         e_rest=e_rest, V0=V0)
rep["seconds"] = round(time.time() - t0)
json.dump(rep, open(os.path.join(G.ART, "reports", "keys.json"), "w"), indent=1)
