"""r9 relight A/B: [rig rel=0 | rig rel=1 | painted key] for yaw +20 (row 1) and -20 (row 2), same crop.
    python3 relcmp.py <dir_off> <dir_on> <out.jpg>"""
import sys, json
from PIL import Image
K = "art/character/puppet2d/polish-r10/keys/"
g = json.load(open("art/character/puppet2d/polish-r10/pack/geom.json"))["yawKeys"]["norm"]
def normkey(f, n):
    im = Image.open(K + f).convert("RGB"); s = n["s"]
    return im.transform((1024, 1024), Image.AFFINE, (1 / s, 0, n["kcx"] - n["fcx"] / s, 0, 1 / s, n["ke"] - n["fe"] / s), Image.BICUBIC)
a, b, out = sys.argv[1:4]
c = (300, 320, 800, 740); W, H = c[2] - c[0], c[3] - c[1]
M = Image.new("RGB", (W * 3, H * 2))
for r, (p, k, sd) in enumerate([("yaw_p20", "yawR30-0.png", "R"), ("yaw_m20", "yawL30-0.png", "L")]):
    for i, im in enumerate([Image.open(f"{a}/{p}.png"), Image.open(f"{b}/{p}.png"), normkey(k, g[sd])]):
        M.paste(im.convert("RGB").crop(c), (i * W, r * H))
M.save(out, quality=90); print(out)
