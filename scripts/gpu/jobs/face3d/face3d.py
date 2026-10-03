#!/usr/bin/env python3
"""Hunyuan3D-2.1 stages of the face3d job (runs in /opt/venv-hy, cwd = the pinned Hunyuan3D-2.1 checkout).

    python face3d.py matte --refs DIR --views front,q3_left,q3_right --out DIR
    python face3d.py shape --image DIR/front_rgba.png --seeds 0,1,2 --octree 512 --steps 50 --guidance 5.0 --out DIR
    python face3d.py paint --mesh DIR/shape_s1.ply --images a.png,b.png --views 6 --res 512 --out DIR

Licence: Tencent Hunyuan 3D 2.1 Community Licence (LICENSE + Notice.txt of the pinned checkout). Territory excludes the
EU, UK and South Korea (this build runs in us-east-1 for an India product: inside the Territory); outputs are ours
(section 6.d) and are never used to train or improve another model (section 5.b). See docs/design/teacher/GPU-JOBS.md.

`bpy` is stubbed: the pinned requirements name bpy==4.0, which PyPI no longer serves, and Hunyuan uses it only for
convert_obj_to_glb, which we replace with trimesh (save_glb=False below).
"""
import argparse
import json
import os
import sys
import time
import types

sys.modules.setdefault("bpy", types.ModuleType("bpy"))   # see docstring
sys.path.insert(0, os.getcwd())                            # torchvision_fix.py lives at the checkout root (cwd), not here
sys.path.insert(0, "./hy3dshape")
sys.path.insert(0, "./hy3dpaint")

ap = argparse.ArgumentParser()
ap.add_argument("stage", choices=["matte", "shape", "paint"])
ap.add_argument("--refs"); ap.add_argument("--views", default="front")
ap.add_argument("--crop", default="head", choices=["head", "none"], help="matte: crop to the head from the portrait's landmarks")
ap.add_argument("--lm", help="matte --crop head: landmarks.json of the portraits")
ap.add_argument("--image"); ap.add_argument("--images")
ap.add_argument("--mesh"); ap.add_argument("--out", required=True)
ap.add_argument("--seeds", default="0,1,2"); ap.add_argument("--octree", type=int, default=512)
ap.add_argument("--steps", type=int, default=50); ap.add_argument("--guidance", type=float, default=5.0)
ap.add_argument("--chunks", type=int, default=200000)
ap.add_argument("--res", type=int, default=512)
a = ap.parse_args()
os.makedirs(a.out, exist_ok=True)
T = lambda m: print(f"[face3d {time.strftime('%H:%M:%S')}] {m}", flush=True)

try:
    from torchvision_fix import apply_fix
    apply_fix()                                  # basicsr 1.4.2 imports torchvision.transforms.functional_tensor
except Exception as e:
    T(f"torchvision_fix: {e}")

import torch  # noqa: E402
from PIL import Image  # noqa: E402

if os.environ.get("FACE3D_IMPORT_CHECK") == "1":       # smoke: the exact import path the GPU stages use
    from hy3dshape.pipelines import Hunyuan3DDiTFlowMatchingPipeline  # noqa: F401
    from textureGenPipeline import Hunyuan3DPaintPipeline  # noqa: F401
    import realesrgan  # noqa: F401
    T("import check ok"); sys.exit(0)

rep_path = os.path.join(a.out, f"report-{a.stage}.json")
rep = {"stage": a.stage, "args": vars(a), "torch": torch.__version__, "cuda": torch.version.cuda,
       "gpu": torch.cuda.get_device_name(0) if torch.cuda.is_available() else None}
t0 = time.time()

if a.stage == "matte":
    import numpy as np
    from hy3dshape.rembg import BackgroundRemover          # rembg + U-2-Net (u2net.onnx from $U2NET_HOME, hash-pinned)
    rm = BackgroundRemover()
    rep["views"] = {}
    LM = json.load(open(a.lm)) if a.lm else {}
    for v in a.views.split(","):
        p = os.path.join(a.refs, f"{v}.png")
        if not os.path.exists(p):
            T(f"skip {v}: missing"); continue
        src = Image.open(p).convert("RGB")
        box = None
        if a.crop == "head" and LM.get(v):
            # a square around the face oval: 1.9 x its larger side, centre raised by 0.12 x its height for the hair, so
            # the head (not the bust) fills the shape model's frame and its 512^3 octree [first GPU run: the bust matte
            # spanned the full 1024 px width]
            import numpy as np
            P = np.array(LM[v]["lm"])[:468, :2]
            x0, y0 = P.min(0); x1, y1 = P.max(0)
            side = 1.9 * max(x1 - x0, y1 - y0)
            cx, cy = (x0 + x1) / 2, (y0 + y1) / 2 - 0.12 * (y1 - y0)
            box = tuple(int(round(q)) for q in (max(0, cx - side / 2), max(0, cy - side / 2), min(src.width, cx + side / 2), min(src.height, cy + side / 2)))
            src = src.crop(box)
        im = rm(src)
        im.save(os.path.join(a.out, f"{v}_rgba.png"))
        al = im.split()[-1]
        rep["views"][v] = {"size": im.size, "cropBox": box, "alphaBBox": al.getbbox(), "fgFrac": round(int((np.asarray(al) > 127).sum()) / (im.size[0] * im.size[1]), 4)}
        T(f"matte {v}: bbox {al.getbbox()}")

elif a.stage == "shape":
    from hy3dshape.pipelines import Hunyuan3DDiTFlowMatchingPipeline
    from hy3dshape.postprocessors import FloaterRemover, DegenerateFaceRemover
    pipe = Hunyuan3DDiTFlowMatchingPipeline.from_pretrained("tencent/Hunyuan3D-2.1")
    img = Image.open(a.image).convert("RGBA")
    rep["seeds"] = {}
    for s in [int(x) for x in a.seeds.split(",")]:
        ts = time.time()
        mesh = pipe(image=img, num_inference_steps=a.steps, guidance_scale=a.guidance, octree_resolution=a.octree,
                    num_chunks=a.chunks, generator=torch.Generator(device="cuda").manual_seed(s), output_type="trimesh")[0]
        mesh = DegenerateFaceRemover()(FloaterRemover()(mesh))
        f = os.path.join(a.out, f"shape_s{s}.ply")
        mesh.export(f)
        rep["seeds"][s] = {"file": os.path.basename(f), "verts": int(len(mesh.vertices)), "faces": int(len(mesh.faces)),
                           "bboxMin": mesh.bounds[0].round(4).tolist(), "bboxMax": mesh.bounds[1].round(4).tolist(),
                           "seconds": round(time.time() - ts, 1), "peakVramGB": round(torch.cuda.max_memory_allocated() / 1e9, 2)}
        T(f"shape seed {s}: {len(mesh.vertices)} v / {len(mesh.faces)} f in {time.time() - ts:.0f} s")
    del pipe
    torch.cuda.empty_cache()

elif a.stage == "paint":
    import trimesh
    from textureGenPipeline import Hunyuan3DPaintPipeline, Hunyuan3DPaintConfig
    conf = Hunyuan3DPaintConfig(a.views if isinstance(a.views, int) else int(a.views), a.res)
    conf.realesrgan_ckpt_path = os.path.join(os.environ.get("WEIGHTS_DIR", "/opt/weights"), "RealESRGAN_x4plus.pth")
    conf.multiview_cfg_path = "hy3dpaint/cfgs/hunyuan-paint-pbr.yaml"
    conf.custom_pipeline = "hy3dpaint/hunyuanpaintpbr"
    paint = Hunyuan3DPaintPipeline(conf)
    imgs = [Image.open(p).convert("RGBA") for p in a.images.split(",")]
    # paint wants a mesh file it can remesh next to; it writes white_mesh_remesh.obj beside it
    src = os.path.join(a.out, "paint_input.obj")
    trimesh.load(a.mesh, force="mesh").export(src)
    obj = paint(mesh_path=src, image_path=imgs if len(imgs) > 1 else imgs[0], output_mesh_path=os.path.join(a.out, "head_textured.obj"),
                use_remesh=True, save_glb=False)
    tm = trimesh.load(obj, force="mesh", process=False)
    tm.export(os.path.join(a.out, "head_textured.glb"))
    rep.update(obj=os.path.basename(obj), verts=int(len(tm.vertices)), faces=int(len(tm.faces)),
               files=sorted(f for f in os.listdir(a.out) if f.startswith("head_textured")),
               peakVramGB=round(torch.cuda.max_memory_allocated() / 1e9, 2), refs=len(imgs))
    T(f"paint: {rep['files']}")

rep["seconds"] = round(time.time() - t0, 1)
json.dump(rep, open(rep_path, "w"), indent=1, default=str)
T(f"{a.stage} done in {rep['seconds']} s")
