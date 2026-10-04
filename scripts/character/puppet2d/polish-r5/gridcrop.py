"""Gridded zoom crop for reading coordinates by eye: gridcrop.py <img> <x0,y0,x1,y1> <scale> <step> <out>"""
import sys
from PIL import Image, ImageDraw
src, box, sc, step, out = sys.argv[1], tuple(map(int, sys.argv[2].split(","))), float(sys.argv[3]), int(sys.argv[4]), sys.argv[5]
im = Image.open(src).convert("RGB").crop(box)
im = im.resize((int(im.width * sc), int(im.height * sc)), Image.LANCZOS)
d = ImageDraw.Draw(im)
x0, y0 = box[0], box[1]
for x in range((x0 // step + 1) * step, box[2], step):
    X = (x - x0) * sc
    d.line([(X, 0), (X, im.height)], fill=(255, 0, 0) if x % (step * 4) == 0 else (0, 255, 255), width=1)
    if x % (step * 2) == 0: d.text((X + 2, 2), str(x), fill=(255, 255, 255))
for y in range((y0 // step + 1) * step, box[3], step):
    Y = (y - y0) * sc
    d.line([(0, Y), (im.width, Y)], fill=(255, 0, 0) if y % (step * 4) == 0 else (0, 255, 255), width=1)
    if y % (step * 2) == 0: d.text((2, Y + 2), str(y), fill=(255, 255, 255))
im.save(out)
