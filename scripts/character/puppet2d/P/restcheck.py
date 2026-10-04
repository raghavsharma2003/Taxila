"""Rest-pose gate (PLAN §0.2): recomposite the layers with no deformation and compare with c-front (SSIM, head crop)."""
import json, sys, numpy as np
from PIL import Image
from scipy import ndimage as ndi
L = "art/character/puppet2d/P/layers"
g = json.load(open(f"{L}/geom.json"))
W, H = g["size"]
ref = np.asarray(Image.open("art/character/puppet2d/P/c-front.png").convert("RGB")).astype(np.float32) / 255
out = np.asarray(Image.open(f"{L}/bg.png").convert("RGB")).astype(np.float32) / 255
def opening(side):
    e = g["eyes"][side]; m = np.zeros((H, W), bool)
    for i, x in enumerate(range(e["x"][0], e["x"][1] + 1)):
        m[int(round(e["top"][i])) - 1:int(round(e["bot"][i])) + 1, x] = True
    return m
def over(name, clip=None):
    global out
    x0, y0, x1, y1 = g["rects"][name]
    a = np.asarray(Image.open(f"{L}/{name}.png")).astype(np.float32) / 255
    al = a[..., 3:4]
    if clip is not None: al = al * clip[y0:y1, x0:x1, None]
    out[y0:y1, x0:x1] = out[y0:y1, x0:x1] * (1 - al) + a[..., :3] * al
order = ["hairback", "bun", "body", "ears", "face"]
for n in order: over(n)
for s in ("L", "R"):
    op = opening(s)
    over("sclera" + s, op); over("iris" + s, op); over("catch" + s, op); over("lower" + s); over("lid" + s)
for n in ["browL", "browR", "mouth_rest", "hair", "lockL", "lockR"]: over(n)
Image.fromarray((out * 255).round().astype(np.uint8)).save("art/character/puppet2d/P/work/rest.png")
def ssim(a, b):
    a = a.mean(2); b = b.mean(2)
    C1, C2 = 0.01 ** 2, 0.03 ** 2
    f = lambda x: ndi.gaussian_filter(x, 1.5)
    ma, mb = f(a), f(b); va = f(a * a) - ma * ma; vb = f(b * b) - mb * mb; cov = f(a * b) - ma * mb
    return ((2 * ma * mb + C1) * (2 * cov + C2) / ((ma * ma + mb * mb + C1) * (va + vb + C2)))
s = ssim(out, ref)
crop = (slice(150, 800), slice(180, 850))
print("SSIM full %.4f  head-bust crop %.4f" % (s.mean(), s[crop].mean()))
d = np.abs(out - ref).max(2)
Image.fromarray((np.clip(d * 4, 0, 1) * 255).astype(np.uint8)).save("art/character/puppet2d/P/work/rest-diff.png")
