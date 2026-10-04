import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from PIL import Image
from common import load, SRC
D = load()
P, polys, uv, W = D["P"], D["polys"], D["uv"], D["weights"]
tex = np.asarray(Image.open(os.path.join(SRC, "f014_head_color.tga")).convert("RGB")).astype(np.float32) / 255
H_, W_ = tex.shape[:2]
def samp(u, v): return tex[np.clip(((1 - v) * H_).astype(int), 0, H_ - 1), np.clip((u * W_).astype(int), 0, W_ - 1)]
hm = D["mats"].index("f014_head")
fids = [i for i, p in enumerate(polys) if p[2] == hm]
par = {f: f for f in fids}
def find(a):
    while par[a] != a: par[a] = par[par[a]]; a = par[a]
    return a
edge = {}
for f in fids:
    vs, ls, _ = polys[f]
    for j in range(len(vs)):
        a, b = vs[j], vs[(j + 1) % len(vs)]; la, lb = ls[j], ls[(j + 1) % len(vs)]
        ua, ub = tuple(np.round(uv[la], 4)), tuple(np.round(uv[lb], 4))
        key = (a, ua, b, ub) if a < b else (b, ub, a, ua)
        if key in edge: par[find(f)] = find(edge[key])
        else: edge[key] = f
isl = {}
for f in fids: isl.setdefault(find(f), []).append(f)
for r, fs in sorted(isl.items(), key=lambda x: -len(x[1])):
    ls = np.array([l for f in fs for l in polys[f][1]])
    U = uv[ls]; c = samp(U[:, 0], U[:, 1]); lum = (c @ [0.3, 0.59, 0.11]).mean()
    vs = set(v for f in fs for v in polys[f][0])
    bones = {}
    for v in vs:
        b = max(W[v], key=W[v].get); bones[b] = bones.get(b, 0) + 1
    z = P[list(vs), 2]
    print(f"isl {r:5d} faces {len(fs):4d} uv [{U[:,0].min():.2f},{U[:,0].max():.2f}]x[{U[:,1].min():.2f},{U[:,1].max():.2f}] lum {lum:.3f} z [{z.min():.3f},{z.max():.3f}] {sorted(bones.items(), key=lambda x:-x[1])[:2]}")
os._exit(0)
