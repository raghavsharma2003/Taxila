"""Crop a region of a 1024 front, scale it, and draw a labelled px grid (for reading landmarks by eye, as r3-r8 did).
    python3 -I gridcrop.py <img> <out> x0 y0 x1 y1 [scale] [step]"""
import sys
from PIL import Image, ImageDraw
src, out, x0, y0, x1, y1 = sys.argv[1], sys.argv[2], *map(int, sys.argv[3:7])
sc = float(sys.argv[7]) if len(sys.argv) > 7 else 2.0
st = int(sys.argv[8]) if len(sys.argv) > 8 else 20
im = Image.open(src).convert("RGB").crop((x0, y0, x1, y1))
im = im.resize((int((x1 - x0) * sc), int((y1 - y0) * sc)), Image.NEAREST if sc >= 3 else Image.LANCZOS)
d = ImageDraw.Draw(im)
for x in range((x0 // st + 1) * st, x1, st):
    X = (x - x0) * sc; d.line([(X, 0), (X, im.height)], fill=(0, 255, 255) if x % 100 else (255, 0, 255), width=1)
    if x % (st * 2) == 0: d.text((X + 2, 2), str(x), fill=(255, 255, 255))
for y in range((y0 // st + 1) * st, y1, st):
    Y = (y - y0) * sc; d.line([(0, Y), (im.width, Y)], fill=(0, 255, 255) if y % 100 else (255, 0, 255), width=1)
    if y % (st * 2) == 0: d.text((2, Y + 2), str(y), fill=(255, 255, 255))
im.save(out)
