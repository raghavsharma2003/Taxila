"""r6 gate for fix 1 (judge r5: the shoulder tear): a dark-pixel saw-tooth scan of the shoulder region under the bun,
on EVERY frame of a review clip. Must find zero runs.

Region: rest space x 588-735, y 700-815 (right shoulder, collar, bun bottom, neck edge; the locks and the earring wisp
start at x 736), mapped to screen with the clip's camera (view x0,y0,w at px). Hair-dark = max(rgb) < 95,
max-min < 45 and warm (G, B at most R + 6): the teal kurta, its dark top contour, the collar and the neck skin fail it.
A "saw-tooth run" is a thin dark structure: the hair-dark mask minus its morphological opening with a disk of radius
5 px (a smooth convex mass such as the bun's bottom survives an opening; a 9-12 px strip and a jagged fringe do not),
counted as connected pieces of >= 20 px that do not touch the region border. Positive control: the r5 clip.

v2 (the gate; v1 kept as a diagnostic). v1 also fired on 236 frames of the r6 i1 clip where, inspected at 3x, nothing tore:
the opening flags the bun's smooth feathered tip where it tapers between the kurta and the neck. The strip's own signature
is geometric: scanning DOWN a column it is cream backdrop, then a dark run of 2-14 px, then kurta or cream again (a band
lying on the shoulder with backdrop above it; the bun's mass and its taper never have backdrop directly above). A run =
>= 4 adjacent such columns. Positive control again: the r5 clip (and its 7.43 s / 30.5 s frames, seen by eye).
    python3 scripts/character/puppet2d/polish-r9/teargate.py <clip.mp4> [px=1024] [view=60,8,904] [out.json]
"""
import json
import subprocess
import sys
import numpy as np
from scipy import ndimage as ndi

clip = sys.argv[1]
px = int(sys.argv[2]) if len(sys.argv) > 2 else 1024
view = [float(v) for v in (sys.argv[3] if len(sys.argv) > 3 else "60,8,904").split(",")]
out = sys.argv[4] if len(sys.argv) > 4 else None
s = px / view[2]
X0, Y0, X1, Y1 = [int(round(v)) for v in ((588 - view[0]) * s, (700 - view[1]) * s, (735 - view[0]) * s, (815 - view[1]) * s)]
X1, Y1 = min(X1, px), min(Y1, px)
X0 -= X0 % 2; Y0 -= Y0 % 2
w, h = (X1 - X0) // 2 * 2, (Y1 - Y0) // 2 * 2   # even: yuv420 crops round odd sizes
r = 5
disk = np.hypot(*np.mgrid[-r:r + 1, -r:r + 1]) <= r
cmd = ["ffmpeg", "-loglevel", "error", "-i", clip, "-vf", f"crop={w}:{h}:{X0}:{Y0}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
p = subprocess.Popen(cmd, stdout=subprocess.PIPE)
fr, hits, hits2 = 0, [], []
fps = 30.0
while True:
    buf = p.stdout.read(w * h * 3)
    if len(buf) < w * h * 3:
        break
    im = np.frombuffer(buf, np.uint8).reshape(h, w, 3).astype(np.int16)
    mx, mn = im.max(-1), im.min(-1)
    # hair-dark: dark AND warm (G, B at most R + 6; bun pixels measure G-R -4..-7, the kurta contour +18..+30); the kurta's dark-teal top contour (34,84,83) failed v1's test
    D = (mx < 95) & (mx - mn < 45) & (im[..., 1] - im[..., 0] < 6) & (im[..., 2] - im[..., 0] < 6)
    # v2: cream-above / thin-dark / kurta-or-cream-below column sequences
    cream = (im[..., 0] > 215) & (im[..., 1] > 195) & (im[..., 2] > 150) & (mx - mn < 90)
    teal = (im[..., 2] > im[..., 0] + 25) & (im[..., 1] > im[..., 0] + 25)
    colhit = np.zeros(w, bool)
    for c in range(w):
        d = D[:, c]
        if not d.any():
            continue
        y = 0
        while y < h:
            if d[y]:
                y1 = y
                while y1 < h and d[y1]:
                    y1 += 1
                L = y1 - y
                if 2 <= L <= 14 and y >= 3 and y1 <= h - 3 and cream[max(0, y - 3):y, c].any() and (teal[y1:y1 + 3, c].any() or cream[y1:y1 + 3, c].any()):
                    colhit[c] = True
                y = y1
            else:
                y += 1
    runs2 = []
    c = 0
    while c < w:
        if colhit[c]:
            c1 = c
            while c1 < w and colhit[c1]:
                c1 += 1
            if c1 - c >= 4:
                runs2.append({"x0": int(X0 + c), "x1": int(X0 + c1 - 1)})
            c = c1
        else:
            c += 1
    if runs2:
        hits2.append({"frame": fr, "t": round(fr / fps, 2), "runs": runs2})
    if D.any():
        op = ndi.binary_opening(np.pad(D, r + 1, mode="edge"), structure=disk)[r + 1:-r - 1, r + 1:-r - 1]
        thin = D & ~op
        lab, n = ndi.label(thin, structure=np.ones((3, 3)))
        runs = []
        for k in range(1, n + 1):
            ys, xs = np.where(lab == k)
            if len(ys) < 20:
                continue
            if ys.min() <= 1 or xs.min() <= 1 or ys.max() >= h - 2 or xs.max() >= w - 2:
                continue
            runs.append({"px": int(len(ys)), "x": int(X0 + xs.mean()), "y": int(Y0 + ys.mean()), "wid": int(xs.max() - xs.min() + 1)})
        if runs:
            hits.append({"frame": fr, "t": round(fr / fps, 2), "runs": runs})
    fr += 1
p.wait()
res = {"clip": clip, "frames": fr, "region_screen": [X0, Y0, X1, Y1],
       "v2_frames_with_runs": len(hits2), "v2_runs": sum(len(hh["runs"]) for hh in hits2), "v2_seconds": sorted(set(round(hh["t"]) for hh in hits2)),
       "v1_frames_with_thin_pieces": len(hits), "v1_pieces": sum(len(hh["runs"]) for hh in hits),
       "first_v2": hits2[:6], "first_v1": hits[:4], "pass": len(hits2) == 0 and fr > 0}
print(json.dumps({k: v for k, v in res.items() if not k.startswith("first")}), "\nfirst v2 hits:", json.dumps(hits2[:3]))
if out:
    json.dump(res, open(out, "w"), indent=1)
