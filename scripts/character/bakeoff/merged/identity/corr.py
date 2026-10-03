"""Correspondence: MediaPipe landmark k -> a point on OUR MakeHuman topology, as (3 original vertex ids, barycentric).
Input: picked rest-pose surface points (glTF axes) under the landmarks that MediaPipe found on a neutral render of our
own current build (shoot.mjs --pick). Output is topology-level, so it holds for any identity built on the MPFB base.
    bpyenv/bin/python corr.py --blend <build>/base.blend --pick _base_pick.json --out corr.json"""
import argparse, json, sys
import numpy as np
import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ap = argparse.ArgumentParser()
ap.add_argument("--blend", required=True); ap.add_argument("--pick", required=True); ap.add_argument("--out", required=True)
a = ap.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:])
bpy.ops.wm.open_mainfile(filepath=a.blend)
face = bpy.data.objects["face"]; me = face.data
P = np.empty(len(me.vertices) * 3); me.vertices.foreach_get("co", P); P = P.reshape(-1, 3)
vid = np.zeros(len(me.vertices), np.int32); me.attributes["vid"].data.foreach_get("value", vid)
reg = np.zeros(len(me.vertices), np.float32); me.attributes["region"].data.foreach_get("value", reg)
me.calc_loop_triangles()
T = np.empty(len(me.loop_triangles) * 3, np.int64); me.loop_triangles.foreach_get("vertices", T); T = T.reshape(-1, 3)
T = T[np.all((np.round(reg[T]) == 0) & (vid[T] >= 0), axis=1)]
bvh = BVHTree.FromPolygons([Vector(p) for p in P], T.tolist())
pick = json.load(open(a.pick))
keys = sorted(pick, key=lambda k: 0 if k.endswith("yaw0") else 1)
out = [None] * 478
for k in keys:
    for i, p in enumerate(pick[k]):
        if p is None or out[i] is not None or i >= 468:
            continue
        q = Vector((p[0], -p[2], p[1]))                     # glTF (x, y up, z fwd) -> Blender (x, -z, y)
        loc, nrm, ti, d = bvh.find_nearest(q, 0.004)
        if loc is None:
            continue
        tri = T[ti]; A, B, C = (Vector(P[j]) for j in tri)
        from mathutils.geometry import barycentric_transform
        # barycentric weights of loc in triangle ABC
        v0, v1, v2 = B - A, C - A, loc - A
        d00, d01, d11, d20, d21 = v0.dot(v0), v0.dot(v1), v1.dot(v1), v2.dot(v0), v2.dot(v1)
        den = d00 * d11 - d01 * d01
        wv = (d11 * d20 - d01 * d21) / den; ww = (d00 * d21 - d01 * d20) / den
        out[i] = {"vid": vid[tri].tolist(), "w": [round(1 - wv - ww, 5), round(wv, 5), round(ww, 5)], "dist_mm": round(d * 1000, 3), "from": k}
json.dump({"n": sum(o is not None for o in out), "corr": out}, open(a.out, "w"))
print(f"[corr] {sum(o is not None for o in out)} of 468 landmarks mapped")
import os; os._exit(0)
