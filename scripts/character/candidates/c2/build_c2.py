"""c2 stage 1+2 (headless Blender): Rocketbox Business_Female_01 (MIT) -> our runtime contract, raw GLBs per tier.

    bpyenv/bin/python scripts/character/candidates/c2/build_c2.py --out <buildDir> [--tier H|Bplus|both]

What it does (CHARACTER-PIPELINE.md §4 is the contract it lands in):
  - reads the FBX into numpy arrays (common.load), world metres, Z up, -Y front;
  - bust cut (z >= ZCUT, |x| <= XCUT), keeps head, neck, shoulders, upper chest;
  - parts: face (skin + mouth interior with `_region` 0 skin / 1 teeth (+gum fraction) / 2 tongue / 3 bag), hair (the
    painted hair shell, split off the head UV island by texel luminance, plus the hair-shell islands), cards (Rocketbox's
    alpha cards: lashes + hair strands), garment (the body material), eyes (OUR eyeball with a cornea bulge, fitted to
    Rocketbox's eye socket so TaxilaEye's analytic iris works);
  - keys: Rocketbox's ARKit 52 (2022 Fang Ma / Matias Volonte set) and 15 Oculus visemes renamed to the contract,
    3 Hindi tongue keys from the HeadBox tongue keys; nothing re-sculpted;
  - normals: computed once on the whole connected body and written as custom normals on every part, so the
    skin / hair / garment splits carry no shading seam;
  - our 7-bone armature (Spine2 Neck Head LeftEye RightEye LeftShoulder RightShoulder) at Rocketbox's joint positions,
    weights collapsed from Rocketbox's 80 bones (common.collapse_weights);
  - H: Catmull-Clark level 1 on the face and hair (keys evaluated through the subdivision), hi eyes;
    B+: native geometry, lo eyes, ARKit 52 + tongueTipUp.
"""
import argparse, json, math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
import bpy, bmesh
from mathutils import Vector
from PIL import Image
from common import load, collapse_weights, contract_keys, ARKIT52, VISEMES, SRC

ap = argparse.ArgumentParser()
ap.add_argument("--out", required=True)
ap.add_argument("--tier", default="both")
ap.add_argument("--subdiv", type=int, default=1)
args = ap.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:])
os.makedirs(args.out, exist_ok=True)
ZCUT, XCUT = 1.22, 0.30
EYE_R = 0.0135            # our eyeball radius (Rocketbox's socket sphere is 15.4 mm; 13.5 keeps the iris near human size)

D = load()
P, polys, uv, Wt, J = D["P"], D["polys"], D["uv"], D["weights"], D["joints"]
K = contract_keys(D["keys"])
mats = D["mats"]
# rest lip seal: Rocketbox's neutral rests with the lips ~2 mm apart (the "parted lips" register CHARACTER-PIPELINE §2
# step 3 also fixed). Bake SEAL x mouthClose into the basis; mouthClose keeps the rest of its travel (so weight 1 is the
# original full close) and viseme_PP loses the share the basis now already has.
LOOK = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../../../art/character/candidates/c2/look.json")))
for k, g in LOOK.get("keyGain", {}).items():      # baked expression gains (Rocketbox's smile units are soft)
    K[k] = K[k] * g
for k, mix in LOOK.get("keyMix", {}).items():     # contract key += w x a Rocketbox FACS / HeadBox key
    if k.startswith("_"):
        continue
    for item in mix:
        src, w = item[0], item[1]
        d = w * D["keys"][src]
        if len(item) > 2:          # one side of a bilateral key: smooth split across the midline (her left = +x)
            t = np.clip((P[:, 0] + 0.008) / 0.016, 0, 1)
            t = t * t * (3 - 2 * t)
            d = d * (t if item[2] == "L" else 1 - t)[:, None]
        K[k] = K[k] + d
SEAL = LOOK.get("restSeal", 0.3)
dC = K["mouthClose"].copy()
P = P + SEAL * dC
K["mouthClose"] = (1 - SEAL) * dC
K["viseme_PP"] = K["viseme_PP"] - SEAL * dC
# resting expression baked into the basis (CHARACTER-PIPELINE §2 step 3 `faceStyle.restSmile`, generalised): Rocketbox's
# neutral reads sullen (corners down, a pout); look.restPose is a soft closed smile chosen by eye in the polish pass
for k, w in LOOK.get("restPose", {}).items():
    if not k.startswith("_"):
        P = P + w * K[k]
# relaxed upper lid: Rocketbox's neutral lids sit high (a slight stare at teacher distance); bake restLid x eyeBlink
# into the basis and scale the blink keys so weight 1 is still exactly closed
RL = LOOK.get("restLid", 0.0)
for S_ in ("Left", "Right"):
    dB = K[f"eyeBlink{S_}"].copy()
    P = P + RL * dB
    K[f"eyeBlink{S_}"] = (1 - RL) * dB
M_BODY, M_HEAD, M_OPA = mats.index("f014_body"), mats.index("f014_head"), mats.index("f014_opacity")
head_tex = np.asarray(Image.open(os.path.join(SRC, "f014_head_color.tga")).convert("RGB")).astype(np.float32) / 255
TH, TW = head_tex.shape[:2]
samp = lambda U: head_tex[np.clip(((1 - U[:, 1]) * TH).astype(int), 0, TH - 1), np.clip((U[:, 0] * TW).astype(int), 0, TW - 1)]
dom = [max(w, key=w.get) if w else "" for w in Wt]

# ------------------------------------------------------------------ UV islands of the head material
par = {}
def find(a):
    while par[a] != a:
        par[a] = par[par[a]]; a = par[a]
    return a
edge = {}
for f, (vs, ls, m) in enumerate(polys):
    if m != M_HEAD:
        continue
    par[f] = f
    for j in range(len(vs)):
        a, b, la, lb = vs[j], vs[(j + 1) % len(vs)], ls[j], ls[(j + 1) % len(vs)]
        ua, ub = tuple(np.round(uv[la], 4)), tuple(np.round(uv[lb], 4))
        key = (a, ua, b, ub) if a < b else (b, ub, a, ua)
        if key in edge:
            par[find(f)] = find(edge[key])
        else:
            edge[key] = f
islands = {}
for f in par:
    islands.setdefault(find(f), []).append(f)

# classify islands (see the island table printed by islands.py; UV boxes of Rocketbox's head atlas, shared by every
# Rocketbox adult): mouth interior lives in u < 0.22, v < 0.38; eyeballs are weighted to the eye bones
fclass = {}                    # face index -> part name
freg = {}                      # face index -> region value for the mouth interior
for r, fs in islands.items():
    ls = np.array([l for f in fs for l in polys[f][1]])
    U = uv[ls]
    vs = {v for f in fs for v in polys[f][0]}
    bones = [dom[v] for v in vs]
    lum = float((samp(U) @ [0.3, 0.59, 0.11]).mean())
    cu, cv = U[:, 0].mean(), U[:, 1].mean()
    if any(b in ("Bip01 LEye", "Bip01 REye") for b in bones) and len(fs) < 200:
        cls = "drop_eye"
    elif len(fs) > 1000:
        cls = "main"
    elif cu < 0.22 and cv < 0.38 and P[list(vs), 1].mean() > 0.05:
        cls = "drop_clip"          # Rocketbox's hair clip at the back of the head shares the mouth atlas corner
    elif cu < 0.22 and cv < 0.38:
        tongue = sum(b == "Bip01 MTongue" for b in bones) > 0.4 * len(bones)
        if tongue:
            reg = 2.0
        elif lum > 0.25:
            reg = 1.0              # teeth
        elif lum > 0.11:
            reg = 1.45             # gums (teeth region with the full gum weight)
        else:
            reg = 3.0              # mouth bag
        cls = "mouth"
        for f in fs:
            freg[f] = reg
    else:
        cls = "hair"
    for f in fs:
        fclass[f] = cls

# main island: hair-shell faces by texel luminance at the face's loops, outside the eye / brow / nostril / lip box
hair_main = 0
for f, (vs, ls, m) in enumerate(polys):
    if fclass.get(f) != "main":
        continue
    c = P[vs].mean(0)
    lum = float((samp(uv[ls]) @ [0.3, 0.59, 0.11]).mean())
    in_face = abs(c[0]) < 0.075 and 1.53 < c[2] < 1.675 and c[1] < 0.0
    if lum < 0.16 and not in_face:
        fclass[f] = "hair"; hair_main += 1
    else:
        fclass[f] = "face"

# polish: Rocketbox's strand cards on the crown stand up to 23 mm off the shell, which read as spikes in silhouette.
# Pull every crown-card vertex toward the nearest shell vertex: offsets above 3 mm keep 30% of their excess. Lashes
# (eye-level cards) and the low bun cards at the nape are left alone.
from scipy.spatial import cKDTree
shell_v = sorted({v for f, c in fclass.items() if c == "hair" for v in polys[f][0]})
tree = cKDTree(P[shell_v])
card_v = sorted({v for f, (vs, ls, m) in enumerate(polys) if m == M_OPA for v in vs})
cv_ = np.array([v for v in card_v if P[v, 2] > 1.6 and P[v, 1] > -0.03])
dd, ii = tree.query(P[cv_])
near = P[np.array(shell_v)[ii]]
off = P[cv_] - near
keep_ = np.where(dd > 0.003, (0.003 + 0.3 * (dd - 0.003)) / np.maximum(dd, 1e-9), 1.0)
P[cv_] = near + off * keep_[:, None]
CARD_PULL = {"verts": int(len(cv_)), "maxOffBeforeMm": round(float(dd.max()) * 1000, 1),
             "maxOffAfterMm": round(float((dd * keep_).max()) * 1000, 1)}

# opacity cards: dedupe Rocketbox's back-face duplicates (same vertex positions, reversed winding)
# polish: the one fringe card lying flat across her right temple (centroid ~ (-0.036, -0.013, 1.688)) read as a dark
# blue-black stripe on the forehead in every front view; it is dropped (the painted fringe under it stays)
opa_par = {}
def ofind(a):
    while opa_par.setdefault(a, a) != a:
        a = opa_par[a]
    return a
for vs, ls, m in polys:
    if m == M_OPA:
        for v in vs[1:]:
            opa_par[ofind(v)] = ofind(vs[0])
opa_c = {}
for v in opa_par:
    opa_c.setdefault(ofind(v), []).append(v)
opa_c = {r: P[vs].mean(0) for r, vs in opa_c.items()}
seen = set()
for f, (vs, ls, m) in enumerate(polys):
    if m == M_OPA:
        key = tuple(sorted(tuple(np.round(P[v], 5)) for v in vs))
        c = opa_c[ofind(vs[0])]
        if c[1] < 0.0 and c[2] > 1.66:
            fclass[f] = "drop_fringe"
        else:
            fclass[f] = "drop_dup" if key in seen else "cards"
        seen.add(key)
    elif m == M_BODY:
        fclass[f] = "garment"

# bust cut (whole faces), face/hair/garment only
def keep(f):
    vs = polys[f][0]
    c = P[vs]
    return (c[:, 2] >= ZCUT).all() and (np.abs(c[:, 0]) <= XCUT).all()
for f in range(len(polys)):
    if fclass.get(f) in ("face", "hair", "garment", "mouth") and not keep(f):
        fclass[f] = "drop_cut"

# ------------------------------------------------------------------ normals of the connected body, once
def vertex_normals(fids, Pos):
    N = np.zeros_like(Pos)
    for f in fids:
        vs = polys[f][0]
        p = Pos[vs]
        n = np.zeros(3)
        for j in range(len(vs)):              # Newell
            a, b = p[j], p[(j + 1) % len(vs)]
            n += np.cross(a, b)
        for v in vs:
            N[v] += n
    l = np.linalg.norm(N, axis=1, keepdims=True)
    return N / np.maximum(l, 1e-12)
body_f = [f for f in range(len(polys)) if fclass.get(f) in ("face", "hair", "garment")]
N_body = vertex_normals(body_f, P)

stats = {"source": "Microsoft Rocketbox Business_Female_01 (MIT)", "hairFacesFromMainIsland": hair_main, "cardPull": CARD_PULL,
         "partFaces": {}}
for f, c in fclass.items():
    stats["partFaces"][c] = stats["partFaces"].get(c, 0) + 1


# ------------------------------------------------------------------ mesh builder
def build(name, fids, keynames, custom_normals=True, region=None, uvx=None):
    vs_all = sorted({v for f in fids for v in polys[f][0]})
    remap = {v: i for i, v in enumerate(vs_all)}
    verts = P[vs_all]
    faces = [[remap[v] for v in polys[f][0]] for f in fids]
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts.tolist(), [], faces)
    me.update()
    uvl = me.uv_layers.new(name="UVMap")
    lu = np.array([uv[l] for f in fids for l in polys[f][1]], np.float32)
    if uvx is not None:            # atlas packing: (u0, du) -> u' = u0 + du * u
        lu[:, 0] = uvx[0] + uvx[1] * lu[:, 0]
    uvl.data.foreach_set("uv", lu.ravel())
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    for p in me.polygons:
        p.use_smooth = True
    if keynames:
        ob.shape_key_add(name="Basis")
        for k in keynames:
            d = K[k][vs_all]
            kb = ob.shape_key_add(name=k, from_mix=False)
            kb.data.foreach_set("co", (verts + d).astype(np.float32).ravel())
    if custom_normals:
        me.normals_split_custom_set_from_vertices([tuple(N_body[v]) for v in vs_all])
    if region is not None:
        a = me.attributes.new("_region", "FLOAT", "POINT")
        rv = np.zeros(len(vs_all), np.float32)
        for f in fids:
            for v in polys[f][0]:
                rv[remap[v]] = max(rv[remap[v]], region.get(f, 0.0))
        a.data.foreach_set("value", rv)
    # weights (collapsed to our 7 bones)
    groups = {}
    for i, v in enumerate(vs_all):
        for b, w in collapse_weights(Wt[v]).items():
            groups.setdefault(b, []).append((i, w))
    for b, lst in groups.items():
        g = ob.vertex_groups.new(name=b)
        for i, w in lst:
            g.add([i], w, "REPLACE")
    return ob


face_f = [f for f, c in fclass.items() if c in ("face", "mouth")]
hair_f = [f for f, c in fclass.items() if c == "hair"]
card_f = [f for f, c in fclass.items() if c == "cards"]
garm_f = [f for f, c in fclass.items() if c == "garment"]
# UV polygons per part: texture_c2.py flattens every texel no shipped polygon samples (the atlases also hold the hands,
# trousers, shoes and the parts the bust cut removed), which is most of what the KTX2 encoder was paying for
json.dump({nm: [uv[polys[f][1]].round(5).tolist() for f in fs] for nm, fs in
           (("face", face_f), ("hair", hair_f), ("cards", card_f), ("garment", garm_f))},
          open(os.path.join(args.out, "uvpolys.json"), "w"))
FACE_KEYS = ARKIT52 + VISEMES + ["tongueTipUp", "tongueCurl", "tongueWide"]


def moving(fids, names, tol=1e-5):
    vs = sorted({v for f in fids for v in polys[f][0]})
    return [k for k in names if np.abs(K[k][vs]).max() > tol]


# ------------------------------------------------------------------ our eyeballs
eyeC = {}
for side, bone in (("L", "Bip01 LEye"), ("R", "Bip01 REye")):
    idx = [v for v in range(len(P)) if dom[v] == bone]
    Q = P[idx]
    front = Q[:, 1].min()                       # Rocketbox cornea front (-Y)
    c = J[bone].copy()
    c[1] = front + 1.07 * EYE_R                 # our apex on Rocketbox's front
    eyeC[side] = c
stats["eyeC"] = {k: v.tolist() for k, v in eyeC.items()}


def make_eyes(nu, nv, name):
    bm = bmesh.new()
    uvl = bm.loops.layers.uv.new("UVMap")
    for side in ("L", "R"):
        c, r = eyeC[side], EYE_R
        tmp = bmesh.new()
        bmesh.ops.create_uvsphere(tmp, u_segments=nu, v_segments=nv, radius=1.0)
        for v in tmp.verts:
            x, y, z = v.co
            d = np.array([x, -z, y])
            rr = r
            rc = 0.693 * r
            cc = np.array([0, -(1.07 * r - rc), 0])
            b = d @ cc
            disc = b * b - (cc @ cc - rc * rc)
            if disc > 0:
                rr = max(rr, b + math.sqrt(disc))
            v.co = Vector(c + d * rr)
        m = bpy.data.meshes.new("t")
        tmp.to_mesh(m)
        tmp.free()
        vmap = [bm.verts.new(v.co) for v in m.vertices]
        for p in m.polygons:
            fc = bm.faces.new([vmap[i] for i in p.vertices])
            for loop, vi in zip(fc.loops, p.vertices):
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
    co = np.array([v.co[:] for v in me.vertices])
    gl, gr = ob.vertex_groups.new(name="LeftEye"), ob.vertex_groups.new(name="RightEye")
    for i, p in enumerate(co):
        (gl if p[0] > 0 else gr).add([i], 1.0, "REPLACE")
    return ob


# ------------------------------------------------------------------ subdivision with keys (H)
def subdivide(ob, levels, keep_attr=None):
    """Catmull-Clark through a modifier, keys evaluated one by one (the topology does not depend on the positions).
    Custom normals are dropped (smooth subdivided normals replace them); _region / weights / UVs follow the modifier."""
    me = ob.data
    keys = [kb.name for kb in me.shape_keys.key_blocks] if me.shape_keys else []
    md = ob.modifiers.new("sub", "SUBSURF")
    md.levels = md.render_levels = levels
    md.uv_smooth = "PRESERVE_BOUNDARIES"
    md.boundary_smooth = "PRESERVE_CORNERS"
    md.use_custom_normals = False
    dg = bpy.context.evaluated_depsgraph_get()
    coords = {}
    if keys:
        ob.show_only_shape_key = True
        for i, k in enumerate(keys):
            ob.active_shape_key_index = i
            dg.update()
            ev = ob.evaluated_get(dg)
            m2 = ev.to_mesh()
            a = np.zeros(len(m2.vertices) * 3, np.float32)
            m2.vertices.foreach_get("co", a)
            coords[k] = a
            ev.to_mesh_clear()
        ob.show_only_shape_key = False
        ob.active_shape_key_index = 0
    # basis mesh with attributes, groups, UVs: apply the modifier on a key-less copy
    if keys:
        ob.shape_key_clear()
    if me.has_custom_normals:
        bpy.context.view_layer.objects.active = ob
        ob.select_set(True)
        bpy.ops.mesh.customdata_custom_splitnormals_clear()
    bpy.context.view_layer.objects.active = ob
    for o in bpy.context.selected_objects:
        o.select_set(False)
    ob.select_set(True)
    bpy.ops.object.modifier_apply(modifier="sub")
    me = ob.data
    if keys:
        ob.shape_key_add(name="Basis")
        for k in keys[1:]:
            kb = ob.shape_key_add(name=k, from_mix=False)
            kb.data.foreach_set("co", coords[k])
    for p in me.polygons:
        p.use_smooth = True
    return ob


# ------------------------------------------------------------------ armature
def make_armature():
    arm_d = bpy.data.armatures.new("Armature")
    arm = bpy.data.objects.new("Armature", arm_d)
    bpy.context.collection.objects.link(arm)
    bpy.context.view_layer.objects.active = arm
    arm.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    eb = arm_d.edit_bones
    def bone(name, h, t, parent=None):
        b = eb.new(name)
        b.head, b.tail = tuple(h), tuple(t)
        b.roll = 0
        if parent:
            b.parent = eb[parent]
    bone("Spine2", J["Bip01 Spine2"], J["Bip01 Neck"])
    bone("Neck", J["Bip01 Neck"], J["Bip01 Head"], "Spine2")
    bone("Head", J["Bip01 Head"], J["Bip01 Head"] + np.array([0, 0, 0.12]), "Neck")
    for side, nm in (("L", "LeftEye"), ("R", "RightEye")):
        bone(nm, eyeC[side], eyeC[side] + np.array([0, -0.03, 0]), "Head")
    bone("LeftShoulder", J["Bip01 L Clavicle"], J["Bip01 L UpperArm"], "Spine2")
    bone("RightShoulder", J["Bip01 R Clavicle"], J["Bip01 R UpperArm"], "Spine2")
    bpy.ops.object.mode_set(mode="OBJECT")
    return arm


def strand_tangent(ob, hc):
    """Per-vertex root->tip strand direction (export_tier.py's method), stored in glTF axes (x, z, -y)."""
    me = ob.data
    Pm = np.array([v.co[:] for v in me.vertices])
    uvl = me.uv_layers.active
    acc = np.zeros_like(Pm)
    for p in me.polygons:
        ls, vs = list(p.loop_indices), list(p.vertices)
        p0, p1, p2 = Pm[vs[0]], Pm[vs[1]], Pm[vs[2]]
        u0, u1, u2 = (np.array(uvl.data[l].uv) for l in ls[:3])
        e1, e2, d1, d2 = p1 - p0, p2 - p0, u1 - u0, u2 - u0
        den = d1[0] * d2[1] - d1[1] * d2[0]
        if abs(den) < 1e-12:
            continue
        B = (e2 * d1[0] - e1 * d2[0]) / den
        for v in vs:
            acc[v] += B / max(np.linalg.norm(B), 1e-12)
    n = np.linalg.norm(acc, axis=1, keepdims=True)
    T = np.where(n > 1e-9, acc / np.maximum(n, 1e-9), np.array([0, 0, -1.0]))
    ref = (Pm - hc) / np.maximum(np.linalg.norm(Pm - hc, axis=1, keepdims=True), 1e-9) + np.array([0, 0, -0.7])
    T *= np.where((T * ref).sum(1) < 0, -1.0, 1.0)[:, None]
    T = np.stack([T[:, 0], T[:, 2], -T[:, 1]], 1)
    a = me.attributes.new("_strand", "FLOAT_VECTOR", "POINT")
    a.data.foreach_set("vector", T.astype(np.float32).ravel())


MATS = {"face": "TaxilaSkin", "eyes": "TaxilaEye", "cards": "TaxilaCards", "hair": "TaxilaHair", "garment": "TaxilaCloth"}


def export(tier):
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    for m in list(bpy.data.meshes):
        bpy.data.meshes.remove(m)
    for m in list(bpy.data.materials):
        bpy.data.materials.remove(m)
    for a in list(bpy.data.armatures):
        bpy.data.armatures.remove(a)
    keys_face = FACE_KEYS if tier == "H" else ARKIT52 + ["tongueTipUp"]
    face = build("face", face_f, keys_face, region=freg)
    # the painted hair shell and Rocketbox's alpha cards (strands + lashes) ship as ONE `cards` mesh on a two-half
    # atlas (left: alpha cards, right: the shell's texels from the head atlas). As `hair`, the shell took TaxilaHair's
    # Kajiya-Kay lobe, which on Rocketbox's large smooth shell read as grey plastic bands (first polish look);
    # `cards` gets no KK lobe and keeps Rocketbox's painted sheen. 4 draws instead of 5.
    hair = build("hair", hair_f, [k for k in moving(hair_f, ARKIT52)], uvx=(0.5, 0.5))
    cards = build("cards", card_f, moving(card_f, ARKIT52), custom_normals=False, uvx=(0.0, 0.5))
    garment = build("garment", garm_f, [])
    if tier == "H" and args.subdiv > 0:
        subdivide(face, args.subdiv)
        subdivide(hair, args.subdiv)
    eyes = make_eyes(36, 28, "eyes") if tier == "H" else make_eyes(16, 12, "eyes")
    for o in bpy.context.selected_objects:
        o.select_set(False)
    hair.select_set(True); cards.select_set(True)
    bpy.context.view_layer.objects.active = cards
    bpy.ops.object.join()
    cards.name = "cards"
    hc = J["Bip01 Head"] + np.array([0, 0.0, 0.10])
    strand_tangent(cards, hc)
    for ob in (face, cards, garment, eyes):
        ob.data.materials.clear()
        m = bpy.data.materials.new(MATS[ob.name])
        m.use_nodes = True
        ob.data.materials.append(m)
    arm = make_armature()
    for ob in (face, cards, garment, eyes):
        md = ob.modifiers.new("Armature", "ARMATURE")
        md.object = arm
        ob.parent = arm
        # every vertex group must name a bone
        for g in list(ob.vertex_groups):
            if g.name not in arm.data.bones:
                ob.vertex_groups.remove(g)
    tri = lambda ob: int(sum(len(p.vertices) - 2 for p in ob.data.polygons))
    st = {"tier": tier, "meshes": {o.name: {"verts": len(o.data.vertices), "tris": tri(o),
          "keys": (len(o.data.shape_keys.key_blocks) - 1) if o.data.shape_keys else 0}
          for o in (face, cards, garment, eyes)}}
    st["tris"] = sum(v["tris"] for v in st["meshes"].values())
    st["draws"] = 4
    st["faceKeys"] = [k.name for k in face.data.shape_keys.key_blocks[1:]]
    out = os.path.join(args.out, f"{tier}.raw.glb")
    bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_morph=True, export_morph_normal=False,
                              export_skins=True, export_attributes=True, export_yup=True, export_texcoords=True,
                              export_normals=True, export_tangents=False, export_materials="EXPORT",
                              export_animations=False, export_apply=False, use_selection=False, export_extras=False,
                              export_image_format="NONE")
    st["rawBytes"] = os.path.getsize(out)
    json.dump(st, open(os.path.join(args.out, f"{tier}.stats.json"), "w"), indent=1)
    print(json.dumps({k: v for k, v in st.items() if k != "faceKeys"}))


for t in (["H", "Bplus"] if args.tier == "both" else [args.tier]):
    export(t)
json.dump(stats, open(os.path.join(args.out, "build.json"), "w"), indent=1, default=float)
print(json.dumps(stats["partFaces"]))
os._exit(0)
