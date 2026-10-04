"""Candidate c4 (forked from c1), stage 1 (headless Blender): Rocketbox Female_Adult_07 facial FBX -> our runtime contract, raw GLBs.

    $CHAR_HOME/bpyenv/bin/python scripts/character/candidates/c4/build.py --fbx <Female_Adult_07_facial.fbx> --out <dir>
        [--tex <Textures dir>] [--zcut 1.25] [--subdiv-h 1]

What it does (CHARACTER-PIPELINE.md §4 is the contract it lands in):
  * keeps the source's own authored shapes: AK_01..52 -> the 52 Apple ARKit names (lower camel case), AA_VI_00..14 ->
    viseme_sil PP FF TH DD kk CH SS nn RR aa E I O U. Every other source shape (FACS AUs, HB_*, SR_*) is dropped, except
    HB_12_TongueUp / HB_09_TongueIn, which seed our Hindi tongue extras (tongueTipUp, tongueCurl); tongueWide is scripted.
  * cuts the A-pose body to a bust with one horizontal plane (the hole faces the floor, never a camera);
  * splits the parts into the contract's meshes: face (skin + mouth interior, `_region` 0 skin / 1 teeth (+gum weight in
    the fraction) / 2 tongue / 3 bag), eyes (skinned to LeftEye / RightEye, no morphs: gaze is by bone), cards (lashes),
    hair (alpha cards), garment (the dress + arms; one material each = one draw each);
  * drops the source's back-face duplicate cards (double-sided pairs; our hair shader is double-sided already);
  * builds the contract armature (root "Armature"; Spine2 Neck Head LeftEye RightEye LeftShoulder RightShoulder) at the
    source's own Biped joint positions and folds the source's 80 bone weights into it (face rig bones -> Head, arm chain
    -> shoulder, spine and legs -> Spine2);
  * H: one Catmull-Clark level on face + garment (keys re-evaluated through the subdivision), the source's 4.7k-vertex
    body is visibly faceted at the H face camera otherwise. B+: the source geometry as is.
Every key is copied from the source's authored delta (world metres, after the FBX unit scale), never re-sculpted.
"""
import argparse, json, os, sys
import numpy as np
import bpy

ap = argparse.ArgumentParser()
ap.add_argument("--fbx", required=True)
ap.add_argument("--out", required=True)
ap.add_argument("--tex", default=None)
ap.add_argument("--zcut", type=float, default=1.25)
ap.add_argument("--subdiv-h", type=int, default=1)
args = ap.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:])
os.makedirs(args.out, exist_ok=True)
TEX = args.tex or os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(args.fbx))), "Textures")

ARKIT52 = ["browDownLeft", "browDownRight", "browInnerUp", "browOuterUpLeft", "browOuterUpRight", "cheekPuff",
           "cheekSquintLeft", "cheekSquintRight", "eyeBlinkLeft", "eyeBlinkRight", "eyeLookDownLeft", "eyeLookDownRight",
           "eyeLookInLeft", "eyeLookInRight", "eyeLookOutLeft", "eyeLookOutRight", "eyeLookUpLeft", "eyeLookUpRight",
           "eyeSquintLeft", "eyeSquintRight", "eyeWideLeft", "eyeWideRight", "jawForward", "jawLeft", "jawOpen", "jawRight",
           "mouthClose", "mouthDimpleLeft", "mouthDimpleRight", "mouthFrownLeft", "mouthFrownRight", "mouthFunnel",
           "mouthLeft", "mouthLowerDownLeft", "mouthLowerDownRight", "mouthPressLeft", "mouthPressRight", "mouthPucker",
           "mouthRight", "mouthRollLower", "mouthRollUpper", "mouthShrugLower", "mouthShrugUpper", "mouthSmileLeft",
           "mouthSmileRight", "mouthStretchLeft", "mouthStretchRight", "mouthUpperUpLeft", "mouthUpperUpRight",
           "noseSneerLeft", "noseSneerRight", "tongueOut"]
VISEMES = ["viseme_" + v for v in "sil PP FF TH DD kk CH SS nn RR aa E I O U".split()]
TONGUE = ["tongueTipUp", "tongueCurl", "tongueWide"]
TIER_KEYS = {"H": ARKIT52 + VISEMES + TONGUE, "Bplus": ARKIT52 + ["tongueTipUp"]}

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=args.fbx)
src = [o for o in bpy.data.objects if o.type == "MESH"][0]
arm0 = [o for o in bpy.data.objects if o.type == "ARMATURE"][0]
J = {b.name: np.array(arm0.matrix_world @ b.head_local) for b in arm0.data.bones}
me = src.data
M = np.array(src.matrix_world)
toW = lambda A: (np.c_[A, np.ones(len(A))] @ M.T)[:, :3]
kb = me.shape_keys.key_blocks
nv = len(me.vertices)


def kco(k):
    a = np.zeros(nv * 3, np.float32)
    k.data.foreach_get("co", a)
    return toW(a.reshape(-1, 3).astype(np.float64))


P = kco(kb["Basis"])
# ------------------------------------------------------------------ source shapes -> contract names (deltas, metres)
D = {}
for k in kb[1:]:
    n = k.name
    if n.startswith("AK_"):
        nm = n.split("_", 2)[2]
        D[nm[0].lower() + nm[1:]] = kco(k) - P
    elif n.startswith("AA_VI_"):
        v = n.split("_", 3)[3]
        D["viseme_" + {"Sil": "sil", "KK": "kk"}.get(v, v)] = kco(k) - P
    elif n in ("HB_12_TongueUp", "HB_09_TongueIn"):
        D[n] = kco(k) - P
# Amplitude: the source's expression shapes are authored small (smile corner travel 4.3 mm against ~27 mm on our
# in-house keys and roughly 10-15 mm in Apple's reference), and the rig clamps weights at 1, so a runtime gain cannot
# reach a readable smile. The authored deltas of these keys are scaled here (shape kept, travel extended); measured
# max travel before -> after is written to the stats. Visemes, jaw, blink and gaze-lid keys keep the source travel.
KEY_GAIN = {"mouthSmileLeft": 2.6, "mouthSmileRight": 2.6, "mouthDimpleLeft": 1.6, "mouthDimpleRight": 1.6,
            "cheekSquintLeft": 1.35, "cheekSquintRight": 1.35, "eyeSquintLeft": 1.3, "eyeSquintRight": 1.3,
            "browOuterUpLeft": 1.6, "browOuterUpRight": 1.5, "browDownLeft": 1.45, "browDownRight": 1.45,
            "mouthPressLeft": 1.5, "mouthPressRight": 1.1, "mouthFrownLeft": 1.4, "mouthFrownRight": 2.4,
            "mouthStretchLeft": 1.5, "mouthStretchRight": 2.0, "eyeWideLeft": 1.4, "eyeWideRight": 1.2,
            "mouthPucker": 1.5, "mouthRollUpper": 1.5, "cheekPuff": 1.5}
KEY_TRAVEL = {}
for k, g in KEY_GAIN.items():
    if k in D:
        t0 = float(np.linalg.norm(D[k], axis=1).max())
        D[k] = D[k] * g
        KEY_TRAVEL[k] = [round(t0 * 1000, 2), round(t0 * g * 1000, 2), g]
# Rest lid (polish pass): the source's neutral opens the upper lids wide (sclera above the iris; read as a stare). 12%
# of the authored blink is baked into the rest pose, and the blink keys keep 88%, so a full blink still lands closed.
REST_LID = 0.12
P = P + REST_LID * (D["eyeBlinkLeft"] + D["eyeBlinkRight"])
for k in ("eyeBlinkLeft", "eyeBlinkRight"):
    D[k] = D[k] * (1 - REST_LID)
missing = [k for k in ARKIT52 + VISEMES if k not in D]
assert not missing, f"source lacks {missing}"
tmove = np.linalg.norm(D["tongueOut"], axis=1) > 1e-3          # the tongue: what tongueOut moves
D["tongueTipUp"] = D.pop("HB_12_TongueUp")
D["tongueCurl"] = D["tongueTipUp"] * 1.0 + D.pop("HB_09_TongueIn") * 0.8       # retroflex: tip up AND back
tc = P[tmove].mean(0)
tw = np.zeros_like(P)
tw[tmove, 0] = (P[tmove, 0] - tc[0]) * 0.22                       # open a / e: +22% width, 0.6 mm flatter
tw[tmove, 2] = -0.0006 * np.clip(1 - np.abs(P[tmove, 0] - tc[0]) / 0.02, 0, 1)
D["tongueWide"] = tw

# ------------------------------------------------------------------ per-polygon classification
npoly = len(me.polygons)
poly_v = [list(p.vertices) for p in me.polygons]
poly_l = [list(p.loop_indices) for p in me.polygons]
mat = np.array([p.material_index for p in me.polygons])
uv = np.zeros(len(me.loops) * 2, np.float32)
me.uv_layers[0].data.foreach_get("uv", uv)
uv = uv.reshape(-1, 2)
# loose parts (union-find over polygon vertices)
par = np.arange(nv)


def find(a):
    while par[a] != a:
        par[a] = par[par[a]]
        a = par[a]
    return a


for vs in poly_v:
    r0 = find(vs[0])
    for v in vs[1:]:
        r = find(v)
        if r != r0:
            par[r] = r0
root = np.array([find(i) for i in range(nv)])
parts = {}
for i, vs in enumerate(poly_v):
    parts.setdefault(root[vs[0]], []).append(i)
pinfo = {}
for r, ps in parts.items():
    vs = sorted({v for p in ps for v in poly_v[p]})
    pinfo[r] = {"polys": ps, "verts": vs, "c": P[vs].mean(0), "n": len(vs), "mat": int(mat[ps[0]])}
# back-face duplicate cards: same material, same vertex count, same centroid -> keep the first
dup = set()
seen = {}
for r, I in sorted(pinfo.items(), key=lambda x: x[0]):
    key = (I["mat"], I["n"], tuple(np.round(I["c"], 4)))
    if key in seen:
        dup.add(r)
    else:
        seen[key] = r
zc = args.zcut
cls = np.array(["drop"] * npoly, dtype=object)
for r, I in pinfo.items():
    for p in I["polys"]:
        if r in dup or (P[poly_v[p], 2] < zc).any():
            continue
        m, c = int(mat[p]), I["c"]
        if m == 1 and I["n"] < 120 and c[2] > 1.58 and c[1] < -0.02:
            cls[p] = "eyes"
        elif m == 2:
            cls[p] = "cards" if c[1] < 0.0 and I["n"] < 40 else "hair"
        elif m == 1:
            u0 = uv[poly_l[p]].mean(0)
            cls[p] = "interior" if (u0[0] < 0.205 and u0[1] < 0.37) else "face"
        else:
            cls[p] = "garment"
print("CLS", {k: int((cls == k).sum()) for k in ("face","interior","eyes","cards","hair","garment","drop")}, len(dup), P[:,2].min(), P[:,2].max())
stats = {"source": os.path.basename(args.fbx), "zcut": zc, "keyGainMm": KEY_TRAVEL, "duplicateCardParts": len(dup),
         "polys": {k: int((cls == k).sum()) for k in ("face", "interior", "eyes", "cards", "hair", "garment", "drop")}}

# ------------------------------------------------------------------ head texture (mouth interior classification)
img = bpy.data.images.load(os.path.join(TEX, "f007_head_color.tga"))
W_, H_ = img.size
px = np.zeros(W_ * H_ * 4, np.float32)
img.pixels.foreach_get(px)
px = px.reshape(H_, W_, 4)


def tex_at(u, v):
    x = np.clip((u * (W_ - 1)).astype(int), 0, W_ - 1)
    y = np.clip((v * (H_ - 1)).astype(int), 0, H_ - 1)
    return px[y, x, :3]


# ------------------------------------------------------------------ source weights -> contract bones
groups = [g.name for g in src.vertex_groups]
BONES = ["Spine2", "Neck", "Head", "LeftEye", "RightEye", "LeftShoulder", "RightShoulder"]


def target_bone(g):
    if g == "Bip01 Neck":
        return "Neck"
    if g in ("Bip01 Pelvis", "Bip01 Spine", "Bip01 Spine1", "Bip01 Spine2"):
        return "Spine2"
    for s, nm in (("L", "LeftShoulder"), ("R", "RightShoulder")):
        if g.startswith(f"Bip01 {s} "):
            rest = g[len(f"Bip01 {s} "):]
            return nm if rest.startswith(("Clavicle", "UpperArm", "Forearm", "Hand", "Finger")) else "Spine2"
    return "Head"           # Bip01 Head and every face-rig bone (jaw, lips, lids, brows, cheeks, nose, eyes)


Wsrc = np.zeros((nv, len(BONES)))
for v in me.vertices:
    for ge in v.groups:
        Wsrc[v.index, BONES.index(target_bone(groups[ge.group]))] += ge.weight
Wsrc /= np.maximum(Wsrc.sum(1, keepdims=True), 1e-9)

# ------------------------------------------------------------------ rebuild every part as a fresh mesh
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)
coll = bpy.context.scene.collection


def build(name, polys, split=None, weights=None, keys=(), keep_zero=False):
    """split: set of polygon ids whose vertices get their OWN copies (mouth interior: a hard `_region` edge)."""
    vmap, verts, faces, fuv, src_idx = {}, [], [], [], []
    for p in polys:
        f = []
        for v, l in zip(poly_v[p], poly_l[p]):
            key = (v, p in split) if split else v
            if key not in vmap:
                vmap[key] = len(verts)
                verts.append(P[v])
                src_idx.append(v)
            f.append(vmap[key])
            fuv.append(uv[l])
        faces.append(f)
    src_idx = np.array(src_idx)
    m = bpy.data.meshes.new(name)
    m.from_pydata([tuple(x) for x in verts], [], faces)
    m.update()
    ul = m.uv_layers.new(name="UVMap")
    ul.data.foreach_set("uv", np.array(fuv, np.float32).ravel())
    for pp in m.polygons:
        pp.use_smooth = True
    ob = bpy.data.objects.new(name, m)
    coll.objects.link(ob)
    if keys:
        ob.shape_key_add(name="Basis", from_mix=False)
        for k in keys:
            d = D[k][src_idx]
            if np.abs(d).max() < 5e-5 and not keep_zero:   # contract names stay even when the source rests there
                continue
            sk = ob.shape_key_add(name=k, from_mix=False)
            sk.data.foreach_set("co", (P[src_idx] + d).astype(np.float32).ravel())
    W = Wsrc[src_idx] if weights is None else weights(src_idx)
    return ob, src_idx, W, (np.array([(v, True) in vmap for v in []]) if False else None)


idx = lambda k: [i for i in range(npoly) if cls[i] == k]
interior = set(idx("interior"))
face, fsrc, Wf, _ = build("face", idx("face") + sorted(interior), split=interior, keys=TIER_KEYS["H"], keep_zero=True)
eyes, esrc, We, _ = build("eyes", idx("eyes"), weights=lambda s: np.stack([np.zeros(len(s))] * 3 + [
    (P[s, 0] > 0).astype(float), (P[s, 0] <= 0).astype(float)] + [np.zeros(len(s))] * 2, 1))
cards, csrc, Wc, _ = build("cards", idx("cards"), keys=ARKIT52)
hair, hsrc, Wh, _ = build("hair", idx("hair"))
garment, gsrc, Wg, _ = build("garment", idx("garment"))

# `_region` on the face: interior vertex copies are the last ones (split); classify them by tongue motion + texture
nf = len(face.data.vertices)
reg = np.zeros(nf, np.float32)
interior_vert = np.zeros(nf, bool)
for p in face.data.polygons:
    pass
# the split copies: vertices whose polygons are all interior. Rebuild that set from the face mesh's polygon order:
# interior polygons were appended after the skin polygons
n_skin = len(idx("face"))
for p in face.data.polygons[n_skin:]:
    for v in p.vertices:
        interior_vert[v] = True
fuv_v = np.zeros((nf, 2))
for p in face.data.polygons:
    for v, l in zip(p.vertices, p.loop_indices):
        fuv_v[v] = face.data.uv_layers[0].data[l].uv
col = tex_at(fuv_v[:, 0], fuv_v[:, 1])
lum = col @ np.array([0.2126, 0.7152, 0.0722])
red = col[:, 0] / np.maximum(col[:, 1], 1e-3)
isT = tmove[fsrc]
teeth = interior_vert & ~isT & (lum > 0.32) & (red < 1.6)
gum = interior_vert & ~isT & ~teeth & (red >= 1.6) & (lum > 0.08)
# c4 polish (mouth interior): teeth/gum are a per-VERTEX texture lookup, and vertices that land on the dark-red gaps
# between painted teeth were labelled gum; the shader interpolates `_region`, so each one drew a red blotch on the
# tooth row (visible in kk / CH / DD, and in c1). Two passes of neighbour majority over the interior mesh: a non-tongue
# interior vertex with >= half its neighbours teeth becomes teeth; an isolated teeth vertex inside gum becomes gum.
nbr = [set() for _ in range(nf)]
for p in face.data.polygons:
    vs = list(p.vertices)
    for i_, a_ in enumerate(vs):
        nbr[a_].add(vs[i_ - 1]); nbr[a_].add(vs[(i_ + 1) % len(vs)])
cand = interior_vert & ~isT & ((lum > 0.08) | teeth)
for _ in range(2):
    t2 = teeth.copy()
    for v_ in np.nonzero(cand)[0]:
        nn = [w for w in nbr[v_] if cand[w]]
        if not nn:
            continue
        fr = np.mean([teeth[w] for w in nn])
        if fr >= 0.5:
            t2[v_] = True
        elif fr < 0.2:
            t2[v_] = False
    teeth = t2
gum = interior_vert & ~isT & ~teeth & (red >= 1.6) & (lum > 0.08)
reg[interior_vert] = 3
reg[gum] = 1.45
reg[teeth] = 1.0
reg[interior_vert & isT] = 2
stats["region"] = {"teeth": int(teeth.sum()), "gum": int(gum.sum()), "tongue": int((interior_vert & isT).sum()),
                   "bag": int((reg == 3).sum()), "skin": int((reg == 0).sum())}
# interior rides the head only (no neck blend inside the mouth)
Wf[interior_vert] = np.eye(len(BONES))[BONES.index("Head")]
Wc[:] = np.eye(len(BONES))[BONES.index("Head")]
Wh[:] = np.eye(len(BONES))[BONES.index("Head")]


def set_attr(ob, nm, val):
    a = ob.data.attributes.new(nm, "FLOAT", "POINT")
    a.data.foreach_set("value", val.astype(np.float32))


set_attr(face, "_region", reg)

# eye UVs: the source eye texture is one island of the head atlas; remap it to its own small map (tex.py crops it)
eu = np.zeros(len(eyes.data.loops) * 2, np.float32)
eyes.data.uv_layers[0].data.foreach_get("uv", eu)
eu = eu.reshape(-1, 2)
lo, hi = eu.min(0) - 0.004, eu.max(0) + 0.004
eyes.data.uv_layers[0].data.foreach_set("uv", ((eu - lo) / (hi - lo)).astype(np.float32).ravel())
stats["eyeUVBox"] = [float(lo[0]), float(lo[1]), float(hi[0]), float(hi[1])]
# eye sphere (bind space, metres): centre = the source's eye bone, radius from the cap's lateral extent
eyeC = {"L": J["Bip01 LEye"], "R": J["Bip01 REye"]}
ep = np.array([v.co for v in eyes.data.vertices])
stats["eyeCentre"] = {k: v.tolist() for k, v in eyeC.items()}
stats["eyeRadius"] = float(np.median(np.linalg.norm(ep[ep[:, 0] > 0] - eyeC["L"], axis=1)))

# ------------------------------------------------------------------ armature
arm_d = bpy.data.armatures.new("Armature")
arm = bpy.data.objects.new("Armature", arm_d)
coll.objects.link(arm)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode="EDIT")
eb = arm_d.edit_bones


def bone(name, h, t, parent=None):
    b = eb.new(name)
    b.head, b.tail = tuple(map(float, h)), tuple(map(float, t))
    b.roll = 0
    if parent:
        b.parent = eb[parent]


bone("Spine2", J["Bip01 Spine2"], J["Bip01 Neck"])
bone("Neck", J["Bip01 Neck"], J["Bip01 Head"], "Spine2")
bone("Head", J["Bip01 Head"], J["Bip01 Head"] + np.array([0, 0, 0.12]), "Neck")
bone("LeftEye", eyeC["L"], eyeC["L"] + np.array([0, -0.03, 0]), "Head")
bone("RightEye", eyeC["R"], eyeC["R"] + np.array([0, -0.03, 0]), "Head")
bone("LeftShoulder", J["Bip01 L Clavicle"], J["Bip01 L UpperArm"], "Spine2")
bone("RightShoulder", J["Bip01 R Clavicle"], J["Bip01 R UpperArm"], "Spine2")
bpy.ops.object.mode_set(mode="OBJECT")


def assign(ob, W):
    vgs = [ob.vertex_groups.new(name=b) for b in BONES]
    for j, g in enumerate(vgs):
        for i in np.nonzero(W[:, j] > 1e-4)[0]:
            g.add([int(i)], float(W[i, j]), "REPLACE")
    md = ob.modifiers.new("Armature", "ARMATURE")
    md.object = arm
    ob.parent = arm


MATS = {"face": "TaxilaSkin", "eyes": "TaxilaEye", "cards": "TaxilaCards", "hair": "TaxilaHair", "garment": "TaxilaCloth"}
for ob in (face, eyes, cards, hair, garment):
    m = bpy.data.materials.new(MATS[ob.name])
    m.use_nodes = True
    ob.data.materials.append(m)


def subdivide(ob, levels):
    """Catmull-Clark through every shape key: evaluate the modifier per key (keys at 1, one at a time) and rebuild."""
    keys = [k.name for k in ob.data.shape_keys.key_blocks[1:]] if ob.data.shape_keys else []
    md = ob.modifiers.new("sub", "SUBSURF")
    md.levels = md.render_levels = levels
    md.uv_smooth = "PRESERVE_BOUNDARIES"
    md.boundary_smooth = "ALL"
    dg = bpy.context.evaluated_depsgraph_get()

    def ev():
        dg.update()
        e = ob.evaluated_get(dg)
        mm = e.to_mesh()
        a = np.zeros(len(mm.vertices) * 3, np.float32)
        mm.vertices.foreach_get("co", a)
        return mm, a.reshape(-1, 3)
    for k in keys:
        ob.data.shape_keys.key_blocks[k].value = 0
    mm, base = ev()
    nm = bpy.data.meshes.new(ob.name + "_sub")
    nm.from_pydata([tuple(x) for x in base], [], [list(p.vertices) for p in mm.polygons])
    uvn = np.zeros(len(mm.loops) * 2, np.float32)
    mm.uv_layers[0].data.foreach_get("uv", uvn)
    nm.uv_layers.new(name="UVMap").data.foreach_set("uv", uvn)
    attrs = {}
    for a in mm.attributes:
        if a.name.startswith("_") and a.domain == "POINT":
            v = np.zeros(len(mm.vertices), np.float32)
            a.data.foreach_get("value", v)
            attrs[a.name] = v
    # weights through the subdivision: evaluate each bone group as a vertex colour is not possible headless; instead
    # take the nearest-original-vertex weights by position (subdivided vertices sit between their parents)
    shp = {}
    for k in keys:
        ob.data.shape_keys.key_blocks[k].value = 1
        _, co_ = ev()
        ob.data.shape_keys.key_blocks[k].value = 0
        shp[k] = co_
    e = ob.evaluated_get(dg)
    e.to_mesh_clear()
    ob.modifiers.remove(md)
    for p in nm.polygons:
        p.use_smooth = True
    return nm, base, shp, attrs


def rebuild_subdivided(ob, W, levels):
    nm, base, shp, attrs = subdivide(ob, levels)
    # weights: inverse-distance over the 4 nearest original vertices (bind pose)
    orig = np.array([v.co for v in ob.data.vertices])
    from mathutils.kdtree import KDTree
    kd = KDTree(len(orig))
    for i, c in enumerate(orig):
        kd.insert(c, i)
    kd.balance()
    Wn = np.zeros((len(base), W.shape[1]))
    for i, c in enumerate(base):
        hits = kd.find_n(c, 4)
        ws = np.array([1 / max(d, 1e-5) for _, _, d in hits])
        ids = [h[1] for h in hits]
        Wn[i] = (W[ids] * ws[:, None]).sum(0) / ws.sum()
    name = ob.name
    mats = list(ob.data.materials)
    bpy.data.objects.remove(ob, do_unlink=True)
    nob = bpy.data.objects.new(name, nm)
    bpy.context.scene.collection.objects.link(nob)
    for m in mats:
        nm.materials.append(m)
    for k, v in attrs.items():
        if k == "_region":
            # the subdivision blends region ids on mixed polygons; the interior is split, so round is exact there
            v = np.where(v > 0.5, np.where(np.abs(v - 1.45) < 0.2, 1.45, np.round(v)), 0)
        set_attr(nob, k, v)
    if shp:
        nob.shape_key_add(name="Basis", from_mix=False)
        for k, co_ in shp.items():
            sk = nob.shape_key_add(name=k, from_mix=False)
            sk.data.foreach_set("co", co_.astype(np.float32).ravel())
    return nob, Wn


def keep_keys(ob, allowed):
    if ob.data.shape_keys:
        for k in list(ob.data.shape_keys.key_blocks)[1:]:
            if k.name not in allowed:
                ob.shape_key_remove(k)


def tris(ob):
    return int(sum(len(p.vertices) - 2 for p in ob.data.polygons))


# B+ first (source geometry), then H (subdivided) from a reload of the same scene state
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(args.out, "base.blend"))
for tier in ("Bplus", "H"):
    bpy.ops.wm.open_mainfile(filepath=os.path.join(args.out, "base.blend"))
    O = bpy.data.objects
    arm = O["Armature"]
    W = {"face": Wf, "eyes": We, "cards": Wc, "hair": Wh, "garment": Wg}
    obs = {n: O[n] for n in W}
    keep_keys(obs["face"], set(TIER_KEYS[tier]))
    if tier == "H" and args.subdiv_h > 0:
        for n in ("face", "garment"):
            obs[n], W[n] = rebuild_subdivided(obs[n], W[n], args.subdiv_h)
    for n, ob in obs.items():
        assign(ob, W[n])
    st = dict(stats)
    st["tier"] = tier
    st["meshes"] = {n: {"verts": len(o.data.vertices), "tris": tris(o),
                        "keys": (len(o.data.shape_keys.key_blocks) - 1) if o.data.shape_keys else 0} for n, o in obs.items()}
    st["tris"] = sum(v["tris"] for v in st["meshes"].values())
    st["draws"] = len(obs)
    st["faceKeys"] = [k.name for k in obs["face"].data.shape_keys.key_blocks[1:]]
    st["missingKeys"] = [k for k in TIER_KEYS[tier] if k not in st["faceKeys"]]
    out = os.path.join(args.out, f"{tier}.raw.glb")
    bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_morph=True, export_morph_normal=False,
                              export_skins=True, export_attributes=True, export_yup=True, export_texcoords=True,
                              export_normals=True, export_tangents=False, export_materials="EXPORT",
                              export_animations=False, export_apply=False, use_selection=False, export_extras=False,
                              export_image_format="NONE")
    st["rawBytes"] = os.path.getsize(out)
    json.dump(st, open(os.path.join(args.out, f"{tier}.stats.json"), "w"), indent=1)
    print(json.dumps({k: v for k, v in st.items() if k != "faceKeys"}, indent=1))
sys.stdout.flush()
os._exit(0)
