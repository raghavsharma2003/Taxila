# Rest-pose proxy gate (PLAN §0.2): SSIM of a render against c-front at 1024², plus a side-by-side and a diff map.
#   python3 scripts/character/puppet2d/V/compare.py <render.png> <outprefix> [ref]
import sys, json
import numpy as np, cv2
from PIL import Image

ren = np.asarray(Image.open(sys.argv[1]).convert("RGB").resize((1024, 1024), Image.LANCZOS)).astype(np.float64)
refp = sys.argv[3] if len(sys.argv) > 3 else "docs/design/teacher/stylised/concepts/c-front.webp"
ref = np.asarray(Image.open(refp).convert("RGB").resize((1024, 1024), Image.LANCZOS)).astype(np.float64)
out = sys.argv[2]


def ssim(a, b):
    C1, C2 = (0.01 * 255) ** 2, (0.03 * 255) ** 2
    g = lambda x: cv2.GaussianBlur(x, (11, 11), 1.5)
    mu1, mu2 = g(a), g(b)
    s1, s2, s12 = g(a * a) - mu1 ** 2, g(b * b) - mu2 ** 2, g(a * b) - mu1 * mu2
    m = ((2 * mu1 * mu2 + C1) * (2 * s12 + C2)) / ((mu1 ** 2 + mu2 ** 2 + C1) * (s1 + s2 + C2))
    return m


gy = lambda x: 0.299 * x[..., 0] + 0.587 * x[..., 1] + 0.114 * x[..., 2]
m = ssim(gy(ren), gy(ref))
res = {"ssim_luma_full": round(float(m.mean()), 4)}
# per-region SSIM (boxes in 1024 space)
boxes = {"face": (330, 330, 750, 715), "eyes": (345, 395, 715, 505), "mouth": (440, 560, 625, 640), "hair": (200, 40, 830, 330), "bust": (190, 720, 860, 1024)}
for k, (x0, y0, x1, y1) in boxes.items():
    res["ssim_" + k] = round(float(m[y0:y1, x0:x1].mean()), 4)
res["mean_abs_rgb"] = round(float(np.abs(ren - ref).mean()), 2)
print(json.dumps(res))
side = np.concatenate([ref, np.full((1024, 12, 3), 255.0), ren], axis=1).astype(np.uint8)
Image.fromarray(side).save(out + "_side.png")
d = np.clip(np.abs(ren - ref).mean(-1) * 4, 0, 255).astype(np.uint8)
Image.fromarray(cv2.applyColorMap(d, cv2.COLORMAP_INFERNO)[..., ::-1]).save(out + "_diff.png")
json.dump(res, open(out + "_ssim.json", "w"))
