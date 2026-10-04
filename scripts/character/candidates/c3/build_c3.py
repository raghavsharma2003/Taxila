"""c3 stage 1+2 (headless Blender): pixiv's VRoid-made VRM sample (VRM Public License 1.0, commercial use by corporations
allowed, modification + redistribution allowed) -> our runtime contract, raw GLBs per tier.

    bpyenv/bin/python scripts/character/candidates/c3/build_c3.py --out <buildDir> [--tier H|Bplus|both]

Slot 3 of docs/design/teacher/polished/SCOUT.md is Avaturn (a third-party photo-to-avatar AI service). Not used here:
see art/character/LICENSES.md (c3 section) for why. This builds the scout's other free, unused option: the VRoid / VRM
row (row 9), from the VRM consortium's sample `VRM1_Constraint_Twist_Sample` ((c) 2022 pixiv Inc.).

What it does (CHARACTER-PIPELINE.md §4 is the contract it lands in):
  - imports the VRM (a glTF 2.0 binary) with Blender's glTF importer; the arms are posed down from the T-pose (upper
    arms 72 deg) and the body is evaluated through its own skin, so the bust has shoulders instead of arm stubs;
  - parts: face (face skin + neck/chest skin + the mouth interior + eye whites + eyelines + brows, one atlas, with
    `_region` 0 skin / 1 teeth / 2 tongue / 3 mouth bag / 4 painted feature), eyes (iris + highlight, on the eye bones),
    hair (front/side hair + the scalp cap, one atlas), garment (the top);
  - hidden body skin (under the top) is removed by ray casting; everything below the bust line is cut;
  - optional eye-region warp (look.eyeScale): the anime eye opening is scaled about each eye centre with a smooth
    falloff, a step toward an adult, feature-animation register (deltas follow the warp's local scale);
  - keys: VRoid ships 57 `Fcl_*` morphs (whole-face presets, brows, lids, mouth vowels, teeth), not ARKit. The 52 ARKit
    keys, the 15 visemes and the 3 Hindi tongue keys are SYNTHESISED from them: side masks, lip / jaw / lid region masks
    and a few procedural region moves (jaw slide, lip roll, tongue, cheek puff). Recipes are in `synth_keys` below;
  - our 7-bone armature (Spine2 Neck Head LeftEye RightEye LeftShoulder RightShoulder), weights collapsed from VRoid's
    ~150 bones; long hair fades from Head to Spine2 below the jaw so a head turn does not swing it through the chest;
  - H: native resolution, all 70 keys; B+: hair decimated to fit 18k tris, ARKit 52 + tongueTipUp.
"""
import argparse, json, math, os, sys
import numpy as np
import bpy, bmesh
from mathutils import Matrix, Vector
from mathutils.bvhtree import BVHTree

ap = argparse.ArgumentParser()
ap.add_argument("--out", required=True)
ap.add_argument("--tier", default="both")
args = ap.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:])
os.makedirs(args.out, exist_ok=True)
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.environ.get("C3_SRC", "/tmp/claude-0/char/c3/src")
VRM = os.path.join(SRC, "VRM1_Constraint_Twist_Sample.vrm")
LOOK = json.load(open(os.path.join(HERE, "../../../../art/character/candidates/c3/look.json")))
ZCUT = LOOK.get("bustCut", 1.10)

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

# ------------------------------------------------------------------ import + pose
bpy.ops.wm.read_factory_settings(use_empty=True)
glb = os.path.join(args.out, "src.glb")
if not os.path.exists(glb):
    import shutil
    shutil.copy(VRM, glb)
bpy.ops.import_scene.gltf(filepath=glb)
arm = [o for o in bpy.data.objects if o.type == "ARMATURE"][0]
AW = np.array(arm.matrix_world)
bonesW = {b.name: (AW @ np.array(list(b.head_local) + [1.0]))[:3] for b in arm.data.bones}

ARM_DEG = LOOK.get("armDownDeg", 72.0)
aw3 = arm.matrix_world.to_3x3()
for side, sg in (("L", 1), ("R", -1)):
    pb = arm.pose.bones[f"J_Bip_{side}_UpperArm"]
    Rw = Matrix.Rotation(math.radians(ARM_DEG) * sg, 3, "Y")
    Ra = aw3.inverted() @ Rw @ aw3
    ML = pb.bone.matrix_local.to_3x3()
    pb.rotation_mode = "QUATERNION"
    pb.rotation_quaternion = (ML.inverted() @ Ra @ ML).to_quaternion()
    # forearms hang straight down with the upper arm (no extra bend); a slight forward swing reads relaxed
    pf = arm.pose.bones[f"J_Bip_{side}_LowerArm"]
    Rf = Matrix.Rotation(math.radians(8) * sg, 3, "Z")
    MLf = pf.bone.matrix_local.to_3x3()
    pf.rotation_mode = "QUATERNION"
    pf.rotation_quaternion = (MLf.inverted() @ (aw3.inverted() @ Rf @ aw3) @ MLf).to_quaternion()
bpy.context.view_layer.update()
# VRMC_node_constraint is not evaluated by Blender: the shoulder / sleeve aim bones (aim at the elbow, weight 1) would stay
# in the T-pose and tear the sleeve. Solve them here: rotate each aim bone (in world space, about its head) from its
# rest direction to the posed elbow; the roll bones under them inherit that swing (their twist share is ignored).
for side in ("L", "R"):
    elbow_rest = Vector(bonesW[f"J_Bip_{side}_LowerArm"])
    elbow_now = arm.matrix_world @ arm.pose.bones[f"J_Bip_{side}_LowerArm"].head
    for nm in (f"J_Aim_{side}_Shoulder", f"J_Aim_{side}_TopsUpperArm"):
        pb = arm.pose.bones[nm]
        h = arm.matrix_world @ pb.head
        q = (elbow_rest - h).rotation_difference(elbow_now - h)
        Ra = aw3.inverted() @ q.to_matrix() @ aw3
        ML = pb.bone.matrix_local.to_3x3()
        pb.rotation_mode = "QUATERNION"
        pb.rotation_quaternion = (ML.inverted() @ Ra @ ML).to_quaternion()
    bpy.context.view_layer.update()
dg = bpy.context.evaluated_depsgraph_get()


def read_mesh(name, evaluated):
    ob = bpy.data.objects[name]
    mw = np.array(ob.matrix_world)
    me_src = ob.data
    if evaluated:
        ev = ob.evaluated_get(dg)
        me = ev.to_mesh()
    else:
        me = me_src
    n = len(me.vertices)
    co = np.zeros(n * 3, np.float32)
    me.vertices.foreach_get("co", co)
    co = co.reshape(-1, 3).astype(np.float64)
    W3 = mw[:3, :3]
    P = co @ W3.T + mw[:3, 3]
    # per-vertex normal from the corner normals (glTF vertices are not merged by the importer, so this is the file's)
    cn = np.zeros(len(me.loops) * 3, np.float32)
    me.corner_normals.foreach_get("vector", cn) if hasattr(me, "corner_normals") else None
    cn = cn.reshape(-1, 3)
    lv = np.zeros(len(me.loops), np.int64)
    me.loops.foreach_get("vertex_index", lv)
    N = np.zeros((n, 3))
    np.add.at(N, lv, cn)
    N = N @ W3.T
    N /= np.maximum(np.linalg.norm(N, axis=1, keepdims=True), 1e-12)
    uvl = np.zeros(len(me.loops) * 2, np.float32)
    me.uv_layers.active.data.foreach_get("uv", uvl)
    uvl = uvl.reshape(-1, 2)
    UV = np.zeros((n, 2))
    UV[lv] = uvl
    tris, tmat = [], []
    me.calc_loop_triangles()
    for t in me.loop_triangles:
        tris.append(list(t.vertices))
        tmat.append(t.material_index)
    vg = {g.index: g.name for g in ob.vertex_groups}
    Wt = [{vg[g.group]: g.weight for g in v.groups if g.weight > 0 and g.group in vg} for v in me_src.vertices]
    keys = {}
    if not evaluated and me.shape_keys:
        for kb in me.shape_keys.key_blocks[1:]:
            k = np.zeros(n * 3, np.float32)
            kb.data.foreach_get("co", k)
            keys[kb.name.split(".")[-1]] = (k.reshape(-1, 3).astype(np.float64) @ W3.T + mw[:3, 3]) - P
    mats = [m.name for m in me_src.materials]
    if evaluated:
        ev.to_mesh_clear()
    return dict(P=P, N=N, UV=UV, T=np.array(tris), TM=np.array(tmat), W=Wt, keys=keys, mats=mats)


FACE = read_mesh("Face", False)
BODY = read_mesh("Body", True)
HAIR = read_mesh("Hair", False)
F = FACE["keys"]
stats = {"source": "VRM1_Constraint_Twist_Sample (c) 2022 pixiv Inc., VRM Public License 1.0", "armDownDeg": ARM_DEG}

# ------------------------------------------------------------------ face-mesh vertex classes
fm = FACE["mats"]
vcls = np.full(len(FACE["P"]), -1)
for t, m in zip(FACE["T"], FACE["TM"]):
    vcls[t] = m
iM = fm.index("FaceMouth_00_FACE"); iIris = fm.index("EyeIris_00_EYE"); iSkin = fm.index("Face_00_SKIN")
iWhite = fm.index("EyeWhite_00_EYE"); iLine = fm.index("FaceEyeline_00_FACE"); iBrow = fm.index("FaceBrow_00_FACE")
iHl = fm.index("EyeHighlight_00_EYE")
P0 = FACE["P"].copy()
isMouth, isSkin = vcls == iM, vcls == iSkin
isEyeBall = (vcls == iIris) | (vcls == iHl)
isLid = (vcls == iWhite) | (vcls == iLine)

# mouth interior regions from the mouth texture's layout (FaceMouth_00: teeth top-left, tongue top-right, bag bottom)
uvM = FACE["UV"]
region = np.zeros(len(P0))
mreg = np.where((uvM[:, 1] > 0.5) & (uvM[:, 0] < 0.5), 1.0, np.where((uvM[:, 1] > 0.5) & (uvM[:, 0] >= 0.5), 2.0, 3.0))
region[isMouth] = mreg[isMouth]
region[(vcls == iWhite) | (vcls == iLine)] = 4.0
region[vcls == iBrow] = 5.0           # brows: drawn through the fringe by the toon shader (anime convention), else hidden
stats["mouthRegions"] = {k: int(((region == v) & isMouth).sum()) for k, v in (("teeth", 1), ("tongue", 2), ("bag", 3))}

# ------------------------------------------------------------------ landmarks
eyeC = {}
for side, sg in (("L", 1), ("R", -1)):
    s = (vcls == iWhite) & (P0[:, 0] * sg > 0)
    lo, hi = P0[s].min(0), P0[s].max(0)
    eyeC[side] = (lo + hi) / 2
irisC = {}
for side, sg in (("L", 1), ("R", -1)):
    s = (vcls == iIris) & (P0[:, 0] * sg > 0)
    irisC[side] = (P0[s].min(0) + P0[s].max(0)) / 2
mz = float(np.median(P0[isMouth, 2]))
mouthC = np.array([0.0, P0[isSkin & (np.abs(P0[:, 0]) < 0.004) & (np.abs(P0[:, 2] - mz) < 0.006), 1].min(), mz])
stats["landmarks"] = {"eyeWhiteCentre": {k: v.round(4).tolist() for k, v in eyeC.items()}, "mouth": mouthC.round(4).tolist()}

# ------------------------------------------------------------------ eye-region warp (look.eyeScale)
ES = LOOK.get("eyeScale", 1.0)
ESY = LOOK.get("eyeScaleV", ES)
WARP = np.ones((len(P0), 2))
if ES != 1.0 or ESY != 1.0:
    r0, r1 = LOOK.get("eyeWarpR", [0.024, 0.05])
    for side, sg in (("L", 1), ("R", -1)):
        c = eyeC[side]
        dx, dz = P0[:, 0] - c[0], P0[:, 2] - c[2]
        r = np.hypot(dx / 1.25, dz)
        t = np.clip((r - r0) / (r1 - r0), 0, 1)
        t = t * t * (3 - 2 * t)
        sx, sz = ES + (1 - ES) * t, ESY + (1 - ESY) * t
        sel = (P0[:, 0] * sg > -0.004) & (r < r1) & ~isMouth
        WARP[sel, 0] = sx[sel]; WARP[sel, 1] = sz[sel]
        P0[sel, 0] = c[0] + dx[sel] * sx[sel]
        P0[sel, 2] = c[2] + dz[sel] * sz[sel]
    for k in F:
        F[k][:, 0] *= WARP[:, 0]
        F[k][:, 2] *= WARP[:, 1]
    for side, sg in (("L", 1), ("R", -1)):
        s = (vcls == iIris) & (P0[:, 0] * sg > 0)
        irisC[side] = (P0[s].min(0) + P0[s].max(0)) / 2
FACE["P"] = P0
stats["eyeScale"] = [ES, ESY]


# ------------------------------------------------------------------ key synthesis
def ss(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


X, Y, Z = P0[:, 0], P0[:, 1], P0[:, 2]
SIDE = {"Left": ss(-0.006, 0.006, X), "Right": 1 - ss(-0.006, 0.006, X)}
S_ = {"Left": "L", "Right": "R"}
z0 = mouthC[2]
rm = np.hypot((X - mouthC[0]) / 1.4, Z - z0)                    # mouth-elliptic radius
lipRing = (1 - ss(0.006, 0.016, rm)) * (isSkin | isMouth)
lipNear = (1 - ss(0.010, 0.026, rm)) * (isSkin | isMouth)
upper, lower = ss(-0.0015, 0.0015, Z - z0), 1 - ss(-0.0015, 0.0015, Z - z0)
dA = np.linalg.norm(F["Fcl_MTH_A"], axis=1)
jaw = np.clip(dA / max(dA[isSkin | isMouth].max(), 1e-9), 0, 1) * lower * (isSkin | isMouth)
eyeUp = {s: ss(-0.002, 0.003, Z - eyeC[S_[s]][2]) for s in SIDE}
eyeLo = {s: 1 - eyeUp[s] for s in SIDE}
eyeNear = {s: (1 - ss(0.03, 0.045, np.hypot(X - eyeC[S_[s]][0], Z - eyeC[S_[s]][2]))) for s in SIDE}
notBall = (~isEyeBall).astype(float)
inner = 1 - ss(0.012, 0.05, np.abs(X))
outer = ss(0.02, 0.06, np.abs(X))
tongue = (region == 2) & isMouth
tfront = ss(np.percentile(-Y[tongue], 10), np.percentile(-Y[tongue], 95), -Y) * tongue if tongue.any() else np.zeros(len(P0))
N0 = FACE["N"]
V3 = lambda x, y, z: np.array([x, y, z], float)
M = lambda w: np.asarray(w, float)[:, None]
K = {}
for s in ("Left", "Right"):
    sd = M(SIDE[s])
    K[f"eyeBlink{s}"] = F[f"Fcl_EYE_Close_{S_[s]}"].copy()
    joyS = F[f"Fcl_EYE_Joy_{S_[s]}"]
    K[f"eyeSquint{s}"] = joyS * M(eyeLo[s] * 0.5 + eyeUp[s] * 0.12)
    K[f"cheekSquint{s}"] = joyS * M(eyeLo[s] * 0.3) + F["Fcl_MTH_Fun"] * M(SIDE[s] * isSkin * ss(0.004, 0.012, Z - z0) * 0.25)
    K[f"eyeWide{s}"] = F["Fcl_EYE_Surprised"] * sd * M(notBall) + 0.5 * F["Fcl_EYE_Spread"] * sd * M(notBall)
    cl = F[f"Fcl_EYE_Close_{S_[s]}"]
    K[f"eyeLookDown{s}"] = 0.28 * cl * M(eyeUp[s])
    K[f"eyeLookUp{s}"] = -0.12 * cl * M(eyeUp[s]) + 0.3 * F["Fcl_EYE_Surprised"] * sd * M(notBall * eyeUp[s])
    toward_nose = -1.0 if s == "Left" else 1.0
    lidw = M(eyeNear[s] * eyeUp[s] * (isLid | isSkin) * sd[:, 0])
    K[f"eyeLookIn{s}"] = lidw * V3(0.0009 * toward_nose, 0, 0)
    K[f"eyeLookOut{s}"] = lidw * V3(-0.0009 * toward_nose, 0, 0)
    K[f"browDown{s}"] = 0.85 * F["Fcl_BRW_Angry"] * sd
    K[f"browOuterUp{s}"] = F["Fcl_BRW_Surprised"] * sd * M(outer)
    K[f"mouthSmile{s}"] = F["Fcl_MTH_Fun"] * sd
    K[f"mouthFrown{s}"] = F["Fcl_MTH_Angry"] * sd
    K[f"mouthDimple{s}"] = 0.35 * F["Fcl_MTH_Fun"] * sd * M(ss(0.008, 0.016, np.abs(X))) + M(lipNear * SIDE[s] * ss(0.01, 0.02, np.abs(X))) * V3(0, 0.0012, 0)
    K[f"mouthStretch{s}"] = 0.8 * F["Fcl_MTH_I"] * sd
    K[f"mouthPress{s}"] = F["Fcl_MTH_Close"] * sd + M(lipRing * SIDE[s] * (isSkin)) * (M(upper) * V3(0, 0, -0.0006) + M(lower) * V3(0, 0, 0.0006))
    K[f"mouthLowerDown{s}"] = 0.8 * F["Fcl_MTH_E"] * sd * M(lower)
    K[f"mouthUpperUp{s}"] = (0.6 * F["Fcl_MTH_E"] + 0.4 * F["Fcl_MTH_I"]) * sd * M(upper)
    nose = (1 - ss(0.006, 0.016, np.hypot(X - 0.008 * (1 if s == "Left" else -1), Z - (z0 + 0.03)))) * isSkin
    K[f"noseSneer{s}"] = M(nose * SIDE[s]) * V3(0, 0, 0.0016) + 0.15 * F["Fcl_BRW_Angry"] * sd
K["browInnerUp"] = F["Fcl_BRW_Sorrow"] * M(inner) + 0.35 * F["Fcl_BRW_Surprised"] * M(inner)
cheek = (1 - ss(0.008, 0.022, np.hypot(np.abs(X) - 0.05, Z - (z0 + 0.025)))) * isSkin
K["cheekPuff"] = M(cheek) * N0 * 0.003
K["jawOpen"] = F["Fcl_MTH_A"].copy()
K["jawForward"] = M(jaw) * V3(0, -0.0025, 0)
K["jawLeft"] = M(jaw) * V3(0.003, 0, 0)
K["jawRight"] = M(jaw) * V3(-0.003, 0, 0)
K["mouthClose"] = -F["Fcl_MTH_A"] * M(lipRing * lower)
K["mouthFunnel"] = 0.9 * F["Fcl_MTH_O"]
K["mouthPucker"] = 0.8 * F["Fcl_MTH_Small"] + M(lipRing) * V3(0, -0.0025, 0)
K["mouthLeft"] = M(lipNear) * V3(0.004, 0, 0)
K["mouthRight"] = M(lipNear) * V3(-0.004, 0, 0)
lipRoll = (1 - ss(0.004, 0.010, rm)) * isSkin
K["mouthRollLower"] = M(lipRoll * lower) * V3(0, 0.0015, 0.0009)
K["mouthRollUpper"] = M(lipRoll * upper) * V3(0, 0.0015, -0.0009)
K["mouthShrugLower"] = M(lipNear * lower * isSkin) * V3(0, -0.0006, 0.0016)
K["mouthShrugUpper"] = M(lipNear * upper * isSkin) * V3(0, -0.0004, 0.0010)
K["tongueOut"] = M(tongue) * V3(0, -0.009, 0.0004) * M(0.4 + 0.6 * tfront)
K["tongueTipUp"] = M(tfront) * V3(0, 0, 0.004)
K["tongueCurl"] = M(tfront) * V3(0, 0.0025, 0.0045)
K["tongueWide"] = M(tongue) * np.stack([X * 0.15, np.zeros_like(X), np.full_like(X, -0.001)], 1)
# visemes (H): VRoid's own vowels where they exist, consonants mixed from them and the synthesised lip / tongue keys
A_, I_, U_, E_, O_ = (F[f"Fcl_MTH_{v}"] for v in "AIUEO")
press = K["mouthPressLeft"] + K["mouthPressRight"]
K["viseme_sil"] = 0.3 * F["Fcl_MTH_Close"]
K["viseme_PP"] = F["Fcl_MTH_Close"] + press + 0.5 * (K["mouthRollLower"] + K["mouthRollUpper"])
K["viseme_FF"] = 0.3 * I_ + K["mouthRollLower"] * 1.2 + 0.15 * (K["mouthUpperUpLeft"] + K["mouthUpperUpRight"])
K["viseme_TH"] = 0.3 * A_ + 0.5 * K["tongueOut"]
K["viseme_DD"] = 0.32 * A_ + 0.2 * I_ + 0.6 * K["tongueTipUp"]
K["viseme_kk"] = 0.4 * A_ + 0.2 * E_
K["viseme_CH"] = 0.5 * U_ + 0.3 * I_
K["viseme_SS"] = 0.7 * I_
K["viseme_nn"] = 0.25 * A_ + 0.2 * E_ + 0.4 * K["tongueTipUp"]
K["viseme_RR"] = 0.5 * O_ + 0.3 * U_
K["viseme_aa"] = A_.copy()
K["viseme_E"] = E_.copy()
K["viseme_I"] = I_.copy()
K["viseme_O"] = O_.copy()
K["viseme_U"] = U_.copy()
for k, g in LOOK.get("keyGain", {}).items():
    if not k.startswith("_"):
        K[k] = K[k] * g
missing = [k for k in ARKIT52 + VISEMES + TONGUE if k not in K]
assert not missing, missing
# rest pose baked into the basis (a soft closed smile; VRoid's neutral is a flat line)
for k, w in LOOK.get("restPose", {}).items():
    if not k.startswith("_"):
        FACE["P"] = FACE["P"] + w * K[k]
stats["keyMaxMm"] = {k: round(float(np.linalg.norm(K[k], axis=1).max() * 1000), 2) for k in ARKIT52 + VISEMES + TONGUE}
assert all(v > 0.05 for v in stats["keyMaxMm"].values()), [k for k, v in stats["keyMaxMm"].items() if v <= 0.05]

# ------------------------------------------------------------------ weights: VRoid bones -> our 7
def collapse(w, z):
    out = {}
    for b, x in w.items():
        if b in ("J_Adj_L_FaceEye",):
            t = "LeftEye"
        elif b in ("J_Adj_R_FaceEye",):
            t = "RightEye"
        elif b == "J_Bip_C_Neck":
            t = "Neck"
        elif b == "J_Bip_C_Head" or b.startswith("J_Adj_") or b.startswith("J_Sec_Hair"):
            t = "Head"
        elif "_L_" in b and ("Shoulder" in b or "Arm" in b or "Hand" in b or "Tops" in b and "Arm" in b):
            t = "LeftShoulder"
        elif "_R_" in b and ("Shoulder" in b or "Arm" in b or "Hand" in b):
            t = "RightShoulder"
        else:
            t = "Spine2"
        out[t] = out.get(t, 0) + x
    s = sum(out.values()) or 1.0
    return {k: v / s for k, v in out.items()}


def hair_weights(w, z):
    """hair strands hang from the head; below the jaw they fade to the chest so a head turn does not swing them."""
    f = float(np.clip((z - (ZCUT + 0.12)) / 0.14, 0, 1))      # 1 at z >= 1.36 (jaw), 0 at z <= 1.22
    return {"Head": f, "Spine2": 1 - f}


# ------------------------------------------------------------------ head scale (look.headScale)
# VRoid heads are anime-large against the body (and against our bust / face camera frames, which are set for a real
# head). Every vertex is scaled about the Head joint by s = 1 - (1 - k) * w_head, with w_head its (collapsed) Head
# weight, so the head shrinks and the neck blends; key deltas follow the same local scale.
HK = LOOK.get("headScale", 1.0)
HPIV = np.array(bonesW["J_Bip_C_Head"])


def head_w(src, wf):
    return np.array([sum(v for b, v in wf(w, z).items() if b in ("Head", "LeftEye", "RightEye")) for w, z in zip(src["W"], src["P"][:, 2])])


if HK != 1.0:
    for nm, src, wf in (("face", FACE, collapse), ("body", BODY, collapse), ("hair", HAIR, None)):
        if wf is None:
            w = np.array([hair_weights(None, z)["Head"] for z in src["P"][:, 2]])
        else:
            w = head_w(src, wf)
        sv = 1 - (1 - HK) * w
        src["P"] = HPIV + (src["P"] - HPIV) * sv[:, None]
        if nm == "face":
            for k in K:
                K[k] = K[k] * sv[:, None]
            for d in (eyeC, irisC):
                for side in d:
                    d[side] = HPIV + (d[side] - HPIV) * HK
            mouthC = HPIV + (mouthC - HPIV) * HK
stats["headScale"] = HK

# ------------------------------------------------------------------ body: bust cut, hidden-skin removal
bm_ = BODY["mats"]
bSkin, bTop, bCap = bm_.index("Body_00_SKIN"), bm_.index("Tops_01_CLOTH"), bm_.index("HairBack_00_HAIR")
BT, BTM, BP = BODY["T"], BODY["TM"], BODY["P"]
top_tris = BT[BTM == bTop]
bvh = BVHTree.FromPolygons([tuple(p) for p in BP], [tuple(t) for t in top_tris])
skin_v = np.unique(BT[BTM == bSkin])
hidden = np.zeros(len(BP), bool)
for v in skin_v:
    o, n = Vector(BP[v]), Vector(BODY["N"][v])
    hit = bvh.ray_cast(o + n * 0.0005, n, 0.05)
    if hit[0] is not None:
        hidden[v] = True
keepT = lambda t: (BP[t, 2] >= ZCUT).all() and (np.abs(BP[t, 0]) <= LOOK.get("bustHalfWidth", 0.26)).all()
body_skin_t = [t for t in BT[BTM == bSkin] if keepT(t) and not hidden[t].all()]
top_t = [t for t in BT[BTM == bTop] if keepT(t)]
cap_t = [t for t in BT[BTM == bCap]]
stats["bodySkinTris"] = len(body_skin_t)
stats["hiddenSkinVerts"] = int(hidden.sum())
hair_t = [t for t in HAIR["T"] if (HAIR["P"][t, 2] >= ZCUT).all()]

# ------------------------------------------------------------------ atlas layout (u0, v0, su, sv) in UV space (v up)
TILE = {
    "Face_00": (0.0, 0.5, 0.5, 0.5), "Body_00": (0.5, 0.5, 0.5, 0.5), "FaceMouth_00": (0.0, 0.25, 0.25, 0.25),
    "EyeWhite_00": (0.25, 0.25, 0.5, 0.25), "FaceEyeline_00": (0.0, 0.125, 0.5, 0.125), "FaceBrow_00": (0.5, 0.125, 0.5, 0.125),
    "EyeIris_00": (0.0, 0.5, 1.0, 0.5), "EyeHighlight_00": (0.0, 0.0, 1.0, 0.5),
    "Hair_00": (0.0, 0.0, 0.5, 1.0), "HairBack_00": (0.5, 0.0, 0.5, 1.0), "Tops_01": (0.0, 0.0, 1.0, 1.0),
}


def crop_of(UV, tris, pad=0.01):
    u = UV[np.unique(np.array(tris).ravel())]
    lo, hi = np.clip(u.min(0) - pad, 0, 1), np.clip(u.max(0) + pad, 0, 1)
    return [float(lo[0]), float(lo[1]), float(hi[0]), float(hi[1])]


CROP = {"Body_00": crop_of(BODY["UV"], body_skin_t), "Tops_01": crop_of(BODY["UV"], top_t)}
for nm, src, tris in (("Face_00", FACE, FACE["T"][FACE["TM"] == iSkin]),):
    u = src["UV"][np.unique(tris.ravel())]
    stats["uvRange_" + nm] = [u.min(0).round(3).tolist(), u.max(0).round(3).tolist()]
json.dump({"tile": TILE, "crop": CROP}, open(os.path.join(args.out, "atlas.json"), "w"), indent=1)
# rest-pose 3D positions per UV triangle (source texture UVs), so texture_c3.py can paint by 3D position (lip tint on the
# face sheet, the kurta neckline band on the top) without guessing where things sit in the UV layout
_ft = FACE["T"][FACE["TM"] == iSkin]
np.savez_compressed(os.path.join(args.out, "posmap.npz"), face_uv=FACE["UV"][_ft], face_p=FACE["P"][_ft],
                    top_uv=BODY["UV"][np.array(top_t)], top_p=BODY["P"][np.array(top_t)], mouth=mouthC, eyeL=eyeC["L"], eyeR=eyeC["R"])


def tile_uv(uv, tex):
    u0, v0, su, sv = TILE[tex]
    uv = np.clip(uv, 0, 1)
    if tex in CROP:
        c = CROP[tex]
        uv = np.stack([(uv[:, 0] - c[0]) / (c[2] - c[0]), (uv[:, 1] - c[1]) / (c[3] - c[1])], 1)
    return np.stack([u0 + su * uv[:, 0], v0 + sv * uv[:, 1]], 1)


# ------------------------------------------------------------------ mesh builder
def build(name, parts, keynames):
    """parts: list of (src dict, tris array, tex name per tri (str or array), region per vertex or None, keyed?)"""
    Pl, Nl, UVl, Wl, Rl, Kl, faces = [], [], [], [], [], {k: [] for k in keynames}, []
    base = 0
    for src, tris, tex, reg, keyed, wfun in parts:
        tris = np.asarray(tris)
        if len(tris) == 0:
            continue
        vs = np.unique(tris.ravel())
        remap = -np.ones(len(src["P"]), np.int64)
        remap[vs] = np.arange(len(vs)) + base
        faces += remap[tris].tolist()
        Pl.append(src["P"][vs]); Nl.append(src["N"][vs])
        if isinstance(tex, str):
            UVl.append(tile_uv(src["UV"][vs], tex))
        else:                       # per-vertex texture name
            uv = np.zeros((len(vs), 2))
            for tn in set(tex[vs]):
                s = tex[vs] == tn
                uv[s] = tile_uv(src["UV"][vs][s], tn)
            UVl.append(uv)
        Wl += [wfun(src["W"][v], src["P"][v, 2]) for v in vs]
        Rl.append(reg[vs] if reg is not None else np.zeros(len(vs)))
        for k in keynames:
            Kl[k].append(K[k][vs] if keyed else np.zeros((len(vs), 3)))
        base += len(vs)
    P, N, UV, R = np.concatenate(Pl), np.concatenate(Nl), np.concatenate(UVl), np.concatenate(Rl)
    me = bpy.data.meshes.new(name)
    me.from_pydata(P.tolist(), [], faces)
    me.update()
    uvl = me.uv_layers.new(name="UVMap")
    lv = np.zeros(len(me.loops), np.int64)
    me.loops.foreach_get("vertex_index", lv)
    uvl.data.foreach_set("uv", UV[lv].astype(np.float32).ravel())
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    for p in me.polygons:
        p.use_smooth = True
    if keynames:
        ob.shape_key_add(name="Basis")
        for k in keynames:
            d = np.concatenate(Kl[k])
            kb = ob.shape_key_add(name=k, from_mix=False)
            kb.data.foreach_set("co", (P + d).astype(np.float32).ravel())
    me.normals_split_custom_set_from_vertices([tuple(n) for n in N])
    a = me.attributes.new("_region", "FLOAT", "POINT")
    a.data.foreach_set("value", R.astype(np.float32))
    groups = {}
    for i, w in enumerate(Wl):
        for b, x in w.items():
            groups.setdefault(b, []).append((i, x))
    for b, lst in groups.items():
        g = ob.vertex_groups.new(name=b)
        for i, x in lst:
            g.add([i], x, "REPLACE")
    return ob


# per-vertex texture names on the face mesh
texF = np.array([""] * len(FACE["P"]), dtype=object)
for i, tn in ((iM, "FaceMouth_00"), (iSkin, "Face_00"), (iWhite, "EyeWhite_00"), (iLine, "FaceEyeline_00"), (iBrow, "FaceBrow_00"),
              (iIris, "EyeIris_00"), (iHl, "EyeHighlight_00")):
    texF[vcls == i] = tn
FT, FTM = FACE["T"], FACE["TM"]
face_tris = FT[np.isin(FTM, [iM, iSkin, iWhite, iLine, iBrow])]
ball_tris = FT[np.isin(FTM, [iIris, iHl])]
# eyes: iris region 0, highlight region 1 (the shader discards the highlight's dark texels)
regE = np.where(vcls == iHl, 1.0, 0.0)
def face_w(w, z):
    c = collapse(w, z)
    return {k: v for k, v in c.items() if k not in ("LeftEye", "RightEye")} or {"Head": 1.0}


MATS = {"face": "TaxilaSkin", "eyes": "TaxilaEye", "hair": "TaxilaHair", "garment": "TaxilaCloth"}


def make_armature():
    arm_d = bpy.data.armatures.new("Armature")
    ar = bpy.data.objects.new("Armature", arm_d)
    bpy.context.collection.objects.link(ar)
    bpy.context.view_layer.objects.active = ar
    ar.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    eb = arm_d.edit_bones

    def bone(name, h, t, parent=None):
        b = eb.new(name)
        b.head, b.tail = tuple(h), tuple(t)
        b.roll = 0
        if parent:
            b.parent = eb[parent]
    J = bonesW
    bone("Spine2", J["J_Bip_C_UpperChest"], J["J_Bip_C_Neck"])
    bone("Neck", J["J_Bip_C_Neck"], J["J_Bip_C_Head"], "Spine2")
    bone("Head", J["J_Bip_C_Head"], J["J_Bip_C_Head"] + np.array([0, 0, 0.12]), "Neck")
    for side, nm in (("L", "LeftEye"), ("R", "RightEye")):
        bone(nm, EYEPIV[side], EYEPIV[side] + np.array([0, -0.03, 0]), "Head")
    bone("LeftShoulder", J["J_Bip_L_Shoulder"], J["J_Bip_L_UpperArm"], "Spine2")
    bone("RightShoulder", J["J_Bip_R_Shoulder"], J["J_Bip_R_UpperArm"], "Spine2")
    bpy.ops.object.mode_set(mode="OBJECT")
    return ar


# eye pivots: behind the iris by look.eyePivotBack (VRoid's own eye joint sits 6 cm back, made for a range-mapped
# look-at; at our gaze angles that would throw the iris out of the eye)
EYEPIV = {s: irisC[s] + np.array([0, LOOK.get("eyePivotBack", 0.012), 0]) for s in ("L", "R")}
stats["eyePivot"] = {k: v.round(4).tolist() for k, v in EYEPIV.items()}


def export(tier):
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    for m in list(bpy.data.meshes):
        bpy.data.meshes.remove(m)
    for m in list(bpy.data.materials):
        bpy.data.materials.remove(m)
    for a in list(bpy.data.armatures):
        bpy.data.armatures.remove(a)
    keys_face = ARKIT52 + VISEMES + TONGUE if tier == "H" else ARKIT52 + ["tongueTipUp"]
    face_keys = [k for k in keys_face if np.abs(K[k][np.unique(face_tris.ravel())]).max() > 1e-6]
    ball_v = np.unique(ball_tris.ravel())
    ball_keys = [k for k in keys_face if np.abs(K[k][ball_v]).max() > 1e-6]
    regF = region.copy()
    face = build("face", [(FACE, face_tris, texF, regF, True, face_w),
                          (BODY, np.array(body_skin_t), "Body_00", None, False, collapse)], face_keys)
    eyes = build("eyes", [(FACE, ball_tris, texF, regE, True, lambda w, z: {"Head": 1.0})], ball_keys)
    # eye bones by side (vertex x)
    co = np.array([v.co[:] for v in eyes.data.vertices])
    for g in list(eyes.vertex_groups):
        eyes.vertex_groups.remove(g)
    gl, gr = eyes.vertex_groups.new(name="LeftEye"), eyes.vertex_groups.new(name="RightEye")
    for i, p in enumerate(co):
        (gl if p[0] > 0 else gr).add([i], 1.0, "REPLACE")
    hair = build("hair", [(HAIR, np.array(hair_t), "Hair_00", None, False, hair_weights),
                          (BODY, np.array(cap_t), "HairBack_00", None, False, collapse)], [])
    garment = build("garment", [(BODY, np.array(top_t), "Tops_01", None, False, collapse)], [])
    if tier != "H":
        md = hair.modifiers.new("dec", "DECIMATE")
        md.ratio = LOOK.get("hairDecimateBplus", 0.4)
        md.use_collapse_triangulate = True
        bpy.context.view_layer.objects.active = hair
        for o in bpy.context.selected_objects:
            o.select_set(False)
        hair.select_set(True)
        bpy.ops.object.modifier_apply(modifier="dec")
    for ob in (face, eyes, hair, garment):
        ob.data.materials.clear()
        m = bpy.data.materials.new(MATS[ob.name])
        m.use_nodes = True
        ob.data.materials.append(m)
    ar = make_armature()
    for ob in (face, eyes, hair, garment):
        md = ob.modifiers.new("Armature", "ARMATURE")
        md.object = ar
        ob.parent = ar
        for g in list(ob.vertex_groups):
            if g.name not in ar.data.bones:
                ob.vertex_groups.remove(g)
    tri = lambda ob: int(sum(len(p.vertices) - 2 for p in ob.data.polygons))
    st = {"tier": tier, "meshes": {o.name: {"verts": len(o.data.vertices), "tris": tri(o),
          "keys": (len(o.data.shape_keys.key_blocks) - 1) if o.data.shape_keys else 0} for o in (face, eyes, hair, garment)}}
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
print(json.dumps({k: stats[k] for k in ("mouthRegions", "bodySkinTris", "hiddenSkinVerts", "eyePivot", "landmarks")}))
os._exit(0)
