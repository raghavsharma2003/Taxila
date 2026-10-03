#!/usr/bin/env python3
"""Texture-side GPU stage of the face3d job (runs in /opt/venv-mg): de-lit albedo and surface normals per portrait.

    python delight.py --refs DIR --views front,q3_left,... --out DIR [--ensemble 3] [--seed 0]

Marigold-IID "appearance" v1-1 (prs-eth, weights CreativeML Open RAIL++-M, code Apache-2.0) splits each portrait into
albedo / roughness / metallicity; Marigold-Normals v1-1 (same licences) predicts camera-space normals. Outputs keep each
portrait's own pixel grid (match_input_resolution), so the portraits' existing MediaPipe landmarks.json still applies:
  refs_delit/<view>.png             albedo (sRGB, what project.py linearises), drop-in for the portrait
  refs_delit/<view>_roughness.png, <view>_metallicity.png, <view>_normal.png
  refs_delit/landmarks.json         a copy of the portraits' landmarks (same grid)
This replaces project.py's own de-light (divide by low-pass skin luminance, which removes only low frequencies: the baked
lip-line shading of defect 5) when the GPU target is enabled with texture mode `delit`.
"""
import argparse
import json
import os
import shutil
import time

import numpy as np
import torch
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument("--refs", required=True); ap.add_argument("--views", required=True); ap.add_argument("--out", required=True)
ap.add_argument("--ensemble", type=int, default=3); ap.add_argument("--seed", type=int, default=0)
ap.add_argument("--res", type=int, default=768)
a = ap.parse_args()
od = os.path.join(a.out, "refs_delit"); os.makedirs(od, exist_ok=True)
T = lambda m: print(f"[delight {time.strftime('%H:%M:%S')}] {m}", flush=True)
import diffusers  # noqa: E402

rep = {"views": {}, "diffusers": diffusers.__version__}
t0 = time.time()
iid = diffusers.MarigoldIntrinsicsPipeline.from_pretrained("prs-eth/marigold-iid-appearance-v1-1", variant="fp16", torch_dtype=torch.float16).to("cuda")
nrm = diffusers.MarigoldNormalsPipeline.from_pretrained("prs-eth/marigold-normals-v1-1", variant="fp16", torch_dtype=torch.float16).to("cuda")
for v in a.views.split(","):
    p = os.path.join(a.refs, f"{v}.png")
    if not os.path.exists(p):
        continue
    im = Image.open(p).convert("RGB")
    ts = time.time()
    g = torch.Generator(device="cuda").manual_seed(a.seed)
    out = iid(im, ensemble_size=a.ensemble, processing_resolution=a.res, match_input_resolution=True, generator=g)
    vis = iid.image_processor.visualize_intrinsics(out.prediction, iid.target_properties)[0]
    for k, img in vis.items():
        img = img.resize(im.size, Image.LANCZOS) if img.size != im.size else img
        img.save(os.path.join(od, f"{v}.png" if k == "albedo" else f"{v}_{k}.png"))
    g = torch.Generator(device="cuda").manual_seed(a.seed)
    no = nrm(im, ensemble_size=a.ensemble, processing_resolution=a.res, match_input_resolution=True, generator=g)
    nv = nrm.image_processor.visualize_normals(no.prediction)[0]
    (nv.resize(im.size, Image.LANCZOS) if nv.size != im.size else nv).save(os.path.join(od, f"{v}_normal.png"))
    alb = np.asarray(Image.open(os.path.join(od, f"{v}.png")).convert("RGB")).astype(np.float32)
    rep["views"][v] = {"size": im.size, "seconds": round(time.time() - ts, 1), "albedoMeanRGB": alb.reshape(-1, 3).mean(0).round(1).tolist(),
                       "targets": list(vis.keys())}
    T(f"{v}: {rep['views'][v]}")
lm = os.path.join(a.refs, "landmarks.json")
if os.path.exists(lm):
    shutil.copy(lm, os.path.join(od, "landmarks.json"))
rep["seconds"] = round(time.time() - t0, 1)
rep["peakVramGB"] = round(torch.cuda.max_memory_allocated() / 1e9, 2)
json.dump(rep, open(os.path.join(a.out, "report-delight.json"), "w"), indent=1)
T(f"done in {rep['seconds']} s")
