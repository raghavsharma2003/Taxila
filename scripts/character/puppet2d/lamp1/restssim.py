"""Rest-pose gate (PLAN §0.2, r8: SSIM >= 0.97 on the head crop): the live rig's rest frame (harness.mjs, every weight 0,
1:1, view [0, 0, 1024]) against the graded rig front, with the front's own cream replaced by the canvas clear colour
(the backdrop is a clear colour, not a layer). SSIM as r8 (gaussian sigma 1.5, on the channel mean), head crop
x 220-830, y 40-760 in rig space; also per-region means (eyes, mouth, hair edge) so a failure points at a layer.
    python3 -I restssim.py <render.png> [out.json]"""
import sys, json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
S = "/tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/r4-asha"
rend = np.asarray(Image.open(sys.argv[1]).convert("RGB")).astype(np.float32) / 255
front = np.asarray(Image.open(f"{S}/rs/front-g.png").convert("RGB")).astype(np.float32) / 255
g = json.load(open("/home/user/Taxila/art/character/puppet2d/lamp1/geom.json"))
bgc = np.load(f"{S}/masks.npz")["bgc"]
clear = np.array(g["clear"], np.float32)
# the cream ground -> the clear colour, through the matte (alpha = how far a pixel sits from the cream)
f0 = np.asarray(Image.open(f"{S}/rs/front.png").convert("RGB")).astype(np.float32)
dist = np.sqrt(((f0 - np.array([246.0, 209.0, 152.0])) ** 2).sum(2))
a = np.clip((dist - 8) / 40.0, 0, 1)
a = np.where(bgc, np.minimum(a, 0.0), a)
ref = front * a[..., None] + clear * (1 - a[..., None])
def ssim_map(x, y):
    x = x.mean(2); y = y.mean(2); f = lambda v: ndi.gaussian_filter(v, 1.5)
    mx, my = f(x), f(y); vx = f(x * x) - mx * mx; vy = f(y * y) - my * my; cv = f(x * y) - mx * my
    return ((2 * mx * my + 1e-4) * (2 * cv + 9e-4)) / ((mx * mx + my * my + 1e-4) * (vx + vy + 9e-4))
if rend.shape[0] != 1024:   # r8 measured at 720 px: compare at the render's size
    ref = np.asarray(Image.fromarray((ref * 255).astype(np.uint8)).resize(rend.shape[1::-1], Image.LANCZOS)).astype(np.float32) / 255
M = ssim_map(rend, ref)
k = rend.shape[0] / 1024
reg = {"head": (220, 40, 830, 760), "eyes": (360, 370, 700, 450), "mouth": (430, 570, 625, 650), "hair_top": (230, 40, 820, 230), "chin_neck": (380, 680, 680, 800)}
res = {n: round(float(M[int(y0 * k):int(y1 * k), int(x0 * k):int(x1 * k)].mean()), 4) for n, (x0, y0, x1, y1) in reg.items()}
res["size"] = rend.shape[0]
res["mean_abs_diff_head_255"] = round(float(np.abs(rend - ref)[int(40 * k):int(760 * k), int(220 * k):int(830 * k)].mean() * 255), 2)
res["gate_head_ge_0.97"] = res["head"] >= 0.97
print(res)
if len(sys.argv) > 2: json.dump({"date": "2026-10-10", "method": __doc__.strip(), **res}, open(sys.argv[2], "w"), indent=1)
Image.fromarray((np.clip(1 - M, 0, 1) * 255 * 4).clip(0, 255).astype(np.uint8)).save(f"{S}/ssim-map.png")
