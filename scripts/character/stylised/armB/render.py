#!/usr/bin/env python3
"""Arm B evidence: contact sheet + expressions sheet next to c-front (TECH-PLAN 8.3 owner sheet layout).

    python render.py --blend BUILD/stage.blend --out DIR [--res 768] [--samples 48]

Camera = the c-front frame: the image->world map used for the fit (x = (px - xm) k, z = (1024 - py) k, k = 0.25 m/640 px),
85 mm lens, so the front render overlays the concept pixel for pixel. Contact: front, 3/4 (her left), profile (her left),
close-up, each beside the matching ref, plus 128 px thumbnails. Expressions: neutral, talking, listening, thinking, happy,
surprised, concerned (beside the concept where one exists) + the 15 visemes.
"""
import argparse
import json
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402
from mathutils import Euler  # noqa: E402
from PIL import Image, ImageDraw  # noqa: E402
import lib as L  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.."))
CON = os.path.join(ROOT, "docs/design/teacher/stylised/concepts")
REF = os.path.join(ROOT, "docs/design/teacher/stylised/build/refs")
ap = argparse.ArgumentParser()
ap.add_argument("--blend", required=True); ap.add_argument("--out", required=True)
ap.add_argument("--res", type=int, default=768); ap.add_argument("--samples", type=int, default=48)
ap.add_argument("--only", default="contact,expr")
ap.add_argument("--exposure", type=float, default=-0.85)
a = ap.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:])
os.makedirs(a.out, exist_ok=True)
tmp = os.path.join(a.out, "_frames"); os.makedirs(tmp, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=a.blend)
K = 0.25 / 640
sc = L.setup_render(res=a.res, samples=a.samples, exposure=a.exposure)
for o in list(bpy.data.objects):
    if o.type in ("LIGHT", "CAMERA"):
        bpy.data.objects.remove(o)
face = bpy.data.objects["face"]
Pf = L.co(face.data)
yf = float(np.percentile(Pf[:, 1], 1))
hc = np.array([0.0, yf + 0.06, (1024 - 380) * K])


def lights():
    h = 0.6
    L.area_light("key", hc + np.array([-0.75, -1.5, 0.95]) * h, hc, 48 * h * h, 1.8 * h, color=(1.0, 0.96, 0.9))
    L.area_light("fill", hc + np.array([1.2, -1.3, 0.1]) * h, hc, 18 * h * h, 2.2 * h, color=(0.94, 0.96, 1.0))
    L.area_light("rim", hc + np.array([1.1, 1.4, 0.9]) * h, hc, 35 * h * h, 1.0 * h, color=(1.0, 0.88, 0.75))
    L.area_light("rimL", hc + np.array([-1.2, 1.2, 0.5]) * h, hc, 14 * h * h, 1.0 * h, color=(1.0, 0.9, 0.8))
    L.area_light("catch", np.array([-0.06, yf - 0.9, hc[2] + 0.12]), hc + np.array([0, 0, 0.05]), 14.0, 0.07)


lights()


CATCH = []


def add_catchlights():
    """render-only stand-in for the runtime's view-space cornea catchlight (TECH-PLAN 6.2): a small emissive disc on each
    cornea, upper-right of the pupil as seen from the camera (placed per shot by place_catch). NOT exported."""
    cor = bpy.data.objects["cornea"]
    P = L.co(cor.data)
    for sg in (1, -1):
        Q = P[P[:, 0] * sg > 0]
        apex = Q[np.argmin(Q[:, 1])]
        r = np.ptp(Q[:, 0]) / 2
        eye = bpy.data.objects["eyes"]
        E = L.co(eye.data); E = E[E[:, 0] * sg > 0]
        C = (E.min(0) + E.max(0)) / 2
        R = np.ptp(E[:, 0]) / 2
        bpy.ops.mesh.primitive_circle_add(vertices=16, radius=0.16 * r, fill_type="NGON", location=tuple(apex))
        o = bpy.context.active_object
        mat = bpy.data.materials.new("catch"); mat.use_nodes = True
        bs = mat.node_tree.nodes["Principled BSDF"]
        bs.inputs["Emission Color"].default_value = (1, 1, 1, 1); bs.inputs["Emission Strength"].default_value = 5.0
        o.data.materials.append(mat)
        CATCH.append((o, C, R))


def place_catch(cam_loc, yaw):
    from mathutils import Vector
    for o, C, R in CATCH:
        o.hide_render = abs(yaw) > 40
        v = np.asarray(cam_loc) - C; v /= np.linalg.norm(v)
        right = np.cross(v, [0, 0, 1.0]); right /= np.linalg.norm(right)
        d = v + 0.30 * np.array([0, 0, 1.0]) - 0.26 * right
        d /= np.linalg.norm(d)
        o.location = Vector(C + d * R * 1.075)
        o.rotation_euler = Vector(-v).to_track_quat("Z", "Y").to_euler()


arm = bpy.data.objects.get("rig")
add_catchlights()
key_objs = [o for o in bpy.data.objects if o.type == "MESH" and o.data.shape_keys]
CORR = {"jawOpen_mouthClose": ("jawOpen", "mouthClose"), "mouthFunnel_jawOpen": ("mouthFunnel", "jawOpen"),
        "jawOpen_mouthSmileLeft": ("jawOpen", "mouthSmileLeft"), "jawOpen_mouthSmileRight": ("jawOpen", "mouthSmileRight"),
        "eyeBlink_eyeLookDownLeft": ("eyeBlinkLeft", "eyeLookDownLeft"), "eyeBlink_eyeLookDownRight": ("eyeBlinkRight", "eyeLookDownRight"),
        "eyeBlink_eyeSquintLeft": ("eyeBlinkLeft", "eyeSquintLeft"), "eyeBlink_eyeSquintRight": ("eyeBlinkRight", "eyeSquintRight"),
        "browInnerUp_browDownLeft": ("browInnerUp", "browDownLeft"), "browInnerUp_browDownRight": ("browInnerUp", "browDownRight"),
        "cheekSquint_eyeBlinkLeft": ("cheekSquintLeft", "eyeBlinkLeft"), "cheekSquint_eyeBlinkRight": ("cheekSquintRight", "eyeBlinkRight")}


def pose(bs=None, head=(0, 0, 0), gaze=(0, 0)):
    """bs: blendshape weights (correctives = product of parents, as runtime rig.js); head (pitch +down, yaw +her left,
    roll) deg; gaze (yaw +her left, pitch +up) deg -- the HeadRig conventions."""
    bs = dict(bs or {})
    for k, (p, q) in CORR.items():
        bs[k] = bs.get(p, 0) * bs.get(q, 0)
    for o in key_objs:
        for kb in o.data.shape_keys.key_blocks[1:]:
            kb.value = float(np.clip(bs.get(kb.name, 0.0), 0, 1))
    if arm:
        for pb in arm.pose.bones:
            pb.rotation_mode = "XYZ"; pb.rotation_euler = (0, 0, 0)
        p, y, r = np.radians(head)
        # bone local axes: Head/Neck point +Z (world); Blender bone Y = along the bone. Use world-ish euler on the bones.
        for nm, f in (("Neck", 0.35), ("Head", 0.65)):
            b = arm.pose.bones[nm]
            b.rotation_euler = Euler((-p * f, -y * f, r * f), "XYZ")      # bone space: x pitch, y twist(yaw), z roll
        gy, gp = np.radians(gaze)
        for nm in ("LeftEye", "RightEye"):
            b = arm.pose.bones[nm]
            b.rotation_euler = Euler((gp, 0, gy), "XYZ")
    bpy.context.view_layer.update()


def cam_front(scale=1.0, cx=0.0, cz=None, yaw=0.0):
    cz = (1024 - 512) * K if cz is None else cz
    f = 135.0
    dist = 0.4 * scale * f / 36
    r = np.radians(yaw)
    tgt = np.array([cx, yf + 0.015, cz])
    loc = tgt + np.array([np.sin(r) * dist, -np.cos(r) * dist, 0])
    place_catch(loc, yaw)
    return L.camera("cam", loc, tgt, lens=f)


def shot(name, cam):
    p = os.path.join(tmp, name + ".png")
    L.render_to(p, cam)
    bpy.data.objects.remove(cam)
    return Image.open(p).convert("RGB")


def label(im, text):
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 8 + 7 * len(text), 16], fill=(255, 255, 255))
    d.text((4, 2), text, fill=(0, 0, 0))
    return im


def ref(name, folder=REF):
    p = os.path.join(folder, name + ".webp")
    return Image.open(p).convert("RGB") if os.path.exists(p) else None


S = a.res
EXPR = {
    "neutral": ({}, (0, 0, 0), (0, 0)),
    "talking": ({"viseme_aa": 0.8, "mouthSmileLeft": 0.45, "mouthSmileRight": 0.45, "browInnerUp": 0.15, "cheekSquintLeft": 0.15, "cheekSquintRight": 0.15}, (0, 0, 0), (0, 0)),
    "listening": ({"mouthSmileLeft": 0.28, "mouthSmileRight": 0.28, "browInnerUp": 0.3, "browOuterUpLeft": 0.15, "browOuterUpRight": 0.15}, (3, 0, 6), (0, 0)),
    "thinking": ({"browOuterUpLeft": 0.55, "browInnerUp": 0.2, "browDownRight": 0.35, "mouthPressLeft": 0.4, "mouthLeft": 0.35, "eyeSquintRight": 0.2, "eyeLookUpLeft": 0.35, "eyeLookUpRight": 0.35}, (-4, 6, -4), (14, 14)),
    "happy": ({"mouthSmileLeft": 1.0, "mouthSmileRight": 1.0, "cheekSquintLeft": 0.6, "cheekSquintRight": 0.6, "jawOpen": 0.3, "mouthUpperUpLeft": 0.3, "mouthUpperUpRight": 0.3, "eyeSquintLeft": 0.25, "eyeSquintRight": 0.25, "browInnerUp": 0.2}, (0, 0, 3), (0, 0)),
    "surprised": ({"browInnerUp": 0.95, "browOuterUpLeft": 0.9, "browOuterUpRight": 0.9, "eyeWideLeft": 0.9, "eyeWideRight": 0.9, "jawOpen": 0.45, "mouthFunnel": 0.35}, (-3, 0, 0), (0, 0)),
    "concerned": ({"browInnerUp": 0.85, "browDownLeft": 0.25, "browDownRight": 0.25, "mouthFrownLeft": 0.4, "mouthFrownRight": 0.4, "mouthPressLeft": 0.3, "mouthPressRight": 0.3, "eyeSquintLeft": 0.1, "eyeSquintRight": 0.1}, (4, 0, -5), (0, -4)),
}
CONCEPT_FOR = {"neutral": "c-front", "talking": "c-talking", "listening": "c-listening", "thinking": "c-thinking", "happy": "c-happy"}

if "contact" in a.only:
    pose()
    tiles = []
    for nm, scale, yaw, cz, refimg in (("front", 1.0, 0, None, ref("c-front", CON)), ("q3", 1.0, 35, None, ref("q3-left")),
                                       ("profile", 1.0, 90, None, ref("profile-left")), ("close", 0.42, 0, (1024 - 450) * K, None)):
        im = shot(nm, cam_front(scale, cz=cz, yaw=yaw))
        if refimg is None and nm == "close":
            refimg = ref("c-front", CON).crop((300, 240, 300 + 430, 240 + 430))
        tiles.append((nm, refimg.resize((S, S)) if refimg else None, im))
    W_ = 2 * S + 2 * 128 + 30
    sheet = Image.new("RGB", (W_, len(tiles) * (S + 10)), (255, 255, 255))
    for k, (nm, r_, im) in enumerate(tiles):
        y = k * (S + 10)
        if r_:
            sheet.paste(label(r_.copy(), "concept/ref " + nm), (0, y))
            sheet.paste(r_.resize((128, 128), Image.LANCZOS), (2 * S + 10, y))
        sheet.paste(label(im.copy(), "Arm B render " + nm), (S, y))
        sheet.paste(im.resize((128, 128), Image.LANCZOS), (2 * S + 20 + 128, y))
    sheet.save(os.path.join(a.out, "contact.webp"), quality=90)
    print("contact ok")

if "probe" in a.only:
    pose()
    im = shot("probe", cam_front(1.0))
    arr = np.asarray(im.resize((1024, 1024))).astype(float)
    con = np.asarray(ref("c-front", CON)).astype(float)
    for nm, (x, y) in {"cheekR": (400, 520), "cheekL": (650, 520), "forehead": (520, 280), "kurta": (330, 880), "hair": (300, 250)}.items():
        print("probe", nm, arr[y-4:y+5, x-4:x+5].reshape(-1, 3).mean(0).round(), "concept", con[y-4:y+5, x-4:x+5].reshape(-1, 3).mean(0).round())
    im.save(os.path.join(a.out, "probe.png"))
if "expr" in a.only:
    T_ = S // 2
    cols = []
    for nm, (bs, head, gaze) in EXPR.items():
        pose(bs, head, gaze)
        im = shot("e_" + nm, cam_front(0.62, cz=(1024 - 420) * K)).resize((T_, T_), Image.LANCZOS)
        c = CONCEPT_FOR.get(nm)
        r_ = ref(c, CON) if c else None
        if r_:
            r_ = r_.crop((150, 60, 150 + 724, 60 + 724)).resize((T_, T_), Image.LANCZOS)
        cols.append((nm, r_, im))
    V = ["sil", "PP", "FF", "TH", "DD", "kk", "CH", "SS", "nn", "RR", "aa", "E", "I", "O", "U"]
    vt = []
    VS = S // 4
    for v in V:
        pose({"viseme_" + v: 1.0})
        vt.append((v, shot("v_" + v, cam_front(0.2, cz=(1024 - 575) * K)).resize((VS, VS), Image.LANCZOS)))
    pose()
    n = len(cols)
    Wd = max(n * T_, 8 * VS)
    sheet = Image.new("RGB", (Wd, 2 * T_ + 2 * VS + 40), (255, 255, 255))
    for k, (nm, r_, im) in enumerate(cols):
        if r_:
            sheet.paste(label(r_, "concept " + nm), (k * T_, 0))
        sheet.paste(label(im, nm), (k * T_, T_))
    for k, (v, im) in enumerate(vt):
        sheet.paste(label(im, v), ((k % 8) * VS, 2 * T_ + 20 + (k // 8) * VS))
    sheet.save(os.path.join(a.out, "expressions.webp"), quality=90)
    print("expr ok")
for f in os.listdir(tmp):
    os.remove(os.path.join(tmp, f))
os.rmdir(tmp)
sys.stdout.flush()
os._exit(0)
