"""r8 quick compare: labelled head crops of pose renders (dir/name.png) side by side, optional reference first.
    python3 cmp.py out.jpg [--ref path] [--crop x0,y0,x1,y1] [--s 512] dir/name1.png dir/name2.png ..."""
import sys
from PIL import Image, ImageDraw
args = sys.argv[1:]
out = args.pop(0)
ref, crop, S = None, (165, 40, 885, 760), 512
files = []
while args:
    a = args.pop(0)
    if a == "--ref": ref = args.pop(0)
    elif a == "--crop": crop = tuple(map(int, args.pop(0).split(",")))
    elif a == "--s": S = int(args.pop(0))
    else: files.append(a)
cells = ([("REF", ref)] if ref else []) + [(f.split("/")[-2] + "/" + f.split("/")[-1][:-4], f) for f in files]
cols = min(4, len(cells)); rows = (len(cells) + cols - 1) // cols
H = int(S * (crop[3] - crop[1]) / (crop[2] - crop[0]))
M = Image.new("RGB", (S * cols, (H + 18) * rows), (250, 240, 225))
d = ImageDraw.Draw(M)
for i, (l, p) in enumerate(cells):
    im = Image.open(p).convert("RGB")
    c = crop if im.size[0] == 1024 else (0, 0) + im.size
    im = im.crop(c).resize((S, H), Image.LANCZOS)
    x, y = (i % cols) * S, (i // cols) * (H + 18)
    M.paste(im, (x, y + 18)); d.text((x + 4, y + 3), l, fill=(60, 40, 30))
M.save(out, quality=90); print(out, M.size)
