"""Map the rig front and its registered edits into RIG SPACE: crop (162, 0)-(862, 700) of the 1024 front, scaled to
1024 x 1024 (x 1.4629, Lanczos). Her face half-width becomes ~208 px, c-front's, so the r8 runtime's motion magnitudes
start at the right scale (face.js k ~ 1). Flat colour upscales cleanly at this factor.
    python3 -I rigspace.py"""
import os
from PIL import Image
S = "/tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/r4-asha"
X0, Y0, SZ = 162, 0, 700
os.makedirs(f"{S}/rs", exist_ok=True)
front = open(f"{S}/rig-pick.txt").read().strip()
src = {"front": f"{S}/raw/{front}.png"}
for f in ["x-speak", "x-listen", "x-think", "x-warm", "x-blink", "x-mid"]:
    src[f[2:]] = f"{S}/reg/{f}.png"
for f in ["x-yawL", "x-yawR"]:
    src[f[2:]] = f"{S}/raw/{f}.png"     # the turn keys stay unregistered (keyfield normalises them by landmarks)
for k, p in src.items():
    Image.open(p).convert("RGB").crop((X0, Y0, X0 + SZ, Y0 + SZ)).resize((1024, 1024), Image.LANCZOS).save(f"{S}/rs/{k}.png")
    print(k)
