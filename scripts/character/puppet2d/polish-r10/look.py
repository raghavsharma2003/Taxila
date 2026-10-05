"""r10 viewing helper: crops the same box from several images side by side, scaled.
    python3 look.py <out.png> <x0,y0,x1,y1> <scale> img1 img2 ...  (label = basename; 'NN:' prefix = nearest resample)"""
import sys, os
from PIL import Image, ImageDraw
out, box, sc = sys.argv[1], tuple(int(v) for v in sys.argv[2].split(",")), float(sys.argv[3])
ims = sys.argv[4:]
w, h = int((box[2]-box[0])*sc), int((box[3]-box[1])*sc)
cols = min(len(ims), int(os.environ.get("COLS", "4")))
rows = (len(ims)+cols-1)//cols
M = Image.new("RGB", (w*cols, (h+16)*rows), (30,30,30)); d = ImageDraw.Draw(M)
for i, p in enumerate(ims):
    nn = p.startswith("NN:"); p = p[3:] if nn else p
    im = Image.open(p).convert("RGB")
    if im.size != (1024,1024): im = im.resize((1024,1024), Image.LANCZOS)
    im = im.crop(box).resize((w,h), Image.NEAREST if nn else Image.LANCZOS)
    x, y = (i%cols)*w, (i//cols)*(h+16)
    M.paste(im, (x, y+16)); d.text((x+3,y+2), os.path.basename(p), fill=(255,255,255))
M.save(out); print(out, M.size)
