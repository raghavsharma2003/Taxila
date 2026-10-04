#!/usr/bin/env python3
"""Arm B step B5a: bring an AI sculpt (shape target only) into our frame and label it.

    python prep.py --mesh shapes/h21_fo_s0.ply [--paint paint_x/textured.glb] --matte mattes/front-ortho_rgba.png \
                   --lm art/character/stylised/armB/landmarks-front-ortho.json --out BUILD/target.npz [--rot hy]

1. Hunyuan frame (Y up, front +Z) -> Blender (Z up, front -Y).
2. Similarity fit of the sculpt's orthographic front silhouette to the front-ortho matte (scale + offset, IoU grid
   search then refine). The image->world map is then: x = (px - 512) k + tx, z = (1024 - py) k + tz, k = 0.25 m / 640 px
   (crown-to-chin of c-front = 0.25 m).
3. The 2D landmarks are lifted to 3D by front rays onto the sculpt.
4. Per-vertex colour from the painted mesh (if given) -> labels: 0 skin, 1 hair, 2 cloth, 3 piping, 4 gold, 5 eye/brow.
Writes target.npz (V, F, C, label, landmarks3d json) + a front/profile preview.
"""
import argparse
import json
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402
from PIL import Image, ImageDraw  # noqa: E402
import lib as L  # noqa: E402

ap = argparse.ArgumentParser()
ap.add_argument("--mesh", required=True); ap.add_argument("--paint")
ap.add_argument("--matte", required=True); ap.add_argument("--lm", required=True)
ap.add_argument("--out", required=True); ap.add_argument("--yaw", type=float, default=0.0, help="extra yaw (deg) after the frame swap")
a = ap.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:])
os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
K = 0.25 / 640.0


def load(path):
    L.clear_scene()
    if path.endswith(".ply"):
        bpy.ops.wm.ply_import(filepath=path)
    else:
        bpy.ops.import_scene.gltf(filepath=path)
    obs = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    ob = obs[0]
    me = ob.data
    V = L.co(me)
    M = np.array(ob.matrix_world)
    V = V @ M[:3, :3].T + M[:3, 3]
    return ob, V


ob, V = load(a.mesh)
F = np.array([p.vertices[:] for p in ob.data.polygons])
if a.mesh.endswith(".ply"):
    V = np.stack([V[:, 0], -V[:, 2], V[:, 1]], 1)            # Hunyuan Y-up / +Z front -> Blender Z-up / -Y front
yaw = np.radians(a.yaw)
if yaw:
    c, s = np.cos(yaw), np.sin(yaw)
    V = np.stack([c * V[:, 0] - s * V[:, 1], s * V[:, 0] + c * V[:, 1], V[:, 2]], 1)

# ---------------------------------------------------------------- silhouette fit to the front-ortho matte
al = np.asarray(Image.open(a.matte).split()[-1]) > 127
N = 256
ref = np.asarray(Image.fromarray((al * 255).astype(np.uint8)).resize((N, N), Image.BILINEAR)) > 127


def sil(V, F, scale, tx, tz):
    """mesh front silhouette in image pixels (1024 grid) downsampled to N: px = (x - tx) / k + 512, py = 1024 - (z - tz) / k."""
    px = (V[:, 0] * scale - tx) / K + 512
    py = 1024 - (V[:, 2] * scale - tz) / K
    im = Image.new("L", (N, N), 0)
    d = ImageDraw.Draw(im)
    f = N / 1024
    P = np.stack([px * f, py * f], 1)
    for t in F[:: max(1, len(F) // 120000)]:
        d.polygon([tuple(P[t[0]]), tuple(P[t[1]]), tuple(P[t[2]])], fill=255)
    return np.asarray(im) > 127


iou = lambda A, B: float((A & B).sum() / max(1, (A | B).sum()))
# initial guess from bboxes: mesh height (z extent) vs matte height
ys, xs = np.nonzero(al)
h_px = ys.max() - ys.min()
s0 = h_px * K / (V[:, 2].max() - V[:, 2].min())
tx0 = (V[:, 0].min() + V[:, 0].max()) / 2 * s0 - ((xs.min() + xs.max()) / 2 - 512) * K
tz0 = V[:, 2].max() * s0 - (1024 - ys.min()) * K
best = (iou(sil(V, F, s0, tx0, tz0), ref), s0, tx0, tz0)
for it, step in enumerate((0.04, 0.015, 0.005)):
    improved = True
    while improved:
        improved = False
        _, s, tx, tz = best
        for ds, dx, dz in ((1, 0, 0), (-1, 0, 0), (0, 1, 0), (0, -1, 0), (0, 0, 1), (0, 0, -1)):
            cand = (s * (1 + ds * step), tx + dx * step * 0.1, tz + dz * step * 0.1)
            v = iou(sil(V, F, *cand), ref)
            if v > best[0] + 1e-4:
                best = (v, *cand); improved = True
print(f"[prep] front IoU {best[0]:.4f} scale {best[1]:.4f} tx {best[2]:.4f} tz {best[3]:.4f}")
fit_iou, s, tx, tz = best
V = V * s
V[:, 0] -= tx
V[:, 2] -= tz
# world: x = (px - 512) k, z = (1024 - py) k ; mesh now in that frame. Recentre x on the face midline later (landmarks).

bvh = L.bvh_from_np(V, F)
LM = json.load(open(a.lm))


def lift(p):
    x = (p[0] - 512) * K
    z = (1024 - p[1]) * K
    P, ok, _ = L.raycast(bvh, np.array([[x, -5.0, z]]), np.array([[0, 1.0, 0]]))
    return P[0].tolist() if ok[0] else [x, None, z]


L3 = {}
for k, v in LM.items():
    if k.startswith("_") or k == "image":
        continue
    if isinstance(v, dict):
        L3[k] = {kk: (lift(pp) if isinstance(pp, list) else pp) for kk, pp in v.items()}
    else:
        L3[k] = lift(v)

# ---------------------------------------------------------------- colours from the painted mesh
C = np.full((len(V), 3), 0.5)
lab = np.zeros(len(V), int)
if a.paint:
    pob, PV = load(a.paint)
    PV = np.stack([PV[:, 0], PV[:, 1], PV[:, 2]], 1)
    pme = pob.data
    # the painted mesh is the same object re-meshed by Hunyuan paint; bring it through the same transform
    # (its glTF import already applied Y-up -> Z-up, so only yaw + similarity)
    if yaw:
        c_, s_ = np.cos(yaw), np.sin(yaw)
        PV = np.stack([c_ * PV[:, 0] - s_ * PV[:, 1], s_ * PV[:, 0] + c_ * PV[:, 1], PV[:, 2]], 1)
    PV = PV * s
    PV[:, 0] -= tx; PV[:, 2] -= tz
    PF = np.array([p.vertices[:] for p in pme.polygons])
    uv = np.zeros((len(pme.loops), 2))
    pme.uv_layers.active.data.foreach_get("uv", uv.ravel())
    loopv = np.array([lp.vertex_index for lp in pme.loops])
    vuv = np.zeros((len(PV), 2)); vuv[loopv] = uv
    img = None
    for m in pme.materials:
        for n in m.node_tree.nodes:
            if n.type == "TEX_IMAGE" and n.image is not None and img is None:
                img = n.image
    W_, H_ = img.size
    px = np.array(img.pixels[:]).reshape(H_, W_, 4)[..., :3]
    px = np.where(px <= 0.0031308, px * 12.92, 1.055 * px ** (1 / 2.4) - 0.055)     # linear -> sRGB
    pb = L.bvh_from_np(PV, PF)
    Q, Nn, fi, d = L.nearest(pb, V)
    # barycentric uv on the nearest painted triangle
    tri = PF[fi]
    A, B, Cc = PV[tri[:, 0]], PV[tri[:, 1]], PV[tri[:, 2]]
    v0, v1, v2 = B - A, Cc - A, Q - A
    d00 = (v0 * v0).sum(1); d01 = (v0 * v1).sum(1); d11 = (v1 * v1).sum(1); d20 = (v2 * v0).sum(1); d21 = (v2 * v1).sum(1)
    den = np.maximum(d00 * d11 - d01 * d01, 1e-20)
    bv = (d11 * d20 - d01 * d21) / den; bw = (d00 * d21 - d01 * d20) / den; bu = 1 - bv - bw
    UV = vuv[tri[:, 0]] * bu[:, None] + vuv[tri[:, 1]] * bv[:, None] + vuv[tri[:, 2]] * bw[:, None]
    ix = np.clip((UV[:, 0] * W_).astype(int), 0, W_ - 1)
    iy = np.clip((UV[:, 1] * H_).astype(int), 0, H_ - 1)
    C = px[iy, ix]
    r, g, b = C[:, 0], C[:, 1], C[:, 2]
    mx = C.max(1); mn = C.min(1); sat = (mx - mn) / np.maximum(mx, 1e-6)
    d = np.maximum(mx - mn, 1e-6)
    hue = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) / 6
    lab[:] = 0
    lab[mx < 0.45] = 1                                            # hair (dark brown in the paint)
    lab[(b > r) & (mx >= 0.2)] = 2                                # teal kurta
    chin_z = L3["chin"][2]
    from scipy.spatial import cKDTree
    cand = np.nonzero((lab == 0) & (V[:, 2] < chin_z - 0.018))[0]
    dcl, _ = cKDTree(V[lab == 2]).query(V[cand])
    lab[cand[dcl < 0.0045]] = 3                                   # orange piping: the skin-coloured band against the kurta
    print("[prep] labels", {k: int((lab == k).sum()) for k in range(6)})

np.savez_compressed(a.out, V=V.astype(np.float32), F=F.astype(np.int32), C=C.astype(np.float32), label=lab.astype(np.int8),
                    fit=np.array([fit_iou, s, tx, tz]))
json.dump({"landmarks3d": L3, "frontIoU": fit_iou, "K": K, "mesh": a.mesh, "paint": a.paint}, open(a.out.replace(".npz", ".json"), "w"), indent=1)
print("[prep] wrote", a.out, len(V), "verts")
sys.stdout.flush()
os._exit(0)
