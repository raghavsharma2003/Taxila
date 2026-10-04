"""c2 diagnostic: Rocketbox alpha-card parts, how far each stands off the hair shell (finds the spikes)."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from scipy.spatial import cKDTree
from common import load
D = load(); P, polys, mats = D["P"], D["polys"], D["mats"]
MO, MH = mats.index("f014_opacity"), mats.index("f014_head")
from PIL import Image
tex = np.asarray(Image.open(os.path.join(os.environ.get("C2_SRC", "/tmp/claude-0/char/c2/src"), "f014_head_color.tga")).convert("L")).astype(float) / 255
uv = D["uv"]
shell = set()
for vs, ls, m in polys:
    if m == MH:
        lum = np.mean([tex[int((1 - uv[l][1]) * 2047), int(uv[l][0] * 2047)] for l in ls])
        c = P[vs].mean(0)
        if lum < 0.16 and c[2] > 1.5:
            shell.update(vs)
tree = cKDTree(P[sorted(shell)])
# card parts
par = {}
def f(a):
    while par.setdefault(a, a) != a: a = par[a]
    return a
for vs, ls, m in polys:
    if m == MO:
        for v in vs[1:]: par[f(v)] = f(vs[0])
parts = {}
for v in par: parts.setdefault(f(v), []).append(v)
seen = set()
for r, vs in sorted(parts.items(), key=lambda x: -len(x[1])):
    key = tuple(np.round(P[vs].mean(0), 4))
    if key in seen: continue
    seen.add(key)
    d, _ = tree.query(P[vs])
    c = P[vs].mean(0)
    print(f"part {r:5d} n={len(vs):3d} c=({c[0]:+.3f},{c[1]:+.3f},{c[2]:.3f}) off-shell max {d.max()*1000:5.1f} mm mean {d.mean()*1000:4.1f}")
os._exit(0)
