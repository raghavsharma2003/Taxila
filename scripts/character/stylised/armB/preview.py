#!/usr/bin/env python3
"""Clay turntable sheet of sculpt candidates (Hunyuan frame, Y up / +Z front) for the eye pick (TECH-PLAN 4.2).
    python preview.py OUT.webp a.ply b.ply ... [--yaws 0,45,90,180] [--res 320]
"""
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402
from PIL import Image, ImageDraw  # noqa: E402
import lib as L  # noqa: E402

args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
out = args[0]
yaws = [0, 40, 90, 180]
res = 320
files = []
i = 1
while i < len(args):
    if args[i] == "--yaws":
        yaws = [float(x) for x in args[i + 1].split(",")]; i += 2
    elif args[i] == "--res":
        res = int(args[i + 1]); i += 2
    else:
        files.append(args[i]); i += 1
tmp = out + ".tmp"
os.makedirs(tmp, exist_ok=True)
tiles = []
for f in files:
    L.clear_scene()
    if f.endswith(".ply"):
        bpy.ops.wm.ply_import(filepath=f)
        ob = [o for o in bpy.context.scene.objects if o.type == "MESH"][0]
        V = L.co(ob.data)
        L.set_co(ob.data, np.stack([V[:, 0], -V[:, 2], V[:, 1]], 1))
    else:
        bpy.ops.import_scene.gltf(filepath=f)
        ob = [o for o in bpy.context.scene.objects if o.type == "MESH"][0]
    L.shade_smooth(ob)
    V = L.co(ob.data)
    M = np.array(ob.matrix_world); V = V @ M[:3, :3].T + M[:3, 3]
    c = (V.min(0) + V.max(0)) / 2
    h = (V.max(0) - V.min(0)).max()
    ob.data.materials.clear()
    ob.data.materials.append(L.new_material("clay", base=(0.62, 0.52, 0.45), rough=0.6))
    L.setup_render(res=res, samples=12)
    L.area_light("key", c + np.array([-1.2, -2.0, 1.6]) * h, c, 60 * h * h, 1.2 * h)
    L.area_light("rim", c + np.array([1.5, 1.6, 0.8]) * h, c, 40 * h * h, 1.0 * h)
    row = []
    for y in yaws:
        r = np.radians(y)
        loc = c + np.array([np.sin(r), -np.cos(r), 0.0]) * float(os.environ.get("PV_DIST", "3.2")) * h
        cam = L.camera("cam", loc, c, lens=60)
        p = os.path.join(tmp, f"{len(tiles)}_{int(y)}.png")
        L.render_to(p, cam)
        row.append(Image.open(p).convert("RGB"))
    tiles.append((os.path.basename(f), row))
W = res * len(yaws); H = (res + 18) * len(tiles)
sheet = Image.new("RGB", (W, H), (250, 250, 250))
d = ImageDraw.Draw(sheet)
for k, (name, row) in enumerate(tiles):
    d.text((4, k * (res + 18) + 3), name, fill=(0, 0, 0))
    for j, im in enumerate(row):
        sheet.paste(im, (j * res, k * (res + 18) + 18))
sheet.save(out, quality=88)
for f in os.listdir(tmp):
    os.remove(os.path.join(tmp, f))
os.rmdir(tmp)
print(out)
sys.stdout.flush()
os._exit(0)
