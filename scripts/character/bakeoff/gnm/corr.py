"""E-GNM1 step 2a: a dense surface correspondence between procedural-v3's teal face (the MakeHuman/MPFB bust that
carries v3's 82 key shapes, hair, cards and kurti) and the fitted GNM head, so that
  (1) v3's key shapes become TARGETS for the GNM expression-space solve (keys.py), and
  (2) v3's hair, brow/lash cards, kurti and bust skin are carried onto the GNM head (assemble.py).
Method:
  a. MediaPipe landmarks on a neutral render of v3's GLB (shoot.mjs + TX.pick: the 3D surface point under each
     landmark) <-> the same landmark's GNM vertex (XR Blocks correspondence) on the fitted GNM rest shape;
  b. a similarity (Umeyama, 166 skull-fixed landmarks) takes v3 into GNM's model frame (v3 deltas scale with it);
  c. a Gaussian RBF on the landmark residuals (sigma 22 mm, plus the similarity) warps every v3 skin vertex;
  d. non-rigid ICP (6 passes): each warped v3 head vertex moves toward its nearest GNM skin point, the update smoothed
     over 16 neighbours, face-landmark area damped (the landmarks define the semantic alignment there);
  e. inverse map: every GNM skin vertex -> nearest point on the warped v3 surface (triangle + barycentric), with
     LABEL constraints so the lips and lids cannot cross: GNM upper-lip / lower-lip regions only map to v3 vertices on
     the same side of the mouth (v3 side by its own jawOpen motion), and GNM lid vertices above / below the fissure
     only to v3's moving (upper) / still (lower) lid (by v3's eyeBlink motion).
Writes $CHAR_HOME/bakeoff-gnm/teal/corr.npz and art/character/bakeoff/gnm/reports/corr.json (alignment numbers).
    python corr.py"""
import json, os, time
import numpy as np
from scipy.spatial import cKDTree
import gnm_model as G
import v3data

CH = G.CH
LOOK_ = G.look_from_argv(); PTH = G.paths(LOOK_)
BD = PTH["BD"]
# --parts (slate / plum): the correspondence for the PARTS field and the placement is built from THIS look's own source
# face (the main pipeline's iteration-2 MPFB bust that carries its hair, glasses and garment), not v3 teal's
import sys as _sys
PARTS = "--parts" in _sys.argv
V3 = os.path.join(PTH["SRC"], "H") if PARTS else os.path.join(CH, "bakeoff-gnm", "v3dump", "H")
PICK = os.path.join(CH, "bakeoff-gnm", f"srcshots-{LOOK_}", "___teacher_pick.json") if PARTS else os.path.join(CH, "bakeoff-gnm", "v3shots", "procedural-v3_pick.json")
t0 = time.time()
m = G.GNM()
C = G.mp_correspondence()
fit = json.load(open(PTH["FIT"]))
cid = np.array(fit["identity"])
Vg = m.bind(cid)
M3, B3 = v3data.load(V3)
F3 = M3["face"]
reg = np.round(F3["_REGION"]).astype(int)
P3 = F3["POSITION"].astype(np.float64)
names = F3["targetNames"]
T3 = F3["targets"].astype(np.float64)

# ---------------------------------------------------------------- a+b: landmarks and the similarity
pk = json.load(open(PICK))
views = ["___teacher_yaw0", "___teacher_yaw25", "___teacher_yaw-25"] if PARTS else ["procedural-v3_yaw0", "procedural-v3_yaw25", "procedural-v3_yaw-25"]
L3 = np.full((len(C["landmarks"]), 3), np.nan)
for vname in views:          # front first; the 3/4 views fill the landmarks the front pick missed (cheek contour)
    if vname not in pk:
        continue
    arr = pk[vname]
    for i, li in enumerate(C["landmarks"]):
        if np.isnan(L3[i, 0]) and arr[li] is not None:
            L3[i] = arr[li]
okl = ~np.isnan(L3[:, 0])
if PARTS:
    # slate's source render wears its glasses: TX.pick returns the FIRST surface under a landmark pixel, so eye and brow
    # landmarks behind the rims/lens land on the frame, 1-2 cm proud of the skin (the free similarity then read scale 0.89
    # and ICP p95 43 mm). Keep only picks within 2 mm of a source skin vertex (4 mm kept 448 picks but left ICP p95 at 44 mm; 2 mm keeps 321, p95 6 mm).
    from scipy.spatial import cKDTree as _KD
    _d, _ = _KD(P3[reg == 0]).query(np.nan_to_num(L3))
    off = okl & (_d > 0.002)
    print(f"[corr] parts: {int(off.sum())} of {int(okl.sum())} picks off the face surface dropped")
    okl &= ~off
Lg = Vg[C["vertices"]]


def umeyama(A, B):
    ma, mb = A.mean(0), B.mean(0)
    H = (A - ma).T @ (B - mb)
    U, S, Vt = np.linalg.svd(H)
    D = np.eye(3); D[2, 2] = np.sign(np.linalg.det(Vt.T @ U.T))
    R = Vt.T @ D @ U.T
    s = (S * np.diag(D)).sum() / ((A - ma) ** 2).sum()
    return s, R, mb - s * R @ ma


rig = okl & (C["rigid"] > 0)
s, R, t = umeyama(L3[rig], Lg[rig])           # v3 world -> GNM model frame
if PARTS:
    # both faces are mirror-symmetric about their own x = 0 plane, so the true relative rotation has no yaw or roll; the
    # free similarity read 4.1 deg yaw / -1.9 deg roll off slate's render (glasses rims over the eye landmarks) and baked a
    # turned head into the rest pose. Keep pitch only, then re-solve scale and translation in closed form.
    ax = np.arctan2(R[2, 1], R[2, 2])
    R = np.array([[1, 0, 0], [0, np.cos(ax), -np.sin(ax)], [0, np.sin(ax), np.cos(ax)]])
    A_, B_ = L3[rig], Lg[rig]
    RA = (A_ - A_.mean(0)) @ R.T
    s = float((RA * (B_ - B_.mean(0))).sum() / (RA ** 2).sum())
    t = B_.mean(0) - s * R @ A_.mean(0)
    t[0] = 0.0 if abs(t[0]) < 0.01 else t[0]
to_g = lambda X: s * X @ R.T + t
P3g = to_g(P3)
L3g = to_g(L3)
sim_rms = float(np.sqrt(((L3g[okl] - Lg[okl]) ** 2).sum(1).mean()) * 1000)

# ---------------------------------------------------------------- c: RBF warp on the landmark residuals
src, dst = L3g[okl], Lg[okl]
sig = 0.022
K = np.exp(-((src[:, None] - src[None]) ** 2).sum(-1) / (2 * sig ** 2))
W = np.linalg.solve(K + 1e-3 * np.eye(len(src)), dst - src)
skin3 = reg == 0


def rbf(X):
    out = np.empty_like(X)
    for i in range(0, len(X), 4000):
        k = np.exp(-((X[i:i + 4000, None] - src[None]) ** 2).sum(-1) / (2 * sig ** 2))
        out[i:i + 4000] = X[i:i + 4000] + k @ W
    return out


Wp = P3g.copy()
Wp[skin3] = rbf(P3g[skin3])

# ---------------------------------------------------------------- d: non-rigid ICP onto the GNM skin
gskin = m.group("skin_exterior")
gtri = m.tri[gskin[m.tri].all(1)]
# dense GNM surface samples (vertices + triangle points) for nearest-point queries
bw = np.array([[1, 0, 0], [0, 1, 0], [0, 0, 1], [1 / 3, 1 / 3, 1 / 3], [0.6, 0.2, 0.2], [0.2, 0.6, 0.2], [0.2, 0.2, 0.6]])
gs = np.einsum("kb,tbd->tkd", bw, Vg[gtri]).reshape(-1, 3)
gtree = cKDTree(gs)
# v3 head vertices that should land on GNM: above the GNM neck boundary (GNM frame y > its neck bottom + 1 cm)
gb_y = Vg[gskin][:, 1].min()
head3 = skin3 & (Wp[:, 1] > gb_y + 0.012)
face_area = np.zeros(len(P3), bool)
d_lm, _ = cKDTree(L3g[okl]).query(P3g)
face_area = skin3 & (d_lm < 0.012)
nbr = cKDTree(P3g[head3]).query(P3g[head3], k=16)[1]
hidx = np.where(head3)[0]
for it in range(6):
    d, j = gtree.query(Wp[hidx])
    r = gs[j] - Wp[hidx]
    r[d > 0.03] = 0                        # never pull across a gap (an ear back, the mouth)
    for _ in range(2):
        r = r[nbr].mean(1)
    damp = np.where(face_area[hidx], 0.35, 0.8)
    Wp[hidx] += damp[:, None] * r
dist_final, _ = gtree.query(Wp[hidx])

# ---------------------------------------------------------------- labels (v3 side by its own motion)
iJ, iB, iBR = names.index("jawOpen"), names.index("eyeBlinkLeft"), names.index("eyeBlinkRight")
chin = np.argmax(np.linalg.norm(T3[iJ], axis=1) * skin3)
jaw_ratio = np.linalg.norm(T3[iJ], axis=1) / np.linalg.norm(T3[iJ][chin])
blink = np.maximum(np.linalg.norm(T3[iB], axis=1), np.linalg.norm(T3[iBR], axis=1))
mouth_g = (m.group("upper_lip_region") | m.group("lower_lip_region") | m.group("upper_lip") | m.group("lower_lip"))
lab3 = np.zeros(len(P3), int)      # 0 any, 1 upper lip side, 2 lower lip side, 3 upper lid (moving), 4 lower lid / still
near_mouth3 = skin3 & (np.linalg.norm(Wp - Vg[mouth_g].mean(0), axis=1) < 0.045)
lab3[near_mouth3 & (jaw_ratio < 0.35)] = 1
lab3[near_mouth3 & (jaw_ratio >= 0.35)] = 2
eyesg = [m.joints(cid)[2], m.joints(cid)[3]]
near_eye3 = skin3 & (np.minimum(*[np.linalg.norm(Wp - e, axis=1) for e in eyesg]) < 0.028)
lab3[near_eye3 & (blink > 0.004)] = 3
lab3[near_eye3 & (blink <= 0.004)] = 4

# GNM side: lips by GNM's own regions; lids by the MediaPipe lid margins on the GNM rest shape
labg = np.zeros(m.V, int)
labg[m.group("upper_lip_region") | m.group("upper_lip")] = 1          # the vermilion groups too: without them the
labg[m.group("lower_lip_region") | m.group("lower_lip") | m.group("chin_region")] = 2   # upper lip's contact strip took
# v3's LOWER lip motion (aa target "opening" -10 mm, i.e. the upper lip following the jaw; measured in keys.json)
MP = {int(k): int(v) for k, v in zip(C["landmarks"], C["vertices"])}
LIDS = {"R": ([33, 246, 161, 160, 159, 158, 157, 173, 133], [33, 7, 163, 144, 145, 153, 154, 155, 133]),
        "L": ([263, 466, 388, 387, 386, 385, 384, 398, 362], [263, 249, 390, 373, 374, 380, 381, 382, 362])}
orb = m.group("left_orbital_region") | m.group("right_orbital_region") | m.group("left_brow_region") | m.group("right_brow_region")
for side, (up, lo) in LIDS.items():
    U = Vg[[MP[i] for i in up]]; Lw = Vg[[MP[i] for i in lo]]
    xs = np.linspace(min(U[:, 0].min(), Lw[:, 0].min()), max(U[:, 0].max(), Lw[:, 0].max()), 50)
    ou, ol = np.argsort(U[:, 0]), np.argsort(Lw[:, 0])
    fy = 0.5 * (np.interp(xs, U[ou, 0], U[ou, 1]) + np.interp(xs, Lw[ol, 0], Lw[ol, 1]))
    inx = (Vg[:, 0] >= xs[0]) & (Vg[:, 0] <= xs[-1]) & orb & gskin
    fyv = np.interp(Vg[:, 0], xs, fy)
    eyec = eyesg[0] if side == "L" else eyesg[1]
    close = np.linalg.norm(Vg - eyec, axis=1) < 0.028
    labg[inx & close & (Vg[:, 1] > fyv)] = 3
    labg[inx & close & (Vg[:, 1] <= fyv)] = 4

# ---------------------------------------------------------------- e: inverse map GNM skin vertex -> v3 surface
tri3 = F3["idx"][skin3[F3["idx"]].all(1)]
bw2 = np.array([[a, b, 1 - a - b] for a in np.linspace(0, 1, 5) for b in np.linspace(0, 1, 5) if a + b <= 1 + 1e-9])
samp = np.einsum("kb,tbd->tkd", bw2, Wp[tri3])                    # (T, k, 3)
tlab = np.array([np.bincount(lab3[t], minlength=5).argmax() for t in tri3])
S = samp.reshape(-1, 3)
Stri = np.repeat(np.arange(len(tri3)), len(bw2))
Sbw = np.tile(bw2, (len(tri3), 1))
Slab = tlab[Stri]
gv = np.where(m.group("skin"))[0]
res_tri = np.full(m.V, -1); res_bw = np.zeros((m.V, 3)); res_d = np.full(m.V, np.inf)
trees = {}
for L in range(5):
    sel = Slab == L if L else np.ones(len(S), bool)
    trees[L] = (cKDTree(S[sel]), np.where(sel)[0])
for L in range(5):
    q = gv[labg[gv] == L]
    if not len(q):
        continue
    tr, ids = trees[L]
    d, j = tr.query(Vg[q])
    jj = ids[j]
    res_tri[q] = Stri[jj]; res_bw[q] = Sbw[jj]; res_d[q] = d

out = {"s": s, "R": R, "t": t, "Wp": Wp, "tri3": tri3, "gtri_idx": res_tri, "gbw": res_bw, "gdist": res_d,
       "labg": labg, "lab3": lab3, "head3": head3, "Vg": Vg}
os.makedirs(BD, exist_ok=True)
np.savez(os.path.join(BD, "corr_parts.npz" if PARTS else "corr.npz"), **out)
face = m.group("hockey_mask") & m.group("skin_exterior")
rep = {"method": __doc__.split("\n")[0], "date": time.strftime("%Y-%m-%d"),
       "landmarksUsed": int(okl.sum()), "similarity": {"scale_v3_to_gnm": round(float(s), 4), "rigidLandmarkRmsMM": round(sim_rms, 2)},
       "icpResidualMM": {"p50": round(float(np.median(dist_final) * 1000), 2), "p95": round(float(np.percentile(dist_final, 95) * 1000), 2)},
       "inverseMapDistMM": {"face_p50": round(float(np.median(res_d[face]) * 1000), 2), "face_p95": round(float(np.percentile(res_d[face], 95) * 1000), 2),
                            "skin_p95": round(float(np.percentile(res_d[gv], 95) * 1000), 2)},
       "labels": {"gnm": np.bincount(labg[gv], minlength=5).tolist(), "v3": np.bincount(lab3[skin3], minlength=5).tolist()},
       "seconds": round(time.time() - t0)}
os.makedirs(os.path.join(G.ART, "reports"), exist_ok=True)
json.dump(rep, open(os.path.join(G.ART, "reports", ("corr.json" if LOOK_ == "teal" else f"corr-{LOOK_}.json").replace(".json", "-parts.json" if PARTS else ".json")), "w"), indent=1)
print(json.dumps(rep, indent=1))
