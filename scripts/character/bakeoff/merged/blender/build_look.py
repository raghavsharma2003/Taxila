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

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
# shared, unchanged helpers (mpfb_env, identity_sculpt) come from the main pipeline
sys.path.insert(1, os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../../blender"))
import numpy as np
import bpy, bmesh
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from mpfb_env import (enable_mpfb, asset, co, key_co, set_key_co, deltas, tris_of, smoothstep, select_only,
                      delete_verts, USER_DATA)
import keys as K
import parts
import hair_v3
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
_B0sym = co(h.data)          # the still-symmetric base: mouth corners are picked here, by vertex id (keys.mouth_corner_vids)
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
# ---- merged (ai-portrait-wrap hook): wrap the basis onto the portrait reconstruction (identity/wrap.py), after the
# identity sculpt and BEFORE the head scale, face units, visemes, proxies, correctives and lip seal, so all 82 keys
# (v3's MakeHuman expression units included) are built on the wrapped basis
def _eye_radius(P_):
    return {s_: float(np.linalg.norm(P_[group_idx(h, g_)] - P_[group_idx(h, g_)].mean(0), axis=1).mean()) for s_, g_ in (("L", "helper-l-eye"), ("R", "helper-r-eye"))}
_eyeR_pre = _eye_radius(B)
if look.get("wrap"):
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "identity"))
    import wrap as WR
    _Bpre = B.copy()
    B, report["wrap"] = WR.apply(B, look["wrap"], head_weight(B), log=lambda m: print(f"[build:{look['id']}] {m}", flush=True), mir=MIR)
    # the eye helper (the cage our eyeball is fitted to) moves RIGIDLY with the field's mean over it: the free field
    # shrank it to 0.87 of its radius (measured, this build and ai-portrait-wrap's: eyeR 12.9 vs 14.8 mm), which is the
    # 'iris looks small' / CG-eye read; the lids follow the field, the ball keeps its size
    # Rendered at full size (ratio 1.0) the ball read as a doll eye: v3's 14.8 mm ball carries a 14.2 mm iris (a human
    # iris is ~11.7 mm), so the ball takes a UNIFORM scale (wrap.eyeScale; "auto" = the field's own mean radius change)
    # and stays a sphere.
    if look["wrap"].get("rigidEyes", True):
        for g_ in ("helper-l-eye", "helper-r-eye"):
            ix_ = group_idx(h, g_)
            c0_, c1_ = _Bpre[ix_].mean(0), B[ix_].mean(0)
            es_ = look["wrap"].get("eyeScale", "auto")
            if es_ == "auto":
                es_ = float(np.linalg.norm(B[ix_] - c1_, axis=1).mean() / np.linalg.norm(_Bpre[ix_] - c0_, axis=1).mean())
            B[ix_] = c1_ + (_Bpre[ix_] - c0_) * float(es_)
            report.setdefault("eyeScale", {})[g_] = round(float(es_), 4)
    # ... and the lids, which the field drew in around a smaller opening, are conformed OUT onto the full-size ball:
    # skin vertices on the front cap of each eye closer than 1.015 r to its centre are pushed radially to it, the push
    # spread smoothly over the neighbourhood (Gaussian, 3 mm) so the lid keeps its shape (rest: 160 lid vertices per eye
    # inside the ball without this, measured)
    if look["wrap"].get("rigidEyes", True) and look["wrap"].get("conformLids", True):
        from scipy.spatial import cKDTree as _KD
        _push = np.zeros_like(B)
        for g_ in ("helper-l-eye", "helper-r-eye"):
            ix_ = group_idx(h, g_)
            c_ = B[ix_].mean(0); r_ = 0.962 * float(np.linalg.norm(B[ix_] - c_, axis=1).mean())
            d_ = B - c_; n_ = np.linalg.norm(d_, axis=1)
            sel_ = np.nonzero(_body & (n_ < 1.015 * r_) & (-d_[:, 1] > 0.2 * r_))[0]
            _push[sel_] += (d_[sel_] / n_[sel_, None]) * (1.015 * r_ - n_[sel_])[:, None]
        src_ = np.nonzero(np.linalg.norm(_push, axis=1) > 0)[0]
        if len(src_):
            kd_ = _KD(B[src_])
            near_ = np.nonzero(_body & (kd_.query(B)[0] < 0.006))[0]
            sm_ = np.zeros_like(B); ws_ = np.zeros(len(B))
            for i_ in near_:
                j_ = kd_.query_ball_point(B[i_], 0.006)
                wj_ = np.exp(-(np.linalg.norm(B[src_[j_]] - B[i_], axis=1) / 0.003) ** 2)
                sm_[i_] = (wj_[:, None] * _push[src_[j_]]).sum(0) / max(wj_.sum(), 1e-9)
                ws_[i_] = 1.0
            # keep the full push where it was needed (the spread only fills around it)
            sm_ = np.where((np.linalg.norm(_push, axis=1) > np.linalg.norm(sm_, axis=1))[:, None], _push, sm_)
            B = B + sm_
            report["lidConform"] = {"pushedVerts": int(len(src_)), "maxMm": round(float(np.linalg.norm(_push, axis=1).max() * 1000), 2)}
    # profile (silhouette) term (identity/profilefit.py): the face front's depth by height and the jaw underside's
    # height, fitted to the true 90 deg reference; symmetric by construction (functions of height and |x|)
    if look["wrap"].get("profileCorrection") and os.path.exists(look["wrap"]["profileCorrection"]):
        import profilefit as PFIT
        B, report["profileFit"] = PFIT.apply(B, look["wrap"]["profileCorrection"], head_weight(B), _body, scale=float(look.get("headScale", 1.0)),
                                            log=lambda m: print(f"[build:{look['id']}] {m}", flush=True))
    h.data.vertices.foreach_set("co", B.ravel())
    h.data.update()
    _eyeC0 = {s_: B[group_idx(h, g_)].mean(0) for s_, g_ in (("L", "helper-l-eye"), ("R", "helper-r-eye"))}
    stage("wrap")
# stylised-premium lesson: check the eyeball radius after ANY edit of the eye region (a field that skipped the eye
# helper grew the lids around an unscaled ball and G4 still passed). Ratio to the pre-edit helper radius per side.
_eyeR_post = _eye_radius(B)
report["gates"]["eyeballRadiusRatio"] = {s_: round(_eyeR_post[s_] / _eyeR_pre[s_], 4) for s_ in _eyeR_pre}
# pass = the ball is a sphere at the INTENDED scale (no field distortion of the helper): radius spread / mean < 2%
_sph = {s_: float(np.linalg.norm(B[group_idx(h, g_)] - B[group_idx(h, g_)].mean(0), axis=1).std() /
                  np.linalg.norm(B[group_idx(h, g_)] - B[group_idx(h, g_)].mean(0), axis=1).mean()) for s_, g_ in (("L", "helper-l-eye"), ("R", "helper-r-eye"))}
_sph0 = {s_: float(np.linalg.norm(_B0sym[group_idx(h, g_)] - _B0sym[group_idx(h, g_)].mean(0), axis=1).std() /
                   np.linalg.norm(_B0sym[group_idx(h, g_)] - _B0sym[group_idx(h, g_)].mean(0), axis=1).mean()) for s_, g_ in (("L", "helper-l-eye"), ("R", "helper-r-eye"))}
report["gates"]["eyeballShape"] = {"radiusSpreadPct": {k: round(100 * v, 2) for k, v in _sph.items()},
                                   "baseSpreadPct": {k: round(100 * v, 2) for k, v in _sph0.items()},
                                   "pass": bool(all(abs(_sph[k] - _sph0[k]) < 0.02 for k in _sph))}

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
# procedural-v3: blend the MakeHuman CC0 anatomical expression units (targets/expression/units, the muscles MakeHuman's
# own expressions are built from: corner puller, upward retraction, elevation, slit, inner-up, ...) into the ARKit keys,
# per the look's faceStyle.v3mix. They carry the cheek bunching and lip thinning that faceunits01 lacks.
_mix = look.get("faceStyle", {}).get("v3mix", {})
if _mix:
    _udir = os.path.join(os.path.dirname(USER_DATA), "..", "..", "..", "user_default", "mpfb", "data", "targets", "expression", "units")
    _udir = os.path.normpath(_udir) if os.path.isdir(os.path.normpath(_udir)) else os.path.expanduser("~/.config/blender/4.2/extensions/user_default/mpfb/data/targets/expression/units")
    _race = look["macros"].get("race", {"caucasian": 1.0})
    _rs = sum(_race.values())
    _mhD = {}

    def _mh_unit(name):
        if name in _mhD:
            return _mhD[name]
        acc = np.zeros_like(_base)
        for rc, w in _race.items():
            p = os.path.join(_udir, rc, name + ".target.gz")
            kb_ = TS.load_target(h, p, weight=0.0, name="ex_tmp")
            kbs_ = h.data.shape_keys.key_blocks
            acc += (w / _rs) * (key_co(kbs_["ex_tmp"]) - key_co(kbs_[0]))
            h.shape_key_remove(kbs_["ex_tmp"])
        _mhD[name] = K.symmetrize({"x": acc}, MIR)["x"] if "left" not in name and "right" not in name else acc
        return _mhD[name]
    _sideL = smoothstep(-0.004, 0.004, _base[:, 0])          # Blender +x = her left
    for key, spec in _mix.items():
        if key.startswith("_"):
            continue
        sided = spec.get("sided", False)
        for S in (("Left", "Right") if sided else ("",)):
            k = key + S
            sgn = K.side_of(_D, k, _base) if sided else 0
            wside = (_sideL if sgn > 0 else 1 - _sideL) if sided else 1.0
            d = spec.get("cc0", 1.0) * _D[k]
            for unit, w in spec.get("mh", []):
                u = unit.replace("{side}", ("left" if sgn > 0 else "right") if sided else "")
                du = _mh_unit(u)
                d = d + w * (du * (wside[:, None] if sided and "{side}" not in unit else 1.0))
            _D[k] = d
    report["v3mix"] = {k: v for k, v in _mix.items() if not k.startswith("_")}
    _D = K.symmetrize(_D, MIR)          # the MH sided units are not exact mirrors: re-symmetrise (G3)
_hw = head_weight(_base) * _body
_CORNER = K.mouth_corner_vids(_B0sym, group_w(h, "lips"), MIR)
_D = K.expression_correctives_v3(_base, _D, group_w(h, "lips") * _body, _eyeC0, _hw, look.get("faceStyle", {}).get("v3keys"), corner_vids=_CORNER)
for k in _names:
    set_key_co(_kbs[k], _base + _D[k])
report["symmetrize"] = {"mouthUpperUpBeforeMm": round(_pre * 1000, 2)}
# ---- merged (ai-portrait-wrap hook): the resting lid. A fraction of eyeBlink baked into the basis AND every key, eyeBlink
# itself shortened by the same fraction so blink = 1 still lands on the closed lid; skin only (moving the eye helper
# moved the eyeball: G4 14% escape, measured); the mesh follows the Basis key (a Basis-only edit is undone later)
rb_ = float(look.get("faceStyle", {}).get("restBlink", 0.0))
if rb_ > 0:
    for S_ in ("Left", "Right"):
        dB_ = _D["eyeBlink" + S_] * _body[:, None]
        for kb in _kbs:
            set_key_co(kb, key_co(kb) + rb_ * dB_)
        set_key_co(_kbs["eyeBlink" + S_], key_co(_kbs["eyeBlink" + S_]) - rb_ * dB_)
        _D["eyeBlink" + S_] = _D["eyeBlink" + S_] - rb_ * dB_
    h.data.vertices.foreach_set("co", key_co(_kbs[0]).ravel())
    h.data.update()
    report["restBlinkBaked"] = rb_
rs = float(look.get("faceStyle", {}).get("restSmile", 0.0))
if rs > 0:
    fix = rs * (_D["mouthSmileLeft"] + _D["mouthSmileRight"])
    for kb in _kbs:
        set_key_co(kb, key_co(kb) + fix)
    report["restSmileBaked"] = rs
    # FIX (2026-10-03, measured by bakeoff ai-portrait-wrap): the bake above edits the shape-key Basis only; a later
    # Blender operation re-bases every key on the MESH vertices, so the resting smile never reached the shipped assets
    # (teal builds with restSmile 0.03 and 0 had identical bases, 0.000 mm). The mesh must follow the Basis key.
    h.data.vertices.foreach_set("co", key_co(_kbs[0]).ravel())
    h.data.update()
    report["restSmileMeshSynced"] = True
B = key_co(_kbs[0])

# ------------------------------------------------------------------ 4. proxies
def add(kind, name, typ):
    return HS.add_mhclo_asset(asset(kind, name), h, asset_type=typ, subdiv_levels=0, material_type="MAKESKIN",
                              set_up_rigging=False, interpolate_weights=False, import_subrig=False, import_weights=False)


teeth = add("teeth", "teeth_base", "Teeth")
tongue = add("tongue", "tongue01", "Tongue")
brows = add("eyebrows", look["brows"], "Eyebrows")
lashes = add("eyelashes", look["lashes"], "Eyelashes")
FS.interpolate_targets(h)
for o in (teeth, tongue, brows, lashes):
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
if look["garment"]["kind"] == "kurti-jacket":
    import garments_v3
    garm, _pen = garments_v3.make(h, look, J, report)
else:
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
# merged: skin wholly hidden under the garment is deleted (it is never seen, and the H head must fit 16k skin tris with
# the subdivided lid and mouth rings): a vertex is hidden when rays along its normal AND straight forward both hit the
# garment within 4 cm; only below the neck base, never the neck opening
if look.get("hiddenSkinCull", True):
    _gb = []
    for o_ in (garment,):
        o_.data.calc_loop_triangles()
        _t = np.empty(len(o_.data.loop_triangles) * 3, np.int64); o_.data.loop_triangles.foreach_get("vertices", _t)
        _gb.append((co(o_.data), _t.reshape(-1, 3)))
    _off = 0; _GP = []; _GT = []
    for P_, T_ in _gb:
        _GP.append(P_); _GT.append(T_ + _off); _off += len(P_)
    _gbvh = BVHTree.FromPolygons([Vector(p) for p in np.concatenate(_GP)], np.concatenate(_GT).tolist())
    _Ph = co(h.data)
    _nh = np.empty(len(h.data.vertices) * 3); h.data.vertices.foreach_get("normal", _nh); _nh = _nh.reshape(-1, 3)
    _zneck = J["joint-neck"][2] - 0.03
    _hid = np.zeros(len(_Ph), bool)
    for i_ in np.nonzero(_Ph[:, 2] < _zneck)[0]:
        p_ = Vector(_Ph[i_])
        a_ = _gbvh.ray_cast(p_ + Vector(_nh[i_]) * 0.0005, Vector(_nh[i_]), 0.04)[0] is not None
        b_ = _gbvh.ray_cast(p_ + Vector((0, -0.0005, 0)), Vector((0, -1, 0)), 0.04)[0] is not None
        _hid[i_] = a_ and b_
    # keep a 1-ring of margin: only vertices whose every neighbour is hidden go
    _e = np.empty(len(h.data.edges) * 2, np.int64); h.data.edges.foreach_get("vertices", _e); _e = _e.reshape(-1, 2)
    _keep = ~_hid
    _ring = np.zeros(len(_Ph), bool); _ring[_e[_keep[_e[:, 0]], 1]] = True; _ring[_e[_keep[_e[:, 1]], 0]] = True
    _del = _hid & ~_ring
    if _del.any():
        delete_verts(h, _del)
    report["hiddenSkinCulled"] = int(_del.sum())


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
# merged (fix 3, the delighted grimace): the teeth are an MHCLO proxy, so FS.interpolate_targets gave them every skin
# delta near the mouth. mouthSmile carried the lower row 5.6 mm FORWARD and the upper row up (probed in the viewer at
# smile 0.85), which put the lower row in front of the retracted lower lip on every open smile. Teeth are rigid: the
# upper row is fixed to the skull (no key moves it); the lower row moves only with the jaw. For each key that is not a
# jaw key, its lower-row delta is replaced by a * jawOpen's lower-row delta, a = the key's jaw component measured on the
# chin (least-squares projection of the chin's delta onto jawOpen's chin delta), so the visemes keep their jaw drop.
_hb, _hD = deltas(h)
_lw = group_w(h, "lips")
_lc = (_hb * _lw[:, None]).sum(0) / max(_lw.sum(), 1e-9)
_chin = (np.abs(_hb[:, 0]) < 0.014) & (_hb[:, 2] < _lc[2] - 0.022) & (_hb[:, 2] > _lc[2] - 0.042) & (_hb[:, 1] < _lc[1] + 0.012) & (_lw < 0.05)
_jc = _hD["jawOpen"][_chin].ravel()
_jaw_keys = {"jawOpen", "jawForward", "jawLeft", "jawRight"}
_rig_fix = {"chinVerts": int(_chin.sum()), "jawComponent": {}}
for _kb in teeth.data.shape_keys.key_blocks[1:]:
    _k = _kb.name
    _d = key_co(_kb) - _tb
    if _k in _jaw_keys:
        _d[_upper] = 0.0
    else:
        _a = float(_hD[_k][_chin].ravel() @ _jc / max(_jc @ _jc, 1e-12)) if _k in _hD else 0.0
        _a = float(np.clip(_a, 0.0, 1.5))
        _d[:] = 0.0
        _d[~_upper] = _a * _tD["jawOpen"][~_upper]
        if _a > 0.01:
            _rig_fix["jawComponent"][_k] = round(_a, 3)
    set_key_co(_kb, _tb + _d)
# the tongue is the same kind of proxy: it rides the jaw (and keeps its own tongueOut), never the lip units
_gb, _gD = deltas(tongue) if tongue.data.shape_keys else (None, {})
for _kb in (tongue.data.shape_keys.key_blocks[1:] if "jawOpen" in _gD else []):
    _k = _kb.name
    if _k in _jaw_keys or _k.startswith("tongue"):
        continue
    _a = float(np.clip(_hD[_k][_chin].ravel() @ _jc / max(_jc @ _jc, 1e-12), 0.0, 1.5)) if _k in _hD else 0.0
    set_key_co(_kb, _gb + _a * _gD["jawOpen"])
report["teethRigid"] = _rig_fix
_tb, _tD = deltas(teeth)
mt = look.get("mouth", {})
shift_parts(teeth, np.nonzero(_upper)[0], np.array([0, -mt.get("upperTeethFwd", 0.0010), -mt.get("upperTeethDown", 0.0013)]))
# merged: the wrapped face has thinner, more retracted lips than MakeHuman's, so the rows sat THROUGH them (G6 rest 4 ->
# kk 12 / jawOpen 19; at rest 10 lower-tooth samples outside the skin, measured): the lower row can move back and down too
if mt.get("lowerTeethBack", 0) or mt.get("lowerTeethDown", 0):
    shift_parts(teeth, np.nonzero(~_upper)[0], np.array([0, mt.get("lowerTeethBack", 0.0), -mt.get("lowerTeethDown", 0.0)]))
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
    # by vertex id (the vid attribute survives the bust cut and joins), not the extreme-x lip vertex (G3 on asymmetric faces)
    _vf = np.zeros(len(face.data.vertices), np.int32); face.data.attributes["vid"].data.foreach_get("value", _vf)
    _hit = np.nonzero(_vf == _CORNER[sg])[0]
    corner = int(_hit[0]) if len(_hit) else lipsel[np.argmax(sg * fb[lipsel, 0])]
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

# merged (fix 4, the lower-lid blob): skin near each eye is kept OUTSIDE the eye's real surface, ball AND cornea bulge
# (make_eyes below: cornea sphere 0.693 r, apex 1.07 r), with a 0.35 mm margin, on the basis and in every key's own
# pose. cheekSquint + eyeSquint lifted the lower lid over the cornea, whose front then showed through the skin as a
# dark dash under the iris (delighted, playful). A push in one key is spread over that key's lid ring (Gaussian 2 mm)
# so the lid keeps its shape. Combined poses are checked below (lid_inside_eye_surface, emotion presets).
def _eye_surface(c, r, Pq):
    d_ = Pq - c
    n_ = np.linalg.norm(d_, axis=1)
    u_ = d_ / np.maximum(n_, 1e-9)[:, None]
    rc_ = 0.693 * r
    t_ = np.zeros(len(Pq))
    # the cornea under gaze up to +-15 deg yaw and pitch (the presets' range), the outermost of the nine
    for ya_ in (-15, 0, 15):
        for pi_ in (-15, 0, 15):
            a_, b0_ = math.radians(ya_), math.radians(pi_)
            fwd_ = np.array([math.sin(a_) * math.cos(b0_), -math.cos(a_) * math.cos(b0_), math.sin(b0_)])
            cc_ = fwd_ * (1.07 * r - rc_)
            b_ = u_ @ cc_
            disc_ = b_ * b_ - (cc_ @ cc_ - rc_ * rc_)
            t_ = np.maximum(t_, np.where(disc_ > 0, b_ + np.sqrt(np.maximum(disc_, 0)), 0.0))
    return n_, u_, np.maximum(r, t_)


_LID_M = 0.00035
_kbs_f = face.data.shape_keys.key_blocks
fb, FD = deltas(face)
_skin_f = np.round(attr(face, "region")) == 0
_eyezone = {}
for _s in ("L", "R"):
    _d = fb - eyeC[_s]
    _eyezone[_s] = np.nonzero(_skin_f & (np.linalg.norm(_d, axis=1) < 1.6 * eyeR[_s]) & (-_d[:, 1] > 0.15 * eyeR[_s]))[0]


def _conform(Pq):
    """Radial push (N,3) that puts every eye-zone skin vertex at least margin outside the eye surface."""
    push = np.zeros_like(Pq)
    for _s in ("L", "R"):
        z_ = _eyezone[_s]
        n_, u_, sr_ = _eye_surface(eyeC[_s], eyeR[_s], Pq[z_])
        need = np.clip(sr_ + _LID_M - n_, 0, None)
        push[z_] = u_ * need[:, None]
    return push


def _spread_push(Pq, push):
    src = np.nonzero(np.linalg.norm(push, axis=1) > 1e-7)[0]
    if not len(src):
        return push
    zone = np.concatenate([_eyezone["L"], _eyezone["R"]])
    dd = np.linalg.norm(Pq[zone][:, None, :] - Pq[src][None, :, :], axis=2)
    w_ = np.exp(-(dd / 0.002) ** 2)
    sm = (w_ @ push[src]) / np.maximum(w_.sum(1), 1e-9)[:, None] * np.clip(w_.sum(1), 0, 1)[:, None]
    out = push.copy()
    keep = np.linalg.norm(sm, axis=1) > np.linalg.norm(push[zone], axis=1)
    out[zone[keep]] = sm[keep]
    return out


_lc_rep = {}
_pb = _spread_push(fb, _conform(fb))
_lc_rep["basis"] = int((np.linalg.norm(_pb, axis=1) > 1e-6).sum())
fb2 = fb + _pb
for kb in _kbs_f:
    if kb.name == _kbs_f[0].name:
        continue
    st = fb2 + FD[kb.name]
    pk = _spread_push(st, _conform(st))
    if np.abs(pk).max() > 1e-7:
        _lc_rep[kb.name] = round(float(np.linalg.norm(pk, axis=1).max() * 1000), 2)
    set_key_co(kb, st + pk)
set_key_co(_kbs_f[0], fb2)
face.data.vertices.foreach_set("co", fb2.ravel())   # the mesh follows the Basis key (the rest-smile lesson)
face.data.update()
report["lidSurfaceConform"] = {"marginMm": _LID_M * 1000, "basisVerts": _lc_rep.pop("basis"), "keysPushedMaxMm": _lc_rep}
fb, FD = deltas(face)
stage("lid conform")

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
# ---- hair (procedural-v3): guide curves on our own scalp -> clumped strand cards (hair_v3.py); H and B+ LODs
import hair_v3
hair = hair_v3.build(face, look, J, eyeC, report, collide=(garment,), lod="H")
hair_lo = hair_v3.build(face, look, J, eyeC, report, collide=(garment,), lod="B")
_hw = hair_v3.hair_weight(co(face.data), J, attr(face, "earsW"), np.round(attr(face, "region")), seed=look["seed"])
_a = face.data.attributes.new("hairW", "FLOAT", "POINT")
_a.data.foreach_set("value", _hw.astype(np.float32))
report["hairV3"]["hairBearingVerts"] = int((_hw > 0.5).sum())
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
# merged: AND at every emotion preset (viewer/presets.js EMOTIONS, parsed here, with the product-weight correctives the
# rig adds). The delighted grimace (lower row in front of the lower lip) was invisible to a viseme-only G6.
import re as _re
_pj = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "viewer", "presets.js")).read()
_pj = _pj[_pj.index("export const EMOTIONS"):]
_pj = _pj[:_pj.index("\n};")]
for _m in _re.finditer(r"^  (\w+): \{ bs: (\{[^}]*\})", _pj, _re.M):
    _bs = json.loads(_re.sub(r"(\w+):", r'"\1":', _m.group(2)))
    st = fb.copy()
    for _k, _w in _bs.items():
        if _k in FD:
            st = st + _w * FD[_k]
    for _S in ("Left", "Right"):
        _c = "jawOpen_mouthSmile" + _S
        if _c in FD:
            st = st + _bs.get("jawOpen", 0) * _bs.get("mouthSmile" + _S, 0) * FD[_c]
    if "mouthFunnel_jawOpen" in FD:
        st = st + _bs.get("jawOpen", 0) * _bs.get("mouthFunnel", 0) * FD["mouthFunnel_jawOpen"]
    g6["emotion_" + _m.group(1)] = pokes(st)
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
# merged: skin vertices inside the eye's real surface (ball + cornea), no margin, at rest and at each emotion preset
# (its bs only; gaze rotates the ball at runtime and is not modelled). Bar 0 everywhere.
def _inside_surface(state):
    o = {}
    for _s in ("L", "R"):
        z_ = _eyezone[_s]
        n_, u_, sr_ = _eye_surface(eyeC[_s], eyeR[_s], state[z_])
        o[_s] = int((n_ < sr_ - 1e-5).sum())
    return o


_lis = {"rest": _inside_surface(fb)}
for _m in _re.finditer(r"^  (\w+): \{ bs: (\{[^}]*\})", _pj, _re.M):
    _bs = json.loads(_re.sub(r"(\w+):", r'"\1":', _m.group(2)))
    st = fb.copy()
    for _k, _w in _bs.items():
        if _k in FD:
            st = st + _w * FD[_k]
    _lis["emotion_" + _m.group(1)] = _inside_surface(st)
report["gates"]["lid_inside_eye_surface"] = _lis
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
    # procedural-v3: the chart runs up past the hairline (the forehead seam at +7.5 cm lit as a band on brow raises)
    in_face = (reg_ == 0) & (P[:, 1] < eL[1] + 0.035) & (P[:, 2] > eL[2] - 0.11) & (P[:, 2] < eL[2] + 0.105) \
        & (np.abs(P[:, 0]) < 0.072)
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

# ------------------------------------------------------------------ H face-mask subdivision (procedural-v3, §10.5)
import subdiv
import seal as SEAL
_reg = np.round(attr(face, "region"))
_Pf = co(face.data)
_eL = eyeC["L"]
_sdc = look.get("subdivH", {})
_vm = (_reg == 0) & (_Pf[:, 1] < _eL[1] + _sdc.get("depth", 0.02)) & (_Pf[:, 2] > _eL[2] - _sdc.get("below", 0.085)) \
    & (_Pf[:, 2] < _eL[2] + _sdc.get("above", 0.035)) & (np.abs(_Pf[:, 0]) < _sdc.get("halfWidth", 0.058))
if _sdc.get("mode") == "rings":
    # the contours that read: the lid rings and the mouth (lip silhouette, corners, philtrum), front-facing only
    _lw = attr(face, "lipsW")
    _lc = _Pf[(_lw > 0.3) & (_reg == 0)].mean(0)
    _front = _Pf[:, 1] < _eL[1] + _sdc.get("depth", 0.012)
    _eyes = sum(((_Pf - eyeC[s_]) ** 2).sum(1) < _sdc.get("eyeR", 0.022) ** 2 for s_ in ("L", "R")) > 0
    _mouth = ((_Pf[:, 0] / _sdc.get("mouthX", 0.036)) ** 2 + ((_Pf[:, 2] - _lc[2]) / _sdc.get("mouthZ", 0.02)) ** 2) < 1
    _vm = (_reg == 0) & _front & (_eyes | _mouth)
_pm = np.array([all(_vm[v] for v in p.vertices) for p in face.data.polygons])
face_sd1, report["subdivH"] = subdiv.subdivide_mask(face, _pm)
report["gates"]["G5_H"] = SEAL.seal_and_gate(face_sd1, eyes, eyeC, eyeR)
print(f"[build:{look['id']}] subdivH {report['subdivH']} G5_H pass={report['gates']['G5_H']['pass']}", flush=True)
stage("subdivH")

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
