"""E-GNM1 gates on the assembled tiers, in numpy, with the definitions of CHARACTER-PIPELINE 5 / merged build.mjs:
  G1 names (82/82 H, 58 B+), G2 bounded/finite/non-empty (<= 26 mm; jaw, mouthClose <= 45; tongueOut <= 35),
  G3 mirror (max over L/R pairs on GNM's topological twin) <= 0.5 mm,
  G4 lid seal: rays from each eyeball centre through the eye mesh's cornea-front vertices must hit the skin at
     eyeBlink = 1 (also + lookDown, + squint, with the rig's product correctives): 0 % escaping,
  G5 lip gap: every upper-lip vertex within 2.4 mm of the lower lip's SURFACE (and vice versa), p95 of that distance
     <= 0.3 mm, at rest / viseme_PP / jawOpen 0.3 + mouthClose 0.3 (+ corrective 0.09); AND aperture: segments from
     inside the mouth to 3 mm in front of the lip line, 0 % escaping between the lips,
  G6 teeth/tongue outside the lips: 300 sampled tooth/tongue vertices, a segment from the mouth interior (mouth-sock
     centroid) to each must not cross the outer skin; rest -> every viseme, tongue key and emotion preset; bar "no
     increase" (merged: <= 4 of 300 everywhere except jawOpen 1.0 <= 12, tongueOut not gated),
  lids inside the eyeball (skin vertices inside ball + cornea, rest and every emotion preset): 0,
  garment penetration: skin vertices whose inward ray (2 cm) meets the garment (the skin pokes through): 0.
Poses are composed exactly as rig.js does (sum, clamp 0..1, jawCeiling, correctives = product of parents).
    python gates.py [--tier H]  -> art/character/bakeoff/gnm/reports/gates-<tier>.json"""
import argparse, json, os, time
import numpy as np
from scipy.spatial import cKDTree
import gnm_model as G
import geom

ap = argparse.ArgumentParser()
ap.add_argument("--tier", default="H")
ap.add_argument("--look", default="teal")
a = ap.parse_args()
t0 = time.time()
ap2 = a
LOOK_ = a.look; PTH = G.paths(LOOK_)
BD = PTH["BD"]
sc = json.load(open(os.path.join(BD, a.tier, "scene.json")))
rd = lambda f, dt=np.float32: np.fromfile(os.path.join(BD, a.tier, f), dt)


def mesh(name):
    x = [q for q in sc["meshes"] if q["name"] == name][0]
    o = {"P": rd(x["attrs"]["POSITION"]["file"]).reshape(-1, 3).astype(np.float64), "F": rd(x["indices"], np.uint32).reshape(-1, 3).astype(int),
         "names": x["targetNames"]}
    n = len(o["P"])
    o["T"] = np.stack([rd(f).reshape(n, 3) for f in x["targets"]]).astype(np.float64) if x["targets"] else np.zeros((0, n, 3))
    if "_REGION" in x["attrs"]:
        o["R"] = np.round(rd(x["attrs"]["_REGION"]["file"])).astype(int)
    return o


face, eyes, gar = mesh("face"), mesh("eyes"), mesh("garment")
names = face["names"]
PR = json.load(open(os.path.join(BD, "presets.json")))
m = G.GNM()
asm = json.load(open(os.path.join(BD, "assemble.json")))
R_pl = np.array(asm["placement"]["R"]); t_w = np.array(asm["placement"]["t"])
Vg = np.load(os.path.join(BD, "keys.npz"))["V0"]
d_, src = cKDTree(Vg).query((face["P"] - t_w) @ R_pl)
src[d_ > 1e-5] = -1
g = lambda nm: np.where(src >= 0, m.group(nm)[np.maximum(src, 0)], False)
rep = {"method": __doc__.split("\n")[0], "date": time.strftime("%Y-%m-%d"), "tier": a.tier}


def compose(bs):
    f = {}
    for k, v in bs.items():
        if k.startswith("viseme_") and k not in names:          # B+ / B-lite: the rig folds visemes into ARKit keys
            for a_, w_ in PR["visemeFold"].get(k, {}).items():
                f[a_] = f.get(a_, 0) + w_ * v
            continue
        f[k] = f.get(k, 0) + v
    for k in f:
        f[k] = min(1.0, max(0.0, f[k]))
    if "jawOpen" in f:
        f["jawOpen"] = min(f["jawOpen"], PR["jawCeiling"])
    for k, (p1, p2) in PR["correctives"].items():
        f[k] = f.get(p1, 0) * f.get(p2, 0)
    return f


def pose(bs, raw=False):
    f = bs if raw else compose(bs)
    V = face["P"].copy()
    for k, w in f.items():
        if k in names and w:
            V += w * face["T"][names.index(k)]
    return V


# ---------------------------------------------------------------- G1 / G2
exp = 82 if a.tier == "H" else 58
rep["G1_names"] = {"present": len(names), "expected": exp}
lim = {"jawOpen": 0.045, "mouthClose": 0.045, "tongueOut": 0.035}
bad = []
for i, k in enumerate(names):
    mx = np.linalg.norm(face["T"][i], axis=1).max()
    if not np.isfinite(mx) or mx > lim.get(k, 0.026) or (mx == 0 and k != "viseme_sil"):
        bad.append(f"{k}:{mx * 1000:.1f}mm")
rep["G2_bounded_nonempty"] = {"ok": not bad, "failed": bad}

# ---------------------------------------------------------------- G3 mirror (GNM topological twin)
gi = {}
for i, s_ in enumerate(src):
    if s_ >= 0 and s_ not in gi:
        gi[int(s_)] = i
MX = np.array([-1.0, 1, 1])
worst = 0.0
keyv = np.array([i for i, s_ in enumerate(src) if s_ >= 0 and int(m.mirror[s_]) in gi])
twin = np.array([gi[int(m.mirror[src[i]])] for i in keyv])
for k in names:
    if k.endswith("Left") and k[:-4] + "Right" in names:
        dL = face["T"][names.index(k)][keyv]; dR = face["T"][names.index(k[:-4] + "Right")][twin]
        # mirror in the GNM frame (the placement rotation is < 1 degree; measured in model axes)
        dLg, dRg = dL @ R_pl, dR @ R_pl
        worst = max(worst, float(np.linalg.norm(dLg - dRg * MX, axis=1).max()))
rep["G3_mirror_mm"] = round(worst * 1000, 3)
rep["G3_pass"] = worst <= 0.0005

# ---------------------------------------------------------------- G4 lid seal
E = eyes["P"]
skinF = face["F"][(face["R"][face["F"]] == 0).all(1)]
# GNM's eye_sockets group is a hidden lining INSIDE the eyeball (vertices 3-15 mm from its centre, behind the ball
# mesh); it is neither lid nor outer skin, so it is excluded from the lid-seal occluders and the lid counts
sockF = g("eye_sockets")[face["F"]].all(1)
lidF = face["F"][(face["R"][face["F"]] == 0).all(1) & ~sockF]
g4 = {}
cent = {}
for side, sgn in (("L", 1), ("R", -1)):
    s_ = (E[:, 0] * sgn) > 0
    if "centreWorld" in asm["eyes"][side]:                  # round 2: GNM's eyeball, centre and radius as measured
        c = np.array(asm["eyes"][side]["centreWorld"]); rr = asm["eyes"][side].get("radiusMM", 14.5) / 1000 * asm["eyes"][side].get("apex", 1.07)
    else:
        c = E[s_].mean(0); rr = np.linalg.norm(E[s_] - c, axis=1).max()
    cent[side] = (c, rr)
eyeF_near = lambda V, c: lidF[np.linalg.norm(V[lidF].mean(1) - c, axis=1) < 0.03]
states = {"open": {}, "blink": {"eyeBlinkLeft": 1, "eyeBlinkRight": 1},
          "blink+lookDown": {"eyeBlinkLeft": 1, "eyeBlinkRight": 1, "eyeLookDownLeft": 0.6, "eyeLookDownRight": 0.6},
          "blink+squint": {"eyeBlinkLeft": 1, "eyeBlinkRight": 1, "eyeSquintLeft": 0.6, "eyeSquintRight": 0.6, "cheekSquintLeft": 0.6, "cheekSquintRight": 0.6}}
for st, bs in states.items():
    V = pose(bs)
    row = {}
    for side, sgn in (("L", 1), ("R", -1)):
        c, rmax = cent[side]
        lz = asm["eyes"][side].get("limbusZ", 0.872) * asm["eyes"][side].get("radiusMM", rmax * 1000 / 1.07) / 1000
        s_ = ((E[:, 0] * sgn) > 0) & ((E[:, 2] - c[2]) > lz)          # the cornea's vertices (in front of the limbus)
        O = np.repeat(c[None], s_.sum(), 0)
        Dd = E[s_] - c; Dd /= np.linalg.norm(Dd, axis=1, keepdims=True)
        hits = geom.seg_hits(O, O + Dd * 0.03, V, eyeF_near(V, c), chunk=64)
        row[side] = round(float(100 * (1 - hits.mean())), 2)
    g4[st] = row
rep["G4_lid_seal_escaped_pct"] = g4

# ---------------------------------------------------------------- G5 lips
ul, ll = g("upper_lip"), g("lower_lip")
F_lo = face["F"][(g("lower_lip") | g("lower_lip_region"))[face["F"]].all(1) & (face["R"][face["F"]] == 0).all(1)]
F_up = face["F"][(g("upper_lip") | g("upper_lip_region"))[face["F"]].all(1) & (face["R"][face["F"]] == 0).all(1)]


def lip_gap(V, reach=0.0024):
    out = []
    for verts, Fx in ((np.where(ul)[0], F_lo), (np.where(ll)[0], F_up)):
        d, _, _ = geom.surf_closest(V[verts], V, Fx)
        out.append(d[d < reach])
    d = np.concatenate(out)
    return {"p95mm": round(float(np.percentile(d, 95) * 1000), 3) if len(d) else None, "n": int(len(d))}


sock = face["R"] == 3
mouth_c = face["P"][sock].mean(0)


def aperture(V):
    """Segments from the mouth interior to 3 mm in front of the lip line (40 points across the mouth): % not hitting skin."""
    lip = np.where(ul | ll)[0]
    xs = np.linspace(V[lip, 0].min() * 0.85, V[lip, 0].max() * 0.85, 40)
    up, lo = np.where(ul)[0], np.where(ll)[0]
    pts = []
    for x in xs:
        iu = up[np.argmin(np.abs(V[up, 0] - x))]; il = lo[np.argmin(np.abs(V[lo, 0] - x))]
        pm = 0.5 * (V[iu] + V[il]); pm[2] += 0.003
        pts.append(pm)
    pts = np.array(pts)
    O = np.repeat(mouth_c[None], len(pts), 0)
    near = skinF[np.linalg.norm(V[skinF].mean(1) - mouth_c, axis=1) < 0.05]
    hits = geom.seg_hits(O, pts, V, near, chunk=64)
    return round(float(100 * (1 - hits.mean())), 2)


g5 = {}
for st, bs in {"rest": {}, "PP": {"viseme_PP": 1}, "jaw03_close03": {"jawOpen": 0.3, "mouthClose": 0.3}}.items():
    V = pose(bs)
    g5[st] = {**lip_gap(V), "aperturePct": aperture(V)}
rep["G5"] = g5
rep["G5_pass_mm"] = all(v["p95mm"] is not None and v["p95mm"] <= 0.3 for v in g5.values())
rep["G5_pass_aperture"] = all(v["aperturePct"] == 0 for v in g5.values())
rep["G5_pass"] = rep["G5_pass_mm"] and rep["G5_pass_aperture"]

# ---------------------------------------------------------------- G6 teeth/tongue outside the lips
inner = np.where((face["R"] == 1) | (face["R"] == 2))[0]
smp = inner[np.random.default_rng(0).choice(len(inner), min(300, len(inner)), replace=False)]
outerF = skinF


def pokes(V):
    O = np.repeat(V[sock].mean(0)[None], len(smp), 0)
    near = outerF[np.linalg.norm(V[outerF].mean(1) - O[0], axis=1) < 0.06]
    return int(geom.seg_hits(O, V[smp], V, near, chunk=32).sum())


g6 = {"sample": int(len(smp)), "rest": pokes(pose({}))}
for k in names:
    if k.startswith("viseme_") or k.startswith("tongue") or k == "jawOpen":
        g6[k] = pokes(pose({k: 1.0} if k != "jawOpen" else {"jawOpen": 1.0}, raw=(k == "jawOpen")))
for e, bs in PR["emotions"].items():
    g6["emotion:" + e] = pokes(pose(bs))
for k in ("tongueTipUp", "tongueCurl", "tongueWide"):          # the Hindi keys play on an open jaw in speech
    if k in names:
        g6[k + "+jaw0.4"] = pokes(pose({k: 1.0, "jawOpen": 0.4}))
rep["G6_inner_vertices_outside_lips"] = g6
g6bad = [f"{k}={v}" for k, v in g6.items() if k not in ("sample", "tongueOut") and v > (12 if k == "jawOpen" else 4)]
rep["G6_pass"] = not g6bad
rep["G6_fails"] = g6bad

# ---------------------------------------------------------------- lids inside the eyeball (ball + cornea), rest + emotions
lidv = np.where((face["R"] == 0) & ~g("eye_sockets") & (np.minimum(np.linalg.norm(face["P"] - cent["L"][0], axis=1), np.linalg.norm(face["P"] - cent["R"][0], axis=1)) < 0.022))[0]


def inside_eye(V):
    """Lid skin inside the eye's real surface: the ball (back radius) or the cornea sphere (measured, assemble.json)."""
    n = 0
    for side in ("L", "R"):
        c, rmax = cent[side]
        eg = asm["eyes"][side]
        rb = eg.get("radiusMM", rmax * 1000 / 1.07) / 1000
        d = np.linalg.norm(V[lidv] - c, axis=1)
        p = (V[lidv] - c) / rb
        cc = np.array([0, 0, eg.get("corneaZ", 1.07 - 0.693)]); RC = eg.get("corneaR", 0.693)
        tol = 0.0003 / rb                                   # 0.3 mm: GNM's lids rest ON its eyeball (0.07 mm inside the shell)
        in_ball = d < rb - 0.0003
        in_cornea = (np.linalg.norm(p - cc, axis=1) < RC - tol) & (p[:, 2] > 0.6)
        n += int((in_ball | in_cornea).sum())
    return n


le = {"rest": inside_eye(pose({}))}
for e, bs in PR["emotions"].items():
    le[e] = inside_eye(pose(bs))
rep["lid_inside_eye_surface"] = le

# ---------------------------------------------------------------- garment penetration
V = face["P"]
n = np.zeros_like(V)
fn = np.cross(V[face["F"][:, 1]] - V[face["F"][:, 0]], V[face["F"][:, 2]] - V[face["F"][:, 0]])
for c in range(3):
    np.add.at(n, face["F"][:, c], fn)
n /= np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-12)
# heights relative to the eye line (teal's eyes sit at y 1.487; the iteration-2 slate / plum frames put them ~14 cm higher,
# where the old absolute 1.36 / 1.45 cuts selected no skin at all and the check read "0 of 0")
ey = float(np.mean([asm["eyes"][s_]["centreWorld"][1] for s_ in ("L", "R")])) if "centreWorld" in asm["eyes"]["L"] else 1.487
lowv = np.where((face["R"] == 0) & (V[:, 1] < ey - 0.127))[0]
gF = gar["F"]
near = gF[gar["P"][gF].mean(1)[:, 1] < ey - 0.037]
hit = geom.seg_hits(V[lowv] - n[lowv] * 0.0002, V[lowv] - n[lowv] * 0.02, gar["P"], near, chunk=32)
rep["garmentPenetration"] = {"skinVertsThroughGarment": int(hit.sum()), "checked": int(len(lowv))}
rep["seconds"] = round(time.time() - t0)
os.makedirs(os.path.join(G.ART, "reports"), exist_ok=True)
json.dump(rep, open(os.path.join(G.ART, "reports", f"gates-{a.tier}.json" if LOOK_ == "teal" else f"gates-{LOOK_}-{a.tier}.json"), "w"), indent=1)
print(json.dumps({k: v for k, v in rep.items() if k not in ("G6_inner_vertices_outside_lips",)}, indent=1))
print("G6", json.dumps(g6))
