"""r9 A/B zoom: rows = poses, cols = the given work dirs, crop c (rest px at 1024). python3 abz.py out.jpg x0,y0,x1,y1 scale pose1,pose2 dir1 dir2 ..."""
import sys
from PIL import Image
out, c, sc, poses, dirs = sys.argv[1], tuple(map(int, sys.argv[2].split(","))), float(sys.argv[3]), sys.argv[4].split(","), sys.argv[5:]
W, H = int((c[2] - c[0]) * sc), int((c[3] - c[1]) * sc)
M = Image.new("RGB", (W * len(dirs), H * len(poses)))
for r, p in enumerate(poses):
    for i, d in enumerate(dirs):
        M.paste(Image.open(f"{d}/{p}.png").convert("RGB").crop(c).resize((W, H), Image.LANCZOS), (i * W, r * H))
M.save(out, quality=90); print(out, M.size)
