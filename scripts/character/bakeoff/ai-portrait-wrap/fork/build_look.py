# FORK of scripts/character/blender/build_look.py (fork.mjs: paths and the two bakeoff hooks only). Do not edit; re-run fork.mjs.
"""Stage 1 (headless Blender): one look spec -> a rigged, shape-keyed head-and-shoulders character .blend + report.

Run (via scripts/character/build.mjs, or directly):
    bpyenv/bin/python scripts/character/blender/build_look.py --look art/character/looks/teal.json --out build/teal

What it does, in order (CHARACTER-PIPELINE.md §2):
  1. MPFB human from macro sliders; identity = MakeHuman modelling targets (CC0) with seeded L/R asymmetry; baked.
  2. S3h proportion: head scaled ~3% about the skull with a smooth neck falloff (before any key or proxy).
  3. ARKit 52 + 15 visemes from the CC0 faceunits01 / visemes02 packs, interpolated onto the proxies (MHCLO).
  4. Proxies: teeth, tongue, brows, lashes, hair (CC0); our own eyes (cornea + iris layers) replace the MH eyes.
  5. Bust cut; mouth interior; tongue extras (Hindi dental / retroflex / wide) and 7 correctives by script.
  6. Every key validated numerically (bounded, finite, non-empty, mirror-symmetric, lid seal, lip seal, teeth).
  7. Saves <out>/base.blend and <out>/report.json; tiers + textures + export are stage 2 (export_tiers.py).
"""
import argparse, json, math, os, sys, time

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../../blender")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")))
import numpy as np
import bpy, bmesh
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from mpfb_env import (enable_mpfb, asset, co, key_co, set_key_co, deltas, tris_of, smoothstep, select_only,
                      delete_verts, USER_DATA)
import keys as K
import parts
import identity_sculpt as SC

ap = argparse.ArgumentParser()
ap.add_argument("--look", required=True)
ap.add_argument("--out", required=True)
args = ap.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:])
look = json.load(open(args.look))
os.makedirs(args.out, exist_ok=True)
T0 = time.time()
rng = np.random.default_rng(look["seed"])
report = {"look": look["id"], "stages": {}, "keys": [], "gates": {}}


def stage(name):
    report["stages"][name] = round(time.time() - T0, 1)
    print(f"[build:{look['id']}] {name} t={time.time() - T0:.1f}s", flush=True)


M = enable_mpfb()
HS, TS, FS, HOP = M["HS"], M["TS"], M["FS"], M["HOP"]
bpy.ops.wm.read_factory_settings(use_empty=True)
M = enable_mpfb()
HS, TS, FS, HOP = M["HS"], M["TS"], M["FS"], M["HOP"]

# ------------------------------------------------------------------ 1. base human + identity
macro = TS.get_default_macro_info_dict()
for k, v in look["macros"].items():
    if k == "race":
        macro["race"].update(v)
    else:
        macro[k] = v
h = HS.create_human(macro_detail_dict=macro)
h.name = "Human"
# topological mirror map on the still-symmetric base (before any one-sided target); "vid" tracks original vertex ids
# through the bust cut, garment cut and joins so G3 can compare a key with its true mirror twin
MIR, _unm = K.mirror_map(co(h.data))
report["mirrorMapUnmatched"] = _unm
_a = h.data.attributes.new("vid", "INT", "POINT")
_a.data.foreach_set("value", np.arange(len(h.data.vertices), dtype=np.int32))
stack = [{"target": k, "value": float(v)} for k, v in look["targets"].items()]
# Seeded asymmetry, 3-8% class (TEACHER-VISUAL 4.2): small one-sided offsets on cheeks, brows, mouth corners.
for side in ("l", "r"):
    for t in ("cheek-volume-incr", "cheek-bones-incr", "eye-height1-incr"):
        stack.append({"target": f"{side}-{t}", "value": float(rng.uniform(0.0, 0.06))})
TS.bulk_load_targets(h, stack)
TS.bake_targets(h)
stage("identity")


def group_idx(obj, name, thr=0.5):
    gi = obj.vertex_groups[name].index
    return np.array([v.index for v in obj.data.vertices if any(g.group == gi and g.weight > thr for g in v.groups)],
                    dtype=np.int64)


def group_w(obj, name):
    gi = obj.vertex_groups[name].index
    w = np.zeros(len(obj.data.vertices))
    for v in obj.data.vertices:
        for g in v.groups:
            if g.group == gi:
                w[v.index] = g.weight
    return w


B = co(h.data)
J = {n: B[group_idx(h, n)].mean(0) for n in [g.name for g in h.vertex_groups if g.name.startswith("joint-")]}
head_c = J["joint-head"] + np.array([0, 0, 0.07])


def head_weight(P):
    """1 on the skull and face (chin included), 0 below the throat; a tilted plane so the chin stays rigid."""
    q = J["joint-head"] - np.array([0, 0, 0.012])
    n = np.array([0.0, -0.55, 0.835])
    return smoothstep(-0.018, 0.012, (P - q) @ n)


# 1b. identity sculpt layer (landmark-anchored RBF displacements, look["sculpt"]); before the head scale, keys, proxies
_body = np.zeros(len(B), bool)
_body[group_idx(h, "body")] = True
_eyeC0 = {s_: B[group_idx(h, g_)].mean(0) for s_, g_ in (("L", "helper-l-eye"), ("R", "helper-r-eye"))}
if look.get("sculpt"):
    _A = SC.landmarks(B, _body & (head_weight(B) > 0.5), _eyeC0, group_w(h, "lips"))
    B = SC.apply(B, _body * head_weight(B), _A, look["sculpt"], log=lambda m: print(f"[build:{look['id']}] {m}", flush=True))
    h.data.vertices.foreach_set("co", B.ravel())
    h.data.update()
    report["sculptAnchors"] = {k: np.round(v, 4).tolist() for k, v in _A.items()}
stage("sculpt")
# ---- bakeoff ai-portrait-wrap: wrap the basis onto the portrait reconstruction (wrap.py); keys/proxies load after this
if look.get("wrap"):
    import wrap as WR
    if look["wrap"].get("dump"):
        np.savez(look["wrap"]["dump"], B=B, hw=head_weight(B), mir=MIR, F=tris_of(h.data), body=_body)
    B, report["wrap"] = WR.apply(B, look["wrap"], head_weight(B), log=lambda m: print(f"[build:{look['id']}] {m}", flush=True), mir=MIR)
    h.data.vertices.foreach_set("co", B.ravel())
    h.data.update()
    stage("wrap")

# 2. S3h head scale (~3%), baked into the basis so every proxy fits the scaled head.
s = float(look.get("headScale", 1.0))
w = head_weight(B)
B2 = head_c + (B - head_c) * (1 + (s - 1) * w)[:, None]
h.data.vertices.foreach_set("co", B2.ravel())
h.data.update()
B = B2
J = {n: B[group_idx(h, n)].mean(0) for n in J}
stage("headscale")

# ------------------------------------------------------------------ 3. face units + visemes
FS.load_targets(h, load_microsoft_visemes=False, load_meta_visemes=True, load_arkit_faceunits=True)
kn = [k.name for k in h.data.shape_keys.key_blocks]
missing = [k for k in K.ARKIT52 + K.VISEMES if k not in kn]
assert not missing, missing
# 3b. symmetrise the CC0 units on the topological mirror (G3), add the scripted expression deltas (smile corner up and
# back + nasolabial bulge, cheekSquint lower-lid raise, brow raise x1.3) so runtime calibration is 1.0, and bake the
# look's resting smile into the basis. All before the proxies, so MHCLO interpolation carries the final deltas.
_kbs = h.data.shape_keys.key_blocks
_base = key_co(_kbs[0])
_names = K.ARKIT52 + K.VISEMES
_D = {k: key_co(_kbs[k]) - _base for k in _names}
_pre = max(float(np.linalg.norm(_D["mouthUpperUpLeft"] - K._M(_D["mouthUpperUpRight"], MIR), axis=1).max()), 0)
_D = K.symmetrize(_D, MIR)
_hw = head_weight(_base) * _body
_D = K.expression_correctives(_base, _D, group_w(h, "lips") * _body, _eyeC0, _hw)
for k in _names:
    set_key_co(_kbs[k], _base + _D[k])
report["symmetrize"] = {"mouthUpperUpBeforeMm": round(_pre * 1000, 2)}
rb_ = float(look.get("faceStyle", {}).get("restBlink", 0.0))
if rb_ > 0:
    for S_ in ("Left", "Right"):
        dB_ = _D["eyeBlink" + S_].copy()
        for kb in _kbs:
            set_key_co(kb, key_co(kb) + rb_ * dB_)
        set_key_co(_kbs["eyeBlink" + S_], key_co(_kbs["eyeBlink" + S_]) - rb_ * dB_)
        _D["eyeBlink" + S_] = (1 - rb_) * dB_
    report["restBlinkBaked"] = rb_
rs = float(look.get("faceStyle", {}).get("restSmile", 0.0))
if rs > 0:
    fix = rs * (_D["mouthSmileLeft"] + _D["mouthSmileRight"])
    for kb in _kbs:
        set_key_co(kb, key_co(kb) + fix)
    report["restSmileBaked"] = rs
B = key_co(_kbs[0])

# ------------------------------------------------------------------ 4. proxies
def add(kind, name, typ):
    return HS.add_mhclo_asset(asset(kind, name), h, asset_type=typ, subdiv_levels=0, material_type="MAKESKIN",
                              set_up_rigging=False, interpolate_weights=False, import_subrig=False, import_weights=False)


teeth = add("teeth", "teeth_base", "Teeth")
tongue = add("tongue", "tongue01", "Tongue")
brows = add("eyebrows", look["brows"], "Eyebrows")
lashes = add("eyelashes", look["lashes"], "Eyelashes")
hair = add("hair", look["hair"]["asset"], "Hair")
FS.interpolate_targets(h)
for o in (teeth, tongue, brows, lashes, hair):
    for m in list(o.modifiers):
        o.modifiers.remove(m)
    o.parent = None
stage("proxies")

# eye geometry from the MH eye helpers (rest), then our own eyes replace the MH ones
eyeC, eyeR = {}, {}
for side, gname in (("L", "helper-l-eye"), ("R", "helper-r-eye")):
    P = B[group_idx(h, gname)]
    c = P.mean(0)
    eyeC[side] = c
    # the MH eye helper is a coarse cage ~4% larger than the proxy's eyeball (sphere fit, 2026-10-03)
    eyeR[side] = 0.962 * float(np.linalg.norm(P - c, axis=1).mean())
report["eyes"] = {k: {"center": eyeC[k].round(5).tolist(), "radius": round(eyeR[k], 5)} for k in eyeC}

# ------------------------------------------------------------------ 5. bust cut (skin)
for m in list(h.modifiers):
    h.modifiers.remove(m)
body = np.zeros(len(B), bool)
body[group_idx(h, "body")] = True
lips_w = group_w(h, "lips")
scalp_w = group_w(h, "scalp")
ears_w = group_w(h, "ears")
z_cut = J["joint-l-clavicle"][2] - 0.15
x_cut = abs(J["joint-l-shoulder"][0]) + 0.045
keep = body & (B[:, 2] > z_cut) & (np.abs(B[:, 0]) < x_cut)
# store per-vertex masks as attributes before deleting so they survive the cut
for nm, arr in (("lipsW", lips_w), ("scalpW", scalp_w), ("earsW", ears_w)):
    a = h.data.attributes.new(nm, "FLOAT", "POINT")
    a.data.foreach_set("value", arr.astype(np.float32))
delete_verts(h, ~keep)
for g in list(h.vertex_groups):
    h.vertex_groups.remove(g)
for kb in list(h.data.shape_keys.key_blocks)[1:]:
    if kb.name not in K.ARKIT52 + K.VISEMES:
        h.shape_key_remove(kb)
stage("bustcut")

# ------------------------------------------------------------------ garments + accessories (before the join)
Pk = co(h.data)
ew = None
earsP = {}
_ew = np.zeros(len(h.data.vertices), np.float32)
h.data.attributes["earsW"].data.foreach_get("value", _ew)
for side, sg in (("L", 1), ("R", -1)):
    sel = np.nonzero((_ew > 0.5) & (np.sign(Pk[:, 0]) == sg))[0]
    earsP[side] = Pk[sel[np.argmin(Pk[sel, 2])]]
garm = parts.make_garments(h, look, J, report)
acc = []
lens = None
if "glasses" in look.get("accessory", {}):
    gobj, lens = parts.make_glasses(look, {k: eyeC[k] for k in eyeC}, eyeR["L"], earsP)
    acc.append(gobj)
if "studs" in look.get("accessory", {}):
    acc.append(parts.make_studs(earsP))
select_only(garm + acc)
bpy.context.view_layer.objects.active = garm[0]
bpy.ops.object.join()
garment = garm[0]
garment.name = "garment"
for p_ in garment.data.polygons:
    p_.use_smooth = True
if lens is not None:
    lens.name = "lens"
stage("garments")


def attr(obj, nm):
    a = np.zeros(len(obj.data.vertices), np.float32)
    obj.data.attributes[nm].data.foreach_get("value", a)
    return a


# ------------------------------------------------------------------ teeth: decimate (rigid per jaw) + keys by nearest
def decimate_with_keys(obj, ratio):
    base, D = deltas(obj)
    tmp = obj.copy()
    tmp.data = obj.data.copy()
    bpy.context.collection.objects.link(tmp)
    tmp.shape_key_clear()
    md = tmp.modifiers.new("dec", "DECIMATE")
    md.ratio = ratio
    select_only([tmp])
    bpy.ops.object.modifier_apply(modifier="dec")
    from scipy.spatial import cKDTree
    from scipy.sparse import coo_matrix
    from scipy.sparse.csgraph import connected_components
    P = co(tmp.data)

    def parts(me_, n):
        e = np.empty(len(me_.edges) * 2, np.int64)
        me_.edges.foreach_get("vertices", e)
        e = e.reshape(-1, 2)
        g = coo_matrix((np.ones(len(e)), (e[:, 0], e[:, 1])), shape=(n, n))
        return connected_components(g, directed=False)[1]

    # map within the matching loose part only: a lower incisor must never take an upper tooth's delta (that
    # stretched one tooth into a spike when the jaw opened, 2026-10-03)
    lab_o = parts(obj.data, len(base))
    lab_n = parts(tmp.data, len(P))
    cen_o = {l: base[lab_o == l].mean(0) for l in np.unique(lab_o)}
    idx = np.zeros(len(P), np.int64)
    for l in np.unique(lab_n):
        sel = np.nonzero(lab_n == l)[0]
        c = P[sel].mean(0)
        lo_ = min(cen_o, key=lambda k: np.linalg.norm(cen_o[k] - c))
        src = np.nonzero(lab_o == lo_)[0]
        _, j = cKDTree(base[src]).query(P[sel])
        idx[sel] = src[j]
    tmp.shape_key_add(name="Basis")
    for k, d in D.items():
        if np.abs(d).max() < 1e-6:
            continue
        kb = tmp.shape_key_add(name=k)
        set_key_co(kb, P + d[idx])
    bpy.data.objects.remove(obj)
    return tmp


teeth = decimate_with_keys(teeth, 0.22)
teeth.name = "teeth"


def shift_parts(obj, sel, d):
    """Translate vertices `sel` of obj by d in the basis AND every key (deltas unchanged)."""
    for kb in obj.data.shape_keys.key_blocks:
        c = key_co(kb)
        c[sel] += d
        set_key_co(kb, c)


# Speech shows the UPPER incisors and the lower ones only on wide vowels; MH's teeth sit high behind the upper lip,
# so most visemes showed the lower row and hid the upper one (review item 6). Upper row 1.3 mm down + 1.0 mm forward.
_tb, _tD = deltas(teeth)
_upper = np.linalg.norm(_tD["jawOpen"], axis=1) < 1e-4
mt = look.get("mouth", {})
shift_parts(teeth, np.nonzero(_upper)[0], np.array([0, -mt.get("upperTeethFwd", 0.0010), -mt.get("upperTeethDown", 0.0013)]))
# The tongue rests 2.5 mm higher and 2 mm forward, so its tip reads at aa and the Hindi tongue keys show.
shift_parts(tongue, np.arange(len(tongue.data.vertices)), np.array([0, -mt.get("tongueFwd", 0.002), mt.get("tongueUp", 0.0025)]))
_tb = co(teeth.data)
# gum weight (0 on the enamel .. 1 at the gum line): the top band of the upper row, the bottom band of the lower row
_gum = np.zeros(len(_tb))
for m_ in (_upper, ~_upper):
    z = _tb[m_, 2]
    lo_, hi_ = z.min(), z.max()
    t_ = (z - lo_) / max(hi_ - lo_, 1e-6)
    # a thin gum band only (speech rarely shows gum; a 0.62-0.8 band read as a red strip at jaw 0.3)
    _gum[m_] = smoothstep(0.8, 0.95, t_) if m_ is _upper else smoothstep(0.2, 0.05, t_)

# ------------------------------------------------------------------ mouth interior: region tags + a dark bag
def tag(obj, region):
    a = obj.data.attributes.new("region", "FLOAT", "POINT")
    a.data.foreach_set("value", np.full(len(obj.data.vertices), region, np.float32))


tag(h, 0.0)
tag(teeth, 1.0)
# _region encodes the gum weight in its fraction (1.00 enamel .. 1.45 gum); every reader rounds to the region id
teeth.data.attributes["region"].data.foreach_set("value", (1.0 + 0.45 * _gum).astype(np.float32))
tag(tongue, 2.0)
# Mouth bag: an ellipsoid shell behind the teeth; its lower half follows the jaw (lower-teeth key deltas).
tb, tD = deltas(teeth)
tc = tb.mean(0)
bm = bmesh.new()
bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=8, radius=1.0)
Pb = np.array([v.co[:] for v in bm.verts])
ext = np.array([0.026, 0.03, 0.022])
Pb = tc + np.array([0, 0.012, -0.006]) + Pb * ext
for v, p in zip(bm.verts, Pb):
    v.co = Vector(p)
bmesh.ops.reverse_faces(bm, faces=bm.faces)          # normals inward: we see the inside
bag_me = bpy.data.meshes.new("bag")
bm.to_mesh(bag_me)
bm.free()
bag = bpy.data.objects.new("bag", bag_me)
bpy.context.collection.objects.link(bag)
tag(bag, 3.0)
bag.shape_key_add(name="Basis")
from scipy.spatial import cKDTree
lower = tb[:, 2] < tc[2]
tree = cKDTree(tb[lower])
_, ni = tree.query(Pb)
wlow = smoothstep(tc[2] + 0.004, tc[2] - 0.01, Pb[:, 2])
for k, d in tD.items():
    dd = d[lower][ni] * wlow[:, None]
    if np.abs(dd).max() < 1e-6:
        continue
    set_key_co(bag.shape_key_add(name=k), Pb + dd)

# ------------------------------------------------------------------ join face = skin + teeth + tongue + bag
for o in (teeth, tongue, bag):
    if not o.data.shape_keys:
        o.shape_key_add(name="Basis")
    _v = o.data.attributes.new("vid", "INT", "POINT")
    _v.data.foreach_set("value", np.full(len(o.data.vertices), -1, np.int32))
select_only([h, teeth, tongue, bag])
bpy.context.view_layer.objects.active = h
bpy.ops.object.join()
face = h
face.name = "face"
stage("mouth")

# ------------------------------------------------------------------ tongue extras
region = np.round(attr(face, "region"))
fb, FD = deltas(face)
tsel = np.nonzero(region == 2.0)[0]
tx = K.tongue_extras(fb[tsel])
for k, d in tx.items():
    full = np.zeros_like(fb)
    full[tsel] = d
    set_key_co(face.shape_key_add(name=k), fb + full)

# ------------------------------------------------------------------ correctives from the rig's own deltas
fb, FD = deltas(face)
skin = region == 0.0
lipsW = attr(face, "lipsW")
reg = {}
for S, c in (("Left", eyeC["L"]), ("Right", eyeC["R"])):
    d = np.linalg.norm(fb - c, axis=1)
    near = (d < eyeR["L"] * 1.9) & skin
    reg["lidUpper" + S] = (near & (fb[:, 2] > c[2] - 0.001)).astype(float)
    reg["lidLower" + S] = (near & (fb[:, 2] <= c[2] - 0.001)).astype(float)
lipsel = np.nonzero((lipsW > 0.3) & skin)[0]
jaw_m = np.linalg.norm(FD["jawOpen"], axis=1)
upper = lipsel[jaw_m[lipsel] < 0.4 * jaw_m[lipsel].max()]
lowerl = lipsel[jaw_m[lipsel] >= 0.4 * jaw_m[lipsel].max()]
dist, nn = cKDTree(fb[lowerl]).query(fb[upper])
pair = dist < 0.0016
reg["lipSealUpper"] = upper[pair]
reg["lipSealLower"] = lowerl[nn[pair]]
# Lip seal by point-to-SURFACE distance (iteration 2): every upper-lip vertex within 2.4 mm of the lower lip's surface
# (and vice versa) is a contact vertex; the gap is its distance to the opposite surface. Vertex pairs alone measured
# 0.5-0.7 mm p95 at rest after the first build's seal (many-to-one pairs) and could not converge both ways.
F_all = tris_of(face.data)
_up_set = np.zeros(len(fb), bool); _up_set[upper] = True
_lo_set = np.zeros(len(fb), bool); _lo_set[lowerl] = True
UT = F_all[np.all(_up_set[F_all], axis=1)]
LT = F_all[np.all(_lo_set[F_all], axis=1)]


def lip_contacts(state, reach=0.0024):
    bu = BVHTree.FromPolygons([Vector(p) for p in state], UT.tolist())
    bl = BVHTree.FromPolygons([Vector(p) for p in state], LT.tolist())
    out = []
    for vs, bvh_ in ((upper, bl), (lowerl, bu)):
        for v in vs:
            loc, _, _, d = bvh_.find_nearest(Vector(state[v]), reach)
            if loc is not None:
                out.append((int(v), np.array(loc), float(d)))
    return out
reg["lips"] = np.clip(lipsW * skin, 0, 1)
bi = np.linalg.norm(FD["browInnerUp"], axis=1)
reg["browInner"] = ((bi > 0.001) & (np.abs(fb[:, 0]) < 0.022) & skin).astype(float)
for S, sg in (("Left", 1), ("Right", -1)):
    corner = lipsel[np.argmax(sg * fb[lipsel, 0])]
    dc = np.linalg.norm(fb - fb[corner], axis=1)
    reg["mouthCorner" + S] = np.exp(-(dc / 0.012) ** 2) * skin
report["lipSealPairs"] = int(pair.sum())


def seal_fix(state, falloff=0.007):
    """Delta that moves each contact vertex half-way to the opposite lip's surface, spread over the lips."""
    fix = np.zeros_like(state)
    src = []
    for v, loc, d in lip_contacts(state):
        fix[v] = 0.5 * (loc - state[v])
        src.append(v)
    if not src:
        return fix
    return K._spread(state, fix, np.array(sorted(set(src))), reg["lips"], radius=falloff)


# MH's neutral rests with the lips ~1.5 mm apart. A teacher at rest has a closed, relaxed mouth (and parted lips at
# rest read as a different register), so the basis is sealed; every key keeps its delta, so nothing else moves.
def gap_p95(state):
    g = [d for _, _, d in lip_contacts(state)]
    return float(np.percentile(g, 95)) if g else 0.0


def seal_iter(state_fn, apply_fn, label, bar=0.00025, n=12):
    """Repeat the midpoint seal until the contact-pair gap p95 <= bar: a lower-lip vertex can be the nearest partner of
    several upper ones, so one pass leaves 0.5-0.7 mm (G5 before, 2026-10-03)."""
    tot = 0.0
    for it in range(n):
        st = state_fn()
        if gap_p95(st) <= bar:
            break
        f = seal_fix(st)
        apply_fn(f)
        tot = max(tot, float(np.abs(f).max()))
    report.setdefault("lipSealIters", {})[label] = it
    return tot


kbs = face.data.shape_keys.key_blocks


def _apply_all(f):
    for kb in kbs:
        set_key_co(kb, key_co(kb) + f)


fix0 = seal_iter(lambda: key_co(kbs[0]), _apply_all, "rest")
fb, FD = deltas(face)
# viseme_PP must close the lips (the bilabial closure bar): seal its own pose the same way.
fixpp = seal_iter(lambda: key_co(kbs["viseme_PP"]), lambda f: set_key_co(kbs["viseme_PP"], key_co(kbs["viseme_PP"]) + f), "viseme_PP")
fb, FD = deltas(face)
fixcl = seal_iter(lambda: key_co(kbs[0]) + (key_co(kbs["jawOpen"]) - key_co(kbs[0])) + (key_co(kbs["mouthClose"]) - key_co(kbs[0])),
                  lambda f: set_key_co(kbs["mouthClose"], key_co(kbs["mouthClose"]) + f), "mouthClose")
fb, FD = deltas(face)
report["lipSealFixMm"] = {"rest": round(fix0 * 1000, 2), "viseme_PP": round(fixpp * 1000, 2), "mouthClose": round(fixcl * 1000, 2)}
CO = K.correctives(fb, FD, reg)
for k, d in CO.items():
    set_key_co(face.shape_key_add(name=k), fb + d)
stage("correctives")

# ------------------------------------------------------------------ our eyes (sclera/iris ball + cornea bulge)
def make_eyes(nu, nv, name):
    bm = bmesh.new()
    uvl = bm.loops.layers.uv.new("UVMap")
    for side in ("L", "R"):
        c, r = eyeC[side], eyeR[side]
        tmp = bmesh.new()
        bmesh.ops.create_uvsphere(tmp, u_segments=nu, v_segments=nv, radius=1.0)
        # rotate so the pole points forward (-Y): pole is +Z in create_uvsphere
        for v in tmp.verts:
            x, y, z = v.co
            d = np.array([x, -z, y])                  # +Z pole -> -Y
            ang = math.degrees(math.acos(max(-1, min(1, -d[1]))))
            rr = r
            # cornea: sphere of radius 0.693 r, apex 0.07 r beyond the ball -> limbus radius 0.48 r (human: ~6 of 12 mm)
            rc = 0.693 * r
            cc = np.array([0, -(1.07 * r - rc), 0])
            # ray from eye centre along d hits the cornea sphere at t: |t d - cc| = rc
            b = d @ cc
            disc = b * b - (cc @ cc - rc * rc)
            if disc > 0:
                t = b + math.sqrt(disc)
                rr = max(rr, t)
            v.co = Vector(c + d * rr)
        m = bpy.data.meshes.new("t")
        tmp.to_mesh(m)
        tmp.free()
        off = len(bm.verts)
        bm.verts.ensure_lookup_table()
        vmap = [bm.verts.new(v.co) for v in m.vertices]
        for p in m.polygons:
            f = bm.faces.new([vmap[i] for i in p.vertices])
            for loop, vi in zip(f.loops, p.vertices):
                q = (np.array(m.vertices[vi].co) - c) / r
                loop[uvl].uv = (0.5 + 0.5 * q[0], 0.5 + 0.5 * q[2])
        bpy.data.meshes.remove(m)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    return ob


eyes = make_eyes(36, 28, "eyes")
eyes_lo = make_eyes(14, 10, "eyes_lo")

# ------------------------------------------------------------------ brows + lashes cards; hair (no keys)
cards = None
for o in (brows, lashes):
    if not o.data.shape_keys:
        o.shape_key_add(name="Basis")
    for kb in list(o.data.shape_keys.key_blocks)[1:]:
        if kb.name not in K.ARKIT52:
            o.shape_key_remove(kb)
tag(brows, 4.0)
tag(lashes, 5.0)
brows.name, lashes.name = "brows", "lashes"
# the cards atlas is brows | lashes (texture.py): pack each card set into its half. Both sets had sampled the WHOLE
# atlas since the first build (tan patchy brows, review item 11, were partly this)
for o_, u0 in ((brows, 0.0), (lashes, 0.5)):
    _ul = o_.data.uv_layers.active
    _uv = np.empty(len(_ul.data) * 2)
    _ul.data.foreach_get("uv", _uv)
    _uv = _uv.reshape(-1, 2)
    _uv[:, 0] = u0 + np.clip(_uv[:, 0], 0, 1) * 0.5
    _ul.data.foreach_set("uv", _uv.ravel())
# lower lash cards read as dark specks under the eye at every framing (review item 11): keep the upper lashes only
# (the lower lid line is carried by the skin's lid-crease shade and the eye's wet-line darkening)
_lp = co(lashes.data)
_low = np.zeros(len(_lp), bool)
for side, sg in (("L", 1), ("R", -1)):
    _low |= (np.sign(_lp[:, 0]) == sg) & (_lp[:, 2] < eyeC[side][2] - 0.0015)
if look.get("lowerLashes", False) is False and _low.any():
    delete_verts(lashes, _low)
    report["lowerLashesRemovedVerts"] = int(_low.sum())
hair.shape_key_clear()
hair.name = "hair"
# ---- hair silhouette edits (review item 12): all scripted on the CC0 card hair, rigid to the head
hP = co(hair.data)
hcfg = look["hair"]
skullBackY = float(co(h.data)[(attr(h, "scalpW") > 0.3), 1].max()) if "scalpW" in h.data.attributes else hP[:, 1].max() - 0.03
hc = J["joint-head"] + np.array([0, 0.005, 0.06])
if hcfg.get("crownVolume"):
    # lift the hair off the skull above the ears, most at the crown: breaks the "helmet" profile
    r_ = hP - hc
    wv = smoothstep(J["joint-head"][2] + 0.02, J["joint-head"][2] + 0.12, hP[:, 2])
    hP = hc + r_ * (1 + hcfg["crownVolume"] * wv)[:, None]
if hcfg.get("raisePonytail"):
    # the tail: hair behind the skull. Lift the tie and the tail by raise (m), carried smoothly into the cap near the tie
    tail = smoothstep(skullBackY + 0.002, skullBackY + 0.02, hP[:, 1])
    tieZ = float(np.percentile(hP[tail > 0.9, 2], 92)) if (tail > 0.9).any() else J["joint-head"][2]
    tie = np.array([0.0, skullBackY + 0.01, tieZ])
    near = np.exp(-(np.linalg.norm(hP - tie, axis=1) / 0.05) ** 2)
    lift = hcfg["raisePonytail"]
    w_ = np.maximum(tail, near * 0.8)
    hP[:, 2] += lift * w_
    # tilt the hanging tail out from the neck by ~12 deg about the (raised) tie, so it clears the collar
    ang = np.radians(hcfg.get("tailTiltDeg", 12)) * tail * smoothstep(tieZ + lift, tieZ + lift - 0.08, hP[:, 2])
    rel = hP - (tie + np.array([0, 0, lift]))
    c_, s_ = np.cos(ang), np.sin(ang)
    # rotation in the y-z plane: points below the tie move backwards (+y) as the angle grows
    hP[:, 1] = tie[1] + rel[:, 1] * c_ - rel[:, 2] * s_
    hP[:, 2] = tie[2] + lift + rel[:, 1] * s_ + rel[:, 2] * c_
    report["ponytail"] = {"tieZ": round(tieZ, 4), "lift": lift}
hair.data.vertices.foreach_set("co", hP.ravel())
hair.data.update()
if hcfg.get("clipFringe"):
    # cards that hang in front of the forehead below the hairline read as black scratches across the face
    eyeZ = 0.5 * (eyeC["L"][2] + eyeC["R"][2])
    eyeY = 0.5 * (eyeC["L"][1] + eyeC["R"][1])
    bad = (hP[:, 1] < eyeY - 0.006) & (hP[:, 2] < eyeZ + hcfg["clipFringe"]) & (np.abs(hP[:, 0]) < 0.06)
    me_ = hair.data
    kill = np.zeros(len(hP), bool)
    for p_ in me_.polygons:
        vs = list(p_.vertices)
        if bad[vs].mean() > 0.5:
            kill[vs] = True
    if kill.any():
        delete_verts(hair, kill)
    report["fringeClippedVerts"] = int(kill.sum())
# hair atlas: the MH card texture (CC0) fills u in [0, 0.74]; u in [0.76, 0.98] is our opaque strand column
uvl = hair.data.uv_layers.active
uv = np.empty(len(uvl.data) * 2)
uvl.data.foreach_get("uv", uv)
uv = uv.reshape(-1, 2)
uv[:, 0] = uv[:, 0] * 0.74
uvl.data.foreach_set("uv", uv.ravel())
if look["hair"].get("style") == "bun":
    hb = co(hair.data)
    nape = np.array([0.0, hb[:, 1].max() - 0.012, J["joint-head"][2] + 0.012])
    bun = parts.make_bun(look, J, nape)
    select_only([hair, bun])
    bpy.context.view_layer.objects.active = hair
    bpy.ops.object.join()
stage("parts")

# ------------------------------------------------------------------ 6. validation
LIM = {"default": 0.026, "jawOpen": 0.045, "tongueOut": 0.035, "viseme_aa": 0.04, "viseme_O": 0.035,
       "viseme_E": 0.035, "mouthSmileLeft": 0.03, "mouthSmileRight": 0.03, "mouthLeft": 0.03, "mouthRight": 0.03,
       "jawLeft": 0.03, "mouthClose": 0.045, "jawRight": 0.03, "jawForward": 0.03, "tongueCurl": 0.03, "cheekPuff": 0.03}
fb, FD = deltas(face)
allok = True
for k, d in FD.items():
    ok, rec = K.validate(k, d, fb, LIM)
    report["keys"].append(rec)
    allok &= ok
report["gates"]["G1_names"] = {"expected": len(K.tier_keys("H")), "present": sum(k in FD for k in K.tier_keys("H"))}
report["gates"]["G2_bounded_nonempty"] = {"ok": bool(allok), "failed": [r["key"] for r in report["keys"] if not r["ok"]]}
# G3 mirror: each Left key against the mirror of its Right key, on the TOPOLOGICAL twin (vid map from the symmetric
# base), so the identity's seeded asymmetry is not counted as key asymmetry. Bar 0.5 mm.
_vid = np.zeros(len(face.data.vertices), np.int32)
face.data.attributes["vid"].data.foreach_get("value", _vid)
_cur = {int(v): i for i, v in enumerate(_vid) if v >= 0}
mir_idx = np.array([_cur.get(int(MIR[v]), -1) if v >= 0 else -1 for v in _vid])
mir = {}
for k in K.ARKIT52:
    if k.endswith("Left"):
        r_ = k[:-4] + "Right"
        if r_ in FD:
            mir[k[:-4]] = round(K.mirror_error_topo(FD[k], FD[r_], mir_idx, skin) * 1000, 2)
report["gates"]["G3_mirror_mm"] = mir
report["gates"]["G3_pass"] = bool(max(mir.values()) <= 0.5)

# G4 lid seal: rays from the eyeball centre through cornea-front vertices must hit the skin at eyeBlink = 1
F = tris_of(face.data)
skin_tris = F[np.all(skin[F], axis=1)]
E = co(eyes.data)


def skin_bvh(state):
    return BVHTree.FromPolygons([Vector(p) for p in state], skin_tris.tolist())


def lid_escape(state, extra=None):
    bvh = skin_bvh(state)
    out = {}
    for side, sg in (("L", 1), ("R", -1)):
        c = eyeC[side]
        sel = E[(np.sign(E[:, 0]) == sg)]
        fwd = sel[(sel - c)[:, 1] < -0.85 * eyeR[side]]         # cornea cap
        esc = 0
        for p in fwd:
            dv = Vector(p - c).normalized()
            hit = bvh.ray_cast(Vector(c) + dv * (eyeR[side] * 0.5), dv, 0.05)
            esc += hit[0] is None
        out[side] = round(100 * esc / max(1, len(fwd)), 2)
    return out


blink = fb + FD["eyeBlinkLeft"] + FD["eyeBlinkRight"]
report["gates"]["G4_lid_seal_escaped_pct"] = {
    "open": lid_escape(fb), "blink": lid_escape(blink),
    "blink+lookDown+corrective": lid_escape(blink + FD["eyeLookDownLeft"] + FD["eyeLookDownRight"]
                                            + FD["eyeBlink_eyeLookDownLeft"] + FD["eyeBlink_eyeLookDownRight"]),
    "blink+squint+corrective": lid_escape(blink + FD["eyeSquintLeft"] + FD["eyeSquintRight"]
                                          + FD["eyeBlink_eyeSquintLeft"] + FD["eyeBlink_eyeSquintRight"]),
}

# G5 lip seal: upper/lower contact pairs within 0.3 mm (reported in mm, p95 and max)
def seal(state):
    """Contact-vertex distance to the opposite lip SURFACE, mm (TEACHER-VISUAL H5 bar: <= 0.3)."""
    g = np.array([d for _, _, d in lip_contacts(state)]) * 1000
    return {"p95": round(float(np.percentile(g, 95)), 3), "max": round(float(g.max()), 3), "contacts": int(len(g))} if len(g) else None


def aperture(state):
    """% of rays from inside the mouth toward the lip line that escape between the lips (0 = sealed)."""
    bvh = skin_bvh(state)
    c = state[region == 3].mean(0)
    tgt = 0.5 * (state[reg["lipSealUpper"]] + state[reg["lipSealLower"]])
    esc = 0
    for p in tgt:
        d = Vector(p - c)
        hit = bvh.ray_cast(Vector(c), d.normalized(), d.length + 0.02)
        esc += hit[0] is None
    return round(100 * esc / max(1, len(tgt)), 1)


report["gates"]["G5_lip_aperture_escaped_pct"] = {
    "rest": aperture(fb), "viseme_PP": aperture(fb + FD["viseme_PP"]),
    "jawOpen0.3+mouthClose0.3": aperture(fb + 0.3 * FD["jawOpen"] + 0.3 * FD["mouthClose"]),
    "jawOpen0.3+mouthClose0.3+corrective": aperture(fb + 0.3 * FD["jawOpen"] + 0.3 * FD["mouthClose"]
                                                    + 0.09 * FD["jawOpen_mouthClose"]),
    "jawOpen0.15": aperture(fb + 0.15 * FD["jawOpen"]),
}
report["gates"]["G5_lip_gap_mm"] = _g5 = {
    "rest": seal(fb), "viseme_PP": seal(fb + FD["viseme_PP"]),
    "jawOpen0.3+mouthClose0.3": seal(fb + 0.3 * FD["jawOpen"] + 0.3 * FD["mouthClose"]),
    "jawOpen0.3+mouthClose0.3+corrective": seal(fb + 0.3 * FD["jawOpen"] + 0.3 * FD["mouthClose"]
                                                + 0.09 * FD["jawOpen_mouthClose"]),
}

# G5 fails on millimetres (TEACHER-VISUAL H5: gap <= 0.3 mm) AND on ray escape, never on escape alone
report["gates"]["G5_pass"] = bool(all(v is None or v["p95"] <= 0.3 for v in _g5.values())
                                  and all(v == 0 for k, v in report["gates"]["G5_lip_aperture_escaped_pct"].items() if k != "jawOpen0.15"))

# G6 teeth/tongue inside the lips: a segment from the mouth-bag centre to each sampled tooth/tongue vertex must
# not cross the skin (a crossing means the vertex is outside the face) -- at rest and at every viseme.
inner = np.nonzero((region == 1) | (region == 2))[0]
samp = inner[rng.choice(len(inner), size=min(300, len(inner)), replace=False)]
ctr = fb[region == 3].mean(0)


def pokes(state):
    bvh = skin_bvh(state)
    n = 0
    c = Vector(ctr + (state[region == 3].mean(0) - fb[region == 3].mean(0)))
    for i in samp:
        p = Vector(state[i])
        d = p - c
        L = d.length
        hit = bvh.ray_cast(c, d.normalized(), L)
        n += hit[0] is not None
    return n


g6 = {"rest": pokes(fb)}
for k in K.VISEMES + ["jawOpen", "tongueOut", "tongueTipUp", "tongueCurl", "tongueWide"]:
    g6[k] = pokes(fb + FD[k] + (0.3 * FD["jawOpen"] if k.startswith("tongue") and k != "tongueOut" else 0))
report["gates"]["G6_inner_vertices_outside_lips"] = {"sample": int(len(samp)), **g6}

# Eyelids never inside the eyeball: lid vertices within the eye's angular cap keep distance >= ball radius
def lid_pen(state):
    o = {}
    for side, S in (("L", "Left"), ("R", "Right")):
        c = eyeC[side]
        sel = np.nonzero(reg["lidUpper" + S] + reg["lidLower" + S])[0]
        sel = sel[(c[1] - fb[sel, 1]) > 0.45 * eyeR[side]]          # the visible front cap only
        d = np.linalg.norm(state[sel] - c, axis=1) / eyeR[side]
        o[side] = int((d < 0.995).sum())
    return o


report["gates"]["lid_inside_eyeball_count"] = {k: lid_pen(fb + FD[k]) for k in
    ["eyeBlinkLeft", "eyeLookUpLeft", "eyeLookDownLeft", "eyeLookInLeft", "eyeLookOutLeft", "eyeWideLeft", "eyeSquintLeft"]}
rest_pen = lid_pen(fb)
report["gates"]["lid_inside_eyeball_count"] = {k: {s_: v[s_] - rest_pen[s_] for s_ in v}
                                               for k, v in report["gates"]["lid_inside_eyeball_count"].items()}
report["gates"]["lid_inside_eyeball_count"]["_note"] = "increase over rest (rest baseline %s)" % rest_pen
stage("validate")

# ------------------------------------------------------------------ face UVs: MH islands, re-packed for the bust
def pack_face_uvs(ob, face_gain=2.4, patch=(0.992, 0.992), face_poly_mask=None):
    me = ob.data
    reg_ = attr(ob, "region")
    uvl = me.uv_layers.active
    L = len(me.loops)
    uv = np.empty(L * 2)
    uvl.data.foreach_get("uv", uv)
    uv = uv.reshape(-1, 2)
    lv = np.empty(L, np.int64)
    me.loops.foreach_get("vertex_index", lv)
    P = co(me)
    fb_, FD_ = deltas(ob)
    moving = np.zeros(len(P), bool)
    for k in K.ARKIT52:
        moving |= np.linalg.norm(FD_[k], axis=1) > 3e-4
    parent = np.arange(L)

    def find(a):
        while parent[a] != a:
            parent[a] = parent[parent[a]]
            a = parent[a]
        return a

    def union(a, b):
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb

    skinface = []
    for p in me.polygons:
        ls = list(p.loop_indices)
        is_skin = all(reg_[v] == 0 for v in p.vertices)
        skinface.append(is_skin)
        for l in ls[1:]:
            union(ls[0], l)
    by_v = {}
    for l in range(L):
        key = (lv[l], round(uv[l, 0], 6), round(uv[l, 1], 6))
        if key in by_v:
            union(l, by_v[key])
        else:
            by_v[key] = l
    roots = np.array([find(l) for l in range(L)])
    isl = {}
    for p, sk in zip(me.polygons, skinface):
        ls = list(p.loop_indices)
        if not sk:
            uv[ls] = patch
            continue
        isl.setdefault(roots[ls[0]], []).append(p)
    boxes = []
    for r_, polys in isl.items():
        ls = np.array([l for p in polys for l in p.loop_indices])
        a3 = sum(p.area for p in polys)
        auv = 0.0
        for p in polys:
            q = uv[list(p.loop_indices)]
            auv += 0.5 * abs(np.dot(q[:, 0], np.roll(q[:, 1], 1)) - np.dot(q[:, 1], np.roll(q[:, 0], 1)))
        if face_poly_mask is not None:
            g = face_gain if np.mean([face_poly_mask[p.index] for p in polys]) > 0.5 else 1.0
        else:
            g = face_gain if moving[[v for p in polys for v in p.vertices]].mean() > 0.2 else 1.0
        sc = math.sqrt(a3 / max(auv, 1e-12)) * g
        lo_ = uv[ls].min(0)
        boxes.append([ls, lo_, (uv[ls].max(0) - lo_) * sc, sc])
    boxes.sort(key=lambda b: -b[2][1])
    tot = sum(b[2][0] * b[2][1] for b in boxes)
    W = math.sqrt(tot) * 1.25
    W = max(W, max(b[2][0] for b in boxes))
    x = y = rowh = 0.0
    margin = W * 0.012
    for b in boxes:
        if x + b[2][0] > W:
            x, y, rowh = 0.0, y + rowh + margin, 0.0
        b.append((x, y))
        x += b[2][0] + margin
        rowh = max(rowh, b[2][1])
    Hh = y + rowh
    S = 0.975 / max(W, Hh)
    for ls, lo_, size, sc, (ox, oy) in boxes:
        uv[ls] = ((uv[ls] - lo_) * sc + np.array([ox, oy])) * S
    uvl.data.foreach_set("uv", uv.ravel())
    return {"islands": len(boxes), "fill": round(float(tot * S * S), 3)}


def unwrap_face(ob):
    """Re-unwrap the skin: one angle-based chart for the expressive face, smart-projected charts for the rest."""
    me = ob.data
    reg_ = attr(ob, "region")
    P = co(me)
    eL = eyeC["L"]
    chin_z = P[(reg_ == 0) & (np.abs(P[:, 0]) < 0.01)][:, 2]
    in_face = (reg_ == 0) & (P[:, 1] < eL[1] + 0.03) & (P[:, 2] > eL[2] - 0.11) & (P[:, 2] < eL[2] + 0.075) \
        & (np.abs(P[:, 0]) < 0.068)
    sel_face = np.array([all(in_face[v] for v in p.vertices) for p in me.polygons])
    skin_f = np.array([all(reg_[v] == 0 for v in p.vertices) for p in me.polygons])
    select_only([ob])
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_mode(type="FACE")
    bpy.ops.mesh.select_all(action="DESELECT")
    bpy.ops.object.mode_set(mode="OBJECT")
    me.polygons.foreach_set("select", sel_face)
    bpy.ops.object.mode_set(mode="EDIT")
    r1 = bpy.ops.uv.unwrap(method="ANGLE_BASED", margin=0.002)
    bpy.ops.mesh.select_all(action="DESELECT")
    bpy.ops.object.mode_set(mode="OBJECT")
    me.polygons.foreach_set("select", skin_f & ~sel_face)
    bpy.ops.object.mode_set(mode="EDIT")
    r2 = bpy.ops.uv.smart_project(angle_limit=math.radians(60), island_margin=0.002)
    bpy.ops.object.mode_set(mode="OBJECT")
    return sel_face, (r1, r2)


face_sel, unwrap_res = unwrap_face(face)
report["faceUV"] = pack_face_uvs(face, face_poly_mask=face_sel)
report["faceUV"]["unwrap"] = [str(r) for r in unwrap_res]
stage("uv")

# ------------------------------------------------------------------ bookkeeping
report["counts"] = {o.name: {"verts": len(o.data.vertices), "tris": int(sum(len(p.vertices) - 2 for p in o.data.polygons)),
                             "keys": (len(o.data.shape_keys.key_blocks) - 1) if o.data.shape_keys else 0}
                    for o in bpy.data.objects if o.type == "MESH"}
report["joints"] = {k: v.round(5).tolist() for k, v in J.items() if k in (
    "joint-neck", "joint-head", "joint-l-eye", "joint-r-eye", "joint-l-clavicle", "joint-r-clavicle",
    "joint-l-shoulder", "joint-r-shoulder", "joint-spine-1", "joint-spine-2", "joint-spine-3", "joint-jaw")}
report["eyeC"] = {k: v.tolist() for k, v in eyeC.items()}
report["eyeR"] = eyeR
report["zCut"], report["xCut"] = float(z_cut), float(x_cut)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(args.out, "base.blend"))
json.dump(report, open(os.path.join(args.out, "report.json"), "w"), indent=1)
stage("saved")
print(json.dumps(report["gates"], indent=1))
print(json.dumps(report["counts"], indent=1))

sys.stdout.flush()
os._exit(0)   # bpy 4.2 can segfault in interpreter teardown; everything is written by now
