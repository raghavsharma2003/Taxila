"""r8 turn fit view: rig yaw -20 | painted key L (normalised into c-front's frame) | rig yaw +20 | key R, same crop.
    python3 turncmp.py <posedir> <out.jpg>   (posedir holds yaw_m20.png, yaw_p20.png at 1024, view 0,0,1024)"""
import sys, json
from PIL import Image
K = "art/character/puppet2d/polish-r10/keys/"
g = json.load(open("art/character/puppet2d/polish-r10/pack/geom.json"))["yawKeys"]["norm"]
def normkey(f, n):
    im = Image.open(K + f).convert("RGB"); s = n["s"]
    return im.transform((1024, 1024), Image.AFFINE, (1 / s, 0, n["kcx"] - n["fcx"] / s, 0, 1 / s, n["ke"] - n["fe"] / s), Image.BICUBIC)
d, out = sys.argv[1], sys.argv[2]
c = (290, 300, 810, 760)
row = [Image.open(d + "/yaw_m20.png").convert("RGB"), normkey("yawL30-0.png", g["L"]), Image.open(d + "/yaw_p20.png").convert("RGB"), normkey("yawR30-0.png", g["R"])]
W = c[2] - c[0]
M = Image.new("RGB", (W * 4, c[3] - c[1]))
for i, im in enumerate(row): M.paste(im.crop(c), (i * W, 0))
M.save(out, quality=88); print(out)
