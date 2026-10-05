"""Pack the runtime payload (judge r2 fix 6: 2.2 MB of PNG against a 120 KB budget): every layer as lossy WebP (alpha
lossless-ish at alpha_quality 90), feature layers at a higher quality than the smooth fields, plus a minified geom.json
(numbers rounded). Writes art/character/puppet2d/polish-r7/pack/ and reports bytes and the rest-pose SSIM of the
decoded WebP composite against the PNG composite (quality guard).
    python3 scripts/character/puppet2d/polish-r7/pack.py
"""
import io
import json
import os
import numpy as np
from PIL import Image

L = "art/character/puppet2d/polish-r7/layers"
P = "art/character/puppet2d/polish-r7/pack"
os.makedirs(P, exist_ok=True)
g = json.load(open(f"{L}/geom.json"))
names = [n for n in g["rects"] if n != "bg"] + ["interior"]
names += [f"plate{k}" for k in ("L", "R") if k in g.get("plates", {})]   # r4: the painted 3/4 plates (two-texture yaw keyform)
HIGH = {"mouth_rest", "irisL", "irisR", "scleraL", "scleraR", "lidL", "lidR", "lowerL", "lowerR", "browL", "browR", "catchL", "catchR",
        "lidmidL", "lidmidR", "lidshutL", "lidshutR", "interior"}
total = 0
rows = {}
for n in names:
    im = Image.open(f"{L}/{n}.png").convert("RGBA")
    q = 90 if n in HIGH else 82
    if n == "interior":
        im.save(f"{P}/{n}.webp", "WEBP", lossless=True, method=6)
    else:
        im.save(f"{P}/{n}.webp", "WEBP", quality=q, alpha_quality=90, method=6)
    b = os.path.getsize(f"{P}/{n}.webp")
    rows[n] = b
    total += b


def rnd(o):
    if isinstance(o, float):
        return round(o, 1)
    if isinstance(o, list):
        return [rnd(v) for v in o]
    if isinstance(o, dict):
        return {k: rnd(v) for k, v in o.items() if k not in ("geom", "lashBotFine")}
    return o


gm = rnd(g)
s = json.dumps(gm, separators=(",", ":"))
open(f"{P}/geom.json", "w").write(s)
import gzip
gz = len(gzip.compress(s.encode()))
total_gz = total + gz
# quality guard: composite the rest pose from WebP vs PNG layers (static, like restcheck.py)
def comp(src, ext):
    out = np.zeros((1024, 1024, 3), np.float32) + np.array([251.4, 229.4, 188.6]) / 255
    for n in ["hairback", "bun", "body", "ears", "face", "browL", "browR", "mouth_rest", "lockbed", "hair", "lockL", "lockR"]:
        r = g["rects"][n]
        a = np.asarray(Image.open(f"{src}/{n}.{ext}").convert("RGBA")).astype(np.float32) / 255
        al = a[..., 3:4]
        out[r[1]:r[3], r[0]:r[2]] = out[r[1]:r[3], r[0]:r[2]] * (1 - al) + a[..., :3] * al
    return out
from scipy import ndimage as ndi
def ssim(a, b):
    a = a.mean(2); b = b.mean(2); f = lambda x: ndi.gaussian_filter(x, 1.5)
    ma, mb = f(a), f(b); va = f(a * a) - ma * ma; vb = f(b * b) - mb * mb; cv = f(a * b) - ma * mb
    return ((2 * ma * mb + 1e-4) * (2 * cv + 9e-4) / ((ma * ma + mb * mb + 1e-4) * (va + vb + 9e-4)))
A, B = comp(L, "png"), comp(P, "webp")
sv = float(ssim(A, B)[150:800, 180:850].mean())
png_total = sum(os.path.getsize(f"{L}/{n}.png") for n in names) + os.path.getsize(f"{L}/geom.json")
rep = {"layers_webp_bytes": total, "geom_json_bytes": len(s), "geom_json_gzip_bytes": gz, "payload_bytes_wire": total_gz,
       "png_payload_bytes_before": png_total, "ssim_webp_vs_png_head": round(sv, 4), "max_abs_diff": round(float(np.abs(A - B).max()), 3),
       "per_layer": rows}
json.dump(rep, open(f"{P}/pack-report.json", "w"), indent=1)
print({k: v for k, v in rep.items() if k != "per_layer"})
