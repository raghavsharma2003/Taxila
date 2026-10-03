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
import numpy as np
import bpy, bmesh
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from mpfb_env import (enable_mpfb, asset, co, key_co, set_key_co, deltas, tris_of, smoothstep, select_only,
                      delete_verts, USER_DATA)
import keys as K
import parts

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
    P = co(tmp.data)
    _, idx = cKDTree(base).query(P)
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

# ------------------------------------------------------------------ mouth interior: region tags + a dark bag
def tag(obj, region):
    a = obj.data.attributes.new("region", "FLOAT", "POINT")
    a.data.foreach_set("value", np.full(len(obj.data.vertices), region, np.float32))


tag(h, 0.0)
tag(teeth, 1.0)
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
select_only([h, teeth, tongue, bag])
bpy.context.view_layer.objects.active = h
bpy.ops.object.join()
face = h
face.name = "face"
stage("mouth")

# ------------------------------------------------------------------ tongue extras
region = attr(face, "region")
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
reg["lips"] = np.clip(lipsW * skin, 0, 1)
bi = np.linalg.norm(FD["browInnerUp"], axis=1)
reg["browInner"] = ((bi > 0.001) & (np.abs(fb[:, 0]) < 0.022) & skin).astype(float)
for S, sg in (("Left", 1), ("Right", -1)):
    corner = lipsel[np.argmax(sg * fb[lipsel, 0])]
    dc = np.linalg.norm(fb - fb[corner], axis=1)
    reg["mouthCorner" + S] = np.exp(-(dc / 0.012) ** 2) * skin
report["lipSealPairs"] = int(pair.sum())


def seal_fix(state, falloff=0.007):
    """Delta that pulls each upper/lower contact pair to its midpoint, spread over the lips with a falloff."""
    up, lo = reg["lipSealUpper"], reg["lipSealLower"]
    fix = np.zeros_like(state)
    mid = 0.5 * (state[up] + state[lo])
    fix[up] = mid - state[up]
    fix[lo] = mid - state[lo]
    return K._spread(state, fix, np.concatenate([up, lo]), reg["lips"], radius=falloff)


# MH's neutral rests with the lips ~1.5 mm apart. A teacher at rest has a closed, relaxed mouth (and parted lips at
# rest read as a different register), so the basis is sealed; every key keeps its delta, so nothing else moves.
fix0 = seal_fix(fb)
kbs = face.data.shape_keys.key_blocks
for kb in kbs:
    set_key_co(kb, key_co(kb) + fix0)
fb, FD = deltas(face)
# viseme_PP must close the lips (the bilabial closure bar): seal its own pose the same way.
fixpp = seal_fix(fb + FD["viseme_PP"])
set_key_co(kbs["viseme_PP"], key_co(kbs["viseme_PP"]) + fixpp)
fixcl = seal_fix(fb + FD["jawOpen"] + FD["mouthClose"])
set_key_co(kbs["mouthClose"], key_co(kbs["mouthClose"]) + fixcl)
fb, FD = deltas(face)
report["lipSealFixMm"] = {"rest": round(float(np.abs(fix0).max() * 1000), 2), "viseme_PP": round(float(np.abs(fixpp).max() * 1000), 2),
                          "mouthClose": round(float(np.abs(fixcl).max() * 1000), 2)}
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
hair.shape_key_clear()
hair.name = "hair"
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
sk = (region == 0) | (region == 3)   # mirror test on skin only
mir = {}
for k in K.ARKIT52:
    if k.endswith("Left"):
        r_ = k[:-4] + "Right"
        if r_ in FD:
            mir[k[:-4]] = round(K.mirror_error(fb[skin], FD[k][skin], FD[r_][skin]) * 1000, 2)
report["gates"]["G3_mirror_mm"] = mir

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
    g = np.linalg.norm(state[reg["lipSealUpper"]] - state[reg["lipSealLower"]], axis=1) * 1000
    return {"p95": round(float(np.percentile(g, 95)), 3), "max": round(float(g.max()), 3)} if len(g) else None


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
report["gates"]["G5_lip_gap_mm"] = {
    "rest": seal(fb), "viseme_PP": seal(fb + FD["viseme_PP"]),
    "jawOpen0.3+mouthClose0.3": seal(fb + 0.3 * FD["jawOpen"] + 0.3 * FD["mouthClose"]),
    "jawOpen0.3+mouthClose0.3+corrective": seal(fb + 0.3 * FD["jawOpen"] + 0.3 * FD["mouthClose"]
                                                + 0.09 * FD["jawOpen_mouthClose"]),
}

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
