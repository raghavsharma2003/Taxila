"""debug: render the prepared target with its painted colour and its labels (front / side / back)."""
import os, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
import lib as L
args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
z = np.load(args[0]); out = args[1]
V, F, C, lab = z["V"], z["F"], z["C"], z["label"]
pal = np.array([[0.9, 0.6, 0.4], [0.05, 0.05, 0.05], [0.1, 0.5, 0.55], [1, 0.4, 0.1], [1, 0.85, 0.2], [1, 0, 1]])
for mode in ("col", "lab"):
    L.clear_scene()
    ob = L.mesh_from_np("t", V, F); L.shade_smooth(ob)
    L.set_vcol(ob, C if mode == "col" else pal[lab])
    ob.data.materials.append(L.new_material("m", base=(1, 1, 1), vcol="Col", rough=0.8, emission=None))
    L.setup_render(res=400, samples=8)
    c = (V.min(0) + V.max(0)) / 2; h = (V.max(0) - V.min(0)).max()
    L.area_light("k", c + np.array([-1, -2, 1.5]) * h, c, 40 * h * h, 2 * h)
    L.area_light("k2", c + np.array([1, 2, 1.5]) * h, c, 30 * h * h, 2 * h)
    for y in (0, 90, 180):
        r = np.radians(y)
        cam = L.camera("c", c + np.array([np.sin(r), -np.cos(r), 0]) * 2.2 * h, c, lens=50)
        L.render_to(f"{out}_{mode}_{y}.png", cam)
os._exit(0)
