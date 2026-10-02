#!/usr/bin/env python3
"""Graphics-review probe for tutor-selection-ux.md section 10 (2026-10-02).

Question: is the "real character is 2-3x the flat proxy" assumption safe, and what does the preview cost at the
resolution the enlarged picker tile actually displays (DPR 2 phones)?

Arms (all 6 s, 24 fps, libx264, yuv420p, -tune animation off, no B-frames for baseline):
  P0  doc proxy rebuilt: QA-sheet cells cycled at 8 fps (frame-held) + gentle drift, flat grey bg
  P1  continuous: cells cross-faded every frame (no held frames), blink every ~3 s, head drift + small rotation
  P2  P1 + a static high-frequency texture layer moving rigidly with the head (stand-in for hair cards, fabric
      weave, skin pores) + a soft-gradient background. This is a stress proxy, not a character.
Each arm encoded at 320^2 and 512^2, CRF 30 and 26, profile baseline and main.

Run: python3 docs/research/avatar/selection-proto/preview-size-probe.py  (needs ffmpeg with libx264, Pillow, numpy)
Writes only to the scratch dir given by $PROBE_OUT (default ./_probe_out, deleted afterwards unless KEEP=1).
"""
import os, subprocess, shutil, json, math
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SHEET = os.path.join(HERE, "..", "character-pipeline-proto", "results", "qa_sheet.png")
OUT = os.environ.get("PROBE_OUT", os.path.join(HERE, "_probe_out"))
os.makedirs(OUT, exist_ok=True)
FPS, DUR = 24, 6
N = FPS * DUR
rng = np.random.default_rng(7)

sheet = Image.open(SHEET).convert("RGB")
def cell(ix, iy):
    return np.asarray(sheet.crop((ix * 240, iy * 240 + 16, ix * 240 + 240, iy * 240 + 240)).resize((240, 240)), dtype=np.float32)
C = {"neutral": cell(0, 0), "jaw": cell(1, 0), "blink": cell(2, 0), "smile": cell(3, 0),
     "PP": cell(0, 1), "aa": cell(1, 1), "U": cell(2, 1), "FF": cell(3, 1)}
seq = ["neutral", "aa", "PP", "U", "FF", "jaw", "aa", "smile", "PP", "neutral", "U", "aa"]

# high-frequency rigid texture (pseudo hair/fabric): band-limited noise + fine stripes, alpha-masked to edges
tex = rng.normal(0, 1, (240, 240)).astype(np.float32)
tex = (tex + np.roll(tex, 1, 0) + np.roll(tex, 1, 1)) / 3
yy, xx = np.mgrid[0:240, 0:240]
stripes = 0.5 * np.sin(xx * 1.3 + yy * 0.4)
mask = np.clip((np.abs(xx - 120) - 70) / 30, 0, 1) + np.clip((40 - yy) / 30, 0, 1)  # sides + top = "hair"
mask = np.clip(mask, 0, 1)
hf = ((tex * 28 + stripes * 18) * mask)[..., None]

def frame(i, arm, size):
    t = i / FPS
    if arm == "P0":
        k = int(t * 8) % len(seq); img = C[seq[k]].copy()
    else:
        u = t * 8; k = int(u) % len(seq); f = u - int(u)
        img = (1 - f) * C[seq[k]] + f * C[seq[(k + 1) % len(seq)]]
        bp = (t % 3.1)
        if bp < 0.25:
            w = math.sin(math.pi * bp / 0.25); img = (1 - w) * img + w * C["blink"]
    if arm == "P2":
        img = np.clip(img + hf, 0, 255)
    im = Image.fromarray(img.astype(np.uint8))
    ang = 0 if arm == "P0" else 2.0 * math.sin(t * 1.1)
    dx, dy = 6 * math.sin(t * 0.7), 4 * math.sin(t * 0.9 + 1)
    bg = Image.new("RGB", (300, 300), (128, 128, 128))
    if arm == "P2":
        g = np.linspace(150, 210, 300, dtype=np.float32)
        bg = Image.fromarray(np.dstack([g[:, None].repeat(300, 1), (g * 0.9)[:, None].repeat(300, 1), (g * 0.8)[:, None].repeat(300, 1)]).astype(np.uint8))
    im = im.rotate(ang, resample=Image.BICUBIC, fillcolor=(128, 128, 128))
    bg.paste(im, (30 + int(round(dx)), 30 + int(round(dy))))
    return bg.resize((size, size), Image.BICUBIC)

def encode(arm, size, crf, profile):
    path = os.path.join(OUT, f"{arm}_{size}_crf{crf}_{profile}.mp4")
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{size}x{size}",
           "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", str(crf), "-profile:v", profile,
           "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", path]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for i in range(N):
        p.stdin.write(np.asarray(frame(i, arm, size)).tobytes())
    p.stdin.close(); p.wait()
    return os.path.getsize(path)

res = {}
for arm in ["P0", "P1", "P2"]:
    for size in [320, 512]:
        for crf in [30, 26]:
            for prof in ["baseline", "main"]:
                b = encode(arm, size, crf, prof)
                res[f"{arm} {size} crf{crf} {prof}"] = round(b / 1000, 1)
                print(f"{arm} {size}^2 crf{crf} {prof:8s} {b/1000:7.1f} kB")
json.dump(res, open(os.path.join(HERE, "preview-size-probe.json"), "w"), indent=1)
if os.environ.get("KEEP") != "1":
    shutil.rmtree(OUT)
