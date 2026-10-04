#!/usr/bin/env python3
"""Procedural eye texture for the style C eyeball (ours; no source image). Planar front projection of the eyeball:
u = 0.5 + x / 2r, v = 0.5 + z / 2r. Iris radius 0.53 r (c-front: the iris nearly fills the opening height), pupil 0.22 r,
dark limbus ring, warm radial gradient lighter at the bottom, faint radial fibres, warm off-white sclera.
    python iris.py OUT.png [--size 256]
"""
import sys
import numpy as np
from PIL import Image

out = sys.argv[1]
N = int(sys.argv[sys.argv.index("--size") + 1]) if "--size" in sys.argv else 256
y, x = np.mgrid[0:N, 0:N]
u = (x + 0.5) / N * 2 - 1           # -1..1 = -r..r
v = 1 - (y + 0.5) / N * 2           # image row 0 = top (+z)
r = np.hypot(u, v)
th = np.arctan2(v, u)
RI, RP = 0.53, 0.22
rng = np.random.default_rng(7)
sclera = np.array([238, 230, 220], float)
c_out = np.array([62, 32, 16], float)
c_mid = np.array([118, 64, 30], float)
c_glow = np.array([164, 96, 46], float)
limbus = np.array([30, 16, 9], float)
pupil = np.array([12, 7, 6], float)
t = np.clip((r - RP) / (RI - RP), 0, 1)                    # 0 at pupil edge, 1 at limbus
base = c_mid[None, None] * (1 - t[..., None]) + c_out[None, None] * t[..., None]
glow = np.clip(-v / RI, 0, 1) ** 1.3 * np.clip(1 - np.abs(t - 0.45) * 2.2, 0, 1)       # warm lower crescent
base = base * (1 - glow[..., None] * 0.7) + c_glow * glow[..., None] * 0.7
k = 48
fib = sum(np.cos(th * f + ph) * a for f, ph, a in zip(rng.integers(20, 90, k), rng.uniform(0, 6.3, k), rng.uniform(0.2, 1, k))) / k
base = base * (1 + 0.10 * fib[..., None] * (t[..., None] > 0))
lim = np.clip((r - (RI - 0.07)) / 0.07, 0, 1) ** 1.5
base = base * (1 - lim[..., None]) + limbus * lim[..., None]
img = np.where((r < RI)[..., None], base, sclera)
aa = np.clip((RI - r) / 0.012 + 0.5, 0, 1)[..., None]                                   # antialiased limbus edge
img = img * aa + sclera * (1 - aa)
pa = np.clip((RP - r) / 0.012 + 0.5, 0, 1)[..., None]
img = img * (1 - pa) + pupil * pa
shade = np.clip((r - 0.75) / 0.35, 0, 1)[..., None]                                       # sclera darkens toward the edge
img = img * (1 - 0.12 * shade)
Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).save(out)
print(out, N)
