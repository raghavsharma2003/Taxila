"""r10: images side by side (c-front frame), cropped, with a 50 px grid (x labels) for by-eye fitting.
    python3 gridcmp.py <out> <x0,y0,x1,y1> img...  """
import sys
from PIL import Image, ImageDraw
out, box, ims = sys.argv[1], [int(v) for v in sys.argv[2].split(",")], sys.argv[3:]
w, h = box[2] - box[0], box[3] - box[1]
M = Image.new("RGB", (w * len(ims), h + 14), (30, 30, 30)); D = ImageDraw.Draw(M)
for i, p in enumerate(ims):
    im = Image.open(p).convert("RGB")
    if im.size != (1024, 1024): im = im.resize((1024, 1024))
    im = im.crop(box); d = ImageDraw.Draw(im)
    for x in range((box[0] // 50 + 1) * 50, box[2], 50): d.line([(x - box[0], 0), (x - box[0], h)], fill=(0, 170, 255) if x % 100 == 0 else (140, 210, 255))
    for y in range((box[1] // 50 + 1) * 50, box[3], 50): d.line([(0, y - box[1]), (w, y - box[1])], fill=(255, 120, 120))
    M.paste(im, (i * w, 14))
    for x in range((box[0] // 100 + 1) * 100, box[2], 100): D.text((i * w + x - box[0] - 8, 1), str(x), fill=(255, 255, 255))
M.save(out); print(out)
