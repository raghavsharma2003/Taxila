"""Crops of the chin/neck/bun junction and both locks across the yaw/pitch poses (full size, 2x zoom)."""
import sys
from PIL import Image
P = "art/character/puppet2d/polish-r2/work/poses"
names = sys.argv[2].split(",")
box = tuple(map(int, sys.argv[3].split(","))) if len(sys.argv) > 3 else (260, 420, 820, 780)
w, h = box[2] - box[0], box[3] - box[1]
W = Image.new("RGB", (w * len(names), h), "white")
for i, n in enumerate(names):
    W.paste(Image.open(f"{P}/{n}.png").convert("RGB").crop(box), (i * w, 0))
W.save(sys.argv[1])
