"""Rest-pose gate (r8 / lamp1: SSIM >= 0.97 on the head crop): the live KeyRig rest frame (restssim.mjs) against the
approved front graded the same way (pack.py: rig-b, skin grade, cream -> the clear colour), native px, crop (162,0)-
(862,700). SSIM as lamp1 restssim.py (gaussian sigma 1.5, on the channel mean); head = lamp1's head crop moved to native.
    python3 -I restssim.py <render.png> <out.json>"""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
import numpy as np
from PIL import Image
from keys import ssim_map
rend = np.asarray(Image.open(sys.argv[1]).convert("RGB")).astype(np.float32)
ref = np.asarray(Image.open(f"{S}/front-graded-native.png").convert("RGB").crop((X0, Y0, X0 + SZ, Y0 + SZ))).astype(np.float32)
M = ssim_map(rend, ref)
c = lambda v: int(round(v / K))
reg = {"head": (220, 40, 830, 760), "eyes": (360, 370, 700, 450), "mouth": (430, 570, 625, 650), "hair_top": (230, 40, 820, 230), "chin_neck": (380, 680, 680, 800)}
res = {n: round(float(M[c(y0):c(y1), c(x0):c(x1)].mean()), 4) for n, (x0, y0, x1, y1) in reg.items()}
res["mean_abs_diff_head_255"] = round(float(np.abs(rend - ref)[c(40):c(760), c(220):c(830)].mean()), 2)
res["gate_head_ge_0.97"] = res["head"] >= 0.97
print(res)
json.dump({"date": "2026-10-10", "method": __doc__.strip(), **res}, open(sys.argv[2], "w"), indent=1)
