"""Construction lock check (judge r2 fix 5): per-expression silhouette IoU against rest, head angles cancelled, so only
the expression's own deformation is measured. Two silhouettes: the face layer alone (?only=face, jaw/cheek outline) and
the whole head (all layers, y < 760). Rendered over cream and teal; alpha from their difference.
    python3 iou.py   (after rendering work/iou/{cream,teal}[_face])"""
import json, os
import numpy as np
from PIL import Image
D = "art/character/puppet2d/polish-r8/work/iou"
CR, TE = np.array([251.4, 229.4, 188.6]), np.array([30, 128, 128], float)
def alpha(sub, n):
    c = np.asarray(Image.open(f"{D}/cream{sub}/{n}.png").convert("RGB")).astype(float)
    t = np.asarray(Image.open(f"{D}/teal{sub}/{n}.png").convert("RGB")).astype(float)
    return np.clip(1 - np.linalg.norm(c - t, axis=2) / np.linalg.norm(CR - TE), 0, 1)
res = {}
for sub, lbl in (("_face", "face"), ("", "head")):
    r0 = alpha(sub, "rest") > 0.5
    r0[760:] = False
    for n in sorted(f[:-4] for f in os.listdir(f"{D}/cream{sub}")):
        m = alpha(sub, n) > 0.5
        m[760:] = False
        iou = (m & r0).sum() / max(1, (m | r0).sum())
        # width of the face silhouette at the cheek line (y 560) and at the eye line (y 450)
        w = {y: int(np.ptp(np.where(m[y])[0])) if m[y].any() else 0 for y in (450, 560)}
        res.setdefault(n, {})[lbl] = {"iou": round(float(iou), 4), "w450": w[450], "w560": w[560]}
json.dump(res, open(f"{D}/iou.json", "w"), indent=1)
for n, v in res.items():
    print(f"{n:10s} face IoU {v['face']['iou']:.4f} w {v['face']['w450']}/{v['face']['w560']}   head IoU {v['head']['iou']:.4f}")
