"""r7 gate for fix 1 (judge r6: the forehead hair spike), run like teargate on EVERY frame of a review clip. Must be 0.

Region: the forehead band between the hairline and the brows, rest space x 300-760, y 290-410 (both brows down to their lowest point, both temples,
the parting), mapped to screen with the clip's camera (view x0,y0,w at px) and padded 16 px for head motion (i2 used y <= 425 + 24 px and caught the eyeliner wing tips on surprise).
Hair-dark = max(rgb) < 95, max-min < 45, warm (G, B at most R + 6), as teargate. A SPIKE is a dark run of >= 3 px that is
not part of a smooth mass: the hair-dark mask minus its morphological opening with a disk of radius 4 px (the hair shell
and the brows, 16+ px thick with rounded ends, survive the opening; a shard, wisp tip or jagged fringe does not), kept
where the dark mask is >= 3 px thick there (distance transform >= 1.5: the anti-aliased stair of a smooth edge is 1-2 px
and is ignored), as connected pieces of >= 12 px that do not touch the region border and that hang off the hair shell (touch the
largest opened dark mass in the band, dilated 2 px; eyeliner wings and the brows' ends are separate masses).
Positive control: the r6 clip (spike in every delight and surprise, judge-r6/zoom-wisp.png).
The brows are excluded with a brow-only render of the same timeline (maskpass.sh: brows over pure green), as the gate
asks for dark runs BETWEEN the hairline and the brows, not the brows themselves.
    python3 scripts/character/puppet2d/polish-r9/hairgate.py <clip.mp4> [px=1024] [view=60,8,904] [out.json] [dumpdir|-] [mask.mp4]
"""
import json
import os
import subprocess
import sys
import numpy as np
from scipy import ndimage as ndi
from PIL import Image

clip = sys.argv[1]
px = int(sys.argv[2]) if len(sys.argv) > 2 else 1024
view = [float(v) for v in (sys.argv[3] if len(sys.argv) > 3 else "60,8,904").split(",")]
out = sys.argv[4] if len(sys.argv) > 4 else None
dump = sys.argv[5] if len(sys.argv) > 5 and sys.argv[5] != '-' else None
maskclip = sys.argv[6] if len(sys.argv) > 6 else None
s = px / view[2]
pad = 16
X0, Y0, X1, Y1 = [int(round(v)) for v in ((300 - view[0]) * s - pad, (290 - view[1]) * s - pad, (760 - view[0]) * s + pad, (410 - view[1]) * s + pad)]
X0, Y0 = max(0, X0), max(0, Y0)
X1, Y1 = min(X1, px), min(Y1, px)
X0 -= X0 % 2; Y0 -= Y0 % 2
w, h = (X1 - X0) // 2 * 2, (Y1 - Y0) // 2 * 2
r = 4
disk = np.hypot(*np.mgrid[-r:r + 1, -r:r + 1]) <= r
SS, TT = os.environ.get("HG_SS"), os.environ.get("HG_T")
cmd = ["ffmpeg", "-nostdin", "-loglevel", "error"] + (["-ss", SS] if SS else []) + ["-i", clip] + (["-t", TT] if TT else []) + [ "-vf", f"crop={w}:{h}:{X0}:{Y0}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stdin=subprocess.DEVNULL)
pm = subprocess.Popen([c if c != clip else maskclip for c in cmd], stdout=subprocess.PIPE, stdin=subprocess.DEVNULL) if maskclip else None
fr, hits = 0, []
fps = 30.0
if dump:
    os.makedirs(dump, exist_ok=True)
while True:
    buf = p.stdout.read(w * h * 3)
    if len(buf) < w * h * 3:
        break
    im = np.frombuffer(buf, np.uint8).reshape(h, w, 3).astype(np.int16)
    brow = None
    if pm:
        mb = pm.stdout.read(w * h * 3)
        if len(mb) == w * h * 3:
            mk = np.frombuffer(mb, np.uint8).reshape(h, w, 3).astype(np.int16)
            brow = ndi.binary_dilation(~((mk[..., 1] > 180) & (mk[..., 0] < 90) & (mk[..., 2] < 90)), iterations=3)
    mx, mn = im.max(-1), im.min(-1)
    D = (mx < 95) & (mx - mn < 45) & (im[..., 1] - im[..., 0] < 6) & (im[..., 2] - im[..., 0] < 6)
    if D.any():
        op = ndi.binary_opening(np.pad(D, r + 1, mode="edge"), structure=disk)[r + 1:-r - 1, r + 1:-r - 1]
        dt = ndi.distance_transform_edt(D)
        thin = D & ~op
        # the hair shell = the largest smooth dark mass in the band; a spike hangs OFF it (eyeliner wings, lashes and the
        # brows' own ends are separate masses and are not counted)
        ol, on = ndi.label(op)
        shell = np.zeros_like(D)
        if on:
            sz = ndi.sum(op, ol, range(1, on + 1))
            shell = ol == (1 + int(np.argmax(sz)))
        near = ndi.binary_dilation(shell, iterations=2)
        lab, n = ndi.label(thin, structure=np.ones((3, 3)))
        runs = []
        for k in range(1, n + 1):
            m = lab == k
            ys, xs = np.where(m)
            if len(ys) < 12:
                continue
            if ys.min() <= 1 or xs.min() <= 1 or ys.max() >= h - 2 or xs.max() >= w - 2:
                continue
            if not (m & near).any():
                continue
            # r7: the brows are not the hair. A raised brow's outer tail tucking under the temple hairline makes a dark
            # wedge where the two meet; pieces on the brow (from the brow-only mask pass of the same timeline) are skipped
            if brow is not None and (m & brow).sum() > 0.3 * m.sum():
                continue
            thick = float(dt[m].max()) * 2
            if thick < 3:
                continue
            core = m & (dt >= 1.5)
            cp = im[core]
            rb = float((cp[:, 0] - cp[:, 2]).mean()) if len(cp) else 99.0
            runs.append({"px": int(len(ys)), "x": int(X0 + xs.mean()), "y": int(Y0 + ys.mean()), "thick": round(thick, 1), "rb": round(rb, 1)})
        if runs:
            hits.append({"frame": fr, "t": round(fr / fps, 2), "runs": runs})
            if dump and len(hits) % 15 == 1:
                Image.fromarray(im.astype(np.uint8)).save(f"{dump}/hit-{fr:05d}.png")
    fr += 1
p.wait()
if pm:
    pm.kill()   # the mask pass can hold a frame or two more than the clip encode (-t 45.2)
res = {"clip": clip, "frames": fr, "region_screen": [X0, Y0, X0 + w, Y0 + h], "frames_with_spikes": len(hits),
       "spikes": sum(len(hh["runs"]) for hh in hits), "seconds": sorted(set(round(hh["t"]) for hh in hits)),
       "first": hits[:8], "all": [[hh["t"], [[r["x"], r["y"], r["px"]] for r in hh["runs"]]] for hh in hits], "pass": len(hits) == 0 and fr > 0}
print(json.dumps({k: v for k, v in res.items() if k not in ("first", "all")}), "\nfirst:", json.dumps(hits[:3]))
if out:
    json.dump(res, open(out, "w"), indent=1)
