"""c2 shared helpers: load the Rocketbox FBX into plain numpy arrays (world metres, Blender axes: Z up, -Y front).

Source: Microsoft Rocketbox `Assets/Avatars/Professions/Business_Female_01` (MIT, art/character/LICENSES.md, c2 section).
Everything downstream (parts, keys, eyes, armature, tiers) is built from these arrays, so the FBX's 0.01 armature scale
and -90 deg rotation never leak into the exported GLB.
"""
import os
import numpy as np
import bpy

SRC = os.environ.get("C2_SRC", "/tmp/claude-0/char/c2/src")
FBX = os.path.join(SRC, "Business_Female_01_facial.fbx")


def load():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=FBX)
    ob = [o for o in bpy.data.objects if o.type == "MESH"][0]
    arm = [o for o in bpy.data.objects if o.type == "ARMATURE"][0]
    me = ob.data
    mw = np.array(ob.matrix_world)
    n = len(me.vertices)
    co = np.zeros(n * 3, np.float32)
    me.vertices.foreach_get("co", co)
    co = co.reshape(-1, 3).astype(np.float64)
    W = lambda c: (np.c_[c, np.ones(len(c))] @ mw.T)[:, :3]
    P = W(co)
    keys = {}
    for kb in me.shape_keys.key_blocks[1:]:
        k = np.zeros(n * 3, np.float32)
        kb.data.foreach_get("co", k)
        d = W(k.reshape(-1, 3).astype(np.float64)) - P
        keys[kb.name] = d
    polys = [(list(p.vertices), list(p.loop_indices), p.material_index) for p in me.polygons]
    uv = np.zeros(len(me.loops) * 2, np.float32)
    me.uv_layers.active.data.foreach_get("uv", uv)
    uv = uv.reshape(-1, 2)
    vg = {g.index: g.name for g in ob.vertex_groups}
    weights = [{vg[g.group]: g.weight for g in v.groups if g.weight > 0} for v in me.vertices]
    mats = [m.name for m in me.materials]
    am = np.array(arm.matrix_world)
    joints = {b.name: (am @ np.array(list(b.head_local) + [1.0]))[:3] for b in arm.data.bones}
    return dict(P=P, keys=keys, polys=polys, uv=uv, weights=weights, mats=mats, joints=joints)


def collapse_weights(w):
    """Rocketbox's 80 bones -> our 7 (CHARACTER-PIPELINE §4.2). Facial bones fold into Head: the shape keys carry the
    face; the bones only carried Rocketbox's own (unused) bone-driven expressions."""
    out = {}
    for b, x in w.items():
        if b in ("Bip01 LEye",):
            t = "LeftEye"
        elif b in ("Bip01 REye",):
            t = "RightEye"
        elif b == "Bip01 Neck":
            t = "Neck"
        elif b in ("Bip01 Pelvis", "Bip01 Spine", "Bip01 Spine1", "Bip01 Spine2") or "Thigh" in b:
            t = "Spine2"
        elif b.startswith("Bip01 L ") :
            t = "LeftShoulder"
        elif b.startswith("Bip01 R "):
            t = "RightShoulder"
        else:
            t = "Head"
        out[t] = out.get(t, 0) + x
    s = sum(out.values()) or 1.0
    return {k: v / s for k, v in out.items()}


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
VIS_SRC = {"viseme_" + v: f"AA_VI_{i:02d}_{s}" for i, (v, s) in enumerate(zip(
    "sil PP FF TH DD kk CH SS nn RR aa E I O U".split(), "Sil PP FF TH DD KK CH SS nn RR aa E I O U".split()))}


def contract_keys(keys):
    """Rocketbox key names -> the runtime contract (§4.3). Returns name -> delta (world metres)."""
    out = {}
    for k, d in keys.items():
        if k.startswith("AK_"):
            nm = k.split("_", 2)[2]
            nm = nm[0].lower() + nm[1:]
            out[nm] = d
    for v, s in VIS_SRC.items():
        out[v] = keys[s]
    # Hindi tongue extras (contract names), from Rocketbox's HeadBox tongue keys (no Rocketbox equivalents exist):
    #   tongueTipUp (dental: blade to the upper incisors) = 0.6 x TongueUp
    #   tongueCurl (retroflex: tip up and back)            = 0.8 x TongueUp + 0.8 x TongueIn
    #   tongueWide (open a / e: flattened)                 = TongueDown
    out["tongueTipUp"] = 0.6 * keys["HB_12_TongueUp"]
    out["tongueCurl"] = 0.8 * keys["HB_12_TongueUp"] + 0.8 * keys["HB_09_TongueIn"]
    out["tongueWide"] = 1.0 * keys["HB_11_TongueDown"]
    missing = [k for k in ARKIT52 + VISEMES if k not in out]
    assert not missing, missing
    return out
