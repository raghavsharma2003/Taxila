#!/usr/bin/env python3
"""Arm B sculpt targets for the style C teacher (TECH-PLAN section 4). Runs in /opt/venv-hy on the GPU instance.

    python stylised3d.py matte   --refs DIR --views front-ortho,neutral,profile-left,profile-right,back --out W
    python stylised3d.py shape21 --image W/front-ortho_rgba.png --tag fo --seeds 0,1,2 --out W        (cwd = /opt/hy21)
    python stylised3d.py shapemv --front .. --left .. --right .. --back .. --tag A --seeds 0,1 --out W (cwd = /opt/hy2)
    python stylised3d.py score   --meshes a.ply,b.ply --mattes W --out W/score.json
    python stylised3d.py paint   --mesh W/x.ply --images W/front-ortho_rgba.png --out W/paint_x          (cwd = /opt/hy21)

The AI meshes are SHAPE TARGETS ONLY (TECH-PLAN 1.2, decisions avatar-cast-shared-mpfb-s2): our own topology is wrapped
onto them on CPU; no AI vertex ships, and outputs are never used to train or improve another model (Hunyuan licence 5.b).
Licences: Hunyuan3D-2.1 = Tencent Hunyuan 3D 2.1 Community; Hunyuan3D-2mv = Tencent Hunyuan 3D 2.0 Community. Both
exclude EU/UK/KR; this runs in us-east-1 for an India product.
"""
import argparse
import json
import os
import sys
import time
import types

sys.modules.setdefault("bpy", types.ModuleType("bpy"))
sys.path.insert(0, os.getcwd())

ap = argparse.ArgumentParser()
ap.add_argument("stage", choices=["matte", "shape21", "shapemv", "score", "paint"])
ap.add_argument("--refs"); ap.add_argument("--views")
ap.add_argument("--image"); ap.add_argument("--images"); ap.add_argument("--tag", default="x")
ap.add_argument("--front"); ap.add_argument("--left"); ap.add_argument("--right"); ap.add_argument("--back")
ap.add_argument("--meshes"); ap.add_argument("--mattes"); ap.add_argument("--mesh")
ap.add_argument("--seeds", default="0"); ap.add_argument("--octree", type=int, default=512)
ap.add_argument("--steps", type=int, default=50); ap.add_argument("--guidance", type=float, default=5.0)
ap.add_argument("--faces", type=int, default=400000, help="decimate returned shapes to this many faces")
ap.add_argument("--out", required=True)
a = ap.parse_args()
T = lambda m: print(f"[stylised3d {time.strftime('%H:%M:%S')}] {m}", flush=True)
t0 = time.time()


def decimate_save(mesh, path, faces):
    """Quadric decimation (pymeshlab) so the returned bundle stays small; the shape target needs ~1 mm, not 0.1 mm."""
    import pymeshlab
    ms = pymeshlab.MeshSet()
    ms.add_mesh(pymeshlab.Mesh(mesh.vertices, mesh.faces))
    if len(mesh.faces) > faces:
        ms.meshing_decimation_quadric_edge_collapse(targetfacenum=faces, preservenormal=True, qualitythr=0.5)
    ms.save_current_mesh(path, binary=True)
    m = ms.current_mesh()
    return int(m.vertex_number()), int(m.face_number())


if a.stage == "matte":
    sys.path.insert(0, "/opt/hy21/hy3dshape")
    from PIL import Image
    import numpy as np
    from hy3dshape.rembg import BackgroundRemover
    os.makedirs(a.out, exist_ok=True)
    rm = BackgroundRemover()
    rep = {}
    for v in a.views.split(","):
        src = Image.open(os.path.join(a.refs, f"{v}.webp")).convert("RGB")
        im = rm(src)
        im.save(os.path.join(a.out, f"{v}_rgba.png"))
        al = np.asarray(im.split()[-1])
        rep[v] = {"bbox": im.split()[-1].getbbox(), "fg": round(float((al > 127).mean()), 4)}
        T(f"matte {v}: {rep[v]}")
    json.dump(rep, open(os.path.join(a.out, "report-matte.json"), "w"), indent=1)

elif a.stage == "shape21":
    sys.path.insert(0, "./hy3dshape")
    from torchvision_fix import apply_fix
    apply_fix()
    import torch
    from PIL import Image
    from hy3dshape.pipelines import Hunyuan3DDiTFlowMatchingPipeline
    from hy3dshape.postprocessors import FloaterRemover, DegenerateFaceRemover
    pipe = Hunyuan3DDiTFlowMatchingPipeline.from_pretrained("tencent/Hunyuan3D-2.1")
    img = Image.open(a.image).convert("RGBA")
    rep = {}
    for s in [int(x) for x in a.seeds.split(",")]:
        ts = time.time()
        mesh = pipe(image=img, num_inference_steps=a.steps, guidance_scale=a.guidance, octree_resolution=a.octree,
                    num_chunks=200000, generator=torch.Generator(device="cuda").manual_seed(s), output_type="trimesh")[0]
        mesh = DegenerateFaceRemover()(FloaterRemover()(mesh))
        f = os.path.join(a.out, f"h21_{a.tag}_s{s}.ply")
        nv, nf = decimate_save(mesh, f, a.faces)
        rep[s] = {"file": os.path.basename(f), "rawFaces": int(len(mesh.faces)), "verts": nv, "faces": nf,
                  "seconds": round(time.time() - ts, 1), "peakVramGB": round(torch.cuda.max_memory_allocated() / 1e9, 2)}
        T(f"h21 {a.tag} seed {s}: {rep[s]}")
    json.dump(rep, open(os.path.join(a.out, f"report-h21-{a.tag}.json"), "w"), indent=1)

elif a.stage == "shapemv":
    import torch
    from PIL import Image
    from hy3dgen.shapegen import Hunyuan3DDiTFlowMatchingPipeline, FloaterRemover, DegenerateFaceRemover
    pipe = Hunyuan3DDiTFlowMatchingPipeline.from_pretrained("tencent/Hunyuan3D-2mv", subfolder="hunyuan3d-dit-v2-mv",
                                                            variant="fp16", use_safetensors=True)
    views = {k: Image.open(p).convert("RGBA") for k, p in (("front", a.front), ("left", a.left), ("right", a.right), ("back", a.back)) if p}
    rep = {"views": {k: p for k, p in (("front", a.front), ("left", a.left), ("right", a.right), ("back", a.back)) if p}}
    for s in [int(x) for x in a.seeds.split(",")]:
        ts = time.time()
        mesh = pipe(image=views, num_inference_steps=a.steps, guidance_scale=a.guidance, octree_resolution=a.octree,
                    num_chunks=200000, generator=torch.manual_seed(s), output_type="trimesh")[0]
        mesh = DegenerateFaceRemover()(FloaterRemover()(mesh))
        f = os.path.join(a.out, f"hmv_{a.tag}_s{s}.ply")
        nv, nf = decimate_save(mesh, f, a.faces)
        rep[s] = {"file": os.path.basename(f), "rawFaces": int(len(mesh.faces)), "verts": nv, "faces": nf,
                  "seconds": round(time.time() - ts, 1), "peakVramGB": round(torch.cuda.max_memory_allocated() / 1e9, 2)}
        T(f"hmv {a.tag} seed {s}: {rep[s]}")
    json.dump(rep, open(os.path.join(a.out, f"report-hmv-{a.tag}.json"), "w"), indent=1)

elif a.stage == "score":
    # silhouette IoU of each mesh against the front-ortho and profile mattes, orthographic, at 4 yaws (the model's
    # forward axis is not assumed), aligned by silhouette height and centre. A proxy only: the eye picks (TECH-PLAN 4.2).
    import numpy as np
    import trimesh
    from PIL import Image, ImageDraw
    N = 256

    def mask_from_alpha(p):
        al = np.asarray(Image.open(p).split()[-1]) > 127
        ys, xs = np.nonzero(al)
        return crop_norm(al[ys.min():ys.max() + 1, xs.min():xs.max() + 1])

    def crop_norm(m):
        h, w = m.shape
        s = (N - 8) / max(h, w)
        im = Image.fromarray((m * 255).astype(np.uint8)).resize((max(1, int(w * s)), max(1, int(h * s))), Image.BILINEAR)
        out = np.zeros((N, N), bool)
        arr = np.asarray(im) > 127
        y0 = 4; x0 = (N - arr.shape[1]) // 2
        out[y0:y0 + arr.shape[0], x0:x0 + arr.shape[1]] = arr
        return out

    def sil(V, F, yaw):
        c, s_ = np.cos(yaw), np.sin(yaw)
        x = c * V[:, 0] + s_ * V[:, 2]
        y = -V[:, 1]
        x = x - x.min(); y = y - y.min()
        sc = 1000 / max(x.max(), y.max())
        P = np.stack([x * sc, y * sc], 1)
        W, H = int(x.max() * sc) + 2, int(y.max() * sc) + 2
        im = Image.new("L", (W, H), 0)
        d = ImageDraw.Draw(im)
        for f in F[:: max(1, len(F) // 150000)]:
            d.polygon([tuple(P[f[0]]), tuple(P[f[1]]), tuple(P[f[2]])], fill=255)
        m = np.asarray(im) > 127
        return crop_norm(m)

    iou = lambda A, B: float((A & B).sum() / max(1, (A | B).sum()))
    ref = {v: mask_from_alpha(os.path.join(a.mattes, f"{v}_rgba.png")) for v in ("front-ortho", "profile-left", "profile-right", "back")}
    res = {}
    for p in a.meshes.split(","):
        m = trimesh.load(p, force="mesh", process=False)
        V, F = np.asarray(m.vertices), np.asarray(m.faces)
        r = {"bounds": m.bounds.round(3).tolist(), "yaw": {}}
        for k in range(4):
            yaw = k * np.pi / 2
            S = sil(V, F, yaw)
            r["yaw"][str(k * 90)] = {v: round(iou(S, ref[v]), 4) for v in ref}
        bestf = max(r["yaw"].values(), key=lambda q: q["front-ortho"])["front-ortho"]
        bestp = max(max(q["profile-left"], q["profile-right"]) for q in r["yaw"].values())
        r["score"] = round(0.6 * bestf + 0.4 * bestp, 4)
        res[os.path.basename(p)] = r
        T(f"score {os.path.basename(p)}: front {bestf:.3f} profile {bestp:.3f} -> {r['score']}")
    json.dump(res, open(a.out, "w"), indent=1)

elif a.stage == "paint":
    sys.path.insert(0, "./hy3dshape"); sys.path.insert(0, "./hy3dpaint")
    from torchvision_fix import apply_fix
    apply_fix()
    import torch
    import trimesh
    from PIL import Image
    from textureGenPipeline import Hunyuan3DPaintPipeline, Hunyuan3DPaintConfig
    os.makedirs(a.out, exist_ok=True)
    conf = Hunyuan3DPaintConfig(6, 512)
    conf.realesrgan_ckpt_path = os.path.join(os.environ.get("WEIGHTS_DIR", "/opt/weights"), "RealESRGAN_x4plus.pth")
    conf.multiview_cfg_path = "hy3dpaint/cfgs/hunyuan-paint-pbr.yaml"
    conf.custom_pipeline = "hy3dpaint/hunyuanpaintpbr"
    paint = Hunyuan3DPaintPipeline(conf)
    imgs = [Image.open(p).convert("RGBA") for p in a.images.split(",")]
    src = os.path.join(a.out, "paint_input.obj")
    trimesh.load(a.mesh, force="mesh").export(src)
    obj = paint(mesh_path=src, image_path=imgs if len(imgs) > 1 else imgs[0], output_mesh_path=os.path.join(a.out, "textured.obj"),
                use_remesh=True, save_glb=False)
    tm = trimesh.load(obj, force="mesh", process=False)
    tm.export(os.path.join(a.out, "textured.glb"))
    for f in os.listdir(a.out):
        if f.endswith(".obj") and f != "textured.obj":
            os.remove(os.path.join(a.out, f))
    T(f"paint {a.mesh}: {len(tm.vertices)} v; files {sorted(os.listdir(a.out))}")

T(f"{a.stage} done in {time.time() - t0:.0f} s")
