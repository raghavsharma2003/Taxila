"""Stage 2 (headless Blender): base.blend -> one tier's raw GLB (geometry, morphs, skin, UVs; textures attached later).

    bpyenv/bin/python scripts/character/blender/export_tier.py --look <look.json> --build <dir> --tier H|Bplus

Tiers (TEACHER-VISUAL §5, §10): one source, two geometry levels. B-lite reuses the B+ geometry (finish.mjs).
  H     : hi eyes (cornea + iris layers), brow + lash cards, full card hair, all 82 keys, lens layer (glasses look)
  Bplus : lo eyes, lash cards only (brows painted in the albedo), hair decimated to the B+ card budget,
          ARKit 52 + tongueTipUp + 3 correctives (5 keys, sided)
Draw calls = meshes, one material each: face, eyes, cards, hair, garment (+ lens on H for glasses).
"""
import argparse, json, math, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
import bpy
from mpfb_env import co, smoothstep, select_only, hex_lin
import keys as K

ap = argparse.ArgumentParser()
ap.add_argument("--look", required=True)
ap.add_argument("--build", required=True)
ap.add_argument("--tier", required=True, choices=["H", "Bplus"])
args = ap.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:])
look = json.load(open(args.look))
rep = json.load(open(os.path.join(args.build, "report.json")))
bpy.ops.wm.open_mainfile(filepath=os.path.join(args.build, "base.blend"))
J = {k: np.array(v) for k, v in rep["joints"].items()}
eyeC = {k: np.array(v) for k, v in rep["eyeC"].items()}
tier = args.tier
O = bpy.data.objects
stats = {"tier": tier}


def attr(ob, nm):
    a = np.zeros(len(ob.data.vertices), np.float32)
    ob.data.attributes[nm].data.foreach_get("value", a)
    return a


def remove(ob):
    if ob is not None:
        bpy.data.objects.remove(ob, do_unlink=True)


def keep_keys(ob, allowed):
    if not ob.data.shape_keys:
        return
    for kb in list(ob.data.shape_keys.key_blocks)[1:]:
        if kb.name not in allowed:
            ob.shape_key_remove(kb)


def decimate(ob, max_tris):
    tris = sum(len(p.vertices) - 2 for p in ob.data.polygons)
    if tris <= max_tris:
        return
    md = ob.modifiers.new("dec", "DECIMATE")
    md.ratio = max_tris / tris * 0.98
    select_only([ob])
    bpy.ops.object.modifier_apply(modifier="dec")


# ------------------------------------------------------------------ tier selection
allowed = set(K.tier_keys(tier))
face = O["face"]
keep_keys(face, allowed)
if tier == "H":
    remove(O.get("eyes_lo"))
    eyes = O["eyes"]
    select_only([O["brows"], O["lashes"]])
    bpy.context.view_layer.objects.active = O["brows"]
    bpy.ops.object.join()
    cards = O["brows"]
else:
    remove(O.get("eyes"))
    eyes = O["eyes_lo"]
    remove(O.get("brows"))
    remove(O.get("lens"))
    cards = O["lashes"]
    decimate(O["hair"], 3000)
    decimate(O["garment"], 2200)
eyes.name = "eyes"
cards.name = "cards"
keep_keys(cards, allowed & set(K.ARKIT52))
hair, garment = O["hair"], O["garment"]
lens = O.get("lens")

# ------------------------------------------------------------------ attributes: only _region survives (face)
reg = attr(face, "region")
for ob in [o for o in O if o.type == "MESH"]:
    for a in [a.name for a in ob.data.attributes if not a.is_internal and a.name not in ("position",)
              and a.domain == "POINT" and a.data_type == "FLOAT" and not a.name.startswith(".")]:
        ob.data.attributes.remove(ob.data.attributes[a])
a = face.data.attributes.new("_region", "FLOAT", "POINT")
a.data.foreach_set("value", reg)
# UV maps: exactly one per mesh
for ob in [o for o in O if o.type == "MESH"]:
    while len(ob.data.uv_layers) > 1:
        ob.data.uv_layers.remove(ob.data.uv_layers[-1])
    if len(ob.data.uv_layers) == 0:
        ob.data.uv_layers.new(name="UVMap")
    for p in ob.data.polygons:
        p.use_smooth = True

# ------------------------------------------------------------------ one named material per mesh (= one draw each)
MATS = {"face": "TaxilaSkin", "eyes": "TaxilaEye", "cards": "TaxilaCards", "hair": "TaxilaHair", "garment": "TaxilaCloth",
        "lens": "TaxilaLens"}
for nm, mn in MATS.items():
    ob = O.get(nm)
    if ob is None:
        continue
    ob.data.materials.clear()
    m = bpy.data.materials.new(mn)
    m.use_nodes = True
    ob.data.materials.append(m)
    for p in ob.data.polygons:
        p.material_index = 0

# ------------------------------------------------------------------ armature (Mixamo-style names, root "Armature")
arm_d = bpy.data.armatures.new("Armature")
arm = bpy.data.objects.new("Armature", arm_d)
bpy.context.collection.objects.link(arm)
select_only([arm])
bpy.ops.object.mode_set(mode="EDIT")
eb = arm_d.edit_bones
zc = J["joint-l-clavicle"][2]
yN = J["joint-neck"][1]


def bone(name, h, t, parent=None):
    b = eb.new(name)
    b.head, b.tail = tuple(h), tuple(t)
    b.roll = 0
    if parent:
        b.parent = eb[parent]
    return b


bone("Spine2", (0, yN + 0.01, rep["zCut"] + 0.03), J["joint-neck"])
bone("Neck", J["joint-neck"], J["joint-head"], "Spine2")
bone("Head", J["joint-head"], J["joint-head"] + np.array([0, 0, 0.12]), "Neck")
for side, nm in (("L", "LeftEye"), ("R", "RightEye")):
    bone(nm, eyeC[side], eyeC[side] + np.array([0, -0.03, 0]), "Head")
for sg, nm in ((1, "LeftShoulder"), (-1, "RightShoulder")):
    bone(nm, (sg * 0.02, yN, zc), J["joint-l-shoulder"] * np.array([sg, 1, 1]), "Spine2")
bpy.ops.object.mode_set(mode="OBJECT")
BONES = ["Spine2", "Neck", "Head", "LeftEye", "RightEye", "LeftShoulder", "RightShoulder"]


def head_weight(P):
    q = J["joint-head"] - np.array([0, 0, 0.012])
    n = np.array([0.0, -0.55, 0.835])
    return smoothstep(-0.018, 0.012, (P - q) @ n)


def body_weights(P, allow_head=True):
    wH = head_weight(P) if allow_head else np.zeros(len(P))
    rest = 1 - wH
    wN = rest * smoothstep(zc - 0.01, zc + 0.045, P[:, 2])
    wS = rest - wN
    sh = smoothstep(0.06, 0.14, np.abs(P[:, 0])) * smoothstep(zc - 0.08, zc - 0.02, P[:, 2])
    wSh = wS * sh
    wS = wS - wSh
    return {"Head": wH, "Neck": wN, "Spine2": wS,
            "LeftShoulder": wSh * (P[:, 0] > 0), "RightShoulder": wSh * (P[:, 0] <= 0)}


def assign(ob, W):
    vgs = {b: ob.vertex_groups.new(name=b) for b in BONES}
    for b, w in W.items():
        for i in np.nonzero(w > 1e-4)[0]:
            vgs[b].add([int(i)], float(w[i]), "REPLACE")
    md = ob.modifiers.new("Armature", "ARMATURE")
    md.object = arm
    ob.parent = arm


Pf = co(face.data)
Wf = body_weights(Pf)
inner = reg > 0
for k in Wf:
    Wf[k] = np.where(inner, 1.0 if k == "Head" else 0.0, Wf[k])
assign(face, Wf)
Pe = co(eyes.data)
assign(eyes, {"LeftEye": (Pe[:, 0] > 0).astype(float), "RightEye": (Pe[:, 0] <= 0).astype(float)})
for ob in (cards, hair) + ((lens,) if lens else ()):
    assign(ob, {"Head": np.ones(len(ob.data.vertices))})
Pg = co(garment.data)
Wg = body_weights(Pg, allow_head=False)
# accessories (glasses, studs) ride the head: they are the verts above the collar near the face/ears
acc = Pg[:, 2] > J["joint-head"][2] - 0.03
for k in Wg:
    Wg[k] = np.where(acc, 1.0 if k == "Head" else 0.0, Wg[k])
assign(garment, Wg)

# ------------------------------------------------------------------ stats + export
def tri_count(ob):
    return int(sum(len(p.vertices) - 2 for p in ob.data.polygons))


stats["meshes"] = {o.name: {"verts": len(o.data.vertices), "tris": tri_count(o),
                            "keys": (len(o.data.shape_keys.key_blocks) - 1) if o.data.shape_keys else 0}
                   for o in O if o.type == "MESH"}
stats["tris"] = sum(v["tris"] for v in stats["meshes"].values())
stats["draws"] = len(stats["meshes"])
stats["faceKeys"] = [k.name for k in face.data.shape_keys.key_blocks[1:]]
out = os.path.join(args.build, f"{tier}.raw.glb")
bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_morph=True, export_morph_normal=False,
                          export_skins=True, export_attributes=True, export_yup=True, export_texcoords=True,
                          export_normals=True, export_tangents=False, export_materials="EXPORT", export_animations=False,
                          export_apply=False, use_selection=False, export_extras=False, export_image_format="NONE")
stats["rawBytes"] = os.path.getsize(out)
json.dump(stats, open(os.path.join(args.build, f"{tier}.stats.json"), "w"), indent=1)
print(json.dumps({k: v for k, v in stats.items() if k != "faceKeys"}, indent=1))

sys.stdout.flush()
os._exit(0)   # bpy 4.2 can segfault in interpreter teardown; everything is written by now
